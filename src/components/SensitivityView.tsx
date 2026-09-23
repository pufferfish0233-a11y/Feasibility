import React, { useState } from 'react';
import {
  FeasibilityModelData,
  ProjectedResults,
} from '../types/feasibility';
import {
  runFeasibilityProjections,
  formatCurrency,
  formatPercent,
} from '../utils/financialCalculations';
import {
  SlidersHorizontal,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface SensitivityViewProps {
  baseData: FeasibilityModelData;
  baseResults: ProjectedResults;
}

export const SensitivityView: React.FC<SensitivityViewProps> = ({
  baseData,
  baseResults,
}) => {
  const symbol = baseData.general.currencySymbol || '$';

  // Stress-test sliders (percentage offsets from base 0%)
  const [volumeShift, setVolumeShift] = useState<number>(0);
  const [priceShift, setPriceShift] = useState<number>(0);
  const [cogsShift, setCogsShift] = useState<number>(0);
  const [opexShift, setOpexShift] = useState<number>(0);

  // Compute stressed model dynamically
  const stressedData: FeasibilityModelData = {
    ...baseData,
    products: baseData.products.map((p) => ({
      ...p,
      initialSellingPrice: p.initialSellingPrice * (1 + priceShift / 100),
      initialAnnualVolume: p.initialAnnualVolume * (1 + volumeShift / 100),
      directMaterialPerUnit: p.directMaterialPerUnit * (1 + cogsShift / 100),
      directLaborPerUnit: p.directLaborPerUnit * (1 + cogsShift / 100),
      overheadCostPerUnit: p.overheadCostPerUnit * (1 + cogsShift / 100),
    })),
    opex: baseData.opex.map((o) => ({
      ...o,
      annualCostY1: o.annualCostY1 * (1 + opexShift / 100),
    })),
  };

  const stressedResults = runFeasibilityProjections(stressedData);

  // Reset to Base
  const resetToBase = () => {
    setVolumeShift(0);
    setPriceShift(0);
    setCogsShift(0);
    setOpexShift(0);
  };

  // Quick Preset Scenarios
  const applyPreset = (preset: 'bear' | 'base' | 'bull') => {
    if (preset === 'bear') {
      setVolumeShift(-20);
      setPriceShift(-5);
      setCogsShift(10);
      setOpexShift(10);
    } else if (preset === 'bull') {
      setVolumeShift(20);
      setPriceShift(5);
      setCogsShift(-5);
      setOpexShift(-5);
    } else {
      resetToBase();
    }
  };

  // Generate 2D Matrix (Volume Shift vs Price Shift)
  const volumeSteps = [-20, -10, 0, 10, 20];
  const priceSteps = [-10, -5, 0, 5, 10];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sensitivity & Stress Testing Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate operational shocks to sales volumes, pricing power, direct unit costs, and operational overhead to determine investment resilience
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyPreset('bear')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Pessimistic Case</span>
          </button>
          <button
            onClick={() => applyPreset('base')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            Base Case
          </button>
          <button
            onClick={() => applyPreset('bull')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Optimistic Case</span>
          </button>
          <button
            onClick={resetToBase}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Reset Sliders"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Comparison Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Stressed NPV</div>
          <div
            className={`text-2xl font-bold font-mono ${
              stressedResults.metrics.npv >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(stressedResults.metrics.npv, symbol, 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>Base: {formatCurrency(baseResults.metrics.npv, symbol, 0)}</span>
            <span
              className={`font-semibold ${
                stressedResults.metrics.npv >= baseResults.metrics.npv
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {(
                ((stressedResults.metrics.npv - baseResults.metrics.npv) /
                  (Math.abs(baseResults.metrics.npv) || 1)) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Stressed IRR</div>
          <div
            className={`text-2xl font-bold font-mono ${
              stressedResults.metrics.irr >= baseData.general.discountRate
                ? 'text-slate-900'
                : 'text-rose-600'
            }`}
          >
            {formatPercent(stressedResults.metrics.irr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>Base: {formatPercent(baseResults.metrics.irr)}</span>
            <span>Hurdle: {baseData.general.discountRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Stressed Payback</div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stressedResults.metrics.simplePaybackYears <= baseData.general.projectionYears
              ? `${stressedResults.metrics.simplePaybackYears.toFixed(1)} Yrs`
              : `> ${baseData.general.projectionYears} Yrs`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Base: {baseResults.metrics.simplePaybackYears.toFixed(1)} Yrs
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">5Y Net Income</div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(stressedResults.metrics.cumulativeNetProfit5Y, symbol, 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Base: {formatCurrency(baseResults.metrics.cumulativeNetProfit5Y, symbol, 0)}
          </div>
        </div>
      </div>

      {/* Sliders Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Interactive Variable Sliders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Sales Volume Shift</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  volumeShift > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : volumeShift < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {volumeShift > 0 ? `+${volumeShift}%` : `${volumeShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="5"
              value={volumeShift}
              onChange={(e) => setVolumeShift(parseInt(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-40% (Severe slump)</span>
              <span>0% (Base)</span>
              <span>+40% (Surge)</span>
            </div>
          </div>

          {/* Price Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Selling Price Shift</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  priceShift > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : priceShift < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {priceShift > 0 ? `+${priceShift}%` : `${priceShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="2.5"
              value={priceShift}
              onChange={(e) => setPriceShift(parseFloat(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-25% (Price war)</span>
              <span>0% (Base)</span>
              <span>+25% (Premium)</span>
            </div>
          </div>

          {/* COGS Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Direct Unit Cost Inflation (COGS)</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  cogsShift > 0
                    ? 'bg-rose-100 text-rose-800'
                    : cogsShift < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {cogsShift > 0 ? `+${cogsShift}%` : `${cogsShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="35"
              step="5"
              value={cogsShift}
              onChange={(e) => setCogsShift(parseInt(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-25% (Efficiency)</span>
              <span>0% (Base)</span>
              <span>+35% (Supply shock)</span>
            </div>
          </div>

          {/* OPEX Slider */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Operating Overhead Shift (OPEX)</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  opexShift > 0
                    ? 'bg-rose-100 text-rose-800'
                    : opexShift < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {opexShift > 0 ? `+${opexShift}%` : `${opexShift}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="5"
              value={opexShift}
              onChange={(e) => setOpexShift(parseInt(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-20% (Lean ops)</span>
              <span>0% (Base)</span>
              <span>+30% (Escalation)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Way Sensitivity Matrix Table: Volume vs Price */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            2-Way Sensitivity Matrix: Sales Volume vs Selling Price (NPV Matrix)
          </h2>
          <p className="text-xs text-slate-500">
            Simultaneous variation of volume and price points showing projected Net Present Value across 25 operating permutations
          </p>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[620px] text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold">
                <th className="py-2.5 px-3 text-left">Selling Price \ Volume</th>
                {volumeSteps.map((v) => (
                  <th key={v} className="py-2.5 px-3">
                    {v > 0 ? `+${v}%` : `${v}%`} Vol
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {priceSteps.map((pStep) => (
                <tr key={pStep}>
                  <td className="py-2 px-3 text-left font-sans font-bold text-slate-800 bg-slate-50">
                    {pStep > 0 ? `+${pStep}%` : `${pStep}%`} Price
                  </td>
                  {volumeSteps.map((vStep) => {
                    const testModel: FeasibilityModelData = {
                      ...baseData,
                      products: baseData.products.map((prod) => ({
                        ...prod,
                        initialSellingPrice: prod.initialSellingPrice * (1 + pStep / 100),
                        initialAnnualVolume: prod.initialAnnualVolume * (1 + vStep / 100),
                      })),
                    };
                    const res = runFeasibilityProjections(testModel);
                    const isPositive = res.metrics.npv >= 0;
                    const isCurrent = vStep === volumeShift && pStep === priceShift;

                    return (
                      <td
                        key={vStep}
                        className={`py-2 px-3 font-semibold transition-all ${
                          isCurrent ? 'ring-2 ring-slate-900 font-bold z-10' : ''
                        } ${
                          isPositive
                            ? 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-rose-50/70 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <div>{formatCurrency(res.metrics.npv, symbol, 0)}</div>
                        <div className="text-[10px] opacity-75">{formatPercent(res.metrics.irr)}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
