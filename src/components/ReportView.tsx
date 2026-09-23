import React from 'react';
import {
  FeasibilityModelData,
  ProjectedResults,
} from '../types/feasibility';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import {
  Printer,
  FileCheck,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ReportViewProps {
  data: FeasibilityModelData;
  results: ProjectedResults;
}

export const ReportView: React.FC<ReportViewProps> = ({ data, results }) => {
  const { general, policies, products, financing, capex } = data;
  const { metrics, incomeStatements, balanceSheets, cashFlows } = results;
  const symbol = general.currencySymbol || '$';

  const handlePrint = () => {
    window.print();
  };

  const totalCapex = capex.reduce((sum, c) => sum + c.acquisitionCost, 0);

  return (
    <div className="space-y-6">
      {/* Non-printed Toolbar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Feasibility Study Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Print-ready formal dossier prepared for investment committees, commercial bank loan officers, and corporate sponsors
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm print:p-0 print:border-none print:shadow-none space-y-8 text-slate-900">
        {/* Cover / Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">
                COMMERCIAL FEASIBILITY EVALUATION DOSSIER
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                {data.companyProfile?.classification || 'Sole Proprietorship'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {data.companyProfile?.entityName || general.projectName}
            </h1>
            <div className="text-sm font-medium text-slate-600 mt-1">
              Sponsor Entity: <span className="font-semibold text-slate-900">{data.companyProfile?.entityName || general.companyName}</span> · Nature: <span className="font-semibold text-slate-900">{data.companyProfile?.nature || general.industry}</span>
            </div>
            {data.companyProfile?.purpose && (
              <p className="text-xs text-slate-500 mt-1.5 italic max-w-2xl">
                Purpose: "{data.companyProfile.purpose}"
              </p>
            )}
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Horizon: {general.projectionYears} Years ({general.startYear}–{general.startYear + general.projectionYears - 1})</div>
            <div>Discount Rate: {general.discountRate}% (WACC)</div>
            <div>Reporting Currency: {general.currency} ({symbol})</div>
            <div>Report Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Section 1: Executive Summary & Verdict */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-3">
              1. Executive Summary & Feasibility Recommendation
            </h2>
            <span
              className={`px-3 py-1 rounded text-xs font-bold tracking-wider uppercase font-mono ${
                metrics.verdict === 'FEASIBLE'
                  ? 'bg-emerald-100 text-emerald-900'
                  : metrics.verdict === 'CONDITIONALLY FEASIBLE'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-rose-100 text-rose-900'
              }`}
            >
              FINAL VERDICT: {metrics.verdict}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            This study evaluates the operational and commercial viability of <strong>{general.projectName}</strong> over a {general.projectionYears}-year horizon. An initial capital outlay of <strong>{formatCurrency(metrics.initialInvestment, symbol)}</strong> is structured through <strong>{formatCurrency(financing.initialEquity, symbol)}</strong> in contributed equity capital ({((financing.initialEquity / (financing.initialEquity + financing.loanPrincipal || 1)) * 100).toFixed(0)}%) and <strong>{formatCurrency(financing.loanPrincipal, symbol)}</strong> in senior term bank debt.
            Under baseline operating assumptions, the venture yields a Net Present Value of <strong>{formatCurrency(metrics.npv, symbol)}</strong> at a {general.discountRate}% hurdle rate, with an Internal Rate of Return (IRR) of <strong>{formatPercent(metrics.irr)}</strong> and simple payback achieved in <strong>{metrics.simplePaybackYears.toFixed(1)} years</strong>.
          </p>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Net Present Value</span>
              <span className="text-lg font-bold font-mono text-emerald-800">{formatCurrency(metrics.npv, symbol, 0)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Internal Rate of Return</span>
              <span className="text-lg font-bold font-mono text-slate-900">{formatPercent(metrics.irr)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Simple Payback</span>
              <span className="text-lg font-bold font-mono text-slate-900">{metrics.simplePaybackYears.toFixed(1)} Years</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Average Bank DSCR</span>
              <span className="text-lg font-bold font-mono text-slate-900">{metrics.averageDscr.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Performance Summary Table */}
        <div className="space-y-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-3">
            2. Five-Year Financial Performance Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3 border-b border-slate-200">Key Metric</th>
                  {incomeStatements.map((is) => (
                    <th key={is.year} className="py-2 px-3 border-b border-slate-200 text-right">
                      Year {is.year} ({general.startYear + is.year - 1})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">Gross Sales Revenue</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-1.5 px-3 text-right">{formatCurrency(is.grossRevenue, symbol, 0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Cost of Goods Sold (COGS)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-1.5 px-3 text-right">({formatCurrency(is.cogs.total, symbol, 0)})</td>
                  ))}
                </tr>
                <tr className="bg-slate-50/60 font-bold">
                  <td className="py-1.5 px-3 font-sans text-slate-900">Gross Profit</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-1.5 px-3 text-right">{formatCurrency(is.grossProfit, symbol, 0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Operating Overhead (OPEX)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-1.5 px-3 text-right">({formatCurrency(is.opex.total, symbol, 0)})</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Depreciation & Financing Interest</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-1.5 px-3 text-right">
                      ({formatCurrency(is.depreciation + is.interestExpense, symbol, 0)})
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-50/60 font-bold border-t border-b border-emerald-300">
                  <td className="py-2 px-3 font-sans text-emerald-950 font-bold">Net Profit After Tax</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-3 text-right text-emerald-900 font-bold">
                      {formatCurrency(is.netIncome, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Operating Cash Flow (CFS)</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-3 text-right">
                      {formatCurrency(cf.operatingActivities.netCashFromOperations, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Year-End Cash Balance</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-3 text-right font-semibold">
                      {formatCurrency(cf.endingCash, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans text-slate-600">Debt Service Coverage (DSCR)</td>
                  {results.ratios.map((r) => (
                    <td key={r.year} className="py-1.5 px-3 text-right">
                      {r.solvency.dscr < 90 ? `${r.solvency.dscr.toFixed(2)}x` : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Institutional Feasibility Scorecard */}
        <div className="space-y-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-3">
            3. Feasibility Criteria Compliance Audit
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  <th className="py-2 px-3 border-b border-slate-200">Criterion / Covenant</th>
                  <th className="py-2 px-3 border-b border-slate-200">Target Benchmark</th>
                  <th className="py-2 px-3 border-b border-slate-200">Project Model Actual</th>
                  <th className="py-2 px-3 border-b border-slate-200">Importance</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-right">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {metrics.scorecard.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-3 font-sans font-semibold text-slate-900">{item.criterion}</td>
                    <td className="py-1.5 px-3 text-slate-600 font-sans">{item.target}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{item.actual}</td>
                    <td className="py-1.5 px-3 font-sans text-slate-500">{item.importance}</td>
                    <td className="py-1.5 px-3 text-right font-sans">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          item.passed ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {item.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {item.passed ? 'PASSED' : 'FLAGGED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Sign-off & Governance Endorsement */}
        <div className="pt-8 border-t border-slate-300 space-y-6">
          <div className="text-xs text-slate-500">
            <strong>Study Endorsement & Governance:</strong> The projections above were prepared in accordance with professional financial modeling standards and reflect verified cost schedules, price benchmarks, and company governance policies.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
            <div className="border-t border-slate-900 pt-2 text-xs">
              <div className="font-bold text-slate-900">{general.preparedBy || 'Lead Financial Analyst'}</div>
              <div className="text-slate-500 text-[11px]">Feasibility Preparer / Modeler</div>
              <div className="text-slate-400 text-[10px] mt-1">Date: _____________</div>
            </div>

            {data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners ? (
              data.companyProfile.partners.map((partner, idx) => (
                <div key={partner.id || idx} className="border-t border-slate-900 pt-2 text-xs">
                  <div className="font-bold text-slate-900">{partner.name || `Partner #${idx + 1}`}</div>
                  <div className="text-slate-500 text-[11px]">
                    Partner ({partner.profitSharePercent}% Share & Capital Sponsor)
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1">Signature: _____________</div>
                </div>
              ))
            ) : (
              <div className="border-t border-slate-900 pt-2 text-xs">
                <div className="font-bold text-slate-900">
                  {data.companyProfile?.soleProprietor?.ownerName || general.companyName || 'Sole Proprietor'}
                </div>
                <div className="text-slate-500 text-[11px]">Sole Proprietor & 100% Sponsor</div>
                <div className="text-slate-400 text-[10px] mt-1">Signature: _____________</div>
              </div>
            )}

            <div className="border-t border-slate-900 pt-2 text-xs">
              <div className="font-bold text-slate-900">Commercial Bank / Creditor</div>
              <div className="text-slate-500 text-[11px]">Credit & Lending Review</div>
              <div className="text-slate-400 text-[10px] mt-1">Approval: _____________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
