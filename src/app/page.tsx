"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import KindSelector, { SlotStatus } from "@/components/KindSelector";
import DropMat from "@/components/DropMat";
import CheckList from "@/components/CheckList";
import ManualChecklist from "@/components/ManualChecklist";
import BeginnerGuide from "@/components/BeginnerGuide";
import DressedCounter from "@/components/DressedCounter";
import AutoFixPanel from "@/components/AutoFixPanel";
import MatStatus from "@/components/MatStatus";
import TemplateDownloadButtons from "@/components/TemplateDownloadButtons";
import { DEFAULT_SKIN } from "@/config/avatar";
import {
  CLOTHING_KINDS,
  ClothingKind,
  TEMPLATE_SIZE,
  UPLOAD_INFO,
} from "@/config/clothing";
import { detectFormat, ImageFormat, readDimensions } from "@/lib/fileSignature";
import {
  CheckResult,
  DecodedImage,
  TooLarge,
  decodeImage,
  isTemplateSize,
  runChecks,
} from "@/lib/imageChecks";
import { MAX_DECODE_PIXELS, MAX_FILE_BYTES, OPERATOR } from "@/config/site";
import { Outfit, isOutfitEmpty } from "@/lib/outfit";
import { fetchDressedCount, reportDressed } from "@/lib/counter";
import { applyFix, fixedFileName, planFix } from "@/lib/autoFix";

/**
 * 3D 모형은 라이브러리가 무거워서 첫 화면과 따로 불러온다.
 * 검사기 본체는 바로 뜨고, 모형은 뒤이어 나타난다.
 * 브라우저에서만 도는 코드라 서버에서는 그리지 않는다.
 */
const AvatarPreview = dynamic(() => import("@/components/AvatarPreview"), {
  ssr: false,
  loading: () => <div className="avatar-canvas" aria-hidden="true" />,
});

/**
 * 업로드 전 검사기.
 *
 * 로블록스는 한 캐릭터에 셔츠, 바지, 티셔츠를 동시에 입힐 수 있다.
 * 그래서 옷마다 칸을 따로 두고, 각 칸에 파일을 올려 따로 검사한 뒤
 * 모형에는 올린 옷을 전부 겹쳐 입힌다.
 *
 * 모든 처리는 브라우저 안에서 끝난다. 파일을 서버로 보내지 않고,
 * 로그인도 받지 않는다. 로블록스 관련 사기 사이트는 대부분
 * 로그인을 요구해 계정을 훔치기 때문에, 받지 않는 것 자체가 신뢰의 근거다.
 */

interface Loaded {
  fileName: string;
  format: ImageFormat;
  image: DecodedImage | null;
  objectUrl: string;
  /** 자동으로 고친 파일이면 고치기 전 형식. 직접 올린 파일이면 null */
  fixedFrom: ImageFormat | null;
  /** 너무 커서 열지 않은 파일이면 그 크기. 아니면 null */
  tooLarge: TooLarge | null;
}

type Slots = Record<ClothingKind, Loaded | null>;

const EMPTY_SLOTS: Slots = { shirt: null, pants: null, tshirt: null };

/** 칸에서 빠지는 파일이 쓰던 메모리를 돌려준다 */
function release(loaded: Loaded) {
  URL.revokeObjectURL(loaded.objectUrl);
  loaded.image?.bitmap.close();
}

/** 모형에 입힐 수 있는지. 셔츠·바지는 크기가 맞아야 칸 위치가 맞는다 */
function wearable(kind: ClothingKind, loaded: Loaded | null): ImageBitmap | null {
  const image = loaded?.image;
  if (!image) return null;
  if (kind !== "tshirt" && !isTemplateSize(image)) return null;
  return image.bitmap;
}

function toStatus(results: CheckResult[] | null): SlotStatus {
  if (!results) return { state: "empty" };
  const fails = results.filter((r) => r.status === "fail").length;
  const warns = results.filter((r) => r.status === "warn").length;
  if (fails > 0) return { state: "fail", count: fails };
  if (warns > 0) return { state: "warn", count: warns };
  return { state: "pass" };
}

