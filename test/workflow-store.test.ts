/**
 * WorkflowStore Tests
 * V44: Zero-code Workflow Orchestration
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { useWorkflowStore } from '../src/store/workflowStore';
import type { WorkflowNode, WorkflowEdge } from '../src/components/workflow';

describe('WorkflowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isConnecting: false,
      connectingFromId: null,
    });
  });

  describe('Initial State', () => {
    test('starts with empty nodes and edges', () => {
      const store = useWorkflowStore.getState();
      expect(store.nodes).toEqual([]);
      expect(store.edges).toEqual([]);
    });

    test('starts with no selected node', () => {
      const store = useWorkflowStore.getState();
      expect(store.selectedNodeId).toBeNull();
    });

    test('starts not in connecting mode', () => {
      const store = useWorkflowStore.getState();
      expect(store.isConnecting).toBe(false);
      expect(store.connectingFromId).toBeNull();
    });
  });

  describe('addNode', () => {
    test('adds a node to the store', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test Node',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);

      const store = useWorkflowStore.getState();
      expect(store.nodes.length).toBe(1);
      expect(store.nodes[0]).toEqual(node);
    });

    test('adds multiple nodes', () => {
      const node1: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Node 1',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };
      const node2: WorkflowNode = {
        id: 'test-2',
        type: 'condition',
        label: 'Node 2',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node1);
      useWorkflowStore.getState().addNode(node2);

      const store = useWorkflowStore.getState();
      expect(store.nodes.length).toBe(2);
    });
  });

  describe('removeNode', () => {
    test('removes a node by id', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test Node',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().removeNode('test-1');

      const store = useWorkflowStore.getState();
      expect(store.nodes.find(n => n.id === 'test-1')).toBeUndefined();
    });

    test('removes associated edges when node is removed', () => {
      const node1: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Node 1',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };
      const node2: WorkflowNode = {
        id: 'test-2',
        type: 'phase',
        label: 'Node 2',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'test-1',
        target: 'test-2',
      };

      useWorkflowStore.getState().addNode(node1);
      useWorkflowStore.getState().addNode(node2);
      useWorkflowStore.getState().addEdge(edge);
      useWorkflowStore.getState().removeNode('test-1');

      const store = useWorkflowStore.getState();
      expect(store.nodes.find(n => n.id === 'test-1')).toBeUndefined();
      expect(store.edges.find(e => e.source === 'test-1')).toBeUndefined();
    });

    test('clears selectedNodeId when selected node is removed', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test Node',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().selectNode('test-1');
      useWorkflowStore.getState().removeNode('test-1');

      const store = useWorkflowStore.getState();
      expect(store.selectedNodeId).toBeNull();
    });
  });

  describe('updateNodePosition', () => {
    test('updates node position', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test Node',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().updateNodePosition('test-1', { x: 200, y: 300 });

      const store = useWorkflowStore.getState();
      expect(store.nodes[0].position).toEqual({ x: 200, y: 300 });
    });
  });

  describe('addEdge', () => {
    test('adds an edge', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      };

      useWorkflowStore.getState().addEdge(edge);

      const store = useWorkflowStore.getState();
      expect(store.edges.length).toBe(1);
      expect(store.edges[0]).toEqual(edge);
    });

    test('prevents duplicate edges', () => {
      const edge1: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      };
      const edge2: WorkflowEdge = {
        id: 'edge-2',
        source: 'node-1',
        target: 'node-2',
      };

      useWorkflowStore.getState().addEdge(edge1);
      useWorkflowStore.getState().addEdge(edge2);

      const store = useWorkflowStore.getState();
      expect(store.edges.length).toBe(1);
    });

    test('prevents self-loops', () => {
      const edge: WorkflowEdge = {
        id: 'edge-self',
        source: 'node-1',
        target: 'node-1',
      };

      useWorkflowStore.getState().addEdge(edge);

      const store = useWorkflowStore.getState();
      expect(store.edges.length).toBe(0);
    });
  });

  describe('removeEdge', () => {
    test('removes an edge by id', () => {
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      };

      useWorkflowStore.getState().addEdge(edge);
      useWorkflowStore.getState().removeEdge('edge-1');

      const store = useWorkflowStore.getState();
      expect(store.edges.find(e => e.id === 'edge-1')).toBeUndefined();
    });
  });

  describe('selectNode', () => {
    test('selects a node', () => {
      useWorkflowStore.getState().selectNode('test-1');

      const store = useWorkflowStore.getState();
      expect(store.selectedNodeId).toBe('test-1');
    });

    test('deselects when null is passed', () => {
      useWorkflowStore.getState().selectNode('test-1');
      useWorkflowStore.getState().selectNode(null);

      const store = useWorkflowStore.getState();
      expect(store.selectedNodeId).toBeNull();
    });
  });

  describe('Connection Mode', () => {
    test('startConnecting sets connecting state', () => {
      useWorkflowStore.getState().startConnecting('node-1');

      const store = useWorkflowStore.getState();
      expect(store.isConnecting).toBe(true);
      expect(store.connectingFromId).toBe('node-1');
    });

    test('cancelConnecting resets connecting state', () => {
      useWorkflowStore.getState().startConnecting('node-1');
      useWorkflowStore.getState().cancelConnecting();

      const store = useWorkflowStore.getState();
      expect(store.isConnecting).toBe(false);
      expect(store.connectingFromId).toBeNull();
    });
  });

  describe('exportGraph', () => {
    test('returns current nodes and edges', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test Node',
        position: { x: 100, y: 100 },
        config: {},
        connections: [],
      };
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'test-1',
        target: 'test-2',
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().addEdge(edge);

      const graph = useWorkflowStore.getState().exportGraph();
      expect(graph.nodes.length).toBe(1);
      expect(graph.edges.length).toBe(1);
      expect(graph.nodes[0].id).toBe('test-1');
    });
  });

  describe('importGraph', () => {
    test('replaces current state with imported graph', () => {
      // First add some data
      const node1: WorkflowNode = {
        id: 'old-1',
        type: 'phase',
        label: 'Old Node',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };
      useWorkflowStore.getState().addNode(node1);

      // Import new graph
      const newGraph = {
        nodes: [
          {
            id: 'new-1',
            type: 'phase',
            label: 'New Node',
            position: { x: 200, y: 200 },
            config: {},
            connections: [],
          },
        ],
        edges: [],
      };
      useWorkflowStore.getState().importGraph(newGraph);

      const store = useWorkflowStore.getState();
      expect(store.nodes.length).toBe(1);
      expect(store.nodes[0].id).toBe('new-1');
      expect(store.nodes[0].label).toBe('New Node');
    });

    test('clears selected node when importing', () => {
      useWorkflowStore.getState().selectNode('old-node');
      
      const newGraph = {
        nodes: [],
        edges: [],
      };
      useWorkflowStore.getState().importGraph(newGraph);

      const store = useWorkflowStore.getState();
      expect(store.selectedNodeId).toBeNull();
    });
  });

  describe('clearAll', () => {
    test('clears all nodes, edges, and selection', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };
      const edge: WorkflowEdge = {
        id: 'edge-1',
        source: 'test-1',
        target: 'test-2',
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().addEdge(edge);
      useWorkflowStore.getState().selectNode('test-1');
      useWorkflowStore.getState().startConnecting('test-1');

      useWorkflowStore.getState().clearAll();

      const store = useWorkflowStore.getState();
      expect(store.nodes).toEqual([]);
      expect(store.edges).toEqual([]);
      expect(store.selectedNodeId).toBeNull();
      expect(store.isConnecting).toBe(false);
    });
  });

  describe('updateNodeConfig', () => {
    test('updates node config', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test',
        position: { x: 0, y: 0 },
        config: {},
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().updateNodeConfig('test-1', { promptTemplate: 'New prompt' });

      const store = useWorkflowStore.getState();
      expect(store.nodes[0].config.promptTemplate).toBe('New prompt');
    });

    test('merges with existing config', () => {
      const node: WorkflowNode = {
        id: 'test-1',
        type: 'phase',
        label: 'Test',
        position: { x: 0, y: 0 },
        config: { existing: 'value' },
        connections: [],
      };

      useWorkflowStore.getState().addNode(node);
      useWorkflowStore.getState().updateNodeConfig('test-1', { newKey: 'newValue' });

      const store = useWorkflowStore.getState();
      expect(store.nodes[0].config.existing).toBe('value');
      expect(store.nodes[0].config.newKey).toBe('newValue');
    });
  });

  describe('setNodes and setEdges', () => {
    test('setNodes replaces all nodes', () => {
      const newNodes: WorkflowNode[] = [
        {
          id: 'new-1',
          type: 'phase',
          label: 'New 1',
          position: { x: 0, y: 0 },
          config: {},
          connections: [],
        },
      ];

      useWorkflowStore.getState().setNodes(newNodes);

      const store = useWorkflowStore.getState();
      expect(store.nodes.length).toBe(1);
      expect(store.nodes[0].id).toBe('new-1');
    });

    test('setEdges replaces all edges', () => {
      const newEdges: WorkflowEdge[] = [
        { id: 'new-edge', source: 'a', target: 'b' },
      ];

      useWorkflowStore.getState().setEdges(newEdges);

      const store = useWorkflowStore.getState();
      expect(store.edges.length).toBe(1);
      expect(store.edges[0].id).toBe('new-edge');
    });
  });
});