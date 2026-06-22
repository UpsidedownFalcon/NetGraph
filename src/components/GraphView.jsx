"use client";

import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MarkerType,
  ConnectionLineType,
  ConnectionMode,
  useReactFlow,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./PersonNode";
import FloatingEdge from "./FloatingEdge"; 

const nodeTypes = { person: PersonNode };
const edgeTypes = { floating: FloatingEdge }; 

function GraphInner({
  people,
  relationships, 
  selectedId,
  onSelect,
  onPaneCreate,
  onOpenPerson,
  onConnectPeople,
  onMovePerson,
  onDeletePerson,
  onDeleteRelationship, 
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
        dragHandle: ".ng-drag-handle", 
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

  // Turn each relationship row into a React Flow edge object.
  const edges = useMemo(
    () =>
      relationships.map((r) => ({
        id: String(r.id),
        source: String(r.source_id),
        target: String(r.target_id),
        type: "floating",
        data: { onDelete: () => onDeleteRelationship(r.id) },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#8a93a8" },
        style: { stroke: "var(--edge-default)", strokeWidth: 1.4 },
      })),
    [relationships, onDeleteRelationship]
  );

  // Finished dragging a wire from one dot to another → create a relationship.
  const onConnect = useCallback(
    (c) => onConnectPeople(Number(c.source), Number(c.target)),
    [onConnectPeople]
  );

  // Selected an edge + pressed Delete → remove that relationship.
  const onEdgesDelete = useCallback(
    (deleted) => deleted.forEach((e) => onDeleteRelationship(Number(e.id))),
    [onDeleteRelationship]
  );

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
        edges={edges}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Straight}
        connectionMode={ConnectionMode.Loose} 
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
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
