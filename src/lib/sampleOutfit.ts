import { PANELS, Panel, PanelFace, TEMPLATE_SIZE, findPanel } from "@/config/clothing";
import { canvasToPng, ensureFonts } from "@/lib/download";

/**
 * 샘플 옷.
 *
 * 옷 그림이 아직 없는 첫 방문자도 버튼 하나로 모형에 옷이 입혀지는 걸 볼 수 있게 한다.
 * 공식 옷 본 그림이나 남의 디자인을 쓰지 않고, 칸 위치 숫자(config/clothing.ts)만으로
 * 블록핏이 직접 그린다. 파일을 따로 두지 않아서 칸 위치가 바뀌어도 샘플이 같이 따라간다.
 *
 * 둘 다 검사를 전부 통과하는 "좋은 예"로 만든다.
 * 몸통 가로줄은 앞, 옆, 뒤 칸에서 같은 높이에 그려서, 돌려보면 이음매가 맞는 게 보인다.
 */

// 초록 매트 위에서도, 밝은 모형 무대에서도 잘 보이는 색으로 고른다
const SHIRT = "#D9533F";
const STRIPE = "#F2C94C";
const PANTS = "#34476B";
const BELT = "#22262B";
const SHOE = "#F3F5F2";

const AROUND: PanelFace[] = ["front", "back", "left", "right"];

/** 칸 안에서 위에서부터 top만큼 내려간 곳에 높이 height의 띠를 칠한다 */
function band(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  color: string,
  top: number,
  height: number
) {
  ctx.fillStyle = color;
  ctx.fillRect(panel.x, panel.y + top, panel.w, height);
}

function drawShirt(ctx: CanvasRenderingContext2D) {
  for (const panel of PANELS) {
    band(ctx, panel, SHIRT, 0, panel.h);
    if (!AROUND.includes(panel.face)) continue;
    if (panel.group === "torso") {
      band(ctx, panel, STRIPE, 74, 14);
    } else {
      // 소맷단
      band(ctx, panel, STRIPE, panel.h - 16, 8);
    }
  }

  const front = findPanel("torso", "front");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `400 30px "Black Han Sans", "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("블록핏", front.x + front.w / 2, front.y + 40);
}

function drawPants(ctx: CanvasRenderingContext2D) {
  for (const panel of PANELS) {
    if (panel.group === "torso") {
      // 몸통은 허리 아래만 칠한다. 위쪽은 비워서 셔츠 없이 입으면 피부가 보인다
      if (panel.face === "down") band(ctx, panel, PANTS, 0, panel.h);
      if (AROUND.includes(panel.face)) {
        band(ctx, panel, PANTS, panel.h - 40, 40);
        band(ctx, panel, BELT, panel.h - 40, 6);
      }
      continue;
    }
    band(ctx, panel, PANTS, 0, panel.h);
    if (panel.face === "down") band(ctx, panel, SHOE, 0, panel.h);
    if (AROUND.includes(panel.face)) band(ctx, panel, SHOE, panel.h - 18, 18);
  }
}

async function render(
  draw: (ctx: CanvasRenderingContext2D) => void,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_SIZE.width;
  canvas.height = TEMPLATE_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("샘플 옷을 그릴 캔버스를 만들 수 없어요");
  draw(ctx);
  const blob = await canvasToPng(canvas);
  return new File([blob], fileName, { type: "image/png" });
}

export async function makeSampleOutfit(): Promise<{ shirt: File; pants: File }> {
  await ensureFonts([`400 30px "Black Han Sans"`]);
  const [shirt, pants] = await Promise.all([
    render(drawShirt, "블록핏_샘플_셔츠.png"),
    render(drawPants, "블록핏_샘플_바지.png"),
  ]);
  return { shirt, pants };
}
