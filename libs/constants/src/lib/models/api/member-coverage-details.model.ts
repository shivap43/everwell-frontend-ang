import { TaxStatus } from "../../enums";
import { EnrollmentDependent } from "../enrollment-dependent.model";
import { EnrollmentPeriod } from "./plan-year.model";
import { CoverageLevel } from "./plan.model";

export interface MemberCoverageDetails {
    plan: Plans;
    benefitAmount: number;
    coverageLevel: CoverageLevel;
    validity: EnrollmentPeriod;
    riders: Riders[];
    dependents: EnrollmentDependent[];
    taxStatus: TaxStatus;
}

interface Plans {
    planId: number;
    name: string;
}

interface Riders {
    planId: number;
    name: string;
    benefitAmount: number;
}
