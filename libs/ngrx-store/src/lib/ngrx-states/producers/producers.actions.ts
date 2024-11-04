import { createAction, props, union } from "@ngrx/store";
import { ProducerInformation } from "@empowered/api";

import { LicensedStateSetsEntity, ProducerInformationsEntity } from "./producers.model";
import { ApiError, CountryState } from "@empowered/constants";

// #region ProducerInformations
export const setSelectedProducerId = createAction("[Producers] Set Selected ProducerId", props<{ producerId: number }>());

export const loadProducerInformation = createAction("[Producers/API] Get Producer Information", props<{ producerId: number }>());

export const loadProducerInformationSuccess = createAction(
    "[Producers/API] Get Producer Information Success",
    props<{ producerInformationsEntity: ProducerInformationsEntity<ProducerInformation> }>(),
);

export const loadProducerInformationFailure = createAction(
    "[Producers/API] Get Producer Information Failure",
    props<{ error: ProducerInformationsEntity<ApiError> }>(),
);
// #endregion

// #region ProducersLicensedStateSets
export const loadAllProducersLicensedStateSet = createAction(
    "[Producers/API] Get All Producers Licensed States",
    props<{ mpGroup: number }>(),
);

export const loadAllProducersLicensedStateSetSuccess = createAction(
    "[Producers/API] Get All Producers Licensed States Success",
    props<{ licensedStateSetsEntity: LicensedStateSetsEntity<CountryState[]> }>(),
);

export const loadAllProducersLicensedStateSetFailure = createAction(
    "[Producers/API] Get All Producers Licensed States Failure",
    props<{ error: LicensedStateSetsEntity<ApiError> }>(),
);
// #endregion

const actions = union({
    setSelectedProducerId,

    loadProducerInformation,
    loadProducerInformationSuccess,
    loadProducerInformationFailure,

    loadAllProducersLicensedStateSet,
    loadAllProducersLicensedStateSetSuccess,
    loadAllProducersLicensedStateSetFailure,
});

export type ActionsUnion = typeof actions;
