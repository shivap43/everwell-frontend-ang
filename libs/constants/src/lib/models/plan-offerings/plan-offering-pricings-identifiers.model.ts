export interface PlanOfferingPricingsIdentifiers {
    planOfferingId: number;
    memberId: number;
    mpGroup: number;
    includeFee: boolean;
    stateAbbreviation?: string | null;
    parentPlanId?: number | null;
    parentPlanCoverageLevelId?: number | null;
    baseBenefitAmount?: number | null;
    memberIsTobaccoUser?: boolean | null;
    spouseIsTobaccoUser?: boolean | null;
    coverageEffectiveDate?: string | null;
    riskClassId?: number | null;
    shoppingCartItemId?: number | null;
}
