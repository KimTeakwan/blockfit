"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import FrontBackPreview from "@/components/FrontBackPreview";
import SkinPicker from "@/components/SkinPicker";
import { PanelFace, PanelGroup, findPanel } from "@/config/clothing";
import { DEFAULT_SKIN } from "@/config/avatar";
import {
  BodyPart,
  Outfit,
  drawLayers,
  isOutfitEmpty,
  layersFor,
} from "@/lib/outfit";
import { ShareResult, buildShareCard, shareCard } from "@/lib/shareCard";

/**
 * 돌려볼 수 있는 3D 블록 모형.
 *
 * 앞/뒤 그림만으로는 옆면, 윗면, 밑면이 보이지 않는다.
 * 옷이 이상하게 나오는 건 대부분 앞면과 옆면이 만나는 이음매라서,
 * 돌려가며 이음매를 확인할 수 있어야 한다.
 *
 * 몸통과 팔다리는 각진 상자다. 비율(몸통 2:2:1, 팔다리 1:2:1)은 옷 본 칸 크기에서 나온 값이다.
 * 옷 그림이 휘어 보이지 않아야 이음매를 확인할 수 있어서 모서리를 둥글리지 않는다.
 * 머리는 로블록스 기본 아바타처럼 모서리가 둥근 원통으로 만들어 "내 캐릭터"처럼 보이게 하되,
 * 얼굴은 그리지 않는다. 특정 게임 캐릭터의 얼굴을 따라 그리지 않고, 옷이 몸 어디에 가는지만 보여준다.
 *
 * 칸과 상자 면의 대응:
 *   three.js 상자의 면 순서는 +x, -x, +y, -y, +z, -z 이고, 각 면의 그림은
 *   바깥에서 봤을 때 똑바로 선 방향으로 붙는다. 모형은 +z를 바라보므로
 *   +x가 모형의 왼쪽이다. 옷 본의 칸들도 "바깥에서 본 모습"으로 그려져 있고
 *   위 칸의 아랫변이 앞 칸과, 아래 칸의 윗변이 앞 칸과 맞닿는다.
 *   이 두 규칙이 일치해서 칸을 뒤집거나 돌리지 않고 그대로 붙이면 된다.
 *
 * 셔츠, 바지, 티셔츠를 한꺼번에 겹쳐 입힌다. 겹치는 순서는 lib/outfit.ts에 있다.
 * 비워둔 곳으로는 고른 피부색이 보인다.
 *
 * 3D를 쓸 수 없는 기기에서는 앞/뒤 그림으로 대신 보여준다.
 */

type View = "front" | "right" | "back" | "left";

const PARTS: {
  name: BodyPart;
  size: [number, number, number];
  pos: [number, number, number];
}[] = [
  { name: "torso", size: [2, 2, 1], pos: [0, 3, 0] },
  // 모형이 +z를 바라보므로 모형의 오른쪽은 -x다
  { name: "rightArm", size: [1, 2, 1], pos: [-1.5, 3, 0] },
  { name: "leftArm", size: [1, 2, 1], pos: [1.5, 3, 0] },
  { name: "rightLeg", size: [1, 2, 1], pos: [-0.5, 1, 0] },
  { name: "leftLeg", size: [1, 2, 1], pos: [0.5, 1, 0] },
];

/** 머리. 몸통(너비 2) 위에 바로 얹히는, 모서리가 둥근 원통 */
const HEAD = { radius: 0.6, height: 1.2, corner: 0.2, y: 4.6 };

/** three.js 상자의 면 순서(+x, -x, +y, -y, +z, -z)에 맞춘 칸 이름 */
const FACE_ORDER: PanelFace[] = ["left", "right", "up", "down", "front", "back"];

/**
 * 조명 대신 면마다 고정된 밝기를 준다.
 * 조명을 쓰면 옷 색이 실제보다 어둡거나 밝게 보인다.
 * 앞면은 원래 색 그대로 보여서, 사용자가 색을 정확히 판단할 수 있다.
 */
const FACE_SHADE: Record<PanelFace, number> = {
  front: 1,
  up: 1,
  back: 0.94,
  left: 0.84,
  right: 0.84,
  down: 0.72,
};

/**
 * 오른쪽·왼쪽은 보는 사람이 아니라 모형 기준이다.
 * 옷 본의 칸 이름(R = 오른쪽 면)과 같은 기준이라 헷갈리지 않는다.
 * 모형을 +90도 돌리면 모형의 오른쪽 면(-x)이, -90도 돌리면 왼쪽 면(+x)이 앞으로 온다.
 */
