import { AffectedPolicies } from "./affected-policies.model";
import { Address } from "@empowered/constants";

export interface FindPolicyholderModel {
    groupId?: number;
    memberId?: number;
    memberFirstName: string;
    memberLastName: string;
    cifNumber: string;
    memberAddress: Address;
    policies: AffectedPolicies[];
    allowedForms: string[];
    riderPolicies?: AffectedPolicies[];
}
