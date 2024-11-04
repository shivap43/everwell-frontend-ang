import { AgeRestrictionType, MissingInfoType, PlanType, TaxStatus } from "../enums";
import { Plan } from "./api";
import { EnrollmentRequirement } from "./enrollmentRequirement.model";
import { Validity } from "./validity.model";

export interface PlanOffering {
    id: number; // (PlanOfferingId)
    plan: Plan;
    taxStatus: TaxStatus;
    productOfferingId?: number;
    planYearId?: number; // this is only tax status (pre & variable)
    agentAssistanceRequired: boolean;
    missingInformation?: MissingInfoType;
    enrollmentRequirements?: EnrollmentRequirement[];
    itemId?: number;
    parentPlanId?: number;
    parentPlanCoverageLevelId?: number;
    validity?: Validity;
    editCoverage?: boolean;
    coverageStartFunction?: string;
    reinstateEnded?: boolean;
    reistateEndedPlan?: boolean;
    hasDuplicatePlan?: boolean;
    ageRestrictionNotMet?: AgeRestrictionType;
    returnOfPremiumRider?: boolean;
    brokerSelected?: boolean;
    familyBasedTobaccoStatusPricing?: boolean;
    type?: PlanType;
    link?: string;
    linkText?: string;
    planYearInOpenEnrollmentForVariableTax?: boolean;
}
