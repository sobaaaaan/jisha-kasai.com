// ============================================================
// components/CaseMap.tsx
// 左カラム + 上部広告カラム + 地図メイン
// 大島てる型レイアウトを意識し、広告・新着情報・投稿導線を置ける構成。
// 現在は city_case_summary を使った市区町村単位の集計表示。
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

interface CitySummaryRow {
  prefecture_id: number;
  prefecture_name: string;
  city_id: number | null;
  city_name: string | null;
  center_lat: number | null;
  center_lng: number | null;
  population: number | null;
  case_count: number;
  violent_count?: number | null;
  property_count?: number | null;
  sexual_count?: number | null;
  drug_count?: number | null;
  traffic_count?: number | null;
  public_order_count?: number | null;
  white_collar_count?: number | null;
  cyber_count?: number | null;
  other_count?: number | null;
}

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

interface CityAggregated {
  city_id: number | null;
  city_name: string;
  prefecture_name: string;
  lat: number;
  lng: number;
  total_count: number;
  counts: Record<CategoryKey, number>;
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

async function fetchCitySummary(categoryFilter: CategoryFilter): Promise<CityAggregated[]> {
  const { data, error } = await supabase
    .from("city_case_summary")
    .select("*")
    .order("case_count", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  if (!data) return [];

  return (data as CitySummaryRow[])
    .filter((row) => row.center_lat != null && row.center_lng != null)
    .map((row) => {
      const counts: Record<CategoryKey, number> = {
        violent: Number(row.violent_count ?? 0),
        property: Number(row.property_count ?? 0),
        sexual: Number(row.sexual_count ?? 0),
        drug: Number(row.drug_count ?? 0),
        traffic: Number(row.traffic_count ?? 0),
        public_order: Number(row.public_order_count ?? 0),
        white_collar: Number(row.white_collar_count ?? 0),
        cyber: Number(row.cyber_count ?? 0),
        other: Number(row.other_count ?? 0),
      };

      const filteredCount =
        categoryFilter === "all" ? Number(row.case_count ?? 0) : counts[categoryFilter];

      return {
        city_id: row.city_id,
        city_name: row.city_name ?? row.prefecture_name,
        prefecture_name: row.prefecture_name,
        lat: Number(row.center_lat),
        lng: Number(row.center_lng),
        total_count: filteredCount,
        counts,
      };
    })
    .filter((city) => city.total_count > 0);
}

function countToRadius(count: number): number {
  return Math.max(9, Math.min(42, 9 + Math.sqrt(count) * 5));
}

function getColor(city: CityAggregated, categoryFilter: CategoryFilter): string {
  if (categoryFilter !== "all") return CATEGORY_COLORS[categoryFilter];

  let maxCat: CategoryKey = "other";
  let maxCount = 0;

  for (const [cat, count] of Object.entries(city.counts) as [CategoryKey, number][]) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  }

  return CATEGORY_COLORS[maxCat];
}

function buildPopupHTML(city: CityAggregated): string {
  const rows = Object.entries(city.counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, count]) =>
        `<tr>
          <td style="padding:2px 8px 2px 0;color:#666;font-size:12px;">
            ${CRIME_CATEGORY_LABELS[cat as CategoryKey] ?? cat}
          </td>
          <td style="padding:2px 0;font-weight:700;font-size:12px;">${count}件</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;min-width:190px;">
      <p style="margin:0 0 4px;font-weight:700;font-size:14px;">
        ${city.city_name}
      </p>
      <p style="margin:0 0 8px;color:#888;font-size:12px;">
        ${city.prefecture_name}
      </p>
      <p style="margin:0 0 6px;font-size:13px;">
        合計 <strong>${city.total_count}</strong> 件
      </p>
      <table style="border-collapse:collapse;width:100%;">
        ${rows || '<tr><td style="font-size:12px;color:#888;">分類データなし</td></tr>'}
      </table>
      <p style="margin:8px 0 0;color:#999;font-size:11px;">
        ※現在は市区町村単位の集計表示です
      </p>
    </div>
  `;
}

export default function CaseMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [cities, setCities] = useState<CityAggregated[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = useCallback(async (filter: CategoryFilter) => {
    setLoading(true);
    const result = await fetchCitySummary(filter);
    setCities(result);
    setTotalCount(result.reduce((s, c) => s + c.total_count, 0));
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

    cities.forEach((city) => {
      const radius = countToRadius(city.total_count);
      const color = getColor(city, categoryFilter);

      const el = document.createElement("div");
      el.style.cssText = `
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        border-radius: 50%;
        background: ${color}55;
        border: 2px solid ${color};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${radius > 16 ? "11px" : "9px"};
        font-weight: 700;
        color: ${color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        transition: transform 0.15s ease;
      `;
      el.textContent = String(city.total_count);
      el.title = city.city_name;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      const popup = new maplibregl.Popup({
        offset: radius + 4,
        closeButton: false,
        maxWidth: "260px",
      }).setHTML(buildPopupHTML(city));

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([city.lng, city.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [cities, loading, categoryFilter]);

  const latestCities = [...cities]
    .sort((a, b) => b.total_count - a.total_count)
    .slice(0, 10);

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
              {loading ? "…" : totalCount.toLocaleString()}
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
              ※現在はカテゴリ絞り込みのみ対応しています。
            </p>
          </section>

          <section style={sideAdStyle}>
            左カラム広告枠
            <br />
            <span style={{ fontSize: 11 }}>縦長広告・自社広告・note導線など</span>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>件数の多い地域</h2>

            {loading ? (
              <p style={emptyTextStyle}>読み込み中…</p>
            ) : latestCities.length === 0 ? (
              <p style={emptyTextStyle}>表示できるデータがありません。</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {latestCities.map((c) => (
                  <li
                    key={`${c.prefecture_name}-${c.city_name}`}
                    style={{ borderBottom: "1px solid #eee", padding: "8px 0", fontSize: 13 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        mapRef.current?.flyTo({
                          center: [c.lng, c.lat],
                          zoom: 10,
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
                      }}
                    >
                      {c.city_name}
                    </button>
                    <div style={{ color: "#777", fontSize: 12 }}>
                      {c.prefecture_name} / {c.total_count}件
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>お知らせ</h2>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, margin: 0 }}>
              現在は試験運用中です。次の段階で「1事件=1ピン」の大島てる風表示へ移行予定です。
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
