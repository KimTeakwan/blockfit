/**
 * 사이트의 전체 주소. 서버에서만 쓴다(메타데이터, robots.txt, sitemap.xml).
 *
 * 카톡 같은 곳에서 링크 카드를 만들 때 대표 그림을 전체 주소로 찾아가고,
 * 검색엔진도 사이트 지도의 주소를 전체 주소로 읽기 때문에 필요하다.
 * 1) 직접 정한 주소(NEXT_PUBLIC_SITE_URL)가 있으면 그걸 쓰고,
 * 2) 없으면 Vercel이 배포할 때 알려주는 대표 주소를 쓰고,
 * 3) 둘 다 없으면(내 컴퓨터에서 개발 중) localhost를 쓴다.
 * 나중에 도메인을 사면 1번에 그 주소를 넣으면 된다.
 */
export function siteUrl(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL("http://localhost:3000");
}
