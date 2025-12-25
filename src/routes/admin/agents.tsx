/**
 * Admin Agent Verification
 * Approve or reject pending agent applications
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Calendar,
  Building2,
  FileText,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface PendingAgent {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  license_number: string;
  office_name: string;
  office_address: string;
  business_registration?: string;
  years_of_experience?: number;
  specialization?: string[];
  submitted_at: string;
  documents?: {
    license_url?: string;
    registration_url?: string;
  };
}

interface PendingAgentsResponse {
  agents: PendingAgent[];
  total: number;
}

export const Route = createFileRoute('/admin/agents')({
  component: AdminAgentsPage,
});

function AdminAgentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading } = useQuery<PendingAgentsResponse>({
    queryKey: ['admin', 'agents', 'pending'],
    queryFn: async () => {
      return await apiClient.get<PendingAgentsResponse>('/admin/agents/pending');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (agentId: string) => {
      return await apiClient.post(`/admin/agents/${agentId}/verify`, { approved: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedAgent(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ agentId, reason }: { agentId: string; reason: string }) => {
      return await apiClient.post(`/admin/agents/${agentId}/verify`, { approved: false, rejection_reason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedAgent(null);
      setShowRejectModal(false);
      setRejectionReason('');
    },
  });

  const handleApprove = (agent: PendingAgent) => {
    if (confirm(t('admin_confirm_approve'))) {
      approveMutation.mutate(agent.id);
    }
  };

  const handleReject = () => {
    if (!selectedAgent) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (confirm(t('admin_confirm_reject'))) {
      rejectMutation.mutate({
        agentId: selectedAgent.id,
        reason: rejectionReason,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const pendingAgents = data?.agents || [];

  return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate({ to: '/admin' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{t('admin_agent_verification')}</h1>
                <p className="text-sm text-gray-500">
                  {data?.total || 0} {t('admin_pending_verification')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Agents List */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 mt-3">{t('admin_loading')}</p>
            </div>
          ) : pendingAgents.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('admin_no_pending_agents')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {/* Agent Info Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{agent.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Building2 className="w-4 h-4" />
                        <span>{agent.office_name}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        {formatDate(agent.submitted_at)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{agent.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{agent.office_address}</span>
                    </div>
                  </div>

                  {/* License Information */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {t('admin_license_number')}
                        </label>
                        <p className="text-gray-900 font-mono font-medium mt-1">
                          {agent.license_number}
                        </p>
                      </div>
                      {agent.business_registration && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Business Reg.
                          </label>
                          <p className="text-gray-900 font-mono font-medium mt-1">
                            {agent.business_registration}
                          </p>
                        </div>
                      )}
                    </div>

                    {agent.years_of_experience && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Experience
                        </label>
                        <p className="text-gray-900 mt-1">
                          {agent.years_of_experience} years
                        </p>
                      </div>
                    )}

                    {agent.specialization && agent.specialization.length > 0 && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                          Specialization
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {agent.specialization.map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  {agent.documents && (
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                        Documents
                      </label>
                      <div className="flex gap-2">
                        {agent.documents.license_url && (
                          <a
                            href={agent.documents.license_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            License
                          </a>
                        )}
                        {agent.documents.registration_url && (
                          <a
                            href={agent.documents.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Registration
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(agent)}
                      disabled={approveMutation.isPending}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('admin_approve')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowRejectModal(true);
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex-1 px-4 py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('admin_reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && selectedAgent && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason('');
            }}
          >
            <div
              className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">{t('admin_reject')}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedAgent.name}</p>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin_rejection_reason')} *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This reason will be sent to the applicant via email.
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : t('admin_reject')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
