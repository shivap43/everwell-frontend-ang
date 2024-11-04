import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { KnockoutQuestion } from "@empowered/api";

import { NullishPartial } from "../../store.model";
import {
    PlanOfferingsIdentifiers,
    PlanOfferingsEntity,
    CoverageDatesRecordsIdentifiers,
    CoverageDatesRecordsEntity,
    CoverageLevelIdentifiers,
    CoverageLevelEntity,
    KnockoutQuestionsIdentifiers,
    KnockoutQuestionsEntity,
    PlanOfferingPricingsEntity,
    PlanOfferingRidersIdentifiers,
    PlanOfferingRidersEntity,
    KnockoutResponsesIdentifiers,
    LoadKnockoutResponsesEntity,
    SaveKnockoutResponsesEntity,
} from "./plan-offerings.model";
import { getEntityId } from "../../ngrx.store.helpers";
import {
    AsyncData,
    PlanOfferingPricingsIdentifiers,
    ShopPageType,
    CoverageLevel,
    PlanOffering,
    CoverageDatesRecord,
    ApplicationResponse,
    PlanOfferingPricing,
} from "@empowered/constants";

// #region PlanOfferings State
export const getPlanOfferingsEntityId = ({
    mpGroup,
    memberId,
    enrollmentMethod,
    stateAbbreviation,
    referenceDate,
}: NullishPartial<PlanOfferingsIdentifiers>) => getEntityId(mpGroup, memberId, enrollmentMethod, stateAbbreviation, referenceDate);

export const planOfferingsEntityAdapter = createEntityAdapter<PlanOfferingsEntity<AsyncData<PlanOffering[]>>>({
    selectId: ({ identifiers }) => getPlanOfferingsEntityId(identifiers),
});

export type PlanOfferingsState = EntityState<PlanOfferingsEntity<AsyncData<PlanOffering[]>>>;
// #endregion

// #region PlanOfferingRiders State
export const getPlanOfferingRidersEntityId = ({
    planOfferingId,
    mpGroup,
    memberId,
    enrollmentMethod,
    stateAbbreviation,
    coverageEffectiveDate,
}: NullishPartial<PlanOfferingRidersIdentifiers>) =>
    getEntityId(planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviation, coverageEffectiveDate);

export const planOfferingRidersEntityAdapter = createEntityAdapter<PlanOfferingRidersEntity<AsyncData<PlanOffering[]>>>({
    selectId: ({ identifiers }) => getPlanOfferingRidersEntityId(identifiers),
});

export type PlanOfferingRidersEntities = EntityState<PlanOfferingRidersEntity<AsyncData<PlanOffering[]>>>;
// #endregion

// #region CoverageDatesRecords State
export const getCoverageDatesRecordEntityId = ({
    mpGroup,
    memberId,
    coverageDatesEnrollmentType,
    referenceDate,
}: CoverageDatesRecordsIdentifiers) => getEntityId(mpGroup, memberId, coverageDatesEnrollmentType, referenceDate);

export const coverageDatesRecordEntityAdapter = createEntityAdapter<CoverageDatesRecordsEntity<AsyncData<CoverageDatesRecord>>>({
    selectId: ({ identifiers }) => getCoverageDatesRecordEntityId(identifiers),
});

export type CoverageDatesRecordEntities = EntityState<CoverageDatesRecordsEntity<AsyncData<CoverageDatesRecord>>>;
// #endregion

// #region CoverageLevels State
export const getCoverageLevelEntityId = ({
    mpGroup,
    planId,
    fetchRetainRiders,
    parentCoverageLevelId,
    stateCode,
}: CoverageLevelIdentifiers) => getEntityId(mpGroup, planId, fetchRetainRiders, parentCoverageLevelId, stateCode);

export const coverageLevelsEntityAdapter = createEntityAdapter<CoverageLevelEntity<AsyncData<CoverageLevel[]>>>({
    selectId: ({ identifiers }) => getCoverageLevelEntityId(identifiers),
});

export type CoverageLevelsEntities = EntityState<CoverageLevelEntity<AsyncData<CoverageLevel[]>>>;

// #region KnockoutQuestions State
export const getKnockoutQuestionsEntityId = ({ planOfferingId, mpGroup, memberId, stateAbbreviation }: KnockoutQuestionsIdentifiers) =>
    getEntityId(planOfferingId, mpGroup, memberId, stateAbbreviation);

