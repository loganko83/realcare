/**
 * Timeline View Component
 * Displays contract move-in timeline with progress tracking
 * Supports both list view and category-grouped view
 */

import { useState, useMemo } from 'react';
import {
  Check,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  List,
  LayoutGrid,
} from 'lucide-react';
import type { TimelineItem, Contract, TaskCategory } from '../../types/contract';
import {
  useUpdateTimelineItem,
  useUpdateSubtask,
} from '../../services/contract';
import {
  formatDDay,
  getCategoryDisplayName,
  getCategoryIcon,
  getTimelineProgress,
  getOverdueTasks,
  getCriticalTasks,
} from '../../lib/utils/timelineGenerator';
import { TimelineCategorySection } from './TimelineCategorySection';
import { Card, Badge, Button, ProgressBar, SelectButton } from '../common';

// Dynamic icon component based on category
function CategoryIcon({ category, size = 18 }: { category: string; size?: number }) {
  const iconName = getCategoryIcon(category as TimelineItem['category']);
  // Using lucide-react icons based on category
  const icons: Record<string, React.ReactNode> = {
    landmark: <Clock size={size} />,
    paintbrush: <span style={{ fontSize: size }}>🎨</span>,
    truck: <span style={{ fontSize: size }}>🚚</span>,
    sparkles: <span style={{ fontSize: size }}>✨</span>,
    wallet: <span style={{ fontSize: size }}>💳</span>,
    'file-text': <span style={{ fontSize: size }}>📄</span>,
    zap: <span style={{ fontSize: size }}>⚡</span>,
    search: <span style={{ fontSize: size }}>🔍</span>,
    home: <span style={{ fontSize: size }}>🏠</span>,
    circle: <Clock size={size} />,
  };
  return <>{icons[iconName] || <Clock size={size} />}</>;
}

interface TimelineViewProps {
  contract: Contract;
  onRefresh?: () => void;
}

// Category order for consistent display
const CATEGORY_ORDER: TaskCategory[] = [
  'documents',
  'loan',
  'interior',
  'finance',
  'moving',
  'cleaning',
  'inspection',
  'utilities',
  'move_in',
];

