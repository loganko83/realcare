/**
 * Agent Registration Page
 * Multi-step registration for real estate agents
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api/client';

const agentRegisterSchema = z.object({
  agency_name: z.string().min(2, 'Agency name is required'),
  license_number: z.string().min(5, 'License number is required'),
  business_number: z.string().min(10, 'Business registration number is required'),
  representative_name: z.string().min(2, 'Representative name is required'),
  office_address: z.string().min(10, 'Office address is required'),
  office_phone: z.string().regex(/^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/, 'Invalid phone format'),
  specialties: z.array(z.string()).optional(),
  service_areas: z.array(z.string()).optional(),
  introduction: z.string().optional(),
});

type AgentRegisterForm = z.infer<typeof agentRegisterSchema>;

const SPECIALTY_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa/Multi-family' },
  { value: 'officetel', label: 'Officetel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'land', label: 'Land' },
];

const AREA_OPTIONS = [
  { value: 'gangnam', label: 'Gangnam-gu' },
  { value: 'seocho', label: 'Seocho-gu' },
  { value: 'songpa', label: 'Songpa-gu' },
  { value: 'mapo', label: 'Mapo-gu' },
  { value: 'yongsan', label: 'Yongsan-gu' },
  { value: 'seongdong', label: 'Seongdong-gu' },
  { value: 'gwangjin', label: 'Gwangjin-gu' },
  { value: 'jongno', label: 'Jongno-gu' },
];

export const Route = createFileRoute('/agent/register')({
  component: AgentRegisterPage,
});

function AgentRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async (data: AgentRegisterForm) => {
      return apiClient.post('/agents/register', data);
    },
    onSuccess: () => {
      navigate({ to: '/agent' });
    },
    onError: (err: Error) => {
      setError(err.message || 'Registration failed. Please try again.');
    },
  });

  const form = useForm({
    defaultValues: {
      agency_name: '',
      license_number: '',
      business_number: '',
      representative_name: user?.name || '',
      office_address: '',
      office_phone: '',
      specialties: [] as string[],
      service_areas: [] as string[],
      introduction: '',
    } as AgentRegisterForm,
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setError(null);
      registerMutation.mutate(value);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-300 mb-6" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Login Required</h1>
          <p className="text-gray-500 mb-6 text-center">
            Please login to register as an agent.
          </p>
          <button
            onClick={() => navigate({ to: '/login', search: { redirect: '/agent/register' } })}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Complete' },
  ];

  const handleToggleSpecialty = (value: string) => {
    const current = form.getFieldValue('specialties') || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    form.setFieldValue('specialties', updated);
  };

  const handleToggleArea = (value: string) => {
    const current = form.getFieldValue('service_areas') || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    form.setFieldValue('service_areas', updated);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate({ to: '/' })}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= s.num
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`ml-2 text-sm ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-3 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Agent Registration
        </h1>
        <p className="text-gray-500">
          Register your real estate agency
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 3) {
            form.handleSubmit();
          }
        }}
        className="space-y-5"
      >
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <form.Field name="agency_name">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Agency Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Real Estate Agency Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="license_number">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Broker License Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="License Number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="business_number">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Registration Number *
                  </label>
                  <input
                    type="text"
                    placeholder="000-00-00000"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="representative_name">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Representative Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('next')}
            </button>
          </>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <>
            <form.Field name="office_address">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Office Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full address"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="office_phone">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Office Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="02-1234-5678"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </form.Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((option) => {
                  const selected = (form.getFieldValue('specialties') || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleSpecialty(option.value)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Service Areas
              </label>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((option) => {
                  const selected = (form.getFieldValue('service_areas') || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleArea(option.value)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('next')}
            </button>
          </>
        )}

        {/* Step 3: Introduction & Submit */}
        {step === 3 && (
          <>
            <form.Field name="introduction">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Agency Introduction (Optional)
                  </label>
                  <textarea
                    placeholder="Introduce your agency and services..."
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              )}
            </form.Field>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Registration Summary</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>Agency: {form.getFieldValue('agency_name')}</li>
                <li>License: {form.getFieldValue('license_number')}</li>
                <li>Address: {form.getFieldValue('office_address')}</li>
                <li>Phone: {form.getFieldValue('office_phone')}</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {registerMutation.isPending ? t('loading') : 'Complete Registration'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
