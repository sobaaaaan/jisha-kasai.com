// ============================================================
// components/CaseMap.tsx
// 左カラム + 上部広告カラム + 地図メイン
// cases テーブルを直接読み込み、「1事件 = 1ピン」で表示する版。
// city_case_summary は使いません。
// ============================================================

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CategoryKey =
  | "violent"
  | "property"
  | "sexual"
  | "drug"
  | "traffic"
  | "public_order"
  | "white_collar"
  | "cyber"
  | "other";

type StatusKey =
  | "nonprosecution"
  | "nonprosecution_suspend"
  | "nonprosecution_innocence"
  | "indicted"
  | "convicted"
  | "acquitted"
  | "dismissed"
  | "other";

type CaseRow = {
  id: number;
  title?: string | null;
  prefecture_id?: number | null;
  city_id?: number | null;
  city_name?: string | null;
  display_lat?: number | string | null;
  display_lng?: number | string | null;
  location_accuracy?: string | null;
  occurred_year?: number | null;
  occurred_month?: number | null;
  crime_category?: CategoryKey | string | null;
  crime_type?: string | null;
  status?: StatusKey | string | null;
  description?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  is_published?: boolean | null;
  created_at?: string | null;
};

type CategoryFilter = "all" | CategoryKey;
type StatusFilter = "all" | StatusKey;

const CRIME_CATEGORY_LABELS: Record<CategoryKey, string> = {
  violent: "暴力犯罪",
  property: "財産犯罪",
  sexual: "性犯罪",
  drug: "薬物",
  traffic: "交通",
  public_order: "公序・風俗",
  white_collar: "経済犯罪",
  cyber: "サイバー",
  other: "その他",
};

const STATUS_LABELS: Record<StatusKey, string> = {
  nonprosecution: "不起訴（広義）",
  nonprosecution_suspend: "起訴猶予",
  nonprosecution_innocence: "嫌疑なし・嫌疑不十分",
  indicted: "起訴",
  convicted: "有罪",
  acquitted: "無罪",
  dismissed: "公訴棄却",
  other: "その他",
};

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  violent: "#E24B4A",
  property: "#378ADD",
  sexual: "#D4537E",
  drug: "#BA7517",
  traffic: "#1D9E75",
  public_order: "#7F77DD",
  white_collar: "#639922",
  cyber: "#888780",
  other: "#888780",
};

