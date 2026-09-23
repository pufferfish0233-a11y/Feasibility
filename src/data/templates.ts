import { FeasibilityModelData } from '../types/feasibility';

export interface TemplatePreset {
  id: string;
  name: string;
  category: string;
  tagline: string;
  data: FeasibilityModelData;
}

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'coffee_roastery',
    name: 'Artisanal Coffee Roastery & Cafe',
    category: 'Retail & Hospitality (F&B)',
    tagline: 'Specialty coffee roasting, cafe beverage operations, and retail bagged bean subscription model.',
    data: {
      general: {
        projectName: 'Solstice Artisanal Roastery & Cafe',
        companyName: 'Solstice Coffee Ventures LLC',
        industry: 'Food & Beverage / Specialty Retail',
        preparedBy: 'Financial Feasibility Advisory Group',
        currency: 'USD',
        currencySymbol: '$',
        startYear: 2026,
        projectionYears: 5,
        incomeTaxRate: 25,
        discountRate: 12,
        generalInflationRate: 3.5,
        projectDescription:
          'Establishment of an urban artisanal coffee roastery with integrated boutique cafe seating 45 guests, alongside direct-to-consumer packaged bean sales and B2B wholesale supply to local cafes.',
      },
      policies: {
        accountsReceivableDays: 20, // Low AR because cafe sales are cash/card, wholesale on 30-day terms
        creditSalesPercent: 35, // 35% B2B wholesale, 65% immediate retail POS
        inventoryHoldingDays: 30, // 1 month of green coffee and packaging inventory
        accountsPayableDays: 28, // Supplier payment window
        minimumCashBalance: 15000,
        dividendPayoutRatio: 25,
        depreciationMethod: 'straight_line',
      },
      products: [
        {
          id: 'prod_1',
          name: 'Handcrafted Espresso & Specialty Drinks',
          category: 'Cafe Beverage',
          unit: 'Cups',
          initialSellingPrice: 5.75,
          annualPriceGrowth: 3.0,
          initialAnnualVolume: 62000,
          annualVolumeGrowth: 7.0,
          directMaterialPerUnit: 1.15, // milk, beans, syrups, cup/lid
          directLaborPerUnit: 0.95, // barista preparation
          overheadCostPerUnit: 0.35, // water filtration, ice, power
        },
        {
          id: 'prod_2',
          name: 'Roasted Specialty Beans (250g Bag)',
          category: 'Retail & Wholesale',
          unit: 'Bags',
          initialSellingPrice: 18.5,
          annualPriceGrowth: 3.5,
          initialAnnualVolume: 11500,
          annualVolumeGrowth: 12.0,
          directMaterialPerUnit: 5.4, // green bean single origin, valve bag, label
          directLaborPerUnit: 1.6, // head roaster & packaging team
          overheadCostPerUnit: 0.55, // roaster natural gas, degassing bins
        },
        {
          id: 'prod_3',
          name: 'Artisan Pastries & Gourmet Toast Bar',
          category: 'Food Menu',
          unit: 'Servings',
          initialSellingPrice: 7.25,
          annualPriceGrowth: 3.0,
          initialAnnualVolume: 24000,
          annualVolumeGrowth: 8.0,
          directMaterialPerUnit: 2.3, // sourdough, butter, avocado, salmon, brioche
          directLaborPerUnit: 1.1, // kitchen prep
          overheadCostPerUnit: 0.4, // toaster, refrigeration, packaging
        },
        {
          id: 'prod_4',
          name: 'Coffee Club Monthly Subscriptions',
          category: 'E-Commerce',
          unit: 'Boxes',
          initialSellingPrice: 38.0,
          annualPriceGrowth: 2.5,
          initialAnnualVolume: 2400,
          annualVolumeGrowth: 22.0,
          directMaterialPerUnit: 11.2, // 2 bags + gift insert + shipping box
          directLaborPerUnit: 2.2, // fulfillment
          overheadCostPerUnit: 1.2, // shipping logistics & packing materials
        },
      ],
      opex: [
        {
          id: 'op_1',
          name: 'Cafe Management & Head Roaster Salary',
          category: 'Salaries & Wages',
          annualCostY1: 68000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'op_2',
          name: 'Storefront Commercial Rent (1,800 sq ft)',
          category: 'Rent & Utilities',
          annualCostY1: 54000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'op_3',
          name: 'Commercial Utilities (Electric, Gas, Water)',
          category: 'Rent & Utilities',
          annualCostY1: 14400,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'op_4',
          name: 'Local Digital Marketing & Community Events',
          category: 'Selling & Marketing',
          annualCostY1: 18000,
          annualEscalationRate: 5.0,
          isVariable: false,
        },
        {
          id: 'op_5',
          name: 'Commercial Liability & Property Insurance',
          category: 'Insurance & Licenses',
          annualCostY1: 7200,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'op_6',
          name: 'Accounting, POS SaaS & Legal Compliance',
          category: 'Professional & Legal Fees',
          annualCostY1: 8500,
          annualEscalationRate: 3.5,
          isVariable: false,
        },
        {
          id: 'op_7',
          name: 'Roaster & Espresso Equipment Maintenance',
          category: 'Repairs & Maintenance',
          annualCostY1: 6000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
      ],
      capex: [
        {
          id: 'cap_1',
          name: 'Commercial 6kg Drum Coffee Roaster & Afterburner',
          category: 'Equipment & Machinery',
          acquisitionCost: 48000,
          usefulLifeYears: 10,
          salvageValue: 8000,
          purchaseYear: 0,
        },
        {
          id: 'cap_2',
          name: 'Synesso 3-Group Commercial Espresso Machine & Mythos Grinders',
          category: 'Equipment & Machinery',
          acquisitionCost: 32000,
          usefulLifeYears: 7,
          salvageValue: 5000,
          purchaseYear: 0,
        },
        {
          id: 'cap_3',
          name: 'Store Leasehold Improvements & Bar Counter Architecture',
          category: 'Leasehold Improvements',
          acquisitionCost: 65000,
          usefulLifeYears: 10,
          salvageValue: 0,
          purchaseYear: 0,
        },
        {
          id: 'cap_4',
          name: 'Commercial Cold Storage, Display Cases & Dishwashing',
          category: 'Equipment & Machinery',
          acquisitionCost: 22000,
          usefulLifeYears: 8,
          salvageValue: 2500,
          purchaseYear: 0,
        },
        {
          id: 'cap_5',
          name: 'Custom Oak Seating, Tables & Acoustic Treatment',
          category: 'Furniture & Fixtures',
          acquisitionCost: 18000,
          usefulLifeYears: 7,
          salvageValue: 1500,
          purchaseYear: 0,
        },
      ],
      financing: {
        initialEquity: 115000,
        loanPrincipal: 85000,
        loanInterestRate: 7.5,
        loanTermYears: 5,
        gracePeriodYears: 0,
      },
    },
  },
  {
    id: 'saas_tech',
    name: 'Cloud B2B SaaS Platform',
    category: 'Technology & Enterprise Software',
    tagline: 'High-margin recurring revenue subscription model with multi-tier enterprise contracts.',
    data: {
      general: {
        projectName: 'NexusFlow Automation Cloud',
        companyName: 'NexusFlow Technologies Inc.',
        industry: 'B2B Enterprise SaaS',
        preparedBy: 'Strategic Tech Valuation Partners',
        currency: 'USD',
        currencySymbol: '$',
        startYear: 2026,
        projectionYears: 5,
        incomeTaxRate: 21,
        discountRate: 14,
        generalInflationRate: 3.0,
        projectDescription:
          'Commercial launch of a multi-tenant cloud automation engine automating supply chain procurement workflows for mid-market distributors, distributed through subscription tiers.',
      },
      policies: {
        accountsReceivableDays: 35, // Annual billing & Net-30 enterprise invoicing
        creditSalesPercent: 75,
        inventoryHoldingDays: 0, // SaaS zero physical inventory
        accountsPayableDays: 25,
        minimumCashBalance: 40000,
        dividendPayoutRatio: 15,
        depreciationMethod: 'straight_line',
      },
      products: [
        {
          id: 'saas_1',
          name: 'Professional Team Plan (Annual)',
          category: 'Recurring Software',
          unit: 'Seats/Yr',
          initialSellingPrice: 1800,
          annualPriceGrowth: 4.0,
          initialAnnualVolume: 120,
          annualVolumeGrowth: 32.0,
          directMaterialPerUnit: 140, // Cloud AWS/GCP hosting per tenant
          directLaborPerUnit: 110, // Customer support SLA
          overheadCostPerUnit: 40, // Database queries & microservices
        },
        {
          id: 'saas_2',
          name: 'Enterprise Custom Instance',
          category: 'Recurring Software',
          unit: 'Contract',
          initialSellingPrice: 12500,
          annualPriceGrowth: 5.0,
          initialAnnualVolume: 18,
          annualVolumeGrowth: 40.0,
          directMaterialPerUnit: 950, // Dedicated VPC, compliance audits
          directLaborPerUnit: 1200, // Dedicated Technical Account Manager
          overheadCostPerUnit: 350, // Security telemetry & backups
        },
        {
          id: 'saas_3',
          name: 'ERP Integration & Data Migration Onboarding',
          category: 'Professional Services',
          unit: 'Engagements',
          initialSellingPrice: 4500,
          annualPriceGrowth: 3.0,
          initialAnnualVolume: 35,
          annualVolumeGrowth: 20.0,
          directMaterialPerUnit: 250, // Migration connector licenses
          directLaborPerUnit: 1800, // Solution architects
          overheadCostPerUnit: 150,
        },
      ],
      opex: [
        {
          id: 'sop_1',
          name: 'Lead Software Engineers & DevOps Payroll',
          category: 'Salaries & Wages',
          annualCostY1: 180000,
          annualEscalationRate: 5.0,
          isVariable: false,
        },
        {
          id: 'sop_2',
          name: 'B2B Inbound Demand Gen & LinkedIn Marketing',
          category: 'Selling & Marketing',
          annualCostY1: 48000,
          annualEscalationRate: 8.0,
          isVariable: false,
        },
        {
          id: 'sop_3',
          name: 'SOC2 Type II & Security Compliance Audits',
          category: 'Professional & Legal Fees',
          annualCostY1: 22000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'sop_4',
          name: 'Internal Tools, Jira, GitHub & Productivity SaaS',
          category: 'Administrative & General',
          annualCostY1: 16000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'sop_5',
          name: 'Executive & Cyber Risk Errors/Omissions Insurance',
          category: 'Insurance & Licenses',
          annualCostY1: 9500,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
      ],
      capex: [
        {
          id: 'scap_1',
          name: 'Proprietary Core IP Development & Architecture Assets',
          category: 'IT Hardware & Software',
          acquisitionCost: 85000,
          usefulLifeYears: 5,
          salvageValue: 0,
          purchaseYear: 0,
        },
        {
          id: 'scap_2',
          name: 'Engineering Laptops, Dev Hardware & Test Nodes',
          category: 'IT Hardware & Software',
          acquisitionCost: 28000,
          usefulLifeYears: 3,
          salvageValue: 3000,
          purchaseYear: 0,
        },
        {
          id: 'scap_3',
          name: 'Ergonomic Agile Innovation Studio Fit-Out',
          category: 'Furniture & Fixtures',
          acquisitionCost: 19000,
          usefulLifeYears: 5,
          salvageValue: 1000,
          purchaseYear: 0,
        },
      ],
      financing: {
        initialEquity: 180000,
        loanPrincipal: 60000,
        loanInterestRate: 8.0,
        loanTermYears: 4,
        gracePeriodYears: 0,
      },
    },
  },
  {
    id: 'eco_manufacturing',
    name: 'Eco-Packaging & Bagasse Container Manufacturing',
    category: 'Industrial & Manufacturing',
    tagline: 'High-volume production facility manufacturing 100% biodegradable sugarcane fiber food packaging.',
    data: {
      general: {
        projectName: 'Verdant Earth Fiber Packaging Plant',
        companyName: 'Verdant Packaging Industries Corp.',
        industry: 'Sustainable Packaging Manufacturing',
        preparedBy: 'Industrial Feasibility Engineering Board',
        currency: 'USD',
        currencySymbol: '$',
        startYear: 2026,
        projectionYears: 5,
        incomeTaxRate: 25,
        discountRate: 11.5,
        generalInflationRate: 3.8,
        projectDescription:
          'Establishment of a 22,000 sq ft industrial pulp thermoforming plant producing compostable takeout clamshells and bowls from agricultural sugarcane bagasse, replacing single-use styrofoam.',
      },
      policies: {
        accountsReceivableDays: 45, // Commercial distributors on 45-day payment cycles
        creditSalesPercent: 90,
        inventoryHoldingDays: 40, // Raw bagasse pulp & finished goods inventory
        accountsPayableDays: 35,
        minimumCashBalance: 35000,
        dividendPayoutRatio: 30,
        depreciationMethod: 'straight_line',
      },
      products: [
        {
          id: 'mfg_1',
          name: '850ml 3-Compartment Hinged Clamshells',
          category: 'Takeout Containers',
          unit: 'Case (500pcs)',
          initialSellingPrice: 42.5,
          annualPriceGrowth: 3.5,
          initialAnnualVolume: 16000,
          annualVolumeGrowth: 15.0,
          directMaterialPerUnit: 14.8, // raw sugarcane pulp, water repellent agents
          directLaborPerUnit: 6.2, // press operators, trim & packing line
          overheadCostPerUnit: 3.1, // electric thermoforming steam, compressed air
        },
        {
          id: 'mfg_2',
          name: '500ml Heavy-Duty Compostable Bowls',
          category: 'Bowls & Plates',
          unit: 'Case (1000pcs)',
          initialSellingPrice: 58.0,
          annualPriceGrowth: 3.5,
          initialAnnualVolume: 11000,
          annualVolumeGrowth: 18.0,
          directMaterialPerUnit: 19.5,
          directLaborPerUnit: 7.8,
          overheadCostPerUnit: 4.2,
        },
        {
          id: 'mfg_3',
          name: 'Biodegradable 10-inch Dining Plates',
          category: 'Tableware',
          unit: 'Case (500pcs)',
          initialSellingPrice: 34.0,
          annualPriceGrowth: 3.0,
          initialAnnualVolume: 9500,
          annualVolumeGrowth: 12.0,
          directMaterialPerUnit: 11.4,
          directLaborPerUnit: 4.9,
          overheadCostPerUnit: 2.5,
        },
      ],
      opex: [
        {
          id: 'mop_1',
          name: 'Plant Operations Manager & QC Supervisors',
          category: 'Salaries & Wages',
          annualCostY1: 95000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'mop_2',
          name: 'Industrial Facility Lease (22,000 sq ft)',
          category: 'Rent & Utilities',
          annualCostY1: 88000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'mop_3',
          name: '3-Phase Heavy Industrial Power & Gas Utility',
          category: 'Rent & Utilities',
          annualCostY1: 36000,
          annualEscalationRate: 4.5,
          isVariable: false,
        },
        {
          id: 'mop_4',
          name: 'Distributor Sales Commission & Logistics',
          category: 'Selling & Marketing',
          annualCostY1: 32000,
          annualEscalationRate: 5.0,
          isVariable: false,
        },
        {
          id: 'mop_5',
          name: 'Plant Machinery Preventive Maintenance & Tooling',
          category: 'Repairs & Maintenance',
          annualCostY1: 24000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'mop_6',
          name: 'Industrial Property & Environmental Liability Insurance',
          category: 'Insurance & Licenses',
          annualCostY1: 18000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
      ],
      capex: [
        {
          id: 'mcap_1',
          name: 'Automated 4-Station Pulp Thermoforming Production Line',
          category: 'Equipment & Machinery',
          acquisitionCost: 240000,
          usefulLifeYears: 10,
          salvageValue: 35000,
          purchaseYear: 0,
        },
        {
          id: 'mcap_2',
          name: 'Hydropulper, Refining System & Consistency Regulators',
          category: 'Equipment & Machinery',
          acquisitionCost: 75000,
          usefulLifeYears: 10,
          salvageValue: 10000,
          purchaseYear: 0,
        },
        {
          id: 'mcap_3',
          name: 'Custom CNC Aluminum Clamshell & Bowl Mold Tooling Sets',
          category: 'Equipment & Machinery',
          acquisitionCost: 45000,
          usefulLifeYears: 6,
          salvageValue: 4000,
          purchaseYear: 0,
        },
        {
          id: 'mcap_4',
          name: 'Electric Forklifts & High-Bay Pallet Racking',
          category: 'Vehicles & Logistics',
          acquisitionCost: 38000,
          usefulLifeYears: 8,
          salvageValue: 6000,
          purchaseYear: 0,
        },
        {
          id: 'mcap_5',
          name: 'Plant Electrical Substation & Compressed Air Piping',
          category: 'Leasehold Improvements',
          acquisitionCost: 42000,
          usefulLifeYears: 10,
          salvageValue: 0,
          purchaseYear: 0,
        },
      ],
      financing: {
        initialEquity: 260000,
        loanPrincipal: 210000,
        loanInterestRate: 7.25,
        loanTermYears: 5,
        gracePeriodYears: 0,
      },
    },
  },
  {
    id: 'healthcare_clinic',
    name: 'Specialized Physical Therapy & Wellness Clinic',
    category: 'Healthcare & Clinical Services',
    tagline: 'Outpatient musculoskeletal physical therapy and active sports medicine center.',
    data: {
      general: {
        projectName: 'Apex Sports Rehabilitation & Wellness',
        companyName: 'Apex Physical Therapy PLLC',
        industry: 'Healthcare / Physical Medicine',
        preparedBy: 'Healthcare Practice Financial Consult',
        currency: 'USD',
        currencySymbol: '$',
        startYear: 2026,
        projectionYears: 5,
        incomeTaxRate: 24,
        discountRate: 11,
        generalInflationRate: 3.2,
        projectDescription:
          'Establishment of an outpatient physical rehabilitation and physical medicine facility equipped with aquatic resistance training, dry needling, and sports injury recovery programs.',
      },
      policies: {
        accountsReceivableDays: 32, // Health insurance reimbursements & patient co-pays
        creditSalesPercent: 80,
        inventoryHoldingDays: 15, // Clinical tape, braces, hot/cold packs
        accountsPayableDays: 25,
        minimumCashBalance: 20000,
        dividendPayoutRatio: 20,
        depreciationMethod: 'straight_line',
      },
      products: [
        {
          id: 'pt_1',
          name: 'Initial Clinical Examination & Functional Movement Assessment',
          category: 'Evaluations',
          unit: 'Visits',
          initialSellingPrice: 220,
          annualPriceGrowth: 3.0,
          initialAnnualVolume: 1200,
          annualVolumeGrowth: 10.0,
          directMaterialPerUnit: 12, // diagnostic sheets, sanitization, consumables
          directLaborPerUnit: 65, // Doctor of Physical Therapy initial 60min
          overheadCostPerUnit: 14,
        },
        {
          id: 'pt_2',
          name: 'Subsequent Follow-Up Physical Therapy Session (45 min)',
          category: 'Therapy Sessions',
          unit: 'Visits',
          initialSellingPrice: 145,
          annualPriceGrowth: 3.5,
          initialAnnualVolume: 6400,
          annualVolumeGrowth: 12.0,
          directMaterialPerUnit: 8, // kinesiology tape, electrode pads, bands
          directLaborPerUnit: 42, // therapist session delivery
          overheadCostPerUnit: 10,
        },
        {
          id: 'pt_3',
          name: 'Aquatic Treadmill & Hydrotherapy Conditioning',
          category: 'Specialized Modalities',
          unit: 'Sessions',
          initialSellingPrice: 185,
          annualPriceGrowth: 4.0,
          initialAnnualVolume: 950,
          annualVolumeGrowth: 18.0,
          directMaterialPerUnit: 15, // pool chlorine, towels, sanitizers
          directLaborPerUnit: 48, // supervised aquatic trainer
          overheadCostPerUnit: 22, // pool heating, filtration
        },
      ],
      opex: [
        {
          id: 'ptop_1',
          name: 'Clinic Director & Certified PT Staff Base Compensation',
          category: 'Salaries & Wages',
          annualCostY1: 110000,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
        {
          id: 'ptop_2',
          name: 'Medical Office Suites Commercial Lease (3,200 sq ft)',
          category: 'Rent & Utilities',
          annualCostY1: 64000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'ptop_3',
          name: 'Physician Referral Outreach & Community Health Sponsorship',
          category: 'Selling & Marketing',
          annualCostY1: 22000,
          annualEscalationRate: 5.0,
          isVariable: false,
        },
        {
          id: 'ptop_4',
          name: 'Medical Malpractice & Commercial General Liability Insurance',
          category: 'Insurance & Licenses',
          annualCostY1: 16000,
          annualEscalationRate: 3.0,
          isVariable: false,
        },
        {
          id: 'ptop_5',
          name: 'EHR Practice Management, HIPAA & Insurance Billing SaaS',
          category: 'Administrative & General',
          annualCostY1: 12500,
          annualEscalationRate: 4.0,
          isVariable: false,
        },
      ],
      capex: [
        {
          id: 'ptcap_1',
          name: 'Underwater Treadmill & Modular Hydrotherapy Tank',
          category: 'Equipment & Machinery',
          acquisitionCost: 65000,
          usefulLifeYears: 8,
          salvageValue: 8000,
          purchaseYear: 0,
        },
        {
          id: 'ptcap_2',
          name: '6x High-Lo Electric Medical Treatment Plinths & Tables',
          category: 'Furniture & Fixtures',
          acquisitionCost: 26000,
          usefulLifeYears: 8,
          salvageValue: 2000,
          purchaseYear: 0,
        },
        {
          id: 'ptcap_3',
          name: 'Gym Rehab Functional Rig, Keiser Pneumatic Resistance & Weights',
          category: 'Equipment & Machinery',
          acquisitionCost: 34000,
          usefulLifeYears: 10,
          salvageValue: 4000,
          purchaseYear: 0,
        },
        {
          id: 'ptcap_4',
          name: 'Shockwave, Electrotherapy & Therapeutic Ultrasound Systems',
          category: 'Equipment & Machinery',
          acquisitionCost: 22000,
          usefulLifeYears: 6,
          salvageValue: 2500,
          purchaseYear: 0,
        },
        {
          id: 'ptcap_5',
          name: 'Medical Clinic Architectural Partitioning & Flooring',
          category: 'Leasehold Improvements',
          acquisitionCost: 45000,
          usefulLifeYears: 10,
          salvageValue: 0,
          purchaseYear: 0,
        },
      ],
      financing: {
        initialEquity: 125000,
        loanPrincipal: 85000,
        loanInterestRate: 7.5,
        loanTermYears: 5,
        gracePeriodYears: 0,
      },
    },
  },
];

export const INDUSTRY_TEMPLATES = TEMPLATES;
