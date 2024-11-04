import { RiderCart, CoverageLevel, RecentChange, PlanFlexDollarOrIncentives } from "@empowered/constants";

interface RiderNameCost {
    name: string;
    cost: number;
}
export interface CartItemView {
    id?: number;
    planName?: string;
    coverageLevelId?: number;
    coverageLevelName?: string;
    riderBenefitAmount?: string;
    coverageDateStarts?: string;
    coverageDateEnds?: string;
    benefitAmount?: number;
    memberCost?: number;
    totalCost?: number;
    employersContribution?: number;
    planId?: number;
    planOfferingId?: number;
    productId?: number;
    productOfferingId?: number;
    recentChange?: RecentChange;
    companyProvidedPlan?: boolean;
    taxStatus?: string;
    riders?: RiderCart[];
    riderName?: string[];
    productName?: string;
    baseCost?: string;
    displayOrder?: number;
    flexDollars?: PlanFlexDollarOrIncentives[];
    coverageLevels?: CoverageLevel[];
    productImagePath?: string;
    riderNameCost?: RiderNameCost[];
    carrierId?: number;
}
