import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/** sitemap.xml. 페이지를 새로 만들면 여기에 추가한다 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: new URL("/", base).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/privacy", base).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
