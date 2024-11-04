import { CoverageLevelNames } from "../../enums";
import { CoverageLevel } from "../api/plan.model";
import { PlanOfferingPricing } from "../planOfferingPricing.model";

export interface PlanOfferingPricingCoverage {
    planOfferingPricing: PlanOfferingPricing | null;
    coverageLevel: CoverageLevelWithDisplayName;
}

export interface CoverageLevelWithDisplayName extends CoverageLevel {
    displayName: CoverageLevelNames;
}
