"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const [query, setQuery] = useState("");

  // When someone is selected, compute the set of "in focus" people:
  // the selected person plus everyone directly connected to them.
  // A Set gives instant .has() lookups. null means "nobody selected".
  const neighborIds = useMemo(() => {
    if (selectedId == null) return null;
    const set = new Set([selectedId]);
    for (const r of relationships) {
      if (r.source_id === selectedId) set.add(r.target_id);
      if (r.target_id === selectedId) set.add(r.source_id);
    }
    return set;
  }, [selectedId, relationships]);

  // Build the desired nodes from our data.
  const computedNodes = useMemo(
    () =>
      people.map((p) => ({
        id: String(p.id),
        type: "person",
        position: { x: p.position_x, y: p.position_y },
        data: {
          name: p.name,
          ask: p.ask,
          status: p.status,
          // Dim everyone who isn't the selected person or a direct neighbor.
          dimmed: neighborIds ? !neighborIds.has(p.id) : false,
        },
        selected: selectedId === p.id,
        dragHandle: ".ng-drag-handle",
      })),
    [people, selectedId, neighborIds]
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

  // Press Escape to clear the focus/highlight (un-dim everyone).
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onSelect(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  // Turn each relationship row into a React Flow edge object.
  const edges = useMemo(
    () =>
      relationships.map((r) => {
        // "active" = this edge touches the selected person.
        const active =
          selectedId != null && (r.source_id === selectedId || r.target_id === selectedId);
        const dim = selectedId != null && !active;
        return {
          id: String(r.id),
          source: String(r.source_id),
          target: String(r.target_id),
          type: "floating",
          data: { onDelete: () => onDeleteRelationship(r.id) },
          markerEnd: { type: MarkerType.ArrowClosed, color: active ? "#8a93a8" : "#3a4150" },
          style: {
            stroke: active ? "var(--edge-active)" : "var(--edge-default)",
            strokeWidth: active ? 2 : 1.4,
            opacity: dim ? 0.2 : 1,
          },
        };
      }),
    [relationships, selectedId, onDeleteRelationship]
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
    (e, node) => {
      // Clicking the drag grip just focuses/highlights — it does NOT open the popup.
      if (e.target?.closest?.(".ng-drag-handle")) {
        onSelect(Number(node.id));
        return;
      }
      const person = people.find((p) => String(p.id) === node.id);
      if (person) {
        onSelect(person.id);
        onOpenPerson(person);
      }
    },
    [people, onSelect, onOpenPerson]
  );

  const onNodeDragStop = useCallback(
    (_e, node) => {
      onSelect(Number(node.id));            // keep them focused/highlighted
      onMovePerson(Number(node.id), node.position);
    },
    [onSelect, onMovePerson]
  );

  const onNodesDelete = useCallback(
    (deleted) => deleted.forEach((n) => onDeletePerson(Number(n.id))),
    [onDeletePerson]
  );

  // Find the first person matching the query, select them, and fly to them.
  function runSearch(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = people.find((p) => {
      const fields = [p.name, p.ask, p.background, p.how_we_met];
      for (const c of p.channels || []) fields.push(c.handle, c.channel);
      return fields.filter(Boolean).some((t) => String(t).toLowerCase().includes(q));
    });
    if (match) {
      onSelect(match.id);
      setCenter(match.position_x, match.position_y, { zoom: 1.2, duration: 600 });
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <form onSubmit={runSearch} style={searchStyles.wrap}>
        <input
          style={searchStyles.input}
          placeholder="Search anyone or anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edges={edges}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Straight}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
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

const searchStyles = {
  wrap: { position: "absolute", top: 16, left: 16, zIndex: 5 },
  input: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    color: "var(--text-primary)",
    padding: "8px 12px",
    fontSize: 13,
    width: 220,
    outline: "none",
  },
};

export default function GraphView(props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