const VIEW_ANGLE: Record<View, number> = {
  front: 0,
  right: Math.PI / 2,
  back: Math.PI,
  left: -Math.PI / 2,
};

const VIEWS: { key: View; label: string; full: string }[] = [
  { key: "front", label: "앞", full: "앞모습" },
  { key: "right", label: "오른쪽", full: "모형의 오른쪽 옆면" },
  { key: "back", label: "뒤", full: "뒷모습" },
  { key: "left", label: "왼쪽", full: "모형의 왼쪽 옆면" },
];

/** 공유 사진에 쓸 각도. 앞면과 왼쪽 옆면이 함께 보이게 비스듬히 돌린다 */
const SNAPSHOT_ANGLE = -0.45;

const EMPTY: Outfit = { shirt: null, pants: null, tshirt: null };

function shadeColor(face: PanelFace): THREE.Color {
  const v = FACE_SHADE[face];
  return new THREE.Color(v, v, v);
}

/** 모서리선은 피부색보다 조금 어둡게 해서 어떤 피부색에서도 보이게 한다 */
function edgeColorFor(skin: string): THREE.Color {
  return new THREE.Color(skin).multiplyScalar(0.7);
}

/** 면 그림의 크기. 칸 크기의 2배로 그려서 티셔츠 그림도 또렷하게 보이게 한다 */
function faceSize(part: BodyPart, face: PanelFace): { w: number; h: number } {
  const group: PanelGroup = part === "torso" ? "torso" : "rightLimb";
  const p = findPanel(group, face);
  return { w: p.w * 2, h: p.h * 2 };
}

function makeTexture(
  w: number,
  h: number,
  base: string,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // 비어 있는 곳에 피부색이 비치도록 먼저 바탕을 칠한다
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    draw(ctx);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // 픽셀 그림이 뭉개지지 않게 가장 가까운 픽셀을 그대로 쓴다
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

function plainFace(face: PanelFace, base: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(base).multiply(shadeColor(face)),
  });
}

/**
 * 머리 모양. 옆에서 본 윤곽(아래 모서리 1/4 원 → 옆면 → 위 모서리 1/4 원)을
 * 세로축으로 한 바퀴 돌려 만든다.
 *
 * 둥근 면은 상자처럼 면마다 밝기를 정할 수 없어서, 꼭짓점마다 방향에 따라
 * FACE_SHADE를 섞은 밝기를 준다. 그래서 상자들과 같은 빛을 받는 것처럼 보인다.
 */