const MAP_STYLE = {
  version: 8,
  sources: {
    gsi: {
      type: "raster",
      tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: "gsi-pale",
      type: "raster",
      source: "gsi",
      minzoom: 0,
      maxzoom: 18,
    },
  ],
} as maplibregl.StyleSpecification;

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCategory(value: string | null | undefined): CategoryKey {
  if (
    value === "violent" ||
    value === "property" ||
    value === "sexual" ||
    value === "drug" ||
    value === "traffic" ||
    value === "public_order" ||
    value === "white_collar" ||
    value === "cyber" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function normalizeStatus(value: string | null | undefined): StatusKey {
  if (
    value === "nonprosecution" ||
    value === "nonprosecution_suspend" ||
    value === "nonprosecution_innocence" ||
    value === "indicted" ||
    value === "convicted" ||
    value === "acquitted" ||
    value === "dismissed" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function escapeHTML(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortText(value: string | null | undefined, max = 160): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function buildPopupHTML(row: CaseRow): string {
  const category = normalizeCategory(row.crime_category);
  const status = normalizeStatus(row.status);
  const title = row.title || row.crime_type || `${CRIME_CATEGORY_LABELS[category]}の事件`;

  const ym =
    row.occurred_year && row.occurred_month
      ? `${row.occurred_year}年${row.occurred_month}月`
      : "発生年月不明";

  const source = row.source_url
    ? `<a href="${escapeHTML(row.source_url)}" target="_blank" rel="noreferrer" style="color:#1565c0;text-decoration:none;">情報源を開く</a>`
    : `<span style="color:#999;">情報源URLなし</span>`;

  return `
    <div style="font-family:sans-serif;min-width:230px;max-width:280px;">
      <p style="margin:0 0 6px;font-weight:700;font-size:14px;line-height:1.45;">
        ${escapeHTML(title)}
      </p>
      <p style="margin:0 0 8px;color:#777;font-size:12px;">
        ${escapeHTML(row.city_name || "市区町村不明")} / ${ym}
      </p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-size:11px;background:#f1f1f1;border-radius:999px;padding:3px 7px;color:#444;">
          ${escapeHTML(CRIME_CATEGORY_LABELS[category])}
        </span>
        <span style="font-size:11px;background:#fff1f1;border-radius:999px;padding:3px 7px;color:#8a2222;">
          ${escapeHTML(STATUS_LABELS[status])}
        </span>
      </div>
      ${
        row.description
          ? `<p style="margin:0 0 8px;color:#333;font-size:12px;line-height:1.65;">${escapeHTML(shortText(row.description, 180))}</p>`
          : `<p style="margin:0 0 8px;color:#999;font-size:12px;">概要なし</p>`
      }
      <p style="margin:0;font-size:12px;">${source}</p>
    </div>
  `;
}

async function fetchCases(): Promise<CaseRow[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Supabase cases fetch error:", error);
    throw error;
  }

  return (data ?? []) as CaseRow[];
}

export default function CaseMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showUnpublished, setShowUnpublished] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchCases();
      setCases(result);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "casesテーブルの取得に失敗しました。";
      setErrorMessage(message);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [137.0, 37.0],
      zoom: 4.8,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-right"
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const filteredCases = useMemo(() => {
    return cases
      .filter((row) => {
        const lat = toNumber(row.display_lat);
        const lng = toNumber(row.display_lng);
        if (lat === null || lng === null) return false;

        if (!showUnpublished && row.is_published === false) return false;

        const cat = normalizeCategory(row.crime_category);
        if (categoryFilter !== "all" && cat !== categoryFilter) return false;

        const st = normalizeStatus(row.status);
        if (statusFilter !== "all" && st !== statusFilter) return false;

        return true;
      })
      .slice(0, 2000);
  }, [cases, categoryFilter, statusFilter, showUnpublished]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (loading) return;

    filteredCases.forEach((row) => {
      const lat = toNumber(row.display_lat);
      const lng = toNumber(row.display_lng);
      if (lat === null || lng === null) return;

      const category = normalizeCategory(row.crime_category);
      const color = CATEGORY_COLORS[category];

      const el = document.createElement("div");
      el.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        transform: rotate(-45deg);
        cursor: pointer;
      `;

      const inner = document.createElement("div");
      inner.style.cssText = `
        width: 8px;
        height: 8px;
        background: #fff;
        border-radius: 50%;
        position: absolute;
        left: 5px;
        top: 5px;
      `;
      el.appendChild(inner);

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        maxWidth: "320px",
      }).setHTML(buildPopupHTML(row));

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredCases, loading]);

  const latestCases = filteredCases.slice(0, 10);
  const noCoordinateCount = cases.filter(
    (row) => toNumber(row.display_lat) === null || toNumber(row.display_lng) === null
  ).length;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        background: "#f4f4f4",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 340,
          minWidth: 300,
          maxWidth: 380,
          height: "100vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRight: "1px solid #ddd",
          boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
          zIndex: 20,
        }}
      >
        <div style={{ padding: "18px 18px 24px" }}>
          <h1 style={{ fontSize: 20, margin: "0 0 4px", fontWeight: 800, color: "#1a1a1a" }}>
            不起訴事件マップ
          </h1>

          <p style={{ margin: "0 0 14px", color: "#666", fontSize: 12, lineHeight: 1.6 }}>
            報道・公開情報をもとに、不起訴処分等の事件情報を地図上で可視化します。
          </p>

          <a
            href="/submit"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px 12px",
              borderRadius: 10,
              background: "#1a1a1a",
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            事件情報を投稿する
          </a>

          <section style={cardStyle}>
            <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
              表示中のピン数
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>
              {loading ? "…" : filteredCases.length.toLocaleString()}
              <span style={{ fontSize: 13, color: "#777", marginLeft: 4 }}>件</span>
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6, lineHeight: 1.5 }}>
              cases総数: {cases.length.toLocaleString()}件
              {noCoordinateCount > 0 && (
                <>
                  <br />
                  座標未設定: {noCoordinateCount.toLocaleString()}件
                </>
              )}
            </div>
          </section>

          {errorMessage && (
            <section
              style={{
                ...cardStyle,
                background: "#fff1f1",
                color: "#8a2222",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <strong>データ取得エラー</strong>
              <br />
              {errorMessage}
            </section>
          )}

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>絞り込み</h2>

            <label style={labelStyle}>犯罪カテゴリ</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              style={inputStyle}
            >
              <option value="all">すべて</option>
              {Object.entries(CRIME_CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <label style={labelStyle}>処分結果</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={inputStyle}
            >
              <option value="all">すべて</option>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#555",
                marginTop: 12,
              }}
            >
              <input
                type="checkbox"
                checked={showUnpublished}
                onChange={(e) => setShowUnpublished(e.target.checked)}
              />
              未承認データも表示する（開発用）
            </label>
          </section>

          <section style={sideAdStyle}>
            左カラム広告枠
            <br />
            <span style={{ fontSize: 11 }}>縦長広告・自社広告・note導線など</span>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>新着事件</h2>

            {loading ? (
              <p style={emptyTextStyle}>読み込み中…</p>
            ) : latestCases.length === 0 ? (
              <p style={emptyTextStyle}>
                表示できる事件がありません。投稿データに display_lat / display_lng が入っているか確認してください。
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {latestCases.map((c) => {
                  const lat = toNumber(c.display_lat);
                  const lng = toNumber(c.display_lng);
                  const category = normalizeCategory(c.crime_category);
                  const status = normalizeStatus(c.status);
                  const label = c.title || c.crime_type || CRIME_CATEGORY_LABELS[category];

                  return (
                    <li
                      key={c.id}
                      style={{ borderBottom: "1px solid #eee", padding: "8px 0", fontSize: 13 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (lat !== null && lng !== null) {
                            mapRef.current?.flyTo({
                              center: [lng, lat],
                              zoom: 12,
                              speed: 0.8,
                            });
                          }
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                          textAlign: "left",
                          color: "#1565c0",
                          fontWeight: 700,
                          lineHeight: 1.45,
                        }}
                      >
                        {label}
                      </button>
                      <div style={{ color: "#777", fontSize: 12, lineHeight: 1.5 }}>
                        {c.city_name || "市区町村不明"} / {STATUS_LABELS[status]}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>お知らせ</h2>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
              現在は試験運用中です。1事件=1ピン方式で表示しています。
            </p>
          </section>
        </div>
      </aside>

      <section style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={topBarStyle}>
          <div style={topAdStyle}>
            上部広告枠
            <br />
            728×90 / 970×90 などの横長広告を想定
          </div>
        </header>

        <main style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 60,
              fontSize: 10,
              color: "#777",
              background: "rgba(255,255,255,0.85)",
              padding: "4px 8px",
              borderRadius: 6,
              zIndex: 10,
            }}
          >
            位置情報は市区町村単位・日時は月単位での表示です
          </div>
        </main>
      </section>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e7e7e7",
  borderRadius: 12,
  padding: 14,
  marginBottom: 16,
  background: "#fff",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  margin: "0 0 12px",
  fontWeight: 700,
  color: "#222",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  margin: "10px 0 5px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  boxSizing: "border-box",
  background: "#fff",
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#999",
  margin: 0,
};

const sideAdStyle: React.CSSProperties = {
  border: "1px dashed #cfcfcf",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  background: "#fcfcfc",
  color: "#999",
  textAlign: "center",
  fontSize: 13,
};

const topBarStyle: React.CSSProperties = {
  height: 96,
  minHeight: 96,
  background: "#fff",
  borderBottom: "1px solid #ddd",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 16px",
  boxSizing: "border-box",
  zIndex: 15,
};

const topAdStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 970,
  height: 90,
  border: "1px dashed #cfcfcf",
  borderRadius: 8,
  background: "#fafafa",
  color: "#999",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  fontSize: 13,
  lineHeight: 1.5,
};
