import { AsyncData, ConfigName } from "@empowered/constants";
import { MemoizedSelector } from "@ngrx/store";

import { SharedActions, SharedSelectors } from "./ngrx-states/shared";

/**
 * Function used to check if shared values are stored by looking up an NGRX selector
 */
type AsyncDataSelectorFunction<Prop, Value> = (...props: Prop[]) => MemoizedSelector<object, AsyncData<Value>>;

/**
 * Record of known Shared Actions to Selectors.
 * Used to determine if api call has already been made and no further api calls need to be made
 */
export const sharedAsyncDataSelecters: Readonly<{
    // We can't add types to the generic for AsyncDataSelectorFunction in `sharedAsyncDataSelecters`'s type
    // To ensure type safety, the arguments of the actual Selectors will throw type errors as needed
    [actionType in SharedActions.ActionsUnion["type"]]?: AsyncDataSelectorFunction<any, any>;
}> = {
    [SharedActions.loadCountryStates.type]: () => SharedSelectors.getAllCountryStates,
    [SharedActions.loadCities.type]: (props: { stateAbbreviation?: string | null }) => SharedSelectors.getCities(props.stateAbbreviation),
    [SharedActions.loadCountries.type]: () => SharedSelectors.getAllCountries,
    [SharedActions.loadGenders.type]: () => SharedSelectors.getAllGenders,
    [SharedActions.loadCarrierRiskClasses.type]: () => SharedSelectors.getCarrierRiskClasses,
    [SharedActions.loadConfigurations.type]: (props: { configurationNameRegex: ConfigName | string }) =>
        SharedSelectors.getRawConfigurations(props.configurationNameRegex),
} as const;
