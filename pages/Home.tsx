import React, { useState } from 'react';
import { ChevronRight, Bell, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  // Mock User State: "Preparing", "Reviewing", "Signed", "Owner"
  const [userState, setUserState] = useState<'preparing' | 'reviewing' | 'signed'>('preparing');

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">리얼케어</h1>
        <button className="relative p-2 rounded-full hover:bg-slate-100">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* State Card (The core of the UX) */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <p className="text-brand-100 text-sm font-medium mb-1">나의 상태</p>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {userState === 'preparing' && "내 집 마련 준비 중"}
            {userState === 'reviewing' && "계약서 검토 중"}
            {userState === 'signed' && "계약 완료 & 이사 준비"}
          </h2>
          <button 
            onClick={() => setUserState(prev => prev === 'preparing' ? 'reviewing' : prev === 'reviewing' ? 'signed' : 'preparing')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition"
          >
            변경 ▸
          </button>
        </div>

        {/* Dynamic Action Area based on State */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          {userState === 'preparing' && (
            <>
              <p className="text-sm text-white/90 mb-3">안전한 예산 한도를 확인해보세요.</p>
              <button className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition">
                내 대출 한도 확인하기 <ArrowRight size={16} />
              </button>
            </>
          )}
          {userState === 'reviewing' && (
            <>
              <div className="flex items-center gap-2 text-yellow-300 mb-2">
                <AlertTriangle size={16} />
                <span className="text-sm font-bold">위험 진단 필요</span>
              </div>
              <p className="text-sm text-white/90 mb-3">서명 전 계약서 초안을 올려보세요.</p>
              <button className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition">
                계약서 리스크 분석 <ArrowRight size={16} />
              </button>
            </>
          )}
          {userState === 'signed' && (
            <>
               <div className="flex items-center gap-2 text-green-300 mb-2">
                <CheckCircle size={16} />
                <span className="text-sm font-bold">이사 D-30</span>
              </div>
              <p className="text-sm text-white/90 mb-3">인테리어와 이사를 준비할 시간입니다.</p>
              <button className="w-full bg-white text-brand-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 transition">
                이사 로드맵 보기 <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Owner Signal Section (If applicable, or usually separate view) */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-slate-800 mb-2">집주인이신가요?</h3>
        <p className="text-slate-500 text-sm mb-4">전화번호 노출 없이 매도 의사를 등록하세요.</p>
        <button className="w-full border border-brand-200 text-brand-600 font-medium py-2.5 rounded-lg hover:bg-brand-50 transition text-sm">
          '집주인 신호' 등록하기
        </button>
      </div>

      {/* Recent Activity / Feed */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3 text-lg">최근 소식</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">현실 점검 완료</h4>
              <p className="text-xs text-slate-500 mt-1">마포구 아파트 점수는 78점입니다.</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-medium text-slate-800">새로운 부동산 정책 알림</h4>
              <p className="text-xs text-slate-500 mt-1">서울시 LTV 한도가 일부 변경되었습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};