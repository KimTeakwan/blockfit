"use client";

import { SlotStatus } from "@/components/KindSelector";

/**
 * 초록 판 바로 아래에 붙는 결과 한 줄.
 *
 * 휴대폰에서는 검사 결과가 3D 모형 아래에 있어서 한참 내려야 보인다.
 * 아이들이 결과를 못 보고 지나치지 않게, 파일을 올린 자리에서 바로
 * 결과를 요약해주고 결과로 가는 길을 준다.
 */
export default function MatStatus({
  status,
  canAutoFix,
}: {
  status: SlotStatus;
  canAutoFix: boolean;
}) {
  if (status.state === "empty") return null;

  const text =
    status.state === "fail"
      ? `고쳐야 할 게 ${status.count}개 있어요.`
      : status.state === "warn"
      ? `한 번 더 볼 게 ${status.count}개 있어요.`
      : "크기와 파일 종류는 괜찮아요.";

  return (
    <p className="mat-status" data-status={status.state} aria-live="polite">
      <span>
        {text}
        {canAutoFix && " 자동으로 고칠 수 있어요."}
      </span>
      <a href="#results" className="mat-status-link">
        결과 보러 가기
      </a>
    </p>
  );
}
