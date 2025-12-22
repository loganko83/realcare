/**
 * Reality Check Form Component
 * Enhanced financial feasibility calculator with proper score calculation
 */

import { useState, useEffect } from 'react';
import {
  Calculator,
  MapPin,
  Home,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  GitCompare,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { useRealityCheck } from '../../lib/hooks/useRealityCheck';
import { SEOUL_DISTRICTS, GYEONGGI_CITIES } from '../../lib/constants/regulations';
import { formatKRW } from '../../lib/utils/dsr';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from '../charts/LazyCharts';
import { ScenarioComparison } from './ScenarioComparison';
import { ShareButton } from './ShareButton';
import { parseShareFromUrl, type ShareableState } from '../../lib/utils/shareUtils';

interface RealityCheckFormProps {
  onComplete?: (result: ReturnType<typeof useRealityCheck>['data']) => void;
}

export function RealityCheckForm({ onComplete }: RealityCheckFormProps) {
  const [step, setStep] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Form state
  const [region, setRegion] = useState('gangnam');
  const [targetPrice, setTargetPrice] = useState(900); // in millions
  const [annualIncome, setAnnualIncome] = useState(80); // in millions
  const [cashAvailable, setCashAvailable] = useState(300); // in millions
  const [existingDebt, setExistingDebt] = useState(0); // in millions
  const [isFirstHome, setIsFirstHome] = useState(true);
  const [houseCount, setHouseCount] = useState(0);

  const allRegions = [...SEOUL_DISTRICTS, ...GYEONGGI_CITIES];
  const selectedRegion = allRegions.find(r => r.id === region);

  const { mutate: calculateScore, data: result, isPending: loading } = useRealityCheck();

  // Restore state from URL if shared
  useEffect(() => {
    const sharedState = parseShareFromUrl();
    if (sharedState) {
      setRegion(sharedState.region);
      setTargetPrice(sharedState.targetPrice);
      setAnnualIncome(sharedState.annualIncome);
      setCashAvailable(sharedState.cashAvailable);
      setExistingDebt(sharedState.existingDebt);
      setIsFirstHome(sharedState.isFirstHome);
      setHouseCount(sharedState.houseCount);
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Get shareable state
  const shareableState: ShareableState = {
    region,
    targetPrice,
    annualIncome,
    cashAvailable,
    existingDebt,
    isFirstHome,
    houseCount,
  };

  const handleCalculate = () => {
    calculateScore(
      {
        region,
        targetPrice: targetPrice * 1000000, // convert to won
        annualIncome: annualIncome * 1000000,
        cashAvailable: cashAvailable * 1000000,
        existingDebt: existingDebt * 1000000,
        isFirstHome,
        houseCount,
      },
      {
        onSuccess: (data) => {
          setShowResult(true);
          onComplete?.(data);
        },
      }
    );
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10b981';
      case 'B': return '#22c55e';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
      default: return <CheckCircle size={16} className="text-green-500" />;
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;

    setDownloadingPdf(true);
    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const { addPdfHeader, addPdfFooter, addSectionHeader, addTextContent, addScoreDisplay, PDF_DIMENSIONS } =
        await import('../../lib/utils/pdfBranding');

      const { margin } = PDF_DIMENSIONS;

      // Add branded header
      let y = addPdfHeader(pdf, {
        title: 'Reality Check Report',
        subtitle: `${selectedRegion?.name || region} - ${new Intl.NumberFormat('ko-KR').format(targetPrice)}M KRW`,
        reportType: 'reality',
        date: new Date(),
      });

      // Score display
      y = addScoreDisplay(pdf, result.score, `Grade ${result.grade}`, y);

      // Score breakdown
      y = addSectionHeader(pdf, 'Score Breakdown', y, 'primary');
      y += 2;

      const breakdowns = [
        { label: 'LTV Score', value: `${result.breakdown.ltvScore}/25` },
        { label: 'DSR Score', value: `${result.breakdown.dsrScore}/25` },
        { label: 'Cash Gap Score', value: `${result.breakdown.cashGapScore}/25` },
        { label: 'Stability Score', value: `${result.breakdown.stabilityScore}/25` },
      ];

      breakdowns.forEach((item, idx) => {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(item.label, margin.left + (idx % 2) * 85, y);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, margin.left + (idx % 2) * 85 + 35, y);
        pdf.setFont('helvetica', 'normal');
        if (idx % 2 === 1) y += 7;
      });
      y += 10;

      // Financial analysis
      y = addSectionHeader(pdf, 'Financial Analysis', y, 'primary');
      y += 2;

      const financialData = [
        { label: 'Target Property', value: new Intl.NumberFormat('ko-KR').format(result.analysis.targetPrice) + ' KRW' },
        { label: 'Max Loan (LTV)', value: new Intl.NumberFormat('ko-KR').format(result.analysis.maxLoanByLTV) + ' KRW' },
        { label: 'Max Loan (DSR Limited)', value: new Intl.NumberFormat('ko-KR').format(result.analysis.maxLoanByDSR) + ' KRW' },
        { label: 'Actual Max Loan', value: new Intl.NumberFormat('ko-KR').format(result.analysis.maxLoanAmount) + ' KRW' },
        { label: 'Required Cash', value: new Intl.NumberFormat('ko-KR').format(result.analysis.requiredCash) + ' KRW' },
        { label: 'Monthly Payment', value: new Intl.NumberFormat('ko-KR').format(result.analysis.monthlyRepayment) + ' KRW' },
        { label: 'DSR Ratio', value: result.analysis.dsrPercentage.toFixed(1) + '%' },
      ];

      financialData.forEach(item => {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(item.label, margin.left, y);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value, margin.left + 100, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        y += 6;
      });
      y += 8;

      // Risks
      if (result.risks.length > 0) {
        y = addSectionHeader(pdf, `Risk Factors (${result.risks.length})`, y, 'warning');
        y += 3;

        result.risks.slice(0, 4).forEach((risk, idx) => {
          const riskColor: [number, number, number] =
            risk.type === 'critical' ? [239, 68, 68] :
            risk.type === 'warning' ? [245, 158, 11] :
            [59, 130, 246];

          pdf.setFontSize(9);
          pdf.setTextColor(...riskColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${idx + 1}. ${risk.title}`, margin.left, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(71, 85, 105);
          y += 5;
          const lines = pdf.splitTextToSize(risk.message, 160);
          pdf.text(lines.slice(0, 2), margin.left + 5, y);
          y += lines.slice(0, 2).length * 4 + 4;
        });
      }

      // Add branded footer
      addPdfFooter(pdf);

      pdf.save(`realcare-reality-check-${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (showResult && result) {
    // Show scenario comparison view
    if (showComparison) {
      return (
        <div className="space-y-4 animate-fade-in">
          <button
            onClick={() => setShowComparison(false)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Results
          </button>
          <ScenarioComparison
            baseInput={{
              region,
              targetPrice: targetPrice * 1000000,
              annualIncome: annualIncome * 1000000,
              cashAvailable: cashAvailable * 1000000,
              existingDebt: existingDebt * 1000000,
              isFirstHome,
              houseCount,
            }}
          />
        </div>
      );
    }

    const chartData = [{
      name: 'Score',
      value: result.score,
      fill: getGradeColor(result.grade),
    }];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Score Display */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800">Reality Check Result</h2>
            <div className="flex items-center gap-2">
              <ShareButton state={shareableState} score={result.score} />
              <span
                className="text-2xl font-bold px-3 py-1 rounded-lg"
                style={{ color: getGradeColor(result.grade), backgroundColor: `${getGradeColor(result.grade)}15` }}
              >
                Grade {result.grade}
              </span>
            </div>
          </div>

          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                barSize={20}
                data={chartData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
              <span className="text-4xl font-bold text-slate-800">{result.score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">LTV Score</p>
              <p className="text-lg font-bold text-slate-800">{result.breakdown.ltvScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">DSR Score</p>
              <p className="text-lg font-bold text-slate-800">{result.breakdown.dsrScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Cash Gap</p>
              <p className="text-lg font-bold text-slate-800">{result.breakdown.cashGapScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Stability</p>
              <p className="text-lg font-bold text-slate-800">{result.breakdown.stabilityScore}/25</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-slate-800 text-white p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Financial Analysis</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Target Property</span>
              <span className="font-bold">{formatKRW(result.analysis.targetPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Loan (LTV {result.analysis.applicableLTV}%)</span>
              <span className="font-bold">{formatKRW(result.analysis.maxLoanByLTV)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Loan (DSR Limited)</span>
              <span className="font-bold">{formatKRW(result.analysis.maxLoanByDSR)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-600 pt-3">
              <span className="text-slate-300">Actual Max Loan</span>
              <span className="font-bold text-brand-400">{formatKRW(result.analysis.maxLoanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Required Cash</span>
              <span className="font-bold">{formatKRW(result.analysis.requiredCash)}</span>
            </div>
            {result.analysis.gapAmount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Cash Shortage</span>
                <span className="font-bold">{formatKRW(result.analysis.gapAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-600 pt-3">
              <span className="text-slate-300">Monthly Payment</span>
              <span className="font-bold">{formatKRW(result.analysis.monthlyRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">DSR Ratio</span>
              <span className={`font-bold ${result.analysis.dsrPercentage > 40 ? 'text-red-400' : 'text-green-400'}`}>
                {result.analysis.dsrPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Risks */}
        {result.risks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800">Risk Factors</h3>
            {result.risks.map((risk, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-l-4 ${
                  risk.type === 'critical' ? 'bg-red-50 border-red-500' :
                  risk.type === 'warning' ? 'bg-orange-50 border-orange-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getRiskIcon(risk.type)}
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{risk.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{risk.message}</p>
                    {risk.suggestion && (
                      <p className="text-sm text-brand-600 mt-2">Tip: {risk.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Region Info */}
        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
          <h3 className="font-bold text-brand-800 mb-2 flex items-center gap-2">
            <MapPin size={18} /> Region: {selectedRegion?.name}
          </h3>
          <div className="text-sm text-brand-700 space-y-1">
            {result.region.isSpeculativeZone && (
              <p>Speculative Overheated Zone - LTV limit: {result.region.maxLTV}%</p>
            )}
            {result.region.isAdjustedZone && !result.region.isSpeculativeZone && (
              <p>Adjusted Zone - LTV limit: {result.region.maxLTV}%</p>
            )}
            {!result.region.isSpeculativeZone && !result.region.isAdjustedZone && (
              <p>Non-Regulated Zone - LTV limit: {result.region.maxLTV}%</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setShowResult(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
            >
              Calculate Again
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition flex items-center justify-center gap-2"
            >
              <GitCompare size={18} />
              Compare Scenarios
            </button>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {downloadingPdf ? 'Generating PDF...' : 'Download Report (PDF)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition ${
              s <= step ? 'bg-brand-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4 text-slate-800 flex items-center gap-2">
              <MapPin size={20} className="text-brand-600" />
              Target Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Select Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <optgroup label="Seoul">
                    {SEOUL_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Gyeonggi">
                    {GYEONGGI_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedRegion && (
                <div className={`p-3 rounded-lg text-sm ${
                  selectedRegion.isSpeculativeZone ? 'bg-red-50 text-red-700' :
                  selectedRegion.isAdjustedZone ? 'bg-orange-50 text-orange-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {selectedRegion.isSpeculativeZone && 'Speculative Overheated Zone (Strict regulation)'}
                  {selectedRegion.isAdjustedZone && !selectedRegion.isSpeculativeZone && 'Adjusted Zone (Moderate regulation)'}
                  {!selectedRegion.isSpeculativeZone && !selectedRegion.isAdjustedZone && 'Non-Regulated Zone (Relaxed)'}
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Target Property Price</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(targetPrice * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-900 transition"
          >
            Next: Income Info
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4 text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-600" />
              Income & Debt
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Annual Income</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(annualIncome * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="5"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Available Cash</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(cashAvailable * 1000000)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={cashAvailable}
                  onChange={(e) => setCashAvailable(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Existing Debt (Monthly Payment)</label>
                  <span className="text-sm font-bold text-brand-600">{formatKRW(existingDebt * 1000000)}/month</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={existingDebt}
                  onChange={(e) => setExistingDebt(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-900 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-4 text-slate-800 flex items-center gap-2">
              <Home size={20} className="text-brand-600" />
              Ownership Status
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Current Home Ownership</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setHouseCount(n);
                        setIsFirstHome(n === 0);
                      }}
                      className={`flex-1 py-3 rounded-lg border text-sm font-bold transition ${
                        houseCount === n
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-slate-500 hover:bg-gray-50'
                      }`}
                    >
                      {n === 0 ? 'None' : n === 3 ? '3+' : `${n}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="firstHome"
                  checked={isFirstHome}
                  onChange={(e) => setIsFirstHome(e.target.checked)}
                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="firstHome" className="text-sm font-medium text-slate-700">
                  First-time home buyer (eligible for benefits)
                </label>
              </div>
            </div>
          </div>

          {/* Summary before calculation */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-medium text-slate-700 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">{selectedRegion?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Price</span>
                <span className="font-medium text-slate-800">{formatKRW(targetPrice * 1000000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Income</span>
                <span className="font-medium text-slate-800">{formatKRW(annualIncome * 1000000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Cash</span>
                <span className="font-medium text-slate-800">{formatKRW(cashAvailable * 1000000)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Calculator size={20} />}
              {loading ? 'Calculating...' : 'Check Reality Score'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
