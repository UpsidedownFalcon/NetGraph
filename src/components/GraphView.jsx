"use client";

import { useMemo, useCallback } from "react";
import { ReactFlow, ReactFlowProvider, Controls, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./PersonNode";

const nodeTypes = { person: PersonNode };

function GraphInner({ people, selectedId, onSelect, onPaneCreate, onOpenPerson }) {
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        type: "person",
        position: { x: p.position_x, y: p.position_y },
        data: { name: p.name, ask: p.ask, status: p.status },
        selected: selectedId === p.id,   // ← drive "selected" from our own state
      })),
    [people, selectedId]
  );

  // Click on empty canvas → deselect + open create popup at that spot.
  const onPaneClick = useCallback(
    (event) => {
      onSelect(null);
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onPaneCreate(pos);
    },
    [screenToFlowPosition, onPaneCreate, onSelect]
  );

  // Click on a node → select it + open edit popup.
  const onNodeClick = useCallback(
    (_e, node) => {
      const person = people.find((p) => String(p.id) === node.id);
      if (person) {
        onSelect(person.id);
        onOpenPerson(person);
      }
    },
    [people, onSelect, onOpenPerson]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
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

export default function GraphView(props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
} 
