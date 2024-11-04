import { Validity, AflacGroupOfferingError, CoverageStartOptions, PlanYearType, Plan } from "@empowered/constants";

export interface EligiblePlans {
    plans?: Plan[];
    aflacGroupPlanYear?: AflacGroupPlanYear;
    aflacGroupOfferingError?: AflacGroupBenefitsOfferingError;
    replaceWithAflacGroup?: ReplaceAflacGroupInfo[];
    aflacGroupCoveragePeriod?: Validity;
}
export interface AflacGroupBenefitsOfferingError {
    error: AflacGroupOfferingError;
    nonSelfServiceProducts: string[];
}
export interface AflacGroupPlanYear {
    type: PlanYearType;
    id?: number;
    name: string;
    enrollmentPeriod?: Validity;
    coveragePeriod?: Validity;
    coverageStartDateOption?: CoverageStartOptions;
}
export interface ReplaceAflacGroupInfo {
    productName?: string;
    enrollmentStartDate?: string;
}
export interface RefreshAflacGroupInfo {
    aflacGroupOfferingRequiresReview: boolean;
    newAflacGroupPlanYearRequired: boolean;
    aflacGroupOfferablePlans: EligiblePlans;
}
