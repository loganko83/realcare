/**
 * Admin User Management
 * Search, filter, and manage platform users
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Users,
  Search,
  Filter,
  Ban,
  CheckCircle,
  ChevronLeft,
  Mail,
  Calendar,
  Shield,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'agent' | 'admin';
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
  last_login?: string;
  subscription_status?: 'free' | 'premium';
  reality_check_count?: number;
  contract_analysis_count?: number;
}

interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const perPage = 20;

  const { data, isLoading } = useQuery<UsersListResponse>({
    queryKey: ['admin', 'users', { page: currentPage, search: searchQuery, role: roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      return await apiClient.get<UsersListResponse>(`/admin/users?${params.toString()}`);
    },
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiClient.post(`/admin/users/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUser(null);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiClient.put(`/admin/users/${userId}`, { is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUser(null);
    },
  });

  const handleBanToggle = (user: User) => {
    const action = user.is_banned ? 'unban' : 'ban';
    const confirmMsg = user.is_banned
      ? `${user.email} ${t('admin_unban_user')}?`
      : `${user.email} ${t('admin_ban_user')}?`;

    if (confirm(confirmMsg)) {
      if (user.is_banned) {
        unbanMutation.mutate(user.id);
      } else {
        banMutation.mutate(user.id);
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'agent':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t('admin_role_admin');
      case 'agent':
        return t('admin_role_agent');
      default:
        return t('admin_role_user');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const users = data?.users || [];
  const totalPages = data?.total_pages || 1;

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate({ to: '/admin' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{t('admin_users')}</h1>
                <p className="text-sm text-gray-500">
                  {data?.total.toLocaleString() || 0} {t('admin_total_users')}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('admin_search_users')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              {['all', 'user', 'agent', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRoleFilter(role);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    roleFilter === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {role === 'all' ? t('admin_all_roles') : getRoleLabel(role)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 mt-3">{t('admin_loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('admin_no_users')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                          <Ban className="w-3 h-3" />
                          {t('admin_user_banned')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {t('admin_user_active')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                    {user.subscription_status && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="capitalize">{user.subscription_status}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t('admin_view_details')}
                    </button>
                    <button
                      onClick={() => handleBanToggle(user)}
                      disabled={banMutation.isPending || unbanMutation.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        user.is_banned
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {user.is_banned ? t('admin_unban_user') : t('admin_ban_user')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('prev')}
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {t('admin_page')} {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">{t('admin_user_detail')}</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('auth_name')}
                  </label>
                  <p className="text-gray-900 font-medium mt-1">{selectedUser.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('auth_email')}
                  </label>
                  <p className="text-gray-900 mt-1">{selectedUser.email}</p>
                </div>

                {selectedUser.phone && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('auth_phone')}
                    </label>
                    <p className="text-gray-900 mt-1">{selectedUser.phone}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Role
                  </label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('admin_user_status')}
                  </label>
                  <p className="mt-1">
                    {selectedUser.is_banned ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        <Ban className="w-4 h-4" />
                        {t('admin_user_banned')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {t('admin_user_active')}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('admin_user_joined')}
                  </label>
                  <p className="text-gray-900 mt-1">{formatDate(selectedUser.created_at)}</p>
                </div>

                {selectedUser.last_login && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Last Login
                    </label>
                    <p className="text-gray-900 mt-1">{formatDate(selectedUser.last_login)}</p>
                  </div>
                )}

                {selectedUser.subscription_status && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Subscription
                    </label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedUser.subscription_status}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Reality Checks</label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedUser.reality_check_count || 0}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Contract Analyses</label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedUser.contract_analysis_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
