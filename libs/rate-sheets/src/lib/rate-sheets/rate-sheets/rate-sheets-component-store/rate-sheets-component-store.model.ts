import { AsyncData, CountryState, CoverageLevel, PayFrequency, RiskClass } from "@empowered/constants";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { EntityState } from "@ngrx/entity";

export interface RateSheetPanelIdentifiers {
    planSeriesId: number;
}
export interface RateSheetMoreSettings {
    zipCode: string;
    sicCode: number;
    eligibleSubscribers: number;
}

export interface PlanSeriesPlansState {
    /** Selected `plan id` */
    id: number;
    /** Selected `plan name` */
    name: string;
}

export interface RateSheetPlanSeriesPlansState {
    plans: PlanSeriesPlansState[];
    /** `PlanSeries id` */
    panelIdentifiers: RateSheetPanelIdentifiers;
}

export interface RateSheetBenefitAmountState {
    /** Selected `Benefit Amount` */
    benefitAmounts: number[];
    /** `PlanSeries id` */
    panelIdentifiers: RateSheetPanelIdentifiers;
}

export interface RateSheetCoverageLevelState {
    /** Selected `Coverage Level` */
    coverageLevels: CoverageLevel[];
    /** `PlanSeries id` */
    panelIdentifiers: RateSheetPanelIdentifiers;
}

export interface RateSheetEliminationPeriodState {
    /** Selected `Elimination Period` */
    eliminationPeriods: EliminationPeriod[];
    /** `PlanSeries id` */
    panelIdentifiers: RateSheetPanelIdentifiers;
}

export interface RidersState {
    /** `Plan id` of `Rider` */
    id: number;
    /** Local state that determines if `Rider` is selected */
    checked: boolean;
    /** Selected `Coverage Level` */
    selectedCoverageLevelName?: string | null;
    /** Selected `Elimination Period` */
    selectedEliminationPeriodName?: string | null;
    /** Selected `Benefit Amount` */
    selectedBenefitAmount?: number | null;
}

export interface RateSheetRidersState {
    riderOptions: RiderOptions;
    /** `PlanSeries id` */
    panelIdentifiers: RateSheetPanelIdentifiers;
}

export interface AvailableRidersMap {
    availableRiderMap: { [key: string]: string };
}

export interface RiderOptions {
    riderOptions: { [key: string]: string };
}

export interface RateSheetsComponentStoreState {
    countryState: AsyncData<CountryState>;
    channel: AsyncData<string>;
    paymentFrequency: AsyncData<PayFrequency>;
    riskClass: AsyncData<RiskClass>;
    moreSettings: AsyncData<RateSheetMoreSettings>;
    planSeriesPlansStates: EntityState<RateSheetPlanSeriesPlansState>;
    eliminationPeriodStates: EntityState<RateSheetEliminationPeriodState>;
    benefitAmountStates: EntityState<RateSheetBenefitAmountState>;
    coverageLevelStates: EntityState<RateSheetCoverageLevelState>;
    riderStates: EntityState<RateSheetRidersState>;
    availableRidersMap: AsyncData<AvailableRidersMap>;
    riderOptions: EntityState<RateSheetRidersState>;
}
