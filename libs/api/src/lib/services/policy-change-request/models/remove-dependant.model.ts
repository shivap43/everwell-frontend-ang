import { BillingName } from "./billing-name.model";

export interface RemoveDependantModel {
    policyNumbers: string[];
    dependentId: string;
    reasonForRemoval: string;
    effectiveDate: string;
    newCoverageLevelId: string;
    billingName: BillingName;
    otherDependentName?: BillingName;
    otherDependentAddress?: any;
    documentIds: string[];
}
