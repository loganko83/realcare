import { Link, useLocation } from '@tanstack/react-router';
import { Home, Calculator, FileText, Building2, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/calculators', icon: Calculator, label: 'Check' },
  { path: '/subscription', icon: Building2, label: 'Subscribe' },
  { path: '/contract', icon: FileText, label: 'Contract' },
  { path: '/settings', icon: User, label: 'Profile' },
];

export function Navigation() {
  const location = useLocation();

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
              <span className="text-[9px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