function makeHeadGeometry(): THREE.LatheGeometry {
  const { radius: r, height, corner: c } = HEAD;
  const h = height / 2;
  const STEPS = 8;
  const points = [new THREE.Vector2(0, -h)];
  for (let i = 0; i <= STEPS; i++) {
    const a = -Math.PI / 2 + (i / STEPS) * (Math.PI / 2);
    points.push(new THREE.Vector2(r - c + c * Math.cos(a), -h + c + c * Math.sin(a)));
  }
  for (let i = 0; i <= STEPS; i++) {
    const a = (i / STEPS) * (Math.PI / 2);
    points.push(new THREE.Vector2(r - c + c * Math.cos(a), h - c + c * Math.sin(a)));
  }
  points.push(new THREE.Vector2(0, h));

  const geometry = new THREE.LatheGeometry(points, 48);
  const normals = geometry.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  for (let i = 0; i < normals.count; i++) {
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);
    // 방향 성분의 제곱은 합이 1이라, 면 밝기를 방향 비율대로 섞는 가중치로 쓸 수 있다
    const shade =
      nx * nx * FACE_SHADE.left +
      ny * ny * (ny > 0 ? FACE_SHADE.up : FACE_SHADE.down) +
      nz * nz * (nz > 0 ? FACE_SHADE.front : FACE_SHADE.back);
    colors.set([shade, shade, shade], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function materialsFor(
  part: BodyPart,
  outfit: Outfit,
  skin: string
): THREE.MeshBasicMaterial[] {
  return FACE_ORDER.map((face) => {
    const layers = layersFor(part, face, outfit);
    if (layers.length === 0) return plainFace(face, skin);

    const { w, h } = faceSize(part, face);
    return new THREE.MeshBasicMaterial({
      color: shadeColor(face),
      map: makeTexture(w, h, skin, (ctx) => drawLayers(ctx, layers, 0, 0, w, h)),
    });
  });
}

type PartMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial[]>;

function disposeMaterials(mesh: PartMesh) {
  mesh.material.forEach((m) => {
    m.map?.dispose();
    m.dispose();
  });
}

interface Motion {
  angle: number;
  target: number | null;
  auto: boolean;
  dragging: boolean;
  lastX: number;
}

interface Stage {
  meshes: Record<BodyPart, PartMesh>;
  headMaterial: THREE.MeshBasicMaterial;
  edgeMaterial: THREE.LineBasicMaterial;
  motion: Motion;
  goTo: (view: View) => void;
  /** 지정한 크기로 한 장 찍어서 캔버스로 돌려준다 */
  snapshot: (w: number, h: number) => HTMLCanvasElement;
}

type ShareState = "idle" | "working" | "failed" | ShareResult;

const SHARE_MESSAGE: Record<ShareState, string> = {
  idle: "옷을 입힌 모형 사진과 블록핏 주소가 같이 가요.",
  working: "사진을 만들고 있어요.",
  shared: "보냈어요! 친구도 블록핏에서 입혀볼 수 있어요.",
  saved:
    "사진을 저장하고 블록핏 주소를 복사했어요. 친구에게 사진과 주소를 같이 보내주세요.",
  cancelled: "옷을 입힌 모형 사진과 블록핏 주소가 같이 가요.",
  failed: "사진을 만들지 못했어요. 잠시 후 다시 해보세요.",
};

interface Props {
  outfit: Outfit;
  skin: string;
  onSkinChange: (color: string) => void;
}

export default function AvatarPreview({ outfit, skin, onSkinChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");

  // 장면은 한 번만 만든다. 옷이나 피부색이 바뀌면 아래 효과에서 겉면만 갈아입힌다
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    // 세로로 쓸어내리면 화면이 스크롤되고, 가로로 끌면 모형이 돈다
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "grab";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 3.4, 11);
    camera.lookAt(0, 2.5, 0);

    const figure = new THREE.Group();
    scene.add(figure);

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: edgeColorFor(DEFAULT_SKIN),
    });
    const edgeGeometries: THREE.EdgesGeometry[] = [];
    const meshes = {} as Record<BodyPart, PartMesh>;

    // 머리는 옷을 입지 않으니 피부색 하나만 칠한다. 둥근 면이라 모서리선은 긋지 않는다
    const headGeometry = makeHeadGeometry();
    const headMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(DEFAULT_SKIN),
      vertexColors: true,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, HEAD.y, 0);
    figure.add(head);

    for (const part of PARTS) {
      const geometry = new THREE.BoxGeometry(...part.size);
      const mesh: PartMesh = new THREE.Mesh(
        geometry,
        materialsFor(part.name, EMPTY, DEFAULT_SKIN)
      );
      mesh.position.set(...part.pos);

      // 상자 모서리선. 맨몸일 때도 부위가 구분되어 보이게 한다
      const edges = new THREE.EdgesGeometry(geometry);
      edgeGeometries.push(edges);
      mesh.add(new THREE.LineSegments(edges, edgeMaterial));

      figure.add(mesh);
      meshes[part.name] = mesh;
    }

    const motion: Motion = {
      angle: 0,
      target: null,
      // 파일을 올리기 전에만 천천히 돌려 "여기에 입혀진다"는 걸 보여준다
      auto: !reducedMotion,
      dragging: false,
      lastX: 0,
    };

    const goTo = (next: View) => {
      const desired = VIEW_ANGLE[next];
      // 현재 각도에서 가장 가까운 쪽으로 돌도록 한 바퀴 단위로 맞춘다
      const turns = Math.round((motion.angle - desired) / (Math.PI * 2));
      motion.target = desired + turns * Math.PI * 2;
      motion.auto = false;
    };

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    /**
     * 공유용으로 한 장 찍는다. 크기와 각도를 잠깐 바꿔 그린 뒤 바로 복사하고,
     * 화면에 보이던 상태로 되돌린다. 같은 순간에 복사해야 그림이 비지 않는다.
     */
    const snapshot = (w: number, h: number): HTMLCanvasElement => {
      const prevRatio = renderer.getPixelRatio();
      const prevAngle = figure.rotation.y;

      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      figure.rotation.y = SNAPSHOT_ANGLE;
      renderer.render(scene, camera);

      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      out.getContext("2d")?.drawImage(canvas, 0, 0);

      renderer.setPixelRatio(prevRatio);
      figure.rotation.y = prevAngle;
      resize();
      return out;
    };

    stageRef.current = {
      meshes,
      headMaterial,
      edgeMaterial,
      motion,
      goTo,
      snapshot,
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const onDown = (e: PointerEvent) => {
      motion.dragging = true;
      motion.auto = false;
      motion.target = null;
      motion.lastX = e.clientX;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
      setView(null);
    };
    const onMove = (e: PointerEvent) => {
      if (!motion.dragging) return;
      motion.angle += (e.clientX - motion.lastX) * 0.012;
      motion.lastX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      motion.dragging = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (motion.target !== null) {
        if (reducedMotion) {
          motion.angle = motion.target;
          motion.target = null;
        } else {
          motion.angle += (motion.target - motion.angle) * Math.min(1, dt * 10);
          if (Math.abs(motion.target - motion.angle) < 0.001) {
            motion.angle = motion.target;
            motion.target = null;
          }
        }
      } else if (motion.auto && !motion.dragging) {
        motion.angle += dt * 0.5;
      }

      figure.rotation.y = motion.angle;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      (Object.values(meshes) as PartMesh[]).forEach((mesh) => {
        disposeMaterials(mesh);
        mesh.geometry.dispose();
      });
      edgeGeometries.forEach((g) => g.dispose());
      edgeMaterial.dispose();
      headGeometry.dispose();
      headMaterial.dispose();
      renderer.dispose();
      if (canvas.parentElement === host) host.removeChild(canvas);
      stageRef.current = null;
    };
  }, []);

  // 옷이나 피부색이 바뀌면 겉면만 새로 입힌다
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    for (const part of PARTS) {
      const mesh = stage.meshes[part.name];
      disposeMaterials(mesh);
      mesh.material = materialsFor(part.name, outfit, skin);
    }
    stage.edgeMaterial.color.copy(edgeColorFor(skin));
    stage.headMaterial.color.set(skin);
  }, [outfit, skin]);

  // 새 옷이 입혀지면 앞모습으로 돌려서 보여준다. 피부색만 바꿀 때는 돌리지 않는다
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || isOutfitEmpty(outfit)) return;
    stage.goTo("front");
    setView("front");
    setShareState("idle");
  }, [outfit]);

  async function handleShare() {
    const stage = stageRef.current;
    if (!stage) return;
    setShareState("working");
    try {
      const shot = stage.snapshot(900, 1000);
      const blob = await buildShareCard(shot, window.location.origin);
      setShareState(await shareCard(blob, window.location.origin));
    } catch (err) {
      console.error("공유 사진 만들기 실패:", err);
      setShareState("failed");
    }
  }

  const empty = isOutfitEmpty(outfit);

  if (failed) {
    return !empty ? (
      <>
        <FrontBackPreview outfit={outfit} skin={skin} />
        <SkinPicker value={skin} onChange={onSkinChange} />
      </>
    ) : (
      <p className="avatar-fallback">
        이 기기에서는 돌려보는 미리보기를 쓸 수 없어요. 옷 그림을 올리면 앞뒤
        모습을 보여드릴게요.
      </p>
    );
  }

  return (
    <div>
      <div
        ref={hostRef}
        className="avatar-canvas"
        role="img"
        aria-label={
          empty ? "아직 옷을 입히지 않은 블록 모형" : "옷을 입힌 블록 모형"
        }
      />
      <div className="avatar-views" role="group" aria-label="보는 방향">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className="avatar-view"
            aria-pressed={view === v.key}
            aria-label={v.full}
            title={v.full}
            onClick={() => {
              stageRef.current?.goTo(v.key);
              setView(v.key);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="avatar-views-hint">오른쪽과 왼쪽은 모형 기준이에요.</p>

      <SkinPicker value={skin} onChange={onSkinChange} />

      {!empty && (
        <div className="share">
          <button
            type="button"
            className="button-primary"
            onClick={handleShare}
            disabled={shareState === "working"}
          >
            {shareState === "working" ? "사진 만드는 중이에요" : "친구에게 보여주기"}
          </button>
          <p className="share-note" aria-live="polite">
            {SHARE_MESSAGE[shareState]}
          </p>
        </div>
      )}
    </div>
  );
}
