import { ClothingKind, TEMPLATE_SIZE } from "@/config/clothing";
import { ImageFormat } from "@/lib/fileSignature";
import { DecodedImage } from "@/lib/imageChecks";
import { canvasToPng } from "@/lib/download";

/**
 * 자동으로 고치기.
 *
 * 원칙: 확실하게 고칠 수 있는 것만 고친다.
 *   - 옷 본을 정확히 2배, 3배로 키워 그린 경우: 칸 위치가 그대로 비례하므로 줄이면 맞는다.
 *   - PNG가 아닌 파일: 그림은 그대로 두고 PNG로 다시 저장한다.
 *   - 직사각형 티셔츠: 늘리거나 자르지 않고, 투명한 정사각형 가운데에 놓는다.
 *
 * 크기가 애매하게 다른 셔츠·바지(예: 600 × 600)는 고치지 않는다.
 * 억지로 늘리거나 줄이면 칸 위치가 어긋나서 오히려 더 망가진다.
 * 그런 경우는 고칠 수 없다고 솔직하게 알려준다.
 *
 * 모든 처리는 브라우저 안에서 끝나고, 결과는 항상 PNG다.
 */

export interface FixPlan {
  /** 화면에 보여줄 고칠 내용. 비어 있으면 자동으로 고칠 게 없다 */
  steps: string[];
  resizeToTemplate: boolean;
  padToSquare: boolean;
  /** 자동으로 고칠 수 없는 문제가 함께 있을 때 안내 문구 */
  blocked: string | null;
}

const W = TEMPLATE_SIZE.width;
const H = TEMPLATE_SIZE.height;

export function planFix(
  kind: ClothingKind,
  format: ImageFormat,
  image: DecodedImage | null
): FixPlan {
  const plan: FixPlan = {
    steps: [],
    resizeToTemplate: false,
    padToSquare: false,
    blocked: null,
  };
  if (!image) return plan;

  if (kind === "tshirt") {
    if (image.width !== image.height) {
      plan.padToSquare = true;
      plan.steps.push("투명한 정사각형 가운데에 놓기");
    }
  } else if (image.width !== W || image.height !== H) {
    const ratioW = image.width / W;
    const ratioH = image.height / H;
    const exactMultiple =
      ratioW === ratioH && Number.isInteger(ratioW) && ratioW > 1;

    if (exactMultiple) {
      plan.resizeToTemplate = true;
      plan.steps.push(`크기를 ${W} × ${H}로 줄이기`);
    } else {
      plan.blocked =
        "크기는 자동으로 고칠 수 없어요. 칸 위치가 어긋나서, 옷 본 위에 다시 맞춰 그려야 해요.";
    }
  }

  if (format === "jpeg") plan.steps.push("JPG를 PNG로 바꾸기");
  if (format === "other") plan.steps.push("PNG로 바꾸기");

  return plan;
}

export async function applyFix(
  image: DecodedImage,
  plan: FixPlan
): Promise<Blob> {
  let outW = image.width;
  let outH = image.height;
  let dx = 0;
  let dy = 0;
  let dw = image.width;
  let dh = image.height;

  if (plan.resizeToTemplate) {
    outW = dw = W;
    outH = dh = H;
  }

  if (plan.padToSquare) {
    const side = Math.max(image.width, image.height);
    outW = outH = side;
    dx = Math.floor((side - image.width) / 2);
    dy = Math.floor((side - image.height) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("그림을 고칠 캔버스를 만들 수 없어요");

  // 줄일 때는 여러 픽셀을 섞어서 줄여야 세밀한 그림이 깨지지 않는다.
  // 같은 픽셀을 2배로 키운 픽셀 그림도, 같은 색끼리 섞이므로 원래대로 돌아온다.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image.bitmap, 0, 0, image.width, image.height, dx, dy, dw, dh);

  return canvasToPng(canvas);
}

/** 고친 파일 이름. 원래 이름 뒤에 "_고침"을 붙이고 PNG로 바꾼다 */
export function fixedFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, "") || "옷";
  return `${base}_고침.png`;
}
