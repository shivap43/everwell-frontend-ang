import { AffectedPolicies } from "./affected-policies.model";

export interface ChangeBeneficiaryModel {
    policyNumbers: AffectedPolicies;
    effectiveDate: string;
    primaryBeneficiaries: any;
    type: string;
}
