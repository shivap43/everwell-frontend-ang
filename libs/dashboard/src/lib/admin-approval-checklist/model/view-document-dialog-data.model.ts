import { AccountCarrier } from "@empowered/constants";

export interface ViewDocumentDialogData {
    viewOnly: boolean;
    signatureRequired: boolean;
    signingAdmin?: string;
    dateSigned?: string;
    approvedByAdminId?: number;
    carrier: AccountCarrier;
    mpGroup: number;
    isQ60: boolean;
    isVAS: boolean;
    vasContentTag: string;
    formId: number;
    planName: string;
    carrierFormNames: string[];
    documentViewed: boolean;
}
