import { FAQ } from "@/components/BeginnerGuide";
import { SITE_DESCRIPTION, SITE_NAME } from "@/config/site";

/**
 * 검색엔진이 읽는 구조화 데이터(JSON-LD).
 *
 * 화면에는 보이지 않는다. "무료 웹 도구"라는 것과 자주 묻는 질문을 검색엔진이
 * 정확히 알아보게 한다. FAQ는 화면의 "자주 묻는 질문"과 같은 데이터를 써서
 * 둘이 어긋나지 않게 한다(검색엔진은 화면에 없는 내용을 넣으면 불이익을 준다).
 *
 * 사이트 주소는 넣지 않는다. 화면 코드는 브라우저에서도 다시 그려지는데,
 * 사이트 주소는 서버에서만 알 수 있어서 넣으면 서버와 브라우저의 결과가 달라진다.
 */

const DATA = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "ko",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

// "</script>" 같은 글자가 들어가도 태그가 끊기지 않게 <를 바꿔 쓴다
const JSON_LD = JSON.stringify(DATA).replace(/</g, "\\u003c");

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON_LD }}
    />
  );
}
