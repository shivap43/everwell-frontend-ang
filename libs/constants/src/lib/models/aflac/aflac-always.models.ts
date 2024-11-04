import { EnrollmentMethod } from "../../enums";

export interface AflacAlwaysEnrollments {
    enrollmentId: number;
    planName: string;
    policyStatus: AflacAlwaysPolicyStatus;
    policyNumber: string;
    aflacAlwaysStatus: AflacAlwaysStatus;
    totalCost: number;
}

export enum AflacAlwaysPolicyStatus {
    ACTIVE = "Active",
    PENDING = "Pending",
}

export enum AflacAlwaysStatus {
    NOT_ENROLLED = "Not enrolled",
    ENROLLED = "Enrolled",
    PENDING_CARRIER_APPROVAL = "Pending carrier approval",
    PENDING_CUSTOMER_SIGNATURE = "Pending customer signature",
}

export interface AflacAlwaysEnrollmentsSelection {
    enrollmentIds: number[];
    enrollmentMethod: EnrollmentMethod;
    payFrequency: string;
    subscriberPaymentId: number;
    firstPaymentDay: number; // Range within 1..28
    signature: string;
}
