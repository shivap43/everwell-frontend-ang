import { EbsPaymentOnFileEnum, EnrollmentMethod } from "../enums";
import { RiderCart } from "./rider-cart.model";

export interface AddCartItem {
    planOfferingId: number;
    memberCost: number;
    totalCost: number;
    coverageLevelId?: number;
    benefitAmount?: number;
    enrollmentState?: string;
    enrollmentMethod?: EnrollmentMethod;
    assistingAdminId?: number;
    riders?: RiderCart[];
    acknowledged?: boolean;
    recentChange?: any;
    enrollmentCity?: string;
    parentCartItemId?: number;
    applicationType?: "NEW" | "CONVERSION" | "REINSTATEMENT" | "DOWNGRADE" | "ADDITION";
    status?: "TODO" | "IN_PROGRESS" | "COMPLETE";
    riskClassOverrideId?: number;
    coverageEffectiveDate?: string;
    displayOrder?: number;
    subscriberQualifyingEventId?: number;
    baseRiderId?: number;
    dependentAge?: number;
    documentId?: number;
    ebsPaymentOnFile?: EbsPaymentOnFileEnum;
    enrollmentId?: number;
}
