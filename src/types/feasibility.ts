/**
 * Types and interfaces for the Financial Feasibility Study Suite
 */

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  initialSellingPrice: number;
  annualPriceGrowth: number; // percentage, e.g. 3 for 3%
  initialAnnualVolume: number;
  annualVolumeGrowth: number; // percentage, e.g. 5 for 5%
  directMaterialPerUnit: number;
  directLaborPerUnit: number;
  overheadCostPerUnit: number;
}

export type OpexCategory =
  | 'Salaries & Wages'
  | 'Selling & Marketing'
  | 'Rent & Utilities'
  | 'Administrative & General'
  | 'Professional & Legal Fees'
  | 'Repairs & Maintenance'
  | 'Insurance & Licenses'
  | 'Other Expenses';

export interface OpexItem {
  id: string;
  name: string;
  category: OpexCategory;
  annualCostY1: number;
  annualEscalationRate: number; // percentage, e.g. 4 for 4%
  isVariable: boolean; // if true, scaled with revenue %
  variablePercent?: number; // % of revenue if variable
}

export type CapexCategory =
  | 'Equipment & Machinery'
  | 'Leasehold Improvements'
  | 'Furniture & Fixtures'
  | 'Vehicles & Logistics'
  | 'IT Hardware & Software'
  | 'Land & Buildings';

export type FixedAssetOverheadCategory = 'overhead' | 'operating' | 'percentage';

export interface CapexItem {
  id: string;
  name: string;
  category: CapexCategory;
  acquisitionCost: number;
  usefulLifeYears: number;
  salvageValue: number;
  purchaseYear: number; // 0 for initial startup, 1-5 for future expansion
  overheadAllocationCategory?: FixedAssetOverheadCategory;
  overheadPercent?: number; // % allocated to Factory Overhead (0 - 100)
}

export interface CompanyPolicies {
  accountsReceivableDays: number; // DSO (Days Sales Outstanding)
  creditSalesPercent: number; // % of sales made on credit terms (e.g. 60%)
  inventoryHoldingDays: number; // DSI (Days Sales of Inventory)
  accountsPayableDays: number; // DPO (Days Payable Outstanding)
  minimumCashBalance: number; // Cash buffer floor
  dividendPayoutRatio: number; // % of net profit distributed as dividends (if cash allows)
  depreciationMethod: 'straight_line';
}

export type EntityClassification = 'Sole Proprietorship' | 'Partnership';

export interface PartnerContribution {
  id: string;
  name: string;
  capital: number;
  profitSharePercent: number;
}

export interface SoleProprietorProfile {
  ownerName: string;
  capital: number;
}

export interface CompanyProfile {
  entityName: string;
  classification: EntityClassification;
  nature: string;
  purpose: string;
  soleProprietor?: SoleProprietorProfile;
  partners?: PartnerContribution[];
}

export interface FinancingPlan {
  initialEquity: number; // Contributed capital
  hasLoan?: boolean; // Whether bank borrowing is enabled
  bankName?: string; // Commercial bank selected (e.g. BDO Unibank, BPI, Metrobank, etc.)
  loanPrincipal: number; // Long-term bank borrowing
  loanInterestRate: number; // Annual interest rate % (e.g. 7.5%)
  loanTermYears: number; // Loan tenor in years (e.g. 5)
  gracePeriodYears: number; // Years before principal repayment starts
}

export interface PreOperatingExpenseItem {
  id: string;
  name: string; // Expense description (e.g. SEC/DTI Registration, Mayor's Permit, Legal Fees, Feasibility Study, Initial Marketing)
  category?: string; // 'Legal & Regulatory', 'Professional & Advisory', 'Marketing & Launch', 'Training & Trial', 'Utilities & Deposits', 'Other'
  amount: number; // Amount paid
  notes?: string; // Notes or official receipt reference
}

export interface CashOnHandItem {
  id: string;
  description: string; // Purpose e.g. Petty Cash Fund, Cash Register Drawer, Vault Cash, Delivery Float
  custodianOrLocation?: string; // Custodian / Department / Branch
  amount: number; // Cash on hand allocation amount
  notes?: string; // Replenishment policy / remarks
}

export type BankDepositAccountType =
  | 'Savings Account'
  | 'High-Yield Savings'
  | 'Time Deposit'
  | 'Checking / Current Account'
  | 'Special Deposit Account';

export interface CashInBankItem {
  id: string;
  bankName: string; // Bank institution name (e.g. BDO, BPI, Metrobank, LandBank, Security Bank, etc.)
  accountType: BankDepositAccountType;
  accountNumberOrRef?: string; // Account reference or purpose identifier
  depositAmount: number; // Amount placed in bank
  annualInterestRate: number; // Annual interest rate earned % p.a.
  notes?: string; // Purpose, maturity tenor, or notes
}

