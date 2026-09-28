import { TEMPLATE_SIZE, UPLOAD_INFO } from "@/config/clothing";
import TemplateDownloadButtons from "@/components/TemplateDownloadButtons";

/**
 * 처음 옷을 만드는 사람을 위한 안내.
 *
 * 사용자 상당수가 초등학생이라 짧은 문장과 쉬운 말로 쓴다.
 * 어려운 말은 한 번 풀어서 설명하고, 그 뒤로는 풀어쓴 말을 계속 쓴다.
 *
 * 안전 안내는 빼지 않는다. 로블록스 관련 사기는 대부분 아이들을 노리고,
 * "비밀번호를 묻는 사이트는 믿지 마세요" 한 줄이 실제로 계정을 지켜준다.
 *
 * 이 글은 검색으로 들어오는 사람에게도 도움이 되고,
 * 광고 승인에 필요한 "실제 내용"의 역할도 한다.
 */

const STEPS = [
  {
    title: "옷 본 받기",
    body: "아래에서 칸 이름이 한글로 적힌 블록핏 옷 본을 받거나, 로블록스 공식 사이트에서 옷 본(템플릿)을 받아요. 셔츠 본과 바지 본이 따로 있어요.",
  },
  {
    title: "칸에 맞춰 그리기",
    body: "옷 본 위에 그림을 그려요. 칸마다 몸의 어느 부분이 될지 정해져 있으니 칸 안에 그려야 해요. 층(레이어)을 쓸 수 있는 그림 프로그램이 편해요. 포토피아처럼 무료로 쓰는 웹 프로그램도 있어요.",
  },
  {
    title: "안내선 숨기기",
    body: "옷 본에 원래 있던 선과 글자 층을 숨겨요. 숨기지 않으면 선과 글자가 옷에 그대로 찍혀요.",
  },
  {
    title: "PNG로 저장하기",
    body: `크기는 바꾸지 말고 그대로(가로 ${TEMPLATE_SIZE.width}, 세로 ${TEMPLATE_SIZE.height}) PNG로 저장해요.`,
  },
  {
    title: "블록핏에서 검사하기",
    body: "이 페이지 위쪽 초록 판에 파일을 올려서 문제가 없는지 확인해요. 크기나 파일 종류가 틀렸다면 '자동으로 고치기'로 고칠 수 있어요.",
  },
  {
    title: "스튜디오에서 입혀보기",
    body: "로블록스 스튜디오에서 캐릭터에 옷을 무료로 입혀볼 수 있어요. 게임 속 모습과 가장 비슷해요.",
  },
  {
    title: "보호자와 함께 올리기",
    body: `올릴 때마다 ${UPLOAD_INFO.feeRobux} 로벅스가 들어요. 로벅스를 쓰기 전에 꼭 보호자에게 물어보세요.`,
  },
];

const WORDS = [
  {
    word: "옷 본 (템플릿)",
    meaning:
      "옷을 그릴 때 쓰는 밑그림 파일이에요. 로블록스 공식 사이트에서 무료로 받을 수 있어요.",
  },
  {
    word: "칸",
    meaning:
      "옷 본 안에 있는 네모들이에요. 칸 하나가 몸의 앞, 뒤, 옆, 팔, 다리 같은 한 면이 돼요.",
  },
  {
    word: "PNG, JPG",
    meaning:
      "그림 파일의 종류예요. PNG는 비어 있는 곳을 저장할 수 있고, JPG는 못 해요. 옷은 PNG가 좋아요.",
  },
  {
    word: "비어 있는 곳 (투명)",
    meaning:
      "아무 색도 칠하지 않은 곳이에요. 이 페이지에서는 체크무늬로 보이고, 게임에서는 캐릭터 피부가 보여요.",
  },
  {
    word: "px (픽셀)",
    meaning: `그림을 이루는 아주 작은 점이에요. ${TEMPLATE_SIZE.width} × ${TEMPLATE_SIZE.height}는 가로 ${TEMPLATE_SIZE.width}개, 세로 ${TEMPLATE_SIZE.height}개 점이라는 뜻이에요.`,
  },
  {
    word: "로벅스",
    meaning: "로블록스 안에서 쓰는 돈이에요.",
  },
  {
    word: "로블록스 스튜디오",
    meaning:
      "로블록스가 만든 무료 제작 프로그램이에요. 옷을 올리기 전에 캐릭터에 입혀볼 수 있어요.",
  },
];

