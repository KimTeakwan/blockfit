"use client";

import { useState } from "react";
import { UPLOAD_INFO } from "@/config/clothing";

/**
 * 파일만 보고는 판단할 수 없는 항목들.
 *
 * 안내선을 숨겼는지, 남의 로고를 썼는지는 픽셀로 확실히 가려낼 수 없다.
 * 틀리게 판단하느니 사용자가 직접 확인하게 하는 편이 정직하다.
 * 체크 상태는 저장하지 않는다. 파일마다 새로 확인해야 하는 것들이다.
 */

const ITEMS = [
  {
    id: "guides",
    label: "옷 본에 있던 선과 글자를 숨기고 저장했어요",
    hint: "숨기지 않으면 선과 글자가 옷에 그대로 찍혀요.",
  },
  {
    id: "rights",
    label: "다른 회사 로고나 만화 캐릭터를 그리지 않았어요",
    hint: "남이 만든 로고나 캐릭터를 그리면 로블록스에 올라가지 않을 수 있어요.",
  },
  {
    id: "studio",
    label: "로블록스 스튜디오에서 입혀봤어요",
    hint: "스튜디오에서 입혀보는 건 공짜예요. 게임 속 모습과 가장 비슷해요.",
  },
];

export default function ManualChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const doneCount = ITEMS.filter((item) => checked[item.id]).length;

  return (
    <section className="manual">
      <h2 className="section-title">올리기 전에 직접 확인할 것</h2>
      <ul className="manual-list">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <label className="manual-item">
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
              />
              <span>
                <span className="manual-label">{item.label}</span>
                <span className="manual-hint">{item.hint}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="manual-foot">
        {doneCount === ITEMS.length
          ? `준비됐어요! 올릴 때마다 ${UPLOAD_INFO.feeRobux} 로벅스, 팔려고 내놓을 때 ${UPLOAD_INFO.publishFeeRobux} 로벅스가 더 드니 보호자와 함께 올리세요.`
          : `${ITEMS.length}개 중 ${doneCount}개 확인했어요.`}{" "}
        <a href={UPLOAD_INFO.docsUrl} target="_blank" rel="noreferrer">
          공식 안내 보기
        </a>
      </p>
    </section>
  );
}