export interface GeneralAssumptions {
  projectName: string;
  companyName: string;
  industry: string;
  preparedBy: string;
  currency: string;
  currencySymbol: string;
  startYear: number;
  projectionYears: number; // typically 5
  incomeTaxRate: number; // corporate tax % (e.g. 25%)
  discountRate: number; // hurdle rate / WACC % (e.g. 12%)
  generalInflationRate: number; // % per year (e.g. 3.5%)
  projectDescription: string;
}

export interface RawMaterialItem {
  id: string;
  productId: string; // Product it is needed for (or product ID)
  materialName: string; // Raw material name
  costPerMaterialUnit: number; // Cost per unit of that material
  unitOfMeasure?: string; // Units/measurement used per raw material (e.g. kg, grams, pcs, liters, bag)
  yieldPerMaterialUnit: number; // How many finished product units 1 unit of material produces
}

export type LaborClassification = 'fixed' | 'quota';

export interface DirectLaborItem {
  id: string;
  roleName: string; // Role / Employee title in production
  productId: string; // Specific product ID or 'all' for general production
  numberOfEmployees: number; // Number of employees in production
  classification: LaborClassification; // 'fixed' | 'quota'
  dailyRate: number; // Daily rate (for fixed)
  workingDaysPerMonth: number; // Working days per month (default 26)
  ratePerPiece: number; // Pay per piece produced (for quota)
}

export interface FactoryOverheadItem {
  id: string;
  name: string; // Overhead description
  category: string; // Utilities, Maintenance, Rent, Supervision, Supplies, etc.
  productId: string; // Specific product ID or 'all'
  annualCost: number; // Annual overhead expense
}

export interface IndirectLaborItem {
  id: string;
  roleName: string; // Role / Employee title (e.g. Factory Supervisor, Maintenance Tech, QA Inspector)
  productId: string; // Specific product ID or 'all' for general factory production
  numberOfEmployees: number; // Headcount
  classification: LaborClassification; // 'fixed' | 'quota'
  dailyRate: number; // Daily rate (for fixed)
  workingDaysPerMonth: number; // Working days per month (default 26)
  ratePerPiece: number; // Pay per piece produced (for quota)
}

export interface IndirectMaterialItem {
  id: string;
  materialName: string; // Material description (e.g. Machine Lubricants, Cleaning Sanitizers, Safety Gloves)
  costPerMaterialUnit: number; // Cost per unit of measure
  unitOfMeasure?: string; // Unit of measure (e.g. liters, kg, boxes, pcs)
  annualQuantity: number; // Estimated annual consumption
  annualCost?: number; // Total annual cost (optional override or computed)
}

export type UtilityAllocationCategory = 'overhead' | 'opex' | 'percentage';

export interface IndirectUtilityItem {
  id: string;
  expenseAccount: string; // Expense account (e.g. Factory Electricity, Water & Sewerage, Gas, Facility Internet)
  monthlyCost: number; // Monthly cost
  annualCost: number; // Annual cost (monthlyCost * 12)
  allocationCategory: UtilityAllocationCategory; // 'overhead' (100%), 'opex' (100%), or 'percentage'
  overheadPercent: number; // % belonging to Factory Overhead (0 to 100)
}

export interface FeasibilityModelData {
  companyProfile?: CompanyProfile;
  general: GeneralAssumptions;
  policies: CompanyPolicies;
  products: ProductItem[];
  rawMaterials?: RawMaterialItem[];
  directLabor?: DirectLaborItem[];
  factoryOverhead?: FactoryOverheadItem[];
  indirectLabor?: IndirectLaborItem[];
  indirectMaterials?: IndirectMaterialItem[];
  indirectUtilities?: IndirectUtilityItem[];
  preOperatingExpenses?: PreOperatingExpenseItem[];
  cashOnHand?: CashOnHandItem[];
  cashInBank?: CashInBankItem[];
  opex: OpexItem[];
  capex: CapexItem[];
  financing: FinancingPlan;
}

