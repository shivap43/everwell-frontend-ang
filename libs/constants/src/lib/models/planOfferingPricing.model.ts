export interface PlanOfferingPricing {
    coverageLevelId: number;
    carrierRiskClassId?: number;
    benefitAmount: number;
    memberCost: number;
    totalCost: number;
    // NOTE: maxAge and minAge is not in release branch.
    maxAge?: number;
    minAge?: number;
}
