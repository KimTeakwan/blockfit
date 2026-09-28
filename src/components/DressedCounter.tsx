"use client";

import { COUNTER_MIN_TO_SHOW } from "@/config/site";

/**
 * "현재까지 아바타를 꾸민 인원" 표시.
 *
 * 숫자는 한국식으로 쉼표를 찍는다(1,234). 자리수가 늘어나도 그대로 늘어난다.
 * 저장소가 연결되지 않았거나 숫자가 아직 작으면 아예 보여주지 않는다.
 */
export default function DressedCounter({ count }: { count: number | null }) {
  if (count === null || count < COUNTER_MIN_TO_SHOW) return null;

  return (
    <p className="counter">
      <span>현재까지 아바타를 꾸민 인원:</span>{" "}
      <span className="counter-value">{count.toLocaleString("ko-KR")}명</span>
    </p>
  );
}
