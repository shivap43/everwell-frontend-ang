import { AllowedState } from "./allowed-state.model";
import { Eligibility } from "./eligibility.enum";

export interface PlansEligibility {
    planId: number;
    eligibility: Eligibility;
    inEligibleReason?: string;
    allowedStates: AllowedState[];
}
