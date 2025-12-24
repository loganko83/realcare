import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Plus, Calendar, Trash2, Bell, AlertCircle, CreditCard, Globe, HelpCircle } from 'lucide-react';
import { useTranslation } from '../lib/i18n/useTranslation';
import { OnboardingTutorial } from '../components/onboarding/OnboardingTutorial';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

interface ContractHistory {
  id: number;
  address: string;
  type: 'jeonse' | 'monthly' | 'sale';
  deposit: number;
  rent: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
}

function SettingsPage() {
  const { t, lang, changeLanguage } = useTranslation();
  const [contracts, setContracts] = useState<ContractHistory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  const [newContract, setNewContract] = useState<Partial<ContractHistory>>({
    type: 'jeonse',
    status: 'active',
    startDate: '',
    endDate: ''
  });

  // Load contracts only once on mount
  useEffect(() => {
    const saved = localStorage.getItem('realcare_my_contracts');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContracts(parsed);
    } else {
      // Create mock data with neutral address (will be displayed based on current lang)
      const mock: ContractHistory = {
        id: 1,
        address: 'Seoul Mapo-gu Gongdeok-dong Raemian 304',
        type: 'jeonse',
        deposit: 50000,
        rent: 0,
        startDate: '2022-06-01',
        endDate: '2024-06-01',
        status: 'active'
      };
      setContracts([mock]);
      localStorage.setItem('realcare_my_contracts', JSON.stringify([mock]));
    }
  }, []);

  // Update notifications when contracts or language changes
  useEffect(() => {
    if (contracts.length > 0) {
      checkNotifications(contracts);
    }
  }, [contracts, lang]);

  const checkNotifications = (list: ContractHistory[]) => {
    const alerts: string[] = [];
    const today = new Date();

    list.forEach(c => {
      if (c.status !== 'active') return;

      const end = new Date(c.endDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 90 && diffDays > 60) {
        alerts.push(lang === 'ko'
          ? `[3개월 전 알림] '${c.address}' 계약이 3개월 후 만료됩니다. 갱신 여부를 임대인에게 통보하세요.`
          : `[3 Months Notice] '${c.address}' expires in 3 months. Prepare to notify the landlord about renewal.`
        );
      } else if (diffDays <= 60 && diffDays > 0) {
        alerts.push(lang === 'ko'
          ? `[2개월 전 긴급] '${c.address}' - 자동갱신을 원하지 않으면 즉시 통보하세요!`
          : `[2 Months Notice] URGENT: '${c.address}' - If you don't want automatic renewal, notify immediately!`
        );
      } else if (diffDays <= 0) {
        alerts.push(lang === 'ko'
          ? `'${c.address}' 계약이 만료되었습니다. 상태를 '완료'로 변경해주세요.`
          : `'${c.address}' has expired. Please update the status to 'completed'.`
        );
      }
    });
    setNotifications(alerts);
  };

  const handleAdd = () => {
    if (!newContract.address || !newContract.startDate || !newContract.endDate) return;

    const newItem: ContractHistory = {
      id: Date.now(),
      address: newContract.address,
      type: newContract.type as ContractHistory['type'],
      deposit: Number(newContract.deposit) || 0,
      rent: Number(newContract.rent) || 0,
      startDate: newContract.startDate!,
      endDate: newContract.endDate!,
      status: 'active'
    };

    const updated = [newItem, ...contracts];
    setContracts(updated);
    localStorage.setItem('realcare_my_contracts', JSON.stringify(updated));
    checkNotifications(updated);
    setShowAddModal(false);
    setNewContract({ type: 'jeonse', status: 'active', startDate: '', endDate: '' });
  };

  const handleDelete = (id: number) => {
    const msg = lang === 'ko' ? '이 계약을 삭제하시겠습니까?' : 'Are you sure you want to delete this contract?';
    if (confirm(msg)) {
      const updated = contracts.filter(c => c.id !== id);
      setContracts(updated);
      localStorage.setItem('realcare_my_contracts', JSON.stringify(updated));
      checkNotifications(updated);
    }
  };

  const formatMoney = (val: number) => {
    if (lang === 'ko') {
      if (val >= 10000) return `${val / 10000}억`;
      if (val > 0) return `${val}만`;
      return '0';
    }
    if (val >= 10000) return `${val / 10000}B`;
    if (val > 0) return `${val}M`;
    return '0';
  };

  const getDday = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeLabel = (type: string) => {
    if (lang === 'ko') {
      return type === 'jeonse' ? '전세' : type === 'monthly' ? '월세' : '매매';
    }
    return type === 'jeonse' ? 'Jeonse' : type === 'monthly' ? 'Monthly' : 'Sale';
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('settings_title')}</h1>
        <button className="p-2 rounded-full hover:bg-slate-100">
          <SettingsIcon size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Language Toggle */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
              <Globe size={20} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{t('settings_language')}</h3>
              <p className="text-xs text-slate-500">{lang === 'ko' ? '한국어' : 'English'}</p>
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => changeLanguage('ko')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                lang === 'ko' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                lang === 'en' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Replay */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <button
          onClick={() => setShowTutorial(true)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <HelpCircle size={20} className="text-slate-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">
                {lang === 'ko' ? '튜토리얼 다시 보기' : 'Replay Tutorial'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ko' ? '앱 기능 안내 보기' : 'View app feature guide'}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            <HelpCircle size={16} />
          </div>
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <User size={32} />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">{lang === 'ko' ? '김리얼' : 'Kim Real'}</h2>
          <p className="text-xs text-slate-500">realcare@example.com</p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">
              {lang === 'ko' ? '세입자' : 'Tenant'}
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
              {lang === 'ko' ? '서울' : 'Seoul'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1">
            <Bell size={14} className="text-red-500" /> {lang === 'ko' ? '중요 알림' : 'Important Alerts'}
          </h3>
          <div className="space-y-2">
            {notifications.map((note, i) => (
              <div key={i} className="bg-red-50 p-3 rounded-xl border border-red-100 flex gap-3 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract History Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-800">{lang === 'ko' ? '계약 이력' : 'Contract History'}</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition"
        >
          <Plus size={14} /> {lang === 'ko' ? '계약 추가' : 'Add Contract'}
        </button>
      </div>

      {/* Contract List */}
      <div className="space-y-4 overflow-y-auto no-scrollbar pb-10">
        {contracts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p>{lang === 'ko' ? '등록된 계약이 없습니다.' : 'No contracts registered.'}</p>
          </div>
        ) : (
          contracts.map(contract => {
            const dDay = getDday(contract.endDate);
            const isExpiringSoon = dDay > 0 && dDay <= 90;

            return (
              <div key={contract.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    contract.type === 'jeonse' ? 'bg-blue-50 text-blue-600' :
                    contract.type === 'monthly' ? 'bg-green-50 text-green-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {getTypeLabel(contract.type)}
                  </span>

                  {contract.status === 'active' ? (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${isExpiringSoon ? 'text-red-500' : 'text-slate-400'}`}>
                      {isExpiringSoon && <AlertCircle size={10} />}
                      {dDay > 0
                        ? (lang === 'ko' ? `만료 D-${dDay}` : `Expires D-${dDay}`)
                        : (lang === 'ko' ? '만료됨' : 'Expired')
                      }
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {lang === 'ko' ? '완료' : 'Completed'}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-800 mb-1">{contract.address}</h4>

                <div className="grid grid-cols-2 gap-y-1 text-sm text-slate-600 mt-2 mb-3">
                  <div className="flex items-center gap-1">
                    <CreditCard size={12} className="text-slate-400" />
                    {contract.type === 'jeonse' ? (
                      <span>{lang === 'ko' ? '보증금' : 'Deposit'} {formatMoney(contract.deposit)}</span>
                    ) : (
                      <span>{formatMoney(contract.deposit)} / {formatMoney(contract.rent)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-xs">{contract.startDate} ~ {contract.endDate}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end border-t border-gray-50 pt-2">
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-slate-800">
              {lang === 'ko' ? '계약 추가' : 'Add Contract'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {lang === 'ko' ? '주소' : 'Address'}
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg text-sm"
                  placeholder={lang === 'ko' ? '아파트/건물명 및 호수' : 'Apartment/Building name and unit'}
                  value={newContract.address || ''}
                  onChange={e => setNewContract({ ...newContract, address: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {lang === 'ko' ? '계약 유형' : 'Contract Type'}
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newContract.type}
                    onChange={e => setNewContract({ ...newContract, type: e.target.value as ContractHistory['type'] })}
                  >
                    <option value="jeonse">{lang === 'ko' ? '전세' : 'Jeonse'}</option>
                    <option value="monthly">{lang === 'ko' ? '월세' : 'Monthly Rent'}</option>
                    <option value="sale">{lang === 'ko' ? '매매' : 'Sale'}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {lang === 'ko' ? '보증금 (만원)' : 'Deposit (10K KRW)'}
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="0"
                    value={newContract.deposit || ''}
                    onChange={e => setNewContract({ ...newContract, deposit: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {lang === 'ko' ? '시작일' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newContract.startDate}
                    onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {lang === 'ko' ? '종료일' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newContract.endDate}
                    onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 font-bold hover:bg-gray-200"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900"
              >
                {lang === 'ko' ? '추가' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
