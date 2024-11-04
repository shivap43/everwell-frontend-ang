import { PlanReplacement } from "./plan-replacement.model";
import { EnrollmentPeriod } from "@empowered/constants";
export interface DeletePlanChoice {
    coverageEndDate?: string;
    enrollmentEndDate?: string;
    qualifyingEventValidity?: EnrollmentPeriod;
    planReplacement?: PlanReplacement;
}
