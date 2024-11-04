import { Gender, TobaccoStatus } from "../../enums";
import { CoverageLevel } from "../api";
import { AgeBand } from "./plan-series-choices.model";

interface SalaryRange {
    minSalary: number;
    maxSalary: number;
}

export interface RateSheetBenefitAmount {
    units?: number;
    amount: number;
}

export interface RateSheetCoverageLevelOption {
    id: number;
    // benefitAmounts?: RateSheetBenefitAmount[];
    eliminationPeriod?: string;
    name: string;
}

export interface RateSheetRider {
    planId: number;
    spouseGenders: Gender[];
    spouseTobaccoStatuses: TobaccoStatus[];
    benefitAmounts: RateSheetBenefitAmount[];
    coverageLevelOptions: RateSheetCoverageLevelOption[];
    planName: string;
    coverageLevelOptionsMap: {
        [key: number]: CoverageLevel[];
    };
}

export interface RateSheetPlanSeriesOption {
    planId: number;
    genders: Gender[];
    tobaccoStatuses: TobaccoStatus[];
    ageBands: AgeBand[];
    salaryRange: SalaryRange;
    coverageLevelOptions: RateSheetCoverageLevelOption[];
    riders: RateSheetRider[];
    benefitAmounts: RateSheetBenefitAmount[];
    planType?: string[];
}

export interface RateSheetPlanSeriesSettings {
    productId: number;
    planSeriesId: number;
    settings: { ageBands: AgeBand[]; genders: Gender[]; tobaccoStatuses: TobaccoStatus[] };
}

export interface RateSheetSettings {
    state: string;
    partnerAccountType: string;
    payrollFrequencyId: number;
    riskClassId: number;
    zipCode: string;
    sicCode: string;
    eligibleSubscribers: number;
}
