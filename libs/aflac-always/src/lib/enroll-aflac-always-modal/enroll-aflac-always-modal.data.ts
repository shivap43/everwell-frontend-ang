import { EligiblePolicy } from "./eligible.policy";

export interface EnrollAflacAlwaysModalData {
    eligiblePolicies: EligiblePolicy[];
    mpGroupId: number;
    memberId: number;
    productId: number;
}
