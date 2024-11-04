import { DependencyType } from "../enums/dependency.type";
import { CoverageLevel } from "./api/plan.model";

export interface EnrollmentRequirement {
    coverageLevels: CoverageLevel[];
    benefitAmount: number;
    benefitAmountModifier: string;
    dependencyType: DependencyType;
    relatedPlanId: number;
    relatedPlanType: string;
    relatedPlanName: string;
    failureMessage: string;
}
