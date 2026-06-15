"use client";

import { memo } from "react";
import { STATUS } from "@/lib/constants";

// Renders one person as a glowing colored dot, with the name above and "ask" below.
function PersonNode({ data, selected }) {
  const s = STATUS[data.status] || STATUS.to_contact; // look up color/glow for this status

  return (
    <div style={{ position: "relative", width: 18, height: 18 }}>
      {/* name label, sits just above the dot */}
      <div style={labelBase("name")}>{data.name}</div>

      {/* the glowing dot itself */}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: s.color,
          boxShadow: selected
            ? `0 0 0 3px rgba(255,255,255,0.12), 0 0 22px 6px ${s.glow}`
            : `0 0 16px 3px ${s.glow}`,
          transition: "box-shadow 220ms ease",
        }}
      />

      {/* optional "ask" label below the dot */}
      {data.ask ? <div style={labelBase("ask")}>{data.ask}</div> : null}
    </div>
  );
}

// Shared positioning/typography for the two text labels around the dot.
function labelBase(kind) {
  const isName = kind === "name";
  return {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",            // center horizontally over the dot
    [isName ? "bottom" : "top"]: "calc(100% + 8px)", // name above, ask below
    width: 160,
    textAlign: "center",
    pointerEvents: "none",                     // labels never intercept clicks/drag
    whiteSpace: isName ? "nowrap" : "normal",
    fontSize: isName ? 14 : 11.5,
    fontWeight: isName ? 600 : 400,
    lineHeight: 1.3,
    color: isName ? "var(--text-primary)" : "var(--text-secondary)",
    textShadow: "0 1px 6px rgba(0,0,0,0.85)",  // keep text readable over the canvas
  };
}

export default memo(PersonNode); 
