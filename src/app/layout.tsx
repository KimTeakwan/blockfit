import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/config/site";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

const TITLE = `${SITE_NAME}: 로블록스 옷 업로드 전 검사기 (비공식)`;
const DESCRIPTION = SITE_DESCRIPTION;

/**
 * 링크 카드(오픈 그래프)의 대표 그림은 app/opengraph-image.png 파일을
 * Next.js가 자동으로 찾아서 넣는다. 여기에는 제목과 설명만 적는다.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
