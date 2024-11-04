import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import {
    AsyncData,
    ConfigName,
    Configuration,
    ConfigurationDataType,
    EnrollmentMethod,
    RewriteConfigName,
    CountryState,
} from "@empowered/constants";
import { getAsyncDataFromEntitiesState, getEntityId, getIdleAsyncData, mapAsyncData } from "../../ngrx.store.helpers";
import { SHARED_FEATURE_KEY } from "./shared.reducer";
import { getProcessedConfigurationValue } from "../../services/configuration/configuration.service";
import { CitySetsEntities, ConfigurationsEntities, RawConfigurationsEntities, State } from "./shared.state";

export const getSharedFeatureState = createFeatureSelector<State>(SHARED_FEATURE_KEY);

export const getSelectedEnrollmentMethod = createSelector(
    getSharedFeatureState,
    // EnrollmentMethod is considered optional and should fallback to FACE_TO_FACE
    (state: State) => state.selectedEnrollmentMethod ?? EnrollmentMethod.FACE_TO_FACE,
);

export const getSelectedState = createSelector(getSharedFeatureState, (state: State) => state.selectedCountryState);

export const getSelectedStateAbbreviation = createSelector(
    getSelectedState,
    (countryState?: CountryState | null) => countryState?.abbreviation || null,
);

export const getSelectedCity = createSelector(getSharedFeatureState, (state: State) => state.selectedCity);

// selector to combine selected state and city
export const getSelectedStateAndCity = createSelector(
    getSelectedState,
    getSelectedCity,
    (countryState?: CountryState | null, city?: string | null) => ({
        countryState,
        city,
    }),
);

export const getSelectedEnrollmentMethodState = createSelector(
    getSelectedEnrollmentMethod,
    getSelectedState,
    getSelectedCity,
    (enrollmentMethod?: EnrollmentMethod | null, countryState?: CountryState | null, city?: string | null) => ({
        enrollmentMethod,
        countryState,
        city,
    }),
);

export const getSelectedHeadsetState = createSelector(getSharedFeatureState, (state: State) => state.selectedHeadsetState);

export const getSelectedHeadsetStateAndCity = createSelector(
    getSelectedHeadsetState,
    getSelectedCity,
    (countryState?: CountryState | null, city?: string | null) => ({
        countryState,
        city,
    }),
);

export const getSelectedFlow = createSelector(getSharedFeatureState, (state: State) => state.selectedFlow);

export const getAllCountryStates = createSelector(getSharedFeatureState, (state: State) => state.countryStates);

export const getCitySetsEntities = createSelector(getSharedFeatureState, (state: State) => state.citiesEntities);

const getCitiesFromEntities = (entitiesState: CitySetsEntities, stateAbbreviation?: string | null): AsyncData<string[]> => {
    if (!stateAbbreviation) {
        return getIdleAsyncData();
    }

    const id = getEntityId(stateAbbreviation);

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getCities = (stateAbbreviation?: string | null): MemoizedSelector<object, AsyncData<string[]>> =>
    createSelector(getCitySetsEntities, (entitiesState: CitySetsEntities) => getCitiesFromEntities(entitiesState, stateAbbreviation));

export const getSelectedCities: MemoizedSelector<object, AsyncData<string[]>> = createSelector(
    getCitySetsEntities,
    getSelectedState,
    (entitiesState: CitySetsEntities, countryState?: CountryState | null) =>
        getCitiesFromEntities(entitiesState, countryState?.abbreviation),
);

export const getAllCountries = createSelector(getSharedFeatureState, (state: State) => state.countries);

export const getAllGenders = createSelector(getSharedFeatureState, (state: State) => state.genders);

export const getCarrierRiskClasses = createSelector(getSharedFeatureState, (state: State) => state.riskClasses);

// Gets auto enrolled member id's
/**
 * @deprecated nothing to do with memberId / mpGroup should be used in shared lib
 */
export const getAutoEnrolledMembers = createSelector(getSharedFeatureState, (state: State) => state.autoEnrolledMembers);

export const getRawConfigurationsEntities = createSelector(getSharedFeatureState, (state: State) => state.rawConfigurationsEntities);

const getRawConfigurationsFromEntities = (
    entitiesState: RawConfigurationsEntities,
    configurationNameRegex: ConfigName | string,
): AsyncData<Configuration[]> => {
    const id = getEntityId(configurationNameRegex);

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getRawConfigurations = (configurationNameRegex: ConfigName | string): MemoizedSelector<object, AsyncData<Configuration[]>> =>
    createSelector(getRawConfigurationsEntities, (entitiesState: RawConfigurationsEntities) =>
        getRawConfigurationsFromEntities(entitiesState, configurationNameRegex),
    );

export const getConfigurationsEntities = createSelector(getSharedFeatureState, (state: State) => state.configurationsEntities);

const getConfigurationFromEntities = (entitiesState: ConfigurationsEntities, configurationName: ConfigName): AsyncData<Configuration> => {
    const id = getEntityId(configurationName);

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getConfiguration = (configurationName: ConfigName): MemoizedSelector<object, AsyncData<Configuration>> =>
    createSelector(getConfigurationsEntities, (entitiesState: ConfigurationsEntities) =>
        getConfigurationFromEntities(entitiesState, configurationName),
    );

export const getMandatoryRiderPlanIds = createSelector(
    getConfiguration(ConfigName.ENROLLMENT_MANDATORY_RIDER_ID),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getOffTheJobRiderPlanIdsForAU = createSelector(
    getConfiguration(ConfigName.ADDITIONAL_UNIT_OFFTHEJOB_RIDER_PLAN_IDS),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getOffTheJobRiderCoverageLevelIdsForAU = createSelector(
    getConfiguration(ConfigName.ADDITIONAL_UNIT_OFFTHEJOB_RIDER_COVERAGE_LEVEL_IDS),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getAddOnRiderPlanIds = createSelector(
    getConfiguration(ConfigName.HIDE_PLAN_OPTIONS_FOR_ADD_ON_RIDERS),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getSpouseExceptionRiderPlanIds = createSelector(
    getConfiguration(ConfigName.SPOUSE_RIDER_CRITICAL_ILLNESS),
    (configurationData: AsyncData<Configuration>) =>
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getProductIdsForAdditionalUnit = createSelector(
    getConfiguration(ConfigName.SHOP_ADDITIONAL_UNIT_PRODUCT_IDS),
    (configurationData: AsyncData<Configuration>) =>
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

export const getRiderBrokerPlanIds = createSelector(
    getConfiguration(ConfigName.MATCH_BASE_PLAN_READONLY_RIDER_IDS),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_INTEGER>),
        ),
);

// Get the config data for buy up plans
export const getProductIdForBuyUpPlan = createSelector(
    getConfiguration(ConfigName.SHOP_BUY_UP_PRODUCT_ID),
    (configurationData: AsyncData<Configuration>) =>
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.INTEGER>),
        ),
);

// Get the config data for enabling tobacco status in more settings
export const getTobaccoConfigValue = createSelector(
    getConfiguration(ConfigName.SHOPPING_PRICING_UPDATE_TOBACCO_STATUS),
    (configurationData: AsyncData<Configuration>) =>
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.BOOLEAN>),
        ),
);

export const getEmployerContributionExcludedStates = createSelector(
    // TODO [Types]: EMPLOYER_CONTRIBUTION_EXCLUDED_STATES ConfigName doesn't exist yet in constants lib,
    // This ConfigName should be added then refactor to remove special ConfigNames specific to rewrite
    getConfiguration(RewriteConfigName.EMPLOYER_CONTRIBUTION_EXCLUDED_STATES as string as ConfigName),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_STRING>),
        ),
);

// Selector to get the chileMaxAgeInYears using config
export const getChildMaxAgeInYears = createSelector(
    // TODO [Types]: CHILD_MAX_AGE_IN_YEARS ConfigName doesn't exist yet in constants lib,
    // This ConfigName should be added then refactor to remove special ConfigNames specific to rewrite
    getConfiguration(RewriteConfigName.CHILD_MAX_AGE_IN_YEARS as string as ConfigName),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.INTEGER>),
        ),
);

