/**
 * 옷 규격에 관한 값은 모두 이 파일에서만 관리한다.
 * 로블록스 규정이 바뀌면 이 파일만 고치면 되도록 한다.
 *
 * 출처: Roblox Creator Hub "Classic clothing" 문서 (2026년 9월 확인)
 * https://create.roblox.com/docs/avatar/classic-clothing
 */

export type ClothingKind = "shirt" | "pants" | "tshirt";

/**
 * label은 로블록스 공식 이름을 그대로 쓴다. 아이들이 실제로 검색하는 단어라서다.
 * alias는 뜻을 쉽게 풀어준 이름이다.
 *
 * "상의", "하의"만 단독으로 쓰지 않는 이유: 로블록스에는 그림으로 만드는
 * 2D 옷(셔츠, 바지)과 3D 프로그램으로 만드는 입체 옷이 따로 있고, 둘 다 상의·하의가 있다.
 * 블록핏은 2D만 다루므로 "그림"을 붙여 입체 옷과 구분한다.
 */
export const CLOTHING_KINDS: {
  kind: ClothingKind;
  label: string;
  alias: string;
  covers: string;
}[] = [
  { kind: "shirt", label: "셔츠", alias: "상의 그림", covers: "몸통과 팔" },
  { kind: "pants", label: "바지", alias: "하의 그림", covers: "몸통과 다리" },
  { kind: "tshirt", label: "티셔츠", alias: "가슴 그림", covers: "몸통 앞면" },
];

/** 셔츠와 바지 템플릿 전체 크기 */
export const TEMPLATE_SIZE = { width: 585, height: 559 } as const;

/** 티셔츠 권장 크기. 공식 문서는 "512x512 같은 정사각형"이라고만 한다 */
export const TSHIRT_RECOMMENDED = 512;
export const TSHIRT_MIN_SHARP = 256;

/** 업로드 비용 안내. 규정이 바뀌면 여기만 고친다 */
export const UPLOAD_INFO = {
  feeRobux: 80,
  checkedAt: "2026년 9월",
  docsUrl: "https://create.roblox.com/docs/avatar/classic-clothing",
};

export type PanelGroup = "torso" | "rightLimb" | "leftLimb";
export type PanelFace = "up" | "down" | "front" | "back" | "left" | "right";

export interface Panel {
  group: PanelGroup;
  face: PanelFace;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 템플릿 안에서 각 패널이 있는 위치.
 *
 * ⚠ 검증 필요
 * 패널 크기(128×128, 64×128, 128×64, 64×64)는 공식 문서와 일치하지만,
 * 위치 좌표는 공식 문서에 숫자로 나와 있지 않다.
 * 출시 전에 공식 템플릿 PNG를 검사기에 넣고 "패널 선 보기"를 켜서
 * 템플릿에 인쇄된 칸과 이 선이 정확히 겹치는지 확인해야 한다.
 * (README의 "출시 전 좌표 검증" 참고)
 *
 * 바지는 셔츠와 같은 배치를 쓰고, 팔 자리에 다리가 들어간다.
 * 템플릿 아래 왼쪽 묶음이 오른쪽 팔다리, 아래 오른쪽 묶음이 왼쪽 팔다리다.
 */
export const PANELS: Panel[] = [
  // 몸통
  { group: "torso", face: "up", x: 231, y: 8, w: 128, h: 64 },
  { group: "torso", face: "right", x: 165, y: 74, w: 64, h: 128 },
  { group: "torso", face: "front", x: 231, y: 74, w: 128, h: 128 },
  { group: "torso", face: "left", x: 361, y: 74, w: 64, h: 128 },
  { group: "torso", face: "back", x: 427, y: 74, w: 128, h: 128 },
  { group: "torso", face: "down", x: 231, y: 204, w: 128, h: 64 },

  // 오른팔 (바지는 오른다리)
  { group: "rightLimb", face: "up", x: 217, y: 289, w: 64, h: 64 },
  { group: "rightLimb", face: "left", x: 19, y: 355, w: 64, h: 128 },
  { group: "rightLimb", face: "back", x: 85, y: 355, w: 64, h: 128 },
  { group: "rightLimb", face: "right", x: 151, y: 355, w: 64, h: 128 },
  { group: "rightLimb", face: "front", x: 217, y: 355, w: 64, h: 128 },
  { group: "rightLimb", face: "down", x: 217, y: 485, w: 64, h: 64 },

  // 왼팔 (바지는 왼다리)
  { group: "leftLimb", face: "up", x: 308, y: 289, w: 64, h: 64 },
  { group: "leftLimb", face: "front", x: 308, y: 355, w: 64, h: 128 },
  { group: "leftLimb", face: "left", x: 374, y: 355, w: 64, h: 128 },
  { group: "leftLimb", face: "back", x: 440, y: 355, w: 64, h: 128 },
  { group: "leftLimb", face: "right", x: 506, y: 355, w: 64, h: 128 },
  { group: "leftLimb", face: "down", x: 308, y: 485, w: 64, h: 64 },
];

export function findPanel(group: PanelGroup, face: PanelFace): Panel {
  const panel = PANELS.find((p) => p.group === group && p.face === face);
  if (!panel) throw new Error(`패널 정의 누락: ${group}.${face}`);
  return panel;
}

const FACE_SHORT: Record<PanelFace, string> = {
  front: "앞",
  back: "뒤",
  left: "왼",
  right: "오",
  up: "위",
  down: "밑",
};

const FACE_FULL: Record<PanelFace, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽 면",
  right: "오른쪽 면",
  up: "윗면",
  down: "밑면",
};

function groupName(group: PanelGroup, kind: ClothingKind): string {
  if (group === "torso") return "몸통";
  const limb = kind === "pants" ? "다리" : "팔";
  return group === "rightLimb" ? `오른${limb}` : `왼${limb}`;
}

/** 템플릿 위에 표시할 짧은 이름과, 스크린리더/툴팁용 전체 이름 */
export function panelLabel(
  panel: Panel,
  kind: ClothingKind
): { short: string; full: string } {
  return {
    short: FACE_SHORT[panel.face],
    full: `${groupName(panel.group, kind)} ${FACE_FULL[panel.face]}`,
  };
}
