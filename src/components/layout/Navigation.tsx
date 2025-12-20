import { Link, useLocation } from '@tanstack/react-router';
import { Home, Calculator, FileText, Calendar, Send } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/useTranslation';

export function Navigation() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs = [
    { path: '/', icon: Home, labelKey: 'nav_home' as const },
    { path: '/calculators', icon: Calculator, labelKey: 'nav_reality_check' as const },
    { path: '/signals', icon: Send, labelKey: 'nav_signals' as const },
    { path: '/timeline', icon: Calendar, labelKey: 'nav_timeline' as const },
    { path: '/contract', icon: FileText, labelKey: 'nav_contract' as const },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