export default function HomePage() {
  const [active, setActive] = useState<ClothingKind>("shirt");
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS);
  const [busy, setBusy] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [skin, setSkin] = useState(DEFAULT_SKIN);
  const [dressedCount, setDressedCount] = useState<number | null>(null);

  // 첫 화면에 "현재까지 아바타를 꾸민 인원"을 불러온다
  useEffect(() => {
    fetchDressedCount().then(setDressedCount);
  }, []);

  // 파일을 바꾸거나 뺄 때 이전 파일을 정리하려고 최신 칸 상태를 들고 있는다
  const slotsRef = useRef<Slots>(EMPTY_SLOTS);
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  // 화면을 떠날 때 남아 있는 파일을 모두 정리한다
  useEffect(() => {
    return () => {
      Object.values(slotsRef.current).forEach((l) => l && release(l));
    };
  }, []);

  const putSlot = useCallback((kind: ClothingKind, next: Loaded | null) => {
    const old = slotsRef.current[kind];
    setSlots((prev) => ({ ...prev, [kind]: next }));
    if (old && old !== next) release(old);
  }, []);

  /**
   * 파일을 열어서 칸에 넣는다.
   * 직접 올린 파일과 자동으로 고친 파일이 같은 길을 타서, 고친 파일도 똑같이 재검사된다.
   */
  const loadIntoSlot = useCallback(
    async (kind: ClothingKind, file: File, fixedFrom: ImageFormat | null) => {
      const format = await detectFormat(file);

      // 열기 전에 용량과 가로세로부터 본다. 너무 크면 기기가 멈출 수 있어 열지 않는다
      let tooLarge: TooLarge | null = null;
      if (file.size > MAX_FILE_BYTES) {
        tooLarge = { bytes: file.size, width: null, height: null };
      } else {
        const dims = await readDimensions(file);
        if (dims && dims.width * dims.height > MAX_DECODE_PIXELS) {
          tooLarge = { bytes: file.size, width: dims.width, height: dims.height };
        }
      }

      let image: DecodedImage | null = null;
      if (!tooLarge) {
        try {
          image = await decodeImage(file);
        } catch {
          // 열 수 없는 파일은 검사 결과에서 "그림을 열 수 없어요"로 안내한다
          image = null;
        }
      }

      putSlot(kind, {
        fileName: file.name,
        format,
        image,
        objectUrl: URL.createObjectURL(file),
        fixedFrom,
        tooLarge,
      });
    },
    [putSlot]
  );

  const handleFile = useCallback(
    async (file: File) => {
      // 파일을 여는 동안 탭을 바꿔도 원래 칸에 들어가게 미리 기억한다
      const kind = active;
      setBusy(true);
      try {
        await loadIntoSlot(kind, file, null);
      } finally {
        setBusy(false);
      }
    },
    [active, loadIntoSlot]
  );

  const handleAutoFix = useCallback(async () => {
    const kind = active;
    const loaded = slotsRef.current[kind];
    if (!loaded?.image) return;

    const plan = planFix(kind, loaded.format, loaded.image);
    if (plan.steps.length === 0) return;

    setBusy(true);
    try {
      const blob = await applyFix(loaded.image, plan);
      const file = new File([blob], fixedFileName(loaded.fileName), {
        type: "image/png",
      });
      await loadIntoSlot(kind, file, loaded.format);
    } catch (err) {
      console.error("자동으로 고치기 실패:", err);
    } finally {
      setBusy(false);
    }
  }, [active, loadIntoSlot]);

  // 칸마다 자기 옷 종류 기준으로 따로 검사한다
  const slotResults = useMemo(() => {
    const result = {} as Record<ClothingKind, CheckResult[] | null>;
    for (const { kind } of CLOTHING_KINDS) {
      const loaded = slots[kind];
      result[kind] = loaded
        ? runChecks({
            kind,
            format: loaded.format,
            image: loaded.image,
            tooLarge: loaded.tooLarge,
          })
        : null;
    }
    return result;
  }, [slots]);

  const statuses = useMemo(() => {
    const result = {} as Record<ClothingKind, SlotStatus>;
    for (const { kind } of CLOTHING_KINDS) {
      result[kind] = toStatus(slotResults[kind]);
    }
    return result;
  }, [slotResults]);

  // 모형에 입힐 옷. 칸이 바뀔 때만 새로 만들어 모형이 불필요하게 다시 입지 않게 한다
  const outfit = useMemo<Outfit>(
    () => ({
      shirt: wearable("shirt", slots.shirt),
      pants: wearable("pants", slots.pants),
      tshirt: wearable("tshirt", slots.tshirt),
    }),
    [slots]
  );

  // 모형에 처음으로 옷이 입혀지는 순간 한 번 센다.
  // 파일만 열어보고 입혀보지 못한 경우(크기가 틀린 셔츠 등)는 세지 않는다.
  const wearing = !isOutfitEmpty(outfit);
  useEffect(() => {
    if (!wearing) return;
    reportDressed().then((count) => {
      if (count !== null) setDressedCount(count);
    });
  }, [wearing]);

  const worn = CLOTHING_KINDS.filter((k) => outfit[k.kind]).map((k) => k.label);
  const notWorn = CLOTHING_KINDS.filter(
    (k) => slots[k.kind] && !outfit[k.kind]
  ).map((k) => k.label);

  const avatarNote = (() => {
    if (worn.length === 0 && notWorn.length === 0) {
      return "셔츠, 바지, 티셔츠를 각각 올리면 한꺼번에 입혀볼 수 있어요. 끌어서 돌려볼 수도 있어요.";
    }
    const parts: string[] = [];
    if (worn.length > 0) {
      parts.push(`지금 입은 옷: ${worn.join(", ")}.`);
      parts.push("바지 위에 셔츠, 그 위에 티셔츠가 입혀지고, 비워둔 곳으로는 아래 옷이나 피부가 보여요.");
    }
    if (notWorn.length > 0) {
      parts.push(`${notWorn.join(", ")}는 크기가 맞지 않아서 입히지 않았어요.`);
    }
    return parts.join(" ");
  })();

  const current = slots[active];
  const currentImage = current?.image ?? null;
  const currentResults = slotResults[active];
  const currentPlan = current
    ? planFix(active, current.format, current.image)
    : null;
  const selected = CLOTHING_KINDS.find((k) => k.kind === active);

  return (
    <div className="site">
      <header className="brand">
        <p className="brand-name">블록핏</p>
        <p className="brand-note">로블록스 옷 업로드 전 검사기, 비공식 도구</p>
      </header>

      <main>
        <section className="hero">
          <h1 className="hero-title">올리기 전에 먼저 입혀보세요</h1>
          <p className="hero-text">
            로블록스에 옷을 올릴 때마다 {UPLOAD_INFO.feeRobux} 로벅스가 들어요.
            크기가 틀린 파일을 올리면 로벅스만 쓰고 옷이 이상하게 나와요.
            올리기 전에 여기서 먼저 확인하세요.
          </p>
          <p className="hero-text">
            그림은 어디에도 보내지 않고 이 기기 안에서만 확인해요. 로그인도
            필요 없어요.
          </p>
          <p className="hero-text">
            <a href="#guide">처음 만들어본다면 옷 만드는 순서부터 보세요</a>
          </p>
          <DressedCounter count={dressedCount} />
        </section>

        <p className="kind-hint">
          그림으로 만드는 셔츠, 바지, 티셔츠를 칸마다 따로 올려요. 한
          캐릭터에 셋 다 같이 입힐 수 있어요.
        </p>
        <KindSelector value={active} statuses={statuses} onChange={setActive} />

        <div className="workspace">
          <div>
            <DropMat
              kind={active}
              loaded={
                current && currentImage
                  ? {
                      objectUrl: current.objectUrl,
                      width: currentImage.width,
                      height: currentImage.height,
                    }
                  : null
              }
              unopened={
                current && !currentImage
                  ? { fileName: current.fileName, tooLarge: !!current.tooLarge }
                  : null
              }
              showPanels={showPanels}
              busy={busy}
              onFile={handleFile}
            />

            <MatStatus
              status={statuses[active]}
              autoFix={
                current?.fixedFrom === null && currentPlan
                  ? currentPlan.steps.length === 0
                    ? null
                    : currentPlan.blocked
                    ? "some"
                    : "all"
                  : null
              }
            />

            {active !== "tshirt" && (
              <p className="mat-legend">
                위쪽 가운데 칸들은 몸통이에요. 아래 왼쪽 칸들은{" "}
                {active === "pants" ? "오른다리" : "오른팔"}, 아래 오른쪽 칸들은{" "}
                {active === "pants" ? "왼다리" : "왼팔"}이 돼요.
              </p>
            )}

            {!current && active !== "tshirt" && (
              <div className="mat-help">
                <p className="mat-legend">
                  아직 옷 본이 없다면, 칸 이름이 한글로 적힌 옷 본을 받아서 그
                  위에 그려보세요.
                </p>
                <TemplateDownloadButtons kinds={[active]} />
              </div>
            )}

            {current && (
              <>
                <div className="mat-tools">
                  {active !== "tshirt" &&
                  currentImage &&
                  isTemplateSize(currentImage) ? (
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={showPanels}
                        onChange={(e) => setShowPanels(e.target.checked)}
                      />
                      칸 선 보기
                    </label>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => putSlot(active, null)}
                  >
                    이 {selected?.label} 빼기
                  </button>
                </div>
                <p className="mat-legend">
                  다른 그림으로 바꾸려면 초록 판을 다시 누르세요.
                </p>
              </>
            )}
          </div>

          <div>
            <section className="avatar-stage">
              <h2 className="section-title">입혀본 모습</h2>
              <AvatarPreview
                outfit={outfit}
                skin={skin}
                onSkinChange={setSkin}
              />
              <p className="avatar-note">{avatarNote}</p>
            </section>

            {current && currentResults && currentPlan ? (
              <>
                <h2 className="section-title results-anchor" id="results">
                  {selected?.label} 검사 결과
                </h2>
                <AutoFixPanel
                  plan={currentPlan}
                  fixedFrom={current.fixedFrom}
                  downloadUrl={current.objectUrl}
                  downloadName={current.fileName}
                  busy={busy}
                  onFix={handleAutoFix}
                />
                <CheckList results={currentResults} />
                {/* 파일이 바뀌면 직접 확인 목록도 처음부터 다시 체크하게 한다 */}
                <ManualChecklist key={`${active}-${current.objectUrl}`} />
              </>
            ) : (
              <section>
                <h2 className="section-title">
                  {selected?.label} 그림에서 확인해주는 것
                </h2>
                <ul className="waiting-list">
                  <li>PNG나 JPG 그림 파일이 맞는지</li>
                  {active === "tshirt" ? (
                    <li>네모 칸(정사각형)이고 너무 작지 않은지</li>
                  ) : (
                    <li>
                      크기가 딱 가로 {TEMPLATE_SIZE.width}, 세로{" "}
                      {TEMPLATE_SIZE.height}인지
                    </li>
                  )}
                  <li>피부가 보여야 할 곳이 비어 있는지</li>
                  {active !== "tshirt" && <li>몸통 앞뒤 칸에 그림이 있는지</li>}
                </ul>
              </section>
            )}
          </div>
        </div>

        <BeginnerGuide />
      </main>

      <footer className="footer">
        <p className="footer-links">
          <Link href="/privacy">개인정보처리방침</Link>
          {OPERATOR.email && (
            <a href={`mailto:${OPERATOR.email}`}>문의하기</a>
          )}
        </p>
        <p>
          블록핏은 로블록스와 관련 없는 비공식 도구예요. Roblox는 Roblox
          Corporation의 상표예요.
        </p>
        <p>
          업로드 비용과 규격은 {UPLOAD_INFO.checkedAt} 공식 문서를 기준으로
          했어요.
        </p>
      </footer>
    </div>
  );
}
