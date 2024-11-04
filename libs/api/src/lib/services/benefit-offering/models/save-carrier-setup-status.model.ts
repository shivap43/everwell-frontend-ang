import { CarrierFormSetupStatus } from "../enums/carrier-form-setup-status.enum";

export interface SaveCarrierSetupStatus {
    carrierFormId: number;
    status: CarrierFormSetupStatus;
    signature?: string;
    requestedChanges?: string;
    accountApprovalDate: string;
    approvedByAdminId: number;
    carrierSubmissionDate?: string;
    carrierResponseDate?: string;
}