const FAQ = [
  {
    q: "왜 크기가 딱 맞아야 해요?",
    a: "옷 본의 칸 위치로 몸의 어디에 입힐지가 정해져 있어요. 크기가 바뀌면 칸이 제자리에서 벗어나서 옷이 늘어나거나 엉뚱한 곳에 입혀져요.",
  },
  {
    q: "체크무늬는 뭐예요?",
    a: "비어 있는 곳이에요. 게임에서는 그 자리에 캐릭터 피부가 보여요.",
  },
  {
    q: "검사를 통과하면 무조건 올라가요?",
    a: "아니요. 블록핏은 파일의 크기와 종류만 확인해요. 그림 내용은 로블록스가 따로 확인해서, 다른 회사 로고나 캐릭터를 그리면 올라가지 않을 수 있어요.",
  },
  {
    q: "내 그림이 어딘가로 보내져요?",
    a: "아무 데도 보내지 않아요. 지금 쓰는 기기 안에서만 확인하고, 창을 닫으면 사라져요.",
  },
  {
    q: "날개나 모자, 머리카락도 검사할 수 있어요?",
    a: "아직은 안 돼요. 날개, 모자, 머리카락 같은 액세서리와 입체 옷은 3D 프로그램으로 만드는 모델이라 검사하는 방법이 달라요. 블록핏은 그림으로 만드는 셔츠, 바지, 티셔츠를 검사해요.",
  },
  {
    q: "'친구에게 보여주기'를 누르면 뭐가 보내져요?",
    a: "옷을 입힌 모형 사진과 블록핏 주소만 가요. 사진은 지금 쓰는 기기 안에서 만들어지고, 블록핏에는 저장되지 않아요. 어디로 보낼지는 직접 골라요.",
  },
  {
    q: "꾸민 인원은 어떻게 세요?",
    a: "이 기기에서 처음으로 모형에 옷을 입혀볼 때 숫자를 하나 올려요. 그림, 이름, 계정 같은 정보는 보내지 않아요. 같은 기기에서 여러 번 해도 한 번만 세요.",
  },
  {
    q: "휴대폰으로도 돼요?",
    a: "검사는 휴대폰으로도 돼요. 다만 옷 그림을 그리는 건 컴퓨터나 태블릿이 훨씬 편해요.",
  },
];

export default function BeginnerGuide() {
  return (
    <div className="guide" id="guide">
      <section className="guide-block">
        <h2 className="section-title">처음이라면, 옷 만드는 순서</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title} className="step">
              <p className="step-title">{step.title}</p>
              <p className="step-body">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="guide-text">
          칸 이름이 한글로 적힌 옷 본이에요. 맨 아래 층으로 두고 새 층에 그린
          다음, 저장하기 전에 이 층을 숨기세요.
        </p>
        <TemplateDownloadButtons />
        <p className="guide-link">
          로블록스 공식 옷 본은{" "}
          <a href={UPLOAD_INFO.docsUrl} target="_blank" rel="noreferrer">
            공식 옷 만들기 안내
          </a>
          에서 받을 수 있어요.
        </p>
      </section>

      <section className="guide-block safety" aria-labelledby="safety-title">
        <h2 className="section-title" id="safety-title">
          안전하게 하기
        </h2>
        <ul className="safety-list">
          <li>
            로블록스 아이디나 비밀번호를 물어보는 사이트는 절대 믿지 마세요.
            블록핏은 로그인을 받지 않아요.
          </li>
          <li>
            공짜 로벅스를 준다는 사이트나 사람은 거의 다 사기예요.
          </li>
          <li>
            로블록스에 옷을 올리거나 팔려면 본인 확인이나 보호자 계정 연결,
            유료 멤버십이 필요할 수 있어요. 보호자와 함께 하세요.
          </li>
        </ul>
      </section>

      <section className="guide-block">
        <h2 className="section-title">어려운 말 풀이</h2>
        <dl className="words">
          {WORDS.map((item) => (
            <div key={item.word} className="word">
              <dt>{item.word}</dt>
              <dd>{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="guide-block">
        <h2 className="section-title">옷 본 칸 크기</h2>
        <p className="guide-text">
          셔츠와 바지는 가로 {TEMPLATE_SIZE.width}, 세로 {TEMPLATE_SIZE.height}{" "}
          크기의 그림 한 장이 몸을 감싸는 방식이에요. 티셔츠는 옷 본 없이
          정사각형 그림 한 장이 몸통 앞에 붙어요.
        </p>
        <table className="spec-table">
          <thead>
            <tr>
              <th scope="col">칸 크기</th>
              <th scope="col">들어가는 곳</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>128 × 128</td>
              <td>몸통 앞, 몸통 뒤</td>
            </tr>
            <tr>
              <td>64 × 128</td>
              <td>몸통 옆, 팔다리의 앞뒤와 옆</td>
            </tr>
            <tr>
              <td>128 × 64</td>
              <td>몸통 위, 몸통 밑</td>
            </tr>
            <tr>
              <td>64 × 64</td>
              <td>팔다리 위, 팔다리 밑</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="guide-block">
        <h2 className="section-title">자주 묻는 질문</h2>
        <div>
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
