import React from "react";

// 1. スタイル定義を一番上に移動（Turbopackの解析エラーを防止）
const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
  padding: "32px 20px",
  lineHeight: 1.9,
  color: "#1f2937",
};

const h1Style: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "20px",
  color: "#111827",
};

const h2Style: React.CSSProperties = {
  fontSize: "1.35rem",
  marginTop: "36px",
  marginBottom: "12px",
  borderLeft: "5px solid #2563eb",
  paddingLeft: "12px",
  color: "#111827",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px",
};

const thStyle: React.CSSProperties = {
  width: "28%",
  textAlign: "left",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "12px",
  verticalAlign: "top",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: "12px",
};

const noteStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "18px",
  marginTop: "24px",
};

// 2. メタデータを定義
export const metadata = {
  title: "運営者情報 | 不起訴事件マップ",
  description:
    "不起訴事件マップの運営者情報、お問い合わせ窓口、削除依頼窓口について掲載しています。",
};

// 3. コンポーネントを配置
export default function Page() {
  return (
    <main style={containerStyle}>
      <h1 style={h1Style}>運営者情報</h1>

      <p>
        不起訴事件マップは、報道機関や公的機関等により公開されている情報をもとに、
        不起訴となった事件情報を整理・可視化する情報サイトです。
      </p>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <th style={thStyle}>サイト名</th>
            <td style={tdStyle}>不起訴事件マップ</td>
          </tr>
          <tr>
            <th style={thStyle}>運営者</th>
            <td style={tdStyle}>すくぷら工房</td>
          </tr>
          <tr>
            <th style={thStyle}>所在地</th>
            <td style={tdStyle}>大阪府大阪市</td>
          </tr>
          <tr>
            <th style={thStyle}>お問い合わせ</th>
            <td style={tdStyle}>
              <a href="mailto:contact@fukiso-map.com">
                contact@fukiso-map.com
              </a>
            </td>
          </tr>
          <tr>
            <th style={thStyle}>掲載内容の修正・削除依頼</th>
            <td style={tdStyle}>
              <a href="mailto:delete@fukiso-map.com">
                delete@fukiso-map.com
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2Style}>掲載情報について</h2>
      <p>
        本サイトでは、公開情報をもとに事件情報を整理していますが、
        掲載内容の正確性・完全性・最新性を保証するものではありません。
        掲載情報に誤りがある場合や、修正・削除が必要と思われる場合は、
        上記の削除依頼窓口までご連絡ください。
      </p>

}
