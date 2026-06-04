
"use client";
import { useState, useEffect } from "react";
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

type PrefecturesRow = {
  id: number;
  name: string;
};

type CitiesRow = {
  id: number;
  prefecture_id: number;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
};

type FacilityType =
  | "temple"
  | "shrine"
  | "pig_farm"
  | "chicken_farm"
  | "sake_brewery"
  | "cultural_property"
  | "other";

type FireCause =
  | "investigating"
  | "electrical"
  | "arson"
  | "suspected_arson"
  | "careless_fire"
  | "lightning"
  | "unknown"
  | "other";

type FormState = {
  occurred_year: string;
  occurred_month: string;
  prefecture_id: string;
  city_id: string;
  facility_type: FacilityType;
  facility_name: string;
  fire_cause: FireCause;
  description: string;
  source_url: string;
  submitter_comment: string;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

// ============================================================
// 定数
// ============================================================

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: "temple", label: "寺院" },
  { value: "shrine", label: "神社" },
  { value: "pig_farm", label: "豚舎" },
  { value: "chicken_farm", label: "鶏舎" },
  { value: "sake_brewery", label: "酒蔵" },
  { value: "cultural_property", label: "重要文化財・文化施設" },
  { value: "other", label: "その他重要施設" },
];

const FIRE_CAUSES: { value: FireCause; label: string }[] = [
  { value: "investigating", label: "調査中" },
  { value: "electrical", label: "電気設備" },
  { value: "arson", label: "放火（確定）" },
  { value: "suspected_arson", label: "放火の疑い" },
  { value: "careless_fire", label: "失火" },
  { value: "lightning", label: "落雷" },
  { value: "unknown", label: "原因不明" },
  { value: "other", label: "その他" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const DESCRIPTION_MIN = 80;
const DESCRIPTION_MAX = 300;

const INITIAL_FORM: FormState = {
  occurred_year: "",
  occurred_month: "",
  prefecture_id: "",
  city_id: "",
  facility_type: "temple",
  facility_name: "",
  fire_cause: "investigating",
  description: "",
  source_url: "",
  submitter_comment: "",
};

// ============================================================
// コンポーネント
// ============================================================

export default function CaseSubmissionForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [prefectures, setPrefectures] = useState<PrefecturesRow[]>([]);
  const [cities, setCities] = useState<CitiesRow[]>([]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [descLength, setDescLength] = useState(0);

  useEffect(() => {
    async function fetchPrefectures() {
      try {
        const { data, error } = await supabase
          .from("prefectures")
          .select("id, name")
          .order("id", { ascending: true });

        if (error) throw error;
        if (data) setPrefectures(data);
      } catch (err) {
        console.error("都道府県データの取得に失敗しました:", err);
        setErrorMessage("都道府県マスターの読み込みに失敗しました。ページを再読み込みしてください。");
        setSubmitStatus("error");
      }
    }

    fetchPrefectures();
  }, []);

  useEffect(() => {
    if (!form.prefecture_id) {
      setCities([]);
      return;
    }

    async function fetchCities() {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("id, prefecture_id, name, center_lat, center_lng")
          .eq("prefecture_id", Number(form.prefecture_id))
          .order("id", { ascending: true });

        if (error) throw error;
        if (data) setCities(data);
      } catch (err) {
        console.error("市区町村データの取得に失敗しました:", err);
        setErrorMessage("市区町村マスターの読み込みに失敗しました。");
        setSubmitStatus("error");
      }
    }

    fetchCities();
  }, [form.prefecture_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "prefecture_id") {
        updated.city_id = "";
      }

      return updated;
    });

    if (name === "description") setDescLength(value.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMessage("");

    if (!form.occurred_year || !form.occurred_month) {
      setErrorMessage("発生年月を選択してください。");
      setSubmitStatus("error");
      return;
    }

    if (!form.prefecture_id || !form.city_id) {
      setErrorMessage("都道府県と市区町村を選択してください。");
      setSubmitStatus("error");
      return;
    }

    if (descLength < DESCRIPTION_MIN) {
      setErrorMessage(`火災概要は${DESCRIPTION_MIN}文字以上入力してください（現在 ${descLength} 文字）`);
      setSubmitStatus("error");
      return;
    }

    if (form.source_url && !form.source_url.startsWith("http")) {
      setErrorMessage("ソースURLは http:// または https:// で始まる形式で入力してください。");
      setSubmitStatus("error");
      return;
    }

    const selectedCity = cities.find((c) => c.id === Number(form.city_id));

    if (!selectedCity) {
      setErrorMessage("選択された市区町村データが見つかりません。");
      setSubmitStatus("error");
      return;
    }

    if (selectedCity.center_lat === null || selectedCity.center_lng === null) {
      setErrorMessage("選択された市区町村にピン表示用の位置情報が登録されていません。");
      setSubmitStatus("error");
      return;
    }

    try {
      const { error } = await supabase.from("cases").insert({
        prefecture_id: Number(form.prefecture_id),
        city_id: selectedCity.id,
        latitude: selectedCity.center_lat,
        longitude: selectedCity.center_lng,
        occurred_year: Number(form.occurred_year),
        occurred_month: Number(form.occurred_month),
        facility_type: form.facility_type,
        facility_name: form.facility_name || null,
        fire_cause: form.fire_cause,
        description: form.description,
        description_masked: false,
        source_url: form.source_url || null,
        source_name: null,
        submitter_comment: form.submitter_comment || null,
        is_published: false,
      });

      if (error) throw error;

      setSubmitStatus("success");
      setForm(INITIAL_FORM);
      setDescLength(0);
    } catch (err: unknown) {
      console.error("投稿エラー:", err);
      const message =
        err instanceof Error
          ? err.message
          : "投稿に失敗しました。時間をおいて再度お試しください。";
      setErrorMessage(message);
      setSubmitStatus("error");
    }
  };

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
      lineHeight: 1.7,
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
      lineHeight: 1.6,
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
    } as React.CSSProperties,
  };

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

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.h1}>火災事例を投稿する</h1>
        <p style={s.subtitle}>
          投稿内容は管理者の確認後に地図へ反映されます。個人名・詳細住所・根拠のない犯人推定は入力しないでください。
        </p>
      </div>

      {submitStatus === "error" && errorMessage && (
        <div style={s.errorBox}>⚠️ {errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#378ADD")} />
            発生情報
          </div>

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
                    <option key={y} value={y}>
                      {y}年
                    </option>
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
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p style={s.hint}>※日付までは扱わず、月単位で登録します。</p>
          </div>

          <div style={s.field}>
            <label style={s.label}>
              都道府県<span style={s.required}>必須</span>
            </label>
            <select
              name="prefecture_id"
              value={form.prefecture_id}
              onChange={handleChange}
              required
              style={s.select}
            >
              <option value="">都道府県を選択</option>
              {prefectures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              市区町村<span style={s.required}>必須</span>
            </label>
            <select
              name="city_id"
              value={form.city_id}
              onChange={handleChange}
              disabled={!form.prefecture_id}
              required
              style={s.select}
            >
              <option value="">
                {form.prefecture_id ? "市区町村を選択" : "先に都道府県を選択してください"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p style={s.hint}>※番地・丁目など詳細住所は登録しません。</p>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#E24B4A")} />
            施設・火災情報
          </div>

          <div style={s.field}>
            <label style={s.label}>
              施設種別<span style={s.required}>必須</span>
            </label>
            <select
              name="facility_type"
              value={form.facility_type}
              onChange={handleChange}
              required
              style={s.select}
            >
              {FACILITY_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>
              施設名称<span style={s.optional}>任意</span>
            </label>
            <input
              type="text"
              name="facility_name"
              placeholder="例：〇〇寺、〇〇神社、〇〇酒造"
              value={form.facility_name}
              onChange={handleChange}
              style={s.input}
            />
            <p style={s.hint}>※報道・公式発表で確認できる名称のみ入力してください。</p>
          </div>

          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              火災原因<span style={s.required}>必須</span>
            </label>
            <select
              name="fire_cause"
              value={form.fire_cause}
              onChange={handleChange}
              required
              style={s.select}
            >
              {FIRE_CAUSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p style={s.hint}>※原因が確定していない場合は「調査中」または「原因不明」を選択してください。</p>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>
            <span style={s.sectionDot("#1D9E75")} />
            詳細・ソース情報
          </div>

          <div style={s.notice}>
            🔒 <strong>掲載方針</strong>
            <br />
            詳細住所・個人名・根拠のない犯人推定・特定宗教や団体との関連付けは記載しないでください。
            防災・再発防止のための公開情報として扱います。
          </div>

          <div style={s.field}>
            <label style={s.label}>
              火災概要<span style={s.required}>必須</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              minLength={DESCRIPTION_MIN}
              maxLength={DESCRIPTION_MAX}
              rows={6}
              placeholder={`ニュース記事・公式発表を参考に、火災概要を${DESCRIPTION_MIN}〜${DESCRIPTION_MAX}文字で記述してください。\n\n例：○○市の神社で本殿の一部を焼く火災が発生した。けが人は確認されておらず、消防が出火原因を調べている。`}
              style={s.textarea}
            />
            <p style={s.counter(descLength)}>
              {descLength} / {DESCRIPTION_MAX} 文字
              {descLength < DESCRIPTION_MIN && descLength > 0 &&
                `（あと ${DESCRIPTION_MIN - descLength} 文字以上必要）`}
            </p>
          </div>

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
            <p style={s.hint}>ニュース記事・消防/自治体発表など、情報の出典URLを入力してください。</p>
          </div>

          <div style={{ ...s.field, marginBottom: 0 }}>
            <label style={s.label}>
              投稿者コメント<span style={s.optional}>任意</span>
            </label>
            <textarea
              name="submitter_comment"
              value={form.submitter_comment}
              onChange={handleChange}
              rows={3}
              placeholder="管理者へのメモや補足情報があれば記入してください（原則公開されません）"
              style={s.textarea}
            />
          </div>
        </div>

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
