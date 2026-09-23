import {
  FeasibilityModelData,
  ProjectedResults,
  YearlyIncomeStatement,
  YearlyBalanceSheet,
  YearlyCashFlowStatement,
  YearlyFinancialRatios,
  DebtScheduleRow,
  CapitalBudgetingMetrics,
  OpexCategory,
} from '../types/feasibility';

/**
 * Solves for Internal Rate of Return (IRR) using bisection / secant numerical method
 */
export function calculateIRR(cashFlows: number[], guess = 0.1): number {
  const maxIterations = 200;
  const tolerance = 1e-6;

  function npvAtRate(rate: number): number {
    return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
  }

  let low = -0.99;
  let high = 10.0;
  let npvLow = npvAtRate(low);
  let npvHigh = npvAtRate(high);

  if (npvLow * npvHigh > 0) {
    // Both same sign; test standard range
    let r = guess;
    for (let i = 0; i < maxIterations; i++) {
      const npvVal = npvAtRate(r);
      if (Math.abs(npvVal) < tolerance) return r * 100;
      // Numerical derivative
      const dr = 0.0001;
      const dNpv = (npvAtRate(r + dr) - npvVal) / dr;
      if (Math.abs(dNpv) < 1e-9) break;
      const nextR = r - npvVal / dNpv;
      if (Math.abs(nextR - r) < tolerance) return nextR * 100;
      r = nextR;
      if (r < -0.99 || r > 10.0) break;
    }
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npvAtRate(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid * 100;
    }

    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return ((low + high) / 2) * 100;
}

/**
 * Computes debt amortization schedule
 */
export function calculateDebtSchedule(
  principal: number,
  annualInterestRatePct: number,
  termYears: number,
  gracePeriodYears: number,
  totalProjectionYears = 5
): DebtScheduleRow[] {
  const schedule: DebtScheduleRow[] = [];
  if (principal <= 0 || termYears <= 0) {
    for (let y = 1; y <= totalProjectionYears; y++) {
      schedule.push({
        year: y,
        beginningBalance: 0,
        interestPaid: 0,
        principalPaid: 0,
        totalPayment: 0,
        endingBalance: 0,
      });
    }
    return schedule;
  }

  const r = annualInterestRatePct / 100;
  const repaymentYears = Math.max(1, termYears - gracePeriodYears);

  // Equal annual payment formula for amortization: A = P * [r(1+r)^n] / [(1+r)^n - 1]
  const annualPayment =
    r === 0
      ? principal / repaymentYears
      : (principal * (r * Math.pow(1 + r, repaymentYears))) /
        (Math.pow(1 + r, repaymentYears) - 1);

  let currentBalance = principal;

  for (let y = 1; y <= totalProjectionYears; y++) {
    const begBalance = currentBalance;
    if (begBalance <= 0) {
      schedule.push({
        year: y,
        beginningBalance: 0,
        interestPaid: 0,
        principalPaid: 0,
        totalPayment: 0,
        endingBalance: 0,
      });
      continue;
    }

    const interest = begBalance * r;
    let principalPaid = 0;

    if (y <= gracePeriodYears) {
      // Grace period: interest only
      principalPaid = 0;
    } else if (y <= termYears) {
      principalPaid = Math.min(begBalance, annualPayment - interest);
      if (y === termYears || principalPaid > begBalance) {
        principalPaid = begBalance;
      }
    } else {
      principalPaid = begBalance;
    }

    const endingBalance = Math.max(0, begBalance - principalPaid);
    currentBalance = endingBalance;

    schedule.push({
      year: y,
      beginningBalance: begBalance,
      interestPaid: interest,
      principalPaid,
      totalPayment: interest + principalPaid,
      endingBalance,
    });
  }

  return schedule;
}

/**
 * Main Financial Projections Engine
 */
export function runFeasibilityProjections(data: FeasibilityModelData): ProjectedResults {
  const { general, policies, products, opex, capex, financing } = data;
  const numYears = general.projectionYears || 5;
  const taxRate = (general.incomeTaxRate || 25) / 100;
  const discountRate = (general.discountRate || 12) / 100;

  // 1. Debt Amortization Schedule
  const debtSchedule = calculateDebtSchedule(
    financing.loanPrincipal,
    financing.loanInterestRate,
    financing.loanTermYears,
    financing.gracePeriodYears,
    numYears
  );

  // 2. Asset Depreciation Calculation (Straight Line)
  // For each year t, calculate total depreciation from active assets
  const yearlyDepreciation: number[] = new Array(numYears + 1).fill(0);
  const yearlyCapexAdditions: number[] = new Array(numYears + 1).fill(0);

  capex.forEach((asset) => {
    if (asset.purchaseYear <= numYears) {
      yearlyCapexAdditions[asset.purchaseYear] += asset.acquisitionCost;
    }
    const depreciableBase = Math.max(0, asset.acquisitionCost - (asset.salvageValue || 0));
    const annualDepr = asset.usefulLifeYears > 0 ? depreciableBase / asset.usefulLifeYears : 0;

    for (let y = Math.max(1, asset.purchaseYear === 0 ? 1 : asset.purchaseYear); y <= numYears; y++) {
      // Check if asset is still within useful life
      const assetAge = asset.purchaseYear === 0 ? y : y - asset.purchaseYear + 1;
      if (assetAge <= asset.usefulLifeYears) {
        yearlyDepreciation[y] += annualDepr;
      }
    }
  });

  // 3. Projected Income Statement (Years 1 to 5)
  const incomeStatements: YearlyIncomeStatement[] = [];

  for (let y = 1; y <= numYears; y++) {
    let grossRevenue = 0;
    const productRevenues: Record<string, number> = {};
    let totalDirectMaterials = 0;
    let totalDirectLabor = 0;
    let totalOverhead = 0;

    // Calculate product volumes and prices for year y
    products.forEach((prod) => {
      const volGrowth = (prod.annualVolumeGrowth || 0) / 100;
      const priceGrowth = (prod.annualPriceGrowth || 0) / 100;
      // Year 1 uses initial, subsequent years compound
      const volume = prod.initialAnnualVolume * Math.pow(1 + volGrowth, y - 1);
      const price = prod.initialSellingPrice * Math.pow(1 + priceGrowth, y - 1);

      const revenue = volume * price;
      productRevenues[prod.id] = revenue;
      grossRevenue += revenue;

      // Cost escalations
      const costInflation = Math.pow(1 + (general.generalInflationRate || 3) / 100, y - 1);
      totalDirectMaterials += volume * prod.directMaterialPerUnit * costInflation;
      totalDirectLabor += volume * prod.directLaborPerUnit * costInflation;
      totalOverhead += volume * prod.overheadCostPerUnit * costInflation;
    });

    const totalCogs = totalDirectMaterials + totalDirectLabor + totalOverhead;
    const grossProfit = grossRevenue - totalCogs;
    const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    // Operating expenses
    const opexByCategory: Record<OpexCategory, number> = {
      'Salaries & Wages': 0,
      'Selling & Marketing': 0,
      'Rent & Utilities': 0,
      'Administrative & General': 0,
      'Professional & Legal Fees': 0,
      'Repairs & Maintenance': 0,
      'Insurance & Licenses': 0,
      'Other Expenses': 0,
    };

    let totalOpex = 0;
    opex.forEach((item) => {
      let cost = 0;
      if (item.isVariable && item.variablePercent) {
        cost = grossRevenue * (item.variablePercent / 100);
      } else {
        const escalation = (item.annualEscalationRate || 0) / 100;
        cost = item.annualCostY1 * Math.pow(1 + escalation, y - 1);
      }
      opexByCategory[item.category] = (opexByCategory[item.category] || 0) + cost;
      totalOpex += cost;
    });

    const ebitda = grossProfit - totalOpex;
    const ebitdaMarginPercent = grossRevenue > 0 ? (ebitda / grossRevenue) * 100 : 0;

    const depreciation = yearlyDepreciation[y];
    const operatingIncome = ebitda - depreciation; // EBIT
    const operatingMarginPercent = grossRevenue > 0 ? (operatingIncome / grossRevenue) * 100 : 0;

    const interestExpense = debtSchedule[y - 1]?.interestPaid || 0;
    const earningsBeforeTax = operatingIncome - interestExpense; // EBT

    const taxExpense = earningsBeforeTax > 0 ? earningsBeforeTax * taxRate : 0;
    const netIncome = earningsBeforeTax - taxExpense;
    const netMarginPercent = grossRevenue > 0 ? (netIncome / grossRevenue) * 100 : 0;

    incomeStatements.push({
      year: y,
      grossRevenue,
      productRevenues,
      cogs: {
        directMaterials: totalDirectMaterials,
        directLabor: totalDirectLabor,
        overhead: totalOverhead,
        total: totalCogs,
      },
      grossProfit,
      grossMarginPercent,
      opex: {
        byCategory: opexByCategory,
        total: totalOpex,
      },
      ebitda,
      ebitdaMarginPercent,
      depreciation,
      operatingIncome,
      operatingMarginPercent,
      interestExpense,
      earningsBeforeTax,
      taxExpense,
      netIncome,
      netMarginPercent,
    });
  }

  // 4. Balance Sheet & Cash Flow Statement Joint Projection
  // Year 0 Setup: Initial Balance Sheet
  const year0Capex = yearlyCapexAdditions[0];
  const initialEquity = financing.initialEquity || 0;
  const initialDebt = financing.loanPrincipal || 0;
  const initialTotalSources = initialEquity + initialDebt;

  // Year 0 Cash is whatever remains after Year 0 Capex
  const initialCash = Math.max(0, initialTotalSources - year0Capex);

  const balanceSheets: YearlyBalanceSheet[] = [];
  const cashFlows: YearlyCashFlowStatement[] = [];

  // Year 0 Balance Sheet
  balanceSheets.push({
    year: 0,
    assets: {
      currentAssets: {
        cash: initialCash,
        accountsReceivable: 0,
        inventory: 0,
        totalCurrentAssets: initialCash,
      },
      nonCurrentAssets: {
        grossPpe: year0Capex,
        accumulatedDepreciation: 0,
        netPpe: year0Capex,
        totalNonCurrentAssets: year0Capex,
      },
      totalAssets: initialCash + year0Capex,
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 0,
        currentPortionOfDebt: debtSchedule[0]?.principalPaid || 0,
        totalCurrentLiabilities: debtSchedule[0]?.principalPaid || 0,
      },
      nonCurrentLiabilities: {
        longTermDebt: Math.max(0, initialDebt - (debtSchedule[0]?.principalPaid || 0)),
        totalNonCurrentLiabilities: Math.max(0, initialDebt - (debtSchedule[0]?.principalPaid || 0)),
      },
      totalLiabilities: initialDebt,
    },
    equity: {
      contributedCapital: initialEquity,
      retainedEarnings: 0,
      totalEquity: initialEquity,
      ownerEquity:
        data.companyProfile?.classification === 'Sole Proprietorship'
          ? {
              ownerName: data.companyProfile.soleProprietor?.ownerName || 'Proprietor',
              contributedCapital: initialEquity,
              cumulativeProfitShare: 0,
              endingBalance: initialEquity,
            }
          : undefined,
      partnersEquity:
        data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners
          ? data.companyProfile.partners.map((p) => ({
              partnerId: p.id,
              name: p.name || 'Partner',
              contributedCapital: p.capital,
              profitSharePercent: p.profitSharePercent,
              cumulativeProfitShare: 0,
              endingBalance: p.capital,
            }))
          : undefined,
    },
    totalLiabilitiesAndEquity: initialDebt + initialEquity,
    balanceCheck: (initialCash + year0Capex) - (initialDebt + initialEquity),
  });

  let previousEndingCash = initialCash;
  let cumulativeRetainedEarnings = 0;
  let cumulativeGrossPpe = year0Capex;
  let cumulativeDepreciation = 0;

  for (let y = 1; y <= numYears; y++) {
    const is = incomeStatements[y - 1];
    const prevBs = balanceSheets[y - 1];
    const debtRow = debtSchedule[y - 1];
    const nextDebtRow = y < numYears ? debtSchedule[y] : null;

    // Capex in year y
    const currentYearCapex = yearlyCapexAdditions[y] || 0;
    cumulativeGrossPpe += currentYearCapex;
    cumulativeDepreciation += is.depreciation;
    const netPpe = cumulativeGrossPpe - cumulativeDepreciation;

    // Working Capital Balances based on policies:
    // Accounts Receivable = (Credit Sales) * (DSO / 365)
    const creditSales = is.grossRevenue * ((policies.creditSalesPercent || 60) / 100);
    const arEnding = creditSales * ((policies.accountsReceivableDays || 30) / 365);

    // Inventory = COGS * (DSI / 365)
    const inventoryEnding = is.cogs.total * ((policies.inventoryHoldingDays || 45) / 365);

    // Accounts Payable = Direct Materials * (DPO / 365)
    const apEnding = is.cogs.directMaterials * ((policies.accountsPayableDays || 30) / 365);

    // Working Capital Changes from previous year
    const deltaAr = arEnding - prevBs.assets.currentAssets.accountsReceivable; // increase in AR is cash outflow (-)
    const deltaInv = inventoryEnding - prevBs.assets.currentAssets.inventory; // increase in Inv is cash outflow (-)
    const deltaAp = apEnding - prevBs.liabilities.currentLiabilities.accountsPayable; // increase in AP is cash inflow (+)

    // Cash from Operations
    const netCashFromOperations =
      is.netIncome + is.depreciation - deltaAr - deltaInv + deltaAp;

    // Cash from Investing
    const netCashFromInvesting = -currentYearCapex;

    // Potential Dividends based on policy:
    // Only pay dividends if net income is positive and cash won't dip below minimumCashBalance
    let dividendsPaid = 0;
    const maxPotentialDividend =
      is.netIncome > 0
        ? is.netIncome * ((policies.dividendPayoutRatio || 0) / 100)
        : 0;

    const principalRepaid = debtRow.principalPaid;
    const netCashBeforeDividends =
      previousEndingCash +
      netCashFromOperations +
      netCashFromInvesting -
      principalRepaid;

    const minCash = policies.minimumCashBalance || 0;
    if (netCashBeforeDividends > minCash && maxPotentialDividend > 0) {
      dividendsPaid = Math.min(
        maxPotentialDividend,
        netCashBeforeDividends - minCash
      );
    }

    // Cash from Financing
    const netCashFromFinancing = -principalRepaid - dividendsPaid;

    // Net change in cash
    const netChangeInCash =
      netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
    const endingCash = previousEndingCash + netChangeInCash;

    // Update retained earnings
    cumulativeRetainedEarnings += is.netIncome - dividendsPaid;

    // Debt balances
    const endingDebtTotal = debtRow.endingBalance;
    const currentPortion = nextDebtRow ? nextDebtRow.principalPaid : 0;
    const longTermDebtEnding = Math.max(0, endingDebtTotal - currentPortion);

    // Balance Sheet Year y
    const totalCurrentAssets = endingCash + arEnding + inventoryEnding;
    const totalNonCurrentAssets = netPpe;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = apEnding + currentPortion;
    const totalLiabilities = totalCurrentLiabilities + longTermDebtEnding;

    const totalEquity = initialEquity + cumulativeRetainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const balanceCheck = totalAssets - totalLiabilitiesAndEquity;

    balanceSheets.push({
      year: y,
      assets: {
        currentAssets: {
          cash: endingCash,
          accountsReceivable: arEnding,
          inventory: inventoryEnding,
          totalCurrentAssets,
        },
        nonCurrentAssets: {
          grossPpe: cumulativeGrossPpe,
          accumulatedDepreciation: cumulativeDepreciation,
          netPpe,
          totalNonCurrentAssets,
        },
        totalAssets,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: apEnding,
          currentPortionOfDebt: currentPortion,
          totalCurrentLiabilities,
        },
        nonCurrentLiabilities: {
          longTermDebt: longTermDebtEnding,
          totalNonCurrentLiabilities: longTermDebtEnding,
        },
        totalLiabilities,
      },
      equity: {
        contributedCapital: initialEquity,
        retainedEarnings: cumulativeRetainedEarnings,
        totalEquity,
        ownerEquity:
          data.companyProfile?.classification === 'Sole Proprietorship'
            ? {
                ownerName: data.companyProfile.soleProprietor?.ownerName || 'Proprietor',
                contributedCapital: initialEquity,
                cumulativeProfitShare: cumulativeRetainedEarnings,
                endingBalance: totalEquity,
              }
            : undefined,
        partnersEquity:
          data.companyProfile?.classification === 'Partnership' && data.companyProfile.partners
            ? data.companyProfile.partners.map((p) => ({
                partnerId: p.id,
                name: p.name || 'Partner',
                contributedCapital: p.capital,
                profitSharePercent: p.profitSharePercent,
                cumulativeProfitShare: cumulativeRetainedEarnings * (p.profitSharePercent / 100),
                endingBalance: p.capital + cumulativeRetainedEarnings * (p.profitSharePercent / 100),
              }))
            : undefined,
      },
      totalLiabilitiesAndEquity,
      balanceCheck: Math.abs(balanceCheck) < 0.01 ? 0 : balanceCheck,
    });

    cashFlows.push({
      year: y,
      operatingActivities: {
        netIncome: is.netIncome,
        depreciationAddBack: is.depreciation,
        deltaAccountsReceivable: -deltaAr,
        deltaInventory: -deltaInv,
        deltaAccountsPayable: deltaAp,
        netCashFromOperations,
      },
      investingActivities: {
        capitalExpenditures: -currentYearCapex,
        netCashFromInvesting,
      },
      financingActivities: {
        equityInfusion: 0,
        debtProceeds: 0,
        debtPrincipalRepaid: -principalRepaid,
        dividendsPaid: -dividendsPaid,
        netCashFromFinancing,
      },
      netChangeInCash,
      beginningCash: previousEndingCash,
      endingCash,
    });

    previousEndingCash = endingCash;
  }

  // 5. Financial Ratios Computation (Years 1 to 5)
  const ratios: YearlyFinancialRatios[] = [];

  for (let y = 1; y <= numYears; y++) {
    const is = incomeStatements[y - 1];
    const bs = balanceSheets[y]; // index y is year y
    const debtRow = debtSchedule[y - 1];

    const equity = bs.equity.totalEquity;
    const totalAssets = bs.assets.totalAssets;
    const currentAssets = bs.assets.currentAssets.totalCurrentAssets;
    const currentLiabilities = bs.liabilities.currentLiabilities.totalCurrentLiabilities;
    const quickAssets =
      bs.assets.currentAssets.cash + bs.assets.currentAssets.accountsReceivable;
    const totalDebt = bs.liabilities.totalLiabilities;

    // Solvency & Coverage
    const interest = is.interestExpense;
    const interestCoverageRatio =
      interest > 0 ? is.operatingIncome / interest : is.operatingIncome > 0 ? 99 : 0;

    const debtService = debtRow.principalPaid + debtRow.interestPaid;
    // DSCR = (EBITDA - Tax) / Debt Service
    const dscr =
      debtService > 0
        ? (is.ebitda - is.taxExpense) / debtService
        : 99;

    // Efficiency
    const dso = is.grossRevenue > 0
      ? (bs.assets.currentAssets.accountsReceivable / is.grossRevenue) * 365
      : 0;
    const dsi = is.cogs.total > 0
      ? (bs.assets.currentAssets.inventory / is.cogs.total) * 365
      : 0;
    const dpo = is.cogs.directMaterials > 0
      ? (bs.liabilities.currentLiabilities.accountsPayable / is.cogs.directMaterials) * 365
      : 0;
    const ccc = dso + dsi - dpo;
    const assetTurnover = totalAssets > 0 ? is.grossRevenue / totalAssets : 0;

    ratios.push({
      year: y,
      profitability: {
        grossProfitMargin: is.grossMarginPercent,
        operatingProfitMargin: is.operatingMarginPercent,
        netProfitMargin: is.netMarginPercent,
        returnOnEquity: equity > 0 ? (is.netIncome / equity) * 100 : 0,
        returnOnAssets: totalAssets > 0 ? (is.netIncome / totalAssets) * 100 : 0,
        ebitdaMargin: is.ebitdaMarginPercent,
      },
      liquidity: {
        currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 99,
        quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 99,
        cashRatio:
          currentLiabilities > 0
            ? bs.assets.currentAssets.cash / currentLiabilities
            : 99,
      },
      solvency: {
        debtToEquity: equity > 0 ? totalDebt / equity : 0,
        debtToAssets: totalAssets > 0 ? totalDebt / totalAssets : 0,
        interestCoverageRatio,
        dscr,
      },
      efficiency: {
        dso,
        dsi,
        dpo,
        cashConversionCycle: ccc,
        assetTurnover,
      },
    });
  }

  // 6. Capital Budgeting & Feasibility Criteria:
  // Net Present Value (NPV), IRR, Simple & Discounted Payback, Break-Even Analysis
  // Initial Investment = Year 0 Capex + Initial Net Working Capital (if funded from equity/debt)
  const initialCapexInvestment = year0Capex;
  // Free Cash Flow to Firm (FCFF) or Project Cash Flow:
  // Cash flow series: t=0 is -initialCapexInvestment, t=1..5 is OCF - Capex
  const initialOutflow = -(initialCapexInvestment > 0 ? initialCapexInvestment : initialEquity);

  const projectCashFlows: number[] = [initialOutflow];
  for (let y = 1; y <= numYears; y++) {
    const cf = cashFlows[y - 1];
    // Project free cash flow = Operating Cash Flow + Investing Cash Flow (Capex)
    const fcf = cf.operatingActivities.netCashFromOperations + cf.investingActivities.netCashFromInvesting;
    projectCashFlows.push(fcf);
  }

  // NPV calculation
  let npv = initialOutflow;
  let pvInflows = 0;
  for (let y = 1; y <= numYears; y++) {
    const discounted = projectCashFlows[y] / Math.pow(1 + discountRate, y);
    npv += discounted;
    if (discounted > 0) pvInflows += discounted;
  }

  // IRR calculation
  const irr = calculateIRR(projectCashFlows);

  // Payback Periods
  let cumulativeCash = initialOutflow;
  let simplePaybackYears = numYears + 1; // default if not recovered
  for (let y = 1; y <= numYears; y++) {
    const prevCum = cumulativeCash;
    cumulativeCash += projectCashFlows[y];
    if (cumulativeCash >= 0 && prevCum < 0) {
      // Fraction of year: needed / inflow
      const needed = Math.abs(prevCum);
      const inflow = projectCashFlows[y];
      simplePaybackYears = y - 1 + (inflow > 0 ? needed / inflow : 0);
      break;
    }
  }

  // Discounted Payback
  let cumulativeDiscounted = initialOutflow;
  let discountedPaybackYears = numYears + 1;
  for (let y = 1; y <= numYears; y++) {
    const discountedInflow = projectCashFlows[y] / Math.pow(1 + discountRate, y);
    const prevCum = cumulativeDiscounted;
    cumulativeDiscounted += discountedInflow;
    if (cumulativeDiscounted >= 0 && prevCum < 0) {
      const needed = Math.abs(prevCum);
      discountedPaybackYears =
        y - 1 + (discountedInflow > 0 ? needed / discountedInflow : 0);
      break;
    }
  }

  // Profitability Index / BCR (Benefit-Cost Ratio)
  const absInitialInvestment = Math.abs(initialOutflow);
  const profitabilityIndex =
    absInitialInvestment > 0 ? pvInflows / absInitialInvestment : 1;

  // Cumulative 5-year net profit & ROI
  const cumulativeNetProfit5Y = incomeStatements.reduce(
    (sum, is) => sum + is.netIncome,
    0
  );
  const roi5Y =
    absInitialInvestment > 0
      ? (cumulativeNetProfit5Y / absInitialInvestment) * 100
      : 0;

  // Average DSCR
  const loanYears = Math.min(financing.loanTermYears, numYears);
  const activeDscrs = ratios
    .slice(0, loanYears)
    .map((r) => r.solvency.dscr)
    .filter((d) => d < 90);
  const averageDscr =
    activeDscrs.length > 0
      ? activeDscrs.reduce((a, b) => a + b, 0) / activeDscrs.length
      : 2.5;

  // Year 1 Break-Even Analysis
  // Fixed costs = Fixed Opex + Depreciation + Interest
  const isY1 = incomeStatements[0];
  const fixedCostsY1 = isY1.opex.total + isY1.depreciation + isY1.interestExpense;
  const variableCostsY1 = isY1.cogs.total;
  const contributionMarginY1 = isY1.grossRevenue - variableCostsY1;
  const contributionMarginRatio =
    isY1.grossRevenue > 0 ? contributionMarginY1 / isY1.grossRevenue : 0;
  const breakEvenRevenueY1 =
    contributionMarginRatio > 0 ? fixedCostsY1 / contributionMarginRatio : 0;
  const marginOfSafetyY1 =
    isY1.grossRevenue > 0
      ? ((isY1.grossRevenue - breakEvenRevenueY1) / isY1.grossRevenue) * 100
      : 0;

  // 7. Feasibility Verdict & Scorecard
  const hurdleRatePct = general.discountRate || 12;
  const passedNpv = npv > 0;
  const passedIrr = irr > hurdleRatePct;
  const passedPayback = simplePaybackYears <= 4.0;
  const passedDscr = averageDscr >= 1.25;
  const passedProfit = cumulativeNetProfit5Y > 0;

  const passCount = [
    passedNpv,
    passedIrr,
    passedPayback,
    passedDscr,
    passedProfit,
  ].filter(Boolean).length;

  let verdict: 'FEASIBLE' | 'CONDITIONALLY FEASIBLE' | 'INFEASIBLE' = 'FEASIBLE';
  if (passCount >= 4 && passedNpv) {
    verdict = 'FEASIBLE';
  } else if (passCount >= 3) {
    verdict = 'CONDITIONALLY FEASIBLE';
  } else {
    verdict = 'INFEASIBLE';
  }

  const scorecard = [
    {
      criterion: 'Net Present Value (NPV)',
      target: '> 0 (Value Accretive)',
      actual: `${general.currencySymbol}${npv.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      passed: passedNpv,
      importance: 'Critical' as const,
    },
    {
      criterion: 'Internal Rate of Return (IRR)',
      target: `> Hurdle Rate (${hurdleRatePct}%)`,
      actual: `${irr.toFixed(1)}%`,
      passed: passedIrr,
      importance: 'Critical' as const,
    },
    {
      criterion: 'Simple Payback Period',
      target: '≤ 4.0 Years',
      actual:
        simplePaybackYears <= numYears
          ? `${simplePaybackYears.toFixed(1)} Years`
          : `> ${numYears} Years`,
      passed: passedPayback,
      importance: 'High' as const,
    },
    {
      criterion: 'Debt Service Coverage (DSCR)',
      target: '≥ 1.25x (Bank Solvency)',
      actual: `${averageDscr.toFixed(2)}x`,
      passed: passedDscr,
      importance: 'High' as const,
    },
    {
      criterion: '5-Year Cumulative Net Profit',
      target: '> 0 (Sustained Profitability)',
      actual: `${general.currencySymbol}${cumulativeNetProfit5Y.toLocaleString(
        undefined,
        { maximumFractionDigits: 0 }
      )}`,
      passed: passedProfit,
      importance: 'Critical' as const,
    },
  ];

  return {
    incomeStatements,
    balanceSheets,
    cashFlows,
    ratios,
    metrics: {
      initialInvestment: absInitialInvestment,
      npv,
      irr,
      simplePaybackYears,
      discountedPaybackYears,
      profitabilityIndex,
      cumulativeNetProfit5Y,
      roi5Y,
      averageDscr,
      bepYear1: {
        fixedCosts: fixedCostsY1,
        variableCostRatio:
          isY1.grossRevenue > 0 ? variableCostsY1 / isY1.grossRevenue : 0,
        contributionMarginRatio,
        breakEvenRevenue: breakEvenRevenueY1,
        marginOfSafetyPercent: marginOfSafetyY1,
      },
      verdict,
      scorecard,
    },
    debtSchedule,
  };
}

/**
 * Format currency with symbol and comma separation
 */
export function formatCurrency(
  val: number,
  symbol = '$',
  decimals = 0
): string {
  if (isNaN(val)) return `${symbol}0`;
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return isNegative ? `(${symbol}${formatted})` : `${symbol}${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(val: number, decimals = 1): string {
  if (isNaN(val)) return '0.0%';
  return `${val.toFixed(decimals)}%`;
}
