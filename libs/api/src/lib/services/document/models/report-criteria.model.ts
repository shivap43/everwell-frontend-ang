import { EmploymentStatus } from "../../member/enums/employment-status.enum";
import { EnrollmentReportStatus } from "../../member/enums/enrollment-report-status.enum";
import { Validity } from "@empowered/constants";

export interface ReportCriteriaBase {
    description?: string;
}

export interface DemographicsReportCriteria extends ReportCriteriaBase {
    type: "DEMOGRAPHICS";
    /**
     * if account has visible classes, then at least 1 classId is required
     */
    classIds?: number[];
    /**
     * A list of state abbreviations
     */
    statesOfResidence: string[];
    employmentStatuses: EmploymentStatus[];
    viewedStatuses: ViewedStatus[];
    recordsChangedValidity?: Validity;
}

export interface EnrollmentReportCriteria extends ReportCriteriaBase {
    type: "ENROLLMENT";
    enrollmentStatus?: CommissionsEnrollmentStatus;

    carrierIds: number[];
    /**
     * if account has visible classes, then at least 1 classId is required
     */
    classIds?: number[];
    /**
     * A list of state abbreviations
     */
    statesOfResidence: string[];
    employmentStatuses?: EmploymentStatus[];
    status: EnrollmentReportStatus[];
    enrollmentChangedValidity?: Validity;
    enrollmentCoverageValidity?: Validity;
}

export interface PayrollReportCriteria extends ReportCriteriaBase {
    type: "DEDUCTIONS";
    carrierIds: number[];
    /**
     * if account has visible classes, then at least 1 classId is required
     */
    classIds?: number[];
    /**
     * A list of state abbreviations
     */
    statesOfResidence: string[];
    employmentStatuses: EmploymentStatus[];
    asOfDate: Date | string;
}

export interface PdaReportCriteria extends ReportCriteriaBase {
    type: "PDA";
    formCompletionStatuses: FormCompletionStatus[];
    viewedStatuses: ViewedStatus[];
    asOfDate: Date | string;
}

export interface CommissionsReportCrieria extends ReportCriteriaBase {
    type: "COMMISSIONS";
    enrollmentStatus?: CommissionsEnrollmentStatus;
    /**
     * if signedDateValidity is provided, then both dates in the Validity object are required
     */
    signedDateValidity?: Validity;
}

export type ViewedStatus = "VIEWED" | "NOT_VIEWED";
export type FormCompletionStatus = "COMPLETE" | "INCOMPLETE";
export type CommissionsEnrollmentStatus = "SENT" | "UNSENT" | "ALL";

export type ReportCriteria =
    | DemographicsReportCriteria
    | EnrollmentReportCriteria
    | PayrollReportCriteria
    | PdaReportCriteria
    | CommissionsReportCrieria;
