import { Action } from "@ngrx/store";

import * as SharedActions from "./shared.actions";
import { initialState, State } from "./shared.state";
import { reducer } from "./shared.reducer";

import { mockCountries, mockGenders, mockRiskClasses } from "./shared.mocks";
import { ApiError, AsyncStatus, EnrollmentMethod, Flow } from "@empowered/constants";

describe("Shared Reducer", () => {
    describe("setSelectedEnrollmentMethod action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
            };

            const action = SharedActions.setSelectedEnrollmentMethod({
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedCity action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedCity: "some city",
            };

            const action = SharedActions.setSelectedCity({ city: "some city" });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedFlow action", () => {
        it("should update the flow in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedFlow: Flow.DIRECT,
            };

            const action = SharedActions.setSelectedFlow({ flow: Flow.DIRECT });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedCountryState action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedCountryState: {
                    name: "some state",
                    abbreviation: "some abbr",
                },
            };

            const action = SharedActions.setSelectedCountryState({
                countryState: {
                    name: "some state",
                    abbreviation: "some abbr",
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCountryStates action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                countryStates: {
                    status: AsyncStatus.LOADING,
                },
            };

            const action = SharedActions.loadCountryStates();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCountryStatesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
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
            };

            const action = SharedActions.loadCountryStatesSuccess({
                countryStates: [
                    {
                        name: "some state",
                        abbreviation: "some abbr",
                    },
                ],
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("getCountryStatesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                countryStates: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: { message: "some api error message" } as ApiError,
                },
            };

            const action = SharedActions.loadCountryStatesFailure({
                error: { message: "some api error message" } as ApiError,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCities action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                citiesEntities: {
                    ids: ["some state"],
                    entities: {
                        "some state": {
                            identifiers: { stateAbbreviation: "some state" },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = SharedActions.loadCities({
                stateAbbreviation: "some state",
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCitiesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                citiesEntities: {
                    ids: ["some state"],
                    entities: {
                        "some state": {
                            identifiers: { stateAbbreviation: "some state" },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: ["some city name"],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = SharedActions.loadCitiesSuccess({
                cities: {
                    identifiers: {
                        stateAbbreviation: "some state",
                    },
                    data: ["some city name"],
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCitiesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                citiesEntities: {
                    ids: ["some state"],
                    entities: {
                        "some state": {
                            identifiers: { stateAbbreviation: "some state" },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = SharedActions.loadCitiesFailure({
                error: {
                    identifiers: {
                        stateAbbreviation: "some state",
                    },
                    data: { message: "some api error message" } as ApiError,
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCountries action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                countries: {
                    status: AsyncStatus.LOADING,
                },
            };

            const action = SharedActions.loadCountries();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCountriesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                countries: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockCountries,
                    error: null,
                },
            };

            const action = SharedActions.loadCountriesSuccess({ countries: mockCountries });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCountriesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                countries: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: { message: "some api error message" } as ApiError,
                },
            };

            const action = SharedActions.loadCountriesFailure({
                error: { message: "some api error message" } as ApiError,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getGenders action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                genders: {
                    status: AsyncStatus.LOADING,
                },
            };

            const action = SharedActions.loadGenders();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getGendersSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                genders: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockGenders,
                    error: null,
                },
            };

            const action = SharedActions.loadGendersSuccess({ genders: mockGenders });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getGendersFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                genders: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: { message: "some api error message" } as ApiError,
                },
            };

            const action = SharedActions.loadGendersFailure({
                error: { message: "some api error message" } as ApiError,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCarrierRiskClasses action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClasses: {
                    status: AsyncStatus.LOADING,
                },
            };

            const action = SharedActions.loadCarrierRiskClasses();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCarrierRiskClassesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClasses: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockRiskClasses,
                    error: null,
                },
            };

            const action = SharedActions.loadCarrierRiskClassesSuccess({ riskClasses: mockRiskClasses });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCarrierRiskClassesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClasses: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: { message: "some api error message" } as ApiError,
                },
            };

            const action = SharedActions.loadCarrierRiskClassesFailure({
                error: { message: "some api error message" } as ApiError,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("unknown action", () => {
        it("should return the previous state", () => {
            // type Unknown or empty object?
            const action = {
                type: "Unknown",
            } as Action;

            const result = reducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });
});
