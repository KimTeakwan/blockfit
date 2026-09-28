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
