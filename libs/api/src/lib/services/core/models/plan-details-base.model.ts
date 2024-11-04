import { PlanDetails } from "./plan-details.model";
import { Validity } from "@empowered/constants";

export interface PlanDetailsBase {
    planDetailItems?: PlanDetails[];
    minAge?: number;
    maxAge?: number;
    validity?: Validity;
    minEligibleSubscribers?: number;
    maxEligibleSubscribers?: number;
    lowestBasePremium?: number;
}
