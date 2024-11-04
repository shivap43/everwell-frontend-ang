import { MemoizedSelector, createFeatureSelector, createSelector } from "@ngrx/store";
import { State, getAflacAlwaysEnrollmentsEntityId } from "./aflac-always.state";
import { AFLAC_ALWAYS_FEATURE_KEY } from "./aflac-always.reducer";
import { AflacAlwaysEnrollments, AsyncData } from "@empowered/constants";
import { getAsyncDataFromEntitiesState } from "../../ngrx.store.helpers";

export const getAflacAlwaysFeatureState = createFeatureSelector<State>(AFLAC_ALWAYS_FEATURE_KEY);

// Aflac Always Enrollments selector
export const getAflacAlwaysEnrollmentsEntities = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsEntities,
);

export const getAflacAlwaysEnrollments = (
    mpGroupId: number,
    memberId: number,
): MemoizedSelector<object, AsyncData<AflacAlwaysEnrollments[]>> =>
    createSelector(getAflacAlwaysEnrollmentsEntities, (entitiesState) => {
        const id = getAflacAlwaysEnrollmentsEntityId({ mpGroupId, memberId });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });

// Aflac Always Enrollment's ID Selector
export const getAflacAlwaysUserSelectionEnrollmentIds = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.enrollmentIds,
);

export const getAflacAlwaysUserSelectionPayFrequency = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.payFrequency,
);

export const getAflacAlwaysUserSelectionSubscriberPaymentId = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.subscriberPaymentId,
);

export const getAflacAlwaysFirstPaymentDay = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.firstPaymentDay,
);

export const getAflacAlwaysUserSelectionCumulativeTotalCost = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.cumulativeTotalCost,
);

export const getAflacAlwaysEnrollmentMethod = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.enrollmentMethod,
);

// AflacAlwaysEnrollmentsUserSelection selector
export const getAflacAlwaysEnrollmentsUserSelection = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection,
);

export const getAflacAlwaysEsignature = createSelector(
    getAflacAlwaysFeatureState,
    (state: State) => state.aflacAlwaysEnrollmentsUserSelection.signature,
);
