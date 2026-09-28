/**
 * 파일의 실제 형식을 앞부분 바이트로 판별한다.
 *
 * 파일 이름의 확장자나 브라우저가 알려주는 형식은 믿을 수 없다.
 * "shirt.png"라는 이름이어도 실제로는 WebP나 HEIC일 수 있고,
 * 로블록스는 이름이 아니라 실제 내용으로 판단한다.
 */

export type ImageFormat = "png" | "jpeg" | "other";

export async function detectFormat(file: File): Promise<ImageFormat> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  const isPng =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47;
  if (isPng) return "png";

  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (isJpeg) return "jpeg";

  return "other";
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 그림을 열지 않고 파일 앞부분만 읽어서 가로세로 크기를 알아낸다.
 *
 * 그림을 통째로 열면 가로 × 세로 × 4바이트만큼 메모리를 쓴다.
 * 휴대폰의 고화질 사진은 이것만으로 오래된 기기를 멈추게 할 수 있어서,
 * 열기 전에 크기부터 확인한다. PNG, JPG, WebP는 파일 머리에 크기가 적혀 있다.
 *
 * 알아내지 못하면 null을 돌려주고, 그때는 파일 용량 기준만으로 판단한다.
 */
export async function readDimensions(file: File): Promise<ImageDimensions | null> {
  // JPG는 사진 정보(EXIF) 뒤에 크기가 나와서 조금 넉넉히 읽는다
  const head = new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer());
  return pngSize(head) ?? jpegSize(head) ?? webpSize(head);
}

function u16be(b: Uint8Array, i: number) {
  return (b[i] << 8) | b[i + 1];
}

function u32be(b: Uint8Array, i: number) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
}

/** PNG: 서명 8바이트 뒤 IHDR 조각에 가로(16번째)와 세로(20번째)가 있다 */
function pngSize(b: Uint8Array): ImageDimensions | null {
  const isPng = b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (!isPng) return null;
  return { width: u32be(b, 16), height: u32be(b, 20) };
}

/** JPG: 조각들을 건너뛰며 크기가 적힌 SOF 조각을 찾는다 */
function jpegSize(b: Uint8Array): ImageDimensions | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;

  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    // 0xFF가 연속되는 채움 바이트는 건너뛴다
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // SOF0~SOF15 중 크기를 담는 것들 (C4, C8, CC는 다른 용도)
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    const length = u16be(b, i + 2);
    if (length < 2) return null;
    i += 2 + length;
  }
  return null;
}

/** WebP: 압축 방식(VP8, VP8L, VP8X)마다 크기가 적힌 자리가 다르다 */
function webpSize(b: Uint8Array): ImageDimensions | null {
  const tag = (i: number) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
  if (b.length < 30 || tag(0) !== "RIFF" || tag(8) !== "WEBP") return null;

  const chunk = tag(12);
  if (chunk === "VP8X") {
    return {
      width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
      height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
    };
  }
  if (chunk === "VP8L") {
    const b0 = b[21], b1 = b[22], b2 = b[23], b3 = b[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === "VP8 ") {
    return {
      width: (b[26] | (b[27] << 8)) & 0x3fff,
      height: (b[28] | (b[29] << 8)) & 0x3fff,
    };
  }
  return null;
}
