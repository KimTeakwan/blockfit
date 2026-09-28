"use client";

import { SKIN_TONES } from "@/config/avatar";

/**
 * 모형 피부색 고르기.
 * 옷에서 비워둔 곳으로 이 색이 보인다.
 * 색만으로 구분하지 않도록 이름을 읽어주고, 고른 색은 테두리로 표시한다.
 */
export default function SkinPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const selected = SKIN_TONES.find((t) => t.color === value);

  return (
    <div className="skin">
      <p className="skin-label">
        피부색 <span className="skin-current">{selected?.label}</span>
      </p>
      <div className="skin-options" role="radiogroup" aria-label="모형 피부색">
        {SKIN_TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            role="radio"
            aria-checked={tone.color === value}
            aria-label={tone.label}
            title={tone.label}
            className="skin-swatch"
            style={{ background: tone.color }}
            onClick={() => onChange(tone.color)}
          />
        ))}
      </div>
    </div>
  );
}
