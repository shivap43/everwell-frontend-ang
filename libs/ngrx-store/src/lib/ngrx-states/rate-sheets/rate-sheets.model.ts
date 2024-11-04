import { Entity } from "@empowered/constants";

export interface RateSheetPlanSeriesOptionsIdentifiers {
    productId: number;
    planSeriesId: number;
}

export type RateSheetPlanSeriesOptionsEntity<Value> = Entity<RateSheetPlanSeriesOptionsIdentifiers, Value>;

export interface DownloadRateSheetIdentifiers {
    state: string;
    partnerAccountType: string;
    payrollFrequencyId: number;
    riskClassId: number;
    rateSheetTitle: string;
    zipCode?: string;
    sicCode?: number;
    eligibleSubscribers?: number;
}

export type DownloadRateSheetEntity<Value> = Entity<DownloadRateSheetIdentifiers, Value>;

export interface RateSheetPlanSeriesSettingsIdentifiers {
    productId: number;
    planSeriesId: number;
}

export type RateSheetPlanSeriesSettingsEntity<Value> = Entity<RateSheetPlanSeriesSettingsIdentifiers, Value>;

export interface RateSheetPlanSelectionsIdentifiers {
    productId: number;
    planSeriesId: number;
    planSeriesCategory?: string | undefined;
}

export type RateSheetPlanSelectionsEntity<Value> = Entity<RateSheetPlanSelectionsIdentifiers, Value>;

export interface RateSheetPlanSeriesOptionBenefitAmountsIdentifiers {
    planSeriesId: number;
    state: string;
    partnerAccountType: string;
    payrollFrequencyId: number;
    riskClassId: number;
    minAge: number;
    maxAge: number;
}

export type RateSheetPlanSeriesOptionBenefitAmountsEntity<Value> = Entity<RateSheetPlanSeriesOptionBenefitAmountsIdentifiers, Value>;
