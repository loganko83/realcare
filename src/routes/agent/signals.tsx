/**
 * Agent Signals Page
 * View and respond to owner signals
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ArrowLeft,
  Users,
  MapPin,
  Building2,
  Clock,
  MessageSquare,
  Phone,
  Mail,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export const Route = createFileRoute('/agent/signals')({
  component: AgentSignalsPage,
});

interface OwnerSignal {
  id: string;
  property_type: string;
  address: string;
  district: string;
  price_range: string;
  selling_reason: string;
  urgency: 'low' | 'medium' | 'high';
  contact_preference: string;
  created_at: string;
  status: 'pending' | 'contacted' | 'closed';
}

function AgentSignalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: signals, isLoading } = useQuery<OwnerSignal[]>({
    queryKey: ['agent', 'signals', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      return apiClient.get(`/agents/signals?${params.toString()}`);
    },
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return (
          <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRole="agent">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate({ to: '/agent' })}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Owner Signals</h1>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'contacted', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Signals List */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : signals?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No signals yet</h2>
              <p className="text-gray-500 text-center">
                Owner signals will appear here when available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals?.map((signal) => (
                <div
                  key={signal.id}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {signal.property_type}
                      </span>
                    </div>
                    {getUrgencyBadge(signal.urgency)}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{signal.address}</span>
                  </div>

                  {/* Price Range */}
                  <div className="text-blue-600 font-bold mb-2">
                    {signal.price_range}
                  </div>

                  {/* Selling Reason */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {signal.selling_reason}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(signal.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span>Contact: {signal.contact_preference}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Contact
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
