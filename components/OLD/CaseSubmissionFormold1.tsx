"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// Supabase クライアント（公開鍵）
// ============================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// 型定義
// ============================================================

type CrimeCategory =
  | "violent"
  | "property"
  | "sexual"
  | "drug"
  | "traffic"
  | "public_order"
  | "white_collar"
  | "cyber"
  | "other";

type CaseStatus =
  | "nonprosecution"
  | "nonprosecution_suspend"
  | "nonprosecution_innocence"
  | "indicted"
  | "convicted"
  | "acquitted"
  | "dismissed"
  | "other";

type FormState = {
  occurred_year: string;
  occurred_month: string;
  prefecture: string;
  city: string;
  crime_category: CrimeCategory;
  crime_type: string;
  status: CaseStatus;
  description: string;
  source_url: string;
  submitter_comment: string;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

// ============================================================
// 定数
// ============================================================

const CRIME_CATEGORIES: { value: CrimeCategory; label: string }[] = [
  { value: "property",     label: "財産犯罪（窃盗・詐欺・横領など）" },
  { value: "violent",      label: "暴力犯罪（傷害・暴行・脅迫など）" },
  { value: "drug",         label: "薬物犯罪" },
  { value: "traffic",      label: "交通犯罪" },
  { value: "sexual",       label: "性犯罪" },
  { value: "public_order", label: "公序・風俗犯罪" },
  { value: "white_collar", label: "経済・企業犯罪" },
  { value: "cyber",        label: "サイバー犯罪" },
  { value: "other",        label: "その他" },
];

const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: "nonprosecution_suspend",   label: "起訴猶予" },
  { value: "nonprosecution_innocence", label: "嫌疑なし・嫌疑不十分" },
  { value: "nonprosecution",           label: "不起訴（その他）" },
  { value: "indicted",                 label: "起訴" },
  { value: "convicted",                label: "有罪" },
  { value: "acquitted",                label: "無罪" },
  { value: "dismissed",                label: "公訴棄却" },
  { value: "other",                    label: "その他" },
];

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const DESCRIPTION_MIN = 100;
const DESCRIPTION_MAX = 500;

// ============================================================
// 初期フォーム値
// ============================================================

const INITIAL_FORM: FormState = {
  occurred_year: "",
  occurred_month: "",
  prefecture: "",
  city: "",
  crime_category: "property",
  crime_type: "",
  status: "nonprosecution_suspend",
  description: "",
  source_url: "",
  submitter_comment: "",
};

// ============================================================
// エラー整形・DB検索ユーティリティ
// ============================================================

type SupabaseLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type IdNameRow = {
  id: number;
  name: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatErrorForUser(err: unknown): string {
  if (!isObject(err)) {
    return `投稿に失敗しました。\n\nエラー内容: ${String(err)}`;
  }

  const e = err as SupabaseLikeError;
  const lines = ["投稿に失敗しました。"];

  if (e.message) lines.push(`エラー内容: ${e.message}`);
  if (e.details) lines.push(`詳細: ${e.details}`);
  if (e.hint) lines.push(`ヒント: ${e.hint}`);
  if (e.code) lines.push(`コード: ${e.code}`);

  lines.push("");
  lines.push("この表示をChatGPTに貼ると、原因をかなり絞り込めます。");

  return lines.join("\n");
}

function throwUserError(message: string): never {
  throw { message, code: "APP_VALIDATION_ERROR" } satisfies SupabaseLikeError;
}

async function resolvePrefecture(prefectureName: string) {
  const pref = prefectureName.trim();

  const { data: prefecture, error: prefectureError } = await supabase
    .from("prefectures")
    .select("id, name")
    .eq("name", pref)
    .maybeSingle<IdNameRow>();

  if (prefectureError) throw prefectureError;

  if (!prefecture) {
    throwUserError(
      `都道府県「${pref}」がprefecturesテーブルに見つかりません。47都道府県マスタが投入されているか確認してください。`
    );
  }

  return prefecture;
}

async function insertCaseWithFallback(payload: Record<string, unknown>) {
  const { error } = await supabase.from("cases").insert(payload);

  if (!error) return;

  // DBにまだ列が追加されていない場合でも、投稿テストを止めないための保険。
  // 例: "Could not find the 'city_name' column of 'cases' in the schema cache"
  const match = error.message?.match(/Could not find the '([^']+)' column/);
  if (match?.[1]) {
    const missingColumn = match[1];
    const retryPayload = { ...payload };
    delete retryPayload[missingColumn];

    console.warn(
      `cases.${missingColumn} が存在しないため、この列を除外して再投稿します。`,
      retryPayload
    );

    const retry = await supabase.from("cases").insert(retryPayload);
    if (retry.error) throw retry.error;
    return;
  }

  throw error;
}

