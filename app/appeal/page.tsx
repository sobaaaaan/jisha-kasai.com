import React from "react";

export const metadata = {
  title: "異議申立てフォーム | 不起訴事件マップ",
  description: "不起訴事件マップに掲載された情報への異議申立てを受け付けるページです。",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "40px 20px 72px",
  lineHeight: 1.8,
  color: "#222",
};

const formStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 24,
  background: "#fff",
  marginTop: 24,
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 700,
  margin: "16px 0 6px",
};

const requiredStyle: React.CSSProperties = {
  display: "inline-block",
  marginLeft: 6,
  padding: "1px 6px",
  borderRadius: 999,
  background: "#dc2626",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
};

const optionalStyle: React.CSSProperties = {
  display: "inline-block",
  marginLeft: 6,
  padding: "1px 6px",
  borderRadius: 999,
  background: "#6b7280",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 15,
  background: "#fff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 150,
  resize: "vertical",
};

const helpTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  margin: "4px 0 0",
};

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "14px 16px",
  marginTop: 18,
};

const legendStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  padding: "0 6px",
};

const radioLabelStyle: React.CSSProperties = {
  display: "block",
  margin: "8px 0",
  fontSize: 14,
};

const checkboxWrapStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 14,
  borderRadius: 10,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 22,
  width: "100%",
  padding: "13px 16px",
  border: "none",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
};

const noticeStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 10,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#7c2d12",
  fontSize: 14,
};

export default function AppealPage() {
  return (
    <main style={{ background: "#f7f7f7", minHeight: "100vh" }}>
      <section style={wrapStyle}>
        <a href="/" style={{ color: "#1565c0", fontSize: 14 }}>
          ← 地図に戻る
        </a>

        <h1 style={{ fontSize: 30, margin: "18px 0 8px" }}>
          異議申立てフォーム
        </h1>

        <p style={{ color: "#555", margin: 0 }}>
          不起訴事件マップに掲載された内容について、事実と異なる、誤解を招く、
          プライバシー上の問題がある、補足が必要である等の場合は、以下のフォームからご連絡ください。
          内容確認後、修正、注記、非公開化、削除等を検討します。
        </p>

        <div style={noticeStyle}>
          ※ 送信内容は、掲載内容の確認・対応判断・必要な連絡のために利用します。
          虚偽の申立てや、第三者になりすました申立てはお控えください。
        </div>

        <form
          action="mailto:appeal@fukiso-map.com"
          method="post"
          encType="text/plain"
          style={formStyle}
        >
          <label style={labelStyle} htmlFor="name">
            氏名または法人名
            <span style={requiredStyle}>必須</span>
          </label>
          <input
            id="name"
            name="氏名または法人名"
            type="text"
            required
            style={inputStyle}
            placeholder="例：山田 太郎 / 株式会社〇〇"
          />

          <label style={labelStyle} htmlFor="email">
            メールアドレス
            <span style={requiredStyle}>必須</span>
          </label>
          <input
            id="email"
            name="メールアドレス"
            type="email"
            required
            style={inputStyle}
            placeholder="例：example@example.com"
          />

          <label style={labelStyle} htmlFor="tel">
            電話番号
            <span style={optionalStyle}>任意</span>
          </label>
          <input
            id="tel"
            name="電話番号"
            type="tel"
            style={inputStyle}
            placeholder="例：090-1234-5678"
          />

          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>
              申立人の立場
              <span style={requiredStyle}>必須</span>
            </legend>

            <label style={radioLabelStyle}>
              <input type="radio" name="申立人の立場" value="本人" required /> 本人
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="申立人の立場" value="家族・親族" /> 家族・親族
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="申立人の立場" value="代理人" /> 代理人
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="申立人の立場" value="事件関係者" /> 事件関係者
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="申立人の立場" value="その他" /> その他
            </label>
          </fieldset>

          <label style={labelStyle} htmlFor="targetUrl">
            異議申立て対象の投稿URL
            <span style={requiredStyle}>必須</span>
          </label>
          <input
            id="targetUrl"
            name="異議申立て対象URL"
            type="url"
            required
            style={inputStyle}
            placeholder="例：https://xn--ihq797ltbc.com/..."
          />
          <p style={helpTextStyle}>
            対象となる投稿ページ、または該当箇所が分かるURLを入力してください。
          </p>

          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>
              異議申立ての種類
              <span style={requiredStyle}>必須</span>
            </legend>

            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="事実誤認" required /> 事実誤認
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="名誉毀損のおそれ" /> 名誉毀損のおそれ
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="プライバシー侵害のおそれ" /> プライバシー侵害のおそれ
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="削除希望" /> 削除希望
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="補足・訂正希望" /> 補足・訂正希望
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="異議申立ての種類" value="その他" /> その他
            </label>
          </fieldset>

          <label style={labelStyle} htmlFor="appeal">
            異議申立ての内容
            <span style={requiredStyle}>必須</span>
          </label>
          <textarea
            id="appeal"
            name="異議申立て内容"
            required
            style={textareaStyle}
            placeholder="例：掲載内容のどの部分が事実と異なるか、どのような修正・削除・注記を希望するか等を具体的に記入してください。"
          />

          <label style={labelStyle} htmlFor="evidenceUrl">
            根拠資料URL
            <span style={optionalStyle}>任意</span>
          </label>
          <input
            id="evidenceUrl"
            name="根拠資料URL"
            type="url"
            style={inputStyle}
            placeholder="例：報道記事、公式発表、裁判所・自治体・警察等の公開資料URL"
          />

          <label style={labelStyle} htmlFor="evidence">
            補足情報・根拠資料の説明
            <span style={optionalStyle}>任意</span>
          </label>
          <textarea
            id="evidence"
            name="補足情報・根拠資料の説明"
            style={textareaStyle}
            placeholder="根拠資料の内容、確認してほしい点、その他補足事項があれば記入してください。"
          />

          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>
              添付資料の有無
              <span style={optionalStyle}>任意</span>
            </legend>

            <label style={radioLabelStyle}>
              <input type="radio" name="添付資料の有無" value="あり" /> あり
            </label>
            <label style={radioLabelStyle}>
              <input type="radio" name="添付資料の有無" value="なし" /> なし
            </label>

            <p style={helpTextStyle}>
              ※ 現在のメール送信形式では、この画面からファイル添付はできません。
              添付資料がある場合は、送信後のメール返信時にご案内します。
            </p>
          </fieldset>

          <div style={checkboxWrapStyle}>
            <label style={{ fontSize: 14 }}>
              <input
                type="checkbox"
                name="確認事項"
                value="送信内容が真実であり、正当な申立てであることを確認しました"
                required
              />{" "}
              送信内容が真実であり、正当な申立てであることを確認しました。
              <span style={requiredStyle}>必須</span>
            </label>
          </div>

          <button type="submit" style={buttonStyle}>
            異議申立てを送信
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#777", marginTop: 16 }}>
          ※ 現在はメール送信形式です。後からSupabase保存型フォームへ変更できます。
        </p>
      </section>
    </main>
  );
}