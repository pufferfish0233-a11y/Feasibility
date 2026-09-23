import React, { useState } from 'react';
import {
  FeasibilityModelData,
  ProductItem,
  OpexItem,
  CapexItem,
  OpexCategory,
  CapexCategory,
  RawMaterialItem,
  LaborClassification,
  DirectLaborItem,
  FactoryOverheadItem,
  IndirectLaborItem,
  IndirectMaterialItem,
  IndirectUtilityItem,
  UtilityAllocationCategory,
  FixedAssetOverheadCategory,
  PreOperatingExpenseItem,
  CashOnHandItem,
  CashInBankItem,
  BankDepositAccountType,
} from '../types/feasibility';
import { formatCurrency, computeProductUnitCosts } from '../utils/financialCalculations';
import { AVAILABLE_BANKS, BankOption } from '../data/banks';
import {
  COMMON_PRE_OPERATING_EXPENSES,
  generatePreOpExpenseItem,
} from '../data/preOperatingPresets';
import {
  COMMON_CASH_ON_HAND_PRESETS,
  COMMON_CASH_IN_BANK_PRESETS,
  generateCashOnHandItem,
  generateCashInBankItem,
} from '../data/cashPresets';
import { LoanAmortizationModal } from './LoanAmortizationModal';
import {
  Sliders,
  DollarSign,
  Plus,
  Trash2,
  Package,
  Layers,
  Building,
  CreditCard,
  Settings,
  HelpCircle,
  RotateCcw,
  Building2,
  Users,
  User,
  Sparkles,
  Boxes,
  HardHat,
  Factory,
  Calculator,
  Info,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Wrench,
  Zap,
  PieChart,
  Percent,
  Briefcase,
  Landmark,
  Search,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  ChevronDown,
  ListFilter,
  Wallet,
  Receipt,
  Banknote,
  Coins,
  ArrowUpRight,
  Scale,
} from 'lucide-react';

interface AssumptionsViewProps {
  data: FeasibilityModelData;
  onChangeData: (newData: FeasibilityModelData) => void;
  onOpenCompanyProfile?: () => void;
}

