export interface MemberIdentifierType {
    id: number;
    type: string;
    name: string;
    validationRegex: string;
    memberEligible: boolean;
    dependentEligible: boolean;
}

export enum MemberIdentifierTypeTypes {
    CIF_NUMBER = "CUSTOMER_INFORMATION_FILE_NUMBER",
    AFLAC_GUID = "AFLAC_GUID",
}
