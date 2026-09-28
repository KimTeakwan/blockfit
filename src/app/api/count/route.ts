import { NextResponse } from "next/server";

/**
 * "현재까지 아바타를 꾸민 인원" 숫자를 읽고 올리는 서버 주소.
 *
 * 저장소는 Upstash Redis를 쓴다. Vercel에서 연결하면 접속 정보가
 * 환경변수로 자동으로 들어온다. 연결 방식에 따라 이름이 두 가지라 둘 다 읽는다.
 *
 * 받는 정보: 없음. 요청은 "숫자 하나 올려주세요"뿐이고 그림이나 개인정보는 오지 않는다.
 *
 * 장난 방지: 같은 곳에서 요청이 지나치게 많이 오면 더 세지 않는다.
 * IP 주소는 저장하지 않고, 되돌릴 수 없게 바꾼 값을 1시간만 쓰고 버린다.
 *
 * 저장소가 연결되지 않았으면 숫자 대신 null을 돌려주고, 화면은 숫자만 숨긴다.
 */

const TOTAL_KEY = "blockfit:dressed:total";
const RATE_PREFIX = "blockfit:rate:";
// 한 학교 컴퓨터실처럼 여러 기기가 같은 주소를 쓰는 경우를 생각해 넉넉히 둔다
const RATE_LIMIT = 60;
const RATE_WINDOW_SECONDS = 60 * 60;

interface RedisConfig {
  url: string;
  token: string;
}

function redisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

/** Redis 명령 하나를 보낸다. Upstash의 기본 REST 방식이라 라이브러리가 필요 없다 */
async function redis(
  config: RedisConfig,
  command: (string | number)[]
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis 응답 오류: ${response.status}`);
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`Redis 오류: ${data.error}`);
  return data.result;
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** 요청한 곳을 구분하는 값. 원래 IP를 알아낼 수 없게 해시로 바꾼다 */
async function requesterKey(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const salt = process.env.COUNTER_SALT ?? "blockfit";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 다른 사이트에서 숫자를 올리는 걸 막는다 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET() {
  const config = redisConfig();
  if (!config) return NextResponse.json({ count: null });

  try {
    const count = toCount(await redis(config, ["GET", TOTAL_KEY]));
    return NextResponse.json(
      { count },
      {
        // 방문자마다 저장소를 부르지 않도록 30초 동안은 같은 숫자를 돌려준다
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("꾸민 인원 조회 실패:", err);
    return NextResponse.json({ count: null });
  }
}

export async function POST(request: Request) {
  const config = redisConfig();
  if (!config) return NextResponse.json({ count: null, counted: false });

  if (!isSameOrigin(request)) {
    return NextResponse.json({ count: null, counted: false }, { status: 403 });
  }

  try {
    const rateKey = RATE_PREFIX + (await requesterKey(request));
    const hits = toCount(await redis(config, ["INCR", rateKey]));
    if (hits === 1) {
      await redis(config, ["EXPIRE", rateKey, RATE_WINDOW_SECONDS]);
    }

    if (hits > RATE_LIMIT) {
      const count = toCount(await redis(config, ["GET", TOTAL_KEY]));
      return NextResponse.json({ count, counted: false });
    }

    const count = toCount(await redis(config, ["INCR", TOTAL_KEY]));
    return NextResponse.json({ count, counted: true });
  } catch (err) {
    console.error("꾸민 인원 올리기 실패:", err);
    return NextResponse.json({ count: null, counted: false });
  }
}
