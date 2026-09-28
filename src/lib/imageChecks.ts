import {
  ClothingKind,
  PANELS,
  Panel,
  TEMPLATE_SIZE,
  TSHIRT_MIN_SHARP,
  TSHIRT_RECOMMENDED,
  findPanel,
} from "@/config/clothing";
import { ImageFormat } from "@/lib/fileSignature";

/**
 * 업로드 전 검사.
 *
 * 원칙 1: 공식 규정보다 엄격하게 굴지 않는다.
 *   공식 문서가 허용하는 것(예: JPG)을 "문제"로 표시하면
 *   멀쩡한 파일을 두고 사용자가 불필요하게 고치게 된다.
 *   확실히 잘못된 것만 "문제", 결과가 의도와 다를 수 있는 것은 "주의"로 둔다.
 *
 * 원칙 2: 초등학생이 읽어도 알 수 있게 쓴다.
 *   사용자 상당수가 어리다. "템플릿", "패널", "알파" 같은 말 대신
 *   "옷 본", "칸", "비어 있는 곳"을 쓰고, 무엇이 문제인지와 함께
 *   어떻게 고치는지를 순서대로 알려준다.
 *
 * 이 파일은 화면에 의존하지 않는 순수 함수로 유지한다.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckResult {
  id: string;
  status: CheckStatus;
  title: string;
  detail?: string;
  /** 고치는 방법. 순서대로 따라 할 수 있게 단계별로 쓴다 */
  fix?: string[];
}

export interface DecodedImage {
  width: number;
  height: number;
  bitmap: ImageBitmap;
  /** 아주 큰 이미지는 메모리를 아끼려고 픽셀 분석을 건너뛰므로 없을 수 있다 */
  pixels: ImageData | null;
}

const MAX_ANALYZE_PIXELS = 16_000_000;

export async function decodeImage(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file, {
    premultiplyAlpha: "none",
    colorSpaceConversion: "none",
  });
  const { width, height } = bitmap;

  let pixels: ImageData | null = null;
  if (width * height <= MAX_ANALYZE_PIXELS) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
      pixels = ctx.getImageData(0, 0, width, height);
    }
  }

  return { width, height, bitmap, pixels };
}

interface AlphaStats {
  total: number;
  transparent: number;
}

/** 지정한 영역(없으면 전체)에서 완전히 투명한 픽셀 수를 센다 */
function alphaStats(pixels: ImageData, rect?: Panel): AlphaStats {
  const x0 = rect ? rect.x : 0;
  const y0 = rect ? rect.y : 0;
  const x1 = rect ? Math.min(rect.x + rect.w, pixels.width) : pixels.width;
  const y1 = rect ? Math.min(rect.y + rect.h, pixels.height) : pixels.height;

  let total = 0;
  let transparent = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      total++;
      // RGBA 순서로 4칸씩 저장되어 있어 알파는 +3 위치다
      if (pixels.data[(y * pixels.width + x) * 4 + 3] === 0) transparent++;
    }
  }
  return { total, transparent };
}

export function isTemplateSize(image: { width: number; height: number }): boolean {
  return (
    image.width === TEMPLATE_SIZE.width && image.height === TEMPLATE_SIZE.height
  );
}

const W = TEMPLATE_SIZE.width;
const H = TEMPLATE_SIZE.height;

