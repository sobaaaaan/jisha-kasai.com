// ============================================================
// components/CaseMap.tsx
// 左カラム + 上部広告カラム + 地図メイン
// 「cases」テーブルの latitude / longitude を直接読んで、1事件=1ピンで表示する版
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

type CategoryFilter = "all" | CategoryKey;

interface CaseRow {
  id: number;
  latitude: number | null;
  longitude: number | null;
  occurred_year: number | null;
  occurred_month: number | null;
  crime_category: CategoryKey | string | null;
  status: string | null;
  description: string | null;
  source_url: string | null;
  submitter_comment?: string | null;
}

interface CasePoint {
  id: number;
  lat: number;
  lng: number;
  occurred_year: number | null;
  occurred_month: number | null;
  crime_category: CategoryKey;
  status: string | null;
  description: string;
  source_url: string | null;
  submitter_comment: string | null;
}

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

function normalizeCategory(value: string | null): CategoryKey {
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

async function fetchCasePoints(categoryFilter: CategoryFilter): Promise<CasePoint[]> {
  let query = supabase
    .from("cases")
    .select(
      "id, latitude, longitude, occurred_year, occurred_month, crime_category, status, description, source_url, submitter_comment"
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("id", { ascending: false });

  if (categoryFilter !== "all") {
    query = query.eq("crime_category", categoryFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch cases error:", error);
    return [];
  }

  if (!data) return [];

  return (data as CaseRow[])
    .filter((row) => row.latitude != null && row.longitude != null)
    .map((row) => ({
      id: row.id,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      occurred_year: row.occurred_year,
      occurred_month: row.occurred_month,
      crime_category: normalizeCategory(row.crime_category),
      status: row.status,
      description: row.description ?? "説明なし",
      source_url: row.source_url,
      submitter_comment: row.submitter_comment ?? null,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lng) &&
        item.lat >= -90 &&
        item.lat <= 90 &&
        item.lng >= -180 &&
        item.lng <= 180
    );
}

function statusLabel(status: string | null): string {
  if (status === "nonprosecution") return "不起訴";
  if (status === "unknown") return "不明";
  if (!status) return "未設定";
  return status;
}

function buildPopupHTML(item: CasePoint): string {
  const categoryLabel = CRIME_CATEGORY_LABELS[item.crime_category] ?? "その他";
  const occurred =
    item.occurred_year && item.occurred_month
      ? `${item.occurred_year}年${item.occurred_month}月`
      : item.occurred_year
      ? `${item.occurred_year}年`
      : "発生時期不明";

  const sourceLink = item.source_url
    ? `<a href="${item.source_url}" target="_blank" rel="noopener noreferrer" style="color:#1565c0;text-decoration:underline;">ソースを開く</a>`
    : `<span style="color:#999;">ソースURLなし</span>`;

  return `
    <div style="font-family:sans-serif;min-width:220px;max-width:300px;">
      <p style="margin:0 0 6px;font-weight:700;font-size:14px;line-height:1.5;">
        ${item.description}
      </p>

      <table style="border-collapse:collapse;width:100%;margin-top:8px;">
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;font-size:12px;">分類</td>
          <td style="padding:2px 0;font-weight:700;font-size:12px;">${categoryLabel}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;font-size:12px;">処分</td>
          <td style="padding:2px 0;font-weight:700;font-size:12px;">${statusLabel(item.status)}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;font-size:12px;">時期</td>
          <td style="padding:2px 0;font-weight:700;font-size:12px;">${occurred}</td>
        </tr>
      </table>

      ${
        item.submitter_comment
          ? `<p style="margin:8px 0 0;color:#555;font-size:12px;line-height:1.5;">${item.submitter_comment}</p>`
          : ""
      }

      <p style="margin:8px 0 0;font-size:12px;">
        ${sourceLink}
      </p>

      <p style="margin:8px 0 0;color:#999;font-size:11px;">
        ※現在は投稿時に保存された緯度経度を使って表示しています
      </p>
    </div>
  `;
}

export default function CaseMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [cases, setCases] = useState<CasePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (filter: CategoryFilter) => {
    setLoading(true);
    const result = await fetchCasePoints(filter);
    setCases(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(categoryFilter);
  }, [categoryFilter, loadData]);

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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (loading) return;

    cases.forEach((item) => {
      const color = CATEGORY_COLORS[item.crime_category] ?? CATEGORY_COLORS.other;

      const el = document.createElement("div");
      el.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #fff;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.32);
        transition: transform 0.15s ease;
      `;
      el.title = item.description;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.25)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        maxWidth: "320px",
      }).setHTML(buildPopupHTML(item));

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        // MapLibreは [経度, 緯度] の順番です
        .setLngLat([item.lng, item.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [cases, loading]);

  const latestCases = [...cases].slice(0, 10);

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
              表示中の事件数
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>
              {loading ? "…" : cases.length.toLocaleString()}
              <span style={{ fontSize: 13, color: "#777", marginLeft: 4 }}>件</span>
            </div>
          </section>

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

            <p style={{ fontSize: 11, color: "#999", lineHeight: 1.6, margin: "10px 0 0" }}>
              ※latitude / longitude が入っている事件のみ表示します。
            </p>
          </section>

          <section style={sideAdStyle}>
            左カラム広告枠
            <br />
            <span style={{ fontSize: 11 }}>縦長広告・自社広告・note導線など</span>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>新着投稿</h2>

            {loading ? (
              <p style={emptyTextStyle}>読み込み中…</p>
            ) : latestCases.length === 0 ? (
              <p style={emptyTextStyle}>表示できるデータがありません。cases.latitude / cases.longitude を確認してください。</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {latestCases.map((item) => (
                  <li
                    key={item.id}
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0", fontSize: 13 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        mapRef.current?.flyTo({
                          center: [item.lng, item.lat],
                          zoom: 12,
                          speed: 0.8,
                        });
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
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description.length > 42
                        ? `${item.description.slice(0, 42)}…`
                        : item.description}
                    </button>
                    <div style={{ color: "#777", fontSize: 12 }}>
                      {CRIME_CATEGORY_LABELS[item.crime_category]} / {statusLabel(item.status)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>お知らせ</h2>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
              現在は「1事件=1ピン」の試験表示です。住所から緯度経度を自動取得する処理を追加すると、投稿内容が自動で地図に反映されます。
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
            cases テーブルの latitude / longitude を使って表示中
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
