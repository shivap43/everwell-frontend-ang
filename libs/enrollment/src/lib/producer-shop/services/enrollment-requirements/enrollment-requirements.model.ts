import { EnrollmentRequirementPlanType } from "../rider-state/rider-state.model";

/**
 * These are the values used to identify and verify that a `Rider` / `PlanOffering`
 * should be used to validate an `EnrollmentRequirement`
 */
export interface EnrollmentRequirementComparisonValues {
    relatedPlanId: number;
    coverageLevelId?: number;
    benefitAmount?: number;
    relatedPlanType?: EnrollmentRequirementPlanType;
}

/**
 * `BenefitAmount` comparsion operators. Used with `EnrollmentRequirements`
 */
export enum BenefitAmountModifier {
    LESS_THAN = "LESS_THAN",
    LESS_THAN_EQUAL_TO = "LESS_THAN_EQUAL_TO",
    EQUAL_TO = "EQUAL_TO",
    GREATER_THAN_EQUAL_TO = "GREATER_THAN_EQUAL_TO",
    GREATER_THAN = "GREATER_THAN",
}

export enum DependencyType {
    REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN = "REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN",
    REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN = "REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN",
    REQUIRES_ELIGIBLE_SPOUSE = "REQUIRES_ELIGIBLE_SPOUSE",
    REQUIRES_BROKERS_PLAN_SELECTION = "REQUIRES_BROKERS_PLAN_SELECTION",
    REQUIRES_NON_GI_PARENT_ENROLLMENT = "REQUIRES_NON_GI_PARENT_ENROLLMENT",
    REQUIRES_GI_PARENT_ENROLLMENT = "REQUIRES_GI_PARENT_ENROLLMENT",
    REQUIRES_ELIGIBLE_CHILD = "REQUIRES_ELIGIBLE_CHILD",
    REQUIRES_NONSELECTION_IN_ANOTHER_PLAN = "REQUIRES_NONSELECTION_IN_ANOTHER_PLAN",
    // `REQUIRES_SELECTION_IN_ANOTHER_PLAN` is a new enum introduced for Producer Shop Rewrite
    REQUIRES_SELECTION_IN_ANOTHER_PLAN = "REQUIRES_SELECTION_IN_ANOTHER_PLAN",
}
