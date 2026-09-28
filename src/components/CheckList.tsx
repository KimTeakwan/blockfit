"use client";

import { CheckResult, CheckStatus, summarize } from "@/lib/imageChecks";

/**
 * 검사 결과.
 *
 * 상태를 색으로만 구분하지 않고 글자(통과/주의/문제)를 함께 붙인다.
 * 고치는 방법은 접어두고 "어떻게 고쳐요?"를 누르면 펼친다.
 * 처음 쓰는 사람에게는 따라 할 순서를, 익숙한 사람에게는 짧은 목록을 준다.
 */

const STATUS_TEXT: Record<CheckStatus, string> = {
  pass: "통과",
  warn: "주의",
  fail: "문제",
};

export default function CheckList({ results }: { results: CheckResult[] }) {
  const summary = summarize(results);

  return (
    <section aria-live="polite">
      <div className="report-summary" data-status={summary.status}>
        <p className="report-headline">{summary.headline}</p>
        <p className="report-sub">{summary.sub}</p>
      </div>

      <ul className="checks">
        {results.map((r) => (
          <li key={r.id} className="check" data-status={r.status}>
            <span className="check-status">{STATUS_TEXT[r.status]}</span>
            <div className="check-body">
              <p className="check-title">{r.title}</p>
              {r.detail && <p className="check-detail">{r.detail}</p>}
              {r.fix && r.fix.length > 0 && (
                <details className="check-fix" open={r.status === "fail"}>
                  <summary>어떻게 고쳐요?</summary>
                  <ol>
                    {r.fix.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