export function TimelineView({ contract, onRefresh }: TimelineViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const [expandedCategories, setExpandedCategories] = useState<Set<TaskCategory>>(
    new Set(CATEGORY_ORDER) // All categories expanded by default
  );

  const { mutate: updateItem } = useUpdateTimelineItem();
  const { mutate: updateSubtask } = useUpdateSubtask();

  const progress = getTimelineProgress(contract.timeline);
  const overdue = getOverdueTasks(contract.timeline);
  const critical = getCriticalTasks(contract.timeline);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<TaskCategory, TimelineItem[]>();

    // Initialize all categories
    CATEGORY_ORDER.forEach(cat => grouped.set(cat, []));

    // Group filtered items
    contract.timeline
      .filter(item => {
        if (filter === 'pending') return item.status !== 'completed' && item.status !== 'skipped';
        if (filter === 'completed') return item.status === 'completed' || item.status === 'skipped';
        return true;
      })
      .forEach(item => {
        const existing = grouped.get(item.category) || [];
        existing.push(item);
        grouped.set(item.category, existing);
      });

    // Sort items within each category by date
    grouped.forEach((items, category) => {
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      grouped.set(category, items);
    });

    return grouped;
  }, [contract.timeline, filter]);

  // Get categories that have items
  const activeCategories = useMemo(() => {
    return CATEGORY_ORDER.filter(cat => (tasksByCategory.get(cat)?.length || 0) > 0);
  }, [tasksByCategory]);

  const toggleCategory = (category: TaskCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredTimeline = contract.timeline.filter(item => {
    if (filter === 'pending') return item.status !== 'completed' && item.status !== 'skipped';
    if (filter === 'completed') return item.status === 'completed' || item.status === 'skipped';
    return true;
  });

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleStatusChange = (item: TimelineItem, status: TimelineItem['status']) => {
    updateItem({
      contractId: contract.id,
      itemId: item.id,
      updates: { status },
    }, {
      onSuccess: () => onRefresh?.(),
    });
  };

  const handleSubtaskToggle = (item: TimelineItem, subtaskId: string, completed: boolean) => {
    updateSubtask({
      contractId: contract.id,
      itemId: item.id,
      subtaskId,
      completed,
    }, {
      onSuccess: () => onRefresh?.(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'skipped': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="error" size="sm">Critical</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return null;
    }
  };

  const isOverdue = (item: TimelineItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(item.date);
    return itemDate < today && item.status !== 'completed' && item.status !== 'skipped';
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-slate-800">Move-in Progress</h2>
          <span className="text-2xl font-bold text-brand-600">{progress.percentage}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-brand-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-slate-600">
          <span>{progress.completed} of {progress.total} tasks completed</span>
          <span>{contract.timeline.length - progress.completed} remaining</span>
        </div>

        {/* Alerts */}
        {(overdue.length > 0 || critical.length > 0) && (
          <div className="mt-4 space-y-2">
            {overdue.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertTriangle size={16} />
                <span>{overdue.length} overdue task(s) need attention</span>
              </div>
            )}
            {critical.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg text-orange-700 text-sm">
                <AlertTriangle size={16} />
                <span>{critical.length} critical task(s) pending</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filter and View Toggle */}
      <div className="flex gap-3">
        {/* Filter Tabs */}
        <div className="flex-1">
          <SelectButton
            options={[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Done' },
            ]}
            value={filter}
            onChange={(val) => setFilter(val as typeof filter)}
            variant="toggle"
            size="sm"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-2"
            title="List view"
          >
            <List size={18} />
          </Button>
          <Button
            variant={viewMode === 'category' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('category')}
            className="p-2"
            title="Category view"
          >
            <LayoutGrid size={18} />
          </Button>
        </div>
      </div>

      {/* Category View */}
      {viewMode === 'category' && (
        <div className="space-y-4">
          {activeCategories.map(category => {
            const categoryItems = tasksByCategory.get(category) || [];
            return (
              <TimelineCategorySection
                key={category}
                category={category}
                items={categoryItems}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
              >
                {categoryItems.map((item) => {
                  const expanded = expandedItems.has(item.id);
                  const itemOverdue = isOverdue(item);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border transition ${
                        itemOverdue ? 'border-red-300 bg-red-50' :
                        item.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                        item.status === 'in_progress' ? 'border-blue-300' :
                        'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-full p-3 text-left"
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Indicator */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            item.status === 'completed' ? 'bg-green-100 text-green-600' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                            itemOverdue ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.status === 'completed' ? (
                              <Check size={16} />
                            ) : (
                              <Clock size={16} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                item.dDay === 0 ? 'bg-brand-600 text-white' :
                                item.dDay < 0 ? 'bg-slate-700 text-white' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {formatDDay(item.dDay)}
                              </span>
                              <span className="text-xs text-slate-400">{item.date}</span>
                              {getPriorityBadge(item.priority)}
                              {itemOverdue && (
                                <span className="text-xs text-red-600 font-bold">OVERDUE</span>
                              )}
                            </div>

                            <h3 className={`font-medium text-sm ${
                              item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'
                            }`}>
                              {item.title}
                            </h3>

                            {item.subtasks && item.subtasks.length > 0 && (
                              <span className="text-xs text-slate-400 mt-1 block">
                                {item.subtasks.filter(s => s.completed).length}/{item.subtasks.length} subtasks
                              </span>
                            )}
                          </div>

                          {/* Expand Icon */}
                          <div className="text-slate-400">
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expanded && (
                        <div className="px-3 pb-3 space-y-3 animate-fade-in">
                          <p className="text-sm text-slate-500 ml-11">{item.description}</p>

                          {/* Subtasks */}
                          {item.subtasks && item.subtasks.length > 0 && (
                            <div className="ml-11 space-y-1">
                              {item.subtasks.map((subtask) => (
                                <label
                                  key={subtask.id}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={(e) => handleSubtaskToggle(item, subtask.id, e.target.checked)}
                                    className="w-4 h-4 rounded text-brand-600"
                                  />
                                  <span className={`text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {subtask.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Partner Service */}
                          {item.partnerService && item.partnerService.name && (
                            <div className="ml-11 p-2 bg-brand-50 rounded-lg border border-brand-100">
                              <p className="text-xs font-bold text-brand-700 mb-1">Recommended Partner</p>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm text-slate-800">{item.partnerService.name}</p>
                                  {item.partnerService.discount && (
                                    <p className="text-xs text-brand-600">{item.partnerService.discount}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {item.partnerService.phone && (
                                    <a
                                      href={`tel:${item.partnerService.phone}`}
                                      className="p-1.5 bg-white rounded border border-gray-200 text-slate-600 hover:bg-gray-50"
                                    >
                                      <Phone size={14} />
                                    </a>
                                  )}
                                  {item.partnerService.url && (
                                    <a
                                      href={item.partnerService.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-white rounded border border-gray-200 text-slate-600 hover:bg-gray-50"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="ml-11 flex gap-2">
                            {item.status !== 'completed' && (
                              <>
                                {item.status !== 'in_progress' && (
                                  <button
                                    onClick={() => handleStatusChange(item, 'in_progress')}
                                    className="flex-1 py-1.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition text-xs"
                                  >
                                    Start
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(item, 'completed')}
                                  className="flex-1 py-1.5 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition text-xs"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleStatusChange(item, 'skipped')}
                                  className="py-1.5 px-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition text-xs"
                                >
                                  Skip
                                </button>
                              </>
                            )}
                            {item.status === 'completed' && (
                              <button
                                onClick={() => handleStatusChange(item, 'pending')}
                                className="py-1.5 px-3 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition text-xs"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </TimelineCategorySection>
            );
          })}

          {activeCategories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No tasks match the current filter</p>
            </div>
          )}
        </div>
      )}

      {/* List View - Timeline Items */}
      {viewMode === 'list' && (
      <div className="space-y-3">
        {filteredTimeline.map((item, index) => {
          const expanded = expandedItems.has(item.id);
          const overdue = isOverdue(item);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border transition ${
                overdue ? 'border-red-300 bg-red-50' :
                item.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                item.status === 'in_progress' ? 'border-blue-300' :
                'border-gray-200'
              }`}
            >
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Status Indicator */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.status === 'completed' ? 'bg-green-100 text-green-600' :
                    item.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    overdue ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status === 'completed' ? (
                      <Check size={20} />
                    ) : (
                      <CategoryIcon category={item.category} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.dDay === 0 ? 'bg-brand-600 text-white' :
                        item.dDay < 0 ? 'bg-slate-700 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {formatDDay(item.dDay)}
                      </span>
                      <span className="text-xs text-slate-400">{item.date}</span>
                      {getPriorityBadge(item.priority)}
                      {overdue && (
                        <span className="text-xs text-red-600 font-bold">OVERDUE</span>
                      )}
                    </div>

                    <h3 className={`font-bold ${
                      item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'
                    }`}>
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {getCategoryDisplayName(item.category)}
                      </span>
                      {item.subtasks && item.subtasks.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {item.subtasks.filter(s => s.completed).length}/{item.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="text-slate-400">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                  {/* Subtasks */}
                  {item.subtasks && item.subtasks.length > 0 && (
                    <div className="ml-13 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Checklist</p>
                      {item.subtasks.map((subtask) => (
                        <label
                          key={subtask.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={(e) => handleSubtaskToggle(item, subtask.id, e.target.checked)}
                            className="w-5 h-5 rounded text-brand-600"
                          />
                          <span className={`text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {subtask.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Partner Service */}
                  {item.partnerService && item.partnerService.name && (
                    <div className="ml-13 p-3 bg-brand-50 rounded-lg border border-brand-100">
                      <p className="text-xs font-bold text-brand-700 mb-2">Recommended Partner</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{item.partnerService.name}</p>
                          <p className="text-sm text-slate-600">{item.partnerService.description}</p>
                          {item.partnerService.discount && (
                            <p className="text-sm text-brand-600 font-medium mt-1">
                              {item.partnerService.discount}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {item.partnerService.phone && (
                            <a
                              href={`tel:${item.partnerService.phone}`}
                              className="p-2 bg-white rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50"
                            >
                              <Phone size={18} />
                            </a>
                          )}
                          {item.partnerService.url && (
                            <a
                              href={item.partnerService.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="ml-13 flex gap-2">
                    {item.status !== 'completed' && (
                      <>
                        {item.status !== 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(item, 'in_progress')}
                            className="flex-1 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition text-sm"
                          >
                            Start Task
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(item, 'completed')}
                          className="flex-1 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition text-sm"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(item, 'skipped')}
                          className="py-2 px-3 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          Skip
                        </button>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <button
                        onClick={() => handleStatusChange(item, 'pending')}
                        className="py-2 px-4 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition text-sm"
                      >
                        Reopen Task
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTimeline.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">No tasks match the current filter</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
