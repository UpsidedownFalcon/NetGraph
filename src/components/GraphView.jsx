"use client";

import { useMemo } from "react";
import { ReactFlow, ReactFlowProvider, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./PersonNode";

// Register our custom node type. Defined OUTSIDE the component so it stays the
// same object across renders (React Flow warns if this is recreated each time).
const nodeTypes = { person: PersonNode };

function GraphInner({ people }) {
  // Transform DB people → React Flow nodes. Recompute only when `people` changes.
  const nodes = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        type: "person",
        position: { x: p.position_x, y: p.position_y },
        data: { name: p.name, ask: p.ask, status: p.status },
      })),
    [people]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// React Flow needs to be wrapped in a provider to share its internal state.
export default function GraphView(props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
} 
