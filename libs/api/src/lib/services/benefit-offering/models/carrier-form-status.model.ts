import { CarrierFormSetupStatus } from "../enums/carrier-form-setup-status.enum";
export interface CarrierFormStatus {
    id?: number;
    carrierId?: number;
    carrierName?: string;
    carrierFormId?: number;
    carrierFormName?: string;
    initialCompletionDate?: string;
    accountApprovalDate?: string;
    approvedBy?: {
        accountAdminId: number;
        name: string;
    };
    carrierSubmissionDate?: string;
    carrierResponseDate?: string;
    status?: CarrierFormSetupStatus;
}