export const AssumptionsView: React.FC<AssumptionsViewProps> = ({
  data,
  onChangeData,
  onOpenCompanyProfile,
}) => {
  const [activeSection, setActiveSection] = useState<
    'preOperating' | 'financing' | 'pricing' | 'costing' | 'policies' | 'opex' | 'general' | 'capex'
  >('preOperating');

  const [preOpSubTab, setPreOpSubTab] = useState<
    'all' | 'capital' | 'preOpExpenses' | 'cashOnHand' | 'cashInBank' | 'capex' | 'sourcesUses'
  >('all');

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankRegionFilter, setBankRegionFilter] = useState<'All' | 'Philippines' | 'Global / US'>('All');
  const [customBankName, setCustomBankName] = useState('');
  const [customBankRate, setCustomBankRate] = useState<number | ''>('');
  const [showCustomBankInput, setShowCustomBankInput] = useState(false);

  const [cogsSubTab, setCogsSubTab] = useState<'materials' | 'labor' | 'overhead' | 'summary'>('materials');

  const { general, policies, products, opex, capex, financing } = data;
  const rawMaterials = data.rawMaterials || [];
  const directLabor = data.directLabor || [];
  const factoryOverhead = data.factoryOverhead || [];
  const indirectLabor = data.indirectLabor || [];
  const indirectMaterials = data.indirectMaterials || [];
  const indirectUtilities = data.indirectUtilities || [];
  const symbol = general.currencySymbol || '$';

  const [overheadActiveSubTab, setOverheadActiveSubTab] = useState<
    'all' | 'labor' | 'materials' | 'utilities' | 'fixedAssets'
  >('all');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  // Synchronizes each product's unit costs (direct materials, direct labor, factory overhead)
  const syncProductUnitCosts = (
    currentProducts: ProductItem[] = products,
    currentRawMaterials: RawMaterialItem[] = rawMaterials,
    currentDirectLabor: DirectLaborItem[] = directLabor,
    currentFactoryOverhead: FactoryOverheadItem[] = factoryOverhead,
    currentIndirectLabor: IndirectLaborItem[] = indirectLabor,
    currentIndirectMaterials: IndirectMaterialItem[] = indirectMaterials,
    currentIndirectUtilities: IndirectUtilityItem[] = indirectUtilities,
    currentCapex: CapexItem[] = capex
  ): ProductItem[] => {
    return computeProductUnitCosts(
      currentProducts,
      currentRawMaterials,
      currentDirectLabor,
      currentFactoryOverhead,
      currentIndirectLabor,
      currentIndirectMaterials,
      currentIndirectUtilities,
      currentCapex
    );
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    const reSynced = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({ ...data, products: reSynced });
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback(true);
      setTimeout(() => {
        setSyncFeedback(false);
      }, 2000);
    }, 300);
  };

  // Handlers for updating sub-objects
  const updateGeneral = (field: keyof typeof general, value: any) => {
    onChangeData({
      ...data,
      general: { ...general, [field]: value },
    });
  };

  const updatePolicies = (field: keyof typeof policies, value: any) => {
    onChangeData({
      ...data,
      policies: { ...policies, [field]: value },
    });
  };

  const updateFinancing = (field: keyof typeof financing, value: any) => {
    onChangeData({
      ...data,
      financing: { ...financing, [field]: value },
    });
  };

  // Products
  const updateProduct = (id: string, field: keyof ProductItem, value: any) => {
    const updated = products.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    const reSynced = syncProductUnitCosts(updated, rawMaterials, directLabor, factoryOverhead);
    onChangeData({ ...data, products: reSynced });
  };

  const addProduct = () => {
    const newProd: ProductItem = {
      id: `prod_${Date.now()}`,
      name: '',
      category: '',
      unit: '',
      initialSellingPrice: 0,
      annualPriceGrowth: 0,
      initialAnnualVolume: 0,
      annualVolumeGrowth: 0,
      directMaterialPerUnit: 0,
      directLaborPerUnit: 0,
      overheadCostPerUnit: 0,
    };
    const updated = [...products, newProd];
    onChangeData({ ...data, products: updated });
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    const updatedMaterials = rawMaterials.filter((m) => m.productId !== id);
    const updatedLabor = directLabor.map((l) => (l.productId === id ? { ...l, productId: 'all' } : l));
    const updatedIndirectLabor = indirectLabor.map((l) => (l.productId === id ? { ...l, productId: 'all' } : l));
    const updatedOverhead = factoryOverhead.map((o) => (o.productId === id ? { ...o, productId: 'all' } : o));
    const reSynced = syncProductUnitCosts(
      updated,
      updatedMaterials,
      updatedLabor,
      updatedOverhead,
      updatedIndirectLabor,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: reSynced,
      rawMaterials: updatedMaterials,
      directLabor: updatedLabor,
      indirectLabor: updatedIndirectLabor,
      factoryOverhead: updatedOverhead,
    });
  };

  // Direct Materials Handlers
  const addRawMaterial = (targetProductId?: string) => {
    const selectedProdId = targetProductId || products[0]?.id || '';
    const newMat: RawMaterialItem = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: selectedProdId,
      materialName: '',
      costPerMaterialUnit: 0,
      unitOfMeasure: '',
      yieldPerMaterialUnit: 0,
    };
    const updatedMaterials = [...rawMaterials, newMat];
    const updatedProds = syncProductUnitCosts(products, updatedMaterials, directLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      rawMaterials: updatedMaterials,
    });
  };

  const updateRawMaterial = (id: string, field: keyof RawMaterialItem, value: any) => {
    const updatedMaterials = rawMaterials.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    const updatedProds = syncProductUnitCosts(products, updatedMaterials, directLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      rawMaterials: updatedMaterials,
    });
  };

  const deleteRawMaterial = (id: string) => {
    const updatedMaterials = rawMaterials.filter((m) => m.id !== id);
    const updatedProds = syncProductUnitCosts(products, updatedMaterials, directLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      rawMaterials: updatedMaterials,
    });
  };

  // Direct Labor Handlers
  const addDirectLabor = () => {
    const newLabor: DirectLaborItem = {
      id: `lab_${Date.now()}`,
      roleName: '',
      productId: products[0]?.id || 'all',
      numberOfEmployees: 0,
      classification: 'fixed',
      dailyRate: 0,
      workingDaysPerMonth: 26,
      ratePerPiece: 0,
    };
    const updatedLabor = [...directLabor, newLabor];
    const updatedProds = syncProductUnitCosts(products, rawMaterials, updatedLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      directLabor: updatedLabor,
    });
  };

  const updateDirectLabor = (id: string, field: keyof DirectLaborItem, value: any) => {
    const updatedLabor = directLabor.map((l) =>
      l.id === id ? { ...l, [field]: value } : l
    );
    const updatedProds = syncProductUnitCosts(products, rawMaterials, updatedLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      directLabor: updatedLabor,
    });
  };

  const deleteDirectLabor = (id: string) => {
    const updatedLabor = directLabor.filter((l) => l.id !== id);
    const updatedProds = syncProductUnitCosts(products, rawMaterials, updatedLabor, factoryOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      directLabor: updatedLabor,
    });
  };

  // Factory Overhead Handlers
  const addFactoryOverhead = () => {
    const newOverhead: FactoryOverheadItem = {
      id: `fo_${Date.now()}`,
      name: '',
      category: 'Utilities & Power',
      productId: 'all',
      annualCost: 0,
    };
    const updatedOverhead = [...factoryOverhead, newOverhead];
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      updatedOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      factoryOverhead: updatedOverhead,
    });
  };

  const updateFactoryOverhead = (id: string, field: keyof FactoryOverheadItem, value: any) => {
    const updatedOverhead = factoryOverhead.map((o) =>
      o.id === id ? { ...o, [field]: value } : o
    );
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      updatedOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      factoryOverhead: updatedOverhead,
    });
  };

  const deleteFactoryOverhead = (id: string) => {
    const updatedOverhead = factoryOverhead.filter((o) => o.id !== id);
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      updatedOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      factoryOverhead: updatedOverhead,
    });
  };

  // 1. Indirect Labor Handlers (1.1)
  const addIndirectLabor = () => {
    const newLabor: IndirectLaborItem = {
      id: `ind_lab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roleName: '',
      productId: 'all',
      numberOfEmployees: 1,
      classification: 'fixed',
      dailyRate: 0,
      workingDaysPerMonth: 26,
      ratePerPiece: 0,
    };
    const updated = [...indirectLabor, newLabor];
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      updated,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectLabor: updated,
    });
  };

  const updateIndirectLabor = (id: string, field: keyof IndirectLaborItem, value: any) => {
    const updated = indirectLabor.map((l) => (l.id === id ? { ...l, [field]: value } : l));
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      updated,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectLabor: updated,
    });
  };

  const deleteIndirectLabor = (id: string) => {
    const updated = indirectLabor.filter((l) => l.id !== id);
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      updated,
      indirectMaterials,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectLabor: updated,
    });
  };

  // 2. Indirect Materials Handlers (1.2)
  const addIndirectMaterial = () => {
    const newMat: IndirectMaterialItem = {
      id: `ind_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialName: '',
      costPerMaterialUnit: 0,
      unitOfMeasure: 'Units',
      annualQuantity: 0,
      annualCost: 0,
    };
    const updated = [...indirectMaterials, newMat];
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      updated,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectMaterials: updated,
    });
  };

  const updateIndirectMaterial = (id: string, field: keyof IndirectMaterialItem, value: any) => {
    const updated = indirectMaterials.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, [field]: value };
      if (field === 'costPerMaterialUnit' || field === 'annualQuantity') {
        const cost = field === 'costPerMaterialUnit' ? (parseFloat(value) || 0) : m.costPerMaterialUnit;
        const qty = field === 'annualQuantity' ? (parseFloat(value) || 0) : m.annualQuantity;
        next.annualCost = Number((cost * qty).toFixed(2));
      }
      return next;
    });
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      updated,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectMaterials: updated,
    });
  };

  const deleteIndirectMaterial = (id: string) => {
    const updated = indirectMaterials.filter((m) => m.id !== id);
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      updated,
      indirectUtilities,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectMaterials: updated,
    });
  };

  // 3. Indirect Utilities Handlers (1.3)
  const addIndirectUtility = () => {
    const newUtility: IndirectUtilityItem = {
      id: `ind_ut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      expenseAccount: '',
      monthlyCost: 0,
      annualCost: 0,
      allocationCategory: 'overhead',
      overheadPercent: 100,
    };
    const updated = [...indirectUtilities, newUtility];
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      updated,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectUtilities: updated,
    });
  };

  const updateIndirectUtility = (id: string, field: keyof IndirectUtilityItem, value: any) => {
    const updated = indirectUtilities.map((u) => {
      if (u.id !== id) return u;
      const next = { ...u, [field]: value };
      if (field === 'monthlyCost') {
        const mCost = parseFloat(value) || 0;
        next.monthlyCost = mCost;
        next.annualCost = Number((mCost * 12).toFixed(2));
      } else if (field === 'annualCost') {
        const aCost = parseFloat(value) || 0;
        next.annualCost = aCost;
        next.monthlyCost = Number((aCost / 12).toFixed(2));
      } else if (field === 'allocationCategory') {
        if (value === 'overhead') {
          next.overheadPercent = 100;
        } else if (value === 'opex') {
          next.overheadPercent = 0;
        } else if (value === 'percentage' && (next.overheadPercent === 100 || next.overheadPercent === 0)) {
          next.overheadPercent = 50;
        }
      }
      return next;
    });
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      updated,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectUtilities: updated,
    });
  };

  const deleteIndirectUtility = (id: string) => {
    const updated = indirectUtilities.filter((u) => u.id !== id);
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      updated,
      capex
    );
    onChangeData({
      ...data,
      products: updatedProds,
      indirectUtilities: updated,
    });
  };

  // 4. Fixed Assets (CAPEX Overhead Allocation) Handlers (1.4)
  const updateCapexOverheadAllocation = (
    assetId: string,
    allocationCategory: FixedAssetOverheadCategory,
    overheadPercent?: number
  ) => {
    const updatedCapex = capex.map((asset) => {
      if (asset.id !== assetId) return asset;
      let nextPct = overheadPercent !== undefined ? overheadPercent : asset.overheadPercent ?? 100;
      if (allocationCategory === 'overhead') {
        nextPct = 100;
      } else if (allocationCategory === 'operating') {
        nextPct = 0;
      } else if (allocationCategory === 'percentage' && (nextPct === 100 || nextPct === 0)) {
        nextPct = 50;
      }
      return {
        ...asset,
        overheadAllocationCategory: allocationCategory,
        overheadPercent: nextPct,
      };
    });
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      updatedCapex
    );
    onChangeData({
      ...data,
      capex: updatedCapex,
      products: updatedProds,
    });
  };

  const updateCapexOverheadPercent = (assetId: string, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    const updatedCapex = capex.map((asset) =>
      asset.id === assetId ? { ...asset, overheadPercent: clamped } : asset
    );
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      updatedCapex
    );
    onChangeData({
      ...data,
      capex: updatedCapex,
      products: updatedProds,
    });
  };

  // OPEX
  const updateOpex = (id: string, field: keyof OpexItem, value: any) => {
    const updated = opex.map((o) => (o.id === id ? { ...o, [field]: value } : o));
    onChangeData({ ...data, opex: updated });
  };

  const addOpex = () => {
    const newItem: OpexItem = {
      id: `op_${Date.now()}`,
      name: '',
      category: 'Administrative & General',
      annualCostY1: 0,
      annualEscalationRate: 0,
      isVariable: false,
    };
    onChangeData({ ...data, opex: [...opex, newItem] });
  };

  const deleteOpex = (id: string) => {
    onChangeData({ ...data, opex: opex.filter((o) => o.id !== id) });
  };

  // CAPEX
  const updateCapex = (id: string, field: keyof CapexItem, value: any) => {
    const updated = capex.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      updated
    );
    onChangeData({ ...data, capex: updated, products: updatedProds });
  };

  const addCapex = () => {
    const newItem: CapexItem = {
      id: `cap_${Date.now()}`,
      name: '',
      category: 'Equipment & Machinery',
      acquisitionCost: 0,
      usefulLifeYears: 0,
      salvageValue: 0,
      purchaseYear: 0,
      overheadAllocationCategory: 'overhead',
      overheadPercent: 100,
    };
    const updated = [...capex, newItem];
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      updated
    );
    onChangeData({ ...data, capex: updated, products: updatedProds });
  };

  const deleteCapex = (id: string) => {
    const updated = capex.filter((c) => c.id !== id);
    const updatedProds = syncProductUnitCosts(
      products,
      rawMaterials,
      directLabor,
      factoryOverhead,
      indirectLabor,
      indirectMaterials,
      indirectUtilities,
      updated
    );
    onChangeData({ ...data, capex: updated, products: updatedProds });
  };

  // Pre-Operating Expenses Handlers
  const preOperatingExpenses = data.preOperatingExpenses || [];

  const addPreOpExpense = () => {
    const newItem: PreOperatingExpenseItem = {
      id: `pre_${Date.now()}`,
      name: '',
      category: 'Legal & Regulatory',
      amount: 0,
      notes: '',
    };
    onChangeData({
      ...data,
      preOperatingExpenses: [...preOperatingExpenses, newItem],
    });
  };

  const updatePreOpExpense = (
    id: string,
    field: keyof PreOperatingExpenseItem,
    value: any
  ) => {
    const updated = preOperatingExpenses.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChangeData({ ...data, preOperatingExpenses: updated });
  };

  const deletePreOpExpense = (id: string) => {
    const updated = preOperatingExpenses.filter((item) => item.id !== id);
    onChangeData({ ...data, preOperatingExpenses: updated });
  };

  const loadStandardPreOpExpenses = () => {
    const defaultList = COMMON_PRE_OPERATING_EXPENSES.map(generatePreOpExpenseItem);
    onChangeData({
      ...data,
      preOperatingExpenses: defaultList,
    });
  };

  const clearPreOpExpenses = () => {
    onChangeData({
      ...data,
      preOperatingExpenses: [],
    });
  };

  // Bank Selection Handler
  const handleSelectBank = (bank: BankOption) => {
    const updatedFinancing = {
      ...financing,
      hasLoan: true,
      bankName: bank.name,
      loanInterestRate: bank.benchmarkInterestRate,
      loanTermYears: financing.loanTermYears > 0 ? financing.loanTermYears : bank.typicalTenorYears,
    };
    onChangeData({ ...data, financing: updatedFinancing });
    setIsBankModalOpen(false);
  };

  const handleApplyCustomBank = () => {
    if (!customBankName.trim()) return;
    const rate = typeof customBankRate === 'number' && !isNaN(customBankRate) ? customBankRate : 7.5;
    const updatedFinancing = {
      ...financing,
      hasLoan: true,
      bankName: customBankName.trim(),
      loanInterestRate: rate,
      loanTermYears: financing.loanTermYears > 0 ? financing.loanTermYears : 5,
    };
    onChangeData({ ...data, financing: updatedFinancing });
    setIsBankModalOpen(false);
    setCustomBankName('');
    setCustomBankRate('');
    setShowCustomBankInput(false);
  };

  const toggleBankLoan = (enabled: boolean) => {
    const updatedFinancing = {
      ...financing,
      hasLoan: enabled,
      bankName: enabled ? (financing.bankName || 'BDO Unibank') : financing.bankName,
      loanInterestRate: enabled ? (financing.loanInterestRate > 0 ? financing.loanInterestRate : 7.25) : financing.loanInterestRate,
      loanTermYears: enabled ? (financing.loanTermYears > 0 ? financing.loanTermYears : 5) : financing.loanTermYears,
      loanPrincipal: enabled ? (financing.loanPrincipal > 0 ? financing.loanPrincipal : 50000) : 0,
    };
    onChangeData({ ...data, financing: updatedFinancing });
  };

  // Cash on Hand Handlers
  const cashOnHand = data.cashOnHand || [];

  const addCashOnHand = () => {
    const newItem: CashOnHandItem = {
      id: `coh_${Date.now()}`,
      description: '',
      custodianOrLocation: '',
      amount: 0,
      notes: '',
    };
    onChangeData({ ...data, cashOnHand: [...cashOnHand, newItem] });
  };

  const updateCashOnHand = (id: string, field: keyof CashOnHandItem, value: any) => {
    const updated = cashOnHand.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChangeData({ ...data, cashOnHand: updated });
  };

  const deleteCashOnHand = (id: string) => {
    const updated = cashOnHand.filter((item) => item.id !== id);
    onChangeData({ ...data, cashOnHand: updated });
  };

  const loadStandardCashOnHand = () => {
    const defaultList = COMMON_CASH_ON_HAND_PRESETS.map(generateCashOnHandItem);
    onChangeData({ ...data, cashOnHand: defaultList });
  };

  const clearCashOnHand = () => {
    onChangeData({ ...data, cashOnHand: [] });
  };

  // Cash in Bank Handlers
  const cashInBank = data.cashInBank || [];

  const addCashInBank = () => {
    const defaultBank = AVAILABLE_BANKS[0]; // BDO Unibank
    const newItem: CashInBankItem = {
      id: `cib_${Date.now()}`,
      bankName: defaultBank?.name || 'BDO Unibank',
      accountType: 'Savings Account',
      accountNumberOrRef: '',
      depositAmount: 0,
      annualInterestRate: defaultBank?.depositInterestRate || 3.5,
      notes: '',
    };
    onChangeData({ ...data, cashInBank: [...cashInBank, newItem] });
  };

  const updateCashInBank = (id: string, field: keyof CashInBankItem, value: any) => {
    const updated = cashInBank.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      if (field === 'bankName') {
        const matched = AVAILABLE_BANKS.find((b) => b.name === value || b.shortName === value);
        if (matched?.depositInterestRate && (item.annualInterestRate === 0 || item.annualInterestRate === 3.5)) {
          next.annualInterestRate = matched.depositInterestRate;
        }
      }
      return next;
    });
    onChangeData({ ...data, cashInBank: updated });
  };

  const deleteCashInBank = (id: string) => {
    const updated = cashInBank.filter((item) => item.id !== id);
    onChangeData({ ...data, cashInBank: updated });
  };

  const loadStandardCashInBank = () => {
    const defaultList = COMMON_CASH_IN_BANK_PRESETS.map(generateCashInBankItem);
    onChangeData({ ...data, cashInBank: defaultList });
  };

  const clearCashInBank = () => {
    onChangeData({ ...data, cashInBank: [] });
  };

  // Pre-ops totals
  const totalPreOpExpensesPaid = preOperatingExpenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );
  const totalCapexY0 = capex
    .filter((c) => c.purchaseYear === 0)
    .reduce((sum, c) => sum + c.acquisitionCost, 0);
  const totalCapexAll = capex.reduce((sum, c) => sum + (c.acquisitionCost || 0), 0);
  const isLoanActive = financing.hasLoan !== false && (financing.loanPrincipal > 0 || (Boolean(financing.bankName) && financing.bankName!.length > 0));
  const effectiveDebt = isLoanActive ? financing.loanPrincipal : 0;
  const totalFunding = financing.initialEquity + effectiveDebt;
  const totalPreOperatingOutlays = totalCapexY0 + totalPreOpExpensesPaid;
  const initialCashBuffer = totalFunding - totalPreOperatingOutlays;

  // Cash on Hand & Cash in Bank Totals
  const totalCashOnHand = cashOnHand.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCashInBank = cashInBank.reduce((sum, item) => sum + (Number(item.depositAmount) || 0), 0);
  const totalAllocatedCash = totalCashOnHand + totalCashInBank;
  const unallocatedCashBuffer = initialCashBuffer - totalAllocatedCash;
  const totalAnnualBankInterest = cashInBank.reduce(
    (sum, item) => sum + (Number(item.depositAmount) || 0) * ((Number(item.annualInterestRate) || 0) / 100),
    0
  );
  const blendedBankInterestRate = totalCashInBank > 0 ? (totalAnnualBankInterest / totalCashInBank) * 100 : 0;

  // Established Capital from Company Profile
  const establishedCapital = React.useMemo(() => {
    if (!data.companyProfile) return null;
    if (data.companyProfile.classification === 'Partnership') {
      return (data.companyProfile.partners || []).reduce((sum, p) => sum + (Number(p.capital) || 0), 0);
    }
    return data.companyProfile.soleProprietor?.capital !== undefined
      ? Number(data.companyProfile.soleProprietor.capital)
      : null;
  }, [data.companyProfile]);

  const syncFromCompanyProfile = () => {
    if (establishedCapital !== null && establishedCapital >= 0) {
      updateFinancing('initialEquity', establishedCapital);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Assumptions & Feasibility Formulation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic input parameters governing pre-operating outlays, pricing, unit costing, operating policies, and capital structure
          </p>
        </div>

        {/* Funding quick status */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Total Sources:</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalFunding, symbol)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Yr 0 Fixed Assets:</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalCapexY0, symbol)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Pre-Ops Expenses:</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalPreOpExpensesPaid, symbol)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Starting Cash:</span>
            <span className={`font-bold ${initialCashBuffer >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(initialCashBuffer, symbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Section Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveSection('preOperating')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'preOperating' || (activeSection as string) === 'capex'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>1. Pre-Operating</span>
        </button>

        <button
          onClick={() => setActiveSection('financing')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'financing'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>2. Financing & Debt</span>
        </button>

        <button
          onClick={() => setActiveSection('pricing')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'pricing'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>3. Revenue & Selling Prices</span>
        </button>

        <button
          onClick={() => setActiveSection('costing')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'costing'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>4. Product Costing (COGS)</span>
        </button>

        <button
          onClick={() => setActiveSection('policies')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'policies'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>5. Company Policies</span>
        </button>

        <button
          onClick={() => setActiveSection('opex')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'opex'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>6. Operating Expenses (OPEX)</span>
        </button>

        <button
          onClick={() => setActiveSection('general')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'general'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>7. Project & Macro</span>
        </button>
      </div>

      {/* Section 1: Revenue & Selling Prices */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Product Catalog, Pricing & Unit Sales Volumes
              </h2>
              <p className="text-xs text-slate-500">
                Define the revenue drivers, initial selling price, unit measures, and annual volume escalation percentages
              </p>
            </div>
            <button
              onClick={addProduct}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product Line</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-900">No Product or Service Lines Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your entity's revenue drivers to forecast unit sales volumes, selling prices, and gross sales across the 5-year study horizon.
              </p>
              <button
                onClick={addProduct}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add First Product / Service</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Selling Price ({symbol})</th>
                    <th className="py-2.5 px-3 text-right">Annual Price Growth %</th>
                    <th className="py-2.5 px-3 text-right">Year 1 Unit Volume</th>
                    <th className="py-2.5 px-3 text-right">Annual Vol. Growth %</th>
                    <th className="py-2.5 px-3 text-right">Year 1 Revenue</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {products.map((p) => {
                    const y1Revenue = p.initialSellingPrice * p.initialAnnualVolume;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-sans">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="w-48 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <input
                            type="text"
                            value={p.category}
                            onChange={(e) => updateProduct(p.id, 'category', e.target.value)}
                            placeholder="Category"
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-emerald-600 placeholder:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <input
                            type="text"
                            value={p.unit}
                            onChange={(e) => updateProduct(p.id, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-emerald-600 placeholder:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.25"
                            value={p.initialSellingPrice === 0 ? '' : p.initialSellingPrice}
                            onChange={(e) => updateProduct(p.id, 'initialSellingPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.1"
                            value={p.annualPriceGrowth === 0 ? '' : p.annualPriceGrowth}
                            onChange={(e) => updateProduct(p.id, 'annualPriceGrowth', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1 text-right bg-white border border-slate-200 rounded text-slate-700 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            value={p.initialAnnualVolume === 0 ? '' : p.initialAnnualVolume}
                            onChange={(e) => updateProduct(p.id, 'initialAnnualVolume', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.5"
                            value={p.annualVolumeGrowth === 0 ? '' : p.annualVolumeGrowth}
                            onChange={(e) => updateProduct(p.id, 'annualVolumeGrowth', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="0.0"
                            className="w-16 px-2 py-1 text-right bg-white border border-slate-200 rounded text-emerald-700 font-semibold focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(y1Revenue, symbol, 0)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Product Cost (COGS) */}
      {activeSection === 'costing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Product Cost & Bill of Materials (COGS Formulation)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formulate production unit economics through granular Direct Materials (BOM), Direct Labor (fixed wages & piece-rate quotas), and Factory Overhead
              </p>
            </div>

            {/* Quick Link to Add Product if none exist */}
            {products.length === 0 && (
              <button
                onClick={() => setActiveSection('pricing')}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Define Products First</span>
              </button>
            )}
          </div>

          {/* Sub-tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setCogsSubTab('materials')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                cogsSubTab === 'materials'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Direct Materials</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  cogsSubTab === 'materials' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {rawMaterials.length}
              </span>
            </button>

            <button
              onClick={() => setCogsSubTab('labor')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                cogsSubTab === 'labor'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Direct Labor</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  cogsSubTab === 'labor' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {directLabor.length}
              </span>
            </button>

            <button
              onClick={() => setCogsSubTab('overhead')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                cogsSubTab === 'overhead'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>Factory Overhead</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  cogsSubTab === 'overhead' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {factoryOverhead.length}
              </span>
            </button>

            <button
              onClick={() => setCogsSubTab('summary')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                cogsSubTab === 'summary'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>COGS Summary Matrix</span>
            </button>
          </div>

          {/* TAB 1: DIRECT MATERIALS */}
          {cogsSubTab === 'materials' && (
            <div className="space-y-4">
              {/* Header and Sync Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-700" />
                  Direct Raw Materials & Bill of Materials (BOM)
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    title="Recalculate and synchronize raw material formulations into finished product unit costs"
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      syncFeedback
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                        : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                    }`}
                  >
                    {syncFeedback ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Synced!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sync Materials</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* KPI Cards for Materials */}
              {rawMaterials.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Total Raw Materials</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{rawMaterials.length} items</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Products Formulated</span>
                    <span className="text-lg font-bold text-emerald-700 font-mono">
                      {new Set(rawMaterials.map((m) => m.productId).filter(Boolean)).size} of {products.length}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Total Annual Materials Spend (Y1)</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {formatCurrency(
                        rawMaterials.reduce((sum, m) => {
                          const prod = products.find((p) => p.id === m.productId);
                          const unitCost = m.yieldPerMaterialUnit > 0 ? (m.costPerMaterialUnit || 0) / m.yieldPerMaterialUnit : 0;
                          return sum + unitCost * (prod?.initialAnnualVolume || 0);
                        }, 0),
                        symbol,
                        0
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Tables of Raw Materials: Dedicated table for every registered product */}
              {products.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Products Registered Yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Please define products first under <span className="font-semibold text-slate-700">1. Revenue & Selling Prices</span> so a bill of materials table can be created for each product.
                  </p>
                  <button
                    onClick={() => setActiveSection('pricing')}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Go to 1. Revenue & Selling Prices</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {products.map((prod, index) => {
                    const prodMaterials = rawMaterials.filter((m) => m.productId === prod.id);
                    const prodUnitCost = prodMaterials.reduce((sum, m) => {
                      return sum + (m.yieldPerMaterialUnit > 0 ? (m.costPerMaterialUnit || 0) / m.yieldPerMaterialUnit : 0);
                    }, 0);
                    const prodAnnualTotal = prodUnitCost * (prod.initialAnnualVolume || 0);

                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
                      >
                        {/* Product Table Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-emerald-700 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">
                                  {prod.name || `Product #${index + 1} (Unnamed)`}
                                </h3>
                                {prod.category && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                    {prod.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Unit: <span className="font-semibold text-slate-700">{prod.unit || 'unit'}</span> | Selling Price:{' '}
                                <span className="font-semibold text-slate-700">{formatCurrency(prod.initialSellingPrice, symbol, 2)}</span> | Y1 Target Volume:{' '}
                                <span className="font-semibold text-slate-700">{prod.initialAnnualVolume.toLocaleString()} units</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-auto">
                            <div className="text-right hidden md:block">
                              <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Material / Unit</span>
                              <span className="text-sm font-bold text-emerald-700 font-mono">
                                {formatCurrency(prodUnitCost, symbol, 2)}
                              </span>
                            </div>
                            <button
                              onClick={() => addRawMaterial(prod.id)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Add Material for {prod.name ? `"${prod.name}"` : `Product ${index + 1}`}</span>
                            </button>
                          </div>
                        </div>

                        {/* Raw Materials Table for this Specific Product */}
                        {prodMaterials.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50/50">
                            <p className="text-xs text-slate-500">
                              No raw materials added yet for <span className="font-semibold text-slate-700">{prod.name || `Product #${index + 1}`}</span>.
                            </p>
                            <button
                              onClick={() => addRawMaterial(prod.id)}
                              className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add first raw material for this product</span>
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[820px] text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                                  <th className="py-2.5 px-3">Raw Material / Component Description</th>
                                  <th className="py-2.5 px-3 text-right">Cost / Material Unit ({symbol})</th>
                                  <th className="py-2.5 px-3 text-center">Units</th>
                                  <th className="py-2.5 px-3 text-right">Units of Finished Product (Yield)</th>
                                  <th className="py-2.5 px-3 text-right">Cost / Finished Unit ({symbol})</th>
                                  <th className="py-2.5 px-3 text-right">Y1 Annual Cost ({symbol})</th>
                                  <th className="py-2.5 px-3 text-center w-12">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {prodMaterials.map((m) => {
                                  const unitCost =
                                    m.yieldPerMaterialUnit > 0
                                      ? (m.costPerMaterialUnit || 0) / m.yieldPerMaterialUnit
                                      : 0;
                                  const annualCost = unitCost * (prod.initialAnnualVolume || 0);

                                  return (
                                    <tr key={m.id} className="hover:bg-slate-50/60">
                                      {/* Raw material name */}
                                      <td className="py-2 px-3 font-sans">
                                        <input
                                          type="text"
                                          value={m.materialName}
                                          onChange={(e) => updateRawMaterial(m.id, 'materialName', e.target.value)}
                                          placeholder="e.g. Green Coffee Beans, Flour, Valve Pouch"
                                          className="w-full max-w-md px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                                        />
                                      </td>

                                      {/* Cost per unit of that material */}
                                      <td className="py-2 px-3 text-right">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={m.costPerMaterialUnit === 0 ? '' : m.costPerMaterialUnit}
                                          onChange={(e) =>
                                            updateRawMaterial(
                                              m.id,
                                              'costPerMaterialUnit',
                                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                            )
                                          }
                                          placeholder="0.00"
                                          className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                                        />
                                      </td>

                                      {/* Units / Measurement used per raw material */}
                                      <td className="py-2 px-3 text-center font-sans">
                                        <input
                                          type="text"
                                          value={m.unitOfMeasure || ''}
                                          onChange={(e) => updateRawMaterial(m.id, 'unitOfMeasure', e.target.value)}
                                          placeholder="e.g. kg, g, bag, pc, L"
                                          className="w-24 px-2 py-1 text-center bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                                        />
                                      </td>

                                      {/* How many of that product it can produce (Yield) */}
                                      <td className="py-2 px-3 text-right">
                                        <input
                                          type="number"
                                          step="1"
                                          value={m.yieldPerMaterialUnit === 0 ? '' : m.yieldPerMaterialUnit}
                                          onChange={(e) =>
                                            updateRawMaterial(
                                              m.id,
                                              'yieldPerMaterialUnit',
                                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                            )
                                          }
                                          placeholder="0"
                                          className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                                        />
                                      </td>

                                      {/* Cost per finished unit */}
                                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                        {formatCurrency(unitCost, symbol, 2)}
                                        {m.yieldPerMaterialUnit <= 0 && m.costPerMaterialUnit > 0 && (
                                          <span className="block text-[10px] text-amber-600 font-normal">Set yield &gt; 0</span>
                                        )}
                                      </td>

                                      {/* Total annual cost */}
                                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                                        {formatCurrency(annualCost, symbol, 0)}
                                      </td>

                                      {/* Delete */}
                                      <td className="py-2 px-3 text-center">
                                        <button
                                          onClick={() => deleteRawMaterial(m.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                          title="Delete Raw Material"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {/* Subtotal Footer for this Product */}
                              <tfoot>
                                <tr className="bg-slate-100/70 border-t border-slate-200 font-semibold font-mono text-slate-800">
                                  <td className="py-2.5 px-3 font-sans">
                                    Total Direct Material Cost for <span className="font-bold">{prod.name || 'this product'}</span>:
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-500">—</td>
                                  <td className="py-2.5 px-3 text-center text-slate-500">—</td>
                                  <td className="py-2.5 px-3 text-right text-slate-500">
                                    {prodMaterials.length} materials
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-emerald-700 font-bold text-xs">
                                    {formatCurrency(prodUnitCost, symbol, 2)} / {prod.unit || 'unit'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-900 font-bold text-xs">
                                    {formatCurrency(prodAnnualTotal, symbol, 0)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Per-Product Direct Materials Rollup Summary */}
              {products.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Direct Materials Summary per Finished Product
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {products.map((p) => {
                      const pMaterials = rawMaterials.filter((m) => m.productId === p.id);
                      const computedMatCost = pMaterials.reduce((sum, m) => {
                        return sum + (m.yieldPerMaterialUnit > 0 ? (m.costPerMaterialUnit || 0) / m.yieldPerMaterialUnit : 0);
                      }, 0);
                      const finalMatCost = pMaterials.length > 0 ? computedMatCost : p.directMaterialPerUnit;
                      const annualCost = finalMatCost * (p.initialAnnualVolume || 0);

                      return (
                        <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                          <div className="font-semibold text-slate-900 text-xs truncate">{p.name || 'Unnamed Product'}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>Materials Mapped:</span>
                            <span className="font-bold text-slate-700">{pMaterials.length} items</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-600">Material Cost / Unit:</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(finalMatCost, symbol, 2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>Annual Materials Spend:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(annualCost, symbol, 0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT LABOR */}
          {cogsSubTab === 'labor' && (
            <div className="space-y-4">
              {/* Header and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-emerald-700" />
                    Direct Production Labor Scheduling & Quota Rates
                  </div>
                  <p className="text-xs text-emerald-800/80 leading-relaxed max-w-2xl">
                    Add production workers and choose their classification: <span className="font-semibold text-emerald-900">Fixed</span> (enter daily rate to automatically calculate monthly and annual salaries) or <span className="font-semibold text-emerald-900">By Quota</span> (enter pay per piece produced to automatically compute annual labor cost using the product's annual volume).
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    title="Recalculate and synchronize direct labor wages into finished product unit costs"
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      syncFeedback
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                        : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                    }`}
                  >
                    {syncFeedback ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Synced!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sync Labor</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={addDirectLabor}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Production Labor</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards for Labor */}
              {directLabor.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Total Production Headcount</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {directLabor.reduce((sum, l) => sum + (l.numberOfEmployees || 0), 0)} workers
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Fixed Wage Labor (Y1)</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">
                      {formatCurrency(
                        directLabor
                          .filter((l) => l.classification === 'fixed')
                          .reduce((sum, l) => {
                            const days = l.workingDaysPerMonth || 26;
                            return sum + (l.dailyRate || 0) * days * 12 * (l.numberOfEmployees || 0);
                          }, 0),
                        symbol,
                        0
                      )}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Quota / Piece-Rate Labor (Y1)</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">
                      {formatCurrency(
                        directLabor
                          .filter((l) => l.classification === 'quota')
                          .reduce((sum, l) => {
                            const prod = products.find((p) => p.id === l.productId);
                            const vol = prod
                              ? prod.initialAnnualVolume
                              : products.reduce((s, p) => s + p.initialAnnualVolume, 0);
                            return sum + (l.ratePerPiece || 0) * vol;
                          }, 0),
                        symbol,
                        0
                      )}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-emerald-700 font-medium block">Total Annual Direct Labor</span>
                    <span className="text-lg font-bold text-emerald-900 font-mono">
                      {formatCurrency(
                        directLabor.reduce((sum, l) => {
                          if (l.classification === 'fixed') {
                            const days = l.workingDaysPerMonth || 26;
                            return sum + (l.dailyRate || 0) * days * 12 * (l.numberOfEmployees || 0);
                          } else {
                            const prod = products.find((p) => p.id === l.productId);
                            const vol = prod
                              ? prod.initialAnnualVolume
                              : products.reduce((s, p) => s + p.initialAnnualVolume, 0);
                            return sum + (l.ratePerPiece || 0) * vol;
                          }
                        }, 0),
                        symbol,
                        0
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Table of Direct Labor */}
              {directLabor.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Direct Labor Roles Added Yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Define factory operators, assemblers, bakers, or packaging staff. Choose between fixed daily rates or quota pay per piece.
                  </p>
                  <button
                    onClick={addDirectLabor}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Labor Role</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[960px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Role / Position</th>
                        <th className="py-2.5 px-3">Assigned Product</th>
                        <th className="py-2.5 px-3 text-center">Headcount</th>
                        <th className="py-2.5 px-3">Classification</th>
                        <th className="py-2.5 px-3 text-right">Compensation Rate ({symbol})</th>
                        <th className="py-2.5 px-3 text-right">Monthly Salary</th>
                        <th className="py-2.5 px-3 text-right">Annual Salary (per worker)</th>
                        <th className="py-2.5 px-3 text-right">Total Annual Labor Cost</th>
                        <th className="py-2.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {directLabor.map((l) => {
                        const isFixed = l.classification === 'fixed';
                        const workingDays = l.workingDaysPerMonth || 26;

                        // Fixed calculation
                        const monthlySalaryPerWorker = (l.dailyRate || 0) * workingDays;
                        const annualSalaryPerWorker = monthlySalaryPerWorker * 12;
                        const totalFixedCost = annualSalaryPerWorker * (l.numberOfEmployees || 0);

                        // Quota calculation
                        const prod = products.find((p) => p.id === l.productId);
                        const annualVolume = prod
                          ? prod.initialAnnualVolume
                          : products.reduce((s, p) => s + p.initialAnnualVolume, 0);
                        const totalQuotaCost = (l.ratePerPiece || 0) * annualVolume;
                        const quotaMonthlyEquivalent = totalQuotaCost / 12;

                        const totalRoleCost = isFixed ? totalFixedCost : totalQuotaCost;

                        return (
                          <tr key={l.id} className="hover:bg-slate-50/60">
                            {/* Role Name */}
                            <td className="py-2 px-3 font-sans">
                              <input
                                type="text"
                                value={l.roleName}
                                onChange={(e) => updateDirectLabor(l.id, 'roleName', e.target.value)}
                                placeholder="e.g. Machine Operator"
                                className="w-44 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                              />
                            </td>

                            {/* Assigned Product */}
                            <td className="py-2 px-3 font-sans">
                              <select
                                value={l.productId}
                                onChange={(e) => updateDirectLabor(l.id, 'productId', e.target.value)}
                                className="w-40 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 text-xs"
                              >
                                <option value="all">All Products (General)</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name || 'Unnamed Product'}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Number of employees */}
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                step="1"
                                value={l.numberOfEmployees === 0 ? '' : l.numberOfEmployees}
                                onChange={(e) =>
                                  updateDirectLabor(
                                    l.id,
                                    'numberOfEmployees',
                                    e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                              />
                            </td>

                            {/* Classification */}
                            <td className="py-2 px-3 font-sans">
                              <select
                                value={l.classification}
                                onChange={(e) =>
                                  updateDirectLabor(l.id, 'classification', e.target.value as LaborClassification)
                                }
                                className={`px-2 py-1 rounded text-xs font-semibold border ${
                                  isFixed
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                <option value="fixed">Fixed (Daily Rate)</option>
                                <option value="quota">By Quota (Piece-Rate)</option>
                              </select>
                            </td>

                            {/* Rate Input: Daily Rate vs Quota Rate */}
                            <td className="py-2 px-3 text-right">
                              {isFixed ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={l.dailyRate === 0 ? '' : l.dailyRate}
                                    onChange={(e) =>
                                      updateDirectLabor(
                                        l.id,
                                        'dailyRate',
                                        e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="0.00"
                                    className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                                  />
                                  <span className="text-[10px] text-slate-500">/day</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    step="0.05"
                                    value={l.ratePerPiece === 0 ? '' : l.ratePerPiece}
                                    onChange={(e) =>
                                      updateDirectLabor(
                                        l.id,
                                        'ratePerPiece',
                                        e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="0.00"
                                    className="w-20 px-2 py-1 text-right bg-white border border-purple-200 rounded font-bold text-purple-900 focus:outline-purple-600 placeholder:text-slate-300 font-mono"
                                  />
                                  <span className="text-[10px] text-purple-700 font-semibold">/piece</span>
                                </div>
                              )}
                            </td>

                            {/* Auto Monthly Salary */}
                            <td className="py-2 px-3 text-right font-medium text-slate-700">
                              {isFixed ? (
                                <div>
                                  {formatCurrency(monthlySalaryPerWorker, symbol, 0)}
                                  <span className="block text-[10px] text-slate-400 font-sans">
                                    {workingDays} days/mo
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  {formatCurrency(quotaMonthlyEquivalent, symbol, 0)}
                                  <span className="block text-[10px] text-purple-600 font-sans">
                                    (Avg quota/mo)
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Auto Annual Salary per Worker */}
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              {isFixed ? (
                                formatCurrency(annualSalaryPerWorker, symbol, 0)
                              ) : (
                                <span className="text-slate-500 font-normal">
                                  {l.numberOfEmployees > 0
                                    ? formatCurrency(totalQuotaCost / l.numberOfEmployees, symbol, 0)
                                    : '— (Quota)'}
                                </span>
                              )}
                            </td>

                            {/* Auto Total Annual Labor Cost */}
                            <td className="py-2 px-3 text-right font-bold text-emerald-800">
                              {formatCurrency(totalRoleCost, symbol, 0)}
                              {!isFixed && (
                                <span className="block text-[10px] text-slate-500 font-normal">
                                  {annualVolume.toLocaleString()} units @ {formatCurrency(l.ratePerPiece || 0, symbol, 2)}
                                </span>
                              )}
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => deleteDirectLabor(l.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Labor Role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Per-Product Direct Labor Rollup Summary */}
              {products.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Direct Labor Unit Allocation per Finished Product
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {products.map((p) => {
                      const totalVol = products.reduce((s, pr) => s + (pr.initialAnnualVolume || 0), 0);
                      const pLabor = directLabor.filter(
                        (l) => l.productId === p.id || l.productId === 'all' || !l.productId
                      );

                      const quotaCost = pLabor
                        .filter((l) => l.classification === 'quota' && (l.productId === p.id || l.productId === 'all'))
                        .reduce((sum, l) => sum + (l.ratePerPiece || 0), 0);

                      const fixedCost = pLabor
                        .filter((l) => l.classification === 'fixed')
                        .reduce((sum, l) => {
                          const days = l.workingDaysPerMonth || 26;
                          const annualWorker = (l.dailyRate || 0) * days * 12;
                          const roleTotal = annualWorker * (l.numberOfEmployees || 0);
                          if (l.productId === p.id) {
                            return sum + (p.initialAnnualVolume > 0 ? roleTotal / p.initialAnnualVolume : 0);
                          } else {
                            return sum + (totalVol > 0 ? roleTotal / totalVol : 0);
                          }
                        }, 0);

                      const finalLaborPerUnit = pLabor.length > 0 ? quotaCost + fixedCost : p.directLaborPerUnit;
                      const annualLabor = finalLaborPerUnit * (p.initialAnnualVolume || 0);

                      return (
                        <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                          <div className="font-semibold text-slate-900 text-xs truncate">{p.name || 'Unnamed Product'}</div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-600">Labor Cost / Unit:</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(finalLaborPerUnit, symbol, 2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>Total Annual Labor:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(annualLabor, symbol, 0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACTORY OVERHEAD */}
          {cogsSubTab === 'overhead' && (() => {
            const totalProductionVolume = products.reduce((sum, p) => sum + (p.initialAnnualVolume || 0), 0);

            // 1. Indirect Labor Summary
            const totalIndirectLaborCost = indirectLabor.reduce((sum, l) => {
              if (l.classification === 'fixed') {
                const days = l.workingDaysPerMonth || 26;
                return sum + (l.dailyRate || 0) * days * 12 * (l.numberOfEmployees || 0);
              } else {
                const prod = products.find((p) => p.id === l.productId);
                const vol = prod ? prod.initialAnnualVolume : totalProductionVolume;
                return sum + (l.ratePerPiece || 0) * vol;
              }
            }, 0);
            const totalIndirectEmployees = indirectLabor.reduce(
              (sum, l) => sum + (l.classification === 'fixed' ? (l.numberOfEmployees || 0) : 0),
              0
            );

            // 2. Indirect Materials Summary
            const totalIndirectMaterialsCost = indirectMaterials.reduce((sum, m) => {
              if (typeof m.annualCost === 'number' && m.annualCost > 0) return sum + m.annualCost;
              return sum + (m.costPerMaterialUnit || 0) * (m.annualQuantity || 0);
            }, 0);

            // 3. Indirect Utilities Summary
            const totalUtilitiesGrossCost = indirectUtilities.reduce((sum, u) => sum + (u.annualCost || 0), 0);
            const totalUtilitiesOverheadCost = indirectUtilities.reduce((sum, u) => {
              let pct = 100;
              if (u.allocationCategory === 'opex') pct = 0;
              else if (u.allocationCategory === 'percentage') pct = typeof u.overheadPercent === 'number' ? u.overheadPercent : 100;
              return sum + (u.annualCost || 0) * (pct / 100);
            }, 0);
            const totalUtilitiesOpexCost = totalUtilitiesGrossCost - totalUtilitiesOverheadCost;

            // 4. Fixed Assets Summary (Active Year 1 assets)
            const totalCapexGrossDepr = capex.reduce((sum, a) => {
              if (a.purchaseYear > 1) return sum;
              const base = Math.max(0, a.acquisitionCost - (a.salvageValue || 0));
              return sum + (a.usefulLifeYears > 0 ? base / a.usefulLifeYears : 0);
            }, 0);
            const totalCapexOverheadDepr = capex.reduce((sum, a) => {
              if (a.purchaseYear > 1) return sum;
              const base = Math.max(0, a.acquisitionCost - (a.salvageValue || 0));
              const depr = a.usefulLifeYears > 0 ? base / a.usefulLifeYears : 0;
              let pct = 100;
              if (a.overheadAllocationCategory === 'operating') pct = 0;
              else if (a.overheadAllocationCategory === 'percentage') pct = typeof a.overheadPercent === 'number' ? a.overheadPercent : 100;
              return sum + depr * (pct / 100);
            }, 0);
            const totalCapexOperatingDepr = totalCapexGrossDepr - totalCapexOverheadDepr;

            // Legacy items
            const totalLegacyOverheadCost = factoryOverhead.reduce((sum, o) => sum + (o.annualCost || 0), 0);

            // Grand Total Annual Overhead
            const grandTotalOverhead =
              totalIndirectLaborCost +
              totalIndirectMaterialsCost +
              totalUtilitiesOverheadCost +
              totalCapexOverheadDepr +
              totalLegacyOverheadCost;

            const unitOverheadWeighted = totalProductionVolume > 0 ? grandTotalOverhead / totalProductionVolume : 0;

            return (
              <div className="space-y-6">
                {/* Header and Add Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                  <div className="space-y-1">
                    <div className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                      <Factory className="w-5 h-5 text-emerald-700" />
                      Factory Overhead & Manufacturing Support
                    </div>
                    <p className="text-xs text-emerald-800/80 leading-relaxed max-w-2xl">
                      Factory Overhead is structured across 4 distinct schedules: Indirect Labor, Indirect Materials, Indirect Utilities, and Fixed Assets (CAPEX Depreciation). All factory-level overhead is unified and allocated across finished production units.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      title="Recalculate and synchronize factory overhead into finished product unit costs"
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        syncFeedback
                          ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                          : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                      }`}
                    >
                      {syncFeedback ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Synced!</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sync Overhead</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Overhead KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold">Grand Total Overhead</span>
                      <Factory className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(grandTotalOverhead, symbol, 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Annual manufacturing overhead</div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold">1. Indirect Labor</span>
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-black text-blue-700 font-mono">
                      {formatCurrency(totalIndirectLaborCost, symbol, 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {indirectLabor.length} roles ({totalIndirectEmployees} headcount)
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold">2. Indirect Materials</span>
                      <Boxes className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-black text-purple-700 font-mono">
                      {formatCurrency(totalIndirectMaterialsCost, symbol, 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {indirectMaterials.length} unified consumables
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold">3. Indirect Utilities</span>
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-lg font-black text-amber-700 font-mono">
                      {formatCurrency(totalUtilitiesOverheadCost, symbol, 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Overhead share (OPEX: {formatCurrency(totalUtilitiesOpexCost, symbol, 0)})
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold">4. Fixed Assets (CAPEX)</span>
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-lg font-black text-indigo-700 font-mono">
                      {formatCurrency(totalCapexOverheadDepr, symbol, 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Depreciation share (OPEX: {formatCurrency(totalCapexOperatingDepr, symbol, 0)})
                    </div>
                  </div>
                </div>

                {/* Sub-Navigation Filter */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOverheadActiveSubTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      overheadActiveSubTab === 'all'
                        ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>All 4 Overhead Tables</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadActiveSubTab('labor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      overheadActiveSubTab === 'labor'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Indirect Labor ({indirectLabor.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadActiveSubTab('materials')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      overheadActiveSubTab === 'materials'
                        ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    <span>2. Indirect Materials ({indirectMaterials.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadActiveSubTab('utilities')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      overheadActiveSubTab === 'utilities'
                        ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Indirect Utilities ({indirectUtilities.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadActiveSubTab('fixedAssets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      overheadActiveSubTab === 'fixedAssets'
                        ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Factory className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4. Fixed Assets (CAPEX) ({capex.length})</span>
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* 1. INDIRECT LABOR TABLE (1.1) */}
                {/* ========================================================================= */}
                {(overheadActiveSubTab === 'all' || overheadActiveSubTab === 'labor') && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          1. Indirect Labor Schedule
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Factory plant supervisors, quality inspectors, maintenance crew, and support personnel. Add as many positions as needed (formatted identically to Direct Labor).
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={addIndirectLabor}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Indirect Labor Role</span>
                        </button>
                      </div>
                    </div>

                    {indirectLabor.length === 0 ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">No Indirect Labor Employees Added Yet</div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Add plant supervisors, technicians, maintenance specialists, or QA personnel.
                        </p>
                        <button
                          type="button"
                          onClick={addIndirectLabor}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Indirect Employee</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                        <table className="w-full min-w-[960px] text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Role / Position</th>
                              <th className="py-2.5 px-3">Assigned Product</th>
                              <th className="py-2.5 px-3 text-center">Headcount</th>
                              <th className="py-2.5 px-3">Classification</th>
                              <th className="py-2.5 px-3 text-right">Compensation Rate ({symbol})</th>
                              <th className="py-2.5 px-3 text-right">Monthly Salary</th>
                              <th className="py-2.5 px-3 text-right">Annual Salary (per worker)</th>
                              <th className="py-2.5 px-3 text-right">Total Annual Cost</th>
                              <th className="py-2.5 px-3 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {indirectLabor.map((l) => {
                              const isFixed = l.classification === 'fixed';
                              const workingDays = l.workingDaysPerMonth || 26;

                              const monthlySalaryPerWorker = (l.dailyRate || 0) * workingDays;
                              const annualSalaryPerWorker = monthlySalaryPerWorker * 12;
                              const totalFixedCost = annualSalaryPerWorker * (l.numberOfEmployees || 0);

                              const prod = products.find((p) => p.id === l.productId);
                              const annualVolume = prod
                                ? prod.initialAnnualVolume
                                : totalProductionVolume;
                              const totalQuotaCost = (l.ratePerPiece || 0) * annualVolume;
                              const quotaMonthlyEquivalent = totalQuotaCost / 12;
                              const totalRoleCost = isFixed ? totalFixedCost : totalQuotaCost;

                              return (
                                <tr key={l.id} className="hover:bg-slate-50/60">
                                  {/* Role Name */}
                                  <td className="py-2 px-3 font-sans">
                                    <input
                                      type="text"
                                      value={l.roleName}
                                      onChange={(e) => updateIndirectLabor(l.id, 'roleName', e.target.value)}
                                      placeholder="e.g. Factory Supervisor / QC"
                                      className="w-48 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-blue-600 placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* Assigned Product */}
                                  <td className="py-2 px-3 font-sans">
                                    <select
                                      value={l.productId}
                                      onChange={(e) => updateIndirectLabor(l.id, 'productId', e.target.value)}
                                      className="w-40 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-blue-600 text-xs"
                                    >
                                      <option value="all">All Products (General)</option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name || 'Unnamed Product'}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Headcount */}
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="number"
                                      step="1"
                                      min="1"
                                      value={l.numberOfEmployees === 0 ? '' : l.numberOfEmployees}
                                      onChange={(e) =>
                                        updateIndirectLabor(
                                          l.id,
                                          'numberOfEmployees',
                                          e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                        )
                                      }
                                      placeholder="1"
                                      className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-blue-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Classification */}
                                  <td className="py-2 px-3 font-sans">
                                    <select
                                      value={l.classification}
                                      onChange={(e) =>
                                        updateIndirectLabor(l.id, 'classification', e.target.value as LaborClassification)
                                      }
                                      className={`px-2 py-1 rounded text-xs font-semibold border ${
                                        isFixed
                                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                                          : 'bg-purple-50 text-purple-800 border-purple-200'
                                      }`}
                                    >
                                      <option value="fixed">Fixed (Daily Rate)</option>
                                      <option value="quota">By Quota (Piece-Rate)</option>
                                    </select>
                                  </td>

                                  {/* Compensation Rate */}
                                  <td className="py-2 px-3 text-right">
                                    {isFixed ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          step="0.5"
                                          value={l.dailyRate === 0 ? '' : l.dailyRate}
                                          onChange={(e) =>
                                            updateIndirectLabor(
                                              l.id,
                                              'dailyRate',
                                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                            )
                                          }
                                          placeholder="0.00"
                                          className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-blue-600 placeholder:text-slate-300 font-mono"
                                        />
                                        <span className="text-[10px] text-slate-500">/day</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          step="0.05"
                                          value={l.ratePerPiece === 0 ? '' : l.ratePerPiece}
                                          onChange={(e) =>
                                            updateIndirectLabor(
                                              l.id,
                                              'ratePerPiece',
                                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                            )
                                          }
                                          placeholder="0.00"
                                          className="w-20 px-2 py-1 text-right bg-white border border-purple-200 rounded font-bold text-purple-900 focus:outline-purple-600 placeholder:text-slate-300 font-mono"
                                        />
                                        <span className="text-[10px] text-purple-700 font-semibold">/piece</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Monthly Salary */}
                                  <td className="py-2 px-3 text-right font-medium text-slate-700">
                                    {isFixed ? (
                                      <div>
                                        {formatCurrency(monthlySalaryPerWorker, symbol, 0)}
                                        <span className="block text-[10px] text-slate-400 font-sans">
                                          {workingDays} days/mo
                                        </span>
                                      </div>
                                    ) : (
                                      <div>
                                        {formatCurrency(quotaMonthlyEquivalent, symbol, 0)}
                                        <span className="block text-[10px] text-purple-600 font-sans">
                                          (Avg quota/mo)
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Annual Salary per Worker */}
                                  <td className="py-2 px-3 text-right font-bold text-slate-800">
                                    {isFixed ? (
                                      formatCurrency(annualSalaryPerWorker, symbol, 0)
                                    ) : (
                                      <span className="text-slate-500 font-normal">
                                        {l.numberOfEmployees > 0
                                          ? formatCurrency(totalQuotaCost / l.numberOfEmployees, symbol, 0)
                                          : '—'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Total Annual Cost */}
                                  <td className="py-2 px-3 text-right font-bold text-blue-700">
                                    {formatCurrency(totalRoleCost, symbol, 0)}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteIndirectLabor(l.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Delete Indirect Labor Role"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                              <td colSpan={2} className="py-2.5 px-3">
                                Total Indirect Labor ({indirectLabor.length} roles)
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {totalIndirectEmployees}
                              </td>
                              <td colSpan={4}></td>
                              <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm">
                                {formatCurrency(totalIndirectLaborCost, symbol, 0)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. INDIRECT MATERIALS TABLE (1.2) - Unified table for all products */}
                {/* ========================================================================= */}
                {(overheadActiveSubTab === 'all' || overheadActiveSubTab === 'materials') && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-purple-600" />
                          2. Indirect Materials & Plant Supplies
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Unified single table for all indirect materials and factory supplies (e.g. machine grease, lubricants, sanitizers, gloves, maintenance consumables).
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={addIndirectMaterial}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Indirect Material</span>
                        </button>
                      </div>
                    </div>

                    {indirectMaterials.length === 0 ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">No Indirect Materials Added Yet</div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Track plant lubricants, cleaning agents, packaging tape, tools, and safety gear.
                        </p>
                        <button
                          type="button"
                          onClick={addIndirectMaterial}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Indirect Material</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                        <table className="w-full min-w-[800px] text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Material Description / Consumable</th>
                              <th className="py-2.5 px-3">Unit of Measure</th>
                              <th className="py-2.5 px-3 text-right">Cost per Material Unit ({symbol})</th>
                              <th className="py-2.5 px-3 text-right">Annual Quantity</th>
                              <th className="py-2.5 px-3 text-right">Total Annual Cost ({symbol})</th>
                              <th className="py-2.5 px-3 text-right">Cost / Finished Unit</th>
                              <th className="py-2.5 px-3 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {indirectMaterials.map((m) => {
                              const annualCost =
                                typeof m.annualCost === 'number' && m.annualCost > 0
                                  ? m.annualCost
                                  : (m.costPerMaterialUnit || 0) * (m.annualQuantity || 0);
                              const costPerFinishedUnit =
                                totalProductionVolume > 0 ? annualCost / totalProductionVolume : 0;

                              return (
                                <tr key={m.id} className="hover:bg-slate-50/60">
                                  {/* Name */}
                                  <td className="py-2 px-3 font-sans">
                                    <input
                                      type="text"
                                      value={m.materialName}
                                      onChange={(e) => updateIndirectMaterial(m.id, 'materialName', e.target.value)}
                                      placeholder="e.g. Machine Lubricant & Grease"
                                      className="w-56 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-purple-600 placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* Unit of Measure */}
                                  <td className="py-2 px-3 font-sans">
                                    <input
                                      type="text"
                                      value={m.unitOfMeasure || ''}
                                      onChange={(e) => updateIndirectMaterial(m.id, 'unitOfMeasure', e.target.value)}
                                      placeholder="Liters, kg, drums, boxes"
                                      className="w-32 px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-purple-600"
                                    />
                                  </td>

                                  {/* Cost per unit */}
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={m.costPerMaterialUnit === 0 ? '' : m.costPerMaterialUnit}
                                      onChange={(e) =>
                                        updateIndirectMaterial(
                                          m.id,
                                          'costPerMaterialUnit',
                                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0.00"
                                      className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-purple-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Annual Quantity */}
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      step="1"
                                      value={m.annualQuantity === 0 ? '' : m.annualQuantity}
                                      onChange={(e) =>
                                        updateIndirectMaterial(
                                          m.id,
                                          'annualQuantity',
                                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0"
                                      className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-purple-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Total Annual Cost */}
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      step="1"
                                      value={m.annualCost === 0 ? '' : m.annualCost}
                                      onChange={(e) =>
                                        updateIndirectMaterial(
                                          m.id,
                                          'annualCost',
                                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0"
                                      className="w-28 px-2 py-1 text-right bg-white border border-purple-200 rounded font-bold text-purple-900 focus:outline-purple-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Cost per finished unit */}
                                  <td className="py-2 px-3 text-right font-bold text-slate-800">
                                    {formatCurrency(costPerFinishedUnit, symbol, 3)}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteIndirectMaterial(m.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Delete Material"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                              <td colSpan={4} className="py-2.5 px-3">
                                Total Indirect Materials ({indirectMaterials.length} items)
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-purple-700 text-sm">
                                {formatCurrency(totalIndirectMaterialsCost, symbol, 0)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-purple-700">
                                {formatCurrency(
                                  totalProductionVolume > 0
                                    ? totalIndirectMaterialsCost / totalProductionVolume
                                    : 0,
                                  symbol,
                                  3
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. INDIRECT UTILITIES TABLE (1.3) - Fixed Expenses with category split */}
                {/* ========================================================================= */}
                {(overheadActiveSubTab === 'all' || overheadActiveSubTab === 'utilities') && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600" />
                          3. Indirect Utilities & Fixed Facility Expenses
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Manage fixed utility accounts (Electricity, Water, Natural Gas, Facility Internet). Assign the entire cost to Factory Overhead or Operating Expenses (OPEX), or enter a percentage split.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={addIndirectUtility}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Utility Expense</span>
                        </button>
                      </div>
                    </div>

                    {indirectUtilities.length === 0 ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">No Utility Accounts Added Yet</div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Add factory electricity, gas, municipal water, or industrial waste management fees.
                        </p>
                        <button
                          type="button"
                          onClick={addIndirectUtility}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Utility Account</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                        <table className="w-full min-w-[920px] text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Expenses Account</th>
                              <th className="py-2.5 px-3 text-right">Monthly Cost ({symbol})</th>
                              <th className="py-2.5 px-3 text-right">Annual Cost ({symbol})</th>
                              <th className="py-2.5 px-3">Allocation Category</th>
                              <th className="py-2.5 px-3 text-center">Overhead / OPEX Split</th>
                              <th className="py-2.5 px-3 text-right">Factory Overhead Share</th>
                              <th className="py-2.5 px-3 text-right">OPEX Share</th>
                              <th className="py-2.5 px-3 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {indirectUtilities.map((u) => {
                              const annualCost = u.annualCost || (u.monthlyCost || 0) * 12;
                              let overheadPct = 100;
                              if (u.allocationCategory === 'opex') overheadPct = 0;
                              else if (u.allocationCategory === 'percentage') {
                                overheadPct = typeof u.overheadPercent === 'number' ? u.overheadPercent : 100;
                              }
                              const opexPct = 100 - overheadPct;
                              const overheadAmount = annualCost * (overheadPct / 100);
                              const opexAmount = annualCost * (opexPct / 100);

                              return (
                                <tr key={u.id} className="hover:bg-slate-50/60">
                                  {/* Expenses Account */}
                                  <td className="py-2 px-3 font-sans">
                                    <input
                                      type="text"
                                      value={u.expenseAccount}
                                      onChange={(e) => updateIndirectUtility(u.id, 'expenseAccount', e.target.value)}
                                      placeholder="e.g. Factory Electricity & Power"
                                      className="w-52 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-amber-600 placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* Monthly Cost */}
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      step="10"
                                      value={u.monthlyCost === 0 ? '' : u.monthlyCost}
                                      onChange={(e) =>
                                        updateIndirectUtility(
                                          u.id,
                                          'monthlyCost',
                                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0"
                                      className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-amber-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Annual Cost */}
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      step="100"
                                      value={u.annualCost === 0 ? '' : u.annualCost}
                                      onChange={(e) =>
                                        updateIndirectUtility(
                                          u.id,
                                          'annualCost',
                                          e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                        )
                                      }
                                      placeholder="0"
                                      className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-amber-600 placeholder:text-slate-300 font-mono"
                                    />
                                  </td>

                                  {/* Allocation Category */}
                                  <td className="py-2 px-3 font-sans">
                                    <select
                                      value={u.allocationCategory}
                                      onChange={(e) =>
                                        updateIndirectUtility(
                                          u.id,
                                          'allocationCategory',
                                          e.target.value as UtilityAllocationCategory
                                        )
                                      }
                                      className="w-48 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs font-semibold focus:outline-amber-600"
                                    >
                                      <option value="overhead">100% Factory Overhead</option>
                                      <option value="opex">100% Operating Expenses</option>
                                      <option value="percentage">Percentage Split (%)</option>
                                    </select>
                                  </td>

                                  {/* Percentage input / display */}
                                  <td className="py-2 px-3 text-center">
                                    {u.allocationCategory === 'percentage' ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={u.overheadPercent ?? 50}
                                          onChange={(e) =>
                                            updateIndirectUtility(
                                              u.id,
                                              'overheadPercent',
                                              Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                                            )
                                          }
                                          className="w-14 px-1.5 py-1 text-center bg-white border border-amber-300 rounded font-bold text-amber-900 focus:outline-amber-600 text-xs"
                                        />
                                        <span className="text-[10px] text-slate-500 font-sans">
                                          % OH / {100 - (u.overheadPercent ?? 50)}% OPEX
                                        </span>
                                      </div>
                                    ) : (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                          u.allocationCategory === 'overhead'
                                            ? 'bg-emerald-50 text-emerald-800'
                                            : 'bg-blue-50 text-blue-800'
                                        }`}
                                      >
                                        {u.allocationCategory === 'overhead' ? '100% Overhead' : '100% OPEX'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Overhead Share */}
                                  <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                    {formatCurrency(overheadAmount, symbol, 0)}
                                  </td>

                                  {/* OPEX Share */}
                                  <td className="py-2 px-3 text-right font-semibold text-slate-600">
                                    {formatCurrency(opexAmount, symbol, 0)}
                                  </td>

                                  {/* Delete */}
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteIndirectUtility(u.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Delete Utility Expense"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                              <td colSpan={2} className="py-2.5 px-3">
                                Total Indirect Utilities ({indirectUtilities.length} accounts)
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {formatCurrency(totalUtilitiesGrossCost, symbol, 0)}
                              </td>
                              <td colSpan={2} className="text-right text-xs text-slate-500 font-sans">
                                Breakdown:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm">
                                {formatCurrency(totalUtilitiesOverheadCost, symbol, 0)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {formatCurrency(totalUtilitiesOpexCost, symbol, 0)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. FIXED ASSETS (1.4) - Automatically reflects CAPEX assets with depreciation */}
                {/* ========================================================================= */}
                {(overheadActiveSubTab === 'all' || overheadActiveSubTab === 'fixedAssets') && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Factory className="w-4 h-4 text-indigo-600" />
                          4. Fixed Assets (CAPEX Depreciation Allocation)
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Automatically reflects all capital assets registered in Section 5 (CAPEX). Designate whether depreciation is charged to Factory Overhead (COGS) or Operating Expenses (OPEX) in whole or by percentage.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setActiveSection('capex')}
                          className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Manage Assets in CAPEX</span>
                          <ArrowRight className="w-3 h-3 text-indigo-600" />
                        </button>
                      </div>
                    </div>

                    {capex.length === 0 ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-900">No Capital Assets Registered in CAPEX</div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Add factory equipment, production machinery, delivery vehicles, and plant infrastructure in Section 1 (CAPEX) to allocate their depreciation here.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveSection('capex')}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Go to 1. Capital Assets (CAPEX)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                        <table className="w-full min-w-[920px] text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Capital Asset (from CAPEX)</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-right">Acquisition Cost ({symbol})</th>
                              <th className="py-2.5 px-3 text-center">Useful Life</th>
                              <th className="py-2.5 px-3 text-right">Annual Depreciation ({symbol})</th>
                              <th className="py-2.5 px-3">Depreciation Allocation</th>
                              <th className="py-2.5 px-3 text-center">Overhead / OPEX Split</th>
                              <th className="py-2.5 px-3 text-right">Factory Overhead Depr</th>
                              <th className="py-2.5 px-3 text-right">Operating Depr</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {capex.map((asset) => {
                              const deprBase = Math.max(0, asset.acquisitionCost - (asset.salvageValue || 0));
                              const annualDepr = asset.usefulLifeYears > 0 ? deprBase / asset.usefulLifeYears : 0;

                              const allocation = asset.overheadAllocationCategory || 'overhead';
                              let overheadPct = 100;
                              if (allocation === 'operating') overheadPct = 0;
                              else if (allocation === 'percentage') {
                                overheadPct = typeof asset.overheadPercent === 'number' ? asset.overheadPercent : 100;
                              }
                              const opexPct = 100 - overheadPct;
                              const factoryDeprAmount = annualDepr * (overheadPct / 100);
                              const opexDeprAmount = annualDepr * (opexPct / 100);

                              return (
                                <tr key={asset.id} className="hover:bg-slate-50/60">
                                  {/* Asset Name */}
                                  <td className="py-2 px-3 font-sans">
                                    <div className="font-bold text-slate-900">{asset.name || 'Unnamed Asset'}</div>
                                    <div className="text-[10px] text-slate-400">
                                      Purchase Year: {asset.purchaseYear === 0 ? 'Year 0 (Pre-ops)' : `Year ${asset.purchaseYear}`}
                                    </div>
                                  </td>

                                  {/* Category */}
                                  <td className="py-2 px-3 font-sans">
                                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                                      {asset.category}
                                    </span>
                                  </td>

                                  {/* Acquisition Cost */}
                                  <td className="py-2 px-3 text-right font-medium text-slate-900">
                                    {formatCurrency(asset.acquisitionCost, symbol, 0)}
                                  </td>

                                  {/* Useful life */}
                                  <td className="py-2 px-3 text-center font-sans">
                                    {asset.usefulLifeYears} yrs
                                  </td>

                                  {/* Annual straight-line depreciation */}
                                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                                    {formatCurrency(annualDepr, symbol, 0)}
                                  </td>

                                  {/* Allocation Category dropdown */}
                                  <td className="py-2 px-3 font-sans">
                                    <select
                                      value={allocation}
                                      onChange={(e) =>
                                        updateCapexOverheadAllocation(
                                          asset.id,
                                          e.target.value as FixedAssetOverheadCategory
                                        )
                                      }
                                      className="w-44 px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 text-xs font-semibold focus:outline-indigo-600"
                                    >
                                      <option value="overhead">100% Factory Overhead</option>
                                      <option value="operating">100% Operating Expenses</option>
                                      <option value="percentage">Percentage Method (%)</option>
                                    </select>
                                  </td>

                                  {/* Split Input / Display */}
                                  <td className="py-2 px-3 text-center">
                                    {allocation === 'percentage' ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={asset.overheadPercent ?? 50}
                                          onChange={(e) =>
                                            updateCapexOverheadPercent(
                                              asset.id,
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-14 px-1.5 py-1 text-center bg-white border border-indigo-300 rounded font-bold text-indigo-900 focus:outline-indigo-600 text-xs"
                                        />
                                        <span className="text-[10px] text-slate-500 font-sans">
                                          % OH / {100 - (asset.overheadPercent ?? 50)}% OPEX
                                        </span>
                                      </div>
                                    ) : (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                          allocation === 'overhead'
                                            ? 'bg-emerald-50 text-emerald-800'
                                            : 'bg-indigo-50 text-indigo-800'
                                        }`}
                                      >
                                        {allocation === 'overhead' ? '100% Overhead' : '100% OPEX'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Factory Overhead Depreciation */}
                                  <td className="py-2 px-3 text-right font-bold text-indigo-700">
                                    {formatCurrency(factoryDeprAmount, symbol, 0)}
                                  </td>

                                  {/* Operating Depreciation */}
                                  <td className="py-2 px-3 text-right font-semibold text-slate-600">
                                    {formatCurrency(opexDeprAmount, symbol, 0)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                              <td colSpan={4} className="py-2.5 px-3">
                                Total Active Capital Assets ({capex.length} assets)
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {formatCurrency(totalCapexGrossDepr, symbol, 0)}
                              </td>
                              <td colSpan={2} className="text-right text-xs text-slate-500 font-sans">
                                Allocation Totals:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-indigo-700 text-sm">
                                {formatCurrency(totalCapexOverheadDepr, symbol, 0)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {formatCurrency(totalCapexOperatingDepr, symbol, 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy / Other Overhead Items (Collapsible / If existing) */}
                {factoryOverhead.length > 0 && (
                  <details className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs group">
                    <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Other / Legacy Factory Overhead Items ({factoryOverhead.length} items)</span>
                      </div>
                      <span className="text-slate-500 font-mono">
                        {formatCurrency(totalLegacyOverheadCost, symbol, 0)} / yr
                      </span>
                    </summary>
                    <div className="mt-3 overflow-x-auto scrollbar-thin border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2 px-3">Item Name</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-right">Annual Cost ({symbol})</th>
                            <th className="py-2 px-3 text-center w-12">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {factoryOverhead.map((o) => (
                            <tr key={o.id}>
                              <td className="py-2 px-3 font-sans">
                                <input
                                  type="text"
                                  value={o.name}
                                  onChange={(e) => updateFactoryOverhead(o.id, 'name', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900"
                                />
                              </td>
                              <td className="py-2 px-3 font-sans">
                                <span className="text-slate-600">{o.category}</span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  value={o.annualCost || ''}
                                  onChange={(e) =>
                                    updateFactoryOverhead(
                                      o.id,
                                      'annualCost',
                                      e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => deleteFactoryOverhead(o.id)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            );
          })()}

          {/* TAB 4: COGS SUMMARY MATRIX */}
          {cogsSubTab === 'summary' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-slate-700" />
                    Unit Cost Breakdown & Gross Margin Synthesis
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consolidated view of Direct Materials, Direct Labor, and Factory Overhead per finished unit against selling prices.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">All unit figures automatically sync to Income Statement & Cash Flow</span>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Products Available for Costing</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Please add product lines under Section 3 (Revenue & Selling Prices) first before formulating bill of materials and unit costs.
                  </p>
                  <button
                    onClick={() => setActiveSection('pricing')}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Go to 3. Revenue & Selling Prices</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-right">Selling Price</th>
                        <th className="py-2.5 px-3 text-right">Direct Material / Unit</th>
                        <th className="py-2.5 px-3 text-right">Direct Labor / Unit</th>
                        <th className="py-2.5 px-3 text-right">Overhead / Unit</th>
                        <th className="py-2.5 px-3 text-right">Total Unit COGS</th>
                        <th className="py-2.5 px-3 text-right">Unit Margin</th>
                        <th className="py-2.5 px-3 text-right">Gross Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {products.map((p) => {
                        const totalUnitCost = p.directMaterialPerUnit + p.directLaborPerUnit + p.overheadCostPerUnit;
                        const unitMargin = p.initialSellingPrice - totalUnitCost;
                        const marginPct = p.initialSellingPrice > 0 ? (unitMargin / p.initialSellingPrice) * 100 : 0;

                        const pMatCount = rawMaterials.filter((m) => m.productId === p.id).length;
                        const pLaborCount = directLabor.filter((l) => l.productId === p.id || l.productId === 'all').length;
                        const pOverheadCount = factoryOverhead.filter((o) => o.productId === p.id || o.productId === 'all').length;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                              {p.name || 'Unnamed Product'}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {p.category || 'General'} · {p.initialAnnualVolume.toLocaleString()} units/yr
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(p.initialSellingPrice, symbol, 2)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800">
                              {formatCurrency(p.directMaterialPerUnit, symbol, 2)}
                              {pMatCount > 0 && (
                                <span className="block text-[10px] text-emerald-600 font-sans">
                                  {pMatCount} BOM items
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800">
                              {formatCurrency(p.directLaborPerUnit, symbol, 2)}
                              {pLaborCount > 0 && (
                                <span className="block text-[10px] text-emerald-600 font-sans">
                                  {pLaborCount} labor roles
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800">
                              {formatCurrency(p.overheadCostPerUnit, symbol, 2)}
                              {pOverheadCount > 0 && (
                                <span className="block text-[10px] text-emerald-600 font-sans">
                                  {pOverheadCount} overhead items
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                              {formatCurrency(totalUnitCost, symbol, 2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {formatCurrency(unitMargin, symbol, 2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  marginPct >= 50
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : marginPct >= 25
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {marginPct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Company Policies */}
      {activeSection === 'policies' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Corporate Operating & Working Capital Policies
            </h2>
            <p className="text-xs text-slate-500">
              Institutional policies controlling commercial credit terms, safety stock turnover, payment periods, and liquidity reserves
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Accounts Receivable Credit Terms (DSO)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.accountsReceivableDays}
                  onChange={(e) => updatePolicies('accountsReceivableDays', parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600"
                />
                <span className="text-slate-500 font-medium">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Average collection period for credit sales before cash is deposited.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Credit Sales Share (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.creditSalesPercent}
                  onChange={(e) => updatePolicies('creditSalesPercent', parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600"
                />
                <span className="text-slate-500 font-medium">% on Credit</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Portion of sales invoiced on credit vs settled immediately in cash/POS ({100 - policies.creditSalesPercent}% Cash).
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Inventory Holding Policy (DSI)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.inventoryHoldingDays}
                  onChange={(e) => updatePolicies('inventoryHoldingDays', parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600"
                />
                <span className="text-slate-500 font-medium">Days Sales Inventory</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Target safety stock maintained to support operational continuity.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Accounts Payable Credit Period (DPO)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.accountsPayableDays}
                  onChange={(e) => updatePolicies('accountsPayableDays', parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600"
                />
                <span className="text-slate-500 font-medium">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Average vendor credit window before settling invoices for raw materials.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Minimum Cash Buffer Reserve ({symbol})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.minimumCashBalance === 0 ? '' : policies.minimumCashBalance}
                  onChange={(e) => updatePolicies('minimumCashBalance', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Safety liquidity floor. Dividends are prevented if cash balance falls below this amount.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Dividend Payout Ratio (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policies.dividendPayoutRatio === 0 ? '' : policies.dividendPayoutRatio}
                  onChange={(e) => updatePolicies('dividendPayoutRatio', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">% of Net Profit</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Percentage of annual net profits distributed to equity holders if cash permits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: OPEX */}
      {activeSection === 'opex' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Operating Expenses Schedule (OPEX)
              </h2>
              <p className="text-xs text-slate-500">
                Fixed and operational overhead including management payroll, rent, insurance, marketing, and utilities
              </p>
            </div>
            <button
              onClick={addOpex}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense Item</span>
            </button>
          </div>

          {opex.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-900">No Operating Expenses Encoded</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add management salaries, rent, insurance, marketing, and utilities to project ongoing operational overhead.
              </p>
              <button
                onClick={addOpex}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add First Expense Item</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[700px] text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Expense Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Year 1 Annual Cost ({symbol})</th>
                    <th className="py-2.5 px-3 text-right">Annual Escalation %</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {opex.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-sans">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateOpex(item.id, 'name', e.target.value)}
                          placeholder="Expense item name"
                          className="w-64 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                        />
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <select
                          value={item.category}
                          onChange={(e) => updateOpex(item.id, 'category', e.target.value as OpexCategory)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-emerald-600"
                        >
                          <option value="Salaries & Wages">Salaries & Wages</option>
                          <option value="Rent & Utilities">Rent & Utilities</option>
                          <option value="Selling & Marketing">Selling & Marketing</option>
                          <option value="Administrative & General">Administrative & General</option>
                          <option value="Professional & Legal Fees">Professional & Legal Fees</option>
                          <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                          <option value="Insurance & Licenses">Insurance & Licenses</option>
                          <option value="Other Expenses">Other Expenses</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={item.annualCostY1 === 0 ? '' : item.annualCostY1}
                          onChange={(e) => updateOpex(item.id, 'annualCostY1', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={item.annualEscalationRate === 0 ? '' : item.annualEscalationRate}
                          onChange={(e) => updateOpex(item.id, 'annualEscalationRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded text-slate-700 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => deleteOpex(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 1: Pre-Operating */}
      {(activeSection === 'preOperating' || (activeSection as string) === 'capex') && (
        <div className="space-y-6">
          {/* Executive Header & KPI Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                    Section 1
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Pre-Operating Capital, Setup Expenses & Fixed Assets
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Consolidated pre-launch assumptions: owner contributed equity, bank debt financing facilities, pre-operating organizational expenses, and depreciable capital assets (CAPEX).
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadStandardPreOpExpenses}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Auto-fill standard corporate registration, licensing, and setup costs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load Pre-Ops Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={addCapex}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fixed Asset</span>
                </button>
              </div>
            </div>

            {/* Pre-Operating Financial Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Owners' Equity</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(financing.initialEquity, symbol, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Contributed capital
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Bank Loan</span>
                </div>
                <div className="text-base font-bold text-indigo-700 font-mono mt-1">
                  {formatCurrency(effectiveDebt, symbol, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {isLoanActive ? `${financing.bankName || 'Commercial Bank'} @ ${financing.loanInterestRate}%` : 'Loan inactive'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pre-Ops Expenses</span>
                </div>
                <div className="text-base font-bold text-amber-800 font-mono mt-1">
                  {formatCurrency(totalPreOpExpensesPaid, symbol, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {preOperatingExpenses.length} setup expense items
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fixed Assets (Yr 0)</span>
                </div>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(totalCapexY0, symbol, 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {capex.filter((c) => c.purchaseYear === 0).length} plant & equipment assets
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border col-span-2 sm:col-span-1 ${
                initialCashBuffer >= 0
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}>
                <div className="text-[11px] font-medium flex items-center gap-1 text-slate-600">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${initialCashBuffer >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <span>Net Starting Cash</span>
                </div>
                <div className={`text-base font-bold font-mono mt-1 ${initialCashBuffer >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                  {formatCurrency(initialCashBuffer, symbol, 0)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {initialCashBuffer >= 0 ? 'Adequate liquidity buffer' : 'Funding deficit'}
                </div>
              </div>
            </div>

            {/* Pre-Operating Sub-Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setPreOpSubTab('all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <span>All Modules</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('capital')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'capital'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>1. Capital & Bank Loan</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('preOpExpenses')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'preOpExpenses'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>2. Pre-Operating Expenses ({preOperatingExpenses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('cashOnHand')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'cashOnHand'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>3. Cash on Hand ({cashOnHand.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('cashInBank')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'cashInBank'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>4. Cash in Bank ({cashInBank.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('capex')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'capex'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>5. Fixed Assets ({capex.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreOpSubTab('sourcesUses')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preOpSubTab === 'sourcesUses'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>6. Sources & Uses Reconciliation</span>
              </button>
            </div>

            {/* Loan Amortization & Interest Comparison Modal Trigger */}
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setIsAmortizationModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-700 via-indigo-800 to-emerald-700 hover:from-indigo-800 hover:to-emerald-800 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="View Loan Amortization Schedule, Interest Received Table, and Paid vs. Received Comparison"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-300" />
                <span>Amortization & Interest Comparison</span>
              </button>
            </div>
          </div>

          {/* Module 1: Capital Contributed by Owners & Bank Loan */}
          {(preOpSubTab === 'all' || preOpSubTab === 'capital') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Owners' Contributed Capital & Bank Loan Financing
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Total contributed equity capital is linked to what is established during Company Setup. You can also configure commercial bank borrowing terms.
                  </p>
                </div>
                {onOpenCompanyProfile && (
                  <button
                    type="button"
                    onClick={onOpenCompanyProfile}
                    className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Company Ownership Profile</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Owners' Equity Block */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-slate-50 rounded-xl border border-emerald-100/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Total Capital Contributed by Owners</h4>
                        <span className="text-[11px] text-slate-500">Paid-in Equity / Established Sponsor Capital</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded">
                      {data.companyProfile?.classification || 'Sole Proprietorship'}
                    </span>
                  </div>

                  {/* Established Capital Sync Banner */}
                  <div className="p-2.5 bg-emerald-100/60 rounded-lg border border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-emerald-900 font-medium">
                        Established in Company Setup:{' '}
                        <strong className="font-mono font-bold text-emerald-950">
                          {formatCurrency(establishedCapital !== null ? establishedCapital : financing.initialEquity, symbol, 0)}
                        </strong>
                      </span>
                    </div>
                    {establishedCapital !== null && financing.initialEquity !== establishedCapital && (
                      <button
                        type="button"
                        onClick={syncFromCompanyProfile}
                        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                        title="Synchronize financing equity to established company capital"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync Now</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 block">
                        Total Contributed Equity Capital ({symbol})
                      </label>
                      {onOpenCompanyProfile && (
                        <button
                          type="button"
                          onClick={onOpenCompanyProfile}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                        >
                          Edit in Company Profile
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                        {symbol}
                      </span>
                      <input
                        type="number"
                        value={financing.initialEquity === 0 ? '' : financing.initialEquity}
                        onChange={(e) =>
                          updateFinancing('initialEquity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-emerald-900 font-mono font-bold text-base focus:outline-emerald-600 shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This reflects the capital established during Add Company. Any adjustments are automatically reflected across the financial model.
                    </p>
                  </div>

                  {/* Classification breakdown */}
                  {data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners ? (
                    <div className="pt-3 border-t border-emerald-100/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Partners' Registered Contributions:</span>
                        <span className="text-slate-500">{data.companyProfile.partners.length} Partners</span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {data.companyProfile.partners.map((p, idx) => (
                          <div key={p.id || idx} className="p-2 bg-white/80 rounded border border-slate-200 text-xs flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{p.name || `Partner #${idx + 1}`}</span>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-emerald-700 font-bold">{formatCurrency(p.capital, symbol, 0)}</span>
                              <span className="text-indigo-600 bg-indigo-50 px-1 rounded">{p.profitSharePercent}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-emerald-100/80 text-xs text-slate-600 flex items-center justify-between">
                      <div>
                        Proprietor: <strong className="text-slate-900">{data.companyProfile?.soleProprietor?.ownerName || general.preparedBy || 'Sole Proprietor'}</strong>
                      </div>
                      <div className="text-emerald-700 font-mono font-bold">
                        100% Equity Ownership
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Loan Facility Block */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50 rounded-xl border border-indigo-100/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Commercial Bank Loan Facility</h4>
                        <span className="text-[11px] text-slate-500">Debt financing (Optional)</span>
                      </div>
                    </div>

                    {/* Toggle switch for Bank Loan */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLoanActive}
                        onChange={(e) => toggleBankLoan(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-xs font-semibold text-slate-700">
                        {isLoanActive ? 'Active' : 'No Loan'}
                      </span>
                    </label>
                  </div>

                  {!isLoanActive ? (
                    <div className="text-center py-6 px-4 bg-white/70 border border-dashed border-indigo-200 rounded-lg space-y-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Zero Bank Debt Selected
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        The startup is currently planned as 100% equity-financed. If you wish to leverage bank borrowing, click the toggle or activate below.
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleBankLoan(true)}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enable Bank Loan Facility</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {/* Bank Selector Trigger */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                          Commercial Bank Name & Lending Program
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsBankModalOpen(true)}
                          className="w-full p-2.5 bg-white border border-indigo-200 hover:border-indigo-400 rounded-lg text-left transition-colors flex items-center justify-between shadow-2xs group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                              <Landmark className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{financing.bankName || 'Click to select Bank...'}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Benchmark: {financing.loanInterestRate}% p.a.
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Click to select from {AVAILABLE_BANKS.length} available banks with benchmark interest rates
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            Change Bank...
                          </span>
                        </button>
                      </div>

                      {/* Loan Inputs Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">
                            Loan Principal ({symbol})
                          </label>
                          <input
                            type="number"
                            value={financing.loanPrincipal === 0 ? '' : financing.loanPrincipal}
                            onChange={(e) =>
                              updateFinancing('loanPrincipal', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-indigo-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">
                            Annual Interest Rate (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.25"
                              value={financing.loanInterestRate === 0 ? '' : financing.loanInterestRate}
                              onChange={(e) =>
                                updateFinancing('loanInterestRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                              }
                              placeholder="0.0"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-indigo-600 pr-10"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-sans">
                              % p.a.
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">
                            Loan Tenor / Term (Years)
                          </label>
                          <input
                            type="number"
                            value={financing.loanTermYears === 0 ? '' : financing.loanTermYears}
                            onChange={(e) =>
                              updateFinancing('loanTermYears', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)
                            }
                            placeholder="5"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-indigo-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">
                            Grace Period (Years)
                          </label>
                          <input
                            type="number"
                            value={financing.gracePeriodYears === 0 ? '' : financing.gracePeriodYears}
                            onChange={(e) =>
                              updateFinancing('gracePeriodYears', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:outline-indigo-600"
                          />
                        </div>
                      </div>

                      {/* Loan Amortization Estimate Card */}
                      {financing.loanPrincipal > 0 && financing.loanTermYears > 0 && (
                        <div className="p-3 bg-indigo-100/50 rounded-lg border border-indigo-200 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-indigo-700 block font-bold uppercase tracking-wider">
                                Estimated Annual Principal Amortization
                              </span>
                              <span className="font-mono font-bold text-indigo-900">
                                {formatCurrency(financing.loanPrincipal / financing.loanTermYears, symbol, 0)} / year
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-indigo-700 block font-bold uppercase tracking-wider">
                                Estimated Year 1 Interest
                              </span>
                              <span className="font-mono font-bold text-indigo-900">
                                {formatCurrency((financing.loanPrincipal * financing.loanInterestRate) / 100, symbol, 0)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAmortizationModalOpen(true)}
                            className="w-full py-1.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>View Loan Amortization Table & Interest Comparison</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Module 2: Pre-Operating Expenses & Amount Paid */}
          {(preOpSubTab === 'all' || preOpSubTab === 'preOpExpenses') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Pre-Operating Expenses & Amounts Paid
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Enter startup expenses and the amounts paid prior to commencement of commercial operations (registration fees, permits, feasibility study, marketing launch, staff training, utility deposits).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStandardPreOpExpenses}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auto-Fill Standard Checklist</span>
                  </button>
                  <button
                    type="button"
                    onClick={addPreOpExpense}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pre-Op Expense</span>
                  </button>
                </div>
              </div>

              {preOperatingExpenses.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-amber-200/80 rounded-xl space-y-3 bg-amber-50/20">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Pre-Operating Expenses Encoded</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Enter the organizational and preliminary costs incurred before Year 1 begins, or auto-fill with standard corporate registration and licensing presets.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={loadStandardPreOpExpenses}
                      className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Auto-Fill 9 Standard Startup Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={addPreOpExpense}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Row Manually</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-amber-50/60 border-b border-amber-200/70 text-slate-700 font-semibold">
                        <th className="py-2.5 px-3">Expense Item / Purpose</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount Paid ({symbol})</th>
                        <th className="py-2.5 px-3">Official Receipt / Reference Notes</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preOperatingExpenses.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/20">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updatePreOpExpense(item.id, 'name', e.target.value)}
                              placeholder="e.g. SEC/DTI registration, mayor's permit, feasibility study"
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-amber-600 placeholder:text-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.category}
                              onChange={(e) => updatePreOpExpense(item.id, 'category', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-amber-600"
                            >
                              <option value="Legal & Regulatory">Legal & Regulatory</option>
                              <option value="Professional & Advisory">Professional & Advisory</option>
                              <option value="Marketing & Launch">Marketing & Launch</option>
                              <option value="Training & Trial">Training & Trial</option>
                              <option value="Utilities & Deposits">Utilities & Deposits</option>
                              <option value="Administrative & Setup">Administrative & Setup</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={item.amount === 0 ? '' : item.amount}
                              onChange={(e) =>
                                updatePreOpExpense(
                                  item.id,
                                  'amount',
                                  e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-32 px-2 py-1 text-right bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-amber-600 placeholder:text-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updatePreOpExpense(item.id, 'notes', e.target.value)}
                              placeholder="Notes, OR number, licensing office..."
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 text-xs focus:outline-amber-600 placeholder:text-slate-300"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => deletePreOpExpense(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50/70 border-t-2 border-amber-200 font-bold text-slate-900">
                        <td className="py-2.5 px-3" colSpan={2}>
                          Total Pre-Operating Expenses Paid ({preOperatingExpenses.length} Items)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-amber-900">
                          {formatCurrency(totalPreOpExpensesPaid, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 font-normal italic" colSpan={2}>
                          *Capitalized as deferred pre-operating costs in Balance Sheet and amortized over 5 years.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Module 3: Cash on Hand Allocation */}
          {(preOpSubTab === 'all' || preOpSubTab === 'cashOnHand') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Cash on Hand (Physical Cash & Petty Cash Funds)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Allocate physical cash on hand for petty cash disbursements, POS cashier change floats, and emergency vault buffers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStandardCashOnHand}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Fill Standard Cash Floats</span>
                  </button>
                  <button
                    type="button"
                    onClick={addCashOnHand}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cash on Hand</span>
                  </button>
                </div>
              </div>

              {cashOnHand.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-emerald-200/80 rounded-xl space-y-3 bg-emerald-50/20">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Cash on Hand Allocations Defined</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Establish physical cash reserves held on-site (petty cash vouchers, cashier till change, logistics driver floats).
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={loadStandardCashOnHand}
                      className="px-3.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Auto-Fill Standard Petty Cash & Floats</span>
                    </button>
                    <button
                      type="button"
                      onClick={addCashOnHand}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Row Manually</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-50/60 border-b border-emerald-200/70 text-slate-700 font-semibold">
                        <th className="py-2.5 px-3">Description / Fund Purpose</th>
                        <th className="py-2.5 px-3">Custodian / Branch Location</th>
                        <th className="py-2.5 px-3 text-right">Allocated Amount ({symbol})</th>
                        <th className="py-2.5 px-3">Replenishment Policy & Operating Remarks</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashOnHand.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateCashOnHand(item.id, 'description', e.target.value)}
                              placeholder="e.g. Petty Cash Fund, Register Drawer Float"
                              className="w-full p-1.5 border border-slate-300 rounded text-slate-800 focus:outline-emerald-600 font-medium"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.custodianOrLocation || ''}
                              onChange={(e) => updateCashOnHand(item.id, 'custodianOrLocation', e.target.value)}
                              placeholder="e.g. Finance Custodian, Head Cashier"
                              className="w-full p-1.5 border border-slate-300 rounded text-slate-700 focus:outline-emerald-600"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="relative inline-block w-36">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                                {symbol}
                              </span>
                              <input
                                type="number"
                                value={item.amount === 0 ? '' : item.amount}
                                onChange={(e) =>
                                  updateCashOnHand(item.id, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="w-full pl-6 pr-2 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded focus:outline-emerald-600"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateCashOnHand(item.id, 'notes', e.target.value)}
                              placeholder="e.g. Imprest fund, replenish below 20%"
                              className="w-full p-1.5 border border-slate-300 rounded text-slate-600 focus:outline-emerald-600"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => deleteCashOnHand(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/70 border-t-2 border-emerald-200 font-bold text-slate-900">
                        <td className="py-2.5 px-3" colSpan={2}>
                          Total Physical Cash on Hand ({cashOnHand.length} Funds)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-900">
                          {formatCurrency(totalCashOnHand, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 font-normal italic" colSpan={2}>
                          *Physical cash retained on-site for immediate operating disbursements and cashier till floats.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Module 4: Cash in Bank (Interest-Earning Deposits) */}
          {(preOpSubTab === 'all' || preOpSubTab === 'cashInBank') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Cash in Bank (Interest-Bearing Commercial Deposits & Placements)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose partner banks to deposit funds, configure account types, and earn annual interest yields which automatically flow into feasibility income statements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStandardCashInBank}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-Fill Standard Bank Accounts</span>
                  </button>
                  <button
                    type="button"
                    onClick={addCashInBank}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bank Deposit</span>
                  </button>
                </div>
              </div>

              {/* Yield Summary Banner */}
              {cashInBank.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 rounded-xl border border-blue-100 text-xs items-center">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Bank Deposits:</span>
                    <span className="text-base font-bold font-mono text-blue-950">
                      {formatCurrency(totalCashInBank, symbol, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Average Annual Interest Yield:</span>
                    <span className="text-base font-bold font-mono text-indigo-700">
                      {blendedBankInterestRate.toFixed(2)}% p.a.
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Annual Interest Income Earned:</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      +{formatCurrency(totalAnnualBankInterest, symbol, 0)} / year
                    </span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAmortizationModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Compare Paid vs Received</span>
                    </button>
                  </div>
                </div>
              )}

              {cashInBank.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-blue-200/80 rounded-xl space-y-3 bg-blue-50/20">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Bank Deposit Accounts Configured</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Allocate your startup capital across commercial banks (e.g. BDO, BPI, Metrobank, LandBank, Security Bank, etc.). Your deposits earn interest that accrues as finance revenue.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={loadStandardCashInBank}
                      className="px-3.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                      <span>Auto-Fill Standard Accounts (Checking, High-Yield, Time Deposit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={addCashInBank}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Bank Deposit Row</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[880px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-50/60 border-b border-blue-200/70 text-slate-700 font-semibold">
                        <th className="py-2.5 px-3">Commercial Bank</th>
                        <th className="py-2.5 px-3">Deposit Account Type</th>
                        <th className="py-2.5 px-3 text-right">Deposit Amount ({symbol})</th>
                        <th className="py-2.5 px-3 text-right">Interest Rate (% p.a.)</th>
                        <th className="py-2.5 px-3 text-right">Est. Interest Income ({symbol}/yr)</th>
                        <th className="py-2.5 px-3">Purpose / Account Reference</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashInBank.map((item) => {
                        const interestEarned = (item.depositAmount || 0) * ((item.annualInterestRate || 0) / 100);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3">
                              <select
                                value={item.bankName}
                                onChange={(e) => updateCashInBank(item.id, 'bankName', e.target.value)}
                                className="w-full p-1.5 border border-slate-300 rounded text-slate-900 font-semibold bg-white focus:outline-blue-600"
                              >
                                <optgroup label="Philippine Universal & Commercial Banks">
                                  {AVAILABLE_BANKS.filter((b) => b.region === 'Philippines').map((b) => (
                                    <option key={b.id} value={b.name}>
                                      {b.name} ({b.depositInterestRate || 3.5}% p.a.)
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Global / US Commercial Banks">
                                  {AVAILABLE_BANKS.filter((b) => b.region === 'Global / US').map((b) => (
                                    <option key={b.id} value={b.name}>
                                      {b.name} ({b.depositInterestRate || 3.5}% p.a.)
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={item.accountType}
                                onChange={(e) => updateCashInBank(item.id, 'accountType', e.target.value as BankDepositAccountType)}
                                className="w-full p-1.5 border border-slate-300 rounded text-slate-800 bg-white focus:outline-blue-600"
                              >
                                <option value="Checking / Current Account">Checking / Current Account</option>
                                <option value="Savings Account">Savings Account</option>
                                <option value="High-Yield Savings">High-Yield Savings</option>
                                <option value="Time Deposit">Time Deposit</option>
                                <option value="Special Deposit Account">Special Deposit Account</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="relative inline-block w-32">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                                  {symbol}
                                </span>
                                <input
                                  type="number"
                                  value={item.depositAmount === 0 ? '' : item.depositAmount}
                                  onChange={(e) =>
                                    updateCashInBank(item.id, 'depositAmount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="w-full pl-5 pr-2 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded focus:outline-blue-600"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="relative inline-block w-24">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={item.annualInterestRate === 0 ? '' : item.annualInterestRate}
                                  onChange={(e) =>
                                    updateCashInBank(item.id, 'annualInterestRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="w-full pr-5 pl-2 py-1.5 text-right font-mono font-semibold text-indigo-700 border border-slate-300 rounded focus:outline-blue-600"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                                  %
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              +{formatCurrency(interestEarned, symbol, 0)}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.accountNumberOrRef || item.notes || ''}
                                onChange={(e) => updateCashInBank(item.id, 'accountNumberOrRef', e.target.value)}
                                placeholder="e.g. Primary Payroll, 90-Day Placement"
                                className="w-full p-1.5 border border-slate-300 rounded text-slate-600 focus:outline-blue-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteCashInBank(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/70 border-t-2 border-blue-200 font-bold text-slate-900">
                        <td className="py-2.5 px-3" colSpan={2}>
                          Total Cash in Bank Placements ({cashInBank.length} Accounts)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-blue-950">
                          {formatCurrency(totalCashInBank, symbol, 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-indigo-700">
                          Avg: {blendedBankInterestRate.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-800">
                          +{formatCurrency(totalAnnualBankInterest, symbol, 0)}/yr
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 font-normal italic" colSpan={2}>
                          *Interest earned accrues to the company and is credited to the dynamic Income Statement.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Module 5: Fixed Assets (CAPEX) Register */}
          {(preOpSubTab === 'all' || preOpSubTab === 'capex') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      5
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Capital Expenditures & Depreciable Asset Register (CAPEX)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Production equipment, machinery, leasehold improvements, logistics vehicles, and technology with assigned useful lives and residual salvage values.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCapex}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fixed Asset</span>
                </button>
              </div>

              {capex.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Fixed Assets Encoded</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add machinery, leasehold buildouts, furniture, or computer technology to formulate Year 0 capital outlays and depreciation.
                  </p>
                  <button
                    type="button"
                    onClick={addCapex}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add First Fixed Asset</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Asset Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Acquisition Cost ({symbol})</th>
                        <th className="py-2.5 px-3 text-right">Useful Life (Yrs)</th>
                        <th className="py-2.5 px-3 text-right">Salvage Value ({symbol})</th>
                        <th className="py-2.5 px-3 text-center">Purchase Year</th>
                        <th className="py-2.5 px-3 text-right">Annual Straight-Line Depr.</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {capex.map((item) => {
                        const deprBase = Math.max(0, item.acquisitionCost - item.salvageValue);
                        const annualDepr = item.usefulLifeYears > 0 ? deprBase / item.usefulLifeYears : 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-sans">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateCapex(item.id, 'name', e.target.value)}
                                placeholder="Asset description"
                                className="w-56 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                              />
                            </td>
                            <td className="py-2 px-3 font-sans">
                              <select
                                value={item.category}
                                onChange={(e) => updateCapex(item.id, 'category', e.target.value as CapexCategory)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-emerald-600"
                              >
                                <option value="Equipment & Machinery">Equipment & Machinery</option>
                                <option value="Leasehold Improvements">Leasehold Improvements</option>
                                <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                                <option value="Vehicles & Logistics">Vehicles & Logistics</option>
                                <option value="IT Hardware & Software">IT Hardware & Software</option>
                                <option value="Land & Buildings">Land & Buildings</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={item.acquisitionCost === 0 ? '' : item.acquisitionCost}
                                onChange={(e) => updateCapex(item.id, 'acquisitionCost', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={item.usefulLifeYears === 0 ? '' : item.usefulLifeYears}
                                onChange={(e) => updateCapex(item.id, 'usefulLifeYears', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-16 px-2 py-1 text-right bg-white border border-slate-200 rounded text-slate-800 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={item.salvageValue === 0 ? '' : item.salvageValue}
                                onChange={(e) => updateCapex(item.id, 'salvageValue', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded text-slate-500 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-sans">
                              <select
                                value={item.purchaseYear}
                                onChange={(e) => updateCapex(item.id, 'purchaseYear', parseInt(e.target.value) || 0)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-emerald-600"
                              >
                                <option value={0}>Year 0 (Startup / Pre-Ops)</option>
                                <option value={1}>Year 1</option>
                                <option value={2}>Year 2</option>
                                <option value={3}>Year 3</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-rose-600 font-mono">
                              {formatCurrency(annualDepr, symbol, 0)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => deleteCapex(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900 font-sans">
                        <td className="py-2.5 px-3" colSpan={2}>
                          Pre-Operating Fixed Assets (Year 0 Acquisitions)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                          {formatCurrency(totalCapexY0, symbol, 0)}
                        </td>
                        <td colSpan={3} className="py-2.5 px-3 text-xs text-slate-500 font-normal">
                          All Years Total CAPEX: <span className="font-mono font-bold text-slate-800">{formatCurrency(totalCapexAll, symbol, 0)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {formatCurrency(
                            capex
                              .filter((c) => c.purchaseYear === 0)
                              .reduce((sum, c) => {
                                const base = Math.max(0, c.acquisitionCost - c.salvageValue);
                                return sum + (c.usefulLifeYears > 0 ? base / c.usefulLifeYears : 0);
                              }, 0),
                            symbol,
                            0
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Module 6: Pre-Operating Sources & Uses Reconciliation Summary */}
          {(preOpSubTab === 'all' || preOpSubTab === 'sourcesUses') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      6
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Pre-Operating Sources, Uses & Cash Deployment Reconciliation
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Formal reconciliation of startup capital inflows against preliminary outlays and liquidity deployment across cash on hand and interest-bearing bank deposits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAmortizationModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Amortization & Interest Comparison</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Sources Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-200">
                      <span>A. Startup Capital Sources</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(totalFunding, symbol, 0)}</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Owners' Contributed Equity:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(financing.initialEquity, symbol, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">
                          Bank Loan ({financing.bankName || 'Commercial Loan'}):
                        </span>
                        <span className="font-mono font-bold text-indigo-700">{formatCurrency(effectiveDebt, symbol, 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-xs">
                    <span>Total Startup Funding:</span>
                    <span className="font-mono text-sm text-emerald-700">{formatCurrency(totalFunding, symbol, 0)}</span>
                  </div>
                </div>

                {/* Uses Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-200">
                      <span>B. Pre-Operating Outlays</span>
                      <span className="font-mono text-slate-900">{formatCurrency(totalPreOperatingOutlays, symbol, 0)}</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Year 0 Fixed Assets (CAPEX):</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCapexY0, symbol, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Pre-Operating Setup Expenses:</span>
                        <span className="font-mono font-bold text-amber-800">{formatCurrency(totalPreOpExpensesPaid, symbol, 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-xs">
                    <span>Total Preliminary Outlays:</span>
                    <span className="font-mono text-sm text-slate-900">{formatCurrency(totalPreOperatingOutlays, symbol, 0)}</span>
                  </div>
                </div>

                {/* Cash Deployment Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center justify-between pb-2 border-b border-slate-200">
                      <span>C. Cash Allocations</span>
                      <span className="font-mono text-blue-700">{formatCurrency(totalAllocatedCash, symbol, 0)}</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Physical Cash on Hand:</span>
                        <span className="font-mono font-bold text-emerald-800">{formatCurrency(totalCashOnHand, symbol, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Interest-Earning Bank Deposits:</span>
                        <span className="font-mono font-bold text-blue-900">{formatCurrency(totalCashInBank, symbol, 0)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-[11px] text-indigo-700">
                        <span>Est. Bank Interest Income:</span>
                        <span className="font-mono font-bold">+{formatCurrency(totalAnnualBankInterest, symbol, 0)}/yr</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-xs">
                    <span>Total Allocated Cash:</span>
                    <span className="font-mono text-sm text-blue-800">{formatCurrency(totalAllocatedCash, symbol, 0)}</span>
                  </div>
                </div>
              </div>

              {/* Net Result Bar */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                initialCashBuffer >= 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    {initialCashBuffer >= 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fully Funded Opening Liquidity</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Startup Capital Deficit</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-90 mt-1 max-w-xl leading-relaxed">
                    {initialCashBuffer >= 0
                      ? unallocatedCashBuffer === 0
                        ? `Total startup funding of ${formatCurrency(totalFunding, symbol, 0)} fully funds all pre-operating outlays (${formatCurrency(totalPreOperatingOutlays, symbol, 0)}) and allocated cash reserves (${formatCurrency(totalAllocatedCash, symbol, 0)}), with ${symbol}0 in capital still unallocated (100% balanced).`
                        : unallocatedCashBuffer > 0
                        ? `Total startup funding of ${formatCurrency(totalFunding, symbol, 0)} covers all pre-operating outlays (${formatCurrency(totalPreOperatingOutlays, symbol, 0)}) and allocated cash (${formatCurrency(totalAllocatedCash, symbol, 0)}), leaving ${formatCurrency(unallocatedCashBuffer, symbol, 0)} in capital still unallocated.`
                        : `Allocated cash (${formatCurrency(totalAllocatedCash, symbol, 0)}) and preliminary outlays (${formatCurrency(totalPreOperatingOutlays, symbol, 0)}) exceed total funding (${formatCurrency(totalFunding, symbol, 0)}) by ${formatCurrency(Math.abs(unallocatedCashBuffer), symbol, 0)}.`
                      : `Preliminary capital asset purchases and pre-operating expenses exceed sources by ${formatCurrency(Math.abs(initialCashBuffer), symbol, 0)}. Please increase owner contributed capital or bank loan principal.`}
                  </p>
                </div>
                <div className="flex items-center shrink-0 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] block uppercase font-bold tracking-wider opacity-75 font-sans">
                      Capital Still Unallocated
                    </span>
                    <span className={`text-xl font-bold ${
                      unallocatedCashBuffer === 0
                        ? 'text-emerald-800'
                        : unallocatedCashBuffer > 0
                        ? 'text-indigo-900'
                        : 'text-rose-700'
                    }`}>
                      {formatCurrency(unallocatedCashBuffer, symbol, 0)}
                    </span>
                    <span className="block text-[10px] font-sans font-medium opacity-80">
                      {unallocatedCashBuffer === 0
                        ? '100% Fully Allocated'
                        : unallocatedCashBuffer > 0
                        ? 'Available to Allocate'
                        : 'Over-Allocated'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 6: Financing */}
      {activeSection === 'financing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Capital Structure & Debt Financing Plan
              </h2>
              <p className="text-xs text-slate-500">
                Owner/investor equity contribution vs long-term commercial bank borrowing facility
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsAmortizationModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Amortization & Interest Comparison</span>
              </button>
              {onOpenCompanyProfile && (
                <button
                  type="button"
                  onClick={onOpenCompanyProfile}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ownership Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Company Profile & Ownership Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/60 to-slate-50 rounded-xl border border-indigo-100/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-600 text-white">
                  {data.companyProfile?.classification || 'Sole Proprietorship'}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {data.companyProfile?.entityName || general.companyName}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Nature: <strong>{data.companyProfile?.nature || general.industry}</strong>
              </span>
            </div>

            {data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners ? (
              <div className="space-y-2 pt-2 border-t border-indigo-100">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Partners' Equity Breakdown ({data.companyProfile.partners.length} Partners):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {data.companyProfile.partners.map((p, idx) => (
                    <div key={p.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-900">{p.name || `Partner #${idx + 1}`}</div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mt-0.5">
                        <span>Capital: <strong className="text-emerald-700">{formatCurrency(p.capital, symbol, 0)}</strong></span>
                        <span className="bg-indigo-50 text-indigo-700 font-mono px-1 rounded">{p.profitSharePercent}% P/L</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-indigo-100 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  Sole Proprietor: <strong>{data.companyProfile?.soleProprietor?.ownerName || general.preparedBy || 'Owner'}</strong>
                </div>
                <div>
                  Contributed Capital: <strong className="text-emerald-700 font-mono">{formatCurrency(financing.initialEquity, symbol, 0)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Bank Partner Selection Card in Section 2/Financing */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>Selected Lending Bank: <strong>{financing.bankName || 'No Commercial Bank Selected'}</strong></span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    {financing.loanInterestRate}% p.a.
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Click to select from available Philippine and Global commercial banks to automatically apply benchmark interest rates.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBankModalOpen(true)}
              className="px-3.5 py-1.5 font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Browse Available Banks...</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Contributed Equity Capital ({symbol})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={financing.initialEquity === 0 ? '' : financing.initialEquity}
                  onChange={(e) => updateFinancing('initialEquity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-36 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-emerald-800 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Paid-in capital injected by project sponsors and equity partners.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Bank Loan Facility Principal ({symbol})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={financing.loanPrincipal === 0 ? '' : financing.loanPrincipal}
                  onChange={(e) => updateFinancing('loanPrincipal', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-36 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Senior debt drawn down at Year 0 to finance capital acquisitions.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Annual Loan Interest Rate (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  value={financing.loanInterestRate === 0 ? '' : financing.loanInterestRate}
                  onChange={(e) => updateFinancing('loanInterestRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">% p.a.</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Contractual annual interest rate charged on outstanding principal.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Loan Tenor / Term (Years)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={financing.loanTermYears === 0 ? '' : financing.loanTermYears}
                  onChange={(e) => updateFinancing('loanTermYears', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">Years</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Total amortization period for senior debt facility.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Grace Period (Principal)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={financing.gracePeriodYears === 0 ? '' : financing.gracePeriodYears}
                  onChange={(e) => updateFinancing('gracePeriodYears', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">Years</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Years before principal amortization commences (interest-only period).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 7: General & Macro */}
      {activeSection === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Project Identification & Macroeconomic Assumptions
            </h2>
            <p className="text-xs text-slate-500">
              Corporate identity, discount hurdle rate (WACC), corporate taxation, and general inflation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Project Name</label>
              <input
                type="text"
                value={general.projectName}
                onChange={(e) => updateGeneral('projectName', e.target.value)}
                placeholder="e.g. Artisanal Roastery Project"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Company / Entity Name</label>
              <input
                type="text"
                value={general.companyName}
                onChange={(e) => updateGeneral('companyName', e.target.value)}
                placeholder="e.g. Apex Enterprises LLC"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Industry Sector</label>
              <input
                type="text"
                value={general.industry}
                onChange={(e) => updateGeneral('industry', e.target.value)}
                placeholder="e.g. Specialty Food & Beverage"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Currency & Symbol</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={general.currency}
                  onChange={(e) => updateGeneral('currency', e.target.value)}
                  placeholder="USD"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-emerald-600"
                />
                <input
                  type="text"
                  value={general.currencySymbol}
                  onChange={(e) => updateGeneral('currencySymbol', e.target.value)}
                  placeholder="$"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Hurdle / Discount Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={general.discountRate === 0 ? '' : general.discountRate}
                  onChange={(e) => updateGeneral('discountRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">% WACC</span>
              </div>
              <p className="text-[11px] text-slate-500">Benchmark rate for NPV discounting & IRR hurdle.</p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">Corporate Income Tax Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={general.incomeTaxRate === 0 ? '' : general.incomeTaxRate}
                  onChange={(e) => updateGeneral('incomeTaxRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">% Tax</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block">General Inflation Rate (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={general.generalInflationRate === 0 ? '' : general.generalInflationRate}
                  onChange={(e) => updateGeneral('generalInflationRate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-emerald-600 placeholder:text-slate-300"
                />
                <span className="text-slate-500 font-medium">% p.a.</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-bold text-slate-900 block">Project Description & Scope</label>
              <textarea
                rows={2}
                value={general.projectDescription}
                onChange={(e) => updateGeneral('projectDescription', e.target.value)}
                placeholder="Executive summary and investment rationale..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Company Profile Quick Access */}
          {onOpenCompanyProfile && (
            <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Company Profile: {data.companyProfile?.entityName || general.companyName} ({data.companyProfile?.classification || 'Sole Proprietorship'})
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Purpose: {data.companyProfile?.purpose || 'Click to encode nature, purpose, capital contributed & profit sharing'}
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenCompanyProfile}
                className="px-3.5 py-1.5 font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                Edit Company Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Available Banks Selection Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Select Commercial Lending Bank</h3>
                  <p className="text-xs text-indigo-200">
                    Choose a universal or commercial bank to automatically adopt its benchmark interest rate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Region Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="Search bank by name (e.g., BDO, BPI, LandBank, Metrobank, Chase)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-indigo-600 shadow-2xs"
                  autoFocus
                />
                {bankSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBankSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Region filter pills */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">Filter:</span>
                {(['All', 'Philippines', 'Global / US'] as const).map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setBankRegionFilter(region)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      bankRegionFilter === region
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {region === 'All' ? 'All Banks (18)' : region === 'Philippines' ? 'Philippines (12)' : 'Global / US (6)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Banks List */}
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2.5">
              {AVAILABLE_BANKS.filter((b) => {
                const matchesRegion = bankRegionFilter === 'All' || b.region === bankRegionFilter;
                const q = bankSearchQuery.toLowerCase().trim();
                const matchesQuery =
                  !q ||
                  b.name.toLowerCase().includes(q) ||
                  b.shortName.toLowerCase().includes(q) ||
                  b.description.toLowerCase().includes(q);
                return matchesRegion && matchesQuery;
              }).map((bank) => {
                const isSelected = financing.bankName === bank.name;
                return (
                  <div
                    key={bank.id}
                    onClick={() => handleSelectBank(bank)}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                      }`}>
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {bank.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                            {bank.shortName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-500 bg-slate-50 border border-slate-200">
                            {bank.region}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {bank.description} • Typical tenor: {bank.typicalTenorYears} Years
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Interest Rate
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {bank.benchmarkInterestRate}% p.a.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBank(bank);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Bank Drawer / Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600 font-medium">
                  Don't see your target lender?
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomBankInput(!showCustomBankInput)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  {showCustomBankInput ? 'Hide Custom Bank' : '+ Enter Custom Bank Institution'}
                </button>
              </div>

              {showCustomBankInput && (
                <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      placeholder="Bank / Lender Name (e.g. Rural Bank of Luzon)"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-indigo-600"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={customBankRate}
                        onChange={(e) => setCustomBankRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        placeholder="Interest Rate % p.a. (e.g. 7.5)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomBank}
                        disabled={!customBankName.trim()}
                        className="px-3 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
