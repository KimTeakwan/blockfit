import { SHARE_TEXT, SITE_NAME } from "@/config/site";
import { canvasToPng, downloadBlob, ensureFonts } from "@/lib/download";

/**
 * 친구에게 보여주기.
 *
 * 링크로 내 옷을 보여주려면 그림을 서버에 올려 보관해야 한다.
 * 아이들 그림을 맡아 관리하는 책임이 생기고, "그림은 어디에도 보내지 않아요"라는
 * 약속도 깨진다. 그래서 "옷 입힌 모형 사진 + 사이트 주소"를 함께 보낸다.
 * 사진은 이 기기 안에서 만들어지고, 사진 아래에 사이트 주소가 크게 찍힌다.
 * 친구가 사진을 보고 주소로 들어오므로 홍보 효과는 같다.
 *
 * 휴대폰에서는 기기의 공유 창(카톡, 인스타 등)을 연다.
 * 공유 창을 쓸 수 없는 환경에서는 사진을 저장하고 주소를 복사해준다.
 */

export type ShareResult = "shared" | "saved" | "cancelled";

// 인스타그램 피드에 잘 맞는 세로 4:5 비율
const CARD_W = 1080;
const CARD_H = 1350;

const MAT = "#1F5C46";
const CHALK = "#F2C94C";
const STAGE = "#E6EBE7";
const DISPLAY = '"Black Han Sans", "Apple SD Gothic Neo", sans-serif';
const BODY = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 2;
  for (let x = 0; x <= CARD_W; x += 36) {
    ctx.strokeStyle = x % 180 === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= CARD_H; y += 36) {
    ctx.strokeStyle = y % 180 === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 옷 입힌 모형 사진(avatar)으로 공유용 사진을 만든다 */
export async function buildShareCard(
  avatar: HTMLCanvasElement,
  siteUrl: string
): Promise<Blob> {
  await ensureFonts([`400 64px "Black Han Sans"`, `500 40px "IBM Plex Sans KR"`]);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 만들 캔버스를 만들 수 없어요");

  // 1) 커팅매트 바탕
  ctx.fillStyle = MAT;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  drawGrid(ctx);

  // 2) 이름과 제목
  ctx.textBaseline = "top";
  ctx.fillStyle = CHALK;
  ctx.font = `400 52px ${DISPLAY}`;
  ctx.fillText(SITE_NAME, 72, 64);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `400 66px ${DISPLAY}`;
  ctx.fillText("내가 만든 로블록스 옷,", 72, 150);
  ctx.fillText("먼저 입혀봤어요", 72, 232);

  // 3) 모형 무대
  const stage = { x: 72, y: 350, w: CARD_W - 144, h: 780 };
  ctx.fillStyle = STAGE;
  roundedRect(ctx, stage.x, stage.y, stage.w, stage.h, 36);
  ctx.fill();

  // 발밑 그림자
  const shadowY = stage.y + stage.h - 70;
  const shadow = ctx.createRadialGradient(CARD_W / 2, shadowY, 10, CARD_W / 2, shadowY, 230);
  shadow.addColorStop(0, "rgba(28,35,33,0.22)");
  shadow.addColorStop(1, "rgba(28,35,33,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(stage.x, shadowY - 60, stage.w, 120);

  // 모형 사진을 무대 안에 비율 유지하며 넣는다
  const scale = Math.min((stage.w - 40) / avatar.width, (stage.h - 40) / avatar.height);
  const aw = avatar.width * scale;
  const ah = avatar.height * scale;
  ctx.drawImage(avatar, stage.x + (stage.w - aw) / 2, stage.y + (stage.h - ah) / 2, aw, ah);

  // 4) 사이트 주소. 친구가 이걸 보고 찾아온다
  let host = siteUrl;
  try {
    host = new URL(siteUrl).host;
  } catch {
    // 주소 형식이 이상하면 받은 그대로 쓴다
  }
  ctx.fillStyle = CHALK;
  ctx.font = `500 44px ${BODY}`;
  ctx.fillText(host, 72, 1170);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `400 30px ${BODY}`;
  ctx.fillText("로블록스 옷을 올리기 전에 입혀보는 곳, 비공식 도구", 72, 1238);

  return canvasToPng(canvas);
}

/** 기기의 공유 창을 연다. 안 되면 사진을 저장하고 주소를 복사한다 */
export async function shareCard(blob: Blob, siteUrl: string): Promise<ShareResult> {
  const file = new File([blob], "blockfit.png", { type: "image/png" });
  // 일부 앱은 사진과 함께 보낸 주소 칸을 버려서, 문장 안에 주소를 넣는다
  const text = `${SHARE_TEXT} ${siteUrl}`;

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], text, title: SITE_NAME });
      return "shared";
    } catch (err) {
      // 사용자가 공유 창을 닫은 경우는 실패가 아니다
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // 그 밖의 이유로 공유 창이 안 열리면 저장으로 넘어간다
    }
  }

  downloadBlob(blob, "blockfit.png");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 복사가 막힌 환경이어도 사진에 주소가 찍혀 있으니 괜찮다
  }
  return "saved";
}
