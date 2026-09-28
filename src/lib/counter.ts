/**
 * "현재까지 아바타를 꾸민 인원" 숫자를 읽고 올리는 브라우저 쪽 함수.
 *
 * 한 기기에서 한 번만 센다. 처음 셀 때 기기에 표시를 남기고,
 * 그 뒤로는 다시 요청하지 않는다. 사람을 직접 알아볼 방법이 없어서
 * 기기 단위로 센다. 같은 사람이 휴대폰과 컴퓨터로 하면 두 번 세고,
 * 브라우저 기록을 지우면 다시 센다. 그래서 숫자는 대략적인 값이다.
 *
 * 보내는 건 "숫자 하나 올려주세요" 요청뿐이다. 그림이나 개인정보는 보내지 않는다.
 */

const COUNTED_FLAG = "blockfit:dressed:v1";

// 기기 저장소를 쓸 수 없는 환경(일부 비공개 모드)에서도 한 화면에서 두 번 세지 않게 한다
let countedInThisPage = false;

function alreadyCounted(): boolean {
  if (countedInThisPage) return true;
  try {
    return localStorage.getItem(COUNTED_FLAG) === "1";
  } catch {
    return false;
  }
}

function markCounted() {
  countedInThisPage = true;
  try {
    localStorage.setItem(COUNTED_FLAG, "1");
  } catch {
    // 저장이 막혀도 이번 화면에서는 위의 변수로 막힌다
  }
}

function readCount(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const count = (data as { count?: unknown }).count;
  return typeof count === "number" ? count : null;
}

export async function fetchDressedCount(): Promise<number | null> {
  try {
    const response = await fetch("/api/count");
    if (!response.ok) return null;
    return readCount(await response.json());
  } catch {
    return null;
  }
}

/**
 * 이 기기에서 처음으로 옷을 입혀봤을 때만 센다.
 * 새 숫자를 돌려주고, 이미 셌거나 실패하면 null을 돌려준다.
 */
export async function reportDressed(): Promise<number | null> {
  if (alreadyCounted()) return null;
  // 요청 전에 표시부터 남긴다. 화면이 빠르게 두 번 반응해도 한 번만 센다
  markCounted();
  try {
    const response = await fetch("/api/count", { method: "POST" });
    if (!response.ok) return null;
    return readCount(await response.json());
  } catch {
    return null;
  }
}
