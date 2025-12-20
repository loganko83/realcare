import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Plus, Calendar, MapPin, Trash2, Bell, AlertCircle, ChevronRight, Home, CreditCard } from 'lucide-react';

interface ContractHistory {
  id: number;
  address: string;
  type: 'Jeonse' | 'Monthly' | 'Sale';
  deposit: number; // Man won
  rent: number; // Man won
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
}

export const Settings: React.FC = () => {
  const [contracts, setContracts] = useState<ContractHistory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Form State
  const [newContract, setNewContract] = useState<Partial<ContractHistory>>({
    type: 'Jeonse',
    status: 'active',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('realcare_my_contracts');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContracts(parsed);
      checkNotifications(parsed);
    } else {
        // Mock data for first time user
        const mock: ContractHistory = {
            id: 1,
            address: '서울시 마포구 공덕동 래미안 304호',
            type: 'Jeonse',
            deposit: 50000,
            rent: 0,
            startDate: '2022-06-01',
            endDate: '2024-06-01', // Example date
            status: 'active'
        };
        setContracts([mock]);
        localStorage.setItem('realcare_my_contracts', JSON.stringify([mock]));
        checkNotifications([mock]);
    }
  }, []);

  const checkNotifications = (list: ContractHistory[]) => {
    const alerts: string[] = [];
    const today = new Date();
    
    list.forEach(c => {
        if (c.status !== 'active') return;
        
        const end = new Date(c.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // 3 Months (approx 90 days) & 2 Months (approx 60 days) logic
        // Korean Lease Protection Act requires notice between 6 to 2 months before expiry.
        
        if (diffDays <= 90 && diffDays > 60) {
            alerts.push(`[만료 3개월 전] '${c.address}' 계약 만료가 3개월 남았습니다. 집주인에게 연장 여부를 통지할 준비를 하세요.`);
        } else if (diffDays <= 60 && diffDays > 0) {
            alerts.push(`[만료 2개월 전] 긴급: '${c.address}' 묵시적 갱신을 원치 않는다면 지금 즉시 통보해야 합니다!`);
        } else if (diffDays <= 0) {
            alerts.push(`'${c.address}' 계약 기간이 만료되었습니다. 상태를 '완료'로 변경해주세요.`);
        }
    });
    setNotifications(alerts);
  };

  const handleAdd = () => {
    if (!newContract.address || !newContract.startDate || !newContract.endDate) return;
    
    const newItem: ContractHistory = {
        id: Date.now(),
        address: newContract.address,
        type: newContract.type as any,
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
    setNewContract({ type: 'Jeonse', status: 'active', startDate: '', endDate: '' });
  };

  const handleDelete = (id: number) => {
    if(confirm('정말 삭제하시겠습니까?')) {
        const updated = contracts.filter(c => c.id !== id);
        setContracts(updated);
        localStorage.setItem('realcare_my_contracts', JSON.stringify(updated));
        checkNotifications(updated);
    }
  };

  const formatMoney = (val: number) => {
    if (val >= 10000) return `${val/10000}억`;
    if (val > 0) return `${val}만`;
    return '0';
  };

  const getDday = (dateStr: string) => {
      const today = new Date();
      const target = new Date(dateStr);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">내 정보</h1>
        <button className="p-2 rounded-full hover:bg-slate-100">
           <SettingsIcon size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={32} />
        </div>
        <div>
            <h2 className="font-bold text-lg text-slate-800">김리얼 님</h2>
            <p className="text-xs text-slate-500">realcare@example.com</p>
            <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">임차인</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">서울</span>
            </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
          <div className="mb-6 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Bell size={14} className="text-red-500"/> 중요 알림
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
          <h3 className="font-bold text-slate-800">계약 관리 히스토리</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition"
          >
            <Plus size={14} /> 계약 등록
          </button>
      </div>

      {/* Contract List */}
      <div className="space-y-4 overflow-y-auto no-scrollbar pb-10">
          {contracts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p>등록된 계약이 없습니다.</p>
              </div>
          ) : (
              contracts.map(contract => {
                  const dDay = getDday(contract.endDate);
                  const isExpiringSoon = dDay > 0 && dDay <= 90;
                  
                  return (
                    <div key={contract.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                contract.type === 'Jeonse' ? 'bg-blue-50 text-blue-600' :
                                contract.type === 'Monthly' ? 'bg-green-50 text-green-600' :
                                'bg-purple-50 text-purple-600'
                            }`}>
                                {contract.type === 'Jeonse' ? '전세' : contract.type === 'Monthly' ? '월세' : '매매'}
                            </span>
                            
                            {contract.status === 'active' ? (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${isExpiringSoon ? 'text-red-500' : 'text-slate-400'}`}>
                                    {isExpiringSoon && <AlertCircle size={10} />}
                                    {dDay > 0 ? `만료 D-${dDay}` : '만료됨'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">완료된 계약</span>
                            )}
                        </div>

                        <h4 className="font-bold text-slate-800 mb-1">{contract.address}</h4>
                        
                        <div className="grid grid-cols-2 gap-y-1 text-sm text-slate-600 mt-2 mb-3">
                            <div className="flex items-center gap-1">
                                <CreditCard size={12} className="text-slate-400" />
                                {contract.type === 'Jeonse' ? (
                                    <span>보증금 {formatMoney(contract.deposit)}</span>
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
                  <h3 className="font-bold text-lg mb-4 text-slate-800">계약 등록</h3>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">주소</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg text-sm"
                            placeholder="아파트/빌라명 동호수"
                            value={newContract.address || ''}
                            onChange={e => setNewContract({...newContract, address: e.target.value})}
                          />
                      </div>
                      
                      <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">계약 형태</label>
                            <select 
                                className="w-full p-2 border rounded-lg text-sm"
                                value={newContract.type}
                                onChange={e => setNewContract({...newContract, type: e.target.value as any})}
                            >
                                <option value="Jeonse">전세</option>
                                <option value="Monthly">월세</option>
                                <option value="Sale">매매</option>
                            </select>
                          </div>
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">보증금(만원)</label>
                              <input 
                                type="number" 
                                className="w-full p-2 border rounded-lg text-sm"
                                placeholder="0"
                                value={newContract.deposit || ''}
                                onChange={e => setNewContract({...newContract, deposit: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">시작일</label>
                              <input 
                                type="date" 
                                className="w-full p-2 border rounded-lg text-sm"
                                value={newContract.startDate}
                                onChange={e => setNewContract({...newContract, startDate: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">종료일</label>
                              <input 
                                type="date" 
                                className="w-full p-2 border rounded-lg text-sm"
                                value={newContract.endDate}
                                onChange={e => setNewContract({...newContract, endDate: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-slate-600 font-bold hover:bg-gray-200"
                      >
                          취소
                      </button>
                      <button 
                        onClick={handleAdd}
                        className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900"
                      >
                          등록하기
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
