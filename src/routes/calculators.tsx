import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useFinancialAdvice } from '../lib/hooks/useFinancialAdvice';
import { Loader2, Calculator, Building2, Landmark, Coins, Info, Target } from 'lucide-react';
import { RealityCheckForm } from '../components/realityCheck/RealityCheckForm';

export const Route = createFileRoute('/calculators')({
  component: CalculatorsPage,
});

const formatMoney = (amount: number) => {
  if (amount >= 100) {
    const eok = Math.floor(amount / 100);
    const man = Math.round(amount % 100);
    return `${eok}B ${man > 0 ? man + 'M' : ''} KRW`;
  }
  return `${Math.round(amount)}M KRW`;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ko-KR').format(val);
};

// --- Sub-components ---

function TaxCalculator() {
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
    let rate = 1.1;
    if (houseCount === 1) {
        if (acqPrice <= 600) rate = 1.1;
        else if (acqPrice <= 900) rate = 2.2;
        else rate = 3.5;
    } else if (houseCount === 2) {
        rate = 8.4;
    } else {
        rate = 12.4;
    }
    if (areaOver85 && houseCount === 1 && acqPrice > 600) rate += 0.2;

    const taxAmount = acqPrice * 1000000 * (rate / 100);
    return { rate, amount: taxAmount };
  };

  const calculateTransferTax = () => {
    const profit = (sellPrice - buyPrice) * 1000000;
    if (profit <= 0) return { profit: 0, amount: 0, rate: 0 };

    const basicDeduction = 2500000;
    const longTermRate = Math.min(years * 2, 30);
    const longTermDeduction = years >= 3 ? profit * (longTermRate / 100) : 0;

    const taxBase = profit - basicDeduction - longTermDeduction;
    if (taxBase <= 0) return { profit, amount: 0, rate: 0 };

    let tax = 0;
    let bracketRate = 0;
    if (taxBase <= 14000000) { tax = taxBase * 0.06; bracketRate = 6; }
    else if (taxBase <= 50000000) { tax = taxBase * 0.15 - 1260000; bracketRate = 15; }
    else if (taxBase <= 88000000) { tax = taxBase * 0.24 - 5760000; bracketRate = 24; }
    else if (taxBase <= 150000000) { tax = taxBase * 0.35 - 15440000; bracketRate = 35; }
    else if (taxBase <= 300000000) { tax = taxBase * 0.38 - 19940000; bracketRate = 38; }
    else if (taxBase <= 500000000) { tax = taxBase * 0.40 - 25940000; bracketRate = 40; }
    else { tax = taxBase * 0.42 - 35940000; bracketRate = 42; }

    tax *= 1.1;

    if (years < 1) { tax = profit * 0.77; bracketRate = 70; }
    else if (years < 2) { tax = profit * 0.66; bracketRate = 60; }

    return { profit, amount: tax, rate: bracketRate };
  };

  const acqResult = calculateAcqTax();
  const transferResult = calculateTransferTax();

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setTaxMode('acquisition')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'acquisition' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Acquisition</button>
          <button onClick={() => setTaxMode('transfer')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'transfer' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Transfer</button>
          <button onClick={() => setTaxMode('holding')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${taxMode === 'holding' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Holding</button>
       </div>

       {taxMode === 'acquisition' && (
         <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">Acquisition Price</label>
                   <div className="flex items-center gap-2">
                     <input type="number" value={acqPrice} onChange={e => setAcqPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg font-bold text-slate-700" />
                     <span className="shrink-0 text-sm font-bold text-slate-600">M KRW</span>
                   </div>
                   <p className="text-xs text-brand-600 mt-1">{formatMoney(acqPrice)}</p>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">Houses Owned</label>
                   <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => setHouseCount(n)} className={`flex-1 py-2 rounded-lg border text-sm font-bold ${houseCount === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-slate-500'}`}>
                           {n === 3 ? '3+' : `${n}`}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <input type="checkbox" id="area85" checked={areaOver85} onChange={e => setAreaOver85(e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"/>
                   <label htmlFor="area85" className="text-sm text-slate-700">Area over 85sqm (Rural Special Tax)</label>
                </div>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><Coins size={80} /></div>
                <p className="text-slate-300 text-sm mb-1">Estimated Acquisition Tax (incl. local)</p>
                <h3 className="text-3xl font-bold mb-2">{formatCurrency(Math.floor(acqResult.amount / 10000) * 10000)} KRW</h3>
                <div className="inline-block bg-white/20 px-2 py-1 rounded text-xs">
                    Estimated rate: ~{acqResult.rate.toFixed(2)}%
                </div>
            </div>
            <p className="text-xs text-slate-400 text-center">* Actual amount may vary based on exemptions.</p>
         </div>
       )}

       {taxMode === 'transfer' && (
         <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Purchase Price (M)</label>
                        <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Sale Price (M)</label>
                        <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Holding Period (years)</label>
                    <input type="range" min="0" max="10" step="1" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full accent-brand-600" />
                    <div className="text-right text-sm font-bold text-brand-600">{years} years {years === 10 ? '+' : ''}</div>
                </div>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><Landmark size={80} /></div>
                <div className="flex justify-between items-end mb-4 border-b border-white/20 pb-4">
                    <div>
                       <p className="text-slate-300 text-xs">Capital Gain</p>
                       <p className="font-bold text-lg">{(sellPrice - buyPrice) > 0 ? formatMoney(sellPrice - buyPrice) : '0'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-300 text-xs">Tax Bracket</p>
                       <p className="font-bold text-lg">{transferResult.rate}%</p>
                    </div>
                </div>
                <p className="text-slate-300 text-sm mb-1">Estimated Transfer Tax (incl. local)</p>
                <h3 className="text-3xl font-bold">{formatCurrency(Math.floor(transferResult.amount / 10000) * 10000)} KRW</h3>
            </div>
            <p className="text-xs text-slate-400 text-center">* 1-house exemption not considered in basic calculation.</p>
         </div>
       )}

       {taxMode === 'holding' && (
           <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[300px]">
               <Building2 size={48} className="text-gray-300 mb-4" />
               <h3 className="font-bold text-slate-600 mb-2">Holding Tax Calculator Coming Soon</h3>
               <p className="text-sm text-slate-400 max-w-xs">Property tax and comprehensive real estate tax will be available after public price announcement.</p>
           </div>
       )}
    </div>
  );
}

function LoanCalculator() {
    const [income, setIncome] = useState(6000); // Man won
    const [price, setPrice] = useState(80000); // Man won
    const [interestRate, setInterestRate] = useState(4.5);
    const [term, setTerm] = useState(30);
    const [otherDebtPayment, setOtherDebtPayment] = useState(0);

    const LTV_LIMIT = 70;
    const DSR_LIMIT = 40;

    const calculateLimit = () => {
        const ltvMax = price * (LTV_LIMIT / 100);

        const annualCap = income * (DSR_LIMIT / 100);
        const availableAnnual = Math.max(0, annualCap - (otherDebtPayment * 12));
        const availableMonthly = availableAnnual / 12;

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

        const loanAmount = actualLimit;
        const monthlyPayment = loanAmount * ( r * Math.pow(1+r, n) ) / ( Math.pow(1+r, n) - 1 );

        return { ltvMax, dsrMax, actualLimit, limitType, monthlyPayment };
    };

    const result = calculateLimit();
    const data = [
        { name: 'Loan Available', value: result.actualLimit, fill: '#0ea5e9' },
        { name: 'Self Funding', value: price - result.actualLimit, fill: '#e2e8f0' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Annual Income (10K KRW)</label>
                        <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Property Price (10K KRW)</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Interest Rate (%)</label>
                        <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Loan Term (years)</label>
                        <div className="flex gap-2">
                            {[30, 40, 50].map(y => (
                                <button key={y} onClick={() => setTerm(y)} className={`flex-1 py-1 text-xs border rounded ${term === y ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-gray-200'}`}>{y}y</button>
                            ))}
                        </div>
                     </div>
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-500 mb-1 block">Other Debt Monthly Payment (10K KRW)</label>
                     <input type="number" value={otherDebtPayment} onChange={e => setOtherDebtPayment(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-slate-800 mb-4">Loan Limit Analysis</h3>
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
                             <p className="text-xs text-slate-500">Max Loan Amount</p>
                             <p className="text-xl font-bold text-brand-600">{formatMoney(result.actualLimit / 100)}</p>
                        </div>
                        <div>
                             <p className="text-xs text-slate-500">Est. Monthly Payment</p>
                             <p className="text-base font-bold text-slate-800">{formatCurrency(Math.round(result.monthlyPayment * 10000))} KRW</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-slate-600">
                   <div className="flex justify-between mb-1">
                      <span>LTV Limit (70%)</span>
                      <span className="font-bold">{formatMoney(result.ltvMax / 100)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span>DSR Limit (40%)</span>
                      <span className={`font-bold ${result.limitType === 'DSR' ? 'text-red-500' : ''}`}>{formatMoney(result.dsrMax / 100)}</span>
                   </div>
                   {result.limitType === 'DSR' && (
                       <p className="mt-2 text-red-500 flex items-center gap-1"><Info size={12}/> DSR regulation reduced your loan limit.</p>
                   )}
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---

function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'reality' | 'tax' | 'loan'>('reality');

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Real Estate Calculators</h1>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        {[
          { id: 'reality', label: 'Reality Check', icon: Target },
          { id: 'tax', label: 'Tax Calc', icon: Coins },
          { id: 'loan', label: 'Loan Limit', icon: Landmark },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'reality' | 'tax' | 'loan')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reality' && <RealityCheckForm />}
      {activeTab === 'tax' && <TaxCalculator />}
      {activeTab === 'loan' && <LoanCalculator />}
    </div>
  );
}
