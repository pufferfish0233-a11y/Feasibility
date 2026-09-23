import React, { useState, useMemo } from 'react';
import { FeasibilityModelData } from '../types/feasibility';
import { calculateDebtSchedule, formatCurrency } from '../utils/financialCalculations';
import {
  X,
  Calculator,
  Landmark,
  Coins,
  Scale,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Percent,
  Calendar,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  HelpCircle,
} from 'lucide-react';

interface LoanAmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FeasibilityModelData;
}

export const LoanAmortizationModal: React.FC<LoanAmortizationModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'amortization' | 'interestReceived'>('comparison');
  const [amortizationView, setAmortizationView] = useState<'annual' | 'monthly'>('annual');
  const [copied, setCopied] = useState(false);

  const { financing, general } = data;
  const symbol = general.currencySymbol || '$';
  const projectionYears = general.projectionYears || 5;

  const isLoanActive =
    financing.hasLoan !== false &&
    ((financing.loanPrincipal || 0) > 0 || (Boolean(financing.bankName) && financing.bankName!.length > 0));
  const principal = isLoanActive ? financing.loanPrincipal || 0 : 0;
  const rate = financing.loanInterestRate || 0;
  const termYears = financing.loanTermYears || 5;
  const graceYears = financing.gracePeriodYears || 0;
  const bankName = financing.bankName || 'Commercial Bank';

  // Bank Deposits
  const cashInBank = data.cashInBank || [];
  const totalCashInBank = cashInBank.reduce((sum, item) => sum + (Number(item.depositAmount) || 0), 0);
  const totalAnnualInterestReceived = cashInBank.reduce(
    (sum, item) => sum + (Number(item.depositAmount) || 0) * ((Number(item.annualInterestRate) || 0) / 100),
    0
  );
  const blendedDepositRate = totalCashInBank > 0 ? (totalAnnualInterestReceived / totalCashInBank) * 100 : 0;

  // Annual Debt Schedule (5 years projection)
  const annualDebtSchedule = useMemo(() => {
    return calculateDebtSchedule(principal, rate, termYears, graceYears, projectionYears);
  }, [principal, rate, termYears, graceYears, projectionYears]);

  // Full Tenor Debt Schedule (for lifetime loan amortization)
  const fullTenorDebtSchedule = useMemo(() => {
    return calculateDebtSchedule(principal, rate, termYears, graceYears, Math.max(termYears, projectionYears));
  }, [principal, rate, termYears, graceYears, projectionYears]);

  // Monthly Amortization Schedule (for the full tenor or first 60 months)
  const monthlyAmortizationSchedule = useMemo(() => {
    if (principal <= 0 || termYears <= 0) return [];

    const totalMonths = termYears * 12;
    const graceMonths = graceYears * 12;
    const repayMonths = Math.max(1, totalMonths - graceMonths);
    const rm = (rate / 100) / 12;

    const monthlyPayment =
      rm === 0
        ? principal / repayMonths
        : (principal * (rm * Math.pow(1 + rm, repayMonths))) / (Math.pow(1 + rm, repayMonths) - 1);

    const rows = [];
    let currentBalance = principal;
    let cumInterest = 0;
    let cumPrincipal = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const begBalance = currentBalance;
      if (begBalance <= 0) {
        rows.push({
          month: m,
          year: Math.ceil(m / 12),
          monthInYear: ((m - 1) % 12) + 1,
          beginningBalance: 0,
          payment: 0,
          principalPaid: 0,
          interestPaid: 0,
          endingBalance: 0,
          cumulativeInterest: cumInterest,
          cumulativePrincipal: cumPrincipal,
        });
        continue;
      }

      const interest = begBalance * rm;
      let princPaid = 0;

      if (m <= graceMonths) {
        princPaid = 0;
      } else if (m <= totalMonths) {
        princPaid = Math.min(begBalance, monthlyPayment - interest);
        if (m === totalMonths || princPaid > begBalance) {
          princPaid = begBalance;
        }
      } else {
        princPaid = begBalance;
      }

      const endBalance = Math.max(0, begBalance - princPaid);
      currentBalance = endBalance;
      cumInterest += interest;
      cumPrincipal += princPaid;

      rows.push({
        month: m,
        year: Math.ceil(m / 12),
        monthInYear: ((m - 1) % 12) + 1,
        beginningBalance: begBalance,
        payment: m <= graceMonths ? interest : princPaid + interest,
        principalPaid: princPaid,
        interestPaid: interest,
        endingBalance: endBalance,
        cumulativeInterest: cumInterest,
        cumulativePrincipal: cumPrincipal,
      });
    }

    return rows;
  }, [principal, rate, termYears, graceYears]);

  // Totals for 5-Year Projection Period
  const totalLoanInterest5Y = annualDebtSchedule.reduce((sum, row) => sum + row.interestPaid, 0);
  const totalPrincipalRepaid5Y = annualDebtSchedule.reduce((sum, row) => sum + row.principalPaid, 0);
  const totalDebtService5Y = annualDebtSchedule.reduce((sum, row) => sum + row.totalPayment, 0);

  // Totals for Full Loan Lifetime
  const totalLoanInterestLifetime = fullTenorDebtSchedule.reduce((sum, row) => sum + row.interestPaid, 0);
  const totalDebtServiceLifetime = fullTenorDebtSchedule.reduce((sum, row) => sum + row.totalPayment, 0);

  // Bank Deposit Interest Totals over 5 years
  const totalInterestReceived5Y = totalAnnualInterestReceived * projectionYears;

  // Comparison Metrics (5-Year Horizon)
  const netInterest5Y = totalInterestReceived5Y - totalLoanInterest5Y;
  const isNetSurplus = netInterest5Y >= 0;
  const interestOffsetPercentage =
    totalLoanInterest5Y > 0 ? (totalInterestReceived5Y / totalLoanInterest5Y) * 100 : totalInterestReceived5Y > 0 ? 100 : 0;

  // Year-by-Year Comparison Data (Years 1 to 5)
  const yearlyComparisonRows = useMemo(() => {
    return Array.from({ length: projectionYears }, (_, idx) => {
      const year = idx + 1;
      const loanRow = annualDebtSchedule.find((r) => r.year === year);
      const interestPaid = loanRow ? loanRow.interestPaid : 0;
      const interestReceived = totalAnnualInterestReceived;
      const netInterest = interestReceived - interestPaid;
      const offsetPct = interestPaid > 0 ? (interestReceived / interestPaid) * 100 : 100;

      return {
        year,
        loanInterestPaid: interestPaid,
        bankInterestReceived: interestReceived,
        netInterest,
        offsetPct,
      };
    });
  }, [projectionYears, annualDebtSchedule, totalAnnualInterestReceived]);

  if (!isOpen) return null;

  // Handle Copy Table TSV for Excel
  const handleCopyTable = () => {
    let tsv = '';
    if (activeTab === 'comparison') {
      tsv = 'Year\tInterest Paid on Loan\tInterest Received from Bank Deposits\tNet Interest (Received - Paid)\tOffset %\n';
      yearlyComparisonRows.forEach((r) => {
        tsv += `Year ${r.year}\t${r.loanInterestPaid.toFixed(2)}\t${r.bankInterestReceived.toFixed(2)}\t${r.netInterest.toFixed(2)}\t${r.offsetPct.toFixed(1)}%\n`;
      });
      tsv += `Total (5 Years)\t${totalLoanInterest5Y.toFixed(2)}\t${totalInterestReceived5Y.toFixed(2)}\t${netInterest5Y.toFixed(2)}\t${interestOffsetPercentage.toFixed(1)}%\n`;
    } else if (activeTab === 'amortization') {
      if (amortizationView === 'annual') {
        tsv = 'Year\tBeginning Balance\tTotal Debt Service\tPrincipal Repaid\tInterest Paid\tEnding Balance\n';
        annualDebtSchedule.forEach((r) => {
          tsv += `Year ${r.year}\t${r.beginningBalance.toFixed(2)}\t${r.totalPayment.toFixed(2)}\t${r.principalPaid.toFixed(2)}\t${r.interestPaid.toFixed(2)}\t${r.endingBalance.toFixed(2)}\n`;
        });
      } else {
        tsv = 'Month\tYear\tBeginning Balance\tTotal Payment\tPrincipal\tInterest\tEnding Balance\tCumulative Interest\n';
        monthlyAmortizationSchedule.forEach((r) => {
          tsv += `${r.month}\tYear ${r.year}\t${r.beginningBalance.toFixed(2)}\t${r.payment.toFixed(2)}\t${r.principalPaid.toFixed(2)}\t${r.interestPaid.toFixed(2)}\t${r.endingBalance.toFixed(2)}\t${r.cumulativeInterest.toFixed(2)}\n`;
        });
      }
    } else {
      tsv = 'Bank Name\tAccount Type\tDeposit Amount\tAnnual Interest Rate (%)\tAnnual Interest Earned\t5-Year Cumulative Interest\tReference / Notes\n';
      cashInBank.forEach((item) => {
        const annual = (Number(item.depositAmount) || 0) * ((Number(item.annualInterestRate) || 0) / 100);
        tsv += `${item.bankName}\t${item.accountType}\t${(item.depositAmount || 0).toFixed(2)}\t${item.annualInterestRate}%\t${annual.toFixed(2)}\t${(annual * 5).toFixed(2)}\t${item.accountNumberOrRef || item.notes || ''}\n`;
      });
    }

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Loan Amortization & Interest Comparison
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Paid vs. Received
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Comprehensive schedule of loan debt service, bank deposit interest yields, and net financing cost analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-6 bg-slate-50/80 border-b border-slate-200 shrink-0">
          {/* Card 1: Loan Financing (Interest Paid) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                Commercial Bank Loan
              </span>
              <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-indigo-50 text-indigo-700">
                {rate}% p.a.
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                {bankName} · {termYears} Yrs {graceYears > 0 ? `(${graceYears}y Grace)` : ''}
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(principal, symbol, 0)} Principal
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-sans">5-Yr Interest Paid:</span>
              <span className="font-bold text-rose-600">
                ({formatCurrency(totalLoanInterest5Y, symbol, 0)})
              </span>
            </div>
          </div>

          {/* Card 2: Bank Deposits (Interest Received) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                Bank Deposit Placements
              </span>
              <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-emerald-50 text-emerald-700">
                Avg {blendedDepositRate.toFixed(2)}% p.a.
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                {cashInBank.length} Active Accounts Across Commercial Banks
              </div>
              <div className="text-lg font-bold font-mono text-blue-950 mt-0.5">
                {formatCurrency(totalCashInBank, symbol, 0)} Placed
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-sans">5-Yr Interest Earned:</span>
              <span className="font-bold text-emerald-700">
                +{formatCurrency(totalInterestReceived5Y, symbol, 0)}
              </span>
            </div>
          </div>

          {/* Card 3: Net Interest Differential (Spread) */}
          <div className={`p-4 rounded-xl border shadow-2xs space-y-2 ${
            isNetSurplus
              ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200'
              : 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                Net Financing Cost / (Surplus)
              </span>
              <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                isNetSurplus ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {interestOffsetPercentage.toFixed(1)}% Offset
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                {isNetSurplus
                  ? 'Interest received exceeds loan financing expense'
                  : 'Deposit earnings partially defray debt borrowing costs'}
              </div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${
                isNetSurplus ? 'text-emerald-700' : 'text-slate-900'
              }`}>
                {isNetSurplus ? '+' : ''}{formatCurrency(netInterest5Y, symbol, 0)} (5-Yr Net)
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-sans">Annual Net Cost:</span>
              <span className={`font-bold ${isNetSurplus ? 'text-emerald-700' : 'text-slate-800'}`}>
                {isNetSurplus ? '+' : ''}{formatCurrency(netInterest5Y / projectionYears, symbol, 0)}/yr
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection & Table Actions Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Main Tab Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>1. Interest Paid vs. Received Comparison</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('amortization')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'amortization'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>2. Loan Amortization Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interestReceived')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'interestReceived'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>3. Bank Deposits & Interest Received ({cashInBank.length})</span>
            </button>
          </div>

          {/* Sub Controls / Copy TSV */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'amortization' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAmortizationView('annual')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    amortizationView === 'annual'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annual Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setAmortizationView('monthly')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    amortizationView === 'monthly'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly ({monthlyAmortizationSchedule.length} Mos)
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyTable}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Copy active table to clipboard to paste into Excel or Sheets"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied TSV!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Table (Excel)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: COMPARISON OF INTEREST PAID AND RECEIVED */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Insight Box */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-emerald-50/70 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Interest Spread & Debt Neutralization Analysis</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed max-w-2xl">
                    By strategically maintaining cash balances in interest-bearing commercial deposit accounts, the business offsets{' '}
                    <strong className="text-indigo-900 font-bold font-mono">{interestOffsetPercentage.toFixed(1)}%</strong> of its loan interest obligations over the 5-year projection horizon.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans">Avg Borrowing Rate</span>
                    <span className="font-bold text-slate-900 text-sm">{rate}% p.a.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans">Avg Deposit Yield</span>
                    <span className="font-bold text-emerald-700 text-sm">{blendedDepositRate.toFixed(2)}% p.a.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-sans">Net Spread</span>
                    <span className={`font-bold text-sm ${rate > blendedDepositRate ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {(rate - blendedDepositRate).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Year-by-Year Comparison Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                    <span>Annual Interest Paid vs. Interest Received Matrix</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Currency: {general.currency} ({symbol})
                  </span>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[700px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2.5 px-4 w-28">Projection Period</th>
                        <th className="py-2.5 px-4 text-right">
                          <span className="text-rose-700 block">Interest Paid on Loan</span>
                          <span className="font-normal text-[10px] text-slate-500">Debt Financing Expense</span>
                        </th>
                        <th className="py-2.5 px-4 text-right">
                          <span className="text-emerald-700 block">Interest Received from Banks</span>
                          <span className="font-normal text-[10px] text-slate-500">Commercial Deposit Revenue</span>
                        </th>
                        <th className="py-2.5 px-4 text-right">
                          <span className="text-slate-900 block">Net Interest Impact</span>
                          <span className="font-normal text-[10px] text-slate-500">Received − Paid</span>
                        </th>
                        <th className="py-2.5 px-4 text-center">Offset Coverage</th>
                        <th className="py-2.5 px-4">Financial Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {yearlyComparisonRows.map((row) => {
                        const isSurplusRow = row.netInterest >= 0;
                        return (
                          <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-sans font-bold text-slate-800">
                              Year {row.year}{' '}
                              <span className="text-slate-400 font-normal font-mono text-[11px]">
                                (FY {general.startYear + row.year - 1})
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-rose-600 font-bold">
                              ({formatCurrency(row.loanInterestPaid, symbol, 0)})
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                              +{formatCurrency(row.bankInterestReceived, symbol, 0)}
                            </td>
                            <td className={`py-2.5 px-4 text-right font-bold text-sm ${
                              isSurplusRow ? 'text-emerald-700' : 'text-slate-900'
                            }`}>
                              {isSurplusRow ? '+' : ''}{formatCurrency(row.netInterest, symbol, 0)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                row.offsetPct >= 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.offsetPct >= 50
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {row.offsetPct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-sans text-xs">
                              {row.loanInterestPaid === 0 ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Debt Fully Retired; 100% Pure Yield
                                </span>
                              ) : isSurplusRow ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <TrendingUp className="w-3.5 h-3.5" /> Net Interest Surplus (+{formatCurrency(row.netInterest, symbol, 0)})
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  Deposit interest reduces net financing burden by {row.offsetPct.toFixed(0)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                        <td className="py-3 px-4 font-sans uppercase">Total 5-Year Impact</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-300 text-sm">
                          ({formatCurrency(totalLoanInterest5Y, symbol, 0)})
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                          +{formatCurrency(totalInterestReceived5Y, symbol, 0)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono text-sm ${
                          isNetSurplus ? 'text-emerald-300' : 'text-indigo-200'
                        }`}>
                          {isNetSurplus ? '+' : ''}{formatCurrency(netInterest5Y, symbol, 0)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-300">
                          {interestOffsetPercentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-sans text-[11px] font-normal text-slate-300">
                          {isNetSurplus
                            ? 'Net positive interest yield across the 5-year investment period.'
                            : 'Cumulative net financing expense after deducting all deposit interest earned.'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Side-by-Side Visual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-rose-600" />
                      Loan Debt Service Summary
                    </span>
                    <span className="text-rose-600 font-mono font-bold">
                      {formatCurrency(totalDebtService5Y, symbol, 0)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Loan Principal Borrowed:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(principal, symbol, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Principal Repaid (Years 1–5):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(totalPrincipalRepaid5Y, symbol, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Interest Paid to Bank (Years 1–5):</span>
                      <span className="font-mono font-bold text-rose-600">({formatCurrency(totalLoanInterest5Y, symbol, 0)})</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1">
                      <span>Full Lifetime Interest (All {termYears} Yrs):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(totalLoanInterestLifetime, symbol, 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      Bank Placements Yield Summary
                    </span>
                    <span className="text-emerald-700 font-mono font-bold">
                      +{formatCurrency(totalInterestReceived5Y, symbol, 0)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Total Deposit Placements:</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCashInBank, symbol, 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Number of Bank Accounts:</span>
                      <span className="font-mono font-bold text-slate-900">{cashInBank.length} Accounts</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>Annual Interest Income Earned:</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatCurrency(totalAnnualInterestReceived, symbol, 0)}/yr</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 py-1">
                      <span>5-Year Cumulative Bank Earnings:</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatCurrency(totalInterestReceived5Y, symbol, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOAN AMORTIZATION SCHEDULE */}
          {activeTab === 'amortization' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {bankName} Amortization Schedule ({amortizationView === 'annual' ? 'Annual Overview' : 'Monthly Breakdown'})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Principal: {formatCurrency(principal, symbol, 0)} · Rate: {rate}% p.a. · Tenor: {termYears} Years {graceYears > 0 ? `(${graceYears}y Grace)` : ''}
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Total Debt Service: {formatCurrency(totalDebtServiceLifetime, symbol, 0)}
                </div>
              </div>

              {principal <= 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <Landmark className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No Bank Loan Active</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The project is currently 100% equity financed without commercial debt. You can activate a bank loan under the Pre-Operating Capital module.
                  </p>
                </div>
              ) : amortizationView === 'annual' ? (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[680px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4 text-right">Beginning Balance</th>
                        <th className="py-2.5 px-4 text-right">Annual Payment (Debt Service)</th>
                        <th className="py-2.5 px-4 text-right">Principal Repayment</th>
                        <th className="py-2.5 px-4 text-right">Interest Paid ({rate}%)</th>
                        <th className="py-2.5 px-4 text-right">Ending Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {fullTenorDebtSchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-4 font-sans font-semibold text-slate-900">
                            Year {row.year}
                            {row.year <= projectionYears && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-sans">
                                FY {general.startYear + row.year - 1}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-800">
                            {formatCurrency(row.beginningBalance, symbol, 0)}
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(row.totalPayment, symbol, 0)}
                          </td>
                          <td className="py-2 px-4 text-right text-indigo-700 font-bold">
                            {formatCurrency(row.principalPaid, symbol, 0)}
                          </td>
                          <td className="py-2 px-4 text-right text-rose-600 font-bold">
                            {formatCurrency(row.interestPaid, symbol, 0)}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-800">
                            {formatCurrency(row.endingBalance, symbol, 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 font-mono">
                        <td className="py-2.5 px-4 font-sans">Total Lifetime Loan Service</td>
                        <td className="py-2.5 px-4 text-right">—</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(totalDebtServiceLifetime, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-indigo-800 font-bold">
                          {formatCurrency(principal, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-rose-600 font-bold">
                          {formatCurrency(totalLoanInterestLifetime, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right">{symbol}0</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl max-h-[460px]">
                  <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold z-10 shadow-2xs">
                      <tr>
                        <th className="py-2 px-3">Month</th>
                        <th className="py-2 px-3">Year / Month</th>
                        <th className="py-2 px-3 text-right">Beginning Balance</th>
                        <th className="py-2 px-3 text-right">Payment</th>
                        <th className="py-2 px-3 text-right">Principal</th>
                        <th className="py-2 px-3 text-right">Interest</th>
                        <th className="py-2 px-3 text-right">Ending Balance</th>
                        <th className="py-2 px-3 text-right">Cum. Interest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {monthlyAmortizationSchedule.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-1.5 px-3 font-sans font-bold text-slate-800">
                            Month {m.month}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-slate-500 text-[11px]">
                            Y{m.year} · M{m.monthInYear}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-700">
                            {formatCurrency(m.beginningBalance, symbol, 0)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(m.payment, symbol, 0)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-indigo-700">
                            {formatCurrency(m.principalPaid, symbol, 0)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-rose-600">
                            {formatCurrency(m.interestPaid, symbol, 0)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-700">
                            {formatCurrency(m.endingBalance, symbol, 0)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-500 font-normal">
                            {formatCurrency(m.cumulativeInterest, symbol, 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BANK DEPOSITS & INTEREST RECEIVED */}
          {activeTab === 'interestReceived' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bank Deposit Accounts & Interest Yield Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed schedule of cash deposited across commercial partner banks and corresponding interest revenue
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 font-bold">
                    Deposits: {formatCurrency(totalCashInBank, symbol, 0)}
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-bold">
                    Yield: +{formatCurrency(totalAnnualInterestReceived, symbol, 0)}/yr
                  </div>
                </div>
              </div>

              {cashInBank.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-blue-200 rounded-xl space-y-2 bg-blue-50/20">
                  <Coins className="w-8 h-8 text-blue-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">No Bank Deposit Accounts Configured</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Configure commercial bank deposits in the Pre-Operating module (Cash in Bank) to earn annual interest yields.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-50/70 border-b border-blue-200 text-slate-700 font-semibold">
                        <th className="py-2.5 px-4">Commercial Bank</th>
                        <th className="py-2.5 px-4">Account Type</th>
                        <th className="py-2.5 px-4 text-right">Principal Placed ({symbol})</th>
                        <th className="py-2.5 px-4 text-right">Annual Rate (% p.a.)</th>
                        <th className="py-2.5 px-4 text-right">Annual Interest Earned ({symbol}/yr)</th>
                        <th className="py-2.5 px-4 text-right">5-Year Cumulative Yield ({symbol})</th>
                        <th className="py-2.5 px-4">Account Reference / Operating Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {cashInBank.map((item) => {
                        const annualInterest = (Number(item.depositAmount) || 0) * ((Number(item.annualInterestRate) || 0) / 100);
                        const cumulative5Y = annualInterest * projectionYears;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-4 font-sans font-bold text-slate-900 flex items-center gap-2">
                              <Building className="w-3.5 h-3.5 text-blue-600" />
                              <span>{item.bankName}</span>
                            </td>
                            <td className="py-2 px-4 font-sans text-slate-700">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                                {item.accountType}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-slate-900">
                              {formatCurrency(item.depositAmount, symbol, 0)}
                            </td>
                            <td className="py-2 px-4 text-right text-indigo-700 font-bold">
                              {item.annualInterestRate}%
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-emerald-700">
                              +{formatCurrency(annualInterest, symbol, 0)}
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-emerald-800">
                              +{formatCurrency(cumulative5Y, symbol, 0)}
                            </td>
                            <td className="py-2 px-4 font-sans text-slate-600 text-xs">
                              {item.accountNumberOrRef || item.notes || 'Operating liquidity deposit'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/80 border-t-2 border-blue-300 font-bold text-slate-900 font-mono">
                        <td className="py-2.5 px-4 font-sans" colSpan={2}>
                          Total Bank Placements ({cashInBank.length} Accounts)
                        </td>
                        <td className="py-2.5 px-4 text-right text-blue-950 font-bold text-sm">
                          {formatCurrency(totalCashInBank, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-indigo-700">
                          Avg {blendedDepositRate.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold text-sm">
                          +{formatCurrency(totalAnnualInterestReceived, symbol, 0)}/yr
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-800 font-bold text-sm">
                          +{formatCurrency(totalInterestReceived5Y, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-[11px] font-normal text-slate-500 italic">
                          *Interest earned compounds into Net Income and Balance Sheet assets.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              All schedules are dynamically computed from your active financing and commercial bank deposit parameters.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs self-end sm:self-auto"
          >
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
