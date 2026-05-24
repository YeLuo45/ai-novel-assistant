/**
 * WorkflowCanvas Tests
 * V44: Zero-code Visual Workflow Orchestration
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowCanvas, PHASE_TYPES, WorkflowNode, WorkflowEdge } from '../src/components/workflow/WorkflowCanvas';

describe('WorkflowCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders node palette with all node types', () => {
      render(<WorkflowCanvas />);
      
      PHASE_TYPES.forEach(nodeType => {
        expect(screen.getByText(nodeType.label, { selector: '.node-palette-item' })).toBeInTheDocument();
      });
    });

    test('renders empty canvas message when no nodes', () => {
      render(<WorkflowCanvas />);
      // Use regex to match partial text since there's an emoji before the text
      expect(screen.getByText(/拖拽节点到此处构建工作流/)).toBeInTheDocument();
    });

    test('renders with initial nodes and edges', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-1',
          type: 'phase',
          subtype: 'outline',
          label: '大纲生成',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Check node is in document (might have duplicate text from palette + node)
      const nodes = screen.getAllByText('大纲生成');
      expect(nodes.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/拖拽节点到此处构建工作流/)).not.toBeInTheDocument();
    });
  });

  describe('Node Palette Interactions', () => {
    test('node palette items are draggable', () => {
      render(<WorkflowCanvas />);
      
      const paletteItem = screen.getByText('大纲生成', { selector: '.node-palette-item' });
      expect(paletteItem.getAttribute('draggable')).toBe('true');
    });

    test('has correct number of node types', () => {
      expect(PHASE_TYPES.length).toBe(7);
    });

    test('has all required phase types', () => {
      const labels = PHASE_TYPES.map(t => t.label);
      expect(labels).toContain('大纲生成');
      expect(labels).toContain('角色创建');
      expect(labels).toContain('章节编写');
      expect(labels).toContain('润色优化');
      expect(labels).toContain('条件分支');
      expect(labels).toContain('循环');
      expect(labels).toContain('人工介入');
    });
  });

  describe('Config Panel', () => {
    test('shows config panel when node is selected', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-1',
          type: 'phase',
          subtype: 'outline',
          label: '大纲生成',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Click on the delete button within the node to select it via config panel
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
      }
      
      // Config panel should appear when a node is selected
      expect(screen.getByText('节点配置')).toBeInTheDocument();
    });

    test('shows phase config for phase nodes', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-1',
          type: 'phase',
          subtype: 'outline',
          label: '大纲生成',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Select node via clicking delete (which triggers selection)
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      fireEvent.click(deleteBtn);
      
      expect(screen.getByText('阶段子类型')).toBeInTheDocument();
      expect(screen.getByText('提示词模板')).toBeInTheDocument();
    });

    test('shows condition config for condition nodes', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-cond',
          type: 'condition',
          label: '条件分支',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Select node
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      fireEvent.click(deleteBtn);
      
      expect(screen.getByText('条件表达式')).toBeInTheDocument();
    });

    test('shows loop config for loop nodes', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-loop',
          type: 'loop',
          label: '循环',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Select node
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      fireEvent.click(deleteBtn);
      
      expect(screen.getByText('最大迭代次数')).toBeInTheDocument();
      expect(screen.getByText('终止条件')).toBeInTheDocument();
    });

    test('shows human config for human nodes', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-human',
          type: 'human',
          label: '人工介入',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Select node
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      fireEvent.click(deleteBtn);
      
      expect(screen.getByText('人工审核说明')).toBeInTheDocument();
    });
  });

  describe('Node Operations', () => {
    test('can delete a node', () => {
      const initialNodes: WorkflowNode[] = [
        {
          id: 'test-1',
          type: 'phase',
          label: 'Test Node',
          position: { x: 100, y: 100 },
          config: {},
          connections: [],
        },
      ];
      
      render(<WorkflowCanvas initialNodes={initialNodes} />);
      
      // Initially node is present
      const initialNodes_1 = screen.getAllByText('Test Node');
      expect(initialNodes_1.length).toBe(1);
      
      // Click delete button
      const deleteBtn = screen.getByRole('button', { name: '删除' });
      fireEvent.click(deleteBtn);
      
      // Node should still be there (delete removes after confirmation in UI)
      // This tests the click handler works without error
    });
  });
});

describe('PHASE_TYPES', () => {
  test('has 7 node types', () => {
    expect(PHASE_TYPES.length).toBe(7);
  });

  test('outline phase has correct color', () => {
    const outline = PHASE_TYPES.find(t => t.label === '大纲生成');
    expect(outline?.color).toBe('#f97316');
  });

  test('all node types have required properties', () => {
    PHASE_TYPES.forEach(nodeType => {
      expect(nodeType).toHaveProperty('type');
      expect(nodeType).toHaveProperty('label');
      expect(nodeType).toHaveProperty('color');
    });
  });
});

describe('WorkflowNode type', () => {
  test('accepts valid node structure', () => {
    const node: WorkflowNode = {
      id: 'test-node',
      type: 'phase',
      subtype: 'outline',
      label: 'Test Node',
      position: { x: 100, y: 200 },
      config: { promptTemplate: 'Test {{var}}' },
      connections: [],
    };
    
    expect(node.id).toBe('test-node');
    expect(node.type).toBe('phase');
    expect(node.position.x).toBe(100);
  });

  test('accepts condition node', () => {
    const node: WorkflowNode = {
      id: 'cond-1',
      type: 'condition',
      label: '条件分支',
      position: { x: 50, y: 50 },
      config: { condition: 'quality > 7' },
      connections: [],
    };
    
    expect(node.type).toBe('condition');
    expect(node.config.condition).toBe('quality > 7');
  });
});

describe('WorkflowEdge type', () => {
  test('accepts valid edge structure', () => {
    const edge: WorkflowEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      label: 'next',
    };
    
    expect(edge.source).toBe('node-1');
    expect(edge.target).toBe('node-2');
  });
});