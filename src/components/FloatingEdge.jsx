"use client";

import {
  useInternalNode,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { getEdgeParams } from "@/lib/edgeGeometry";

export default function FloatingEdge({ id, source, target, markerEnd, style, data, selected }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);
  const [path, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {selected && data?.onDelete && (
        <EdgeLabelRenderer>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            title="Delete connection"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
              color: "var(--status-avoid)",
              fontSize: 14,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            }}
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
} 
