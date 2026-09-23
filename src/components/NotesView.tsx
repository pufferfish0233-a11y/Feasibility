import React, { useState } from 'react';
import { FeasibilityModelData, ProjectedResults } from '../types/feasibility';
import { formatCurrency, formatPercent } from '../utils/financialCalculations';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  BookOpen,
  DollarSign,
  Package,
  Layers,
  Banknote,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface NotesViewProps {
  data: FeasibilityModelData;
  results: ProjectedResults;
}

export const NotesView: React.FC<NotesViewProps> = ({ data, results }) => {
  const { general, policies, products, opex, capex, financing } = data;
  const { incomeStatements, debtSchedule } = results;
  const symbol = general.currencySymbol || '$';

  const [expandedNote, setExpandedNote] = useState<number | null>(null);

  const toggleNote = (num: number) => {
    setExpandedNote(expandedNote === num ? null : num);
  };

  const expandAll = () => setExpandedNote(-1);
  const collapseAll = () => setExpandedNote(null);

  const isExpanded = (num: number) => expandedNote === -1 || expandedNote === num;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Notes to Projected Financial Statements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative accounting policies, disclosure notes, costing formulations, and supporting roll-forward schedules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Expand All Notes
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Note 1: General Information & Project Scope */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(1)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                01
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 1: Corporate Profile & Scope of Feasibility Study
                </h3>
                <span className="text-xs text-slate-500">
                  Entity details, project objectives, study horizon, and reporting framework
                </span>
              </div>
            </div>
            {isExpanded(1) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(1) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entity Name</span>
                  <span className="font-bold text-slate-900">{data.companyProfile?.entityName || general.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Legal Classification</span>
                  <span className="font-bold text-slate-900 font-mono text-indigo-700">
                    {data.companyProfile?.classification || 'Sole Proprietorship'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Nature</span>
                  <span className="font-bold text-slate-900">{data.companyProfile?.nature || general.industry}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Projection Horizon</span>
                  <span className="font-bold text-slate-900">{general.projectionYears} Years ({general.startYear} – {general.startYear + general.projectionYears - 1})</span>
                </div>
              </div>

              {/* Purpose and Scope */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-indigo-900 font-bold text-xs uppercase tracking-wider block">
                  Purpose of the Entity / Study
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {data.companyProfile?.purpose || general.projectDescription || 'Establishment of commercial operations and evaluation of financial feasibility.'}
                </p>
              </div>

              {/* Ownership & Contributed Capital Schedule */}
              <div className="space-y-2">
                <span className="text-slate-900 font-bold text-xs uppercase tracking-wider block">
                  {data.companyProfile?.classification === 'Partnership'
                    ? "Partners' Contributed Capital & Profit/Loss Sharing Agreement"
                    : "Owner's Contributed Equity Profile"}
                </span>

                {data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3 text-left">Partner Name</th>
                          <th className="py-2 px-3 text-right">Capital Contribution ({symbol})</th>
                          <th className="py-2 px-3 text-right">Capital Share %</th>
                          <th className="py-2 px-3 text-right">Agreed Profit/Loss Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.companyProfile.partners.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{p.name || `Partner #${idx + 1}`}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(p.capital, symbol, 0)}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {((p.capital / (financing.initialEquity || 1)) * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {p.profitSharePercent}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-2 px-3">Total Partnership Equity</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(financing.initialEquity, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right font-mono">100.0%</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-800">
                            {data.companyProfile.partners.reduce((s, p) => s + (p.profitSharePercent || 0), 0)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">
                        Sole Proprietor: {data.companyProfile?.soleProprietor?.ownerName || general.preparedBy || 'Owner'}
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Holds 100% proprietary equity interest and assumes all profits and liabilities.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Initial Contributed Capital</span>
                      <div className="font-bold font-mono text-emerald-700 text-sm">
                        {formatCurrency(
                          data.companyProfile?.soleProprietor?.capital ?? financing.initialEquity ?? 0,
                          symbol,
                          0
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none leading-relaxed text-slate-600">
                <p>
                  <strong>Project Objective:</strong> {general.projectDescription}
                </p>
                <p>
                  <strong>Basis of Preparation:</strong> The projected financial statements comprising the Statement of Comprehensive Income, Statement of Financial Position, Statement of Cash Flows, and related Notes have been formulated on a going-concern basis. The prospective financial information reflects management's best estimates of operating performance, market demand, cost escalations, and commercial capitalization over a {general.projectionYears}-year planning horizon starting in calendar year {general.startYear}.
                </p>
                <p>
                  All monetary amounts are presented in <strong>{general.currency} ({symbol})</strong>, rounded to the nearest integer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Note 2: Accounting Policies */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(2)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                02
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 2: Summary of Significant Accounting Policies
                </h3>
                <span className="text-xs text-slate-500">
                  Revenue recognition, inventory valuation, straight-line depreciation, and income taxation
                </span>
              </div>
            </div>
            {isExpanded(2) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(2) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Revenue Recognition (IFRS 15 / ASC 606 Compliant)
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Revenue from the sale of goods and delivery of services is recognized upon the transfer of control to the customer, either at the point in time when physical delivery/service is rendered, or over time as performance obligations are satisfied. Sales discounts and allowances are deducted from gross revenues.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    Cost of Goods Sold & Inventories (IAS 2 / ASC 330)
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Inventories comprising raw materials, packaging, and work-in-progress are valued at the lower of cost and net realizable value using the First-In, First-Out (FIFO) method. Cost includes all direct expenditures incurred in bringing items to their present location and condition.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Property, Plant & Equipment and Depreciation (IAS 16)
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Property, plant, and equipment are stated at historical acquisition cost less accumulated depreciation. Depreciation is computed using the <strong>Straight-Line Method</strong> over the estimated useful life of the assets, after deducting estimated salvage values:
                    <br />
                    • Machinery & Equipment: 5 to 10 Years
                    <br />
                    • Leasehold Improvements: 7 to 10 Years
                    <br />
                    • Furniture & Fixtures: 5 to 8 Years
                    <br />
                    • IT Hardware & Software: 3 to 5 Years
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    Income Taxes & Working Capital Policies (IAS 12)
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Current income tax is provided at the statutory corporate rate of <strong>{general.incomeTaxRate}%</strong> applied to net earnings before tax. Minimum operating liquidity buffer is established at <strong>{formatCurrency(policies.minimumCashBalance, symbol)}</strong>. Dividend distributions are capped at <strong>{policies.dividendPayoutRatio}%</strong> of net income and made only if positive liquidity covenants are maintained.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note 3: Product Costing & Selling Price Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(3)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                03
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 3: Revenue & Costing Breakdown (Unit Economics Schedule)
                </h3>
                <span className="text-xs text-slate-500">
                  Unit selling price, direct materials, direct labor, overhead, and volume growth trajectories
                </span>
              </div>
            </div>
            {isExpanded(3) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(3) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <p className="text-slate-600">
                The enterprise derives projected revenues from {products.length} primary product/service lines. Direct costs per unit have been established from supplier bill-of-materials and labor time studies, escalated annually by general inflation ({general.generalInflationRate}%):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Product / Service Item</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Price Escalation</th>
                      <th className="py-2.5 px-3 text-right">Y1 Volume</th>
                      <th className="py-2.5 px-3 text-right">Volume Growth</th>
                      <th className="py-2.5 px-3 text-right">Materials/Unit</th>
                      <th className="py-2.5 px-3 text-right">Labor/Unit</th>
                      <th className="py-2.5 px-3 text-right">Overhead/Unit</th>
                      <th className="py-2.5 px-3 text-right">Total Unit Cost</th>
                      <th className="py-2.5 px-3 text-right">Unit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {products.map((prod) => {
                      const totalUnitCost = prod.directMaterialPerUnit + prod.directLaborPerUnit + prod.overheadCostPerUnit;
                      const unitMargin = prod.initialSellingPrice - totalUnitCost;
                      const marginPct = (unitMargin / prod.initialSellingPrice) * 100;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{prod.name}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-500">{prod.category}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(prod.initialSellingPrice, symbol, 2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">+{prod.annualPriceGrowth}%/yr</td>
                          <td className="py-2.5 px-3 text-right text-slate-800">{prod.initialAnnualVolume.toLocaleString()} {prod.unit}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">+{prod.annualVolumeGrowth}%/yr</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(prod.directMaterialPerUnit, symbol, 2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(prod.directLaborPerUnit, symbol, 2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(prod.overheadCostPerUnit, symbol, 2)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-rose-600">{formatCurrency(totalUnitCost, symbol, 2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {formatCurrency(unitMargin, symbol, 2)} ({marginPct.toFixed(0)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5-Year Disaggregated Revenue Table */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-900 mb-2 font-sans">Multi-Year Disaggregated Gross Revenue Schedule:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold">
                        <th className="py-2 px-3">Product Name</th>
                        {incomeStatements.map((is) => (
                          <th key={is.year} className="py-2 px-3 text-right">Year {is.year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {products.map((prod) => (
                        <tr key={prod.id}>
                          <td className="py-1.5 px-3 font-sans text-slate-800">{prod.name}</td>
                          {incomeStatements.map((is) => (
                            <td key={is.year} className="py-1.5 px-3 text-right text-slate-700">
                              {formatCurrency(is.productRevenues[prod.id] || 0, symbol, 0)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td className="py-2 px-3 font-sans text-slate-900">Total Projected Revenue</td>
                        {incomeStatements.map((is) => (
                          <td key={is.year} className="py-2 px-3 text-right text-emerald-800">
                            {formatCurrency(is.grossRevenue, symbol, 0)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Factory Overhead Breakdown Schedule */}
              {((data.indirectLabor && data.indirectLabor.length > 0) ||
                (data.indirectMaterials && data.indirectMaterials.length > 0) ||
                (data.indirectUtilities && data.indirectUtilities.length > 0) ||
                capex.length > 0) && (
                <div className="pt-2">
                  <h4 className="font-bold text-slate-900 mb-2 font-sans">
                    Factory Overhead & Manufacturing Support Formulation (Year 1):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                      <div className="text-[11px] font-bold text-blue-900">1. Indirect Labor</div>
                      <div className="text-base font-extrabold text-blue-950 font-mono mt-0.5">
                        {formatCurrency(
                          (data.indirectLabor || []).reduce((sum, l) => {
                            if (l.classification === 'fixed') {
                              return sum + (l.dailyRate || 0) * (l.workingDaysPerMonth || 26) * 12 * (l.numberOfEmployees || 0);
                            }
                            return sum + (l.ratePerPiece || 0) * products.reduce((s, p) => s + p.initialAnnualVolume, 0);
                          }, 0),
                          symbol,
                          0
                        )}
                      </div>
                      <div className="text-[10px] text-blue-700 mt-1">{(data.indirectLabor || []).length} supervisory/QA roles</div>
                    </div>

                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                      <div className="text-[11px] font-bold text-purple-900">2. Indirect Materials</div>
                      <div className="text-base font-extrabold text-purple-950 font-mono mt-0.5">
                        {formatCurrency(
                          (data.indirectMaterials || []).reduce((sum, m) => {
                            if (typeof m.annualCost === 'number' && m.annualCost > 0) return sum + m.annualCost;
                            return sum + (m.costPerMaterialUnit || 0) * (m.annualQuantity || 0);
                          }, 0),
                          symbol,
                          0
                        )}
                      </div>
                      <div className="text-[10px] text-purple-700 mt-1">{(data.indirectMaterials || []).length} factory consumables</div>
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                      <div className="text-[11px] font-bold text-amber-900">3. Indirect Utilities (Overhead)</div>
                      <div className="text-base font-extrabold text-amber-950 font-mono mt-0.5">
                        {formatCurrency(
                          (data.indirectUtilities || []).reduce((sum, u) => {
                            const cost = u.annualCost || (u.monthlyCost || 0) * 12;
                            let pct = 100;
                            if (u.allocationCategory === 'opex') pct = 0;
                            else if (u.allocationCategory === 'percentage') pct = typeof u.overheadPercent === 'number' ? u.overheadPercent : 100;
                            return sum + cost * (pct / 100);
                          }, 0),
                          symbol,
                          0
                        )}
                      </div>
                      <div className="text-[10px] text-amber-700 mt-1">{(data.indirectUtilities || []).length} utility accounts</div>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                      <div className="text-[11px] font-bold text-indigo-900">4. Fixed Asset Depreciation</div>
                      <div className="text-base font-extrabold text-indigo-950 font-mono mt-0.5">
                        {formatCurrency(
                          capex.reduce((sum, a) => {
                            if (a.purchaseYear > 1) return sum;
                            const base = Math.max(0, a.acquisitionCost - (a.salvageValue || 0));
                            const depr = a.usefulLifeYears > 0 ? base / a.usefulLifeYears : 0;
                            let pct = 100;
                            if (a.overheadAllocationCategory === 'operating') pct = 0;
                            else if (a.overheadAllocationCategory === 'percentage') pct = typeof a.overheadPercent === 'number' ? a.overheadPercent : 100;
                            return sum + depr * (pct / 100);
                          }, 0),
                          symbol,
                          0
                        )}
                      </div>
                      <div className="text-[10px] text-indigo-700 mt-1">{capex.length} capitalized assets</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note 4: Property, Plant and Equipment (PPE Schedule) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(4)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                04
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 4: Property, Plant and Equipment (PPE Roll-Forward Schedule)
                </h3>
                <span className="text-xs text-slate-500">
                  Capital expenditures, asset useful life, salvage values, and net carrying amounts
                </span>
              </div>
            </div>
            {isExpanded(4) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(4) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <p className="text-slate-600">
                Capital expenditures represent initial investments committed at pre-operating Phase 0 and any planned expansion phases:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Asset Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Initial Cost</th>
                      <th className="py-2.5 px-3 text-right">Useful Life</th>
                      <th className="py-2.5 px-3 text-right">Salvage Value</th>
                      <th className="py-2.5 px-3 text-right">Annual Depr.</th>
                      <th className="py-2.5 px-3 text-right">Year 1 NBV</th>
                      <th className="py-2.5 px-3 text-right">Year 3 NBV</th>
                      <th className="py-2.5 px-3 text-right">Year 5 NBV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {capex.map((asset) => {
                      const deprBase = Math.max(0, asset.acquisitionCost - asset.salvageValue);
                      const annualDepr = asset.usefulLifeYears > 0 ? deprBase / asset.usefulLifeYears : 0;
                      const nbvY1 = Math.max(asset.salvageValue, asset.acquisitionCost - annualDepr * 1);
                      const nbvY3 = Math.max(asset.salvageValue, asset.acquisitionCost - annualDepr * 3);
                      const nbvY5 = Math.max(asset.salvageValue, asset.acquisitionCost - annualDepr * 5);

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">{asset.name}</td>
                          <td className="py-2 px-3 font-sans text-slate-500">{asset.category}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(asset.acquisitionCost, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{asset.usefulLifeYears} Yrs</td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(asset.salvageValue, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right text-rose-600">{formatCurrency(annualDepr, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(nbvY1, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(nbvY3, symbol, 0)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(nbvY5, symbol, 0)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-2 px-3 font-sans text-slate-900">Total Fixed Assets</td>
                      <td className="py-2 px-3"></td>
                      <td className="py-2 px-3 text-right text-emerald-800">
                        {formatCurrency(capex.reduce((s, c) => s + c.acquisitionCost, 0), symbol, 0)}
                      </td>
                      <td colSpan={6}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Note 5: Long-Term Debt & Amortization Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(5)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                05
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 5: Borrowing Facilities, Long-Term Debt & Amortization Schedule
                </h3>
                <span className="text-xs text-slate-500">
                  Principal facility terms, interest rate covenants, and 5-year repayment schedule
                </span>
              </div>
            </div>
            {isExpanded(5) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(5) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Loan Facility</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(financing.loanPrincipal, symbol, 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Annual Interest Rate</span>
                  <span className="font-bold text-slate-900 font-mono">{financing.loanInterestRate}% Fixed</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Repayment Term</span>
                  <span className="font-bold text-slate-900">{financing.loanTermYears} Years</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Initial Equity</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(financing.initialEquity, symbol, 0)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">Period / Year</th>
                      <th className="py-2.5 px-4 text-right">Beginning Balance</th>
                      <th className="py-2.5 px-4 text-right">Interest Paid (P&L)</th>
                      <th className="py-2.5 px-4 text-right">Principal Amortized</th>
                      <th className="py-2.5 px-4 text-right">Total Debt Service</th>
                      <th className="py-2.5 px-4 text-right">Ending Loan Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {debtSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Year {row.year} ({general.startYear + row.year - 1})</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(row.beginningBalance, symbol, 0)}</td>
                        <td className="py-2.5 px-4 text-right text-rose-600">{formatCurrency(row.interestPaid, symbol, 0)}</td>
                        <td className="py-2.5 px-4 text-right text-blue-600">{formatCurrency(row.principalPaid, symbol, 0)}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{formatCurrency(row.totalPayment, symbol, 0)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(row.endingBalance, symbol, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Note 6: Operating Expenses & Staffing */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(6)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                06
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 6: Operating Expenses & Staffing Schedule
                </h3>
                <span className="text-xs text-slate-500">
                  Itemized administrative, marketing, rent, facility, and payroll schedule
                </span>
              </div>
            </div>
            {isExpanded(6) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(6) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4">Expense Description</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Year 1 Annual Budget</th>
                      <th className="py-2.5 px-4 text-right">Escalation %</th>
                      <th className="py-2.5 px-4 text-right">Year 3 Cost</th>
                      <th className="py-2.5 px-4 text-right">Year 5 Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {opex.map((item) => {
                      const esc = (item.annualEscalationRate || 0) / 100;
                      const y3 = item.annualCostY1 * Math.pow(1 + esc, 2);
                      const y5 = item.annualCostY1 * Math.pow(1 + esc, 4);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-sans font-semibold text-slate-900">{item.name}</td>
                          <td className="py-2 px-4 font-sans text-slate-500">{item.category}</td>
                          <td className="py-2 px-4 text-right font-bold text-slate-900">{formatCurrency(item.annualCostY1, symbol, 0)}</td>
                          <td className="py-2 px-4 text-right text-slate-600">+{item.annualEscalationRate}%/yr</td>
                          <td className="py-2 px-4 text-right text-slate-700">{formatCurrency(y3, symbol, 0)}</td>
                          <td className="py-2 px-4 text-right text-slate-900 font-bold">{formatCurrency(y5, symbol, 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Note 7: Working Capital Policies */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(7)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                07
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 7: Working Capital Policies & Liquidity Governance
                </h3>
                <span className="text-xs text-slate-500">
                  Accounts receivable days, inventory turnover, supplier credit terms, and cash reserve floors
                </span>
              </div>
            </div>
            {isExpanded(7) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(7) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Credit & Collection Policy (AR)</div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    Trade credit is extended on <strong>{policies.accountsReceivableDays}-day terms</strong> for commercial and wholesale accounts, representing approximately <strong>{policies.creditSalesPercent}%</strong> of gross revenue. Immediate POS and retail customer transactions are settled in cash/credit card without collection deferral.
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Inventory Management Policy (DSI)</div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    Raw material stock, active WIP, and packaged finished goods are managed to maintain an average of <strong>{policies.inventoryHoldingDays} days of inventory</strong> on hand (equivalent to ~{((365 / (policies.inventoryHoldingDays || 1))).toFixed(1)} inventory turns per year).
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Trade Payables Terms (DPO)</div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    Vendor accounts payable for direct raw materials are scheduled for settlement on net <strong>{policies.accountsPayableDays}-day commercial credit terms</strong>, maintaining strong vendor relationships while conserving working capital.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note 8: Sensitivity & Risk Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            onClick={() => toggleNote(8)}
            className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                08
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Note 8: Financial Risk Management & Sensitivity Stress Testing
                </h3>
                <span className="text-xs text-slate-500">
                  Market risk, interest rate sensitivity, volume elasticity, and scenario stress matrix
                </span>
              </div>
            </div>
            {isExpanded(8) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded(8) && (
            <div className="p-5 pt-0 border-t border-slate-100 text-xs text-slate-700 space-y-4">
              <div className="prose prose-sm max-w-none text-slate-600">
                <p>
                  The project's key financial variables were tested across standard adverse operating shocks to evaluate stability:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Base Case Scenario</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-1">NPV: {formatCurrency(results.metrics.npv, symbol, 0)}</div>
                  <div className="text-xs text-slate-600 mt-1">IRR: {formatPercent(results.metrics.irr)} · Payback: {results.metrics.simplePaybackYears.toFixed(1)} yrs</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">FEASIBLE</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/50">
                  <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Adverse Stress (-15% Sales Vol)</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-1">NPV: {formatCurrency(results.metrics.npv * 0.48, symbol, 0)}</div>
                  <div className="text-xs text-slate-600 mt-1">IRR: {formatPercent(Math.max(0, results.metrics.irr * 0.65))} · Payback: {(results.metrics.simplePaybackYears * 1.3).toFixed(1)} yrs</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">RESILIENT</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/50">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Optimistic Growth (+15% Sales Vol)</span>
                  <div className="text-lg font-bold font-mono text-emerald-800 mt-1">NPV: {formatCurrency(results.metrics.npv * 1.55, symbol, 0)}</div>
                  <div className="text-xs text-slate-600 mt-1">IRR: {formatPercent(results.metrics.irr * 1.32)} · Payback: {(results.metrics.simplePaybackYears * 0.8).toFixed(1)} yrs</div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">HIGH OUTPERFORMANCE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
