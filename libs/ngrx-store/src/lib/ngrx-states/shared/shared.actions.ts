import { createAction, props, union } from "@ngrx/store";
import {
    ConfigName,
    Configuration,
    EnrollmentMethod,
    Flow,
    RawConfigurationsEntity,
    ApiError,
    RiskClass,
    CountryState,
    Gender,
} from "@empowered/constants";

import { CitiesEntity } from "./shared.model";

// https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getEnrollmentMethods
// TODO [Enrollment Method]: EnrollmentMethodDetail.name should be: Enum:
// "SELF_SERVICE" "FACE_TO_FACE" "VIRTUAL_FACE_TO_FACE" "HEADSET" "CALL_CENTER"
export const setSelectedEnrollmentMethod = createAction(
    "[Enrollments] Set Selected EnrollmentMethod",
    props<{ enrollmentMethod: EnrollmentMethod }>(),
);

// Sets Member id under auto enrolled members list
/**
 * TODO [Auto Enrolled Plans]: Anything to do with memberId / mpGroup should NOT be used in shared lib.
 * This is because Shared store is cached and long term plan is that logging out will not clear out Shared store.
 * If there's a reason for this, this action should be commented and possibly better named.
 * We need a way to distingush between localStorage and sessionStorage caching
 *
 * e.g: membersHaveAcceptedAutoEnrolledPlans
 */
export const setMemberAsAutoEnrolled = createAction("[Enrollments] set Member As AutoEnrolled", props<{ memberId: number }>());

// #region States
export const setSelectedCountryState = createAction("[Shared] Set Selected State", props<{ countryState: CountryState }>());
export const setSelectedEnrollmentMethodAndCountryState = createAction(
    "[Shared] Set Selected EnrollmentMethod and State",
    props<{ enrollmentMethod: EnrollmentMethod; countryState: CountryState }>(),
);

export const loadCountryStates = createAction("[Shared/Static API] Get Country States");

export const loadCountryStatesSuccess = createAction(
    "[Shared/Static API] Get Country States Success",
    props<{ countryStates: CountryState[] }>(),
);

export const loadCountryStatesFailure = createAction("[Shared/Static API] Get Country States Failure", props<{ error: ApiError }>());
// #endregion

// #region Cities
export const loadCities = createAction("[Shared/Static API] Get Cities", props<{ stateAbbreviation: string }>());
export const loadCitiesSuccess = createAction("[Shared/Static API] Get Cities Success", props<{ cities: CitiesEntity<string[]> }>());
export const loadCitiesFailure = createAction("[Shared/Static API] Get Cities Failure", props<{ error: CitiesEntity<ApiError> }>());

export const setSelectedCity = createAction("[Shared] Set Selected City", props<{ city: string }>());

export const setSelectedCountryStateAndCity = createAction(
    "[Shared] Set Selected State and City",
    props<{ countryState: CountryState; city: string }>(),
);
export const setSelectedEnrollmentMethodAndCountryStateAndCity = createAction(
    "[Shared] Set Selected EnrollmentMethod and State and City",
    props<{ enrollmentMethod: EnrollmentMethod; countryState: CountryState; city: string }>(),
);

export const setSelectedHeadsetState = createAction("[Shared] Set Selected Headset State", props<{ headsetCountryState: CountryState }>());

export const setSelectedHeadsetStateAndCity = createAction(
    "[Shared] Set Selected Headset State and City",
    props<{ headsetCountryState: CountryState; city: string }>(),
);

export const setSelectedEnrollmentMethodAndHeadsetStateAndCity = createAction(
    "[Shared] Set Selected Enrollment Method and Headset State and City",
    props<{ enrollmentMethod: EnrollmentMethod; headsetCountryState: CountryState; city: string }>(),
);

export const setSelectedEnrollmentMethodState = createAction(
    "[Shared] Set Selected Enrollment Method State",
    props<{
        enrollmentMethod: EnrollmentMethod;
        countryState: CountryState;
        city: string;
        headsetCountryState: CountryState;
    }>(),
);
// #endregion

// #region Direct/Payroll
export const setSelectedFlow = createAction("[Shared] Set Selected Flow", props<{ flow: Flow }>());
// #endregion

// #region Countires
export const loadCountries = createAction("[Shared/Static API] Get countries");
export const loadCountriesSuccess = createAction("[Shared/Static API] Get countries Success", props<{ countries: string[] }>());
export const loadCountriesFailure = createAction("[Shared/Static API] Get countries Failure", props<{ error: ApiError }>());
// #endregion

// #region Genders
export const loadGenders = createAction("[Shared/Static API] Get Genders");
export const loadGendersSuccess = createAction("[Shared/Static API] Get Genders Success", props<{ genders: Gender[] }>());
export const loadGendersFailure = createAction("[Shared/Static API] Get Genders Failure", props<{ error: ApiError }>());
// #endregion

// #region CarrierRiskClasses
export const loadCarrierRiskClasses = createAction("[Shared/Core API] Get Carrier Risk Classes");
export const loadCarrierRiskClassesSuccess = createAction(
    "[Shared/Core API] Get Carrier Risk Classes Success",
    props<{ riskClasses: RiskClass[] }>(),
);
export const loadCarrierRiskClassesFailure = createAction(
    "[Shared/Core API] Get Carrier Risk Classes Failure",
    props<{ error: ApiError }>(),
);
// #endregion

// #region config
/**
 * configurationNameRegex can be a ConfigName (which should fetch a single Configuration)
 * configurationNameRegex can also use regex to fetch multiple Configurations at the same time:
 *
 * `general.data.sic_code_min` => `[{ name: 'general.data.sic_code_min', value: 10, dataType: 'INTEGER' }]`
 *
 * `general.data.*` =>
 *     `[{ name: 'general.data.sic_code_min', value: 10, dataType: 'INTEGER' },
 *      { name: 'general.data.sic_code_max', value: 50, dataType: 'INTEGER' }]`
 */
export const loadConfigurations = createAction(
    "[Shared/Static API] Get Configurations",
    props<{ configurationNameRegex: ConfigName | string }>(),
);
export const loadConfigurationsSuccess = createAction(
    "[Shared/Static API] Get Configurations Success",
    props<{ configurations: RawConfigurationsEntity<Configuration[]> }>(),
);
export const loadConfigurationsFailure = createAction(
    "[Shared/Static API] Get Configurations Failure",
    props<{ error: RawConfigurationsEntity<ApiError> }>(),
);
// #endregion

const actions = union({
    setSelectedEnrollmentMethod,
    setMemberAsAutoEnrolled,
    setSelectedCountryState,
    setSelectedCity,
    setSelectedFlow,

    loadCountryStates,
    loadCountryStatesSuccess,
    loadCountryStatesFailure,

    loadCities,
    loadCitiesSuccess,
    loadCitiesFailure,

    loadCountries,
    loadCountriesSuccess,
    loadCountriesFailure,

    loadGenders,
    loadGendersSuccess,
    loadGendersFailure,

    loadCarrierRiskClasses,
    loadCarrierRiskClassesSuccess,
    loadCarrierRiskClassesFailure,

    loadConfigurations,
    loadConfigurationsSuccess,
    loadConfigurationsFailure,
});

export type ActionsUnion = typeof actions;
