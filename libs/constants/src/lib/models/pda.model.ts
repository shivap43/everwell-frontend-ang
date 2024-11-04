export interface PdaData {
    pinDetails?: { pin: number };
    isEditPda?: boolean;
    formId?: number;
    mpGroupId?: number;
    memberId?: string;
    producerId?: number;
    isDocument?: boolean;
    state?: string;
    enrollmentType?: string;
    isOwnAccount?: boolean;
    openedFrom?: string;
}
