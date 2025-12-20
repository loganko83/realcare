import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n/useTranslation';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const [userState, setUserState] = useState<'preparing' | 'reviewing' | 'signed'>('preparing');

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">{t('app_name')}</h1>
        <button className="relative p-2 rounded-full hover:bg-slate-100">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* State Card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <p className="text-brand-100 text-sm font-medium mb-1">{t('home_my_status')}</p>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {userState === 'preparing' && t('home_preparing')}
            {userState === 'reviewing' && t('home_reviewing')}
            {userState === 'signed' && t('home_signed')}
          </h2>
          <button
            onClick={() => setUserState(prev => prev === 'preparing' ? 'reviewing' : prev === 'reviewing' ? 'signed' : 'preparing')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition"
          >
            {t('change')}
          </button>
        </div>

        {/* Dynamic Action Area */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          {userState === 'preparing' && (
            <>
              <p className="text-sm text-white/90 mb-3">{t('home_check_budget')}</p>
              <Link
                to="/calculators"
                className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition"
              >
                {t('home_check_loan')} <ArrowRight size={16} />
              </Link>
            </>
          )}
          {userState === 'reviewing' && (
            <>
              <div className="flex items-center gap-2 text-yellow-300 mb-2">
                <AlertTriangle size={16} />
                <span className="text-sm font-bold">{t('home_risk_needed')}</span>
              </div>
              <p className="text-sm text-white/90 mb-3">{t('home_upload_contract')}</p>
              <Link
                to="/contract"
                className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition"
              >
                {t('home_analyze_risk')} <ArrowRight size={16} />
              </Link>
            </>
          )}
          {userState === 'signed' && (
            <>
              <div className="flex items-center gap-2 text-green-300 mb-2">
                <CheckCircle size={16} />
                <span className="text-sm font-bold">{t('home_dday_movein')}</span>
              </div>
              <p className="text-sm text-white/90 mb-3">{t('home_prepare_moving')}</p>
              <Link
                to="/timeline"
                className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition"
              >
                {t('home_view_roadmap')} <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Owner Signal Section */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-2">{t('home_owner_title')}</h3>
        <p className="text-slate-500 text-sm mb-4">{t('home_owner_desc')}</p>
        <Link
          to="/signals"
          className="w-full border border-brand-200 text-brand-600 font-medium py-2.5 rounded-lg hover:bg-brand-50 transition text-sm block text-center"
        >
          {t('home_register_signal')}
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 text-lg">{t('home_recent_news')}</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">{t('home_reality_complete')}</h4>
              <p className="text-xs text-slate-500 mt-1">{t('home_mapo_score')}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">{t('home_policy_alert')}</h4>
              <p className="text-xs text-slate-500 mt-1">{t('home_seoul_ltv')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
