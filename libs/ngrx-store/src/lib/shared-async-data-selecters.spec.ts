import { AsyncData, ConfigName, Configuration } from "@empowered/constants";
import { MemoizedSelector } from "@ngrx/store";
import { SharedActions, SharedSelectors } from "./ngrx-states/shared";
import { sharedAsyncDataSelecters } from "./store.constant";

describe("sharedAsyncDataSelecters", () => {
    it("should map to SharedSelectors.getAllCountryStates for SharedActions.loadCountryStates action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadCountryStates.type];

        expect(selectorGenerator?.()).toBe(SharedSelectors.getAllCountryStates);
    });

    it("should map to SharedSelectors.getCities for SharedActions.loadCities action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadCities.type];
        const mockSelector: { stateAbbreviation?: string | null } = { stateAbbreviation: null };
        const spy = jest.spyOn(SharedSelectors, "getCities").mockImplementationOnce((stateAbbreviation?: string | null) => {
            mockSelector.stateAbbreviation = stateAbbreviation;

            // eslint-disable-next-line @typescript-eslint/ban-types
            return mockSelector as MemoizedSelector<object, AsyncData<string[]>>;
        });

        expect(selectorGenerator?.({ stateAbbreviation: "AZ" })).toBe(mockSelector);
        expect(spy).toBeCalledWith("AZ");
    });

    it("should map to SharedSelectors.getAllCountries for SharedActions.loadCountries action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadCountries.type];

        expect(selectorGenerator?.()).toBe(SharedSelectors.getAllCountries);
    });

    it("should map to SharedSelectors.getAllGenders for SharedActions.loadGenders action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadGenders.type];

        expect(selectorGenerator?.()).toBe(SharedSelectors.getAllGenders);
    });

    it("should map to SharedSelectors.getCarrierRiskClasses for SharedActions.loadCarrierRiskClasses action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadCarrierRiskClasses.type];

        expect(selectorGenerator?.()).toBe(SharedSelectors.getCarrierRiskClasses);
    });

    it("should map to SharedSelectors.getRawConfigurations for SharedActions.loadConfigurations action", () => {
        const selectorGenerator = sharedAsyncDataSelecters[SharedActions.loadConfigurations.type];
        const mockSelector: { configurationNameRegex?: ConfigName | string | null } = { configurationNameRegex: null };
        const spy = jest
            .spyOn(SharedSelectors, "getRawConfigurations")
            .mockImplementationOnce((configurationNameRegex: ConfigName | string) => {
                mockSelector.configurationNameRegex = configurationNameRegex;

                // eslint-disable-next-line @typescript-eslint/ban-types
                return mockSelector as MemoizedSelector<object, AsyncData<Configuration[]>>;
            });

        expect(selectorGenerator?.({ configurationNameRegex: "some config name" })).toBe(mockSelector);
        expect(spy).toBeCalledWith("some config name");
    });
});
