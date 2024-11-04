import { ApprovalRequestStatus } from "../enums/approval-request-status.enum";
import { ApprovalItemAction, ApprovalItemObject } from "../enums";

export interface ApprovalRequest {
    id: number;
    status: ApprovalRequestStatus;
    requestedChanges: string;
    submittedDate: string;
    submittedProducerId: number;
    adminResponseDate?: string;
    respondingAdminId?: number;
    canceledDate: string;
    cancelingProducerId: number;
    approvalItems: Array<ApprovalItem>;
    hqAdminResponseDate?: string;
    respondingHqAdminId?: number;
    hrAdminResponseDate?: string;
    respondingHrAdminId?: number;
}

export interface ApprovalItem {
    action: ApprovalItemAction;
    object: ApprovalItemObject;
    objectId: number;
    objectName: string;
}
