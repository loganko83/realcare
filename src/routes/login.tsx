/**
 * Login Page
 * Email/password authentication with social login options
 */

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || '/',
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/login' });
  const { login, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    } as LoginForm,
    onSubmit: async ({ value }) => {
      setError(null);
      setIsSubmitting(true);

      try {
        await login(value.email, value.password);
        navigate({ to: redirect || '/' });
      } catch (err: any) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    // Redirect to OAuth endpoint
    window.location.href = `/real/api/v1/auth/social/${provider}/login?redirect=${encodeURIComponent(redirect || '/')}`;
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate({ to: '/' })}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('auth_login_title')}
        </h1>
        <p className="text-gray-500">
          {t('auth_login_subtitle')}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Login Form */}
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

        {/* Password Field */}
        <form.Field
          name="password"
          validators={{
            onChange: z.string().min(1, 'Password is required'),
          }}
        >
          {(field) => (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('auth_password')}
                </label>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/forgot-password' })}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('auth_forgot_password')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="mt-1 text-sm text-red-500">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Remember Me */}
        <form.Field name="rememberMe">
          {(field) => (
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={field.state.value || false}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                {t('auth_remember_me')}
              </label>
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('loading') : t('auth_login_button')}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">{t('auth_or_continue_with')}</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          className="w-full py-3 bg-[#FEE500] text-[#191919] font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#FDD800] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73L5.58 21l4.07-2.68c.77.11 1.55.18 2.35.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
          {t('auth_login_kakao')}
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('naver')}
          className="w-full py-3 bg-[#03C75A] text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#02B350] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
          </svg>
          {t('auth_login_naver')}
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('auth_login_google')}
        </button>
      </div>

      {/* Register Link */}
      <p className="mt-8 text-center text-gray-600">
        {t('auth_no_account')}{' '}
        <button
          type="button"
          onClick={() => navigate({ to: '/register' })}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          {t('auth_register_link')}
        </button>
      </p>
    </div>
  );
}
