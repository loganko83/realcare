/**
 * Scenario Comparison Component
 * Compare "Buy Now" vs "Buy Later" scenarios
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
  ArrowRight,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { calculateRealityScore, type RealityScoreResult, type RealityScoreInput } from '../../lib/utils/realityScore';
import { formatKRW } from '../../lib/utils/dsr';
import type { RegionRegulation } from '../../lib/constants/regulations';

interface ScenarioComparisonProps {
  baseInput: {
    region: string;
    targetPrice: number;
    annualIncome: number;
    cashAvailable: number;
    existingDebt: number;
    isFirstHome: boolean;
    houseCount: number;
  };
  onShare?: () => void;
}

interface ScenarioSettings {
  waitYears: number;
  priceAppreciation: number; // Annual % increase
  incomeGrowth: number; // Annual % increase
  savingsRate: number; // % of income saved
  interestRateChange: number; // Change in mortgage rate
}

export function ScenarioComparison({ baseInput, onShare }: ScenarioComparisonProps) {
  const [settings, setSettings] = useState<ScenarioSettings>({
    waitYears: 1,
    priceAppreciation: 3, // 3% annual price increase
    incomeGrowth: 3, // 3% annual income growth
    savingsRate: 20, // Save 20% of income
    interestRateChange: 0, // No change in interest rate
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate both scenarios
  const scenarios = useMemo(() => {
    const baseInterestRate = 4.5;
    const baseLoanTerm = 30;

    // Current scenario (Buy Now)
    const nowInput: RealityScoreInput = {
      propertyPrice: baseInput.targetPrice,
      userFinancials: {
        annualIncome: baseInput.annualIncome,
        totalAssets: baseInput.cashAvailable,
        cashAssets: baseInput.cashAvailable,
        totalDebt: 0,
        monthlyDebtPayment: baseInput.existingDebt,
        houseCount: baseInput.houseCount,
        isFirstHome: baseInput.isFirstHome,
      },
      regionCode: baseInput.region,
      loanTermYears: baseLoanTerm,
      interestRate: baseInterestRate,
    };

    const nowResult = calculateRealityScore(nowInput);

    // Future scenario (Buy Later)
    const yearsToWait = settings.waitYears;
    const futurePrice = baseInput.targetPrice * Math.pow(1 + settings.priceAppreciation / 100, yearsToWait);
    const futureIncome = baseInput.annualIncome * Math.pow(1 + settings.incomeGrowth / 100, yearsToWait);
    const additionalSavings = baseInput.annualIncome * (settings.savingsRate / 100) * yearsToWait;
    const futureCash = baseInput.cashAvailable + additionalSavings;
    const futureRate = baseInterestRate + settings.interestRateChange;

    const laterInput: RealityScoreInput = {
      propertyPrice: futurePrice,
      userFinancials: {
        annualIncome: futureIncome,
        totalAssets: futureCash,
        cashAssets: futureCash,
        totalDebt: 0,
        monthlyDebtPayment: baseInput.existingDebt,
        houseCount: baseInput.houseCount,
        isFirstHome: baseInput.isFirstHome,
      },
      regionCode: baseInput.region,
      loanTermYears: baseLoanTerm,
      interestRate: futureRate,
    };

    const laterResult = calculateRealityScore(laterInput);

    return {
      now: {
        result: nowResult,
        price: baseInput.targetPrice,
        cash: baseInput.cashAvailable,
        income: baseInput.annualIncome,
        rate: baseInterestRate,
      },
      later: {
        result: laterResult,
        price: futurePrice,
        cash: futureCash,
        income: futureIncome,
        rate: futureRate,
        additionalSavings,
      },
    };
  }, [baseInput, settings]);

  const scoreDiff = scenarios.later.result.score - scenarios.now.result.score;
  const recommendation = scoreDiff > 5 ? 'wait' : scoreDiff < -5 ? 'now' : 'similar';

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBg = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-lime-100 text-lime-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Scenario Comparison</h2>
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
          >
            <Share2 size={16} />
            Share
          </button>
        )}
      </div>

      {/* Scenario Settings */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            <Calendar size={18} />
            Wait Period
          </h3>
          <div className="flex gap-2">
            {[1, 2, 3, 5].map((year) => (
              <button
                key={year}
                onClick={() => setSettings({ ...settings, waitYears: year })}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  settings.waitYears === year
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {year}Y
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-brand-600 hover:underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced settings
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
            {/* Price Appreciation */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-600">Price Appreciation (Annual)</label>
                <span className="text-sm font-medium text-slate-800">{settings.priceAppreciation}%</span>
              </div>
              <input
                type="range"
                min="-5"
                max="15"
                step="0.5"
                value={settings.priceAppreciation}
                onChange={(e) => setSettings({ ...settings, priceAppreciation: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            {/* Income Growth */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-600">Income Growth (Annual)</label>
                <span className="text-sm font-medium text-slate-800">{settings.incomeGrowth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={settings.incomeGrowth}
                onChange={(e) => setSettings({ ...settings, incomeGrowth: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            {/* Savings Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-600">Savings Rate</label>
                <span className="text-sm font-medium text-slate-800">{settings.savingsRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.savingsRate}
                onChange={(e) => setSettings({ ...settings, savingsRate: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            {/* Interest Rate Change */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-slate-600">Interest Rate Change</label>
                <span className="text-sm font-medium text-slate-800">
                  {settings.interestRateChange > 0 ? '+' : ''}{settings.interestRateChange}%p
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="3"
                step="0.25"
                value={settings.interestRateChange}
                onChange={(e) => setSettings({ ...settings, interestRateChange: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>

            <button
              onClick={() => setSettings({
                waitYears: 1,
                priceAppreciation: 3,
                incomeGrowth: 3,
                savingsRate: 20,
                interestRateChange: 0,
              })}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Buy Now */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">Buy Now</p>
            <p className={`text-3xl font-bold ${getScoreColor(scenarios.now.result.score)}`}>
              {scenarios.now.result.score}
            </p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeBg(scenarios.now.result.grade)}`}>
              {scenarios.now.result.grade}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Price</span>
              <span className="font-medium">{formatKRW(scenarios.now.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash</span>
              <span className="font-medium">{formatKRW(scenarios.now.cash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Max Loan</span>
              <span className="font-medium">{formatKRW(scenarios.now.result.analysis.maxLoanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gap</span>
              <span className={`font-medium ${scenarios.now.result.analysis.gapAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {scenarios.now.result.analysis.gapAmount > 0 ? formatKRW(scenarios.now.result.analysis.gapAmount) : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DSR</span>
              <span className="font-medium">{scenarios.now.result.analysis.dsrPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Buy Later */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 relative">
          <div className="absolute -top-2 -right-2 bg-brand-600 text-white text-xs px-2 py-1 rounded-full">
            +{settings.waitYears}Y
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">Buy in {settings.waitYears} Year{settings.waitYears > 1 ? 's' : ''}</p>
            <p className={`text-3xl font-bold ${getScoreColor(scenarios.later.result.score)}`}>
              {scenarios.later.result.score}
            </p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeBg(scenarios.later.result.grade)}`}>
              {scenarios.later.result.grade}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Price</span>
              <span className="font-medium flex items-center gap-1">
                {formatKRW(scenarios.later.price)}
                <TrendingUp size={12} className="text-red-500" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash</span>
              <span className="font-medium flex items-center gap-1">
                {formatKRW(scenarios.later.cash)}
                <TrendingUp size={12} className="text-green-500" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Max Loan</span>
              <span className="font-medium">{formatKRW(scenarios.later.result.analysis.maxLoanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gap</span>
              <span className={`font-medium ${scenarios.later.result.analysis.gapAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {scenarios.later.result.analysis.gapAmount > 0 ? formatKRW(scenarios.later.result.analysis.gapAmount) : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DSR</span>
              <span className="font-medium">{scenarios.later.result.analysis.dsrPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      <div className={`p-4 rounded-2xl ${
        recommendation === 'wait' ? 'bg-green-50 border border-green-200' :
        recommendation === 'now' ? 'bg-blue-50 border border-blue-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-800">Analysis</h3>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {scoreDiff > 0 ? <TrendingUp size={16} /> : scoreDiff < 0 ? <TrendingDown size={16} /> : null}
            {scoreDiff > 0 ? '+' : ''}{scoreDiff} points
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {recommendation === 'wait' && (
            <>
              Waiting {settings.waitYears} year{settings.waitYears > 1 ? 's' : ''} improves your score by {scoreDiff} points.
              You will save an additional <span className="font-bold">{formatKRW(scenarios.later.additionalSavings)}</span>,
              improving your financial position despite the expected price increase.
            </>
          )}
          {recommendation === 'now' && (
            <>
              Buying now is recommended. Waiting {settings.waitYears} year{settings.waitYears > 1 ? 's' : ''} would
              reduce your score by {Math.abs(scoreDiff)} points due to price appreciation outpacing your savings.
            </>
          )}
          {recommendation === 'similar' && (
            <>
              Both options are similar. The score difference is minimal ({Math.abs(scoreDiff)} points).
              Consider other factors like lifestyle needs and market conditions.
            </>
          )}
        </p>

        {/* Key Changes */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/50 p-2 rounded-lg">
            <p className="text-slate-500">Price Change</p>
            <p className={`font-bold ${scenarios.later.price > scenarios.now.price ? 'text-red-600' : 'text-green-600'}`}>
              {scenarios.later.price > scenarios.now.price ? '+' : '-'}
              {formatKRW(Math.abs(scenarios.later.price - scenarios.now.price))}
            </p>
          </div>
          <div className="bg-white/50 p-2 rounded-lg">
            <p className="text-slate-500">Cash Change</p>
            <p className="font-bold text-green-600">
              +{formatKRW(scenarios.later.additionalSavings)}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        Projections are estimates based on assumptions. Actual results may vary.
      </p>
    </div>
  );
}
