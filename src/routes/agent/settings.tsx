/**
 * Agent Settings Page
 * Profile, subscription, and preferences management
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  ArrowLeft,
  User,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export const Route = createFileRoute('/agent/settings')({
  component: AgentSettingsPage,
});

interface AgentProfile {
  name: string;
  email: string;
  phone: string;
  license_number: string;
  company_name: string;
  subscription_tier: 'basic' | 'premium' | 'enterprise';
  subscription_expires: string;
}

function AgentSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AgentProfile>>({});

  const { data: profile, isLoading } = useQuery<AgentProfile>({
    queryKey: ['agent', 'profile'],
    queryFn: async () => {
      return apiClient.get('/agents/profile');
    },
  });

  // Sync profile data to form when profile loads
  if (profile && !isEditing && Object.keys(formData).length === 0) {
    setFormData(profile);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AgentProfile>) => {
      return apiClient.put('/agents/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'profile'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleLogout = () => {
    // Implement logout logic
    localStorage.removeItem('auth_token');
    navigate({ to: '/' });
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
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="ml-auto p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Profile Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    License Number
                  </label>
                  <p className="text-gray-900">{profile?.license_number}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Company
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.company_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Current Plan</span>
                  <span className="font-bold text-blue-600 capitalize">
                    {profile?.subscription_tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-900">
                    {profile?.subscription_expires
                      ? new Date(profile.subscription_expires).toLocaleDateString('ko-KR')
                      : 'N/A'}
                  </span>
                </div>
                <button className="w-full mt-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Settings Menu */}
            <div className="space-y-2">
              <button className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-900">Notifications</span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>

              <button className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-900">Privacy & Security</span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>

              <button className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-gray-50 transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span className="flex-1 text-left text-gray-900">Help & Support</span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:bg-red-50 transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
