import { TaxStatus } from "../enums";
import { CoverageLevel, Plan } from "./api";
import { CurrentEnrollment } from "./current-enrollment.model";
import { EbsPaymentFile } from "./ebs-payment-model";
import { EnrollmentBeneficiary } from "./enrollment-beneficiary.model";
import { EnrollmentDependent } from "./enrollment-dependent.model";
import { EnrollmentRider } from "./enrollment-rider.model";
import { CoverageValidity } from "./getCartItems.model";
import { GuaranteedIssue } from "./guaranteedIssue.model";
import { PendingCategory } from "./pending-category.model";
import { Validity } from "./validity.model";

export interface Enrollments {
    id: number;
    planId: number;
    plan: Plan;
    coverageLevelId: number;
    coverageLevel: CoverageLevel;
    status: string;
    carrierStatus: string;
    memberCost: number;
    memberCostPerPayPeriod: number;
    totalCost: number;
    totalCostPerPayPeriod: number;
    benefitAmount: number;
    guaranteedIssue: GuaranteedIssue;
    validity: Validity;
    createDate: Date | string;
    dependents: CoverageValidity;
    taxStatus: TaxStatus;
    tobaccoStatus: string;
    salaryMultiplier: number;
    policyNumber: string;
    reinstatement: string;
    approvedDate: string;
    approvedAdminId: number;
    enrolledDependents?: EnrollmentDependent[];
    riders?: EnrollmentRider[];
    beneficiaries?: EnrollmentBeneficiary[];
    pendingCategory?: PendingCategory;
    changeEffectiveStarting?: string;
    qualifyingEventId?: number;
    currentEnrollment?: CurrentEnrollment;
    planOfferingId?: number;
    pendingReason?: string;
    state?: string;
    subscriberApprovalRequiredByDate?: string;
    riderOfEnrollmentId?: number;
    CoverageLevelId?: number;
    feedSentDate?: Date | string;
    member?: MemberEnrollments;
    reinstatementPeriodEndDate?: string;
    reinstatementEndDate?: string;
    displayCoveredIndividuals?: boolean;
    displayQuestionHistory?: boolean;
    type?: string;
    coverageDate?: Date | string;
    coverageText?: string;
    ebsPaymentOnFile?: EbsPaymentFile;
}

export interface MemberEnrollments {
    id: number;
    name: string;
}
