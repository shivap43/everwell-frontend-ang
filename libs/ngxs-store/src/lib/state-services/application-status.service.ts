import { Injectable } from "@angular/core";
import { EnrollmentStatus, EnrollmentStatusType, PendingEnrollmentReason } from "@empowered/api";
import { Enrollments } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Injectable({
    providedIn: "root",
})
export class ApplicationStatusService {
    constructor(private readonly dateService: DateService) {}
    /**
     * To replace the enrollment status with the application status(displayed in the front-end)
     * @param enrollment - Enrollment for a plan
     * @param isAudit - indicates whether used from audit or not
     * @returns {string} - Application status based on the enrollment status
     */
    convert(enrollment: Enrollments, isAudit: boolean = false): string | undefined {
        const expireDate = this.getDateFormat(enrollment.validity.expiresAfter);
        const startDate = this.getDateFormat(enrollment.validity.effectiveStarting);
        const currentDate = this.getDateFormat(new Date());
        let langStatus = "";
        switch (enrollment.status) {
            case EnrollmentStatusType.APPROVED:
                langStatus = this.getApprovedStatus(enrollment, expireDate, currentDate, isAudit);
                break;
            case EnrollmentStatusType.PENDING:
                langStatus = this.getPendingStatus(enrollment, isAudit);
                break;
            case EnrollmentStatusType.DENIED:
                langStatus = "primary.portal.coverage.Applicationdenied";
                break;
            case EnrollmentStatusType.TERMINATED:
            case EnrollmentStatus.lapsed:
                if (enrollment.reinstatement === "MANDATORY" || enrollment.reinstatement === "OPTIONAL") {
                    langStatus = "primary.portal.coverage.Lapsed";
                } else {
                    langStatus = "primary.portal.coverage.Ended";
                }
                break;
            case EnrollmentStatusType.CANCELLED:
                if (startDate >= expireDate) {
                    langStatus = "primary.portal.editCoverage.withdrawn";
                } else {
                    langStatus = "primary.portal.coverage.Ended";
                }
                break;
            default:
                return undefined;
        }
        return langStatus;
    }
    /**
     * gets language key for approved status
     * @param enrollment enrollment data
     * @param expireDate expiry date of enrollment
     * @param currentDate current date
     * @param isAudit indicates whether called from audit or not
     * @returns language key string
     */
    getApprovedStatus(enrollment: Enrollments, expireDate: Date, currentDate: Date, isAudit: boolean): string {
        let langStatus = "";
        if (enrollment.coverageLevel.id === 2) {
            langStatus = "primary.portal.coverage.declined";
        } else if (!enrollment.validity.expiresAfter || expireDate >= currentDate || isAudit) {
            if (
                enrollment.pendingReason &&
                (enrollment.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE ||
                    enrollment.pendingReason === PendingEnrollmentReason.PDA_COMPLETION)
            ) {
                if (
                    (enrollment.subscriberApprovalRequiredByDate && this.isPastDate(enrollment.subscriberApprovalRequiredByDate)) ||
                    !enrollment.subscriberApprovalRequiredByDate ||
                    isAudit
                ) {
                    if (enrollment.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE) {
                        langStatus = "primary.portal.coverage.Pendingcustomersignature";
                    } else {
                        langStatus = "primary.portal.coverage.PendingPDAcompletion";
                    }
                } else {
                    langStatus = "primary.portal.editCoverage.void";
                }
            } else {
                langStatus = "primary.portal.coverage.approved";
            }
        } else {
            langStatus = "primary.portal.coverage.Ended";
        }
        return langStatus;
    }
    /**
     * gets language key for pending status
     * @param enrollment enrollment data
     * @param isAudit indicates whether called from audit or not
     * @returns language key string
     */
    getPendingStatus(enrollment: Enrollments, isAudit: boolean): string {
        let langStatus = "";
        switch (enrollment.pendingReason) {
            case PendingEnrollmentReason.CARRIER_APPROVAL:
                langStatus = "primary.portal.coverage.Pendingcarrierapproval";
                break;
            case PendingEnrollmentReason.ADMIN_APPROVAL:
                langStatus = "primary.portal.coverage.pendingadminapproval";
                break;
            case PendingEnrollmentReason.CUSTOMER_SIGNATURE:
                if (
                    (enrollment.subscriberApprovalRequiredByDate && this.isPastDate(enrollment.subscriberApprovalRequiredByDate)) ||
                    !enrollment.subscriberApprovalRequiredByDate ||
                    isAudit
                ) {
                    langStatus = "primary.portal.coverage.Pendingcustomersignature";
                } else {
                    langStatus = "primary.portal.editCoverage.void";
                }
                break;
            case PendingEnrollmentReason.PDA_COMPLETION:
                if (
                    (enrollment.subscriberApprovalRequiredByDate && this.isPastDate(enrollment.subscriberApprovalRequiredByDate)) ||
                    !enrollment.subscriberApprovalRequiredByDate ||
                    isAudit
                ) {
                    langStatus = "primary.portal.coverage.PendingPDAcompletion";
                } else {
                    langStatus = "primary.portal.editCoverage.void";
                }
                break;
            case PendingEnrollmentReason.THIRD_PARTY_APPROVAL:
                langStatus = "primary.portal.coverage.Pending3rdpartyapproval";
                break;
            default:
                langStatus = "primary.portal.coverage.pendingadminapproval";
        }
        return langStatus;
    }

    /**
     * Method to get formatted date
     * @param date : date to be converted to formatted date
     * @returns {Date} : Formatted date
     */
    getDateFormat(date: Date | string | undefined): Date {
        const dateFormat = this.dateService.toDate(date).setHours(0, 0, 0, 0);
        return this.dateService.toDate(dateFormat);
    }

    isPastDate(dateToCheck: string): boolean {
        let retValue = false;
        const date: Date = new Date();
        const inputDate = this.dateService.toDate(dateToCheck);
        date.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate >= date) {
            retValue = true;
        }
        return retValue;
    }
}
