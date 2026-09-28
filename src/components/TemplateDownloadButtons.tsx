"use client";

import { useState } from "react";
import { makeKoreanTemplate } from "@/lib/templateImage";
import { downloadBlob } from "@/lib/download";

/**
 * 한국어 옷 본 내려받기 버튼.
 * 옷 본은 누를 때 이 기기에서 그려서 바로 내려받는다.
 */

type TemplateKind = "shirt" | "pants";

const LABEL: Record<TemplateKind, { button: string; file: string }> = {
  shirt: { button: "셔츠 옷 본 받기", file: "블록핏_셔츠_옷본.png" },
  pants: { button: "바지 옷 본 받기", file: "블록핏_바지_옷본.png" },
};

export default function TemplateDownloadButtons({
  kinds = ["shirt", "pants"],
}: {
  kinds?: TemplateKind[];
}) {
  const [busy, setBusy] = useState<TemplateKind | null>(null);
  const [failed, setFailed] = useState(false);

  async function download(kind: TemplateKind) {
    setBusy(kind);
    setFailed(false);
    try {
      const blob = await makeKoreanTemplate(kind, window.location.host);
      downloadBlob(blob, LABEL[kind].file);
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="template-download">
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          className="button-secondary"
          onClick={() => download(kind)}
          disabled={busy !== null}
        >
          {busy === kind ? "만드는 중이에요" : LABEL[kind].button}
        </button>
      ))}
      {failed && (
        <p className="autofix-note">옷 본을 만들지 못했어요. 다시 눌러주세요.</p>
      )}
    </div>
  );
}
