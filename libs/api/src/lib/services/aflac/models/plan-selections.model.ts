import { RiderSelection } from "@empowered/constants";

export interface PlanSelections {
    planId?: number;
    displayOrder?: number;
    benefitAmounts?: number[] | RateSheetBenefitAmount[];
    riderSelections?: RiderSelection[];
    coverageLevelIds?: number[];
    childAge?: number;
    eliminationPeriods?: number[];
    planTypes?: string[];
    planSeriesCategory?: string;
}

export interface RateSheetBenefitAmount {
    units?: number;
    amount: number;
    minBenefitAmount?: number | RateSheetBenefitAmount;
    maxBenefitAmount?: number | RateSheetBenefitAmount;
    benefitAmountSelected?: RateSheetBenefitAmount;
}
