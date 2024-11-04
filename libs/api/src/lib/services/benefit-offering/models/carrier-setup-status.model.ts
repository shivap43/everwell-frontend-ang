import { CarrierFormSetupStatus } from "../enums/carrier-form-setup-status.enum";
import { Validity } from "@empowered/constants";

export interface CarrierSetupStatus {
    id?: number;
    carrierId?: number;
    carrierName?: string;
    carrierFormId?: number;
    initialCompletionDate?: string;
    accountApprovalDate?: string;
    approvedBy?: {
        accountAdminId?: number;
        name?: string;
    };
    carrierSubmissionDate?: string;
    accountSubmissionDate?: string;
    carrierResponseDate?: string;
    status?: CarrierFormSetupStatus | CarrierSetupStatusExtended;
    validity?: Validity;
}
export interface CarrierSetupStatusExtended extends CarrierSetupStatus {
    _accountApprovalStatus: string;
    _carrierApprovalStatus: string;
    _dateCompleted: Date;
    _accountSubmissionDate: Date;
    _accountApprovalDate: Date;
    _carrierSubmissionDate: Date;
    _carrierApprovalDate: Date;
}
