export interface TransferToDirectModel {
    currentAccountName: string;
    billingType: string;
    billingMode: string;
    deductionDatePerPeriod: string;
    documentIds: string[];
    transferEffectiveDate: string;
    accountSignature: string;
    policyHolderSignature: string;
    type?: string;
    repToken?: string;
    tempusTokenIdentityGuid?: string;
    lastFour?: string;
    tempusPostalCode?: string;
}
