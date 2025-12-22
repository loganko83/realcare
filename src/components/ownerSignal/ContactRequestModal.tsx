/**
 * Contact Request Modal Component
 * Allows users to send contact requests to signal owners
 * Requires Reality Score as gating mechanism
 */

import { useState } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  Target,
  MessageSquare,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { OwnerSignal } from '../../types/ownerSignal';
import { formatKRW } from '../../lib/utils/dsr';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface ContactRequestModalProps {
  signal: OwnerSignal;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ContactRequest {
  signalId: string;
  realityScore: number | null;
  message: string;
  contactPreference: 'phone' | 'email' | 'kakao';
  createdAt: string;
}

// Check if user has a Reality Score
function getStoredRealityScore(): number | null {
  try {
    const analyses = localStorage.getItem('realcare_saved_analyses');
    if (analyses) {
      const parsed = JSON.parse(analyses);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Get the most recent score
        const latest = parsed[parsed.length - 1];
        return latest.score || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Save contact request to localStorage (temp until backend)
function saveContactRequest(request: ContactRequest): void {
  try {
    const existing = localStorage.getItem('realcare_contact_requests');
    const requests: ContactRequest[] = existing ? JSON.parse(existing) : [];
    requests.push(request);
    localStorage.setItem('realcare_contact_requests', JSON.stringify(requests));
  } catch {
    console.error('Failed to save contact request');
  }
}

export function ContactRequestModal({ signal, onClose, onSuccess }: ContactRequestModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [message, setMessage] = useState('');
  const [contactPreference, setContactPreference] = useState<'phone' | 'email' | 'kakao'>('kakao');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const realityScore = getStoredRealityScore();
  const hasScore = realityScore !== null && realityScore > 0;
  const meetsThreshold = realityScore !== null && realityScore >= 50;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const request: ContactRequest = {
      signalId: signal.id,
      realityScore,
      message,
      contactPreference,
      createdAt: new Date().toISOString(),
    };

    saveContactRequest(request);
    setStep('success');
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800">
            {step === 'success' ? 'Request Sent' : 'Contact Request'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Intro Step - Show Reality Score Gate */}
        {step === 'intro' && (
          <div className="p-6 space-y-6">
            {/* Property Summary */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-slate-800 text-white text-xs font-bold rounded">
                  {signal.property.propertyType.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded">
                  {signal.signalType.toUpperCase()}
                </span>
              </div>
              <p className="font-medium text-slate-800">
                {signal.property.district} - {signal.property.areaSquareMeters}sqm
              </p>
              <p className="text-lg font-bold text-brand-600 mt-1">
                {formatKRW(signal.pricing.minPrice)} ~ {formatKRW(signal.pricing.maxPrice)}
              </p>
            </div>

            {/* Reality Score Check */}
            <div className={`p-4 rounded-xl border-2 ${
              meetsThreshold ? 'border-green-200 bg-green-50' :
              hasScore ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-3">
                {meetsThreshold ? (
                  <ShieldCheck className="text-green-600 mt-0.5" size={24} />
                ) : (
                  <AlertTriangle className={hasScore ? 'text-yellow-600' : 'text-red-500'} size={24} />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">
                    {meetsThreshold ? 'You\'re Qualified!' :
                     hasScore ? 'Low Reality Score' : 'Reality Score Required'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {meetsThreshold ? (
                      <>Your Reality Score of <span className="font-bold">{realityScore}</span> meets the minimum requirement of 50.</>
                    ) : hasScore ? (
                      <>Your Reality Score of <span className="font-bold">{realityScore}</span> is below the recommended minimum of 50.</>
                    ) : (
                      <>Complete a Reality Check to verify your purchasing capability before contacting owners.</>
                    )}
                  </p>
                </div>
                {hasScore && (
                  <div className={`text-2xl font-bold ${meetsThreshold ? 'text-green-600' : 'text-yellow-600'}`}>
                    {realityScore}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!hasScore && (
              <div className="space-y-3">
                <a
                  href="/real/calculators"
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 transition"
                >
                  <Target size={18} />
                  Calculate Reality Score
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-3 text-slate-500 font-medium hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {hasScore && (
              <div className="space-y-3">
                <button
                  onClick={() => setStep('form')}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 transition"
                >
                  <MessageSquare size={18} />
                  Continue to Message
                </button>
                {!meetsThreshold && (
                  <p className="text-xs text-center text-yellow-600">
                    Note: Low scores may reduce your chances of getting a response.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <div className="p-6 space-y-6">
            {/* Score Badge */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldCheck className={meetsThreshold ? 'text-green-600' : 'text-yellow-500'} size={20} />
                <span className="text-sm font-medium text-slate-600">Your Reality Score</span>
              </div>
              <span className={`text-xl font-bold ${meetsThreshold ? 'text-green-600' : 'text-yellow-600'}`}>
                {realityScore}
              </span>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Message to Owner <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain your interest..."
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Contact Preference */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Preferred Contact Method
              </label>
              <div className="flex gap-2">
                {(['kakao', 'phone', 'email'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setContactPreference(method)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition ${
                      contactPreference === method
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-slate-500 hover:bg-gray-50'
                    }`}
                  >
                    {method === 'kakao' && 'KakaoTalk'}
                    {method === 'phone' && 'Phone'}
                    {method === 'email' && 'Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="text-xs text-slate-400 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-slate-500 mb-1">Privacy Notice</p>
              <p>Your contact information will only be shared with the owner if they accept your request. Your Reality Score helps owners assess buyer readiness.</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Request
                </>
              )}
            </button>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Request Sent Successfully!
              </h3>
              <p className="text-sm text-slate-500">
                The owner will be notified of your interest. If they accept, you'll receive their contact information.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-left text-sm">
              <p className="font-medium text-slate-700 mb-2">What happens next?</p>
              <ul className="space-y-1 text-slate-500">
                <li>1. Owner reviews your request and Reality Score</li>
                <li>2. If accepted, you'll receive contact details</li>
                <li>3. You can then arrange a viewing directly</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