// ============================================================
// コンポーネント
// ============================================================

export default function CaseSubmissionForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [descLength, setDescLength] = useState(0);

  // ---------- ハンドラ ----------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "description") setDescLength(value.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMessage("");

    // バリデーション
    if (descLength < DESCRIPTION_MIN) {
      setErrorMessage(`事件概要は${DESCRIPTION_MIN}文字以上入力してください（現在 ${descLength} 文字）`);
      setSubmitStatus("error");
      return;
    }

    // URL フォーマットチェック（入力がある場合のみ）
    if (form.source_url && !form.source_url.startsWith("http")) {
      setErrorMessage("ソースURLは http:// または https:// で始まる形式で入力してください");
      setSubmitStatus("error");
      return;
    }

    try {
      if (!form.occurred_year || !form.occurred_month) {
        throwUserError("発生年月を選択してください。");
      }
      if (!form.prefecture) {
        throwUserError("都道府県を選択してください。");
      }      if (!form.crime_type.trim()) {
        throwUserError("犯罪種別を入力してください。");
      }
      if (!form.source_url.trim()) {
        throwUserError("ソースURLを入力してください。");
      }

      const prefecture = await resolvePrefecture(form.prefecture);

      const insertPayload = {
        prefecture_id: prefecture.id,

        // MVP方針:
        // 市区町村は任意入力。citiesテーブル照合はしない。
        // 将来的に地図表示で使う場合は city_name を保存し、必要に応じて後で管理者が city_id を紐づける。
        city_id: null,
        city_name: form.city.trim() || null,

        occurred_year: Number(form.occurred_year),
        occurred_month: Number(form.occurred_month),
        crime_category: form.crime_category,
        crime_type: form.crime_type.trim(),
        status: form.status,
        description: form.description.trim(),
        description_masked: false,
        source_url: form.source_url.trim(),
        source_name: null,
        submitter_comment: form.submitter_comment.trim() || null,
        is_published: false,
      };

      console.log("投稿データ:", insertPayload);

      await insertCaseWithFallback(insertPayload);

      setSubmitStatus("success");
      setForm(INITIAL_FORM);
      setDescLength(0);
    } catch (err: unknown) {
      console.error("投稿エラー:", err);
      setErrorMessage(formatErrorForUser(err));
      setSubmitStatus("error");
    }
  };

  // ============================================================
  // スタイル定数（インライン）
  // ============================================================

  const s = {
    wrap: {
      maxWidth: 720,
      margin: "40px auto",
      padding: "0 16px 60px",
      fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    } as React.CSSProperties,

    header: {
      borderBottom: "2px solid #1a1a1a",
      paddingBottom: 16,
      marginBottom: 32,
    } as React.CSSProperties,

    h1: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      margin: "0 0 6px",
      color: "#1a1a1a",
    } as React.CSSProperties,

    subtitle: {
      fontSize: 13,
      color: "#666",
      margin: 0,
    } as React.CSSProperties,

    section: {
      background: "#fff",
      border: "1px solid #e8e8e8",
      borderRadius: 12,
      padding: "24px 28px",
      marginBottom: 16,
    } as React.CSSProperties,

    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      color: "#888",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      gap: 8,
    } as React.CSSProperties,

    sectionDot: (color: string): React.CSSProperties => ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color,
      display: "inline-block",
    }),

    field: {
      marginBottom: 20,
    } as React.CSSProperties,

    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#333",
      marginBottom: 6,
    } as React.CSSProperties,

    required: {
      fontSize: 11,
      color: "#E24B4A",
      marginLeft: 4,
      fontWeight: 400,
    } as React.CSSProperties,

    optional: {
      fontSize: 11,
      color: "#999",
      marginLeft: 4,
      fontWeight: 400,
    } as React.CSSProperties,

    hint: {
      fontSize: 12,
      color: "#888",
      marginTop: 5,
    } as React.CSSProperties,

    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1.5px solid #e0e0e0",
      borderRadius: 8,
      fontSize: 14,
      color: "#1a1a1a",
      background: "#fafafa",
      outline: "none",
      transition: "border-color 0.15s",
      boxSizing: "border-box" as const,
    } as React.CSSProperties,

    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1.5px solid #e0e0e0",
      borderRadius: 8,
      fontSize: 14,
      color: "#1a1a1a",
      background: "#fafafa",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box" as const,
      appearance: "none" as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      paddingRight: 36,
    } as React.CSSProperties,

    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: "1.5px solid #e0e0e0",
      borderRadius: 8,
      fontSize: 14,
      color: "#1a1a1a",
      background: "#fafafa",
      outline: "none",
      resize: "vertical" as const,
      lineHeight: 1.7,
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    } as React.CSSProperties,

    row: {
      display: "flex",
      gap: 12,
    } as React.CSSProperties,

    counter: (count: number): React.CSSProperties => ({
      fontSize: 12,
      marginTop: 5,
      textAlign: "right",
      color:
        count < DESCRIPTION_MIN
          ? "#E24B4A"
          : count > DESCRIPTION_MAX
          ? "#E24B4A"
          : "#1D9E75",
      fontWeight: 500,
    }),

    notice: {
      background: "#FFF8E6",
      border: "1px solid #F5D68A",
      borderRadius: 8,
      padding: "12px 16px",
      fontSize: 13,
      color: "#7A5800",
      lineHeight: 1.6,
      marginBottom: 20,
    } as React.CSSProperties,

    errorBox: {
      background: "#FFF0F0",
      border: "1px solid #F7C1C1",
      borderRadius: 8,
      padding: "12px 16px",
      fontSize: 13,
      color: "#791F1F",
      marginBottom: 16,
    } as React.CSSProperties,

    successBox: {
      background: "#E1F5EE",
      border: "1px solid #5DCAA5",
      borderRadius: 12,
      padding: "32px 28px",
      textAlign: "center" as const,
    } as React.CSSProperties,

    submitBtn: {
      width: "100%",
      padding: "14px 24px",
      background: "#1a1a1a",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: "0.02em",
      transition: "background 0.15s",
    } as React.CSSProperties,
  };

  // ============================================================
  // 成功画面
  // ============================================================

  if (submitStatus === "success") {
    return (
      <div style={s.wrap}>
        <div style={s.successBox}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#085041" }}>
            投稿を受け付けました
          </h2>
          <p style={{ fontSize: 14, color: "#0F6E56", margin: "0 0 24px", lineHeight: 1.7 }}>
            管理者が内容を確認後、地図に反映されます。<br />
            審査には数日かかる場合があります。
          </p>
          <button
            onClick={() => setSubmitStatus("idle")}
            style={{
              padding: "10px 24px",
              background: "#085041",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            続けて投稿する
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // フォーム本体
  // ============================================================

  return (
    <div style={s.wrap}>
      {/* ヘッダー */}
      <div style={s.header}>
        <h1 style={s.h1}>事件情報を投稿する</h1>
        <p style={s.subtitle}>
          投稿内容は管理者の確認後に地図へ反映されます。個人名・詳細住所は入力しないでください。
        </p>
      </div>

      {/* エラー表示 */}
      {submitStatus === "error" && errorMessage && (
        <div style={{ ...s.errorBox, whiteSpace: "pre-wrap" }}>⚠️ {errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── セクション1: 発生情報 ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#378ADD")} />
            発生情報
          </div>

          {/* 発生年月 */}
          <div style={s.field}>
            <label style={s.label}>
              発生年月<span style={s.required}>必須</span>
            </label>
            <div style={s.row}>
              <div style={{ flex: 1 }}>
                <select
                  name="occurred_year"
                  value={form.occurred_year}
                  onChange={handleChange}
                  required
                  style={s.select}
                >
                  <option value="">年を選択</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <select
                  name="occurred_month"
                  value={form.occurred_month}
                  onChange={handleChange}
                  required
                  style={s.select}
                >
                  <option value="">月を選択</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
            </div>
            <p style={s.hint}>※「〇月〇日」は扱いません。月単位での入力のみ受け付けます。</p>
          </div>

          {/* 都道府県 */}
          <div style={s.field}>
            <label style={s.label}>
              都道府県<span style={s.required}>必須</span>
            </label>
            <select
              name="prefecture"
              value={form.prefecture}
              onChange={handleChange}
              required
              style={s.select}
            >
              <option value="">都道府県を選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 市区町村 */}
          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              市区町村<span style={s.optional}>任意</span>
            </label>
            <input
              type="text"
              name="city"
              placeholder="例: 大阪市、羽村市神明台、横浜市など（空欄可）"
              value={form.city}
              onChange={handleChange}
              style={s.input}
            />
            <p style={s.hint}>※市区町村は任意です。報道表記に合わせて入力できます。詳細住所や個人宅が推測できる情報は避けてください。</p>
          </div>
        </div>

        {/* ── セクション2: 事件内容 ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#E24B4A")} />
            事件内容
          </div>

          {/* 犯罪カテゴリ */}
          <div style={s.field}>
            <label style={s.label}>
              犯罪カテゴリ<span style={s.required}>必須</span>
            </label>
            <select
              name="crime_category"
              value={form.crime_category}
              onChange={handleChange}
              required
              style={s.select}
            >
              {CRIME_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 犯罪種別（自由記入） */}
          <div style={s.field}>
            <label style={s.label}>
              犯罪種別<span style={s.required}>必須</span>
            </label>
            <input
              type="text"
              name="crime_type"
              placeholder="例: 窃盗、詐欺、暴行、器物損壊"
              value={form.crime_type}
              onChange={handleChange}
              required
              style={s.input}
            />
          </div>

          {/* 処分結果 */}
          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              処分結果<span style={s.required}>必須</span>
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
              style={s.select}
            >
              {CASE_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── セクション3: 詳細・ソース ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#1D9E75")} />
            詳細・ソース情報
          </div>

          {/* プライバシー注意書き */}
          <div style={s.notice}>
            🔒 <strong>個人情報の取り扱いについて</strong><br />
            氏名・詳細住所・「〇〇町の〜」など個人を特定できる情報は記載しないでください。
            管理者がマスク処理を行いますが、投稿前に必ずご確認ください。
          </div>

          {/* 事件概要 */}
          <div style={s.field}>
            <label style={s.label}>
              事件概要<span style={s.required}>必須</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              minLength={DESCRIPTION_MIN}
              maxLength={DESCRIPTION_MAX}
              rows={6}
              placeholder={`ニュース記事などを参考に、事件の概要を${DESCRIPTION_MIN}〜${DESCRIPTION_MAX}文字で記述してください。\n\n例：○○市内のコンビニエンスストアで商品を窃取した疑いで逮捕された成人の男性について、○○地方検察庁は示談が成立したことなどを考慮し、起訴猶予処分とした。`}
              style={s.textarea}
            />
            <p style={s.counter(descLength)}>
              {descLength} / {DESCRIPTION_MAX} 文字
              {descLength < DESCRIPTION_MIN && descLength > 0 &&
                `（あと ${DESCRIPTION_MIN - descLength} 文字以上必要）`}
            </p>
          </div>

          {/* ソースURL */}
          <div style={s.field}>
            <label style={s.label}>
              ソースURL（情報元）<span style={s.required}>必須</span>
            </label>
            <input
              type="url"
              name="source_url"
              placeholder="https://www.example-news.jp/article/..."
              value={form.source_url}
              onChange={handleChange}
              required
              style={s.input}
            />
            <p style={s.hint}>ニュース記事・公式発表など、情報の出典URLを入力してください。</p>
          </div>

          {/* 投稿者コメント */}
          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              投稿者コメント<span style={s.optional}>任意</span>
            </label>
            <textarea
              name="submitter_comment"
              value={form.submitter_comment}
              onChange={handleChange}
              rows={3}
              placeholder="管理者へのメモや補足情報があれば記入してください（公開されません）"
              style={s.textarea}
            />
            <p style={s.hint}>※このコメントは管理者のみが確認できます。公開されません。</p>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={submitStatus === "submitting"}
          style={{
            ...s.submitBtn,
            background: submitStatus === "submitting" ? "#999" : "#1a1a1a",
            cursor: submitStatus === "submitting" ? "not-allowed" : "pointer",
          }}
        >
          {submitStatus === "submitting" ? "送信中..." : "内容を確認して投稿する →"}
        </button>

        <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 12 }}>
          投稿後、管理者の承認を経て地図に反映されます
        </p>
      </form>
    </div>
  );
}
