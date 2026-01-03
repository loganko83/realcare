/**
 * Scenario Comparison Component
 * Compare "Buy Now" vs "Buy Later" scenarios
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { calculateRealityScore, type RealityScoreInput } from '../../lib/utils/realityScore';
import { formatKRW } from '../../lib/utils/dsr';
import { Card, Button, SelectButton, Badge } from '../common';

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
          <Button variant="ghost" size="sm" onClick={onShare} icon={<Share2 size={16} />}>
            Share
          </Button>
        )}
      </div>

      {/* Scenario Settings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            <Calendar size={18} />
            Wait Period
          </h3>
          <SelectButton
            options={[
              { id: '1', label: '1Y' },
              { id: '2', label: '2Y' },
              { id: '3', label: '3Y' },
              { id: '5', label: '5Y' },
            ]}
            value={String(settings.waitYears)}
            onChange={(val) => setSettings({ ...settings, waitYears: Number(val) })}
            size="sm"
            columns={4}
          />
        </div>

        {/* Advanced Settings Toggle */}
        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? 'Hide' : 'Show'} advanced settings
        </Button>

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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettings({
                waitYears: 1,
                priceAppreciation: 3,
                incomeGrowth: 3,
                savingsRate: 20,
                interestRateChange: 0,
              })}
              icon={<RotateCcw size={14} />}
            >
              Reset to defaults
            </Button>
          </div>
        )}
      </Card>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Buy Now */}
        <Card padding="sm">
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">Buy Now</p>
            <p className={`text-3xl font-bold ${getScoreColor(scenarios.now.result.score)}`}>
              {scenarios.now.result.score}
            </p>
            <Badge variant={scenarios.now.result.grade === 'A' ? 'success' : scenarios.now.result.grade === 'B' ? 'success' : scenarios.now.result.grade === 'C' ? 'warning' : 'error'} size="sm">
              {scenarios.now.result.grade}
            </Badge>
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
        </Card>

        {/* Buy Later */}
        <Card padding="sm" className="relative">
          <Badge variant="info" size="sm" className="absolute -top-2 -right-2">
            +{settings.waitYears}Y
          </Badge>
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">Buy in {settings.waitYears} Year{settings.waitYears > 1 ? 's' : ''}</p>
            <p className={`text-3xl font-bold ${getScoreColor(scenarios.later.result.score)}`}>
              {scenarios.later.result.score}
            </p>
            <Badge variant={scenarios.later.result.grade === 'A' ? 'success' : scenarios.later.result.grade === 'B' ? 'success' : scenarios.later.result.grade === 'C' ? 'warning' : 'error'} size="sm">
              {scenarios.later.result.grade}
            </Badge>
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
        </Card>
      </div>

      {/* Score Comparison */}
      <Card variant="flat" className={
        recommendation === 'wait' ? 'bg-green-50 border-green-200' :
        recommendation === 'now' ? 'bg-blue-50 border-blue-200' :
        'bg-gray-50 border-gray-200'
      }>
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
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        Projections are estimates based on assumptions. Actual results may vary.
      </p>
    </div>
  );
}
