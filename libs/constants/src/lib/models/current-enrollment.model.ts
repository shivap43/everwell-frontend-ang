import { Dependents } from "./dependents.model";
import { Validity } from "./validity.model";

export interface CurrentEnrollment {
    id: number;
    planId: number;
    coverageLevelId: number;
    status: string;
    memberCost: number;
    totalCost: number;
    validity: Validity;
    createDate: string;
    dependents: Dependents;
    taxStatus: string;
    tobaccoStatus: string;
}

export interface DeclineEnrollmentMethod {
    planName: string;
    planYearRange: string;
    coverageEffectiveDate: string;
    declineCoverageStartDate: string;
    declineCoverageEndDate: string;
}
