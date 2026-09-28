import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "블록핏: 로블록스 옷 업로드 전 검사기 (비공식)",
  description:
    "로블록스 셔츠, 바지, 티셔츠 파일을 올리기 전에 크기와 형식, 투명한 부분을 확인하세요. 파일은 서버로 보내지 않고 브라우저 안에서만 검사해요.",
};

/**
 * 확대 제한(maximumScale)은 걸지 않는다.
 * 막으면 시력이 낮은 사용자가 화면을 키울 수 없다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
