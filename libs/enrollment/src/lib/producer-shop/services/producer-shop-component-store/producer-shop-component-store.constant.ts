import { getEntityId, getIdleAsyncData } from "@empowered/ngrx-store/ngrx.store.helpers";
import { createEntityAdapter } from "@ngrx/entity";
import { RiderState } from "../rider-state/rider-state.model";
import {
    AnnualContributionState,
    AnsweredKnockoutQuestion,
    BenefitAmountState,
    CoverageLevelState,
    DependentAgeState,
    EliminationPeriodState,
    PanelIdentifiers,
    PlanKnockoutEligibility,
    ProducerShopState,
} from "./producer-shop-component-store.model";

/** Common entity id used for the local state of a PlanOffering */
export const getPanelEntityId = (identifiers: PanelIdentifiers): string =>
    getEntityId(identifiers.planOfferingId, identifiers.enrollmentId, identifiers.cartId);

// We need to use question.key as identifier because id is not unique identifier
export const answeredKnockoutQuestionsAdapter = createEntityAdapter<AnsweredKnockoutQuestion>({
    selectId: (answeredKnockoutQuestion: AnsweredKnockoutQuestion) => answeredKnockoutQuestion.key,
});

export const riderStatesAdapter = createEntityAdapter<RiderState>({
    selectId: ({ identifiers }: RiderState) => getEntityId(identifiers.riderPlanOfferingId, getPanelEntityId(identifiers)),
});

export const { selectAll: selectAllRiderEntities } = riderStatesAdapter.getSelectors();

export const planKnockoutEligibilityAdapter = createEntityAdapter<PlanKnockoutEligibility>({
    selectId: ({ planOfferingId }: PlanKnockoutEligibility) => getEntityId(planOfferingId),
});

export const eliminationPeriodStatesAdapter = createEntityAdapter<EliminationPeriodState>({
    selectId: ({ panelIdentifiers }: EliminationPeriodState) => getPanelEntityId(panelIdentifiers),
});

export const benefitAmountStatesAdapter = createEntityAdapter<BenefitAmountState>({
    selectId: ({ panelIdentifiers }: BenefitAmountState) => getPanelEntityId(panelIdentifiers),
});

export const coverageLevelStatesAdapter = createEntityAdapter<CoverageLevelState>({
    selectId: ({ panelIdentifiers }: CoverageLevelState) => getPanelEntityId(panelIdentifiers),
});

export const dependentAgeStatesAdapter = createEntityAdapter<DependentAgeState>({
    selectId: ({ panelIdentifiers }: DependentAgeState) => getPanelEntityId(panelIdentifiers),
});

export const annualContributionStatesAdapter = createEntityAdapter<AnnualContributionState>({
    selectId: ({ panelIdentifiers }: AnnualContributionState) => getPanelEntityId(panelIdentifiers),
});

export const PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE: ProducerShopState = {
    riskClasses: getIdleAsyncData(),
    moreSettings: getIdleAsyncData(),
    applicantDetails: getIdleAsyncData(),
    spouseDetails: getIdleAsyncData(),
    tobaccoInformation: getIdleAsyncData(),
    productCoverageDates: getIdleAsyncData(),
    enrollmentDetailsStates: getIdleAsyncData(),
    answeredKnockoutQuestions: answeredKnockoutQuestionsAdapter.getInitialState({}),
    knockoutDialogResponse: [],
    // State used for managing PlanOfferingRiders for dropdowns in plans-containers
    riderStates: riderStatesAdapter.getInitialState({}),
    planKnockoutEligibility: planKnockoutEligibilityAdapter.getInitialState({}),
    // State used for managing EliminationPeriods for dropdowns in plans-containers
    eliminationPeriodStates: eliminationPeriodStatesAdapter.getInitialState({}),
    // State used for managing BenefitAmount for dropdowns in plans-containers
    benefitAmountStates: benefitAmountStatesAdapter.getInitialState({}),
    coverageLevelStates: coverageLevelStatesAdapter.getInitialState({}),
    dependentAgeStates: dependentAgeStatesAdapter.getInitialState({}),
    annualContributionStates: annualContributionStatesAdapter.getInitialState({}),
};
