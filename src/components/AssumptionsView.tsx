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
} from '../types/feasibility';
import { formatCurrency } from '../utils/financialCalculations';
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
    'general' | 'policies' | 'pricing' | 'costing' | 'opex' | 'capex' | 'financing'
  >('pricing');

  const [cogsSubTab, setCogsSubTab] = useState<'materials' | 'labor' | 'overhead' | 'summary'>('materials');

  const { general, policies, products, opex, capex, financing } = data;
  const rawMaterials = data.rawMaterials || [];
  const directLabor = data.directLabor || [];
  const factoryOverhead = data.factoryOverhead || [];
  const symbol = general.currencySymbol || '$';

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  // Synchronizes each product's unit costs (direct materials, direct labor, factory overhead)
  const syncProductUnitCosts = (
    currentProducts: ProductItem[],
    currentRawMaterials: RawMaterialItem[],
    currentDirectLabor: DirectLaborItem[],
    currentFactoryOverhead: FactoryOverheadItem[]
  ): ProductItem[] => {
    const totalProductionVolume = currentProducts.reduce(
      (sum, p) => sum + (p.initialAnnualVolume || 0),
      0
    );

    return currentProducts.map((prod) => {
      // 1. Direct Materials: sum of costPerMaterialUnit / yieldPerMaterialUnit
      const prodMaterials = currentRawMaterials.filter((m) => m.productId === prod.id);
      let directMaterialPerUnit = prod.directMaterialPerUnit;
      if (prodMaterials.length > 0) {
        directMaterialPerUnit = prodMaterials.reduce((sum, m) => {
          if (m.yieldPerMaterialUnit > 0) {
            return sum + ((m.costPerMaterialUnit || 0) / m.yieldPerMaterialUnit);
          }
          return sum;
        }, 0);
      }

      // 2. Direct Labor: quota rates + allocated fixed wages
      const prodLabor = currentDirectLabor.filter(
        (l) => l.productId === prod.id || l.productId === 'all' || !l.productId
      );
      let directLaborPerUnit = prod.directLaborPerUnit;
      if (prodLabor.length > 0) {
        // Quota piece rates
        const quotaUnitCost = prodLabor
          .filter((l) => l.classification === 'quota' && (l.productId === prod.id || l.productId === 'all'))
          .reduce((sum, l) => sum + (l.ratePerPiece || 0), 0);

        // Fixed labor: dailyRate * workingDays * 12 * headcount allocated over volume
        const fixedUnitCost = prodLabor
          .filter((l) => l.classification === 'fixed')
          .reduce((sum, l) => {
            const days = l.workingDaysPerMonth || 26;
            const monthlySalary = (l.dailyRate || 0) * days;
            const annualSalary = monthlySalary * 12;
            const totalRoleCost = annualSalary * (l.numberOfEmployees || 0);
            if (l.productId === prod.id) {
              return sum + (prod.initialAnnualVolume > 0 ? totalRoleCost / prod.initialAnnualVolume : 0);
            } else {
              return sum + (totalProductionVolume > 0 ? totalRoleCost / totalProductionVolume : 0);
            }
          }, 0);

        directLaborPerUnit = quotaUnitCost + fixedUnitCost;
      }

      // 3. Factory Overhead: annual expenses allocated over volume
      const prodOverhead = currentFactoryOverhead.filter(
        (o) => o.productId === prod.id || o.productId === 'all' || !o.productId
      );
      let overheadCostPerUnit = prod.overheadCostPerUnit;
      if (prodOverhead.length > 0) {
        overheadCostPerUnit = prodOverhead.reduce((sum, o) => {
          if (o.productId === prod.id) {
            return sum + (prod.initialAnnualVolume > 0 ? (o.annualCost || 0) / prod.initialAnnualVolume : 0);
          } else {
            return sum + (totalProductionVolume > 0 ? (o.annualCost || 0) / totalProductionVolume : 0);
          }
        }, 0);
      }

      return {
        ...prod,
        directMaterialPerUnit: Number(directMaterialPerUnit.toFixed(4)),
        directLaborPerUnit: Number(directLaborPerUnit.toFixed(4)),
        overheadCostPerUnit: Number(overheadCostPerUnit.toFixed(4)),
      };
    });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    const reSynced = syncProductUnitCosts(products, rawMaterials, directLabor, factoryOverhead);
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
    const updatedOverhead = factoryOverhead.map((o) => (o.productId === id ? { ...o, productId: 'all' } : o));
    const reSynced = syncProductUnitCosts(updated, updatedMaterials, updatedLabor, updatedOverhead);
    onChangeData({
      ...data,
      products: reSynced,
      rawMaterials: updatedMaterials,
      directLabor: updatedLabor,
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
    const updatedProds = syncProductUnitCosts(products, rawMaterials, directLabor, updatedOverhead);
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
    const updatedProds = syncProductUnitCosts(products, rawMaterials, directLabor, updatedOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      factoryOverhead: updatedOverhead,
    });
  };

  const deleteFactoryOverhead = (id: string) => {
    const updatedOverhead = factoryOverhead.filter((o) => o.id !== id);
    const updatedProds = syncProductUnitCosts(products, rawMaterials, directLabor, updatedOverhead);
    onChangeData({
      ...data,
      products: updatedProds,
      factoryOverhead: updatedOverhead,
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
    onChangeData({ ...data, capex: updated });
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
    };
    onChangeData({ ...data, capex: [...capex, newItem] });
  };

  const deleteCapex = (id: string) => {
    onChangeData({ ...data, capex: capex.filter((c) => c.id !== id) });
  };

  // Pre-ops totals
  const totalCapexY0 = capex
    .filter((c) => c.purchaseYear === 0)
    .reduce((sum, c) => sum + c.acquisitionCost, 0);
  const totalFunding = financing.initialEquity + financing.loanPrincipal;
  const initialCashBuffer = totalFunding - totalCapexY0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Assumptions & Feasibility Formulation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic input parameters governing pricing, unit costing, operating policies, asset depreciation, and capital structure
          </p>
        </div>

        {/* Funding quick status */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Initial Sources:</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalFunding, symbol)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Year 0 Capex:</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalCapexY0, symbol)}</span>
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
          onClick={() => setActiveSection('pricing')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'pricing'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>1. Revenue & Selling Prices</span>
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
          <span>2. Product Costing (COGS)</span>
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
          <span>3. Company Policies</span>
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
          <span>4. Operating Expenses (OPEX)</span>
        </button>

        <button
          onClick={() => setActiveSection('capex')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'capex'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5. Capital Assets (CAPEX)</span>
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
          <span>6. Financing & Debt</span>
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
          {cogsSubTab === 'overhead' && (
            <div className="space-y-4">
              {/* Header and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-emerald-700" />
                    Factory Overhead & Indirect Manufacturing Costs
                  </div>
                  <p className="text-xs text-emerald-800/80 leading-relaxed max-w-2xl">
                    Account for indirect plant expenses including machinery maintenance, factory electricity & power, production supplies, and facility rent. Costs are allocated to units based on annual production volume.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    title="Recalculate and synchronize factory overhead into finished product unit costs"
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
                        <span>Sync Overhead</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={addFactoryOverhead}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Factory Overhead</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards for Overhead */}
              {factoryOverhead.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Total Overhead Items</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{factoryOverhead.length} items</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Total Annual Overhead (Y1)</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {formatCurrency(
                        factoryOverhead.reduce((sum, o) => sum + (o.annualCost || 0), 0),
                        symbol,
                        0
                      )}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-500 font-medium block">Average Overhead / Unit</span>
                    <span className="text-lg font-bold text-emerald-700 font-mono">
                      {formatCurrency(
                        products.reduce((sum, p) => sum + (p.initialAnnualVolume || 0), 0) > 0
                          ? factoryOverhead.reduce((sum, o) => sum + (o.annualCost || 0), 0) /
                            products.reduce((sum, p) => sum + (p.initialAnnualVolume || 0), 0)
                          : 0,
                        symbol,
                        2
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Table of Overhead */}
              {factoryOverhead.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Factory className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">No Factory Overhead Items Added Yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Track factory utility bills, equipment servicing, machine grease/lubricants, and plant lease expenses.
                  </p>
                  <button
                    onClick={addFactoryOverhead}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Overhead Item</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin border border-slate-200 rounded-xl">
                  <table className="w-full min-w-[760px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Overhead Expense Item</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Allocation Basis</th>
                        <th className="py-2.5 px-3 text-right">Annual Cost ({symbol})</th>
                        <th className="py-2.5 px-3 text-right">Computed Cost / Unit</th>
                        <th className="py-2.5 px-3 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {factoryOverhead.map((o) => {
                        const totalVolume = products.reduce((s, p) => s + (p.initialAnnualVolume || 0), 0);
                        const prod = products.find((p) => p.id === o.productId);
                        const volume = o.productId === 'all' || !o.productId ? totalVolume : prod?.initialAnnualVolume || 0;
                        const unitOverhead = volume > 0 ? (o.annualCost || 0) / volume : 0;

                        return (
                          <tr key={o.id} className="hover:bg-slate-50/60">
                            {/* Item Name */}
                            <td className="py-2 px-3 font-sans">
                              <input
                                type="text"
                                value={o.name}
                                onChange={(e) => updateFactoryOverhead(o.id, 'name', e.target.value)}
                                placeholder="e.g. Factory Power & Utilities"
                                className="w-56 px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium focus:outline-emerald-600 placeholder:text-slate-300"
                              />
                            </td>

                            {/* Category */}
                            <td className="py-2 px-3 font-sans">
                              <select
                                value={o.category}
                                onChange={(e) => updateFactoryOverhead(o.id, 'category', e.target.value)}
                                className="w-44 px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-emerald-600"
                              >
                                <option value="Utilities & Power">Utilities & Power</option>
                                <option value="Machinery Maintenance">Machinery Maintenance</option>
                                <option value="Facility Lease / Rent">Facility Lease / Rent</option>
                                <option value="Indirect Supplies & Consumables">Indirect Supplies & Consumables</option>
                                <option value="Quality Assurance & Inspection">Quality Assurance & Inspection</option>
                                <option value="Plant Insurance & Licenses">Plant Insurance & Licenses</option>
                                <option value="Other Factory Overhead">Other Factory Overhead</option>
                              </select>
                            </td>

                            {/* Allocation */}
                            <td className="py-2 px-3 font-sans">
                              <select
                                value={o.productId}
                                onChange={(e) => updateFactoryOverhead(o.id, 'productId', e.target.value)}
                                className="w-40 px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-emerald-600"
                              >
                                <option value="all">All Products (Volume-Weighted)</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name || 'Unnamed Product'}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Annual Cost */}
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={o.annualCost === 0 ? '' : o.annualCost}
                                onChange={(e) =>
                                  updateFactoryOverhead(
                                    o.id,
                                    'annualCost',
                                    e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-28 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-900 focus:outline-emerald-600 placeholder:text-slate-300 font-mono"
                              />
                            </td>

                            {/* Cost per unit */}
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              {formatCurrency(unitOverhead, symbol, 2)}
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => deleteFactoryOverhead(o.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Overhead Item"
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
                    Please add product lines under Section 1 (Revenue & Selling Prices) first before formulating bill of materials and unit costs.
                  </p>
                  <button
                    onClick={() => setActiveSection('pricing')}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Go to 1. Revenue & Selling Prices</span>
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

      {/* Section 5: CAPEX */}
      {activeSection === 'capex' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Capital Expenditures & Depreciable Asset Register
              </h2>
              <p className="text-xs text-slate-500">
                Plant equipment, facilities, machinery, vehicles, and technology with assigned useful lives and residual salvage values
              </p>
            </div>
            <button
              onClick={addCapex}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
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
                onClick={addCapex}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
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
                        <td className="py-2 px-3 text-center">
                          <select
                            value={item.purchaseYear}
                            onChange={(e) => updateCapex(item.id, 'purchaseYear', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-emerald-600"
                          >
                            <option value={0}>Year 0 (Startup)</option>
                            <option value={1}>Year 1</option>
                            <option value={2}>Year 2</option>
                            <option value={3}>Year 3</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-600">
                          {formatCurrency(annualDepr, symbol, 0)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => deleteCapex(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Asset"
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
            {onOpenCompanyProfile && (
              <button
                onClick={onOpenCompanyProfile}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Configure Profile & Ownership</span>
              </button>
            )}
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
                className="px-3.5 py-1.5 font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
              >
                Edit Company Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
