import React, { useState } from 'react';
import {
  CompanyProfile,
  EntityClassification,
  PartnerContribution,
  FeasibilityModelData,
} from '../types/feasibility';
import { formatCurrency } from '../utils/financialCalculations';
import {
  Building2,
  User,
  Users,
  Briefcase,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  PieChart,
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: CompanyProfile;
  currentData: FeasibilityModelData;
  onSaveProfile: (profile: CompanyProfile, totalEquity: number) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  currentData,
  onSaveProfile,
}) => {
  const symbol = currentData.general.currencySymbol || '$';

  // Wizard Step: 1 = Entity Details, 2 = Capital & Ownership
  const [step, setStep] = useState<1 | 2>(1);

  // Part 1 state
  const [entityName, setEntityName] = useState(
    currentProfile?.entityName || currentData.general.companyName || ''
  );
  const [classification, setClassification] = useState<EntityClassification>(
    currentProfile?.classification || 'Sole Proprietorship'
  );
  const [nature, setNature] = useState(
    currentProfile?.nature || currentData.general.industry || ''
  );
  const [purpose, setPurpose] = useState(
    currentProfile?.purpose || currentData.general.projectDescription || ''
  );

  // Part 2 state: Sole Proprietorship
  const [ownerName, setOwnerName] = useState(
    currentProfile?.soleProprietor?.ownerName || currentData.general.preparedBy || ''
  );
  const [ownerCapital, setOwnerCapital] = useState<number>(
    currentProfile?.soleProprietor?.capital ?? currentData.financing.initialEquity ?? 0
  );

  // Part 2 state: Partnership
  const [partners, setPartners] = useState<PartnerContribution[]>(() => {
    if (currentProfile?.partners && currentProfile.partners.length > 0) {
      return currentProfile.partners;
    }
    // Default 2 blank partners for a partnership
    return [
      {
        id: 'partner-1',
        name: '',
        capital: 0,
        profitSharePercent: 0,
      },
      {
        id: 'partner-2',
        name: '',
        capital: 0,
        profitSharePercent: 0,
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add partner handler
  const handleAddPartner = () => {
    const nextIdx = partners.length + 1;
    setPartners((prev) => [
      ...prev,
      {
        id: `partner-${Date.now()}-${nextIdx}`,
        name: '',
        capital: 0,
        profitSharePercent: 0,
      },
    ]);
  };

  // Remove partner handler
  const handleRemovePartner = (id: string) => {
    if (partners.length <= 2) {
      setValidationError('A partnership requires a minimum of two (2) partners.');
      return;
    }
    setPartners((prev) => prev.filter((p) => p.id !== id));
    setValidationError(null);
  };

  // Update partner item
  const handleUpdatePartner = (
    id: string,
    field: keyof PartnerContribution,
    value: string | number
  ) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Auto-split profit evenly
  const handleSplitEvenly = () => {
    const n = partners.length;
    if (n === 0) return;
    const baseShare = Math.floor((100 / n) * 100) / 100;
    const remainder = Math.round((100 - baseShare * n) * 100) / 100;

    setPartners((prev) =>
      prev.map((p, idx) => ({
        ...p,
        profitSharePercent: idx === 0 ? baseShare + remainder : baseShare,
      }))
    );
    setValidationError(null);
  };

  // Pro-rata based on capital
  const handleProRataCapital = () => {
    const totalCap = partners.reduce((sum, p) => sum + (Number(p.capital) || 0), 0);
    if (totalCap <= 0) {
      setValidationError('Please enter capital amounts first to calculate pro-rata shares.');
      return;
    }
    setPartners((prev) =>
      prev.map((p) => ({
        ...p,
        profitSharePercent:
          Math.round(((Number(p.capital) || 0) / totalCap) * 1000) / 10,
      }))
    );
    setValidationError(null);
  };

  // Navigation between steps
  const handleProceedToPart2 = () => {
    if (!entityName.trim()) {
      setValidationError('Please enter the name of the entity.');
      return;
    }
    if (!nature.trim()) {
      setValidationError('Please encode the nature of the business.');
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  // Validation & Save
  const handleFinalSave = () => {
    if (classification === 'Sole Proprietorship') {
      if (!ownerName.trim()) {
        setValidationError('Please enter the name of the sole proprietor / owner.');
        return;
      }
      if (ownerCapital < 0) {
        setValidationError('Capital contributed cannot be negative.');
        return;
      }

      const newProfile: CompanyProfile = {
        entityName: entityName.trim(),
        classification: 'Sole Proprietorship',
        nature: nature.trim(),
        purpose: purpose.trim(),
        soleProprietor: {
          ownerName: ownerName.trim(),
          capital: Number(ownerCapital) || 0,
        },
      };

      onSaveProfile(newProfile, Number(ownerCapital) || 0);
      onClose();
    } else {
      // Partnership
      if (partners.length < 2) {
        setValidationError('A partnership requires at least two (2) partners.');
        return;
      }
      for (const p of partners) {
        if (!p.name.trim()) {
          setValidationError('Please provide a name for each partner.');
          return;
        }
      }

      const totalProfitShare = partners.reduce(
        (sum, p) => sum + (Number(p.profitSharePercent) || 0),
        0
      );

      // Warning if not roughly 100%
      if (Math.abs(totalProfitShare - 100) > 0.5) {
        setValidationError(
          `Total profit sharing must equal exactly 100%. Currently it totals ${totalProfitShare.toFixed(
            1
          )}%.`
        );
        return;
      }

      const totalCapital = partners.reduce(
        (sum, p) => sum + (Number(p.capital) || 0),
        0
      );

      const newProfile: CompanyProfile = {
        entityName: entityName.trim(),
        classification: 'Partnership',
        nature: nature.trim(),
        purpose: purpose.trim(),
        partners: partners.map((p) => ({
          ...p,
          capital: Number(p.capital) || 0,
          profitSharePercent: Number(p.profitSharePercent) || 0,
        })),
      };

      onSaveProfile(newProfile, totalCapital);
      onClose();
    }
  };

  // Calculations for step 2 summaries
  const partnershipTotalCapital = partners.reduce(
    (sum, p) => sum + (Number(p.capital) || 0),
    0
  );
  const partnershipTotalProfitShare = partners.reduce(
    (sum, p) => sum + (Number(p.profitSharePercent) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Company Profile Setup
              </h2>
              <p className="text-xs text-slate-300">
                Part {step} of 2: {step === 1 ? 'Entity Classification & Purpose' : 'Contributed Capital & Ownership'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1
                  ? 'bg-slate-900 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </span>
            <span className={step === 1 ? 'font-bold text-slate-900' : 'text-slate-600'}>
              1. Entity Profile
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-300 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-bold text-slate-900' : 'text-slate-500'}>
              2. Capital & Ownership
            </span>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: ENTITY CLASSIFICATION & PURPOSE */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Entity Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Name of Entity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={entityName}
                    onChange={(e) => {
                      setEntityName(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="e.g., Summit Artisanal Roastery, Apex Solutions Co."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Classification: Sole Proprietorship vs Partnership ONLY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Entity Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setClassification('Sole Proprietorship');
                      setValidationError(null);
                    }}
                    className={`p-3.5 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                      classification === 'Sole Proprietorship'
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-sm text-slate-900">
                          Sole Proprietorship
                        </span>
                      </div>
                      {classification === 'Sole Proprietorship' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Single owner/investor. 100% equity ownership and full profit/loss entitlement.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClassification('Partnership');
                      setValidationError(null);
                    }}
                    className={`p-3.5 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                      classification === 'Partnership'
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-900">
                          Partnership
                        </span>
                      </div>
                      {classification === 'Partnership' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Two or more partners with individualized contributed capital and agreed profit/loss sharing ratios.
                    </p>
                  </button>
                </div>
              </div>

              {/* Nature of Business */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nature of Business <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={nature}
                    onChange={(e) => {
                      setNature(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="e.g., Specialty Food & Beverage Cafe, Manufacturing & Packaging, Cloud SaaS"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {/* Preset Nature Suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Merchandising / Retail',
                      'Manufacturing & Assembly',
                      'Professional & Client Services',
                      'Specialty Food & Beverage',
                      'Health & Clinical Services',
                      'Technology / Software',
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setNature(pill)}
                        className="px-2.5 py-1 text-[11px] rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Purpose of the Entity / Feasibility Study
                </label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="State the core objective, mission, or investment rationale (e.g., To establish an artisanal roasting plant and cafe to capture urban specialty coffee demand and assess 5-year bank debt capacity...)"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* STEP 2: CAPITAL CONTRIBUTED & OWNERSHIP */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Selected Entity: </span>
                  <span className="font-bold text-slate-900">{entityName}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-200 text-slate-800">
                  {classification}
                </span>
              </div>

              {/* CASE 1: SOLE PROPRIETORSHIP */}
              {classification === 'Sole Proprietorship' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-800">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Sole Proprietor Details</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Name of Owner / Proprietor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => {
                          setOwnerName(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder="e.g., Alexandra Chen"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Capital Contributed ({symbol}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                          {symbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={ownerCapital || ''}
                          onChange={(e) => {
                            setOwnerCapital(parseFloat(e.target.value) || 0);
                            setValidationError(null);
                          }}
                          placeholder="0"
                          className="w-full pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-hidden transition-all text-slate-900"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Formatted: {formatCurrency(ownerCapital, symbol, 0)}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                      <span className="font-semibold">Ownership & Profit Allocation:</span>
                      <span className="font-mono font-bold">100% Equity / 100% Profit Share</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 2: PARTNERSHIP */}
              {classification === 'Partnership' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Partners' Roster & Capital Schedule
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Add each partner's initial capital contribution and agreed profit sharing percentage
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSplitEvenly}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Distribute 100% profit sharing equally across partners"
                      >
                        Split Evenly
                      </button>
                      <button
                        type="button"
                        onClick={handleProRataCapital}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Calculate profit % based on relative capital contributions"
                      >
                        Pro-Rata to Capital
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPartner}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Partner</span>
                      </button>
                    </div>
                  </div>

                  {/* Partners list cards */}
                  <div className="space-y-3">
                    {partners.map((partner, index) => (
                      <div
                        key={partner.id}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                              {index + 1}
                            </span>
                            Partner #{index + 1}
                          </span>

                          {partners.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePartner(partner.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              title="Remove Partner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Name */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Partner Name
                            </label>
                            <input
                              type="text"
                              value={partner.name}
                              onChange={(e) =>
                                handleUpdatePartner(partner.id, 'name', e.target.value)
                              }
                              placeholder="e.g. John Doe"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-900"
                            />
                          </div>

                          {/* Capital Contributed */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Capital Contributed ({symbol})
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                                {symbol}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={partner.capital || ''}
                                onChange={(e) =>
                                  handleUpdatePartner(
                                    partner.id,
                                    'capital',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-900"
                              />
                            </div>
                          </div>

                          {/* Profit Sharing % */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Profit Share (%)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={partner.profitSharePercent || ''}
                                onChange={(e) =>
                                  handleUpdatePartner(
                                    partner.id,
                                    'profitSharePercent',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full pr-6 pl-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-900"
                              />
                              <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900 text-white rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Total Contributed Capital
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {formatCurrency(partnershipTotalCapital, symbol, 0)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Total Profit Sharing %
                      </span>
                      <span
                        className={`text-base font-bold font-mono ${
                          Math.abs(partnershipTotalProfitShare - 100) < 0.1
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {partnershipTotalProfitShare.toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {Math.abs(partnershipTotalProfitShare - 100) < 0.1
                          ? '✓ Fully Allocated (100%)'
                          : `Must sum to 100% (${(100 - partnershipTotalProfitShare).toFixed(1)}% unallocated)`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-4 sm:p-5 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-slate-50 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setValidationError(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Part 1</span>
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToPart2}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Next: Capital & Ownership</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Apply Company Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
