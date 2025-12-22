/**
 * Checkout Page
 * Payment processing for subscription
 */

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api/client';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (search.plan as string) || '',
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan: planId } = useSearch({ from: '/checkout' });
  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [error, setError] = useState<string | null>(null);

  const { data: plan, isLoading: planLoading } = useQuery<Plan>({
    queryKey: ['subscription', 'plan', planId],
    queryFn: async () => {
      return apiClient.fetch(`/subscriptions/plans/${planId}`);
    },
    enabled: !!planId,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.fetch('/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
        }),
      });
    },
    onSuccess: (data: { payment_url?: string; order_id?: string }) => {
      // Redirect to payment gateway (Toss Payments)
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        // Handle in-app payment
        navigate({ to: '/payment/success', search: { order_id: data.order_id } });
      }
    },
    onError: (err: Error) => {
      setError(err.message || 'Payment failed. Please try again.');
    },
  });

  const handleCheckout = () => {
    setError(null);
    createPaymentMutation.mutate();
  };

  // Default plan data
  const defaultPlan: Plan = {
    id: planId,
    name: planId.charAt(0).toUpperCase() + planId.slice(1),
    description: 'Subscription plan',
    price_monthly: planId === 'basic' ? 9900 : planId === 'pro' ? 29900 : 0,
    price_yearly: planId === 'basic' ? 99000 : planId === 'pro' ? 299000 : 0,
    features: [],
  };

  const currentPlan = plan || defaultPlan;
  const price = billingCycle === 'monthly' ? currentPlan.price_monthly : currentPlan.price_yearly;
  const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(price / 12) : price;

  if (!planId) {
    navigate({ to: '/plans' });
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/plans' })}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Plan Summary */}
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            {planLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ) : (
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">{currentPlan.name} Plan</h3>
                  <p className="text-sm text-gray-500">{currentPlan.description}</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Billing Cycle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    billingCycle === 'monthly'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Monthly</p>
                  <p className="text-sm text-gray-500">
                    {currentPlan.price_monthly.toLocaleString()}/mo
                  </p>
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`p-4 rounded-xl border-2 transition-colors relative ${
                    billingCycle === 'yearly'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Save {Math.round((1 - currentPlan.price_yearly / (currentPlan.price_monthly * 12)) * 100)}%
                  </span>
                  <p className="font-medium text-gray-900">Yearly</p>
                  <p className="text-sm text-gray-500">
                    {Math.round(currentPlan.price_yearly / 12).toLocaleString()}/mo
                  </p>
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-600">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {billingCycle === 'yearly' ? 'per year' : 'per month'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>

            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 text-gray-600" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Credit/Debit Card</p>
                  <p className="text-sm text-gray-500">Visa, Mastercard, etc.</p>
                </div>
                {paymentMethod === 'card' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('kakao')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-colors ${
                  paymentMethod === 'kakao'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-6 h-6 bg-[#FEE500] rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-[#191919]">K</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Kakao Pay</p>
                  <p className="text-sm text-gray-500">Pay with Kakao</p>
                </div>
                {paymentMethod === 'kakao' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('toss')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-colors ${
                  paymentMethod === 'toss'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Toss Pay</p>
                  <p className="text-sm text-gray-500">Pay with Toss</p>
                </div>
                {paymentMethod === 'toss' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-100 rounded-xl">
            <Shield className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              Your payment is secured with 256-bit SSL encryption
            </p>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={createPaymentMutation.isPending}
            className="w-full py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {createPaymentMutation.isPending ? 'Processing...' : `Pay ${price.toLocaleString()}`}
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our Terms of Service and Privacy Policy.
            Subscriptions auto-renew unless cancelled.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
