import { ProducerEnrollment, MemberEnrollment, CommissionSplit } from "../models";
import { BUSINESS_ENROLLMENT_FEED_STATUS, TRANSMITTAL_SCHEDULE, BusinessEnrollmentApplicationStatus } from "../enums";

export interface BusinessEnrollments {
    enrollmentId?: number;
    productName?: string;
    annualPremium?: number;
    enrollmentDate?: string;
    commissionSplitId?: number;
    commissionSplit?: CommissionSplit;
    enrollmentComment?: string;
    transmittalSchedule?: TRANSMITTAL_SCHEDULE;
    producer?: ProducerEnrollment;
    member?: MemberEnrollment;
    sentDate?: string;
    createDate?: string;
    coverageStartDate?: string;
    customPdfSignedDate?: Date;
    coverageDate?: string;
    feedStatus?: BUSINESS_ENROLLMENT_FEED_STATUS;
    state?: string;
    applicationStatus?: BusinessEnrollmentApplicationStatus;
    carrierId?: number;
}

export interface FilterObject {
    filter: string;
    selectedFilter: string;
}
