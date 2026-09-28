/**
 * 브라우저에서 만든 파일을 내려받게 한다.
 * 파일은 이 기기 안에서 만들어지고 서버를 거치지 않는다.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 내려받기가 시작될 시간을 준 뒤 메모리를 돌려준다
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("그림 파일을 만들지 못했어요")),
      "image/png"
    );
  });
}

/** 캔버스에 한글을 쓰기 전에 글꼴이 준비될 때까지 기다린다. 실패해도 기본 글꼴로 그린다 */
export async function ensureFonts(fonts: string[]) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await Promise.allSettled(fonts.map((f) => document.fonts.load(f)));
}
