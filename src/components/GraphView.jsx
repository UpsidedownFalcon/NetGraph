"use client";

import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  useReactFlow,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./PersonNode";

const nodeTypes = { person: PersonNode };

function GraphInner({
  people,
  selectedId,
  onSelect,
  onPaneCreate,
  onOpenPerson,
  onMovePerson,
  onDeletePerson,
}) {
  const { screenToFlowPosition } = useReactFlow();

  // Build the desired nodes from our data.
  const computedNodes = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        type: "person",
        position: { x: p.position_x, y: p.position_y },
        data: { name: p.name, ask: p.ask, status: p.status },
        selected: selectedId === p.id,
      })),
    [people, selectedId]
  );

  // Let React Flow own the node state (so dragging is smooth)...
  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);

  // ...and re-sync it whenever our data changes (new/edited/moved people).
  useEffect(() => {
    // Syncing external data into React Flow's node state is exactly what an
    // effect is for; the live-render warning doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  const onPaneClick = useCallback(
    (event) => {
      onSelect(null);
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onPaneCreate(pos);
    },
    [screenToFlowPosition, onPaneCreate, onSelect]
  );

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

  const onNodeDragStop = useCallback(
    (_e, node) => onMovePerson(Number(node.id), node.position),
    [onMovePerson]
  );

  const onNodesDelete = useCallback(
    (deleted) => deleted.forEach((n) => onDeletePerson(Number(n.id))),
    [onDeletePerson]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        deleteKeyCode={["Backspace", "Delete"]}
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
