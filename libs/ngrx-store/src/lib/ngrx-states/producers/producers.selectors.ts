import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { ProducerInformation } from "@empowered/api";

import { getAsyncDataFromEntitiesState, getIdleAsyncData } from "../../ngrx.store.helpers";
import { AccountsSelectors } from "../accounts";
import { PRODUCERS_FEATURE_KEY } from "./producers.reducer";
import {
    getLicensedStateSetsEntityId,
    getProducerInformationsEntityId,
    ProducerInformationsEntities,
    LicensedStateSetsEntities,
    State,
} from "./producers.state";
import { AsyncData, CountryState } from "@empowered/constants";

// Lookup the 'Producers' feature state managed by NgRx
export const getProducersFeatureState = createFeatureSelector<State>(PRODUCERS_FEATURE_KEY);

export const getSelectedProducerId = createSelector(getProducersFeatureState, (state: State) => state.selectedProducerId);

// #region ProducerInformations
export const getProducerInformationsEntities = createSelector(
    getProducersFeatureState,
    (state: State) => state.producerInformationsEntities,
);

export const getSelectedProducerInformation: MemoizedSelector<object, AsyncData<ProducerInformation>> = createSelector(
    getProducerInformationsEntities,
    getSelectedProducerId,
    (entitiesState: ProducerInformationsEntities, producerId?: number | null): AsyncData<ProducerInformation> => {
        if (!producerId) {
            return getIdleAsyncData();
        }

        const id = getProducerInformationsEntityId({ producerId });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region LicensedStateSets
export const getLicensedStateSetsEntities = createSelector(getProducersFeatureState, (state: State) => state.licensedStateSetsEntities);

export const getSelectedLicensedStateSet: MemoizedSelector<object, AsyncData<CountryState[]>> = createSelector(
    getLicensedStateSetsEntities,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: LicensedStateSetsEntities, mpGroup?: number | null): AsyncData<CountryState[]> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getLicensedStateSetsEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion
