"use client";

import { useEffect, useRef } from "react";
import { BodyPart, Outfit, drawLayers, layersFor } from "@/lib/outfit";

/**
 * 3D를 쓸 수 없는 기기에서 보여주는 앞모습과 뒷모습.
 *
 * 모형은 얼굴 없는 블록으로 그리고, 고른 피부색을 칠한다.
 * 특정 게임 캐릭터의 모습을 따라 그리지 않고, 옷이 어디에 가는지만 보여준다.
 * 옷을 겹치는 순서는 3D 모형과 같은 규칙(lib/outfit.ts)을 쓴다.
 */

type View = "front" | "back";

// 모형 치수. 옷 본 칸 크기(몸통 128, 팔다리 64)를 그대로 단위로 쓴다
const UNIT = { headW: 96, headH: 64, torso: 128, limbW: 64, limbH: 128 };
const FIGURE_W = UNIT.limbW * 2 + UNIT.torso;
const FIGURE_H = UNIT.headH + UNIT.torso + UNIT.limbH;
const SCALE = 2;

/** 모서리선은 피부색보다 조금 어둡게 해서 어떤 피부색에서도 보이게 한다 */
function darken(hex: string, factor: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LAYOUT = (() => {
  const torsoX = UNIT.limbW;
  const torsoY = UNIT.headH;
  const legY = torsoY + UNIT.torso;
  return {
    head: { x: (FIGURE_W - UNIT.headW) / 2, y: 0, w: UNIT.headW, h: UNIT.headH },
    torso: { x: torsoX, y: torsoY, w: UNIT.torso, h: UNIT.torso },
    // 보는 사람 기준 왼쪽 / 오른쪽 자리
    armLeftSlot: { x: 0, y: torsoY, w: UNIT.limbW, h: UNIT.limbH },
    armRightSlot: { x: torsoX + UNIT.torso, y: torsoY, w: UNIT.limbW, h: UNIT.limbH },
    legLeftSlot: { x: torsoX, y: legY, w: UNIT.limbW, h: UNIT.limbH },
    legRightSlot: { x: torsoX + UNIT.limbW, y: legY, w: UNIT.limbW, h: UNIT.limbH },
  };
})();

function drawFigure(
  canvas: HTMLCanvasElement,
  outfit: Outfit,
  skin: string,
  view: View
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = FIGURE_W * SCALE;
  canvas.height = FIGURE_H * SCALE;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.clearRect(0, 0, FIGURE_W, FIGURE_H);

  const face = view === "front" ? "front" : "back";

  // 앞에서 보면 모형의 오른쪽이 보는 사람의 왼쪽에 온다. 뒤에서는 반대
  const slots: { part: BodyPart; rect: Rect }[] =
    view === "front"
      ? [
          { part: "torso", rect: LAYOUT.torso },
          { part: "rightArm", rect: LAYOUT.armLeftSlot },
          { part: "leftArm", rect: LAYOUT.armRightSlot },
          { part: "rightLeg", rect: LAYOUT.legLeftSlot },
          { part: "leftLeg", rect: LAYOUT.legRightSlot },
        ]
      : [
          { part: "torso", rect: LAYOUT.torso },
          { part: "leftArm", rect: LAYOUT.armLeftSlot },
          { part: "rightArm", rect: LAYOUT.armRightSlot },
          { part: "leftLeg", rect: LAYOUT.legLeftSlot },
          { part: "rightLeg", rect: LAYOUT.legRightSlot },
        ];

  // 1) 맨몸 모형
  ctx.fillStyle = skin;
  ctx.fillRect(LAYOUT.head.x, LAYOUT.head.y, LAYOUT.head.w, LAYOUT.head.h);
  slots.forEach(({ rect }) => ctx.fillRect(rect.x, rect.y, rect.w, rect.h));

  // 2) 옷 겹쳐 입히기. 비어 있는 곳은 아래 옷이나 피부색이 보인다
  slots.forEach(({ part, rect }) =>
    drawLayers(ctx, layersFor(part, face, outfit), rect.x, rect.y, rect.w, rect.h)
  );

  // 3) 블록 경계선
  ctx.strokeStyle = darken(skin, 0.7);
  ctx.lineWidth = 1;
  [LAYOUT.head, ...slots.map((s) => s.rect)].forEach((r) =>
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
  );
}

export default function FrontBackPreview({
  outfit,
  skin,
}: {
  outfit: Outfit;
  skin: string;
}) {
  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (frontRef.current) drawFigure(frontRef.current, outfit, skin, "front");
    if (backRef.current) drawFigure(backRef.current, outfit, skin, "back");
  }, [outfit, skin]);

  return (
    <div className="figures">
      <figure className="figure">
        <canvas ref={frontRef} aria-label="앞모습 미리보기" role="img" />
        <figcaption>앞모습</figcaption>
      </figure>
      <figure className="figure">
        <canvas ref={backRef} aria-label="뒷모습 미리보기" role="img" />
        <figcaption>뒷모습</figcaption>
      </figure>
    </div>
  );
}
