import { UPLOAD_INFO } from "@/config/clothing";

/**
 * 옷을 확인하는 방법 비교.
 *
 * "로벅스를 쓰기 전에 여기서 먼저"라는 이유를 한눈에 보여준다.
 * 사실만 쓴다. 게임 속 모습과 가장 비슷한 건 스튜디오라서, 마지막 확인은 스튜디오를 권한다.
 * 표 대신 카드로 둔다. 휴대폰 화면에서 네 칸짜리 표는 글자가 너무 좁아진다.
 */

const METHODS = [
  {
    name: "로블록스에 바로 올리기",
    cost: `올릴 때마다 ${UPLOAD_INFO.feeRobux} 로벅스`,
    ready: "검토가 끝나야 입은 모습을 볼 수 있어요",
    check: `틀린 걸 알면 고쳐서 다시 올려야 해요 (또 ${UPLOAD_INFO.feeRobux} 로벅스)`,
    ours: false,
  },
  {
    name: "로블록스 스튜디오",
    cost: "무료",
    ready: "컴퓨터에 프로그램을 설치하고 로그인해야 해요",
    check: "크기나 빈 칸은 눈으로 직접 찾아야 해요",
    ours: false,
  },
  {
    name: "블록핏",
    cost: "무료",
    ready: "설치와 로그인 없이 바로, 휴대폰으로도 돼요",
    check: "크기, 파일 종류, 빈 칸을 검사하고 자동으로 고쳐줘요",
    ours: true,
  },
];

export default function CompareMethods() {
  return (
    <section className="compare" aria-labelledby="compare-title">
      <h2 className="section-title" id="compare-title">
        왜 여기서 먼저 확인해요?
      </h2>
      <ul className="compare-list">
        {METHODS.map((m) => (
          <li key={m.name} className="compare-card" data-ours={m.ours}>
            <p className="compare-name">{m.name}</p>
            <dl className="compare-rows">
              <div>
                <dt>비용</dt>
                <dd>{m.cost}</dd>
              </div>
              <div>
                <dt>준비</dt>
                <dd>{m.ready}</dd>
              </div>
              <div>
                <dt>검사</dt>
                <dd>{m.check}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <p className="compare-note">
        게임 속 모습과 가장 비슷한 건 스튜디오예요. 블록핏에서 먼저 걸러낸 뒤,
        올리기 직전에 스튜디오에서 한 번 더 입혀보면 가장 확실해요.
      </p>
    </section>
  );
}
