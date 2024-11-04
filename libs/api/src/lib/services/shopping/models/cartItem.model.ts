export interface CoverageValidityCartItem {
    effectiveStarting: string;
    expiresAfter: string;
}

export interface RiderCartItem {
    planId?: number;
    benefitAmount?: number;
    coverageLevelId?: number;
    cartItemId?: number;
    planOfferingId?: number;
    memberCost?: number;
    totalCost?: number;
    baseRiderId?: number;
}

export interface RecentChangeCartItem {
    changeDate: string;
    previousCost: number;
}

export interface CartItem {
    id: number;
    planOfferingId: number;
    memberCost: number;
    totalCost: number;
    coverageLevelId: number;
    coverageValidity: CoverageValidityCartItem;
    benefitAmount: number;
    enrollmentState: string;
    enrollmentMethod: string;
    assistingAdminId: number;
    riders: RiderCartItem[];
    applicationId: number;
    lastAnsweredId: number;
    status: "TODO" | "IN_PROGRESS" | "COMPLETE";
    requiresSignature: boolean;
    acknowledged: boolean;
    recentChange: RecentChangeCartItem;
    coverageEffectiveDate?: string;
    riskClassOverrideId?: number;
    subscriberQualifyingEventId?: number;
}
