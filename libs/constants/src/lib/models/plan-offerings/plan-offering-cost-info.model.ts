import { PlanOfferingPricingCoverage } from "./plan-offering-pricing-coverage.model";

export interface PlanOfferingCostInfo {
    planOfferingPricingCoverage?: PlanOfferingPricingCoverage;
    subscriberQualifyingEventId?: number | null;
    selectedBenefitAmount?: number | null;
}