// Projection outputs for a single year
export interface YearlyIncomeStatement {
  year: number;
  grossRevenue: number;
  productRevenues: Record<string, number>;
  cogs: {
    directMaterials: number;
    directLabor: number;
    overhead: number;
    total: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  opex: {
    byCategory: Record<OpexCategory, number>;
    total: number;
  };
  ebitda: number;
  ebitdaMarginPercent: number;
  depreciation: number;
  factoryDepreciation?: number;
  operatingDepreciation?: number;
  totalDepreciation?: number;
  operatingIncome: number; // EBIT
  operatingMarginPercent: number;
  interestIncome?: number; // Interest earned on bank deposits & placements
  interestExpense: number; // Interest paid on bank borrowings
  earningsBeforeTax: number; // EBT
  taxExpense: number;
  netIncome: number;
  netMarginPercent: number;
}

export interface YearlyBalanceSheet {
  year: number; // 0 (initial startup) to 5
  assets: {
    currentAssets: {
      cash: number;
      cashOnHand?: number;
      cashInBank?: number;
      accountsReceivable: number;
      inventory: number;
      totalCurrentAssets: number;
    };
    nonCurrentAssets: {
      grossPpe: number;
      accumulatedDepreciation: number;
      netPpe: number;
      deferredPreOperatingCosts?: number;
      totalNonCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      currentPortionOfDebt: number;
      totalCurrentLiabilities: number;
    };
    nonCurrentLiabilities: {
      longTermDebt: number;
      totalNonCurrentLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    contributedCapital: number;
    retainedEarnings: number;
    totalEquity: number;
    ownerEquity?: {
      ownerName: string;
      contributedCapital: number;
      cumulativeProfitShare: number;
      endingBalance: number;
    };
    partnersEquity?: Array<{
      partnerId: string;
      name: string;
      contributedCapital: number;
      profitSharePercent: number;
      cumulativeProfitShare: number;
      endingBalance: number;
    }>;
  };
  totalLiabilitiesAndEquity: number;
  balanceCheck: number; // Difference between Total Assets and Total L&E (should be 0)
}

export interface YearlyCashFlowStatement {
  year: number;
  operatingActivities: {
    netIncome: number;
    depreciationAddBack: number;
    deltaAccountsReceivable: number; // negative = cash outflow
    deltaInventory: number; // negative = cash outflow
    deltaAccountsPayable: number; // positive = cash inflow
    netCashFromOperations: number;
  };
  investingActivities: {
    capitalExpenditures: number; // negative cash outflow
    netCashFromInvesting: number;
  };
  financingActivities: {
    equityInfusion: number;
    debtProceeds: number;
    debtPrincipalRepaid: number; // negative cash outflow
    dividendsPaid: number; // negative cash outflow
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

export interface YearlyFinancialRatios {
  year: number;
  profitability: {
    grossProfitMargin: number; // %
    operatingProfitMargin: number; // %
    netProfitMargin: number; // %
    returnOnEquity: number; // % ROE
    returnOnAssets: number; // % ROA
    ebitdaMargin: number; // %
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  solvency: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverageRatio: number; // EBIT / Interest
    dscr: number; // Debt Service Coverage Ratio: (EBITDA - Tax) / (Principal + Interest)
  };
  efficiency: {
    dso: number; // Days Sales Outstanding
    dsi: number; // Days Sales of Inventory
    dpo: number; // Days Payable Outstanding
    cashConversionCycle: number; // DSO + DSI - DPO
    assetTurnover: number; // Revenue / Total Assets
  };
}

export interface CapitalBudgetingMetrics {
  initialInvestment: number; // Year 0 Total Capex + Initial Cash
  npv: number; // Net Present Value at hurdle rate
  irr: number; // Internal Rate of Return %
  discountedPaybackYears: number; // Fractional years
  simplePaybackYears: number; // Fractional years
  profitabilityIndex: number; // Benefit-Cost Ratio (BCR)
  cumulativeNetProfit5Y: number;
  roi5Y: number; // Cumulative 5Y Net Profit / Initial Investment %
  averageDscr: number; // Avg DSCR across loan years
  bepYear1: {
    fixedCosts: number;
    variableCostRatio: number;
    contributionMarginRatio: number;
    breakEvenRevenue: number;
    marginOfSafetyPercent: number;
  };
  verdict: 'FEASIBLE' | 'CONDITIONALLY FEASIBLE' | 'INFEASIBLE';
  scorecard: {
    criterion: string;
    target: string;
    actual: string;
    passed: boolean;
    importance: 'High' | 'Medium' | 'Critical';
  }[];
}

export interface DebtScheduleRow {
  year: number;
  beginningBalance: number;
  interestPaid: number;
  principalPaid: number;
  totalPayment: number;
  endingBalance: number;
}

export interface ProjectedResults {
  incomeStatements: YearlyIncomeStatement[];
  balanceSheets: YearlyBalanceSheet[];
  cashFlows: YearlyCashFlowStatement[];
  ratios: YearlyFinancialRatios[];
  metrics: CapitalBudgetingMetrics;
  debtSchedule: DebtScheduleRow[];
}
