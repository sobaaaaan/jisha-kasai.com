// ============================================================
// components/CaseMap.tsx
// MapLibre GL JS を使って city_case_summary の件数を
// バブル（円）で地図上に表示するコンポーネント
//
// 依存パッケージのインストール:
//   npm install maplibre-gl @supabase/supabase-js
//   npm install -D @types/maplibre-gl
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// 型定義
// ============================================================

type CrimeCategoryKey =
  | "violent"
  | "property"
  | "sexual"
  | "drug"
  | "traffic"
  | "public_order"
  | "white_collar"
  | "cyber"
  | "other";

type CaseStatusKey =
  | "nonprosecution"
  | "nonprosecution_suspend"
  | "nonprosecution_innocence"
  | "indicted"
  | "convicted"
  | "acquitted"
  | "dismissed"
  | "other";

interface CitySummaryRow {
  prefecture_id: number;
  prefecture_name: string;
  city_id: number | null;
  city_name: string | null;
  center_lat: number | null;
  center_lng: number | null;
  population: number | null;
  crime_category: CrimeCategoryKey;
  status: CaseStatusKey;
  occurred_year: number;
  occurred_month: number;
  case_count: number;
}

// 地図に渡すためにcity単位で集計したデータ
interface CityAggregated {
  city_id: number | null;
  city_name: string;
  prefecture_name: string;
  lat: number;
  lng: number;
  total_count: number;
  by_category: Partial<Record<CrimeCategoryKey, number>>;
}

// フィルタ状態
interface FilterState {
  crime_category: CrimeCategoryKey | "all";
  status: CaseStatusKey | "all";
  year_from: number;
  year_to: number;
}

// ============================================================
// 定数・設定
// ============================================================

const CRIME_CATEGORY_LABELS: Record<CrimeCategoryKey, string> = {
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

const STATUS_LABELS: Record<CaseStatusKey, string> = {
  nonprosecution: "不起訴（広義）",
  nonprosecution_suspend: "起訴猶予",
  nonprosecution_innocence: "嫌疑なし・不十分",
  indicted: "起訴",
  convicted: "有罪",
  acquitted: "無罪",
  dismissed: "公訴棄却",
  other: "その他",
};

// バブルの色（犯罪カテゴリ別）
const CATEGORY_COLORS: Record<CrimeCategoryKey, string> = {
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

const DEFAULT_COLOR = "#378ADD";

// MapLibre の地図スタイル（国土地理院 淡色地図）
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

// Supabase クライアント（公開鍵のみ使用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// データ取得・整形ユーティリティ
// ============================================================

async function fetchCitySummary(filter: FilterState): Promise<CityAggregated[]> {
  let query = supabase
    .from("city_case_summary")
    .select("*")
    .gte("occurred_year", filter.year_from)
    .lte("occurred_year", filter.year_to);

  if (filter.crime_category !== "all") {
    query = query.eq("crime_category", filter.crime_category);
  }
  if (filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
  if (!data) return [];

  // city_id 単位で集計
  const cityMap = new Map<string | number, CityAggregated>();

  for (const row of data as CitySummaryRow[]) {
    // 座標がない行はスキップ（地図に表示できないため）
    if (row.center_lat == null || row.center_lng == null) continue;

    const key = row.city_id ?? `pref-${row.prefecture_id}`;

    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city_id: row.city_id,
        city_name: row.city_name ?? row.prefecture_name,
        prefecture_name: row.prefecture_name,
        lat: row.center_lat,
        lng: row.center_lng,
        total_count: 0,
        by_category: {},
      });
    }

    const entry = cityMap.get(key)!;
    entry.total_count += row.case_count;
    entry.by_category[row.crime_category] =
      (entry.by_category[row.crime_category] ?? 0) + row.case_count;
  }

  return Array.from(cityMap.values()).filter((c) => c.total_count > 0);
}

// 件数 → バブル半径（px）
function countToRadius(count: number): number {
  // √スケーリングで大小差を視認しやすく
  return Math.max(8, Math.min(40, 8 + Math.sqrt(count) * 5));
}

// 件数 → バブル色（フィルタが「all」の場合はデフォルト色）
function getColor(
  city: CityAggregated,
  categoryFilter: CrimeCategoryKey | "all"
): string {
  if (categoryFilter !== "all") {
    return CATEGORY_COLORS[categoryFilter] ?? DEFAULT_COLOR;
  }
  // 最多カテゴリの色を使用
  let maxCat: CrimeCategoryKey = "other";
  let maxCount = 0;
  for (const [cat, cnt] of Object.entries(city.by_category) as [
    CrimeCategoryKey,
    number
  ][]) {
    if (cnt > maxCount) {
      maxCount = cnt;
      maxCat = cat;
    }
  }
  return CATEGORY_COLORS[maxCat] ?? DEFAULT_COLOR;
}

// ============================================================
// ポップアップ HTML 生成
// ============================================================

