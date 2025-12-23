/**
 * Register Page
 * Multi-step registration flow with phone verification
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirm: z.string(),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, 'Invalid phone format'),
  verificationCode: z.string().optional(),
  agreeTerms: z.boolean(),
  agreePrivacy: z.boolean(),
  agreeMarketing: z.boolean().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      phone: '',
      verificationCode: '',
      agreeTerms: false,
      agreePrivacy: false,
      agreeMarketing: false,
    } as RegisterForm,
    onSubmit: async ({ value }) => {
      setError(null);
      setIsSubmitting(true);

      try {
        await register(value.email, value.password, value.name);
        navigate({ to: '/login', search: { redirect: '' } });
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    // TODO: Call API to send verification code
    setCodeSent(true);
    setError(null);
  };

  const handleVerifyCode = async () => {
    const code = form.getFieldValue('verificationCode');
    if (!code || code.length !== 6) {
      setError(t('auth_invalid_code'));
      return;
    }

    // TODO: Call API to verify code
    // For now, accept any 6-digit code
    setCodeVerified(true);
    setError(null);
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    window.location.href = `/real/api/v1/auth/social/${provider}/login?redirect=/`;
  };

  const canProceedStep1 = () => {
    const name = form.getFieldValue('name');
    const email = form.getFieldValue('email');
    const password = form.getFieldValue('password');
    const passwordConfirm = form.getFieldValue('passwordConfirm');
    return name.length >= 2 && email.includes('@') && password.length >= 8 && password === passwordConfirm;
  };

  const canProceedStep2 = () => {
    return codeVerified;
  };

  const canSubmit = () => {
    const agreeTerms = form.getFieldValue('agreeTerms');
    const agreePrivacy = form.getFieldValue('agreePrivacy');
    return agreeTerms && agreePrivacy;
  };

  const steps = [
    { num: 1, label: t('auth_step_info') },
    { num: 2, label: t('auth_step_verify') },
    { num: 3, label: t('auth_step_complete') },
  ];

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate({ to: '/login', search: { redirect: '' } })}
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
          {t('auth_register_title')}
        </h1>
        <p className="text-gray-500">
          {t('auth_register_subtitle')}
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
            {/* Name Field */}
            <form.Field
              name="name"
              validators={{
                onChange: z.string().min(2, 'Name must be at least 2 characters'),
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('auth_name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      placeholder="Hong Gildong"
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
                onChange: z.string().min(8, 'Password must be at least 8 characters'),
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('auth_password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8+ characters"
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

            {/* Password Confirm Field */}
            <form.Field
              name="passwordConfirm"
              validators={{
                onChangeListenTo: ['password'],
                onChange: ({ value, fieldApi }) => {
                  if (value !== fieldApi.form.getFieldValue('password')) {
                    return 'Passwords do not match';
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('auth_password_confirm')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="mt-1 text-sm text-red-500">{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1()}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('next')}
            </button>
          </>
        )}

        {/* Step 2: Phone Verification */}
        {step === 2 && (
          <>
            {/* Phone Field */}
            <form.Field
              name="phone"
              validators={{
                onChange: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, 'Invalid phone format'),
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('auth_phone')}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="010-1234-5678"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={codeSent}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 ${
                          field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={codeSent}
                      className="px-4 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {codeSent ? t('auth_code_sent') : t('auth_send_code')}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="mt-1 text-sm text-red-500">{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Verification Code Field */}
            {codeSent && (
              <form.Field name="verificationCode">
                {(field) => (
                  <div>
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('auth_verify_code')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="verificationCode"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
                        disabled={codeVerified}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 text-center tracking-widest text-lg"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={codeVerified}
                        className={`px-4 py-3 font-medium rounded-lg transition-colors whitespace-nowrap ${
                          codeVerified
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {codeVerified ? t('auth_code_verified') : t('auth_verify_code')}
                      </button>
                    </div>
                  </div>
                )}
              </form.Field>
            )}

            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2()}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('next')}
            </button>
          </>
        )}

        {/* Step 3: Agreements & Submit */}
        {step === 3 && (
          <>
            {/* Terms Agreement */}
            <div className="space-y-4">
              <form.Field name="agreeTerms">
                {(field) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.state.value || false}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">
                      {t('auth_agree_terms')} <span className="text-red-500">*</span>
                    </span>
                  </label>
                )}
              </form.Field>

              <form.Field name="agreePrivacy">
                {(field) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.state.value || false}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">
                      {t('auth_agree_privacy')} <span className="text-red-500">*</span>
                    </span>
                  </label>
                )}
              </form.Field>

              <form.Field name="agreeMarketing">
                {(field) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.state.value || false}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-500">
                      {t('auth_agree_marketing')}
                    </span>
                  </label>
                )}
              </form.Field>
            </div>

            <button
              type="submit"
              disabled={!canSubmit() || isSubmitting || authLoading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('loading') : t('auth_register_button')}
            </button>
          </>
        )}
      </form>

      {/* Divider */}
      {step === 1 && (
        <>
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
        </>
      )}

      {/* Login Link */}
      <p className="mt-8 text-center text-gray-600">
        {t('auth_already_account')}{' '}
        <button
          type="button"
          onClick={() => navigate({ to: '/login', search: { redirect: '' } })}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          {t('auth_login_link')}
        </button>
      </p>
    </div>
  );
}
