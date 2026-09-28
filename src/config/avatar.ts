/**
 * 모형(마네킹) 관련 설정.
 *
 * 피부색은 옷에서 비워둔 곳으로 보이는 색이다.
 * 같은 옷도 피부색에 따라 느낌이 꽤 달라서 골라볼 수 있게 한다.
 * 첫 번째 값이 기본값이다.
 */
export const SKIN_TONES: { id: string; label: string; color: string }[] = [
  { id: "gray", label: "회색 모형", color: "#C4CBC7" },
  { id: "light", label: "밝은 피부", color: "#F1D3BC" },
  { id: "lightMedium", label: "조금 밝은 피부", color: "#E0B08A" },
  { id: "medium", label: "중간 피부", color: "#C28A60" },
  { id: "mediumDark", label: "조금 어두운 피부", color: "#8E5B3C" },
  { id: "dark", label: "어두운 피부", color: "#5E3B28" },
];

export const DEFAULT_SKIN = SKIN_TONES[0].color;
