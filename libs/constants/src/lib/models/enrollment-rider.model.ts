import { TaxStatus } from "../enums";
import { CoverageLevel, Plan } from "./api";

export interface EnrollmentRider {
    id: number;
    name: string;
    planId: number;
    plan: Plan;
    memberCost: number;
    totalCost: number;
    benefitAmount: number;
    coverageLevelId: number;
    coverageLevel: CoverageLevel;
    taxStatus: TaxStatus;
    memberCostPerPayPeriod?: number;
    planOfferingId?: number;
}
