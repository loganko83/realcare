/**
 * Timeline Category Section Component
 * Collapsible section for grouping timeline tasks by category
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  Truck,
  Sparkles,
  Wallet,
  FileText,
  Zap,
  Search,
  Home,
  Paintbrush,
  Landmark,
} from 'lucide-react';
import type { TimelineItem, TaskCategory } from '../../types/contract';
import { getCategoryDisplayName } from '../../lib/utils/timelineGenerator';

interface TimelineCategorySectionProps {
  category: TaskCategory;
  items: TimelineItem[];
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// Category icon component
function getCategoryIconComponent(category: TaskCategory, size: number = 18) {
  const iconProps = { size, className: 'shrink-0' };

  switch (category) {
    case 'loan':
      return <Landmark {...iconProps} />;
    case 'interior':
      return <Paintbrush {...iconProps} />;
    case 'moving':
      return <Truck {...iconProps} />;
    case 'cleaning':
      return <Sparkles {...iconProps} />;
    case 'finance':
      return <Wallet {...iconProps} />;
    case 'documents':
      return <FileText {...iconProps} />;
    case 'utilities':
      return <Zap {...iconProps} />;
    case 'inspection':
      return <Search {...iconProps} />;
    case 'move_in':
      return <Home {...iconProps} />;
    default:
      return <Clock {...iconProps} />;
  }
}

// Category color scheme
function getCategoryColors(category: TaskCategory) {
  const colors: Record<TaskCategory, { bg: string; text: string; border: string; light: string }> = {
    loan: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-50' },
    interior: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', light: 'bg-orange-50' },
    moving: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50' },
    cleaning: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', light: 'bg-teal-50' },
    finance: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-50' },
    documents: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', light: 'bg-slate-50' },
    utilities: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', light: 'bg-yellow-50' },
    inspection: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', light: 'bg-indigo-50' },
    move_in: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', light: 'bg-rose-50' },
  };
  return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', light: 'bg-gray-50' };
}

export function TimelineCategorySection({
  category,
  items,
  isExpanded,
  onToggle,
  children,
}: TimelineCategorySectionProps) {
  const colors = getCategoryColors(category);

  // Calculate progress for this category
  const completedCount = items.filter(
    item => item.status === 'completed' || item.status === 'skipped'
  ).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check for overdue items
  const hasOverdue = items.some(item => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(item.date);
    return itemDate < today && item.status !== 'completed' && item.status !== 'skipped';
  });

  // Check for critical pending items
  const hasCriticalPending = items.some(
    item => item.priority === 'critical' && item.status !== 'completed' && item.status !== 'skipped'
  );

  return (
    <div className={`rounded-2xl border-2 ${colors.border} overflow-hidden transition-all duration-200`}>
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center gap-3 ${colors.light} hover:brightness-95 transition`}
      >
        {/* Expand/Collapse Icon */}
        <div className={`${colors.text}`}>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {/* Category Icon */}
        <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
          {getCategoryIconComponent(category)}
        </div>

        {/* Category Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">{getCategoryDisplayName(category)}</h3>
            {hasOverdue && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center gap-1">
                <AlertTriangle size={12} />
                Overdue
              </span>
            )}
            {!hasOverdue && hasCriticalPending && (
              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded">
                Critical
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${progressPercent * 1.256} 125.6`}
              className={progressPercent === 100 ? 'text-green-500' : colors.text.replace('text-', 'text-')}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {progressPercent === 100 ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <span className={`text-xs font-bold ${colors.text}`}>{progressPercent}%</span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-white">
          <div className="p-3 space-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Export helper functions
export { getCategoryIconComponent, getCategoryColors };
