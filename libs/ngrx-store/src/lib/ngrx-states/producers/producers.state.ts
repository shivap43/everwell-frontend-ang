import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";

import {
    LicensedStateSetsEntity,
    LicensedStateSetsIdentifiers,
    ProducerInformationsEntity,
    ProducerInformationsIdentifiers,
} from "./producers.model";
import { ProducerInformation } from "@empowered/api";
import { AsyncData, CountryState } from "@empowered/constants";

// #region #ProducerInformations
export const getProducerInformationsEntityId = (identifiers: ProducerInformationsIdentifiers) => identifiers.producerId;

export const producerInformationsEntityAdapter: EntityAdapter<ProducerInformationsEntity<AsyncData<ProducerInformation>>> =
    createEntityAdapter({
        selectId: ({ identifiers }) => getProducerInformationsEntityId(identifiers),
    });

export type ProducerInformationsEntities = EntityState<ProducerInformationsEntity<AsyncData<ProducerInformation>>>;
// #endregion

// #region #LicensedStateSets
export const getLicensedStateSetsEntityId = (identifiers: LicensedStateSetsIdentifiers) => identifiers.mpGroup;

export const licensedStateSetsEntityAdapter: EntityAdapter<LicensedStateSetsEntity<AsyncData<CountryState[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getLicensedStateSetsEntityId(identifiers),
});
// #endregion

export type LicensedStateSetsEntities = EntityState<LicensedStateSetsEntity<AsyncData<CountryState[]>>>;

export interface State {
    selectedProducerId?: number | null;

    producerInformationsEntities: ProducerInformationsEntities;
    licensedStateSetsEntities: LicensedStateSetsEntities;
}

export const initialState: State = {
    producerInformationsEntities: producerInformationsEntityAdapter.getInitialState({}),
    licensedStateSetsEntities: licensedStateSetsEntityAdapter.getInitialState({}),
};
