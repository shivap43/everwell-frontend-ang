import {
    AsyncData,
    AsyncStatus,
    Plan,
    PlanSeries,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesOptionBenefitAmounts,
    RateSheetPlanSeriesSettings,
} from "@empowered/constants";
import { getEntityId } from "../../ngrx.store.helpers";
import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";
import {
    DownloadRateSheetEntity,
    DownloadRateSheetIdentifiers,
    RateSheetPlanSelectionsEntity,
    RateSheetPlanSelectionsIdentifiers,
    RateSheetPlanSeriesOptionBenefitAmountsEntity,
    RateSheetPlanSeriesOptionBenefitAmountsIdentifiers,
    RateSheetPlanSeriesOptionsEntity,
    RateSheetPlanSeriesOptionsIdentifiers,
    RateSheetPlanSeriesSettingsEntity,
    RateSheetPlanSeriesSettingsIdentifiers,
} from "./rate-sheets.model";
import { PlanSelections } from "@empowered/api";

export const getRateSheetPlanSeriesOptionsEntityId = ({ planSeriesId, productId }: RateSheetPlanSeriesOptionsIdentifiers) =>
    getEntityId(productId, planSeriesId);

export const rateSheetPlanSeriesOptionsEntityAdapter: EntityAdapter<
    RateSheetPlanSeriesOptionsEntity<AsyncData<RateSheetPlanSeriesOption[]>>
> = createEntityAdapter({
    selectId: ({ identifiers }) => getRateSheetPlanSeriesOptionsEntityId(identifiers),
});

export type RateSheetPlanSeriesOptionsEntities = EntityState<RateSheetPlanSeriesOptionsEntity<AsyncData<RateSheetPlanSeriesOption[]>>>;

export const getRateSheetPlanSeriesSettingsEntityId = ({ productId, planSeriesId }: RateSheetPlanSeriesSettingsIdentifiers) =>
    getEntityId(productId, planSeriesId);

export const rateSheetPlanSeriesSettingsEntityAdapter: EntityAdapter<
    RateSheetPlanSeriesSettingsEntity<AsyncData<RateSheetPlanSeriesSettings>>
> = createEntityAdapter({
    selectId: ({ identifiers }) => getRateSheetPlanSeriesSettingsEntityId(identifiers),
});

export type RateSheetPlanSeriesSettingsEntities = EntityState<RateSheetPlanSeriesSettingsEntity<AsyncData<RateSheetPlanSeriesSettings>>>;

export const getDownloadRateSheetEntityId = ({
    state,
    partnerAccountType,
    payrollFrequencyId,
    riskClassId,
    rateSheetTitle,
    zipCode,
    sicCode,
    eligibleSubscribers,
}: DownloadRateSheetIdentifiers) =>
    getEntityId(state, partnerAccountType, payrollFrequencyId, riskClassId, rateSheetTitle, zipCode, sicCode, eligibleSubscribers);

export const downloadRateSheetEntityAdapter: EntityAdapter<DownloadRateSheetEntity<AsyncData<string>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getDownloadRateSheetEntityId(identifiers),
});

export type DownloadRateSheetEntities = EntityState<DownloadRateSheetEntity<AsyncData<string>>>;

export const getRateSheetPlanSelectionsEntityId = ({ productId, planSeriesId, planSeriesCategory }: RateSheetPlanSelectionsIdentifiers) =>
    getEntityId(productId, planSeriesId, planSeriesCategory);

export const rateSheetPlanSelectionsEntityAdapter: EntityAdapter<RateSheetPlanSelectionsEntity<AsyncData<PlanSelections[]>>> =
    createEntityAdapter({
        selectId: ({ identifiers }) => getRateSheetPlanSelectionsEntityId(identifiers),
    });

export type RateSheetPlanSelectionsEntities = EntityState<RateSheetPlanSelectionsEntity<AsyncData<PlanSelections[]>>>;

export const getRateSheetPlanSeriesOptionBenefitAmountsEntityId = ({
    planSeriesId,
    state,
    partnerAccountType,
    payrollFrequencyId,
    riskClassId,
    minAge,
    maxAge,
}: RateSheetPlanSeriesOptionBenefitAmountsIdentifiers) =>
    getEntityId(planSeriesId, state, partnerAccountType, payrollFrequencyId, riskClassId, minAge, maxAge);

export const rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter: EntityAdapter<
    RateSheetPlanSeriesOptionBenefitAmountsEntity<AsyncData<RateSheetPlanSeriesOptionBenefitAmounts[]>>
> = createEntityAdapter({
    selectId: ({ identifiers }) => getRateSheetPlanSeriesOptionBenefitAmountsEntityId(identifiers),
});

export type RateSheetPlanSeriesOptionBenefitAmountsEntities = EntityState<
    RateSheetPlanSeriesOptionBenefitAmountsEntity<AsyncData<RateSheetPlanSeriesOptionBenefitAmounts[]>>
>;

export interface State {
    planSeries: AsyncData<PlanSeries[]>;
    quickQuotePlans: AsyncData<Plan[]>;
    rateSheetPlanSeriesOptionsEntities: RateSheetPlanSeriesOptionsEntities;
    rateSheetPlanSeriesSettingsEntities: RateSheetPlanSeriesSettingsEntities;
    downloadRateSheetEntities: DownloadRateSheetEntities;
    rateSheetPlanSelectionsEntities: RateSheetPlanSelectionsEntities;
    selectedProductIndex: number;
    selectedPlanSeries: { planSeries?: PlanSeries };
    rateSheetPlanSeriesOptionBenefitAmountsEntities: RateSheetPlanSeriesOptionBenefitAmountsEntities;
}

export const initialState: State = {
    planSeries: {
        status: AsyncStatus.IDLE,
    },
    quickQuotePlans: {
        status: AsyncStatus.IDLE,
    },
    rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.getInitialState({}),
    rateSheetPlanSeriesSettingsEntities: rateSheetPlanSeriesSettingsEntityAdapter.getInitialState({}),
    downloadRateSheetEntities: downloadRateSheetEntityAdapter.getInitialState({}),
    rateSheetPlanSelectionsEntities: rateSheetPlanSelectionsEntityAdapter.getInitialState({}),
    selectedProductIndex: 0,
    selectedPlanSeries: { planSeries: undefined },
    rateSheetPlanSeriesOptionBenefitAmountsEntities: rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter.getInitialState({}),
};
