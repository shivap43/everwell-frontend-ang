import { CoverageLevel, PlanOfferingPricing } from "@empowered/constants";
import { RiderState } from "../rider-state/rider-state.model";

export interface RiderStateWithBenefitAmount {
    riderState: RiderState;
    baseBenefitAmount?: number | null;
}

export interface RiderStateWithPlanPricings {
    riderState: RiderState;
    baseBenefitAmount?: number | null;
    pricingDatas: {
        riderPlanOfferingPricing: PlanOfferingPricing;
        baseCoverageLevel: CoverageLevel;
    }[];
}
