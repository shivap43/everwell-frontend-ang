import { RateSheetBenefitAmount } from "./rate-sheet-plan-series-options.model";

export interface RateSheetRiderBenefitAmounts {
    planId: number;
    planName: string;
    benefitAmounts: RateSheetBenefitAmount[];
}

export interface RateSheetPlanSeriesOptionBenefitAmounts {
    planId: number;
    benefitAmounts: RateSheetBenefitAmount[];
    riders: RateSheetRiderBenefitAmounts[];
}
