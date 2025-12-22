/**
 * Admin Dashboard Index
 * Main dashboard for platform administrators
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Users,
  UserCheck,
  DollarSign,
  Radio,
  TrendingUp,
  Activity,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AdminStats {
  total_users: number;
  total_agents: number;
  pending_agents: number;
  total_revenue: number;
  total_signals: number;
  active_subscriptions: number;
  new_users_today: number;
  new_agents_today: number;
}

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'agent_applied' | 'signal_created' | 'subscription_purchased';
  description: string;
  user_email?: string;
  created_at: string;
}

interface AdminDashboardData {
  stats: AdminStats;
  recent_activity: ActivityItem[];
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<AdminDashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      return await apiClient.get<AdminDashboardData>('/admin/stats');
    },
  });

  const stats = data?.stats;
  const recentActivity = data?.recent_activity || [];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'agent_applied':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'signal_created':
        return <Radio className="w-4 h-4 text-green-600" />;
      case 'subscription_purchased':
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return t('admin_user_registered');
      case 'agent_applied':
        return t('admin_agent_applied');
      case 'signal_created':
        return t('admin_signal_created');
      case 'subscription_purchased':
        return t('admin_subscription_purchased');
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-8">
          <h1 className="text-2xl font-bold mb-2">{t('admin_dashboard')}</h1>
          <p className="text-slate-300">{t('admin_stats')}</p>
        </div>

        {/* Stats Grid */}
        <div className="px-6 -mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Total Users */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-500 text-sm">{t('admin_total_users')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.total_users.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400">
                +{stats?.new_users_today || 0} today
              </p>
            </div>

            {/* Total Agents */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-500 text-sm">{t('admin_total_agents')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.total_agents.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400">
                +{stats?.new_agents_today || 0} today
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-500 text-sm">{t('admin_total_revenue')}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? '-' : formatCurrency(stats?.total_revenue || 0)}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.active_subscriptions || 0} active
              </p>
            </div>

            {/* Owner Signals */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-500 text-sm">{t('admin_total_signals')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.total_signals.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400">
                active listings
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin_quick_actions')}</h2>
          <div className="space-y-3">
            {/* Pending Agents Alert */}
            {stats && stats.pending_agents > 0 && (
              <button
                onClick={() => navigate({ to: '/admin/agents' })}
                className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4 hover:bg-yellow-100 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-yellow-900">{t('admin_pending_agents')}</p>
                  <p className="text-yellow-700 text-sm">
                    {stats.pending_agents} {t('admin_pending_verification')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-yellow-400" />
              </button>
            )}

            {/* User Management */}
            <button
              onClick={() => navigate({ to: '/admin/users' })}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{t('admin_users')}</p>
                <p className="text-gray-500 text-sm">{t('admin_view_all')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            {/* Agent Management */}
            <button
              onClick={() => navigate({ to: '/admin/agents' })}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{t('admin_agents')}</p>
                <p className="text-gray-500 text-sm">{t('admin_verify_agent')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin_recent_activity')}</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400">
                {t('admin_loading')}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="p-4 flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium">
                        {getActivityTypeLabel(activity.type)}
                      </p>
                      <p className="text-gray-600 text-sm truncate">
                        {activity.description}
                      </p>
                      {activity.user_email && (
                        <p className="text-gray-400 text-xs mt-1">
                          {activity.user_email}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(activity.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="px-6 mt-6 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Platform Overview</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Growth</span>
                <span className="text-sm font-medium text-green-600">
                  +{stats?.new_users_today || 0} today
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Agent Applications</span>
                <span className="text-sm font-medium text-purple-600">
                  {stats?.pending_agents || 0} pending
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Subscriptions</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats?.active_subscriptions || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
