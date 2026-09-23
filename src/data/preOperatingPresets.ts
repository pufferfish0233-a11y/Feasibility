import { PreOperatingExpenseItem } from '../types/feasibility';

export interface PreOpTemplateItem {
  name: string;
  category: string;
  defaultAmount: number;
  notes: string;
}

export const COMMON_PRE_OPERATING_EXPENSES: PreOpTemplateItem[] = [
  {
    name: 'Business Registration, SEC/DTI Filings & Corporate Licensing',
    category: 'Legal & Regulatory',
    defaultAmount: 5000,
    notes: 'Articles of incorporation/DTI certificate, corporate seal, initial registration fees',
  },
  {
    name: "Mayor's Permit, Barangay Clearance & Fire Safety Inspection",
    category: 'Legal & Regulatory',
    defaultAmount: 3500,
    notes: 'Municipal business permit, sanitary inspection, health clearances, and fire certificate',
  },
  {
    name: 'Feasibility Study, Financial Modeling & Technical Advisory',
    category: 'Professional & Advisory',
    defaultAmount: 8000,
    notes: 'Third-party market feasibility study, financial analysis, and engineering review',
  },
  {
    name: 'Environmental Compliance Certificate (ECC) & Municipal Clearances',
    category: 'Legal & Regulatory',
    defaultAmount: 4500,
    notes: 'Environmental assessment, waste management clearances, zoning compliance',
  },
  {
    name: 'Architectural, Engineering & Facility Layout Blueprint Design',
    category: 'Professional & Advisory',
    defaultAmount: 7500,
    notes: 'Site layout, electrical blueprint, plumbing schematic, safety exit maps',
  },
  {
    name: 'Storefront/Plant Signages, Branding & Grand Opening Marketing',
    category: 'Marketing & Launch',
    defaultAmount: 6000,
    notes: 'Exterior illuminated sign, brand identity kit, launch promotional ads & flyers',
  },
  {
    name: 'Staff Onboarding, Machine Calibration & Pre-Launch Wages',
    category: 'Training & Trial',
    defaultAmount: 5500,
    notes: 'Staff training period, equipment dry-runs, SOP testing, soft-opening labor',
  },
  {
    name: 'Trial Production Batch Run & Raw Material Pilot Testing',
    category: 'Training & Trial',
    defaultAmount: 4000,
    notes: 'Sample product test batches, laboratory testing, sensory analysis, packaging test',
  },
  {
    name: 'Commercial Utility Installations & Meter Security Deposits',
    category: 'Utilities & Deposits',
    defaultAmount: 5000,
    notes: 'Three-phase power grid deposit, high-pressure water meter deposit, telecom install',
  },
];

export function generatePreOpExpenseItem(preset: PreOpTemplateItem): PreOperatingExpenseItem {
  return {
    id: `pre_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: preset.name,
    category: preset.category,
    amount: preset.defaultAmount,
    notes: preset.notes,
  };
}
