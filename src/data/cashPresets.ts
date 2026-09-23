import { CashOnHandItem, CashInBankItem, BankDepositAccountType } from '../types/feasibility';

export interface CashOnHandPreset {
  description: string;
  custodianOrLocation: string;
  defaultAmount: number;
  notes: string;
}

export const COMMON_CASH_ON_HAND_PRESETS: CashOnHandPreset[] = [
  {
    description: 'Petty Cash Operating Fund',
    custodianOrLocation: 'Finance Officer / Custodian',
    defaultAmount: 20000,
    notes: 'Imprest fund for minor emergency purchases, office consumables, courier, and local transit fares.',
  },
  {
    description: 'POS Cash Register / Change Float',
    custodianOrLocation: 'Head Cashier / Store Registers',
    defaultAmount: 15000,
    notes: 'Daily till float in diverse bill denominations and coins for retail/customer cash transactions.',
  },
  {
    description: 'Emergency Vault Reserve',
    custodianOrLocation: 'Branch Safe / Company Vault',
    defaultAmount: 35000,
    notes: 'Secured physical cash contingency reserve for unexpected utility repairs or urgent operational disruptions.',
  },
  {
    description: 'Delivery Logistics & Driver Float',
    custodianOrLocation: 'Dispatch & Fleet Supervisor',
    defaultAmount: 10000,
    notes: 'Revolving cash advances for road tolls, vehicle fuel top-ups, and COD freight disbursements.',
  },
];

export interface CashInBankPreset {
  bankName: string;
  accountType: BankDepositAccountType;
  accountNumberOrRef: string;
  defaultAmount: number;
  annualInterestRate: number;
  notes: string;
}

export const COMMON_CASH_IN_BANK_PRESETS: CashInBankPreset[] = [
  {
    bankName: 'BDO Unibank',
    accountType: 'Checking / Current Account',
    accountNumberOrRef: 'Primary Operating & Payroll Acct',
    defaultAmount: 100000,
    annualInterestRate: 0.75,
    notes: 'Commercial checking account for employee payroll, supplier clearing checks, and daily merchant receipts.',
  },
  {
    bankName: 'Bank of the Philippine Islands (BPI)',
    accountType: 'High-Yield Savings',
    accountNumberOrRef: 'Working Capital Reserve Acct',
    defaultAmount: 150000,
    annualInterestRate: 3.75,
    notes: 'Liquidity cushion earning tiered high-yield interest for quarterly tax obligations and vendor buffer.',
  },
  {
    bankName: 'Security Bank Corporation',
    accountType: 'Time Deposit',
    accountNumberOrRef: '90-Day Treasury Placement',
    defaultAmount: 250000,
    annualInterestRate: 4.50,
    notes: 'Fixed 90-day renewable certificate of deposit securing preferential interest income on surplus equity.',
  },
  {
    bankName: 'Maya Bank (Digital High-Yield)',
    accountType: 'Special Deposit Account',
    accountNumberOrRef: 'Digital Growth Treasury',
    defaultAmount: 100000,
    annualInterestRate: 5.50,
    notes: 'High-yield business interest-earning deposit with daily compounding interest return.',
  },
];

export function generateCashOnHandItem(preset: CashOnHandPreset): CashOnHandItem {
  return {
    id: `coh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    description: preset.description,
    custodianOrLocation: preset.custodianOrLocation,
    amount: preset.defaultAmount,
    notes: preset.notes,
  };
}

export function generateCashInBankItem(preset: CashInBankPreset): CashInBankItem {
  return {
    id: `cib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    bankName: preset.bankName,
    accountType: preset.accountType,
    accountNumberOrRef: preset.accountNumberOrRef,
    depositAmount: preset.defaultAmount,
    annualInterestRate: preset.annualInterestRate,
    notes: preset.notes,
  };
}
