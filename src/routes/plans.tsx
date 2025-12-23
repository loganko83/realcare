/**
 * Subscription Plans Page
 * Compare and select subscription plans
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Star, Zap, Building2, Shield } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api/client';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular?: boolean;
  max_analyses: number;
  max_signals: number;
}

interface PlansResponse {
  plans: Plan[];
}

export const Route = createFileRoute('/plans')({
  component: PlansPage,
});

function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<PlansResponse>({
    queryKey: ['subscription', 'plans'],
    queryFn: async () => {
      return apiClient.get('/payments/plans');
    },
  });

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return <Star className="w-6 h-6" />;
      case 'basic':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <Building2 className="w-6 h-6" />;
      case 'enterprise':
        return <Shield className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return { bg: 'bg-gray-100', text: 'text-gray-600', accent: 'bg-gray-600' };
      case 'basic':
        return { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-600' };
      case 'pro':
        return { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-600' };
      case 'enterprise':
        return { bg: 'bg-orange-100', text: 'text-orange-600', accent: 'bg-orange-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', accent: 'bg-gray-600' };
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: `/checkout?plan=${planId}` } });
      return;
    }
    navigate({ to: '/checkout', search: { plan: planId } });
  };

  // Default plans if API not available
  const defaultPlans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic features for individuals',
      price_monthly: 0,
      price_yearly: 0,
      max_analyses: 3,
      max_signals: 1,
      features: [
        'Reality Check 3x/month',
        'Basic DSR/LTV Calculator',
        'Tax Calculator',
        '1 Owner Signal',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'For active home buyers',
      price_monthly: 9900,
      price_yearly: 99000,
      max_analyses: 20,
      max_signals: 5,
      is_popular: true,
      features: [
        'Reality Check 20x/month',
        'AI Contract Analysis',
        'Smart Move-in Timeline',
        '5 Owner Signals',
        'Email Support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals and investors',
      price_monthly: 29900,
      price_yearly: 299000,
      max_analyses: -1,
      max_signals: -1,
      features: [
        'Unlimited Reality Check',
        'Advanced AI Analysis',
        'Priority Support',
        'Unlimited Signals',
        'API Access',
        'Market Insights',
      ],
    },
  ];

  const plans = data?.plans || defaultPlans;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-6 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-blue-100">
          Unlock premium features for better real estate decisions
        </p>
      </div>

      {/* Plans */}
      <div className="px-6 -mt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const color = getPlanColor(plan.name);
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm ${
                    plan.is_popular ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {plan.is_popular && (
                    <div className="bg-blue-600 text-white text-center py-1.5 text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                        <p className="text-gray-500 text-sm">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {plan.price_monthly === 0 ? 'Free' : `${plan.price_monthly.toLocaleString()}`}
                        </span>
                        {plan.price_monthly > 0 && (
                          <span className="text-gray-500">/ month</span>
                        )}
                      </div>
                      {plan.price_yearly > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% with yearly
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 ${color.text} flex-shrink-0 mt-0.5`} />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3 rounded-xl font-medium transition-colors ${
                        plan.is_popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {plan.price_monthly === 0 ? 'Get Started' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">FAQ</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-500 text-sm">
              Yes, you can cancel your subscription at any time. You will continue to have access until the end of your billing period.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-500 text-sm">
              We accept all major credit cards, Kakao Pay, Naver Pay, and Toss Pay.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Is there a free trial?</h3>
            <p className="text-gray-500 text-sm">
              New users get 7 days of Pro features free. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
