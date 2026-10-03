"use client";

import { useRef, useState } from "react";
import {
  ClothingKind,
  PANELS,
  TEMPLATE_SIZE,
  panelLabel,
} from "@/config/clothing";

interface LoadedView {
  objectUrl: string;
  width: number;
  height: number;
}

/** 올렸지만 그림을 열지 못한 파일. 너무 커서 일부러 안 열었거나, 망가져서 못 열었다 */
interface UnopenedView {
  fileName: string;
  tooLarge: boolean;
}

interface Props {
  kind: ClothingKind;
  loaded: LoadedView | null;
  unopened: UnopenedView | null;
  showPanels: boolean;
  busy: boolean;
  onFile: (file: File) => void;
}

/**
 * 파일을 놓는 자리.
 *
 * 놓는 칸 자체를 템플릿 비율(585 × 559)로 만들어서,
 * 파일을 올리기 전부터 "이 크기에 맞춰야 한다"는 걸 보여준다.
 * 올린 뒤에는 투명한 부분이 체커 무늬로 보이고,
 * 패널 선을 겹쳐 어느 칸이 몸의 어디에 가는지 알려준다.
 *
 * 그림을 열지 못한 파일도 판에 파일 이름을 남긴다. 빈 판으로 돌아가면
 * 아이들이 "안 올라갔나?" 하고 같은 파일을 계속 다시 올리게 된다.
 */
export default function DropMat({
  kind,
  loaded,
  unopened,
  showPanels,
  busy,
  onFile,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isTshirt = kind === "tshirt";
  const canOverlay =
    !isTshirt &&
    loaded !== null &&
    loaded.width === TEMPLATE_SIZE.width &&
    loaded.height === TEMPLATE_SIZE.height;

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="mat">
      <div className="mat-ruler mat-ruler-top" aria-hidden="true">
        {isTshirt ? "정사각형" : `${TEMPLATE_SIZE.width} px`}
      </div>
      {!isTshirt && (
        <div className="mat-ruler mat-ruler-side" aria-hidden="true">
          {`${TEMPLATE_SIZE.height} px`}
        </div>
      )}

      <div
        className="mat-canvas"
        data-kind={kind}
        data-dragging={dragging}
        data-loaded={loaded !== null}
        data-unopened={unopened !== null}
        role="button"
        tabIndex={0}
        aria-label="검사할 옷 그림 고르기"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {loaded ? (
          <>
            {/* 사용자가 고른 로컬 파일을 그대로 보여주므로 img를 쓴다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={loaded.objectUrl}
              alt="고른 옷 그림"
              className="mat-image"
            />
            {canOverlay &&
              showPanels &&
              PANELS.map((panel) => {
                const label = panelLabel(panel, kind);
                return (
                  <div
                    key={`${panel.group}-${panel.face}`}
                    className="mat-panel"
                    title={label.full}
                    style={{
                      left: `${(panel.x / TEMPLATE_SIZE.width) * 100}%`,
                      top: `${(panel.y / TEMPLATE_SIZE.height) * 100}%`,
                      width: `${(panel.w / TEMPLATE_SIZE.width) * 100}%`,
                      height: `${(panel.h / TEMPLATE_SIZE.height) * 100}%`,
                    }}
                  >
                    <span className="mat-panel-label">{label.short}</span>
                  </div>
                );
              })}
          </>
        ) : unopened && !busy ? (
          <div className="mat-empty">
            <p className="mat-empty-main">
              {unopened.tooLarge ? "너무 커서 열지 않았어요" : "그림을 열 수 없어요"}
            </p>
            <p className="mat-file-name">{unopened.fileName}</p>
            <p className="mat-empty-sub">
              검사 결과를 확인하고, 다른 파일을 고르려면 여기를 다시 눌러요.
            </p>
          </div>
        ) : (
          <div className="mat-empty">
            <p className="mat-empty-main">
              {busy ? "그림을 여는 중이에요" : "여기를 눌러 옷 그림을 골라요"}
            </p>
            <p className="mat-empty-sub">
              컴퓨터라면 파일을 끌어다 놓거나 Ctrl+V로 붙여넣어도 돼요. PNG나
              JPG 그림만 돼요.
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // 같은 파일을 다시 골라도 onChange가 불리도록 비운다
          e.target.value = "";
        }}
      />
    </div>
  );
}
