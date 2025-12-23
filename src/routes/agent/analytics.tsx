/**
 * Agent Analytics Page
 * Performance metrics and analytics dashboard
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Building2,
  Users,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export const Route = createFileRoute('/agent/analytics')({
  component: AgentAnalyticsPage,
});

interface AnalyticsData {
  overview: {
    total_listings: number;
    total_views: number;
    total_signals: number;
    avg_response_time: number;
  };
  trends: {
    views_growth: number;
    listings_growth: number;
    signals_growth: number;
  };
  performance: {
    conversion_rate: number;
    response_rate: number;
    avg_listing_duration: number;
  };
}

function AgentAnalyticsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['agent', 'analytics'],
    queryFn: async () => {
      return apiClient.get('/agents/analytics');
    },
  });

  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <ArrowUpRight className="w-4 h-4" />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
          <ArrowDownRight className="w-4 h-4" />
          {value}%
        </span>
      );
    }
    return <span className="text-gray-400 text-sm">No change</span>;
  };

  return (
    <ProtectedRoute requiredRole="agent">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/agent' })}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Overview Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-500 text-sm">Listings</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.overview.total_listings || 0}
                  </p>
                  {renderTrendIndicator(analytics?.trends.listings_growth || 0)}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-gray-500 text-sm">Views</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.overview.total_views || 0}
                  </p>
                  {renderTrendIndicator(analytics?.trends.views_growth || 0)}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-gray-500 text-sm">Signals</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.overview.total_signals || 0}
                  </p>
                  {renderTrendIndicator(analytics?.trends.signals_growth || 0)}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-gray-500 text-sm">Avg Response</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.overview.avg_response_time || 0}h
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Conversion Rate</span>
                    <span className="font-bold text-blue-600">
                      {analytics?.performance.conversion_rate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analytics?.performance.conversion_rate || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Response Rate</span>
                    <span className="font-bold text-green-600">
                      {analytics?.performance.response_rate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${analytics?.performance.response_rate || 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Avg Listing Duration</span>
                    <span className="font-bold text-gray-900">
                      {analytics?.performance.avg_listing_duration || 0} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for Charts */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Charts coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
