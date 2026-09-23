import React from 'react';
import { FeasibilityModelData, ProjectedResults } from '../types/feasibility';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import {
  TrendingUp,
  Shield,
  Activity,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface RatiosViewProps {
  data: FeasibilityModelData;
  results: ProjectedResults;
}

export const RatiosView: React.FC<RatiosViewProps> = ({ data, results }) => {
  const { ratios, metrics } = results;
  const { general } = data;
  const symbol = general.currencySymbol || '$';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Ratios & Feasibility Diagnostics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive multi-year ratio analysis evaluating profitability, liquidity, financial leverage, and operational turnover against commercial standards
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">IRR vs Hurdle</div>
            <div className="text-base font-bold font-mono text-emerald-700">
              {formatPercent(metrics.irr)} / {general.discountRate}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Average DSCR</div>
            <div className="text-base font-bold font-mono text-slate-900">
              {metrics.averageDscr.toFixed(2)}x
            </div>
          </div>
        </div>
      </div>

      {/* Capital Budgeting & Investment Criteria Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Net Present Value (NPV)</span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">r = {general.discountRate}%</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">
            {formatCurrency(metrics.npv, symbol)}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {metrics.npv > 0
              ? 'Generates surplus cash flow above the required capital return threshold.'
              : 'Does not achieve the required hurdle rate; destructive to equity value.'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Internal Rate of Return</span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">Hurdle: {general.discountRate}%</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {formatPercent(metrics.irr)}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Spread of <span className="font-semibold text-emerald-600 font-mono">+{(metrics.irr - general.discountRate).toFixed(1)}%</span> over WACC hurdle of {general.discountRate}%.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Payback Period</span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">Horizon: {general.projectionYears} Yrs</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {metrics.simplePaybackYears <= general.projectionYears
              ? `${metrics.simplePaybackYears.toFixed(1)} Years`
              : `> ${general.projectionYears} Years`}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Discounted Payback: <span className="font-semibold font-mono">{metrics.discountedPaybackYears <= general.projectionYears ? `${metrics.discountedPaybackYears.toFixed(1)} yrs` : 'Exceeds horizon'}</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Benefit-Cost Ratio (PI)</span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">Target &gt; 1.0</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {metrics.profitabilityIndex.toFixed(2)}x
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Every $1.00 invested yields <span className="font-semibold font-mono text-emerald-600">${metrics.profitabilityIndex.toFixed(2)}</span> in discounted present value.
          </p>
        </div>
      </div>

      {/* 1. Profitability Ratios Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Profitability & Return Ratios</h2>
              <p className="text-xs text-slate-500">Measures the enterprise's ability to convert revenues into gross, operational, and net profits</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Target: Upward or stable trend</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4 w-64">Ratio Name</th>
                <th className="py-2.5 px-4 w-60">Formula / Calculation</th>
                <th className="py-2.5 px-4 w-32">Standard Benchmark</th>
                {ratios.map((r) => (
                  <th key={r.year} className="py-2.5 px-4 text-right">Year {r.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Gross Profit Margin</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Gross Profit / Gross Revenue</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 35% - 50%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatPercent(r.profitability.grossProfitMargin)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Operating Margin (EBIT)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Operating Income / Revenue</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 12% - 20%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatPercent(r.profitability.operatingProfitMargin)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Net Profit Margin</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Net Income / Gross Revenue</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 8% - 15%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-bold text-emerald-700">
                    {formatPercent(r.profitability.netProfitMargin)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Return on Equity (ROE)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Net Income / Total Stockholder Equity</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 15% - 25%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatPercent(r.profitability.returnOnEquity)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Return on Assets (ROA)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Net Income / Total Assets</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 8% - 12%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatPercent(r.profitability.returnOnAssets)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">EBITDA Margin</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">EBITDA / Gross Revenue</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 18% - 25%</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {formatPercent(r.profitability.ebitdaMargin)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Liquidity Ratios Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Liquidity & Short-Term Solvency</h2>
              <p className="text-xs text-slate-500">Evaluates the buffer of current assets available to settle immediate obligations</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Benchmark: Current Ratio ≥ 1.5x</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4 w-64">Ratio Name</th>
                <th className="py-2.5 px-4 w-60">Formula / Calculation</th>
                <th className="py-2.5 px-4 w-32">Standard Benchmark</th>
                {ratios.map((r) => (
                  <th key={r.year} className="py-2.5 px-4 text-right">Year {r.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Current Ratio</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&ge; 1.50x - 2.0x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.liquidity.currentRatio.toFixed(2)}x
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Quick Ratio (Acid-Test)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">(Cash + Accounts Receivable) / Current Liabilities</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&ge; 1.00x - 1.20x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.liquidity.quickRatio.toFixed(2)}x
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Cash Ratio</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Cash & Equivalents / Current Liabilities</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&ge; 0.50x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.liquidity.cashRatio.toFixed(2)}x
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Solvency & Leverage Ratios Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">3. Solvency, Debt Covenants & Coverage</h2>
              <p className="text-xs text-slate-500">Examines long-term financial stability, capital leverage, and debt repayment capability</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Bank DSCR Benchmark: ≥ 1.25x</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4 w-64">Ratio Name</th>
                <th className="py-2.5 px-4 w-60">Formula / Calculation</th>
                <th className="py-2.5 px-4 w-32">Standard Benchmark</th>
                {ratios.map((r) => (
                  <th key={r.year} className="py-2.5 px-4 text-right">Year {r.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Debt Service Coverage (DSCR)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">(EBITDA - Tax) / (Principal + Interest)</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&ge; 1.25x (Bank Covenant)</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-bold text-indigo-700">
                    {r.solvency.dscr < 90 ? `${r.solvency.dscr.toFixed(2)}x` : 'N/A (Debt Free)'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Interest Coverage Ratio (TIE)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Operating Income (EBIT) / Interest Expense</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&ge; 3.00x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.solvency.interestCoverageRatio < 90 ? `${r.solvency.interestCoverageRatio.toFixed(2)}x` : 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Debt-to-Equity Ratio (D/E)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Total Liabilities / Total Equity</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&le; 1.50x - 2.0x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.solvency.debtToEquity.toFixed(2)}x
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Debt-to-Assets Ratio</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Total Liabilities / Total Assets</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&le; 0.60x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.solvency.debtToAssets.toFixed(2)}x
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Efficiency & Activity Ratios Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">4. Operating Efficiency & Turnover Policies</h2>
              <p className="text-xs text-slate-500">Derived from credit policies, inventory replenishment cycles, and supplier payment terms</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">DSO + DSI - DPO = Cash Conversion Cycle</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="py-2.5 px-4 w-64">Ratio Name</th>
                <th className="py-2.5 px-4 w-60">Underlying Policy Assumption</th>
                <th className="py-2.5 px-4 w-32">Ideal Direction</th>
                {ratios.map((r) => (
                  <th key={r.year} className="py-2.5 px-4 text-right">Year {r.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Days Sales Outstanding (DSO)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">{data.policies.accountsReceivableDays} Days credit term ({data.policies.creditSalesPercent}% credit)</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">Lower is better</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.efficiency.dso.toFixed(1)} Days
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Days Sales of Inventory (DSI)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">{data.policies.inventoryHoldingDays} Days inventory holding policy</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">Optimized turns</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.efficiency.dsi.toFixed(1)} Days
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Days Payable Outstanding (DPO)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">{data.policies.accountsPayableDays} Days vendor credit period</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">Extended within terms</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.efficiency.dpo.toFixed(1)} Days
                  </td>
                ))}
              </tr>
              <tr className="bg-amber-50/50">
                <td className="py-2.5 px-4 font-sans font-bold text-amber-950">Cash Conversion Cycle (CCC)</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">DSO + DSI - DPO (Working capital velocity)</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">Shorter is leaner</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-bold text-amber-800">
                    {r.efficiency.cashConversionCycle.toFixed(1)} Days
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Asset Turnover Ratio</td>
                <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">Gross Revenue / Total Assets</td>
                <td className="py-2.5 px-4 text-slate-600 font-sans">&gt; 1.0x - 2.0x</td>
                {ratios.map((r) => (
                  <td key={r.year} className="py-2.5 px-4 text-right font-semibold text-slate-800">
                    {r.efficiency.assetTurnover.toFixed(2)}x
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
