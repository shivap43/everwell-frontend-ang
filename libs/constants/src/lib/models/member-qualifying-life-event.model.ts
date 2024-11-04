import { StatusType } from "../enums";
import { Document } from "./document.model";
import { QLEProductCoverageStart } from "./qle-product-coverage-start.model";
import { QualifyingEventType } from "./qualifying-event-type.model";
import { Validity } from "./validity.model";

export interface MemberQualifyingEvent {
    createdBy: string;
    id?: number;
    typeId: QualifyingEventType["id"];
    type?: QualifyingEventType;
    eventDate: Date | string;
    enrollmentValidity: Validity;
    readonly createDate: Date | string;
    memberComment: string;
    adminComment: string;
    coverageStartDates: QLEProductCoverageStart[];
    status: StatusType;
    documentIds?: number[];
    documents?: Document[];
    typeCode?: string;
    requestedCoverageEndDate: string;
    endPlanRequestStatus?: string;
    createMethod?: string;
}

export interface MemberQualifyingEventApprove extends MemberQualifyingEvent {
    daysToReport: number;
    enrollmentId: number;
    isApprovedEnrollment: boolean;
    isNoEnrollment: boolean;
    isPending: boolean;
    isStatusInprogress: boolean;
    isStatusViewDetails: boolean;
    isStatusViewPendingEnrollments: boolean;
    isStatusViewPendingCoverage: boolean;
    memberId: number;
    acceptableFormats: string;
}
