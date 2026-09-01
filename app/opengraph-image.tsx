import { ImageResponse } from "next/og";

export const alt = "UtilityDataUSA — one U.S. address, connected public data and original sources";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 78px",
          background: "linear-gradient(135deg,#06192d 0%,#0a3b6e 58%,#0b5b75 100%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#37d7c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#05263b", fontSize: 28, fontWeight: 900 }}>U</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>UtilityDataUSA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 940 }}>
          <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 850, letterSpacing: -3 }}>One address instead of ten websites.</div>
          <div style={{ fontSize: 28, lineHeight: 1.35, color: "#d8e9f4" }}>Connected U.S. public data · original sources · address-based context</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 21, color: "#b9d6e7" }}>
          <span>utilitydatausa.com</span>
          <span>by BrixCare</span>
        </div>
      </div>
    ),
    size,
  );
}
