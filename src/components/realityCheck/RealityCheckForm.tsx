/**
 * Reality Check Form Component
 * Enhanced financial feasibility calculator with proper score calculation
 */

import { useState, useEffect } from 'react';
import {
  Calculator,
  MapPin,
  Home,
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
import { Button, Card, ProgressBar, SectionHeader, FormSelect, Badge, SelectButton } from '../common';

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
        propertyPrice: targetPrice * 1000000, // convert to won
        regionCode: region,
        areaSquareMeters: 85, // default apartment size
        annualIncome: annualIncome * 1000000,
        cashAssets: cashAvailable * 1000000,
        monthlyDebtPayment: existingDebt * 1000000,
        isFirstHome,
        houseCount,
        loanTermYears: 30, // default 30 year loan
        interestRate: 4.5, // default interest rate
      },
      {
        onSuccess: (data) => {
          setShowResult(true);
          onComplete?.(data);
        },
      }
    );
  };

  // Extract score result for easier access
  const scoreResult = result?.score;

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
    if (!scoreResult) return;

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
      y = addScoreDisplay(pdf, scoreResult.score, `Grade ${scoreResult.grade}`, y);

      // Score breakdown
      y = addSectionHeader(pdf, 'Score Breakdown', y, 'primary');
      y += 2;

      const breakdowns = [
        { label: 'LTV Score', value: `${scoreResult.breakdown.ltvScore}/25` },
        { label: 'DSR Score', value: `${scoreResult.breakdown.dsrScore}/25` },
        { label: 'Cash Gap Score', value: `${scoreResult.breakdown.cashGapScore}/25` },
        { label: 'Stability Score', value: `${scoreResult.breakdown.stabilityScore}/25` },
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
        { label: 'Target Property', value: new Intl.NumberFormat('ko-KR').format(targetPrice * 1000000) + ' KRW' },
        { label: 'Max Loan (LTV)', value: new Intl.NumberFormat('ko-KR').format(scoreResult.analysis.maxLoanByLTV) + ' KRW' },
        { label: 'Max Loan (DSR Limited)', value: new Intl.NumberFormat('ko-KR').format(scoreResult.analysis.maxLoanByDSR) + ' KRW' },
        { label: 'Actual Max Loan', value: new Intl.NumberFormat('ko-KR').format(scoreResult.analysis.maxLoanAmount) + ' KRW' },
        { label: 'Required Cash', value: new Intl.NumberFormat('ko-KR').format(scoreResult.analysis.requiredCash) + ' KRW' },
        { label: 'Monthly Payment', value: new Intl.NumberFormat('ko-KR').format(scoreResult.analysis.monthlyRepayment) + ' KRW' },
        { label: 'DSR Ratio', value: scoreResult.analysis.dsrPercentage.toFixed(1) + '%' },
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
      if (scoreResult.risks.length > 0) {
        y = addSectionHeader(pdf, `Risk Factors (${scoreResult.risks.length})`, y, 'warning');
        y += 3;

        scoreResult.risks.slice(0, 4).forEach((risk, idx) => {
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

  if (showResult && scoreResult) {
    // Show scenario comparison view
    if (showComparison) {
      return (
        <div className="space-y-4 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => setShowComparison(false)} icon={<ArrowLeft size={16} />}>
            Back to Results
          </Button>
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
      value: scoreResult.score,
      fill: getGradeColor(scoreResult.grade),
    }];

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Score Display */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800">Reality Check Result</h2>
            <div className="flex items-center gap-2">
              <ShareButton state={shareableState} score={scoreResult.score} />
              <span
                className="text-2xl font-bold px-3 py-1 rounded-lg"
                style={{ color: getGradeColor(scoreResult.grade), backgroundColor: `${getGradeColor(scoreResult.grade)}15` }}
              >
                Grade {scoreResult.grade}
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
              <span className="text-4xl font-bold text-slate-800">{scoreResult.score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">LTV Score</p>
              <p className="text-lg font-bold text-slate-800">{scoreResult.breakdown.ltvScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">DSR Score</p>
              <p className="text-lg font-bold text-slate-800">{scoreResult.breakdown.dsrScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Cash Gap</p>
              <p className="text-lg font-bold text-slate-800">{scoreResult.breakdown.cashGapScore}/25</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Stability</p>
              <p className="text-lg font-bold text-slate-800">{scoreResult.breakdown.stabilityScore}/25</p>
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <Card className="bg-slate-800 text-white">
          <h3 className="font-bold mb-4">Financial Analysis</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Target Property</span>
              <span className="font-bold">{formatKRW(targetPrice * 1000000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Loan (LTV {scoreResult.analysis.applicableLTV}%)</span>
              <span className="font-bold">{formatKRW(scoreResult.analysis.maxLoanByLTV)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Max Loan (DSR Limited)</span>
              <span className="font-bold">{formatKRW(scoreResult.analysis.maxLoanByDSR)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-600 pt-3">
              <span className="text-slate-300">Actual Max Loan</span>
              <span className="font-bold text-brand-400">{formatKRW(scoreResult.analysis.maxLoanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Required Cash</span>
              <span className="font-bold">{formatKRW(scoreResult.analysis.requiredCash)}</span>
            </div>
            {scoreResult.analysis.gapAmount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Cash Shortage</span>
                <span className="font-bold">{formatKRW(scoreResult.analysis.gapAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-600 pt-3">
              <span className="text-slate-300">Monthly Payment</span>
              <span className="font-bold">{formatKRW(scoreResult.analysis.monthlyRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">DSR Ratio</span>
              <span className={`font-bold ${scoreResult.analysis.dsrPercentage > 40 ? 'text-red-400' : 'text-green-400'}`}>
                {scoreResult.analysis.dsrPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Risks */}
        {scoreResult.risks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800">Risk Factors</h3>
            {scoreResult.risks.map((risk, idx) => (
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
        <Card variant="flat" className="bg-brand-50 border-brand-100">
          <h3 className="font-bold text-brand-800 mb-2 flex items-center gap-2">
            <MapPin size={18} /> Region: {selectedRegion?.name}
          </h3>
          <div className="text-sm text-brand-700 space-y-1">
            {scoreResult.region.isSpeculativeZone && (
              <p>Speculative Overheated Zone - LTV limit: {scoreResult.analysis.applicableLTV}%</p>
            )}
            {scoreResult.region.isAdjustedZone && !scoreResult.region.isSpeculativeZone && (
              <p>Adjusted Zone - LTV limit: {scoreResult.analysis.applicableLTV}%</p>
            )}
            {!scoreResult.region.isSpeculativeZone && !scoreResult.region.isAdjustedZone && (
              <p>Non-Regulated Zone - LTV limit: {scoreResult.analysis.applicableLTV}%</p>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowResult(false)}>
              Calculate Again
            </Button>
            <Button variant="primary" fullWidth onClick={() => setShowComparison(true)} icon={<GitCompare size={18} />}>
              Compare Scenarios
            </Button>
          </div>
          <Button
            variant="outline"
            fullWidth
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            icon={downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          >
            {downloadingPdf ? 'Generating PDF...' : 'Download Report (PDF)'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ProgressBar current={step} total={3} className="mb-6" />

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={MapPin} title="Target Location" className="mb-4" />

            <div className="space-y-4">
              <FormSelect
                label="Select Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                options={[
                  { label: 'Seoul', options: SEOUL_DISTRICTS.map(d => ({ value: d.id, label: d.name })) },
                  { label: 'Gyeonggi', options: GYEONGGI_CITIES.map(c => ({ value: c.id, label: c.name })) },
                ]}
              />

              {selectedRegion && (
                <Badge
                  variant={
                    selectedRegion.isSpeculativeZone ? 'error' :
                    selectedRegion.isAdjustedZone ? 'warning' : 'success'
                  }
                  className="w-full justify-center py-2"
                >
                  {selectedRegion.isSpeculativeZone && 'Speculative Overheated Zone (Strict regulation)'}
                  {selectedRegion.isAdjustedZone && !selectedRegion.isSpeculativeZone && 'Adjusted Zone (Moderate regulation)'}
                  {!selectedRegion.isSpeculativeZone && !selectedRegion.isAdjustedZone && 'Non-Regulated Zone (Relaxed)'}
                </Badge>
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
          </Card>

          <Button variant="dark" size="lg" fullWidth onClick={() => setStep(2)}>
            Next: Income Info
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={TrendingUp} title="Income & Debt" className="mb-4" />

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
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="dark" fullWidth onClick={() => setStep(3)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <SectionHeader icon={Home} title="Ownership Status" className="mb-4" />

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Current Home Ownership</label>
                <SelectButton
                  options={[
                    { id: '0', label: 'None' },
                    { id: '1', label: '1' },
                    { id: '2', label: '2' },
                    { id: '3', label: '3+' },
                  ]}
                  value={String(houseCount)}
                  onChange={(val) => {
                    const n = Number(val);
                    setHouseCount(n);
                    setIsFirstHome(n === 0);
                  }}
                  variant="toggle"
                  columns={4}
                />
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
          </Card>

          {/* Summary before calculation */}
          <Card variant="flat" className="bg-gray-50">
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
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="dark"
              fullWidth
              onClick={handleCalculate}
              disabled={loading}
              icon={loading ? <Loader2 className="animate-spin" size={20} /> : <Calculator size={20} />}
            >
              {loading ? 'Calculating...' : 'Check Reality Score'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
