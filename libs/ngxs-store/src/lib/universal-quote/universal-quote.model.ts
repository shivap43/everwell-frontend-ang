import { ProductDetail, PlanDetailsBase } from "@empowered/api";
import { PayFrequency, RiskClass, CountryState, Product } from "@empowered/constants";

export interface UniversalStateModel {
    product: ProductDetail[];
    adminPreference?: AdminPreference[];
    levelSettings: SettingsData;
    configurations: RestictedConfigurations[];
    allowedChannel: string[];
    gender: string[];
    quoteSetting: QuoteSettingsSchema;
}

export interface Plan {
    adminName: string;
    // stores the selections made from benefit amount dropdown
    benefitAmountOptions?: number[];
    carrierId: number;
    characteristics?: string[];
    dependentPlanIds?: number[];
    dependentPlans?: Plan[];
    description: string;
    id: number;
    mutuallyExclusivePlanIds?: number[];
    name: string;
    policyOwnershipType?: string;
    pricingModel?: string;
    coverageLevels?: any[];
    eliminationPeriodName?: string;
    itemId?: number;
    planDetails?: PlanDetailsBase;
    planPriceSelection?: number[];
    // Denotes whether the plan is selected to be included in the Quick Quote rate sheet.
    rateSheetSelection?: boolean;
    policySeries?: string;
    pricing?: any;
    pricingEditable?: boolean;
    product?: Product;
    productId?: number;
    riders?: any;
    sunsetDate?: string;
    vasFunding?: string;
    selectedEliminationPeriod?: number[];
    // stores price selections for multiple dependent ages/elimination periods
    multiplePlanPriceSelections?: Record<number, number[]>;
}

export interface AdminPreference {
    name: string;
    value: string;
}

export interface SettingsData {
    states: CountryState[];
    payFrequency: PayFrequency[];
    riskClasses: RiskClass[];
}

export interface RestictedConfigurations {
    channel: string;
    allowedRiskValues: string[];
    allowedPayFrequency: string[];
}

export interface QuoteSettingsSchema {
    state?: string;
    channel?: string;
    payFrequency?: string;
    riskClass?: string;
    age?: number;
    gender?: string;
    sicCode?: number;
    zipCode?: string;
    tobaccoUser?: boolean;
    spouseAge?: number;
    spouseGender?: string;
    spouseTobaccoUser?: boolean;
    numberDependentsExcludingSpouse?: number;
    eligibleSubscribers?: number;
    salarySelection?: string;
    annualSalary?: number;
    hourlyRate?: number;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    hourlyAnnually?: number;
}

export interface BenefitCoverageSelectionModel {
    planId?: string;
    benefitAmounts?: number[];
    childAges?: number[];
    coverageLevelIds?: number[];
}

export interface CoverageLevelModel {
    displayOrder?: number;
    iconLocation?: string;
    id?: number;
    name?: string;
}
