import { Injectable } from "@angular/core";
import { ApplicationStatusTypes, EnrollmentStatusType, PendingEnrollmentReason, ReinstatementType } from "@empowered/api";
import { Characteristics, Enrollments } from "@empowered/constants";
import { checkIfAfter, checkIfBefore, checkIfEqual, isAfterOrEqual, toDateObj } from "../dates/dates.service";
import { DateService } from "@empowered/date";

/**
 * return the approved status
 * @param enrollment enrollment data
 * @param expireDate expiry date of enrollment
 * @returns approved status
 */
function getApprovedStatus(enrollment: Enrollments, expireDate: Date): ApplicationStatusTypes {
    const dateService = new DateService();
    // TODO: Remove redundant passing of expireDate to date constructor when moment-date-adapter is replaced
    expireDate = dateService.toDate(expireDate);
    // set hours to 0 as only date is required for comparison
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    // If enrollment plan has declined characteristics then the status will be declined
    if (enrollment.plan.characteristics?.includes(Characteristics.DECLINE)) {
        return ApplicationStatusTypes.Declined;
    }

    // If enrollment validity is not expire or it not in past then return the reason of pending status else it would be approved status
    if (!enrollment.validity.expiresAfter || isAfterOrEqual(expireDate, currentDate)) {
        // If pending reason would be PDA or Signature then based on approval date of member status
        // will be returned accordingly else it would be void
        if (
            enrollment.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE ||
            enrollment.pendingReason === PendingEnrollmentReason.PDA_COMPLETION
        ) {
            if (
                !enrollment.subscriberApprovalRequiredByDate ||
                checkIfBefore(toDateObj(enrollment.subscriberApprovalRequiredByDate), Date.now())
            ) {
                return enrollment.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE
                    ? ApplicationStatusTypes.Pending_customer_signature
                    : ApplicationStatusTypes.Pending_PDA_completion;
            }
            return ApplicationStatusTypes.Void;
        }
        return ApplicationStatusTypes.Approved;
    }
    return ApplicationStatusTypes.Ended;
}

/**
 * gets pending status
 * @param enrollment enrollment data
 * @returns pending status
 */
function getPendingStatus(enrollment: Enrollments): ApplicationStatusTypes {
    switch (enrollment.pendingReason) {
        // waiting for carrier approval
        case PendingEnrollmentReason.CARRIER_APPROVAL:
            return ApplicationStatusTypes.Pending_carrier_approval;

        // waiting from Admin for approval
        case PendingEnrollmentReason.ADMIN_APPROVAL:
            return ApplicationStatusTypes.Pending_admin_approval;

        // waiting for the approval from customer side for signature
        case PendingEnrollmentReason.CUSTOMER_SIGNATURE:
            return (enrollment.subscriberApprovalRequiredByDate &&
                checkIfBefore(toDateObj(enrollment.subscriberApprovalRequiredByDate), Date.now())) ||
                !enrollment.subscriberApprovalRequiredByDate
                ? ApplicationStatusTypes.Pending_customer_signature
                : ApplicationStatusTypes.Void;

        // waiting for the completion of PDA document
        case PendingEnrollmentReason.PDA_COMPLETION:
            return (enrollment.subscriberApprovalRequiredByDate &&
                checkIfBefore(toDateObj(enrollment.subscriberApprovalRequiredByDate), Date.now())) ||
                !enrollment.subscriberApprovalRequiredByDate
                ? ApplicationStatusTypes.Pending_PDA_completion
                : ApplicationStatusTypes.Void;

        // waiting for the third party approval for the enrolled plan
        case PendingEnrollmentReason.THIRD_PARTY_APPROVAL:
            return ApplicationStatusTypes.Pending_3rd_party_approval;
        default:
            return ApplicationStatusTypes.Pending_admin_approval;
    }
}

/**
 * Function to return the status based on enrollment dates
 * @param enrollment or null enrollment object for specific product
 * @returns status of enrollment
 */
function transformApplicationStatus(enrollment: Enrollments | null): ApplicationStatusTypes {
    const expireDate = toDateObj(enrollment?.validity.expiresAfter);
    switch (enrollment?.status) {
        case EnrollmentStatusType.APPROVED:
            // If the the enrollment status is approved then get the exact approval status
            return getApprovedStatus(enrollment, expireDate);

        case EnrollmentStatusType.PENDING:
            // If the the enrollment status is pending then get the exact reason of the pending status
            return getPendingStatus(enrollment);

        case EnrollmentStatusType.DENIED:
            return ApplicationStatusTypes.Application_denied;

        // if the enrollment status is terminated or lapsed then get the status whether it can be reinstate or not
        case EnrollmentStatusType.TERMINATED:
        case ApplicationStatusTypes.Lapsed:
            return enrollment.reinstatement === ReinstatementType.MANDATORY || enrollment.reinstatement === ReinstatementType.OPTIONAL
                ? ApplicationStatusTypes.Lapsed
                : ApplicationStatusTypes.Ended;

        // if the enrollment status is cancelled then get the status whether it ended or void
        case EnrollmentStatusType.CANCELLED:
            return isAfterOrEqual(toDateObj(enrollment.validity.effectiveStarting), expireDate)
                ? ApplicationStatusTypes.Void
                : ApplicationStatusTypes.Ended;

        default:
            return ApplicationStatusTypes.Pending;
    }
}

/**
 * Function to return the enrollment status
 * @param enrollment or null enrollment object for specific product
 * @returns status of enrollment
 */
export function getEnrollmentStatus(enrollment: Enrollments | null): ApplicationStatusTypes {
    let status = transformApplicationStatus(enrollment);
    if (
        (status === ApplicationStatusTypes.Approved ||
            status === ApplicationStatusTypes.Lapsed ||
            status.startsWith(ApplicationStatusTypes.Pending)) &&
        (status === ApplicationStatusTypes.Approved || status.startsWith(ApplicationStatusTypes.Pending))
    ) {
        status =
            checkIfAfter(toDateObj(enrollment?.validity.effectiveStarting), Date.now()) || status.startsWith(ApplicationStatusTypes.Pending)
                ? ApplicationStatusTypes.Enrolled
                : ApplicationStatusTypes.Active;
    }
    return status;
}

@Injectable({
    providedIn: "root",
})
export class EnrollmentHelperService {
    constructor() {}

    /**
     * Function to return the enrollment status
     * @param enrollment enrollment object for specific product
     * @returns status of enrollment
     */
    getEnrollmentStatus(enrollment: Enrollments): ApplicationStatusTypes {
        return getEnrollmentStatus(enrollment);
    }
}
