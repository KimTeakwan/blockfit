import type { Metadata, Viewport } from "next";
import { SITE_NAME } from "@/config/site";
import "./globals.css";

/**
 * 사이트의 전체 주소.
 *
 * 카톡 같은 곳에서 링크 카드를 만들 때 대표 그림을 전체 주소로 찾아가기 때문에 필요하다.
 * 1) 직접 정한 주소(NEXT_PUBLIC_SITE_URL)가 있으면 그걸 쓰고,
 * 2) 없으면 Vercel이 배포할 때 알려주는 대표 주소를 쓰고,
 * 3) 둘 다 없으면(내 컴퓨터에서 개발 중) localhost를 쓴다.
 * 나중에 도메인을 사면 1번에 그 주소를 넣으면 된다.
 */
function siteUrl(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL("http://localhost:3000");
}

const TITLE = `${SITE_NAME}: 로블록스 옷 업로드 전 검사기 (비공식)`;
const DESCRIPTION =
  "로블록스 셔츠, 바지, 티셔츠 파일을 올리기 전에 크기와 형식을 검사하고 3D 모형에 입혀보세요. 틀린 파일은 자동으로 고쳐줘요. 로그인 없이 무료, 그림은 어디에도 보내지 않아요.";

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
