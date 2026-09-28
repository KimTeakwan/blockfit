"use client";

import { CLOTHING_KINDS, ClothingKind } from "@/config/clothing";

/**
 * 셔츠, 바지, 티셔츠 칸 선택.
 *
 * 로블록스는 한 캐릭터에 셋을 동시에 입힐 수 있어서, 칸을 따로 두고 각각 파일을 올린다.
 * 탭마다 상태를 보여줘서 어느 옷을 올렸는지, 고칠 게 있는지 한눈에 보이게 한다.
 * 비어 있을 때는 그 옷이 몸의 어디를 덮는지 보여준다.
 */

export type SlotStatus =
  | { state: "empty" }
  | { state: "pass" }
  | { state: "warn"; count: number }
  | { state: "fail"; count: number };

interface Props {
  value: ClothingKind;
  statuses: Record<ClothingKind, SlotStatus>;
  onChange: (kind: ClothingKind) => void;
}

function statusText(status: SlotStatus, covers: string): string {
  switch (status.state) {
    case "empty":
      return covers;
    case "pass":
      return "통과";
    case "warn":
      return `주의 ${status.count}개`;
    case "fail":
      return `문제 ${status.count}개`;
  }
}

export default function KindSelector({ value, statuses, onChange }: Props) {
  return (
    <div className="kind" role="radiogroup" aria-label="올릴 옷 칸">
      {CLOTHING_KINDS.map((item) => {
        const selected = item.kind === value;
        const status = statuses[item.kind];
        const loaded = status.state !== "empty";
        return (
          <button
            key={item.kind}
            type="button"
            role="radio"
            aria-checked={selected}
            className="kind-option"
            data-status={status.state}
            onClick={() => onChange(item.kind)}
          >
            <span className="kind-label">
              {item.label}
              <span className="kind-alias">{item.alias}</span>
              {loaded && <span className="kind-dot" aria-hidden="true" />}
            </span>
            <span className="kind-covers">
              {statusText(status, item.covers)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
