/**
 * Workflow Store - Zustand Store for Workflow State Management
 * V44: Zero-code Workflow Orchestration
 */

import { create } from 'zustand';
import type { WorkflowNode, WorkflowEdge } from '../components/workflow/WorkflowCanvas';

interface WorkflowStore {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isConnecting: boolean;
  connectingFromId: string | null;
  
  // Node operations
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Edge operations
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  clearEdges: () => void;
  
  // Connection mode
  startConnecting: (nodeId: string) => void;
  cancelConnecting: () => void;
  
  // Graph operations
  clearAll: () => void;
  exportGraph: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  importGraph: (graph: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  
  // Bulk operations
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isConnecting: false,
  connectingFromId: null,
  
  addNode: (node) => set(state => ({ 
    nodes: [...state.nodes, node] 
  })),
  
  removeNode: (nodeId) => set(state => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
  })),
  
  updateNodePosition: (nodeId, position) => set(state => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, position } : n),
  })),
  
  updateNodeConfig: (nodeId, config) => set(state => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n),
  })),
  
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  
  addEdge: (edge) => set(state => {
    // Prevent duplicate edges
    const exists = state.edges.some(
      e => e.source === edge.source && e.target === edge.target
    );
    if (exists) return state;
    // Prevent self-loops
    if (edge.source === edge.target) return state;
    return { edges: [...state.edges, edge] };
  }),
  
  removeEdge: (edgeId) => set(state => ({
    edges: state.edges.filter(e => e.id !== edgeId),
  })),
  
  clearEdges: () => set({ edges: [] }),
  
  startConnecting: (nodeId) => set({ 
    isConnecting: true, 
    connectingFromId: nodeId 
  }),
  
  cancelConnecting: () => set({ 
    isConnecting: false, 
    connectingFromId: null 
  }),
  
  clearAll: () => set({ 
    nodes: [], 
    edges: [],
    selectedNodeId: null,
    isConnecting: false,
    connectingFromId: null,
  }),
  
  exportGraph: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },
  
  importGraph: (graph) => set({
    nodes: graph.nodes,
    edges: graph.edges,
    selectedNodeId: null,
    isConnecting: false,
    connectingFromId: null,
  }),
  
  setNodes: (nodes) => set({ nodes }),
  
  setEdges: (edges) => set({ edges }),
}));