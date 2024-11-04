import { CoverageLevel, Plan } from "@empowered/constants";

export interface ProductDetail {
    productName?: string;
    productId?: number;
    plans?: Plan[];
    pricing?: Pricing;
}

export interface Pricing {
    benefitAmountInfo: BenefitAmountInfo;
    coverageLevelPricing: CoverageLevelPricing[];
    riders: QuickQuoteRider[];
}

export interface BenefitAmountInfo {
    benefitIncrement?: number;
    defaultBenefitAmount?: number;
    matchBasePlan?: boolean;
    maxBenefitAmount?: number;
    minBenefitAmount?: number;
    readOnly?: boolean;
    restrictedBenefitAmounts?: number[];
}

export interface CoverageLevelPricing {
    coverageLevel: CoverageLevel;
    price: number;
    benefitAmount?: number;
    eliminationPeriod: boolean;
    missingInfo?: string[];
    errorInfo?: string[];
    childAge?: number;
}

export interface QuickQuoteRider {
    benefitAmountInfos: BenefitAmountInfo[];
    coverageLevelPricing: CoverageLevelPricing[];
    plan: Plan;
}

export interface BenefitsCoverageSelection {
    benefitAmount: number;
    childAge?: number;
    coverageLevelIds: number[];
    planId: number;
}
