export const metadata = {
  title: "投稿ポリシー | 不起訴事件マップ",
  description: "不起訴事件マップの投稿基準、掲載しない情報、削除対象について説明します。",
};

const sectionStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: "0 auto",
  padding: "40px 20px 64px",
  lineHeight: 1.8,
  color: "#222",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 20,
  margin: "18px 0",
  background: "#fff",
};

const h2Style: React.CSSProperties = {
  fontSize: 20,
  margin: "0 0 10px",
};

const listStyle: React.CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 22,
};

export default function PolicyPage() {
  return (
    <main style={{ background: "#f7f7f7", minHeight: "100vh" }}>
      <section style={sectionStyle}>
        <a href="/" style={{ color: "#1565c0", fontSize: 14 }}>
          ← 地図に戻る
        </a>

        <h1 style={{ fontSize: 30, margin: "18px 0 8px" }}>投稿ポリシー</h1>

        <p style={{ color: "#666", margin: "0 0 22px" }}>
          本サイトは、報道機関・公的機関などの公開情報をもとに、不起訴処分等に関する事件情報を地理的に整理することを目的としています。
        </p>

        <div style={cardStyle}>
          <h2 style={h2Style}>掲載できる情報</h2>
          <ul style={listStyle}>
            <li>報道機関、公的機関、その他確認可能な公開情報に基づく情報</li>
            <li>ソースURLが確認できる情報</li>
            <li>事件の概要、発生地域、発生時期、処分内容など、公益性のある範囲の情報</li>
            <li>個人の特定につながらないよう配慮された情報</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>投稿時に禁止する情報</h2>
          <ul style={listStyle}>
            <li>個人名、詳細住所、電話番号、メールアドレス、SNSアカウント等の個人情報</li>
            <li>顔写真、私的な画像、無断転載画像</li>
            <li>噂、伝聞、推測、真偽不明の情報</li>
            <li>特定個人・団体への誹謗中傷、差別的表現、脅迫的表現</li>
            <li>著作権、肖像権、プライバシー権を侵害する情報</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>不起訴情報の扱いについて</h2>
          <p style={{ margin: 0 }}>
            不起訴は、無罪を意味するものではありません。また、有罪を意味するものでもありません。
            本サイトは、公開情報を整理・可視化するものであり、掲載対象者や関係者について犯罪事実を断定するものではありません。
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>削除・非公開化の対象</h2>
          <ul style={listStyle}>
            <li>個人情報が含まれる投稿</li>
            <li>ソースURLが確認できない投稿</li>
            <li>虚偽または不正確である可能性が高い投稿</li>
            <li>権利侵害、名誉毀損、プライバシー侵害のおそれがある投稿</li>
            <li>その他、運営者が不適切と判断した投稿</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <h2 style={h2Style}>投稿の承認について</h2>
          <p style={{ margin: 0 }}>
            投稿された情報は、原則として管理者による確認・承認後に掲載されます。
            投稿内容の正確性、公益性、権利侵害のおそれ等を確認し、必要に応じて修正、非公開、削除を行います。
          </p>
        </div>

        <p style={{ fontSize: 13, color: "#777", marginTop: 22 }}>
          掲載内容に問題がある場合は、削除依頼フォームまたは異議申立てフォームからご連絡ください。
        </p>
      </section>
    </main>
  );
}