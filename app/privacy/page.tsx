
export const metadata = {
  title: "プライバシーポリシー | 不起訴事件マップ",
  description:
    "不起訴事件マップにおける個人情報の取扱い、広告配信、アクセス解析について説明します。",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "32px 20px",
  lineHeight: 1.9,
  color: "#1f2937",
};

const h1Style: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "24px",
  color: "#111827",
};

const h2Style: React.CSSProperties = {
  fontSize: "1.3rem",
  marginTop: "36px",
  marginBottom: "12px",
  borderLeft: "5px solid #2563eb",
  paddingLeft: "12px",
  color: "#111827",
};

export default function Page() {
  return (
    <main style={containerStyle}>
      <h1 style={h1Style}>プライバシーポリシー</h1>

      <p>
        不起訴事件マップ（以下「当サイト」）は、
        利用者の個人情報の保護を重要な責務と考え、
        以下の方針に基づき適切な管理と運用を行います。
      </p>

      <h2 style={h2Style}>1. 個人情報の利用目的</h2>

      <p>
        当サイトでは、お問い合わせや削除依頼等の際に、
        氏名、メールアドレスその他の情報をご提供いただく場合があります。
      </p>

      <p>
        取得した情報は、お問い合わせへの回答、
        削除依頼への対応、
        サービス改善のために利用し、
        これら以外の目的では利用いたしません。
      </p>

      <h2 style={h2Style}>2. 個人情報の第三者提供</h2>

      <p>
        当サイトは、法令に基づく場合を除き、
        本人の同意なく個人情報を第三者へ提供することはありません。
      </p>

      <h2 style={h2Style}>3. Cookieについて</h2>

      <p>
        当サイトでは、利用者の利便性向上やアクセス状況の分析のため、
        Cookie（クッキー）を利用する場合があります。
      </p>

      <p>
        Cookieには氏名やメールアドレスなどの個人情報は含まれません。
      </p>

      <p>
        利用者はブラウザの設定によりCookieを無効化することができます。
      </p>

      <h2 style={h2Style}>4. アクセス解析ツールについて</h2>

      <p>
        当サイトでは、サイト利用状況の把握および改善のため、
        Google Analytics等のアクセス解析ツールを利用する場合があります。
      </p>

      <p>
        これらのツールはCookieを利用して匿名のトラフィックデータを収集することがあります。
        収集される情報には個人を特定する情報は含まれません。
      </p>

      <h2 style={h2Style}>5. 広告配信について</h2>

      <p>
        当サイトは、第三者配信の広告サービス
        （Google AdSense等）を利用する場合があります。
      </p>

      <p>
        広告配信事業者は、
        利用者の興味に応じた広告を表示するため、
        Cookieを使用することがあります。
      </p>

      <p>
        Google広告におけるCookieの利用については、
        Googleのポリシーをご確認ください。
      </p>

      <h2 style={h2Style}>6. 投稿情報について</h2>

      <p>
        当サイトは、報道機関、公的機関の発表、
        その他一般に公開された情報をもとに情報を掲載しています。
      </p>

      <p>
        投稿フォームを通じて寄せられた情報については、
        管理者が内容を確認したうえで掲載の可否を判断します。
      </p>

      <p>
        個人情報、詳細住所、顔写真、
        SNSアカウントその他個人を特定し得る情報については、
        掲載をお断りする場合があります。
      </p>

      <h2 style={h2Style}>7. 削除・修正依頼について</h2>

      <p>
        掲載情報について削除または修正を希望される場合は、
        以下の窓口までご連絡ください。
      </p>

      <p>
        削除依頼窓口：
        <a href="mailto:delete@fukiso-map.com">
          delete@fukiso-map.com
        </a>
      </p>

      <h2 style={h2Style}>8. お問い合わせ窓口</h2>

      <p>
        当サイトに関するお問い合わせは、
        以下の窓口までご連絡ください。
      </p>

      <p>
        お問い合わせ：
        <a href="mailto:contact@fukiso-map.com">
          contact@fukiso-map.com
        </a>
      </p>

      <h2 style={h2Style}>9. 免責事項</h2>

      <p>
        当サイトに掲載される情報については、
        可能な限り正確な情報を掲載するよう努めていますが、
        正確性、完全性、最新性を保証するものではありません。
      </p>

      <p>
        当サイトの利用により生じた損害等について、
        運営者は一切の責任を負いません。
      </p>

      <h2 style={h2Style}>10. プライバシーポリシーの変更</h2>

      <p>
        本ポリシーは、法令改正やサービス内容の変更等に応じて、
        予告なく改定する場合があります。
      </p>

      <p>
        最終更新日：2026年6月3日
      </p>
    </main>
  );
}

