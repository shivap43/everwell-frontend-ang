import { DependencyType } from "../enums";
import { CoverageLevel } from "./api";

export type benefitAmountModifier = "LESS_THAN" | "LESS_THAN_EQUAL_TO" | "EQUAL_TO" | "GREATER_THAN_EQUAL_TO" | "GREATER_THAN";

export type planType = "BASE" | "RIDER";
export interface ApplicationEnrollmentRequirements {
    coverageLevels: CoverageLevel[];
    benefitAmount: number;
    benefitAmountModifier: benefitAmountModifier;
    dependencyType: DependencyType;
    relatedPlanId: 0;
    relatedPlanType: planType;
}
