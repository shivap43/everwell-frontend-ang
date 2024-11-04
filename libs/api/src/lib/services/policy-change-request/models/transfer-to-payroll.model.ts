import { BillingName } from "./billing-name.model";

export interface TransferToPayrollModel {
    currentAccountName: string;
    currentAccountNumber: string;
    newAccountName: string;
    newAccountNumber: string;
    departmentNumber?: string;
    employeeNumber: string;
    billingName: BillingName;
    supportingDocuments: number[];
    effectiveDate: string;
    policyNumbers: number[];
    type: string;
}
