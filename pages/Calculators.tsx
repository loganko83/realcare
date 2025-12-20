import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService';
import { Loader2, Calculator, Building2, Landmark, Coins, ChevronRight, Info, Check, RefreshCw } from 'lucide-react';

const formatMoney = (amount: number) => {
  if (amount >= 100) {
    const eok = Math.floor(amount / 100);
    const man = Math.round(amount % 100);
    return `${eok}억 ${man > 0 ? man + '천' : ''}원`;
  }
  return `${Math.round(amount)}백만원`;
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR').format(val);
}

// --- Sub-components ---

const FinancialCheck: React.FC = () => {
  const [income, setIncome] = useState(60); // Millions KRW
  const [cash, setCash] = useState(200); // Millions KRW
  const [price, setPrice] = useState(800); // Millions KRW
  const [showResult, setShowResult] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const calculateScore = () => {
    const loanNeeded = price - cash;
    const maxLoan = income * 8; // DSR proxy
    const loanRatio = loanNeeded / price;
    
    let baseScore = 100;
    if (loanRatio > 0.4) baseScore -= 20; 
    if (loanNeeded > maxLoan) baseScore -= 30; 
    
    return Math.max(0, Math.min(100, baseScore));
  };

  const score = calculateScore();
  const data = [{ name: 'Score', value: score, fill: score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444' }];

  const handleCalculate = async () => {
    setLoading(true);
    setShowResult(true);
    const advice = await getFinancialAdvice(income, cash, price);
    setAiAdvice(advice);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      {!showResult ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4 text-slate-800">기본 조건 입력</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-600">연 소득</label>
                   <span className="text-sm font-bold text-brand-600">{income}백만원</span>
                </div>
                <input type="range" min="20" max="200" step="5" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full accent-brand-600"/>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-600">보유 현금</label>
                   <span className="text-sm font-bold text-brand-600">{formatMoney(cash)}</span>
                </div>
                <input type="range" min="0" max="2000" step="10" value={cash} onChange={(e) => setCash(Number(e.target.value))} className="w-full accent-brand-600"/>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-sm font-medium text-slate-600">목표 매물 가격</label>
                   <span className="text-sm font-bold text-brand-600">{formatMoney(price)}</span>
                </div>
                <input type="range" min="100" max="3000" step="50" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full accent-brand-600"/>
              </div>
            </div>
          </div>
          <button onClick={handleCalculate} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-900 transition flex items-center justify-center gap-2">
            <Calculator size={20} /> 가능성 진단하기
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
            <h2 className="font-semibold text-slate-600 mb-2">현실 점검 점수</h2>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={20} data={data} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                 <span className="text-4xl font-bold text-slate-800">{score}</span>
                 <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <p className={`text-center font-medium ${score > 70 ? 'text-green-600' : 'text-red-500'}`}>
              {score > 70 ? "안전합니다! 준비되셨군요." : "위험합니다. 예산을 재검토하세요."}
            </p>
          </div>

          <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100">
            <h3 className="font-bold text-brand-800 mb-2 flex items-center gap-2">
              AI 분석 리포트
              {loading && <Loader2 size={16} className="animate-spin" />}
            </h3>
            <p className="text-sm text-brand-700 leading-relaxed whitespace-pre-wrap">
              {loading ? "규제 및 시장 상황을 분석 중입니다..." : aiAdvice}
            </p>
          </div>
          <button onClick={() => setShowResult(false)} className="w-full py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">
             조건 다시 설정하기
          </button>
        </div>
      )}
    </div>
  );
};

const TaxCalculator: React.FC = () => {
  const [taxMode, setTaxMode] = useState<'acquisition' | 'transfer' | 'holding'>('acquisition');
  
  // Acquisition Inputs
  const [acqPrice, setAcqPrice] = useState(600); // Millions
  const [houseCount, setHouseCount] = useState(1);
  const [areaOver85, setAreaOver85] = useState(false);

  // Transfer Inputs
  const [buyPrice, setBuyPrice] = useState(400);
  const [sellPrice, setSellPrice] = useState(600);
  const [years, setYears] = useState(2);

  const calculateAcqTax = () => {
    // Simple Approximation
    let rate = 1.1; // Default 1.1%
    if (houseCount === 1) {
        if (acqPrice <= 600) rate = 1.1;
        else if (acqPrice <= 900) rate = 2.2; // roughly
        else rate = 3.5;
    } else if (houseCount === 2) {
        rate = 8.4;
    } else {
        rate = 12.4;
    }
    if (areaOver85 && houseCount === 1 && acqPrice > 600) rate += 0.2; // Rough rural tax logic

    const taxAmount = acqPrice * 1000000 * (rate / 100);
    return { rate, amount: taxAmount };
  };

  const calculateTransferTax = () => {
    const profit = (sellPrice - buyPrice) * 1000000;
    if (profit <= 0) return { profit: 0, amount: 0, rate: 0 };
    
    // Deductions
    const basicDeduction = 2500000;
    const longTermRate = Math.min(years * 2, 30); // Max 30% roughly for 1 house
    const longTermDeduction = years >= 3 ? profit * (longTermRate / 100) : 0;
    
    const taxBase = profit - basicDeduction - longTermDeduction;
    if (taxBase <= 0) return { profit, amount: 0, rate: 0 };

    // Tax Brackets 2024
    let tax = 0;
    let bracketRate = 0;
    if (taxBase <= 14000000) { tax = taxBase * 0.06; bracketRate = 6; }
    else if (taxBase <= 50000000) { tax = taxBase * 0.15 - 1260000; bracketRate = 15; }
    else if (taxBase <= 88000000) { tax = taxBase * 0.24 - 5760000; bracketRate = 24; }
    else if (taxBase <= 150000000) { tax = taxBase * 0.35 - 15440000; bracketRate = 35; }
    else if (taxBase <= 300000000) { tax = taxBase * 0.38 - 19940000; bracketRate = 38; }
    else if (taxBase <= 500000000) { tax = taxBase * 0.40 - 25940000; bracketRate = 40; }
    else { tax = taxBase * 0.42 - 35940000; bracketRate = 42; } // Simplified top

    // Local income tax 10%
    tax *= 1.1;

    // Short term penalty
    if (years < 1) { tax = profit * 0.77; bracketRate = 70; }
    else if (years < 2) { tax = profit * 0.66; bracketRate = 60; }

    return { profit, amount: tax, rate: bracketRate };
  };

  const acqResult = calculateAcqTax();
  const transferResult = calculateTransferTax();

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setTaxMode('acquisition')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'acquisition' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>취득세</button>
          <button onClick={() => setTaxMode('transfer')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'transfer' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>양도세</button>
          <button onClick={() => setTaxMode('holding')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'holding' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>보유세</button>
       </div>

       {taxMode === 'acquisition' && (
         <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">취득가액</label>
                   <div className="flex items-center gap-2">
                     <input type="number" value={acqPrice} onChange={e => setAcqPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg font-bold text-slate-700" />
                     <span className="shrink-0 text-sm font-bold text-slate-600">백만원</span>
                   </div>
                   <p className="text-xs text-brand-600 mt-1">{formatMoney(acqPrice)}</p>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">보유 주택 수</label>
                   <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => setHouseCount(n)} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${houseCount === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-slate-500'}`}>
                           {n === 3 ? '3주택+' : `${n}주택`}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <input type="checkbox" id="area85" checked={areaOver85} onChange={e => setAreaOver85(e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"/>
                   <label htmlFor="area85" className="text-sm text-slate-700">전용면적 85㎡ 초과 (농어촌특별세)</label>
                </div>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><Coins size={80} /></div>
                <p className="text-slate-300 text-sm mb-1">예상 취득세 (지방교육세 포함)</p>
                <h3 className="text-3xl font-bold mb-2">{formatCurrency(Math.floor(acqResult.amount / 10000) * 10000)} 원</h3>
                <div className="inline-block bg-white/20 px-2 py-1 rounded text-xs">
                    예상 세율: 약 {acqResult.rate.toFixed(2)}%
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center">※ 실제 세액은 감면 조건 등에 따라 달라질 수 있습니다.</p>
         </div>
       )}

       {taxMode === 'transfer' && (
         <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">취득가액 (백만)</label>
                        <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">양도가액 (백만)</label>
                        <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">보유 기간 (년)</label>
                    <input type="range" min="0" max="10" step="1" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full accent-brand-600" />
                    <div className="text-right text-sm font-bold text-brand-600">{years}년 {years === 10 ? '이상' : ''}</div>
                </div>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><Landmark size={80} /></div>
                <div className="flex justify-between items-end mb-4 border-b border-white/20 pb-4">
                    <div>
                       <p className="text-slate-300 text-xs">양도 차익</p>
                       <p className="font-bold text-lg">{(sellPrice - buyPrice) > 0 ? formatMoney(sellPrice - buyPrice) : '0원'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-300 text-xs">적용 세율</p>
                       <p className="font-bold text-lg">{transferResult.rate}% 구간</p>
                    </div>
                </div>
                <p className="text-slate-300 text-sm mb-1">예상 양도소득세 (지방세 포함)</p>
                <h3 className="text-3xl font-bold">{formatCurrency(Math.floor(transferResult.amount / 10000) * 10000)} 원</h3>
            </div>
            <p className="text-xs text-slate-400 text-center">※ 1세대 1주택 비과세 등은 고려되지 않은 기본 계산입니다.</p>
         </div>
       )}

       {taxMode === 'holding' && (
           <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[300px]">
               <Building2 size={48} className="text-gray-300 mb-4" />
               <h3 className="font-bold text-slate-600 mb-2">보유세 계산기 준비 중</h3>
               <p className="text-sm text-slate-400 max-w-xs">재산세와 종합부동산세는 공시가격 확정 시기에 맞춰 정확한 계산을 제공할 예정입니다.</p>
           </div>
       )}
    </div>
  );
};

const LoanCalculator: React.FC = () => {
    const [income, setIncome] = useState(6000); // Man won
    const [price, setPrice] = useState(80000); // Man won
    const [interestRate, setInterestRate] = useState(4.5);
    const [term, setTerm] = useState(30);
    const [otherDebtPayment, setOtherDebtPayment] = useState(0); // Monthly

    // Limits
    const LTV_LIMIT = 70; // %
    const DSR_LIMIT = 40; // %

    const calculateLimit = () => {
        // 1. LTV Limit
        const ltvMax = price * (LTV_LIMIT / 100);

        // 2. DSR Limit
        // Annual Cap = Income * 0.4
        // Available Annual for this loan = Cap - (Other Debt Monthly * 12)
        const annualCap = income * (DSR_LIMIT / 100);
        const availableAnnual = Math.max(0, annualCap - (otherDebtPayment * 12));
        const availableMonthly = availableAnnual / 12;

        // Max Loan given availableMonthly
        // Formula: P = M * [ (1 - (1+r)^-n) / r ]
        const r = (interestRate / 100) / 12;
        const n = term * 12;
        
        let dsrMax = 0;
        if (r > 0) {
            dsrMax = availableMonthly * ( (1 - Math.pow(1+r, -n)) / r );
        } else {
            dsrMax = availableMonthly * n;
        }

        const actualLimit = Math.min(ltvMax, dsrMax);
        const limitType = actualLimit === ltvMax ? 'LTV' : 'DSR';
        
        // Monthly Payment for the Actual Limit
        const loanAmount = actualLimit;
        const monthlyPayment = loanAmount * ( r * Math.pow(1+r, n) ) / ( Math.pow(1+r, n) - 1 );

        return { ltvMax, dsrMax, actualLimit, limitType, monthlyPayment };
    };

    const result = calculateLimit();
    const data = [
        { name: '대출 가능', value: result.actualLimit, fill: '#0ea5e9' },
        { name: '자비 부담', value: price - result.actualLimit, fill: '#e2e8f0' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">연 소득 (만원)</label>
                        <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">매물 가격 (만원)</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">금리 (%)</label>
                        <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">대출 기간 (년)</label>
                        <div className="flex gap-2">
                            {[30, 40, 50].map(y => (
                                <button key={y} onClick={() => setTerm(y)} className={`flex-1 py-1 text-xs border rounded ${term === y ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-gray-200'}`}>{y}년</button>
                            ))}
                        </div>
                     </div>
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-500 mb-1 block">기타 부채 월 상환액 (만원)</label>
                     <input type="number" value={otherDebtPayment} onChange={e => setOtherDebtPayment(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-slate-800 mb-4">대출 한도 분석</h3>
                <div className="flex items-center gap-6">
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                            {Math.round((result.actualLimit / price) * 100)}%
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div>
                             <p className="text-xs text-slate-500">최대 대출 가능 금액</p>
                             <p className="text-xl font-bold text-brand-600">{formatMoney(result.actualLimit / 100)}</p>
                        </div>
                        <div>
                             <p className="text-xs text-slate-500">예상 월 상환액</p>
                             <p className="text-base font-bold text-slate-800">{formatCurrency(Math.round(result.monthlyPayment * 10000))} 원</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-slate-600">
                   <div className="flex justify-between mb-1">
                      <span>LTV 한도 (70%)</span>
                      <span className="font-bold">{formatMoney(result.ltvMax / 100)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span>DSR 한도 (40%)</span>
                      <span className={`font-bold ${result.limitType === 'DSR' ? 'text-red-500' : ''}`}>{formatMoney(result.dsrMax / 100)}</span>
                   </div>
                   {result.limitType === 'DSR' && (
                       <p className="mt-2 text-red-500 flex items-center gap-1"><Info size={12}/> DSR 규제로 인해 대출 한도가 줄어들었습니다.</p>
                   )}
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---

export const Calculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'check' | 'tax' | 'loan'>('check');

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <h1 className="text-xl font-bold text-slate-800 mb-6">부동산 계산기</h1>
      
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        {[
          { id: 'check', label: '현실 점검' },
          { id: 'tax', label: '세금 계산' },
          { id: 'loan', label: '대출 한도' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
              activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'check' && <FinancialCheck />}
      {activeTab === 'tax' && <TaxCalculator />}
      {activeTab === 'loan' && <LoanCalculator />}
    </div>
  );
};
