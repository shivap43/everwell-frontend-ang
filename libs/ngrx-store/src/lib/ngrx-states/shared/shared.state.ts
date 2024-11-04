import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";

import {
    AsyncData,
    AsyncStatus,
    Configuration,
    ConfigurationsEntity,
    EnrollmentMethod,
    Flow,
    RawConfigurationsEntity,
    RiskClass,
    CountryState,
    Gender,
} from "@empowered/constants";

import { getEntityId } from "../../ngrx.store.helpers";
import { CitiesEntity } from "./shared.model";

// #region CitySets State
export const citySetsEntityAdapter: EntityAdapter<CitiesEntity<AsyncData<string[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getEntityId(identifiers.stateAbbreviation),
});

export type CitySetsEntities = EntityState<CitiesEntity<AsyncData<string[]>>>;
// #endregion

// #region Configurations State
export const rawConfigurationsEntityAdapter: EntityAdapter<RawConfigurationsEntity<AsyncData<Configuration[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getEntityId(identifiers.configurationNameRegex),
});

export type RawConfigurationsEntities = EntityState<RawConfigurationsEntity<AsyncData<Configuration[]>>>;

export const configurationsEntityAdapter: EntityAdapter<ConfigurationsEntity<AsyncData<Configuration>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getEntityId(identifiers.configurationName),
});

export type ConfigurationsEntities = EntityState<ConfigurationsEntity<AsyncData<Configuration>>>;
// #endregion

/**
 * Interface for the 'Shared' settings
 */
export interface State {
    selectedEnrollmentMethod?: EnrollmentMethod | null;
    selectedCountryState?: CountryState | null;
    selectedHeadsetState?: CountryState | null;
    selectedCity?: string | null;
    selectedFlow?: Flow | null;
    autoEnrolledMembers: number[];

    countryStates: AsyncData<CountryState[]>;
    citiesEntities: EntityState<CitiesEntity<AsyncData<string[]>>>;
    countries: AsyncData<string[]>;
    genders: AsyncData<Gender[]>;
    riskClasses: AsyncData<RiskClass[]>;
    rawConfigurationsEntities: EntityState<RawConfigurationsEntity<AsyncData<Configuration[]>>>;
    configurationsEntities: EntityState<ConfigurationsEntity<AsyncData<Configuration>>>;
}

export const initialState: State = {
    autoEnrolledMembers: [],
    countryStates: {
        status: AsyncStatus.IDLE,
    },
    citiesEntities: citySetsEntityAdapter.getInitialState({}),
    countries: {
        status: AsyncStatus.IDLE,
    },
    genders: {
        status: AsyncStatus.IDLE,
    },
    riskClasses: {
        status: AsyncStatus.IDLE,
    },
    rawConfigurationsEntities: rawConfigurationsEntityAdapter.getInitialState({}),
    configurationsEntities: configurationsEntityAdapter.getInitialState({}),
};
