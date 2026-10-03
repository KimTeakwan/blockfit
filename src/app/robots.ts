import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/**
 * robots.txt. 검색엔진에 사이트 전체를 열어두고 사이트 지도 위치를 알려준다.
 * /api는 숫자 세는 주소라 검색 결과에 나올 이유가 없어서 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
