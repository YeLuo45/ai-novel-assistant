/**
 * V45 BudgetDashboard - 预算面板UI
 * Circular progress bars + 80% warning indicators
 */

import React, { useEffect, useState } from 'react';
import { BudgetController } from '../ai/budget/BudgetController';
import type { BudgetStatus } from '../ai/budget/types';

interface BudgetDashboardProps {
  controller?: BudgetController;
  compact?: boolean;  // Compact mode for sidebar
}

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  warning?: boolean;
  label: string;
  value: string;
}

function ProgressRing({ percent, size = 80, strokeWidth = 6, warning = false, label, value }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(percent, 1));
  
  const color = warning ? '#ef4444' : percent >= 0.8 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color }}>
            {Math.round(percent * 100)}%
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      <div className="text-xs font-medium text-gray-700">{value}</div>
    </div>
  );
}

export function BudgetDashboard({ controller, compact = false }: BudgetDashboardProps) {
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetController] = useState(() => controller || new BudgetController());

  useEffect(() => {
    let mounted = true;
    
    async function fetchStatus() {
      try {
        const s = await budgetController.getStatus();
        if (mounted) {
          setStatus(s);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch budget status:', err);
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [budgetController]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 text-red-500">
        无法加载预算状态
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={status.isWarning ? 'text-amber-600 font-semibold' : 'text-green-600'}>
            {status.isWarning && '⚠️ '}
            今日: {(status.percentUsedToday * 100).toFixed(0)}%
          </span>
          {status.exceededLimits.length > 0 && (
            <span className="text-red-600">限额超</span>
          )}
        </div>
      </div>
    );
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Token 预算</h3>
        {status.isWarning && (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
            ⚠️ 接近限额
          </span>
        )}
      </div>

      {status.exceededLimits.length > 0 && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          已超出限额: {status.exceededLimits.join(', ')}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <ProgressRing
          percent={status.percentUsedToday}
          label="今日"
          value={`${formatNumber(status.usedToday)} / ${formatNumber(budgetController.getConfig().dailyLimit)}`}
          warning={status.percentUsedToday >= 0.8}
        />
        <ProgressRing
          percent={status.percentUsedThisMonth}
          label="本月"
          value={`${formatNumber(status.usedThisMonth)} / ${formatNumber(budgetController.getConfig().monthlyLimit)}`}
          warning={status.percentUsedThisMonth >= 0.8}
        />
        <ProgressRing
          percent={status.percentUsedSession}
          label="本会话"
          value={`${formatNumber(status.usedThisSession)} / ${formatNumber(budgetController.getConfig().perSessionLimit)}`}
          warning={status.percentUsedSession >= 0.8}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>剩余今日: <span className="font-medium text-gray-800">{formatNumber(status.remainingToday)}</span></div>
          <div>剩余本月: <span className="font-medium text-gray-800">{formatNumber(status.remainingThisMonth)}</span></div>
          <div>剩余会话: <span className="font-medium text-gray-800">{formatNumber(status.remainingThisSession)}</span></div>
          <div>上下文阈值: <span className="font-medium text-gray-800">{(budgetController.getConfig().contextThreshold / 1000).toFixed(0)}K</span></div>
        </div>
      </div>
    </div>
  );
}

export default BudgetDashboard;