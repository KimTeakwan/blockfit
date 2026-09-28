import { PANELS, TEMPLATE_SIZE, panelLabel } from "@/config/clothing";
import { canvasToPng, ensureFonts } from "@/lib/download";

/**
 * 칸 이름이 한글로 적힌 옷 본.
 *
 * 공식 옷 본 그림을 베끼지 않고, 칸 위치 숫자(config/clothing.ts)만으로 새로 그린다.
 * 칸 위치는 로블록스가 정한 규격이라 같지만, 그림 자체는 블록핏이 만든 것이다.
 *
 * 쓰는 법: 이 그림을 맨 아래 층으로 두고 새 층에 옷을 그린 뒤,
 * 저장하기 전에 이 층을 숨긴다. 칸 바깥 빈 구석에 그 안내를 적어둔다.
 * 칸 바깥은 게임에서 보이지 않으므로, 안내 글과 사이트 주소를 넣어도 옷에 영향이 없다.
 */

type TemplateKind = "shirt" | "pants";

const GROUP_TINT: Record<string, string> = {
  torso: "rgba(59, 111, 182, 0.18)",
  rightLimb: "rgba(200, 65, 58, 0.18)",
  leftLimb: "rgba(62, 154, 91, 0.18)",
};

const LINE = "rgba(28, 35, 33, 0.7)";
const TEXT = "#1C2321";
const FONT_FAMILY = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

/** 칸 너비에 들어가도록 글자 크기를 줄여가며 맞춘다 */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  weight: number
): number {
  let size = start;
  while (size > 8) {
    ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

export async function makeKoreanTemplate(
  kind: TemplateKind,
  siteHost: string
): Promise<Blob> {
  await ensureFonts([`700 14px "IBM Plex Sans KR"`, `400 12px "IBM Plex Sans KR"`]);

  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_SIZE.width;
  canvas.height = TEMPLATE_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("옷 본을 그릴 캔버스를 만들 수 없어요");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const panel of PANELS) {
    const { x, y, w, h } = panel;

    // 1) 칸 바탕과 테두리
    ctx.fillStyle = GROUP_TINT[panel.group];
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // 2) 칸 위쪽 표시. 그림을 똑바로 세워 그리게 돕는다
    const ax = x + w / 2;
    const ay = y + 5;
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 5, ay + 7);
    ctx.lineTo(ax + 5, ay + 7);
    ctx.closePath();
    ctx.fill();

    // 3) 칸 이름 두 줄: "몸통 / 앞면", "오른팔 / 오른쪽 면"
    const full = panelLabel(panel, kind).full;
    const space = full.indexOf(" ");
    const part = space > 0 ? full.slice(0, space) : full;
    const face = space > 0 ? full.slice(space + 1) : "";

    const maxWidth = w - 8;
    const cx = x + w / 2;
    const cy = y + h / 2 + 4;
    ctx.fillStyle = TEXT;

    const partSize = fitFont(ctx, part, maxWidth, w >= 128 ? 16 : 13, 700);
    ctx.font = `700 ${partSize}px ${FONT_FAMILY}`;
    ctx.fillText(part, cx, cy - partSize * 0.7);

    const faceSize = fitFont(ctx, face, maxWidth, w >= 128 ? 14 : 12, 400);
    ctx.font = `400 ${faceSize}px ${FONT_FAMILY}`;
    ctx.fillText(face, cx, cy + faceSize * 0.7);
  }

  // 4) 칸 바깥 왼쪽 위 빈 구석에 안내. 이 자리는 게임에서 보이지 않는다
  const kindName = kind === "shirt" ? "셔츠 (상의 그림)" : "바지 (하의 그림)";
  const notes: { text: string; weight: number; size: number }[] = [
    { text: "블록핏 한국어 옷 본", weight: 700, size: 13 },
    { text: kindName, weight: 700, size: 12 },
    { text: "", weight: 400, size: 6 },
    { text: `${TEMPLATE_SIZE.width} × ${TEMPLATE_SIZE.height} 그대로 저장`, weight: 400, size: 11 },
    { text: "이 층은 안내용이에요.", weight: 400, size: 11 },
    { text: "새 층에 옷을 그리고,", weight: 400, size: 11 },
    { text: "저장하기 전에", weight: 400, size: 11 },
    { text: "이 층을 꼭 숨기세요.", weight: 700, size: 11 },
    { text: "", weight: 400, size: 6 },
    { text: siteHost, weight: 400, size: 10 },
  ];

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = TEXT;
  let ty = 10;
  for (const note of notes) {
    if (note.text) {
      const size = fitFont(ctx, note.text, 148, note.size, note.weight);
      ctx.font = `${note.weight} ${size}px ${FONT_FAMILY}`;
      ctx.fillText(note.text, 10, ty);
    }
    ty += note.size + 6;
  }

  return canvasToPng(canvas);
}
