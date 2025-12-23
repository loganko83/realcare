/**
 * Onboarding Tutorial Component
 * First-time user experience highlighting key features
 */

import { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Target,
  FileText,
  Radio,
  Calendar,
  Calculator,
  Shield,
  CheckCircle,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image?: string;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: <Shield className="text-brand-600" size={32} />,
    title: 'Welcome to RealCare',
    description: 'Your comprehensive real estate care companion. We help you navigate property transactions with confidence.',
    highlight: 'Korean real estate made simple',
  },
  {
    id: 'reality-check',
    icon: <Target className="text-brand-600" size={32} />,
    title: 'Reality Check',
    description: 'Know your purchasing power before you start. Get a Reality Score that shows your financial readiness based on Korean LTV/DSR regulations.',
    highlight: 'Personalized affordability analysis',
  },
  {
    id: 'contract',
    icon: <FileText className="text-brand-600" size={32} />,
    title: 'Contract Analysis',
    description: 'AI-powered contract review identifies potential risks and explains complex legal terms in plain language.',
    highlight: 'AI-powered risk detection',
  },
  {
    id: 'signals',
    icon: <Radio className="text-brand-600" size={32} />,
    title: 'Owner Signals',
    description: 'Browse anonymous property listings from owners ready to sell or rent. Send contact requests when you find a match.',
    highlight: 'Direct owner connections',
  },
  {
    id: 'timeline',
    icon: <Calendar className="text-brand-600" size={32} />,
    title: 'Smart Move-in',
    description: 'Track your entire move-in journey from contract to keys. Never miss important deadlines with D-Day based task management.',
    highlight: 'D-Day task tracking',
  },
  {
    id: 'calculators',
    icon: <Calculator className="text-brand-600" size={32} />,
    title: 'Financial Calculators',
    description: 'Calculate taxes, loan limits, and affordability with our suite of tools designed for Korean real estate.',
    highlight: 'Korean tax & loan tools',
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('realcare_onboarding_complete', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('realcare_onboarding_complete', 'true');
    onSkip?.() || onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-4 flex justify-between items-center">
          <div className="flex gap-1.5" role="tablist" aria-label="Onboarding steps">
            {ONBOARDING_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Step ${idx + 1}: ${s.title}`}
                aria-selected={idx === currentStep}
                role="tab"
                className={`h-6 flex items-center justify-center rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-brand-600'
                    : idx < currentStep
                      ? 'w-6 bg-brand-300'
                      : 'w-6 bg-gray-200'
                }`}
              >
                <span className={`block rounded-full ${
                  idx === currentStep ? 'w-6 h-1.5' : 'w-1.5 h-1.5'
                } ${
                  idx === currentStep
                    ? 'bg-white'
                    : idx < currentStep
                      ? 'bg-brand-600'
                      : 'bg-gray-400'
                }`} />
              </button>
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-slate-600 hover:text-slate-800 transition font-medium"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 pt-8 transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-50 flex items-center justify-center">
            {step.icon}
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-slate-800">{step.title}</h2>
            <p className="text-slate-500 leading-relaxed">{step.description}</p>
            {step.highlight && (
              <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-full">
                {step.highlight}
              </span>
            )}
          </div>
        </div>

        {/* Feature Quick Preview - Shows on feature steps */}
        {currentStep > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Try it now</p>
                  <p className="text-xs text-slate-400">Navigate to {step.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="p-6 pt-2 flex gap-3">
          {!isFirstStep && (
            <button
              onClick={handlePrev}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-slate-600 font-medium hover:bg-gray-50 transition"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-700 text-white font-bold rounded-xl hover:bg-brand-800 transition"
          >
            {isLastStep ? (
              <>
                <CheckCircle size={18} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    const complete = localStorage.getItem('realcare_onboarding_complete');
    if (!complete) {
      setIsComplete(false);
      // Delay showing onboarding slightly for better UX
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setIsComplete(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('realcare_onboarding_complete');
    setIsComplete(false);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isComplete,
    completeOnboarding,
    resetOnboarding,
  };
}

// Export utility to check if onboarding is complete
export function isOnboardingComplete(): boolean {
  return localStorage.getItem('realcare_onboarding_complete') === 'true';
}
