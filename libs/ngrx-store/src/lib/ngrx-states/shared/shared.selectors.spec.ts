import { initialState } from "./shared.state";
import * as SharedSelectors from "./shared.selectors";
import { mockCountries, mockGenders, mockRiskClasses } from "./shared.mocks";
import { SharedPartialState, SHARED_FEATURE_KEY } from "./shared.reducer";
import { AsyncStatus, EnrollmentMethod, Flow } from "@empowered/constants";

describe("Shared Selectors", () => {
    let state: SharedPartialState;

    beforeEach(() => {
        state = {
            [SHARED_FEATURE_KEY]: {
                ...initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                selectedCity: "some city",
                selectedFlow: Flow.DIRECT,
                selectedCountryState: {
                    name: "some state",
                    abbreviation: "some abbr",
                },
                countryStates: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            name: "some state",
                            abbreviation: "some abbr",
                        },
                    ],
                    error: null,
                },
                citiesEntities: {
                    ids: ["some abbr"],
                    entities: {
                        "some abbr": {
                            identifiers: {
                                stateAbbreviation: "some abbr",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: ["some city name"],
                                error: null,
                            },
                        },
                    },
                },
                countries: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockCountries,
                    error: null,
                },
                genders: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockGenders,
                    error: null,
                },
                riskClasses: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockRiskClasses,
                    error: null,
                },
            },
        };
    });

    describe("getSelectedEnrollmentMethod", () => {
        it("should default to FACE_TO_FACE if no EnrollmentMethod is selected", () => {
            const result = SharedSelectors.getSelectedEnrollmentMethod({
                ...state,
                [SHARED_FEATURE_KEY]: {
                    selectedEnrollmentMethod: null,
                },
            });

            expect(result).toBe(EnrollmentMethod.FACE_TO_FACE);
        });

        it("should get selected EnrollmentMethod", () => {
            const result = SharedSelectors.getSelectedEnrollmentMethod(state);

            expect(result).toBe(EnrollmentMethod.FACE_TO_FACE);
        });
    });

    describe("getSelectedState", () => {
        it("should get selected CountryState", () => {
            const result = SharedSelectors.getSelectedState(state);

            expect(result).toStrictEqual({
                name: "some state",
                abbreviation: "some abbr",
            });
        });
    });

    describe("getSelectedStateAbbreviation", () => {
        it("should get selected CountryState", () => {
            const result = SharedSelectors.getSelectedStateAbbreviation(state);

            expect(result).toBe("some abbr");
        });
    });

    describe("getSelectedCity", () => {
        it("should get selected CountryState", () => {
            const result = SharedSelectors.getSelectedCity(state);

            expect(result).toBe("some city");
        });
    });

    describe("getSelectedFlow", () => {
        it("should get Selected Flow", () => {
            const result = SharedSelectors.getSelectedFlow(state);

            expect(result).toBe(Flow.DIRECT);
        });
    });

    describe("getAllCountryStates", () => {
        it("should get CountryStates", () => {
            const result = SharedSelectors.getAllCountryStates(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        name: "some state",
                        abbreviation: "some abbr",
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedCities", () => {
        it("should get Cities", () => {
            const result = SharedSelectors.getSelectedCities(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: ["some city name"],
                error: null,
            });
        });
    });

    describe("getAllCountries", () => {
        it("should get Countries", () => {
            const result = SharedSelectors.getAllCountries(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: mockCountries,
                error: null,
            });
        });
    });

    describe("getAllGenders", () => {
        it("should get Genders", () => {
            const result = SharedSelectors.getAllGenders(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: mockGenders,
                error: null,
            });
        });
    });

    describe("getCarrierRiskClasses", () => {
        it("should get RiskClasses", () => {
            const result = SharedSelectors.getCarrierRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: mockRiskClasses,
                error: null,
            });
        });
    });
});
