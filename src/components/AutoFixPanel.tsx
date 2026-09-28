"use client";

import { FixPlan } from "@/lib/autoFix";
import { ImageFormat } from "@/lib/fileSignature";

/**
 * 자동으로 고치기 안내 상자.
 *
 * 고칠 수 있으면 무엇을 고치는지 먼저 보여주고 버튼을 준다.
 * 고친 뒤에는 그 파일이 칸에 다시 올라가 재검사되고, 여기서 내려받는다.
 * 로블록스에는 고친 파일을 올려야 하므로 내려받기를 가장 눈에 띄게 둔다.
 */

interface Props {
  plan: FixPlan;
  /** 이미 자동으로 고친 파일이면 원래 형식. 아니면 null */
  fixedFrom: ImageFormat | null;
  downloadUrl: string;
  downloadName: string;
  busy: boolean;
  onFix: () => void;
}

export default function AutoFixPanel({
  plan,
  fixedFrom,
  downloadUrl,
  downloadName,
  busy,
  onFix,
}: Props) {
  if (fixedFrom !== null) {
    return (
      <div className="autofix autofix-done">
        <p className="autofix-title">자동으로 고친 파일이에요</p>
        <p className="autofix-note">
          아래 검사 결과를 확인하고, 로블록스에는 이 파일을 올리세요.
        </p>
        {fixedFrom === "jpeg" && (
          <p className="autofix-note">
            JPG에서 바꾼 파일이라 비어 있는 곳은 없어요. 피부가 보여야 할 곳이
            있다면 그림 프로그램에서 지워야 해요.
          </p>
        )}
        <a className="button-primary" href={downloadUrl} download={downloadName}>
          고친 파일 받기
        </a>
      </div>
    );
  }

  if (plan.steps.length === 0) return null;

  return (
    <div className="autofix">
      <p className="autofix-title">자동으로 고칠 수 있어요</p>
      <ul className="autofix-steps">
        {plan.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {plan.blocked && <p className="autofix-note">{plan.blocked}</p>}
      <button
        type="button"
        className="button-primary"
        onClick={onFix}
        disabled={busy}
      >
        {busy ? "고치는 중이에요" : "자동으로 고치기"}
      </button>
    </div>
  );
}
