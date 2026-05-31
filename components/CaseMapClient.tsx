"use client";

import dynamic from "next/dynamic";

const CaseMap = dynamic(() => import("@/components/CaseMap"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      地図データを読み込み中...
    </div>
  ),
});

export default function CaseMapClient() {
  return <CaseMap />;
}