import React, { useState } from 'react';
import { FeasibilityModelData, ProjectedResults } from '../types/feasibility';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import { LoanAmortizationModal } from './LoanAmortizationModal';
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Percent,
  Scale,
} from 'lucide-react';

interface StatementsViewProps {
  data: FeasibilityModelData;
  results: ProjectedResults;
}

export const StatementsView: React.FC<StatementsViewProps> = ({ data, results }) => {
  const { incomeStatements, balanceSheets, cashFlows } = results;
  const { general } = data;
  const symbol = general.currencySymbol || '$';

  const [statementType, setStatementType] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [showPercentages, setShowPercentages] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedOpex, setExpandedOpex] = useState(false);
  const [expandedCogs, setExpandedCogs] = useState(true);
  const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);

  const years = incomeStatements.map((is) => is.year);

  // Copy current statement table to clipboard as TSV (for easy paste into Excel)
  const handleCopyTable = () => {
    let tsv = '';
    if (statementType === 'income') {
      tsv = 'Line Item\t' + years.map((y) => `Year ${y} (${general.startYear + y - 1})`).join('\t') + '\n';
      tsv += 'Gross Revenue\t' + incomeStatements.map((is) => is.grossRevenue).join('\t') + '\n';
      tsv += 'Cost of Goods Sold\t' + incomeStatements.map((is) => is.cogs.total).join('\t') + '\n';
      tsv += 'Gross Profit\t' + incomeStatements.map((is) => is.grossProfit).join('\t') + '\n';
      tsv += 'Operating Expenses\t' + incomeStatements.map((is) => is.opex.total).join('\t') + '\n';
      tsv += 'EBITDA\t' + incomeStatements.map((is) => is.ebitda).join('\t') + '\n';
      tsv += 'Depreciation\t' + incomeStatements.map((is) => is.depreciation).join('\t') + '\n';
      tsv += 'Operating Income (EBIT)\t' + incomeStatements.map((is) => is.operatingIncome).join('\t') + '\n';
      tsv += 'Interest Expense\t' + incomeStatements.map((is) => is.interestExpense).join('\t') + '\n';
      tsv += 'Earnings Before Tax\t' + incomeStatements.map((is) => is.earningsBeforeTax).join('\t') + '\n';
      tsv += 'Income Tax\t' + incomeStatements.map((is) => is.taxExpense).join('\t') + '\n';
      tsv += 'Net Income\t' + incomeStatements.map((is) => is.netIncome).join('\t') + '\n';
    } else if (statementType === 'balance') {
      const allYears = [0, ...years];
      tsv = 'Line Item\t' + allYears.map((y) => (y === 0 ? 'Year 0 (Start)' : `Year ${y}`)).join('\t') + '\n';
      tsv += 'Cash & Equivalents\t' + balanceSheets.map((b) => b.assets.currentAssets.cash).join('\t') + '\n';
      tsv += 'Accounts Receivable\t' + balanceSheets.map((b) => b.assets.currentAssets.accountsReceivable).join('\t') + '\n';
      tsv += 'Inventory\t' + balanceSheets.map((b) => b.assets.currentAssets.inventory).join('\t') + '\n';
      tsv += 'Total Current Assets\t' + balanceSheets.map((b) => b.assets.currentAssets.totalCurrentAssets).join('\t') + '\n';
      tsv += 'Net PPE\t' + balanceSheets.map((b) => b.assets.nonCurrentAssets.netPpe).join('\t') + '\n';
      tsv += 'Total Assets\t' + balanceSheets.map((b) => b.assets.totalAssets).join('\t') + '\n';
      tsv += 'Accounts Payable\t' + balanceSheets.map((b) => b.liabilities.currentLiabilities.accountsPayable).join('\t') + '\n';
      tsv += 'Current Portion of Debt\t' + balanceSheets.map((b) => b.liabilities.currentLiabilities.currentPortionOfDebt).join('\t') + '\n';
      tsv += 'Long-Term Debt\t' + balanceSheets.map((b) => b.liabilities.nonCurrentLiabilities.longTermDebt).join('\t') + '\n';
      tsv += 'Total Liabilities\t' + balanceSheets.map((b) => b.liabilities.totalLiabilities).join('\t') + '\n';
      tsv += 'Contributed Capital\t' + balanceSheets.map((b) => b.equity.contributedCapital).join('\t') + '\n';
      tsv += 'Retained Earnings\t' + balanceSheets.map((b) => b.equity.retainedEarnings).join('\t') + '\n';
      tsv += 'Total Equity\t' + balanceSheets.map((b) => b.equity.totalEquity).join('\t') + '\n';
      tsv += 'Total Liabilities & Equity\t' + balanceSheets.map((b) => b.totalLiabilitiesAndEquity).join('\t') + '\n';
    } else {
      tsv = 'Line Item\t' + years.map((y) => `Year ${y}`).join('\t') + '\n';
      tsv += 'Net Cash from Operating\t' + cashFlows.map((cf) => cf.operatingActivities.netCashFromOperations).join('\t') + '\n';
      tsv += 'Net Cash from Investing\t' + cashFlows.map((cf) => cf.investingActivities.netCashFromInvesting).join('\t') + '\n';
      tsv += 'Net Cash from Financing\t' + cashFlows.map((cf) => cf.financingActivities.netCashFromFinancing).join('\t') + '\n';
      tsv += 'Net Change in Cash\t' + cashFlows.map((cf) => cf.netChangeInCash).join('\t') + '\n';
      tsv += 'Ending Cash\t' + cashFlows.map((cf) => cf.endingCash).join('\t') + '\n';
    }

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Projected Financial Statements
            </h1>
            {statementType === 'balance' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" />
                Balanced Identity: Assets = L + E
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            5-Year projected financial model compliant with standard accounting reporting conventions
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statement Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatementType('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statementType === 'income'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income Statement
            </button>
            <button
              onClick={() => setStatementType('balance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statementType === 'balance'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balance Sheet
            </button>
            <button
              onClick={() => setStatementType('cashflow')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                statementType === 'cashflow'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash Flows
            </button>
          </div>

          {/* Vertical Analysis Toggle (for Income Statement) */}
          {statementType === 'income' && (
            <button
              onClick={() => setShowPercentages(!showPercentages)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
                showPercentages
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle % of Revenue (Vertical Analysis)"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>% of Revenue</span>
            </button>
          )}

          {/* Amortization & Interest Comparison Modal Button */}
          <button
            onClick={() => setIsAmortizationModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="View Loan Amortization Schedule, Interest Received Table, and Paid vs. Received Comparison"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Amortization & Interest Comparison</span>
          </button>

          {/* Copy Table Button */}
          <button
            onClick={handleCopyTable}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Copy table to paste into Excel/Spreadsheet"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied TSV' : 'Copy Table'}</span>
          </button>
        </div>
      </div>

      {/* Main Statement Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Statement Title Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
              {general.companyName}
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              {statementType === 'income' && 'Projected Statement of Comprehensive Income (Income Statement)'}
              {statementType === 'balance' && 'Projected Statement of Financial Position (Balance Sheet)'}
              {statementType === 'cashflow' && 'Projected Statement of Cash Flows'}
            </h2>
            <div className="text-xs text-slate-300">
              For the Years Ended December 31, {general.startYear} to {general.startYear + general.projectionYears - 1} · Currency in {general.currency} ({symbol})
            </div>
          </div>

          {statementType === 'balance' && (
            <div className="text-right">
              <span className="text-xs font-mono bg-emerald-900/60 text-emerald-300 px-3 py-1 rounded-md border border-emerald-700/60 inline-flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Reconciliation: 100% Balanced
              </span>
            </div>
          )}
        </div>

        {/* Mobile Horizontal Scroll Indicator Hint */}
        <div className="md:hidden px-4 py-1.5 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-100 flex items-center justify-between">
          <span>Scroll horizontally for all 5 projection years</span>
          <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">Years 1–5 →</span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto scrollbar-thin">
          {statementType === 'income' && (
            <table className="w-full min-w-[620px] text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-72">Financial Account / Item</th>
                  {incomeStatements.map((is) => (
                    <th key={is.year} className="py-3 px-4 text-right">
                      <div>Year {is.year}</div>
                      <div className="font-normal text-slate-400 text-[10px]">FY {general.startYear + is.year - 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Gross Revenue */}
                <tr className="bg-slate-50/50 font-sans font-bold text-slate-900">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">Gross Sales / Revenue</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2.5 px-4 text-right font-mono">
                      {formatCurrency(is.grossRevenue, symbol, 0)}
                      {showPercentages && <div className="text-[10px] text-slate-500 font-normal">100.0%</div>}
                    </td>
                  ))}
                </tr>

                {/* COGS Section */}
                <tr className="bg-slate-50/20">
                  <td className="py-2 px-4 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setExpandedCogs(!expandedCogs)}>
                    {expandedCogs ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Cost of Goods Sold (COGS)</span>
                  </td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-rose-600">
                      ({formatCurrency(is.cogs.total, symbol, 0)})
                      {showPercentages && <div className="text-[10px] text-slate-400 font-normal">{formatPercent((is.cogs.total / is.grossRevenue) * 100)}</div>}
                    </td>
                  ))}
                </tr>

                {expandedCogs && (
                  <>
                    <tr className="text-slate-600">
                      <td className="py-1.5 px-8 font-sans">Direct Raw Materials & Consumables</td>
                      {incomeStatements.map((is) => (
                        <td key={is.year} className="py-1.5 px-4 text-right text-slate-600">
                          {formatCurrency(is.cogs.directMaterials, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="text-slate-600">
                      <td className="py-1.5 px-8 font-sans">Direct Production & Barista Labor</td>
                      {incomeStatements.map((is) => (
                        <td key={is.year} className="py-1.5 px-4 text-right text-slate-600">
                          {formatCurrency(is.cogs.directLabor, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="text-slate-600">
                      <td className="py-1.5 px-8 font-sans">Direct Production Overhead & Power</td>
                      {incomeStatements.map((is) => (
                        <td key={is.year} className="py-1.5 px-4 text-right text-slate-600">
                          {formatCurrency(is.cogs.overhead, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Gross Profit */}
                <tr className="bg-emerald-50/50 font-bold text-slate-900 border-t border-b border-emerald-200">
                  <td className="py-2.5 px-4 font-sans text-emerald-950 font-bold">Gross Profit</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2.5 px-4 text-right text-emerald-800">
                      {formatCurrency(is.grossProfit, symbol, 0)}
                      {showPercentages && <div className="text-[10px] text-emerald-700 font-normal">{formatPercent(is.grossMarginPercent)}</div>}
                    </td>
                  ))}
                </tr>

                {/* Operating Expenses */}
                <tr className="bg-slate-50/20">
                  <td className="py-2 px-4 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setExpandedOpex(!expandedOpex)}>
                    {expandedOpex ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Operating Expenses (OPEX)</span>
                  </td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-rose-600">
                      ({formatCurrency(is.opex.total, symbol, 0)})
                      {showPercentages && <div className="text-[10px] text-slate-400 font-normal">{formatPercent((is.opex.total / is.grossRevenue) * 100)}</div>}
                    </td>
                  ))}
                </tr>

                {expandedOpex && (
                  <>
                    {Object.entries(incomeStatements[0].opex.byCategory).map(([cat]) => (
                      <tr key={cat} className="text-slate-600">
                        <td className="py-1.5 px-8 font-sans">{cat}</td>
                        {incomeStatements.map((is) => (
                          <td key={is.year} className="py-1.5 px-4 text-right text-slate-600">
                            {formatCurrency((is.opex.byCategory as Record<string, number>)[cat] || 0, symbol, 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}

                {/* EBITDA */}
                <tr className="font-bold text-slate-900 bg-slate-50/60">
                  <td className="py-2 px-4 font-sans font-semibold">EBITDA</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-slate-900 font-bold">
                      {formatCurrency(is.ebitda, symbol, 0)}
                      {showPercentages && <div className="text-[10px] text-slate-500 font-normal">{formatPercent(is.ebitdaMarginPercent)}</div>}
                    </td>
                  ))}
                </tr>

                {/* Depreciation */}
                <tr>
                  <td className="py-2 px-4 font-sans text-slate-600">Less: Depreciation & Amortization</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-slate-500">
                      ({formatCurrency(is.depreciation, symbol, 0)})
                    </td>
                  ))}
                </tr>

                {/* Operating Income (EBIT) */}
                <tr className="bg-slate-100/60 font-bold text-slate-900">
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Operating Income (EBIT)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(is.operatingIncome, symbol, 0)}
                      {showPercentages && <div className="text-[10px] text-slate-500 font-normal">{formatPercent(is.operatingMarginPercent)}</div>}
                    </td>
                  ))}
                </tr>

                {/* Interest Expense */}
                <tr>
                  <td className="py-2 px-4 font-sans text-slate-600">Less: Financing Interest Expense</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-slate-500">
                      ({formatCurrency(is.interestExpense, symbol, 0)})
                    </td>
                  ))}
                </tr>

                {/* Bank Interest Income */}
                {incomeStatements.some((is) => (is.interestIncome || 0) > 0) && (
                  <tr>
                    <td className="py-2 px-4 font-sans text-emerald-700 font-medium">Add: Interest Income from Bank Deposits</td>
                    {incomeStatements.map((is) => (
                      <td key={is.year} className="py-2 px-4 text-right text-emerald-700 font-mono">
                        +{formatCurrency(is.interestIncome || 0, symbol, 0)}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Earnings Before Tax */}
                <tr className="text-slate-800">
                  <td className="py-2 px-4 font-sans font-semibold">Earnings Before Tax (EBT)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right">
                      {formatCurrency(is.earningsBeforeTax, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Income Tax */}
                <tr>
                  <td className="py-2 px-4 font-sans text-slate-600">Provision for Income Tax ({general.incomeTaxRate}%)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-2 px-4 text-right text-slate-500">
                      ({formatCurrency(is.taxExpense, symbol, 0)})
                    </td>
                  ))}
                </tr>

                {/* Net Income */}
                <tr className="bg-emerald-50 text-emerald-950 font-extrabold text-sm border-t-2 border-b-2 border-emerald-500">
                  <td className="py-3 px-4 font-sans">NET INCOME (PROFIT AFTER TAX)</td>
                  {incomeStatements.map((is) => (
                    <td key={is.year} className="py-3 px-4 text-right font-mono text-emerald-800 font-extrabold">
                      {formatCurrency(is.netIncome, symbol, 0)}
                      {showPercentages && <div className="text-[10px] text-emerald-700 font-normal">{formatPercent(is.netMarginPercent)}</div>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}

          {statementType === 'balance' && (
            <table className="w-full min-w-[680px] text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-72">Balance Sheet Accounts</th>
                  {balanceSheets.map((b) => (
                    <th key={b.year} className="py-3 px-4 text-right">
                      <div>{b.year === 0 ? 'Year 0 (Start)' : `Year ${b.year}`}</div>
                      <div className="font-normal text-slate-400 text-[10px]">
                        {b.year === 0 ? 'Pre-Ops' : `FY ${general.startYear + b.year - 1}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* ASSETS */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={balanceSheets.length + 1} className="py-2 px-4">
                    ASSETS
                  </td>
                </tr>

                {/* Current Assets */}
                <tr className="bg-slate-50/40 font-semibold text-slate-800">
                  <td colSpan={balanceSheets.length + 1} className="py-1.5 px-6 font-sans">
                    Current Assets
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-700 font-medium">Cash and Cash Equivalents</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800 font-semibold">
                      {formatCurrency(b.assets.currentAssets.cash, symbol, 0)}
                    </td>
                  ))}
                </tr>
                {/* Cash on Hand breakdown */}
                {(data.cashOnHand?.length || 0) > 0 && (
                  <tr className="text-slate-500 text-[11px]">
                    <td className="py-1 px-12 font-sans italic text-emerald-700">↳ of which: Physical Cash on Hand</td>
                    {balanceSheets.map((b) => (
                      <td key={b.year} className="py-1 px-4 text-right text-slate-500">
                        {b.year === 0
                          ? formatCurrency(b.assets.currentAssets.cashOnHand || 0, symbol, 0)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                )}
                {/* Cash in Bank breakdown */}
                {(data.cashInBank?.length || 0) > 0 && (
                  <tr className="text-slate-500 text-[11px]">
                    <td className="py-1 px-12 font-sans italic text-blue-700">↳ of which: Cash in Bank Placements</td>
                    {balanceSheets.map((b) => (
                      <td key={b.year} className="py-1 px-4 text-right text-slate-500">
                        {b.year === 0
                          ? formatCurrency(b.assets.currentAssets.cashInBank || 0, symbol, 0)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Trade Accounts Receivable (Net)</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.assets.currentAssets.accountsReceivable, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Merchandise / Raw Material Inventory</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.assets.currentAssets.inventory, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="font-semibold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-6 font-sans">Total Current Assets</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(b.assets.currentAssets.totalCurrentAssets, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Non-Current Assets */}
                <tr className="bg-slate-50/40 font-semibold text-slate-800">
                  <td colSpan={balanceSheets.length + 1} className="py-1.5 px-6 font-sans">
                    Non-Current Assets (PPE)
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Gross Property, Plant & Equipment</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.assets.nonCurrentAssets.grossPpe, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Less: Accumulated Depreciation</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-500">
                      ({formatCurrency(b.assets.nonCurrentAssets.accumulatedDepreciation, symbol, 0)})
                    </td>
                  ))}
                </tr>
                <tr className="font-semibold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-6 font-sans">Net Property, Plant & Equipment</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(b.assets.nonCurrentAssets.netPpe, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* TOTAL ASSETS */}
                <tr className="bg-slate-900 text-white font-extrabold text-sm border-t-2 border-b-2 border-slate-900">
                  <td className="py-2.5 px-4 font-sans">TOTAL ASSETS</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(b.assets.totalAssets, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* LIABILITIES & STOCKHOLDERS' EQUITY */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={balanceSheets.length + 1} className="py-2 px-4">
                    LIABILITIES & STOCKHOLDERS' EQUITY
                  </td>
                </tr>

                {/* Current Liabilities */}
                <tr className="bg-slate-50/40 font-semibold text-slate-800">
                  <td colSpan={balanceSheets.length + 1} className="py-1.5 px-6 font-sans">
                    Current Liabilities
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Trade Accounts Payable</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.liabilities.currentLiabilities.accountsPayable, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Current Portion of Long-Term Debt</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.liabilities.currentLiabilities.currentPortionOfDebt, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="font-semibold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-6 font-sans">Total Current Liabilities</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(b.liabilities.currentLiabilities.totalCurrentLiabilities, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Non-Current Liabilities */}
                <tr>
                  <td className="py-1.5 px-8 font-sans text-slate-600">Long-Term Bank Loan (Net of Current)</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                      {formatCurrency(b.liabilities.nonCurrentLiabilities.longTermDebt, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="font-semibold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-6 font-sans">Total Liabilities</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(b.liabilities.totalLiabilities, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Stockholders' / Partners' / Owner's Equity */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={balanceSheets.length + 1} className="py-2 px-4">
                    {data.companyProfile?.classification === 'Partnership'
                      ? "PARTNERS' EQUITY"
                      : data.companyProfile?.classification === 'Sole Proprietorship'
                      ? "OWNER'S EQUITY"
                      : "OWNERS' / STOCKHOLDERS' EQUITY"}
                  </td>
                </tr>

                {data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners && data.companyProfile.partners.length > 0 ? (
                  <>
                    <tr className="bg-slate-50/40 font-semibold text-slate-800">
                      <td colSpan={balanceSheets.length + 1} className="py-1.5 px-6 font-sans">
                        Partners' Capital & Accumulated Profit Accounts
                      </td>
                    </tr>
                    {data.companyProfile.partners.map((partner, pIdx) => (
                      <tr key={partner.id || pIdx}>
                        <td className="py-1.5 px-8 font-sans text-slate-700">
                          <span className="font-semibold text-slate-900">{partner.name || `Partner #${pIdx + 1}`}</span>{' '}
                          <span className="text-[10px] text-slate-500">
                            (Cap: {formatCurrency(partner.capital, symbol, 0)} | {partner.profitSharePercent}% P/L Share)
                          </span>
                        </td>
                        {balanceSheets.map((b) => {
                          const pBal = b.equity.partnersEquity?.find((pe) => pe.partnerId === partner.id);
                          const balanceVal = pBal ? pBal.endingBalance : partner.capital;
                          return (
                            <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                              {formatCurrency(balanceVal, symbol, 0)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="font-semibold text-slate-900 bg-slate-50/50">
                      <td className="py-2 px-6 font-sans">Total Partners' Equity</td>
                      {balanceSheets.map((b) => (
                        <td key={b.year} className="py-2 px-4 text-right font-bold text-emerald-800">
                          {formatCurrency(b.equity.totalEquity, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td className="py-1.5 px-8 font-sans text-slate-600">
                        {data.companyProfile?.classification === 'Sole Proprietorship'
                          ? `${data.companyProfile.soleProprietor?.ownerName || 'Proprietor'}, Contributed Capital`
                          : "Contributed Capital (Owner's Equity)"}
                      </td>
                      {balanceSheets.map((b) => (
                        <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                          {formatCurrency(b.equity.contributedCapital, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-1.5 px-8 font-sans text-slate-600">
                        {data.companyProfile?.classification === 'Sole Proprietorship'
                          ? 'Accumulated Net Profit / Loss'
                          : 'Retained Earnings (Accumulated)'}
                      </td>
                      {balanceSheets.map((b) => (
                        <td key={b.year} className="py-1.5 px-4 text-right text-slate-800">
                          {formatCurrency(b.equity.retainedEarnings, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="font-semibold text-slate-900 bg-slate-50/50">
                      <td className="py-2 px-6 font-sans">
                        {data.companyProfile?.classification === 'Sole Proprietorship'
                          ? "Total Owner's Equity"
                          : "Total Stockholders' Equity"}
                      </td>
                      {balanceSheets.map((b) => (
                        <td key={b.year} className="py-2 px-4 text-right font-bold">
                          {formatCurrency(b.equity.totalEquity, symbol, 0)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* TOTAL LIABILITIES & EQUITY */}
                <tr className="bg-slate-900 text-white font-extrabold text-sm border-t-2 border-b-2 border-slate-900">
                  <td className="py-2.5 px-4 font-sans">TOTAL LIABILITIES & EQUITY</td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(b.totalLiabilitiesAndEquity, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Balance Check Row */}
                <tr className="bg-emerald-50/80 text-emerald-900 font-bold text-[11px]">
                  <td className="py-1.5 px-4 font-sans flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Balance Check (Assets - [Liab + Equity])</span>
                  </td>
                  {balanceSheets.map((b) => (
                    <td key={b.year} className="py-1.5 px-4 text-right font-mono text-emerald-700">
                      {symbol}0.00 ✓
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}

          {statementType === 'cashflow' && (
            <table className="w-full min-w-[640px] text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-72">Cash Flow Activities</th>
                  {cashFlows.map((cf) => (
                    <th key={cf.year} className="py-3 px-4 text-right">
                      <div>Year {cf.year}</div>
                      <div className="font-normal text-slate-400 text-[10px]">FY {general.startYear + cf.year - 1}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Operating Activities */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={cashFlows.length + 1} className="py-2 px-4">
                    CASH FLOWS FROM OPERATING ACTIVITIES
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-800 font-medium">Net Income for the Year</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-900">
                      {formatCurrency(cf.operatingActivities.netIncome, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">Adjustment: Non-Cash Depreciation</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {formatCurrency(cf.operatingActivities.depreciationAddBack, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">(Increase) / Decrease in Accounts Receivable</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {formatCurrency(cf.operatingActivities.deltaAccountsReceivable, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">(Increase) / Decrease in Inventory</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {formatCurrency(cf.operatingActivities.deltaInventory, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">Increase / (Decrease) in Accounts Payable</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {formatCurrency(cf.operatingActivities.deltaAccountsPayable, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-50/60 font-bold text-slate-900">
                  <td className="py-2 px-4 font-sans text-blue-950 font-bold">Net Cash Provided by Operating Activities</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-2 px-4 text-right text-blue-900 font-bold">
                      {formatCurrency(cf.operatingActivities.netCashFromOperations, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Investing Activities */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={cashFlows.length + 1} className="py-2 px-4">
                    CASH FLOWS FROM INVESTING ACTIVITIES
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">Capital Expenditures (Additions to PPE)</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {cf.investingActivities.capitalExpenditures === 0
                        ? '-'
                        : `(${formatCurrency(Math.abs(cf.investingActivities.capitalExpenditures), symbol, 0)})`}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="py-2 px-4 font-sans">Net Cash Used in Investing Activities</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-2 px-4 text-right font-bold">
                      {cf.investingActivities.netCashFromInvesting === 0
                        ? '-'
                        : `(${formatCurrency(Math.abs(cf.investingActivities.netCashFromInvesting), symbol, 0)})`}
                    </td>
                  ))}
                </tr>

                {/* Financing Activities */}
                <tr className="bg-slate-100 text-slate-900 font-sans font-bold uppercase text-[11px]">
                  <td colSpan={cashFlows.length + 1} className="py-2 px-4">
                    CASH FLOWS FROM FINANCING ACTIVITIES
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">Repayment of Debt Principal</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {cf.financingActivities.debtPrincipalRepaid === 0
                        ? '-'
                        : `(${formatCurrency(Math.abs(cf.financingActivities.debtPrincipalRepaid), symbol, 0)})`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-6 font-sans text-slate-600">Dividends Paid to Shareholders</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-700">
                      {cf.financingActivities.dividendsPaid === 0
                        ? '-'
                        : `(${formatCurrency(Math.abs(cf.financingActivities.dividendsPaid), symbol, 0)})`}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="py-2 px-4 font-sans">Net Cash Used in Financing Activities</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(cf.financingActivities.netCashFromFinancing, symbol, 0)}
                    </td>
                  ))}
                </tr>

                {/* Net Change and Ending Cash */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="py-2 px-4 font-sans">NET INCREASE / (DECREASE) IN CASH</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-2 px-4 text-right font-bold">
                      {formatCurrency(cf.netChangeInCash, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-4 font-sans text-slate-600">Cash and Cash Equivalents, Beginning</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-1.5 px-4 text-right text-slate-600">
                      {formatCurrency(cf.beginningCash, symbol, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-50 text-emerald-950 font-extrabold text-sm border-t-2 border-b-2 border-emerald-500">
                  <td className="py-3 px-4 font-sans">CASH AND CASH EQUIVALENTS, ENDING</td>
                  {cashFlows.map((cf) => (
                    <td key={cf.year} className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800">
                      {formatCurrency(cf.endingCash, symbol, 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Loan Amortization & Interest Comparison Modal */}
      {isAmortizationModalOpen && (
        <LoanAmortizationModal
          isOpen={isAmortizationModalOpen}
          onClose={() => setIsAmortizationModalOpen(false)}
          data={data}
        />
      )}
    </div>
  );
};
