import { getEntityId, getIdleAsyncData } from "@empowered/ngrx-store/ngrx.store.helpers";
import { createEntityAdapter } from "@ngrx/entity";
import {
    RateSheetBenefitAmountState,
    RateSheetCoverageLevelState,
    RateSheetEliminationPeriodState,
    RateSheetPanelIdentifiers,
    RateSheetPlanSeriesPlansState,
    RateSheetsComponentStoreState,
    RateSheetRidersState,
} from "./rate-sheets-component-store.model";

/** Common entity id used for the local state of a Plan */
export const getPanelEntityId = (identifiers: RateSheetPanelIdentifiers): string => getEntityId(identifiers.planSeriesId);

export const planSeriesPlansStatesAdapter = createEntityAdapter<RateSheetPlanSeriesPlansState>({
    selectId: ({ panelIdentifiers }: RateSheetPlanSeriesPlansState) => getPanelEntityId(panelIdentifiers),
});

export const eliminationPeriodStatesAdapter = createEntityAdapter<RateSheetEliminationPeriodState>({
    selectId: ({ panelIdentifiers }: RateSheetEliminationPeriodState) => getPanelEntityId(panelIdentifiers),
});

export const benefitAmountStatesAdapter = createEntityAdapter<RateSheetBenefitAmountState>({
    selectId: ({ panelIdentifiers }: RateSheetBenefitAmountState) => getPanelEntityId(panelIdentifiers),
});

export const coverageLevelStatesAdapter = createEntityAdapter<RateSheetCoverageLevelState>({
    selectId: ({ panelIdentifiers }: RateSheetCoverageLevelState) => getPanelEntityId(panelIdentifiers),
});

export const riderStatesAdapter = createEntityAdapter<RateSheetRidersState>({
    selectId: ({ panelIdentifiers }: RateSheetRidersState) => getPanelEntityId(panelIdentifiers),
});

export const RATE_SHEETS_COMPONENT_STORE_DEFAULT_STATE: RateSheetsComponentStoreState = {
    countryState: getIdleAsyncData(),
    channel: getIdleAsyncData(),
    paymentFrequency: getIdleAsyncData(),
    riskClass: getIdleAsyncData(),
    moreSettings: getIdleAsyncData(),
    availableRidersMap: getIdleAsyncData(),
    planSeriesPlansStates: planSeriesPlansStatesAdapter.getInitialState({}),
    eliminationPeriodStates: eliminationPeriodStatesAdapter.getInitialState({}),
    benefitAmountStates: benefitAmountStatesAdapter.getInitialState({}),
    coverageLevelStates: coverageLevelStatesAdapter.getInitialState({}),
    riderStates: riderStatesAdapter.getInitialState({}),
    riderOptions: riderStatesAdapter.getInitialState({}),
};