export function runChecks(args: {
  kind: ClothingKind;
  format: ImageFormat;
  image: DecodedImage | null;
}): CheckResult[] {
  const { kind, format, image } = args;
  const results: CheckResult[] = [];

  // 1. 파일 종류
  if (format === "png") {
    results.push({ id: "format", status: "pass", title: "PNG 그림 파일이에요" });
  } else if (format === "jpeg") {
    results.push({
      id: "format",
      status: "warn",
      title: "JPG 그림 파일이에요",
      detail:
        "JPG도 올릴 수는 있어요. 그런데 JPG는 비어 있는 곳을 저장하지 못해서, 칠하지 않은 곳이 배경색(보통 흰색)으로 옷에 나와요.",
      fix: [
        "옷 전체를 다 칠했다면 그대로 써도 괜찮아요.",
        "캐릭터 피부가 보여야 하는 곳이 있다면, 그림 프로그램에서 PNG로 다시 저장해요.",
        "새로 저장한 파일을 여기에 다시 올려요.",
      ],
    });
  } else {
    results.push({
      id: "format",
      status: "fail",
      title: "PNG나 JPG 그림 파일이 아니에요",
      detail: "로블록스 옷은 PNG나 JPG 그림 파일만 올릴 수 있어요.",
      fix: [
        "그림을 그린 프로그램을 열어요.",
        "'다른 이름으로 저장'이나 '내보내기'를 눌러요.",
        "파일 형식에서 PNG를 골라서 저장해요.",
        "파일 이름 끝만 .png로 바꾸면 안 돼요. 꼭 새로 저장해야 해요.",
      ],
    });
  }

  if (!image) {
    results.push({
      id: "decode",
      status: "fail",
      title: "그림을 열 수 없어요",
      detail: "파일이 망가졌거나, 이 브라우저가 읽지 못하는 종류예요.",
      fix: [
        "그림 프로그램에서 PNG로 다시 저장해요.",
        "새로 저장한 파일을 여기에 다시 올려요.",
      ],
    });
    return results;
  }

  // 2. 크기
  results.push(
    kind === "tshirt" ? checkTshirtSize(image) : checkTemplateSize(image)
  );

  // 3. 비어 있는 곳 (JPG는 파일 종류 단계에서 이미 안내했으므로 건너뛴다)
  if (format === "png" && image.pixels) {
    results.push(checkTransparency(kind, image.pixels));
  }

  // 4. 비어 있는 칸. 칸 위치에 의존하므로 크기가 맞을 때만 본다
  if (
    kind !== "tshirt" &&
    format === "png" &&
    image.pixels &&
    isTemplateSize(image)
  ) {
    results.push(...checkEmptyPanels(image.pixels));
  }

  return results;
}

function checkTemplateSize(image: DecodedImage): CheckResult {
  const { width, height } = image;
  const size = `${width} × ${height}`;

  if (isTemplateSize(image)) {
    return {
      id: "size",
      status: "pass",
      title: `크기가 ${size}로 딱 맞아요`,
    };
  }

  // 옷 본을 2배, 3배로 키워서 그리는 경우가 흔해서 따로 알려준다
  const ratioW = width / W;
  const ratioH = height / H;
  const isExactMultiple =
    ratioW === ratioH && Number.isInteger(ratioW) && ratioW > 1;

  if (isExactMultiple) {
    return {
      id: "size",
      status: "fail",
      title: `크기가 ${size}예요`,
      detail: `옷 본보다 딱 ${ratioW}배 커요. 크기만 줄이면 맞아요.`,
      fix: [
        "그림 프로그램에서 '이미지 크기' 메뉴를 찾아요.",
        `가로를 ${W}, 세로를 ${H}로 바꿔요.`,
        "PNG로 다시 저장해서 여기에 올려요.",
      ],
    };
  }

  return {
    id: "size",
    status: "fail",
    title: `크기가 ${size}예요`,
    detail: `셔츠와 바지 그림은 가로 ${W}, 세로 ${H} 크기여야 해요. 크기가 다르면 옷이 늘어나거나 엉뚱한 곳에 입혀져요.`,
    fix: [
      "로블록스 공식 사이트에서 옷 본 파일을 다시 받아요.",
      "그 파일 위에 그림을 칸에 맞춰 옮겨 그려요.",
      "저장할 때 크기를 바꾸지 말고 그대로 저장해요.",
    ],
  };
}

function checkTshirtSize(image: DecodedImage): CheckResult {
  const { width, height } = image;
  const size = `${width} × ${height}`;
  const rec = `${TSHIRT_RECOMMENDED} × ${TSHIRT_RECOMMENDED}`;

  if (width !== height) {
    return {
      id: "size",
      status: "warn",
      title: `정사각형이 아니에요 (${size})`,
      detail:
        "티셔츠 그림은 네모 칸(정사각형)에 들어가요. 가로와 세로 길이가 다르면 그림이 찌그러져 보여요.",
      fix: [
        `가로와 세로를 같은 길이로 맞춰요. ${rec}를 추천해요.`,
        "그림이 잘리지 않게 가운데에 두고 저장해요.",
      ],
    };
  }

  if (width < TSHIRT_MIN_SHARP) {
    return {
      id: "size",
      status: "warn",
      title: `정사각형이지만 작아요 (${size})`,
      detail: "작은 그림은 게임에서 흐리게 보일 수 있어요.",
      fix: [
        `처음부터 ${rec} 정도 크기로 그리는 게 좋아요.`,
        "작은 그림을 크게 늘리면 흐려지니, 새로 그리는 걸 추천해요.",
      ],
    };
  }

  return { id: "size", status: "pass", title: `정사각형이에요 (${size})` };
}

