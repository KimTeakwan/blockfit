import type { Metadata } from "next";
import Link from "next/link";
import { OPERATOR, PRIVACY_EFFECTIVE_DATE, SITE_NAME } from "@/config/site";

const TITLE = `개인정보처리방침 | ${SITE_NAME}`;
const DESCRIPTION = `${SITE_NAME}이 어떤 정보를 쓰고, 어떤 정보를 쓰지 않는지 안내해요.`;

// 대표 주소(canonical)는 레이아웃의 "/"를 물려받으므로 이 페이지 것으로 덮어쓴다.
// 안 덮으면 검색엔진이 이 페이지를 첫 화면의 복사본으로 여긴다.
// 링크 카드(openGraph)는 덮지 않는다. 덮으면 레이아웃에서 오는 대표 그림까지 빠진다.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
};

/**
 * 개인정보처리방침.
 *
 * 실제로 하는 것만 적는다. 블록핏은 모으는 정보가 거의 없어서
 * 없는 걸 있는 것처럼 길게 쓰지 않는다.
 * 기능이 바뀌면(광고, 분석 도구 등) 이 문서도 함께 고치고 시행일을 바꾼다.
 *
 * 맨 위 "한눈에 보기"는 초등학생도 읽을 수 있게 쓴다.
 */
export default function PrivacyPage() {
  const contact = OPERATOR.email ? (
    <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
  ) : (
    "문의 이메일은 곧 안내할게요."
  );

  return (
    <div className="site">
      <header className="brand">
        <Link href="/" className="brand-name brand-link">
          {SITE_NAME}
        </Link>
        <p className="brand-note">개인정보처리방침</p>
      </header>

      <main className="legal">
        <h1 className="legal-title">개인정보처리방침</h1>
        <p className="legal-meta">시행일: {PRIVACY_EFFECTIVE_DATE}</p>

        <section className="legal-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">한눈에 보기</h2>
          <ul>
            <li>회원가입과 로그인이 없어요. 이름, 전화번호, 로블록스 계정을 묻지 않아요.</li>
            <li>올린 옷 그림은 어디에도 보내지 않아요. 지금 쓰는 기기 안에서만 확인해요.</li>
            <li>
              꾸민 인원을 셀 때 숫자 하나만 올려요. 장난으로 숫자를 부풀리지 못하게
              접속 주소를 알아볼 수 없는 값으로 바꿔서 1시간 동안만 써요.
            </li>
            <li>쿠키를 쓰지 않아요.</li>
          </ul>
        </section>

        <section>
          <h2>1. 처리하는 정보</h2>
          <p>
            {SITE_NAME}은 회원가입이나 로그인을 받지 않으며, 이름, 연락처, 생년월일,
            로블록스 계정 같은 정보를 입력받지 않아요.
          </p>
          <p>서비스를 이용할 때 아래 정보가 처리될 수 있어요.</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">정보</th>
                <th scope="col">왜 쓰나요</th>
                <th scope="col">얼마나 보관하나요</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>접속 주소(IP)를 되돌릴 수 없게 바꾼 값</td>
                <td>꾸민 인원 숫자를 장난으로 부풀리는 것을 막기 위해</td>
                <td>최대 1시간 뒤 자동 삭제. 원래 접속 주소는 저장하지 않아요</td>
              </tr>
              <tr>
                <td>접속 기록(접속 주소, 시간, 브라우저 종류 등)</td>
                <td>웹사이트를 제공하고 보안 문제를 막기 위해 호스팅 업체가 남겨요</td>
                <td>호스팅 업체의 보관 정책에 따라요</td>
              </tr>
              <tr>
                <td>&quot;이미 셌음&quot; 표시 1개</td>
                <td>같은 기기에서 꾸민 인원을 두 번 세지 않기 위해</td>
                <td>
                  내 기기의 브라우저 저장소에만 있어요. 브라우저 기록을 지우면
                  사라져요
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            꾸민 인원은 전체 숫자 하나로만 저장돼요. 누가 꾸몄는지는 알 수 없어요.
          </p>
        </section>

        <section>
          <h2>2. 옷 그림</h2>
          <p>
            올린 옷 그림은 {SITE_NAME} 서버로 보내지 않아요. 검사, 자동으로 고치기,
            3D 미리보기, 한국어 옷 본 만들기는 모두 지금 쓰는 기기 안에서 처리되고,
            창을 닫으면 사라져요.
          </p>
          <p>
            &quot;친구에게 보여주기&quot;를 누르면 옷을 입힌 모형 사진이 기기 안에서
            만들어지고, 어디로 보낼지는 직접 골라요. {SITE_NAME}은 그 사진을 받거나
            저장하지 않아요.
          </p>
        </section>

        <section>
          <h2>3. 다른 곳에 맡기는 일</h2>
          <p>서비스를 운영하기 위해 아래 업체의 서비스를 이용해요.</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">업체</th>
                <th scope="col">맡기는 일</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel Inc.</td>
                <td>웹사이트 호스팅</td>
              </tr>
              <tr>
                <td>Upstash, Inc.</td>
                <td>꾸민 인원 숫자와 장난 방지용 값 저장</td>
              </tr>
            </tbody>
          </table>
          <p>
            이 업체들의 서버는 국외에 있을 수 있어요. 위에 적은 정보 외에 다른
            정보를 제3자에게 제공하지 않아요.
          </p>
        </section>

        <section>
          <h2>4. 만 14세 미만 어린이</h2>
          <p>
            {SITE_NAME}은 어린이도 쓸 수 있도록 만들었고, 그래서 이름이나 연락처처럼
            사람을 알아볼 수 있는 정보를 받지 않아요.
          </p>
        </section>

        <section>
          <h2>5. 광고와 분석 도구</h2>
          <p>
            지금은 광고와 방문 분석 도구를 쓰지 않아요. 앞으로 쓰게 되면 이 방침을
            먼저 고치고 알려드릴게요.
          </p>
        </section>

        <section>
          <h2>6. 정보를 지키는 방법</h2>
          <p>
            필요한 정보만 최소한으로 처리하고, 모든 연결은 암호화된 주소(https)로만
            주고받아요. 장난 방지용 값은 원래 접속 주소를 알아낼 수 없도록 바꿔서
            저장해요.
          </p>
        </section>

        <section>
          <h2>7. 문의와 요청</h2>
          <p>
            개인정보에 관해 궁금한 점이나 요청이 있으면 아래로 연락해주세요. 만 14세
            미만 어린이는 보호자와 함께 연락해주세요.
          </p>
          <ul>
            {OPERATOR.name && <li>개인정보 보호책임자: {OPERATOR.name}</li>}
            <li>이메일: {contact}</li>
          </ul>
          <p>
            개인정보 침해에 대한 신고나 상담은 개인정보침해신고센터(국번 없이 118)에도
            할 수 있어요.
          </p>
        </section>

        <section>
          <h2>8. 방침이 바뀌면</h2>
          <p>
            이 방침이 바뀌면 시행일을 고치고 이 페이지에서 알려드려요.
          </p>
        </section>

        <p className="legal-back">
          <Link href="/">검사기로 돌아가기</Link>
        </p>
      </main>
    </div>
  );
}
