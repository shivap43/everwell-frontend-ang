import { AsyncStatus } from "@empowered/constants";
import { createReducer, on, Action } from "@ngrx/store";

import * as ProducersActions from "./producers.actions";
import { initialState, State, licensedStateSetsEntityAdapter, producerInformationsEntityAdapter } from "./producers.state";

export const PRODUCERS_FEATURE_KEY = "producers";

export interface ProducersPartialState {
    readonly [PRODUCERS_FEATURE_KEY]: State;
}

const producersReducer = createReducer(
    initialState,

    on(
        ProducersActions.setSelectedProducerId,
        (state, { producerId }): State => ({
            ...state,
            selectedProducerId: producerId,
        }),
    ),

    // #region ProducerInformations
    on(
        ProducersActions.loadProducerInformation,
        (state, { producerId }): State => ({
            ...state,
            producerInformationsEntities: producerInformationsEntityAdapter.setOne(
                {
                    identifiers: { producerId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.producerInformationsEntities },
            ),
        }),
    ),
    on(
        ProducersActions.loadProducerInformationSuccess,
        (state, { producerInformationsEntity }): State => ({
            ...state,
            producerInformationsEntities: producerInformationsEntityAdapter.setOne(
                {
                    identifiers: { ...producerInformationsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: producerInformationsEntity.data,
                        error: null,
                    },
                },
                { ...state.producerInformationsEntities },
            ),
        }),
    ),
    on(
        ProducersActions.loadProducerInformationFailure,
        (state, { error }): State => ({
            ...state,
            producerInformationsEntities: producerInformationsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.producerInformationsEntities },
            ),
        }),
    ),
    // #endregion

    // #region ProducersLicensedStateSets
    on(
        ProducersActions.loadAllProducersLicensedStateSet,
        (state, { mpGroup }): State => ({
            ...state,
            licensedStateSetsEntities: licensedStateSetsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.licensedStateSetsEntities },
            ),
        }),
    ),
    on(
        ProducersActions.loadAllProducersLicensedStateSetSuccess,
        (state, { licensedStateSetsEntity }): State => ({
            ...state,
            licensedStateSetsEntities: licensedStateSetsEntityAdapter.setOne(
                {
                    identifiers: { ...licensedStateSetsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...licensedStateSetsEntity.data],
                        error: null,
                    },
                },
                { ...state.licensedStateSetsEntities },
            ),
        }),
    ),
    on(
        ProducersActions.loadAllProducersLicensedStateSetFailure,
        (state, { error }): State => ({
            ...state,
            licensedStateSetsEntities: licensedStateSetsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.licensedStateSetsEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return producersReducer(state, action);
}
