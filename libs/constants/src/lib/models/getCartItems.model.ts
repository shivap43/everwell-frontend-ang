import { EnrollmentMethod } from "../enums";
import { PlanOffering } from "./planOffering.model";
import { RiderCart } from "./rider-cart.model";

export interface CoverageValidity {
    effectiveStarting: string;
    expiresAfter: string;
}

export interface RecentChange {
    changeDate: string;
    previousCost: number;
}

export interface GetCartItems {
    id: number;
    /**
     * @deprecated This property doesn't come from the actual endpoint response. Use property planOffering instead
     */
    planOfferingId: number;
    memberCost: number;
    totalCost: number;
    coverageLevelId: number;
    coverageValidity: CoverageValidity;
    benefitAmount: number;
    enrollmentState: string;
    enrollmentCity?: string;
    enrollmentMethod: EnrollmentMethod;
    assistingAdminId: number;
    riders: RiderCart[];
    applicationId: number;
    lastAnsweredId: number;
    status: "TODO" | "IN_PROGRESS" | "COMPLETE";
    requiresSignature: boolean;
    acknowledged: boolean;
    recentChange: RecentChange;
    cartItemId?: number;
    parentCartItemId?: number;
    enrollmentId?: number;
    riskClassOverrideId?: number;
    applicationType?: "NEW" | "CONVERSION" | "REINSTATEMENT" | "DOWNGRADE" | "ADDITION";
    coverageEffectiveDate?: string;
    subscriberQualifyingEventId?: number;
    planOffering?: PlanOffering;
    dependentAge?: number;
}
