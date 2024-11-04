import { PlanYearType } from "../../enums";
import { CoveragePeriod } from "./plan.model";
import { Product } from "./product.model";

export interface PlanYear {
    type: PlanYearType;
    locked?: boolean;
    id?: number;
    name: string;
    coveragePeriod: CoveragePeriod;
    enrollmentPeriod: EnrollmentPeriod;
    activeEnrollments?: boolean;
}

export interface EnrollmentPeriod {
    effectiveStarting: string;
    expiresAfter?: string;
    guaranteedIssueEffectiveStarting?: string;
    guaranteedIssueExpiresAfter?: string;
}

export interface GetPlan {
    id: number;
    name: string;
    adminName: string;
    carrierId: number;
    policyOwnershipType: string;
    characteristics: string[];
    pricingModel: string;
    dependentPlanIds: number[];
    mutuallyExclusivePlanIds: number[];
    product?: Product;
    dependentPlans: GetPlan[];
    sunsetDate: string;
    pricingEditable?: boolean;
    policySeries?: string;
    description: string;
    enrollmentStartDate?: string;
}
