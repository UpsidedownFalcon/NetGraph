"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { STATUS } from "@/lib/constants";

// The node is the 18px glowing dot. A big invisible handle covers the dot, so
// dragging from ANYWHERE on the dot draws a connection. A separate little grip
// above the name is the ONLY place that moves the node (wired via `dragHandle`
// on the node object in GraphView).
function PersonNode({ data, selected }) {
  const s = STATUS[data.status] || STATUS.to_contact;

  return (
    <div style={{ position: "relative", width: 18, height: 18 }}>
      {/* drag grip — the only place that moves the node */}
      <div className="ng-drag-handle" title="Drag to move" style={gripStyle}>
        ⠿
      </div>

      {/* name label, above the dot */}
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

      {/* invisible handle covering the whole dot: drag from here to connect */}
      <Handle type="source" position={Position.Top} style={coverHandleStyle} isConnectable />

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
    transform: "translateX(-50%)",
    [isName ? "bottom" : "top"]: "calc(100% + 8px)",
    width: 160,
    textAlign: "center",
    pointerEvents: "none",
    whiteSpace: isName ? "nowrap" : "normal",
    fontSize: isName ? 14 : 11.5,
    fontWeight: isName ? 600 : 400,
    lineHeight: 1.3,
    color: isName ? "var(--text-primary)" : "var(--text-secondary)",
    textShadow: "0 1px 6px rgba(0,0,0,0.85)",
  };
}

// The little grip, sitting above the name label.
const gripStyle = {
  position: "absolute",
  left: "50%",
  bottom: "calc(100% + 28px)",
  transform: "translateX(-50%)",
  cursor: "grab",
  color: "var(--text-muted)",
  fontSize: 13,
  lineHeight: 1,
  userSelect: "none",
  padding: "2px 6px",
};

// One transparent handle stretched over the whole 18px dot.
const coverHandleStyle = {
  width: 18,
  height: 18,
  minWidth: 0,
  minHeight: 0,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "transparent",
  border: "none",
  borderRadius: "50%",
};

export default memo(PersonNode);
