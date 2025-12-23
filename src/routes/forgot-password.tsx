/**
 * Forgot Password Page
 * Request password reset email
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setIsSubmitting(true);

      try {
        // TODO: Call API to send password reset email
        const response = await fetch('/real/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value.email }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to send reset email');
        }

        setEmailSent(true);
      } catch (err: any) {
        // Show success even if email doesn't exist (security best practice)
        setEmailSent(true);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate({ to: '/login', search: { redirect: '' } })}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {t('auth_reset_sent')}
          </h1>
          <p className="text-gray-500 text-center mb-8 max-w-sm">
            {form.getFieldValue('email')}
          </p>
          <button
            onClick={() => navigate({ to: '/login', search: { redirect: '' } })}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth_back_to_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate({ to: '/login', search: { redirect: '' } })}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('auth_reset_title')}
        </h1>
        <p className="text-gray-500">
          {t('auth_reset_subtitle')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Email Field */}
        <form.Field
          name="email"
          validators={{
            onChange: z.string().email('Invalid email format'),
          }}
        >
          {(field) => (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth_email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-500">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('loading') : t('auth_send_reset')}
        </button>
      </form>

      {/* Back to Login */}
      <p className="mt-8 text-center text-gray-600">
        <button
          type="button"
          onClick={() => navigate({ to: '/login', search: { redirect: '' } })}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          {t('auth_back_to_login')}
        </button>
      </p>
    </div>
  );
}