function buildPopupHTML(city: CityAggregated): string {
  const rows = Object.entries(city.by_category)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, cnt]) =>
        `<tr>
          <td style="padding:2px 8px 2px 0;color:#666;font-size:12px;">
            ${CRIME_CATEGORY_LABELS[cat as CrimeCategoryKey] ?? cat}
          </td>
          <td style="padding:2px 0;font-weight:500;font-size:12px;">${cnt}件</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;min-width:160px;">
      <p style="margin:0 0 4px;font-weight:600;font-size:14px;">
        ${city.city_name}
      </p>
      <p style="margin:0 0 8px;color:#888;font-size:12px;">
        ${city.prefecture_name}
      </p>
      <p style="margin:0 0 6px;font-size:13px;">
        合計 <strong>${city.total_count}</strong> 件（不起訴等）
      </p>
      <table style="border-collapse:collapse;width:100%;">
        ${rows}
      </table>
    </div>
  `;
}

// ============================================================
// メインコンポーネント
// ============================================================

export default function CaseMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const currentYear = new Date().getFullYear();
  const [filter, setFilter] = useState<FilterState>({
    crime_category: "all",
    status: "all",
    year_from: currentYear - 1,
    year_to: currentYear,
  });

  const [cities, setCities] = useState<CityAggregated[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // ---------- データ取得 ----------
  const loadData = useCallback(async (f: FilterState) => {
    setLoading(true);
    const result = await fetchCitySummary(f);
    setCities(result);
    setTotalCount(result.reduce((s, c) => s + c.total_count, 0));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(filter);
  }, [filter, loadData]);

  // ---------- 地図の初期化（一度だけ） ----------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [135.5, 34.7], // 大阪中心
      zoom: 10,
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

  // ---------- バブルの描画（データ変化時） ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 既存マーカーをすべて削除
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (loading) return;

    cities.forEach((city) => {
      const radius = countToRadius(city.total_count);
      const color = getColor(city, filter.crime_category);

      // カスタム要素でバブルを描画
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
        font-weight: 600;
        color: ${color};
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
        maxWidth: "220px",
      }).setHTML(buildPopupHTML(city));

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([city.lng, city.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [cities, loading, filter.crime_category]);

  // ---------- フィルタ更新ハンドラ ----------
  const updateFilter = (partial: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...partial }));
  };

  // ============================================================
  // レンダリング
  // ============================================================

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>

      {/* 地図本体 */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* フィルタパネル（左上） */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "white",
          borderRadius: 12,
          padding: "16px 18px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          minWidth: 220,
          zIndex: 10,
        }}
      >
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 14,
            fontWeight: 600,
            color: "#1a1a1a",
          }}
        >
          刑事司法データマップ
        </h2>

        {/* 件数サマリ */}
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 12, color: "#666" }}>表示中の事件数</span>
          <br />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
            {loading ? "…" : totalCount.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>件</span>
        </div>

        {/* 犯罪カテゴリ */}
        <label
          htmlFor="filter-category"
          style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}
        >
          犯罪カテゴリ
        </label>
        <select
          id="filter-category"
          value={filter.crime_category}
          onChange={(e) =>
            updateFilter({
              crime_category: e.target.value as CrimeCategoryKey | "all",
            })
          }
          style={{
            width: "100%",
            marginBottom: 10,
            fontSize: 13,
            padding: "5px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
          }}
        >
          <option value="all">すべて</option>
          {Object.entries(CRIME_CATEGORY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        {/* 処理ステータス */}
        <label
          htmlFor="filter-status"
          style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}
        >
          処理ステータス
        </label>
        <select
          id="filter-status"
          value={filter.status}
          onChange={(e) =>
            updateFilter({ status: e.target.value as CaseStatusKey | "all" })
          }
          style={{
            width: "100%",
            marginBottom: 10,
            fontSize: 13,
            padding: "5px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
          }}
        >
          <option value="all">すべて</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        {/* 年フィルタ */}
        <label
          style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}
        >
          発生年: {filter.year_from} 〜 {filter.year_to}
        </label>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input
            type="number"
            min={2020}
            max={filter.year_to}
            value={filter.year_from}
            onChange={(e) =>
              updateFilter({ year_from: Number(e.target.value) })
            }
            style={{
              width: "50%",
              fontSize: 13,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
          <input
            type="number"
            min={filter.year_from}
            max={currentYear}
            value={filter.year_to}
            onChange={(e) => updateFilter({ year_to: Number(e.target.value) })}
            style={{
              width: "50%",
              fontSize: 13,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
          />
        </div>

        {/* ローディング表示 */}
        {loading && (
          <p style={{ fontSize: 12, color: "#999", margin: "8px 0 0", textAlign: "center" }}>
            データを取得中…
          </p>
        )}
      </div>

      {/* 凡例（右下） */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 12,
          background: "white",
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 10,
          fontSize: 11,
          color: "#555",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 12 }}>
          バブルの色（主な犯罪種別）
        </p>
        {Object.entries(CATEGORY_COLORS)
          .filter(([k]) => k !== "other")
          .map(([k, color]) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color + "77",
                  border: `1.5px solid ${color}`,
                  flexShrink: 0,
                }}
              />
              <span>{CRIME_CATEGORY_LABELS[k as CrimeCategoryKey]}</span>
            </div>
          ))}
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: "1px solid #eee",
            color: "#888",
          }}
        >
          ※ バブルの大きさ ∝ 件数（√スケール）
        </div>
      </div>

      {/* データ注記（右下隅） */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 60,
          fontSize: 10,
          color: "#aaa",
          zIndex: 10,
        }}
      >
        位置情報は市区町村単位・日時は月単位での表示です
      </div>
    </div>
  );
}
