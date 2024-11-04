import { TaxStatus } from "../../enums";
import { PlanYearType } from "../../enums/plan-year-type.enum";
import { RequiredSetup } from "../../enums/required-setup.enum";
import { EnrollmentPeriod } from "../api/plan-year.model";
import { CoveragePeriod, Plan } from "../api/plan.model";

export interface PlanChoice {
    id: number;
    planId: number;
    plan?: Plan;
    continuous?: boolean;
    taxStatus: TaxStatus;
    cafeteria?: boolean;
    agentAssisted: boolean;
    enrollmentStartDate?: string;
    enrollmentPeriod?: EnrollmentPeriod;
    coverageStartFunction?: string;
    requiredSetup?: RequiredSetup[];
    planYearId?: number;
    expirationDate?: string;
}
export interface PlanYearOption {
    value?: number;
    viewValue?: string;
    coveragePeriod?: CoveragePeriod;
    type?: PlanYearType;
}
