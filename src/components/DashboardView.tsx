import React, { useState } from 'react';
import {
  FeasibilityModelData,
  ProjectedResults,
} from '../types/feasibility';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  DollarSign,
  Clock,
  PieChart,
  Percent,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  Building,
  Target,
  Building2,
  Users,
  User,
  Plus,
  Edit3,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  data: FeasibilityModelData;
  results: ProjectedResults;
  onNavigateToTab: (tab: any) => void;
  onOpenCompanyProfile?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  results,
  onNavigateToTab,
  onOpenCompanyProfile,
}) => {
  const { metrics, incomeStatements, cashFlows, balanceSheets, ratios } = results;
  const { general, policies } = data;
  const symbol = general.currencySymbol || '$';

  const [activeChartTab, setActiveChartTab] = useState<'financials' | 'cash' | 'cost' | 'breakeven'>('financials');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Max value for revenue & profit chart
  const maxRevenue = Math.max(
    ...incomeStatements.map((is) => Math.max(is.grossRevenue, is.grossProfit, is.netIncome, is.opex.total)),
    1000
  );

  // Helper for coordinates in chart
  const getX = (yearIdx: number) => padding.left + (yearIdx / 4) * innerWidth;
  const getY = (val: number, max: number) => padding.top + innerHeight - (Math.max(0, val) / max) * innerHeight;

  return (
    <div className="space-y-6">
      {/* 1. Executive Feasibility Verdict Banner */}
      <div
        className={`rounded-2xl p-6 border transition-all ${
          data.products.length === 0
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-slate-700 text-white'
            : metrics.verdict === 'FEASIBLE'
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-emerald-800/60 text-white'
            : metrics.verdict === 'CONDITIONALLY FEASIBLE'
            ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-amber-800/60 text-white'
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-rose-800/60 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                  data.products.length === 0
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : metrics.verdict === 'FEASIBLE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : metrics.verdict === 'CONDITIONALLY FEASIBLE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {data.products.length === 0 ? (
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                ) : metrics.verdict === 'FEASIBLE' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : metrics.verdict === 'CONDITIONALLY FEASIBLE' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {data.products.length === 0 ? 'CLEAN SLATE: READY FOR ASSUMPTIONS' : `PROJECT VERDICT: ${metrics.verdict}`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {general.projectionYears}-Year Horizon ({general.startYear}–{general.startYear + general.projectionYears - 1})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {data.companyProfile?.entityName || general.projectName}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {data.products.length === 0 ? (
                <span>
                  Welcome to your fresh feasibility workspace. Your entity profile and initial capital are ready. Next, encode your projected products/services and operational cost structure to generate dynamic 5-year financial statements.
                </span>
              ) : metrics.verdict === 'FEASIBLE' ? (
                `The proposed project demonstrates robust financial viability. At a hurdle rate of ${general.discountRate}%, the investment produces a positive Net Present Value of ${formatCurrency(metrics.npv, symbol)} with an Internal Rate of Return of ${formatPercent(metrics.irr)}, comfortably exceeding capital costs. Debt service coverage averages ${metrics.averageDscr.toFixed(2)}x, satisfying standard commercial banking covenants.`
              ) : metrics.verdict === 'CONDITIONALLY FEASIBLE' ? (
                `The project is conditionally feasible but presents moderate sensitivity risks. While generating an NPV of ${formatCurrency(metrics.npv, symbol)}, certain coverage or payback ratios fall near threshold limits. Management should stress-test operating expenses and customer acquisition velocity.`
              ) : (
                `The financial model in its present form does not satisfy core feasibility criteria. The projected internal rate of return (${formatPercent(metrics.irr)}) or cash generation is inadequate to cover capital costs and debt service. Re-engineering product pricing, lowering initial capex, or improving gross margins is strongly recommended.`
              )}
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 shrink-0">
            <div className="px-3 border-r border-white/10">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Net Present Value</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(metrics.npv, symbol)}
              </div>
              <div className="text-[10px] text-slate-400">at {general.discountRate}% WACC</div>
            </div>
            <div className="px-3 border-r border-white/10">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Project IRR</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                {data.products.length > 0 ? formatPercent(metrics.irr) : '0.0%'}
              </div>
              <div className="text-[10px] text-slate-400">Hurdle: {general.discountRate}%</div>
            </div>
            <div className="px-3">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Simple Payback</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                {data.products.length > 0 && metrics.simplePaybackYears <= general.projectionYears
                  ? `${metrics.simplePaybackYears.toFixed(1)} yrs`
                  : data.products.length === 0
                  ? 'Pending Data'
                  : `> ${general.projectionYears} yrs`}
              </div>
              <div className="text-[10px] text-slate-400">Hurdle: ≤ 4.0 yrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Company Profile & Legal Structure Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  {data.companyProfile?.entityName || general.companyName || 'Entity Profile'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    data.companyProfile?.classification === 'Partnership'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {data.companyProfile?.classification || 'Sole Proprietorship'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nature: <span className="font-semibold text-slate-700">{data.companyProfile?.nature || general.industry || 'Not specified'}</span>
              </p>
            </div>
          </div>

          {onOpenCompanyProfile && (
            <button
              onClick={onOpenCompanyProfile}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Modify Profile & Capital</span>
            </button>
          )}
        </div>

        {/* Purpose Statement */}
        {data.companyProfile?.purpose && (
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 italic">
            <span className="font-semibold text-slate-800 not-italic">Entity Purpose: </span>
            "{data.companyProfile.purpose}"
          </div>
        )}

        {/* Ownership & Contributed Capital Breakdown */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            {data.companyProfile?.classification === 'Partnership' ? (
              <>
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Partners' Contributed Capital & Profit Sharing Roster</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sole Proprietor Contributed Capital</span>
              </>
            )}
          </div>

          {data.companyProfile?.classification === 'Partnership' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.companyProfile.partners && data.companyProfile.partners.length > 0 ? (
                data.companyProfile.partners.map((partner, idx) => (
                  <div
                    key={partner.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate">{partner.name || `Partner #${idx + 1}`}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                          {partner.profitSharePercent}% Share
                        </span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {formatCurrency(partner.capital, symbol, 0)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Capital: {((partner.capital / (data.financing.initialEquity || 1)) * 100).toFixed(1)}% of total equity
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-xs text-slate-400 p-2">
                  No partners encoded yet. Click 'Modify Profile & Capital' to set up partnership shares.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {data.companyProfile?.soleProprietor?.ownerName?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {data.companyProfile?.soleProprietor?.ownerName || general.preparedBy || 'Sole Proprietor'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Sole Investor & 100% Equity Owner
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Contributed Equity Capital</div>
                <div className="text-lg font-bold font-mono text-emerald-700">
                  {formatCurrency(
                    data.companyProfile?.soleProprietor?.capital ?? data.financing.initialEquity ?? 0,
                    symbol,
                    0
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Clean Slate Onboarding Guide (Shown when products list is empty) */}
      {data.products.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 rounded-2xl border-2 border-indigo-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Quick Setup Guide for Your Feasibility Study
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your workspace is now cleared into a clean slate. Follow these steps to build out your complete 5-year feasibility projections:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="font-bold text-xs text-slate-900">Company & Capital</div>
              <p className="text-[11px] text-slate-500">
                Encode entity name, choose Sole Proprietorship or Partnership, and set initial contributed capital.
              </p>
              {onOpenCompanyProfile && (
                <button
                  onClick={onOpenCompanyProfile}
                  className="w-full mt-2 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Configure Profile →
                </button>
              )}
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="font-bold text-xs text-slate-900">Products & Revenues</div>
              <p className="text-[11px] text-slate-500">
                Encode your product lines, initial selling prices, unit bill of materials (COGS), and annual volume forecasts.
              </p>
              <button
                onClick={() => onNavigateToTab('assumptions')}
                className="w-full mt-2 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Go to Assumptions →
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="font-bold text-xs text-slate-900">OPEX & Equipment</div>
              <p className="text-[11px] text-slate-500">
                Specify operating overhead (rent, salaries, utilities) and equipment capex with depreciation schedules.
              </p>
              <button
                onClick={() => onNavigateToTab('assumptions')}
                className="w-full mt-2 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Encode Costing →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Initial Outlay</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(metrics.initialInvestment, symbol)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Capex + Initial WC</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>5Y Cumulative Profit</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            {formatCurrency(metrics.cumulativeNetProfit5Y, symbol)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">5-Yr Total Net Income</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Year 5 Revenue</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatCurrency(incomeStatements[general.projectionYears - 1]?.grossRevenue || 0, symbol)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Terminal annual sales</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Avg Bank DSCR</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {metrics.averageDscr.toFixed(2)}x
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Benchmark: ≥ 1.25x</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Benefit-Cost (PI)</span>
            <Target className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {metrics.profitabilityIndex.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">PV of Inflows / Capex</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Y1 Break-Even Margin</span>
            <Percent className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {formatPercent(metrics.bepYear1.marginOfSafetyPercent)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Margin of Safety</span>
        </div>
      </div>

      {/* 3. Interactive Charts & Visuals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Project Financial Trajectory & Analysis
            </h2>
            <p className="text-xs text-slate-500">
              Multi-year projection dynamics across revenues, operational margins, liquidity, and break-even points
            </p>
          </div>

          {/* Segmented Chart Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveChartTab('financials')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'financials'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue & Profit
            </button>
            <button
              onClick={() => setActiveChartTab('cash')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'cash'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash & Liquidity
            </button>
            <button
              onClick={() => setActiveChartTab('cost')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'cost'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cost Structure
            </button>
            <button
              onClick={() => setActiveChartTab('breakeven')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeChartTab === 'breakeven'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Break-Even Curve
            </button>
          </div>
        </div>

        {/* Chart Render Container */}
        <div className="pt-6">
          {activeChartTab === 'financials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-900 inline-block"></span>
                    <span>Gross Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
                    <span>Gross Profit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-indigo-500 inline-block"></span>
                    <span>Net Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-rose-400 inline-block"></span>
                    <span>Operating Expenses</span>
                  </div>
                </div>
                <span className="font-mono text-slate-400">Values in {general.currency}</span>
              </div>

              {/* Chart SVG */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-64 sm:h-72 select-none"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = padding.top + innerHeight * (1 - pct);
                    const val = maxRevenue * pct;
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="text-[10px] fill-slate-400 font-mono"
                        >
                          {formatCurrency(val, symbol, 0)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Year Group Bars */}
                  {incomeStatements.map((is, idx) => {
                    const groupX = getX(idx);
                    const barWidth = 14;
                    const groupOffset = -barWidth * 2;

                    const revH = (is.grossRevenue / maxRevenue) * innerHeight;
                    const gpH = (is.grossProfit / maxRevenue) * innerHeight;
                    const niH = (Math.max(0, is.netIncome) / maxRevenue) * innerHeight;
                    const opexH = (is.opex.total / maxRevenue) * innerHeight;

                    return (
                      <g key={idx}>
                        {/* Revenue Bar */}
                        <rect
                          x={groupX + groupOffset}
                          y={padding.top + innerHeight - revH}
                          width={barWidth - 2}
                          height={revH}
                          fill="#0f172a"
                          rx="2"
                        />
                        {/* Gross Profit Bar */}
                        <rect
                          x={groupX + groupOffset + barWidth}
                          y={padding.top + innerHeight - gpH}
                          width={barWidth - 2}
                          height={gpH}
                          fill="#10b981"
                          rx="2"
                        />
                        {/* Net Income Bar */}
                        <rect
                          x={groupX + groupOffset + barWidth * 2}
                          y={padding.top + innerHeight - niH}
                          width={barWidth - 2}
                          height={niH}
                          fill="#6366f1"
                          rx="2"
                        />
                        {/* Opex Bar */}
                        <rect
                          x={groupX + groupOffset + barWidth * 3}
                          y={padding.top + innerHeight - opexH}
                          width={barWidth - 2}
                          height={opexH}
                          fill="#fb7185"
                          rx="2"
                        />

                        {/* X Axis Label */}
                        <text
                          x={groupX + 8}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          className="text-xs fill-slate-600 font-semibold"
                        >
                          Year {is.year} ({general.startYear + is.year - 1})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Data Table Preview */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
                {incomeStatements.map((is) => (
                  <div key={is.year} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">Year {is.year}</div>
                    <div className="flex justify-between text-slate-500 font-mono">
                      <span>Rev:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(is.grossRevenue, symbol, 0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-mono">
                      <span>Net:</span>
                      <span className="font-semibold">{formatCurrency(is.netIncome, symbol, 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                      <span>Margin:</span>
                      <span>{formatPercent(is.netMarginPercent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChartTab === 'cash' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block"></span>
                    <span>Ending Cash Balance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block"></span>
                    <span>Operating Cash Flow (OCF)</span>
                  </div>
                </div>
                <span className="font-mono text-slate-400">Cash Flow Profile</span>
              </div>

              {/* Cash Flow Line Chart */}
              <div className="w-full overflow-x-auto">
                {(() => {
                  const maxCash = Math.max(
                    ...cashFlows.map((cf) => Math.max(cf.endingCash, cf.operatingActivities.netCashFromOperations)),
                    balanceSheets[0].assets.currentAssets.cash,
                    1000
                  );

                  const cashPoints = [
                    { x: padding.left, y: getY(balanceSheets[0].assets.currentAssets.cash, maxCash) },
                    ...cashFlows.map((cf, idx) => ({
                      x: getX(idx),
                      y: getY(cf.endingCash, maxCash),
                    })),
                  ];

                  const pathD = cashPoints.reduce(
                    (acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                    ''
                  );

                  return (
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-64 sm:h-72 select-none"
                    >
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const y = padding.top + innerHeight * (1 - pct);
                        return (
                          <g key={idx}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={padding.left - 8}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-slate-400 font-mono"
                            >
                              {formatCurrency(maxCash * pct, symbol, 0)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Cash Area Fill */}
                      <path
                        d={`${pathD} L ${chartWidth - padding.right} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`}
                        fill="rgba(16, 185, 129, 0.12)"
                      />

                      {/* Cash Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Operating Cash Bars */}
                      {cashFlows.map((cf, idx) => {
                        const x = getX(idx);
                        const ocfH = (Math.max(0, cf.operatingActivities.netCashFromOperations) / maxCash) * innerHeight;
                        return (
                          <g key={idx}>
                            <rect
                              x={x - 8}
                              y={padding.top + innerHeight - ocfH}
                              width={16}
                              height={ocfH}
                              fill="#3b82f6"
                              opacity="0.8"
                              rx="2"
                            />
                            {/* Point on cash line */}
                            <circle
                              cx={x}
                              cy={getY(cf.endingCash, maxCash)}
                              r="4"
                              fill="#ffffff"
                              stroke="#059669"
                              strokeWidth="2"
                            />
                            <text
                              x={x}
                              y={chartHeight - 12}
                              textAnchor="middle"
                              className="text-xs fill-slate-600 font-semibold"
                            >
                              Y{cf.year}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>

              {/* Cash Metrics breakdown */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
                {cashFlows.map((cf) => (
                  <div key={cf.year} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">Year {cf.year} Cash</div>
                    <div className="text-[11px] text-slate-500">
                      OCF: <span className="font-mono font-semibold text-blue-700">{formatCurrency(cf.operatingActivities.netCashFromOperations, symbol, 0)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      End Cash: <span className="font-mono font-semibold text-emerald-700">{formatCurrency(cf.endingCash, symbol, 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChartTab === 'cost' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 flex justify-between items-center">
                <span>Cost composition breakdown across Direct Materials, Direct Labor, Overhead, and Operating Expenses</span>
                <span className="font-mono text-slate-400">Y1 to Y5 Cost Evolution</span>
              </div>

              {/* Stacked Cost Visualization */}
              <div className="space-y-3">
                {incomeStatements.map((is) => {
                  const totalExpense = is.cogs.total + is.opex.total + is.interestExpense + is.taxExpense;
                  const matPct = totalExpense > 0 ? (is.cogs.directMaterials / totalExpense) * 100 : 0;
                  const labPct = totalExpense > 0 ? (is.cogs.directLabor / totalExpense) * 100 : 0;
                  const ovhPct = totalExpense > 0 ? (is.cogs.overhead / totalExpense) * 100 : 0;
                  const opexPct = totalExpense > 0 ? (is.opex.total / totalExpense) * 100 : 0;
                  const otherPct = totalExpense > 0 ? ((is.interestExpense + is.taxExpense) / totalExpense) * 100 : 0;

                  return (
                    <div key={is.year} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Year {is.year} ({general.startYear + is.year - 1})</span>
                        <span className="font-mono">{formatCurrency(totalExpense, symbol, 0)} Total Outflow</span>
                      </div>
                      <div className="h-5 rounded-md overflow-hidden flex bg-slate-100 border border-slate-200">
                        <div style={{ width: `${matPct}%` }} className="bg-amber-500" title={`Direct Materials: ${matPct.toFixed(1)}%`} />
                        <div style={{ width: `${labPct}%` }} className="bg-blue-500" title={`Direct Labor: ${labPct.toFixed(1)}%`} />
                        <div style={{ width: `${ovhPct}%` }} className="bg-teal-500" title={`Overhead: ${ovhPct.toFixed(1)}%`} />
                        <div style={{ width: `${opexPct}%` }} className="bg-rose-500" title={`OPEX: ${opexPct.toFixed(1)}%`} />
                        <div style={{ width: `${otherPct}%` }} className="bg-slate-400" title={`Interest & Taxes: ${otherPct.toFixed(1)}%`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-amber-500" /> Direct Materials</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-blue-500" /> Direct Labor</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-teal-500" /> Direct Overhead</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-rose-500" /> Operating Expenses (OPEX)</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-slate-400" /> Financing & Taxes</div>
              </div>
            </div>
          )}

          {activeChartTab === 'breakeven' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Year 1 Fixed Operating Costs</div>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {formatCurrency(metrics.bepYear1.fixedCosts, symbol, 0)}
                  </div>
                  <div className="text-[11px] text-slate-400">Fixed OPEX + D&A + Interest</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Contribution Margin Ratio</div>
                  <div className="text-xl font-bold font-mono text-indigo-600">
                    {formatPercent(metrics.bepYear1.contributionMarginRatio * 100)}
                  </div>
                  <div className="text-[11px] text-slate-400">1 - Variable Cost Ratio</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Break-Even Revenue (BEP)</div>
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    {formatCurrency(metrics.bepYear1.breakEvenRevenue, symbol, 0)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    Margin of Safety: {formatPercent(metrics.bepYear1.marginOfSafetyPercent)}
                  </div>
                </div>
              </div>

              {/* Break-even graphical simulation */}
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-2">Year 1 Revenue vs Break-Even Threshold</div>
                <div className="relative pt-4">
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 relative">
                    {/* Break-Even threshold point */}
                    <div
                      style={{ width: `${Math.min(100, (metrics.bepYear1.breakEvenRevenue / (incomeStatements[0]?.grossRevenue || 1)) * 100)}%` }}
                      className="bg-amber-400/80 h-full flex items-center justify-end pr-2 text-[10px] font-bold text-amber-900"
                    >
                      BEP
                    </div>
                    {/* Safe Profit Region */}
                    <div className="bg-emerald-500 h-full flex-1 flex items-center pl-2 text-[10px] font-bold text-white">
                      Margin of Safety ({formatPercent(metrics.bepYear1.marginOfSafetyPercent)})
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                    <span>$0</span>
                    <span>BEP: {formatCurrency(metrics.bepYear1.breakEvenRevenue, symbol, 0)}</span>
                    <span className="font-bold text-slate-900">Projected: {formatCurrency(incomeStatements[0]?.grossRevenue || 0, symbol, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Feasibility Criteria Scorecard & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Capital Feasibility & Covenant Scorecard
              </h3>
              <p className="text-xs text-slate-500">
                Verification against institutional hurdle benchmarks and banking liquidity criteria
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('ratios')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              View Full Ratio Suite
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.scorecard.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{item.criterion}</div>
                    <div className="text-[11px] text-slate-500">Benchmark: {item.target}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900">{item.actual}</div>
                    <span className="text-[10px] text-slate-400">{item.importance} Priority</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.passed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.passed ? 'PASSED' : 'FLAGGED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Link Modules */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Model Structure & Formulation
            </div>
            <h3 className="text-lg font-bold">Comprehensive Feasibility Sections</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore the underlying dynamic building blocks including company policies, product costing, asset depreciation, debt amortization, and stress-testing.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              onClick={() => onNavigateToTab('statements')}
              className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold flex items-center justify-between"
            >
              <span>Projected Financial Statements (IS, BS, CFS)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('notes')}
              className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold flex items-center justify-between"
            >
              <span>Notes to Financial Statements (Notes 1–8)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('assumptions')}
              className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold flex items-center justify-between"
            >
              <span>Edit Costing, Prices & Company Policies</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('sensitivity')}
              className="w-full text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold flex items-center justify-between"
            >
              <span>Interactive Sensitivity & Stress Testing</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