export const knockOutQuestionsEntityAdapter = createEntityAdapter<KnockoutQuestionsEntity<AsyncData<KnockoutQuestion[]>>>({
    selectId: ({ identifiers }) => getKnockoutQuestionsEntityId(identifiers),
});

export type KnockoutQuestionsEntities = EntityState<KnockoutQuestionsEntity<AsyncData<KnockoutQuestion[]>>>;

// #region KnockoutResponses State
export const getKnockoutResponsesEntityId = ({ mpGroup, memberId }: KnockoutResponsesIdentifiers) => getEntityId(mpGroup, memberId);

export const loadKnockoutResponsesEntityAdapter = createEntityAdapter<LoadKnockoutResponsesEntity<AsyncData<ApplicationResponse[][]>>>({
    selectId: ({ identifiers }) => getKnockoutResponsesEntityId(identifiers),
});

export type LoadKnockoutResponsesEntities = EntityState<LoadKnockoutResponsesEntity<AsyncData<ApplicationResponse[][]>>>;

export const saveKnockoutResponsesEntityAdapter = createEntityAdapter<SaveKnockoutResponsesEntity<AsyncData<null>>>({
    selectId: ({ identifiers }) => getKnockoutResponsesEntityId(identifiers),
});

export type SaveKnockoutResponsesEntities = EntityState<SaveKnockoutResponsesEntity<AsyncData<null>>>;

// #region PlanOfferingPricings State
export const getPlanOfferingPricingsEntityId = ({
    planOfferingId,
    memberId,
    mpGroup,
    stateAbbreviation,
    parentPlanId,
    parentPlanCoverageLevelId,
    baseBenefitAmount,
    memberIsTobaccoUser,
    spouseIsTobaccoUser,
    coverageEffectiveDate,
    riskClassId,
    shoppingCartItemId,
    includeFee,
}: PlanOfferingPricingsIdentifiers) =>
    getEntityId(
        planOfferingId,
        memberId,
        mpGroup,
        stateAbbreviation,
        parentPlanId,
        parentPlanCoverageLevelId,
        baseBenefitAmount,
        memberIsTobaccoUser,
        spouseIsTobaccoUser,
        coverageEffectiveDate,
        riskClassId,
        shoppingCartItemId,
        includeFee,
    );

export const planOfferingPricingsEntityAdapter = createEntityAdapter<PlanOfferingPricingsEntity<AsyncData<PlanOfferingPricing[]>>>({
    selectId: ({ identifiers }) => getPlanOfferingPricingsEntityId(identifiers),
});

export type PlanOfferingPricingsEntities = EntityState<PlanOfferingPricingsEntity<AsyncData<PlanOfferingPricing[]>>>;

// #endregion

export interface State {
    selectedPlanId?: number | null;
    selectedPlanOfferingId?: number | null;
    // Used for loading multiple PlanOfferingRiders
    /**
     * @deprecated not being used, should be removed
     */
    selectedDependentPlanOfferingIds?: number[] | null;
    selectedShopPageType?: ShopPageType | null;

    planOfferingsEntities: PlanOfferingsState;
    planOfferingRidersEntities: PlanOfferingRidersEntities;
    knockoutQuestionsEntities: KnockoutQuestionsEntities;
    loadKnockoutResponsesEntities: LoadKnockoutResponsesEntities;
    saveKnockoutResponsesEntities: SaveKnockoutResponsesEntities;
    coverageLevelsEntities: CoverageLevelsEntities;

    planOfferingPricingsEntities: PlanOfferingPricingsEntities;
    coverageDatesRecordEntities: CoverageDatesRecordEntities;
}

export const initialState: State = {
    planOfferingsEntities: planOfferingsEntityAdapter.getInitialState({}),
    planOfferingRidersEntities: planOfferingRidersEntityAdapter.getInitialState({}),
    coverageLevelsEntities: coverageLevelsEntityAdapter.getInitialState({}),
    knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.getInitialState({}),
    loadKnockoutResponsesEntities: loadKnockoutResponsesEntityAdapter.getInitialState({}),
    saveKnockoutResponsesEntities: saveKnockoutResponsesEntityAdapter.getInitialState({}),
    planOfferingPricingsEntities: planOfferingPricingsEntityAdapter.getInitialState({}),
    coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.getInitialState({}),
};
