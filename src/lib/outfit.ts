import { PanelFace, PanelGroup, findPanel } from "@/config/clothing";

/**
 * 여러 옷을 한 모형에 겹쳐 입히는 규칙.
 *
 * 로블록스는 한 캐릭터에 바지, 셔츠, 티셔츠를 동시에 입힐 수 있다.
 * 몸통은 셋이 겹치는데, 아래부터 바지 → 셔츠 → 티셔츠 순서로 덮는다.
 * 그래서 셔츠에서 비워둔 곳으로는 아래 바지가 보인다.
 *   - 팔은 셔츠만, 다리는 바지만 입는다.
 *   - 티셔츠는 몸통 앞면에만 붙는다.
 *
 * 3D 모형과 3D를 못 쓰는 기기용 그림이 같은 규칙을 쓰도록 여기 한 곳에 둔다.
 * 규칙이 바뀌면 이 파일만 고친다.
 */

export interface Outfit {
  shirt: ImageBitmap | null;
  pants: ImageBitmap | null;
  tshirt: ImageBitmap | null;
}

export type BodyPart = "torso" | "rightArm" | "leftArm" | "rightLeg" | "leftLeg";

export interface Layer {
  bitmap: ImageBitmap;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** 픽셀 그림(셔츠·바지)은 또렷하게, 티셔츠 그림은 부드럽게 줄인다 */
  smooth: boolean;
}

function panelLayer(
  bitmap: ImageBitmap,
  group: PanelGroup,
  face: PanelFace
): Layer {
  const p = findPanel(group, face);
  return { bitmap, sx: p.x, sy: p.y, sw: p.w, sh: p.h, smooth: false };
}

/** 이 부위의 이 면에 입힐 그림들. 배열 앞쪽이 아래에 깔린다 */
export function layersFor(
  part: BodyPart,
  face: PanelFace,
  outfit: Outfit
): Layer[] {
  const layers: Layer[] = [];

  switch (part) {
    case "torso":
      if (outfit.pants) layers.push(panelLayer(outfit.pants, "torso", face));
      if (outfit.shirt) layers.push(panelLayer(outfit.shirt, "torso", face));
      if (outfit.tshirt && face === "front") {
        const t = outfit.tshirt;
        layers.push({ bitmap: t, sx: 0, sy: 0, sw: t.width, sh: t.height, smooth: true });
      }
      break;
    case "rightArm":
      if (outfit.shirt) layers.push(panelLayer(outfit.shirt, "rightLimb", face));
      break;
    case "leftArm":
      if (outfit.shirt) layers.push(panelLayer(outfit.shirt, "leftLimb", face));
      break;
    case "rightLeg":
      if (outfit.pants) layers.push(panelLayer(outfit.pants, "rightLimb", face));
      break;
    case "leftLeg":
      if (outfit.pants) layers.push(panelLayer(outfit.pants, "leftLimb", face));
      break;
  }

  return layers;
}

export function drawLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  for (const layer of layers) {
    ctx.imageSmoothingEnabled = layer.smooth;
    ctx.drawImage(
      layer.bitmap,
      layer.sx,
      layer.sy,
      layer.sw,
      layer.sh,
      dx,
      dy,
      dw,
      dh
    );
  }
}

export function isOutfitEmpty(outfit: Outfit): boolean {
  return !outfit.shirt && !outfit.pants && !outfit.tshirt;
}
