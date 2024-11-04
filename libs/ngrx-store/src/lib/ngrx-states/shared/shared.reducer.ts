import { createReducer, on, Action } from "@ngrx/store";

import { citySetsEntityAdapter, rawConfigurationsEntityAdapter, initialState, State, configurationsEntityAdapter } from "./shared.state";
import * as SharedActions from "./shared.actions";
import { AsyncStatus, ConfigName } from "@empowered/constants";

export const SHARED_FEATURE_KEY = "shared";

export interface SharedPartialState {
    readonly [SHARED_FEATURE_KEY]: State;
}

const sharedReducer = createReducer(
    initialState,

    on(
        SharedActions.setSelectedEnrollmentMethod,
        SharedActions.setSelectedEnrollmentMethodAndCountryState,
        SharedActions.setSelectedEnrollmentMethodAndCountryStateAndCity,
        SharedActions.setSelectedEnrollmentMethodAndHeadsetStateAndCity,
        SharedActions.setSelectedEnrollmentMethodState,
        (state, { enrollmentMethod }): State => ({
            ...state,
            selectedEnrollmentMethod: enrollmentMethod,
        }),
    ),

    on(
        SharedActions.setSelectedCountryState,
        SharedActions.setSelectedEnrollmentMethodAndCountryState,
        SharedActions.setSelectedCountryStateAndCity,
        SharedActions.setSelectedEnrollmentMethodAndCountryStateAndCity,
        SharedActions.setSelectedEnrollmentMethodState,
        (state, { countryState }): State => ({ ...state, selectedCountryState: countryState }),
    ),

    on(
        SharedActions.setSelectedCity,
        SharedActions.setSelectedCountryStateAndCity,
        SharedActions.setSelectedEnrollmentMethodAndCountryStateAndCity,
        SharedActions.setSelectedHeadsetStateAndCity,
        SharedActions.setSelectedEnrollmentMethodAndHeadsetStateAndCity,
        SharedActions.setSelectedEnrollmentMethodState,
        (state, { city }): State => ({ ...state, selectedCity: city }),
    ),

    on(
        SharedActions.setSelectedHeadsetState,
        SharedActions.setSelectedHeadsetStateAndCity,
        SharedActions.setSelectedEnrollmentMethodAndHeadsetStateAndCity,
        SharedActions.setSelectedEnrollmentMethodState,
        (state, { headsetCountryState }): State => ({ ...state, selectedHeadsetState: headsetCountryState }),
    ),

    on(
        SharedActions.setMemberAsAutoEnrolled,
        (state, { memberId }): State => ({
            ...state,
            autoEnrolledMembers: [...state.autoEnrolledMembers, memberId],
        }),
    ),

    on(
        SharedActions.setSelectedEnrollmentMethodState,
        (state, { enrollmentMethod, countryState, city, headsetCountryState }): State => ({
            ...state,
            selectedEnrollmentMethod: enrollmentMethod,
            selectedCountryState: countryState,
            selectedHeadsetState: headsetCountryState,
            selectedCity: city,
        }),
    ), // #endregion

    // #region isDirect/ Payroll
    on(SharedActions.setSelectedFlow, (state, { flow }): State => ({ ...state, selectedFlow: flow })),
    // #endregion

    // #region States
    on(
        SharedActions.loadCountryStates,
        (state): State => ({
            ...state,
            countryStates: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),
    on(
        SharedActions.loadCountryStatesSuccess,
        (state, { countryStates }): State => ({
            ...state,
            countryStates: {
                status: AsyncStatus.SUCCEEDED,
                value: [...countryStates],
                error: null,
            },
        }),
    ),
    on(
        SharedActions.loadCountryStatesFailure,
        (state, { error }): State => ({
            ...state,
            countryStates: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #endregion

    // #region Cities
    on(
        SharedActions.loadCities,
        (state, { stateAbbreviation }): State => ({
            ...state,
            citiesEntities: citySetsEntityAdapter.setOne(
                {
                    identifiers: {
                        stateAbbreviation,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.citiesEntities },
            ),
        }),
    ),
    on(
        SharedActions.loadCitiesSuccess,
        (state, { cities }): State => ({
            ...state,
            citiesEntities: citySetsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...cities.identifiers,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...cities.data],
                        error: null,
                    },
                },
                { ...state.citiesEntities },
            ),
        }),
    ),
    on(
        SharedActions.loadCitiesFailure,
        (state, { error }): State => ({
            ...state,
            citiesEntities: citySetsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...error.identifiers,
                    },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.citiesEntities },
            ),
        }),
    ),

    // #region Countries
    on(
        SharedActions.loadCountries,
        (state): State => ({
            ...state,
            countries: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),
    on(
        SharedActions.loadCountriesSuccess,
        (state, { countries }): State => ({
            ...state,
            countries: {
                status: AsyncStatus.SUCCEEDED,
                value: [...countries],
                error: null,
            },
        }),
    ),
    on(
        SharedActions.loadCountriesFailure,
        (state, { error }): State => ({
            ...state,
            countries: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #endregion

    // #region Genders
    on(
        SharedActions.loadGenders,
        (state): State => ({
            ...state,
            genders: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),
    on(
        SharedActions.loadGendersSuccess,
        (state, { genders }): State => ({
            ...state,
            genders: {
                status: AsyncStatus.SUCCEEDED,
                value: [...genders],
                error: null,
            },
        }),
    ),
    on(
        SharedActions.loadGendersFailure,
        (state, { error }): State => ({
            ...state,
            genders: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #endregion

    // #region RiskClasses
    on(
        SharedActions.loadCarrierRiskClasses,
        (state): State => ({
            ...state,
            riskClasses: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),
    on(
        SharedActions.loadCarrierRiskClassesSuccess,
        (state, { riskClasses }): State => ({
            ...state,
            riskClasses: {
                status: AsyncStatus.SUCCEEDED,
                value: [...riskClasses],
                error: null,
            },
        }),
    ),
    on(
        SharedActions.loadCarrierRiskClassesFailure,
        (state, { error }): State => ({
            ...state,
            riskClasses: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #endregion

    // #region Cities
    on(
        SharedActions.loadConfigurations,
        (state, { configurationNameRegex }): State => ({
            ...state,
            rawConfigurationsEntities: rawConfigurationsEntityAdapter.setOne(
                {
                    identifiers: {
                        configurationNameRegex,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.rawConfigurationsEntities },
            ),
            configurationsEntities: configurationsEntityAdapter.setOne(
                {
                    identifiers: {
                        // Type assert for ConfigName since storing the regex string isn't a bad thing
                        configurationName: configurationNameRegex as ConfigName,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.configurationsEntities },
            ),
        }),
    ),
    on(
        SharedActions.loadConfigurationsSuccess,
        (state, { configurations }): State => ({
            ...state,
            rawConfigurationsEntities: rawConfigurationsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...configurations.identifiers,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...configurations.data],
                        error: null,
                    },
                },
                { ...state.rawConfigurationsEntities },
            ),
            configurationsEntities: configurationsEntityAdapter.setMany(
                configurations.data.map((configuration) => ({
                    identifiers: {
                        configurationName: configuration.name,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: configuration,
                        error: null,
                    },
                })),
                { ...state.configurationsEntities },
            ),
        }),
    ),
    on(
        SharedActions.loadConfigurationsFailure,
        (state, { error }): State => ({
            ...state,
            rawConfigurationsEntities: rawConfigurationsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...error.identifiers,
                    },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.rawConfigurationsEntities },
            ),
            configurationsEntities: configurationsEntityAdapter.setOne(
                {
                    identifiers: {
                        // Type assert for ConfigName since storing the regex string isn't a bad thing
                        configurationName: error.identifiers.configurationNameRegex as ConfigName,
                    },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.configurationsEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return sharedReducer(state, action);
}
