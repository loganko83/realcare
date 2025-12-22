/**
 * Agent Dashboard Index
 * Main dashboard for registered agents
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Building2,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  Settings,
  ChevronRight,
  Users,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AgentDashboardStats {
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_signals: number;
  pending_signals: number;
  response_rate: number;
  recent_activity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
}

export const Route = createFileRoute('/agent/')({
  component: AgentDashboardPage,
});

function AgentDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<AgentDashboardStats>({
    queryKey: ['agent', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.fetch('/agents/dashboard');
      return response;
    },
  });

  return (
    <ProtectedRoute requiredRole="agent">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-8">
          <h1 className="text-2xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-blue-100">Manage your listings and signals</p>
        </div>

        {/* Quick Stats */}
        <div className="px-6 -mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-500 text-sm">Listings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.active_listings || 0}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.total_listings || 0} total
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-500 text-sm">Views</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.total_views || 0}
              </p>
              <p className="text-xs text-gray-400">
                this month
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-500 text-sm">Signals</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : stats?.total_signals || 0}
              </p>
              <p className="text-xs text-gray-400">
                {stats?.pending_signals || 0} pending
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-500 text-sm">Response</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '-' : `${stats?.response_rate || 0}%`}
              </p>
              <p className="text-xs text-gray-400">
                response rate
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate({ to: '/agent/listings/new' })}
              className="w-full bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4 hover:bg-blue-700 transition-colors"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Add New Listing</p>
                <p className="text-blue-100 text-sm">Create a new property listing</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-200" />
            </button>

            <button
              onClick={() => navigate({ to: '/agent/listings' })}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Manage Listings</p>
                <p className="text-gray-500 text-sm">View and edit your properties</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => navigate({ to: '/agent/signals' })}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Owner Signals</p>
                <p className="text-gray-500 text-sm">Respond to selling intents</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => navigate({ to: '/agent/analytics' })}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-gray-500 text-sm">View performance metrics</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400">
                Loading...
              </div>
            ) : stats?.recent_activity?.length ? (
              <div className="divide-y divide-gray-100">
                {stats.recent_activity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'view' ? 'bg-blue-500' :
                      activity.type === 'signal' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">{activity.description}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(activity.created_at).toLocaleDateString('ko-KR')}
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

        {/* Settings Link */}
        <div className="px-6 mt-6 mb-8">
          <button
            onClick={() => navigate({ to: '/agent/settings' })}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Agent Settings</p>
              <p className="text-gray-500 text-sm">Profile, subscription, preferences</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