// Selector to get the chileMinAgeInDays using config
export const getChildMinAgeInDays = createSelector(
    // TODO [Types]: CHILD_MIN_AGE_IN_DAYS ConfigName doesn't exist yet in constants lib,
    // This ConfigName should be added then refactor to remove special ConfigNames specific to rewrite
    getConfiguration(RewriteConfigName.CHILD_MIN_AGE_IN_DAYS as string as ConfigName),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.INTEGER>),
        ),
);

// Selector to get the dependentAgeRange
export const getDependentAgeRange: MemoizedSelector<object, AsyncData<number[]>> = createSelector(
    getChildMaxAgeInYears,
    (dependentMaxAgeInYearsData: AsyncData<number>): AsyncData<number[]> =>
        mapAsyncData(dependentMaxAgeInYearsData, ({ value: dependentMaxAgeInYears }) =>
            Array(dependentMaxAgeInYears + 1)
                .fill(null)
                .map((_, i) => i),
        ),
);

export const getNewShopPageIsAlwaysEnabled = createSelector(
    // TODO [Types]: NEW_SHOP_ENABLED ConfigName doesn't exist yet in constants lib,
    // This ConfigName should be added then refactor to remove special ConfigNames specific to rewrite
    getConfiguration(RewriteConfigName.NEW_SHOP_ENABLED as string as ConfigName),
    (configurationData: AsyncData<Configuration>) =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.BOOLEAN>),
        ),
);

export const getNewShopPagePilotUsers = createSelector(
    // TODO [Types]: NEW_SHOP_ENABLED_PILOT_USERS ConfigName doesn't exist yet in constants lib,
    // This ConfigName should be added then refactor to remove special ConfigNames specific to rewrite
    getConfiguration(RewriteConfigName.NEW_SHOP_ENABLED_PILOT_USERS as string as ConfigName),
    (configurationData: AsyncData<Configuration>): AsyncData<number[]> =>
        // We need to type assertion for the specific type,
        // since its type is determined at runtime and there's no record for what is the actual expected type
        mapAsyncData(configurationData, ({ value: config }) => {
            // `general.broker.feature.new_shop.enabled.pilot_users` config can return null even though it is of type `LIST_INTEGER`
            // When this happens, we can treat the config as if it is empty (always navigate users to old shop)
            if (config.value === "null") {
                return [];
            }

            return getProcessedConfigurationValue(config as Configuration<ConfigurationDataType.LIST_INTEGER>);
        }),
);

export const getTLWLSpouseRiderIds = createSelector(
    getConfiguration(ConfigName.RATE_SHEET_TERM_WHOLE_LIFE_SPOUSE_RIDER),
    (configurationData: AsyncData<Configuration>) =>
        mapAsyncData(configurationData, ({ value }) =>
            getProcessedConfigurationValue(value as Configuration<ConfigurationDataType.LIST_STRING>),
        ),
);
