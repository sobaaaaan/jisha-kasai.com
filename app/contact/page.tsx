"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    targetUrl: "",
    message: "",
    agree: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: ここにSupabase保存処理、またはAPI Route送信処理を追加
    console.log("問い合わせ内容:", formData);

    setSubmitted(true);
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>お問い合わせ</h1>
        <p style={styles.description}>
          不起訴事件マップに関するお問い合わせ、掲載内容の訂正依頼、削除依頼、情報提供などは、以下のフォームからご連絡ください。
        </p>

        {submitted ? (
          <div style={styles.successBox}>
            <h2 style={styles.successTitle}>送信を受け付けました</h2>
            <p style={styles.successText}>
              お問い合わせありがとうございます。内容を確認のうえ、必要に応じて対応いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              お名前・団体名 <span style={styles.optional}>任意</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="例：山田 太郎"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              メールアドレス <span style={styles.required}>必須</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="例：example@example.com"
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              お問い合わせ種別 <span style={styles.required}>必須</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">選択してください</option>
                <option value="general">一般的なお問い合わせ</option>
                <option value="correction">掲載内容の訂正依頼</option>
                <option value="deletion">削除依頼</option>
                <option value="report">問題のある投稿の通報</option>
                <option value="source">情報提供・ソース提供</option>
                <option value="other">その他</option>
              </select>
            </label>

            <label style={styles.label}>
              件名 <span style={styles.required}>必須</span>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="例：掲載内容の訂正について"
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              対象ページURL <span style={styles.optional}>該当する場合</span>
              <input
                type="url"
                name="targetUrl"
                value={formData.targetUrl}
                onChange={handleChange}
                placeholder="例：https://xn--ihq797ltbc.com/cases/xxxxx"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              お問い合わせ内容 <span style={styles.required}>必須</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="お問い合わせ内容をできるだけ具体的にご記入ください。"
                required
                rows={8}
                style={styles.textarea}
              />
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                required
              />
              <span>
                入力内容を確認し、サイト運営者が内容確認のために利用することに同意します。
              </span>
            </label>

            <button type="submit" style={styles.button}>
              送信する
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "40px 16px",
    color: "#222",
  },
  card: {
    maxWidth: "760px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  description: {
    fontSize: "15px",
    lineHeight: 1.8,
    color: "#555",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "15px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
    lineHeight: 1.7,
    resize: "vertical",
    boxSizing: "border-box",
  },
  required: {
    display: "inline-block",
    background: "#c62828",
    color: "#fff",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "6px",
  },
  optional: {
    display: "inline-block",
    background: "#777",
    color: "#fff",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "6px",
  },
  checkboxLabel: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#444",
  },
  button: {
    marginTop: "8px",
    padding: "14px 20px",
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  successBox: {
    background: "#eef8f0",
    border: "1px solid #b7dfc0",
    borderRadius: "10px",
    padding: "24px",
  },
  successTitle: {
    fontSize: "20px",
    marginBottom: "8px",
  },
  successText: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#444",
  },
};