function checkTransparency(kind: ClothingKind, pixels: ImageData): CheckResult {
  const { transparent } = alphaStats(pixels);

  if (transparent > 0) {
    return {
      id: "alpha",
      status: "pass",
      title: "비어 있는 곳이 있어요",
      detail: "체크무늬로 보이는 곳은 게임에서 캐릭터 피부가 보여요.",
    };
  }

  const fix = [
    "그림 프로그램에서 맨 아래 배경 층(레이어)을 지우거나 숨겨요.",
    "PNG로 저장해요. '투명 배경' 같은 설정이 있으면 켜요.",
    "여기에 다시 올려서, 비운 곳이 체크무늬로 보이면 성공이에요.",
  ];

  if (kind === "tshirt") {
    return {
      id: "alpha",
      status: "warn",
      title: "배경이 비어 있지 않아요",
      detail:
        "배경을 지우지 않으면 네모난 배경이 옷 앞에 그대로 붙어 보여요. 배경까지 꾸민 거라면 괜찮아요.",
      fix,
    };
  }

  return {
    id: "alpha",
    status: "warn",
    title: "비어 있는 곳이 하나도 없어요",
    detail:
      "칠하지 않은 곳은 비워둬야 게임에서 캐릭터 피부가 보여요. 지금은 모든 곳에 색이 있어요. 옷 전체를 일부러 다 칠했다면 괜찮아요.",
    fix,
  };
}

function checkEmptyPanels(pixels: ImageData): CheckResult[] {
  const isEmpty = (panel: Panel) => {
    const { total, transparent } = alphaStats(pixels, panel);
    return total > 0 && transparent === total;
  };

  // 모든 칸이 비었다면 그림이 칸 밖에 그려진 것이다
  if (PANELS.every(isEmpty)) {
    return [
      {
        id: "panels",
        status: "fail",
        title: "옷 칸 안에 그림이 없어요",
        detail:
          "그림이 옷 본의 칸 바깥에 있어요. 칸 밖에 그린 건 게임에서 보이지 않아요.",
        fix: [
          "'칸 선 보기'를 켜서 노란 칸이 어디 있는지 봐요.",
          "그림을 노란 칸 안으로 옮겨 그려요.",
          "PNG로 다시 저장해서 여기에 올려요.",
        ],
      },
    ];
  }

  const results: CheckResult[] = [];

  if (isEmpty(findPanel("torso", "front"))) {
    results.push({
      id: "panel-front",
      status: "warn",
      title: "몸통 앞 칸이 비어 있어요",
      detail:
        "일부러 비운 거라면 괜찮아요. 아니라면 앞모습 그림이 다른 칸에 들어갔을 수 있어요.",
      fix: [
        "'칸 선 보기'를 켜고 '앞'이라고 적힌 큰 칸을 찾아요.",
        "앞모습 그림이 그 칸 안에 있는지 확인해요.",
      ],
    });
  }
  if (isEmpty(findPanel("torso", "back"))) {
    results.push({
      id: "panel-back",
      status: "warn",
      title: "몸통 뒤 칸이 비어 있어요",
      detail: "뒷모습은 캐릭터 피부색으로 보여요. 일부러 비운 거라면 괜찮아요.",
      fix: ["뒷모습도 꾸미고 싶다면 '뒤'라고 적힌 큰 칸에 그려요."],
    });
  }

  return results;
}

/** 결과 요약 문구 */
export function summarize(results: CheckResult[]): {
  status: CheckStatus;
  headline: string;
  sub: string;
} {
  const fails = results.filter((r) => r.status === "fail").length;
  const warns = results.filter((r) => r.status === "warn").length;

  if (fails > 0) {
    return {
      status: "fail",
      headline: `고쳐야 할 게 ${fails}개 있어요`,
      sub: "이대로 올리면 로벅스만 쓰고 옷이 이상하게 나올 수 있어요. 아래 '어떻게 고쳐요?'를 눌러보세요.",
    };
  }
  if (warns > 0) {
    return {
      status: "warn",
      headline: `고칠 건 없어요. 한 번 더 볼 게 ${warns}개 있어요`,
      sub: "일부러 그렇게 만든 거라면 그대로 올려도 돼요.",
    };
  }
  return {
    status: "pass",
    headline: "크기와 파일 종류는 괜찮아요!",
    sub: "옷 그림의 내용은 로블록스가 따로 확인해요.",
  };
}
