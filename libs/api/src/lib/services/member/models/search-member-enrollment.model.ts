import { Validity, CoverageLevel, Plan, GuaranteedIssue, PaymentType } from "@empowered/constants";

export interface PaymentInformation {
    paymentType: PaymentType;
    lastFour: string;
}

export interface SearchMemberEnrollment {
    id: number;
    type: string;
    planId?: number;
    planOfferingId: number;
    riderOfEnrollmentId?: number;
    state: string;
    city?: string;
    status: string;
    carrierStatus?: string;
    memberCost: number;
    memberCostPerPayPeriod?: number;
    totalCost: number;
    totalCostPerPayPeriod?: number;
    paymentInformation?: PaymentInformation;
    benefitAmount: number;
    guaranteedIssue?: GuaranteedIssue;
    validity: Validity;
    createDate: string;
    taxStatus: string;
    tobaccoStatus: string;
    salaryMultiplier?: number;
    policyNumber?: string;
    reinstatement?: string;
    reinstatementPeriodEndDate?: string;
    reinstatementEndDate?: string;
    coverageLevelId?: number;
    coverageLevel: CoverageLevel;
    plan: Plan;
}
