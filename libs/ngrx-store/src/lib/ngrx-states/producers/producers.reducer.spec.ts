import { ProducerInformation } from "@empowered/api";
import { AsyncStatus, ApiError } from "@empowered/constants";
import { Action } from "@ngrx/store";

import * as ProducersActions from "./producers.actions";
import { reducer } from "./producers.reducer";
import { State, initialState } from "./producers.state";

describe("Producers Reducer", () => {
    describe("setSelectedProducerId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedProducerId: 444,
            };

            const action = ProducersActions.setSelectedProducerId({ producerId: 444 });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProducerInformation action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                producerInformationsEntities: {
                    ids: [222],
                    entities: {
                        222: {
                            identifiers: {
                                producerId: 222,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadProducerInformation({ producerId: 222 });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProducerInformationSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                producerInformationsEntities: {
                    ids: [222],
                    entities: {
                        222: {
                            identifiers: {
                                producerId: 222,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { licenses: [], carrierAppointments: [] } as ProducerInformation,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadProducerInformationSuccess({
                producerInformationsEntity: {
                    identifiers: {
                        producerId: 222,
                    },
                    data: { licenses: [], carrierAppointments: [] } as ProducerInformation,
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProducerInformationFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                producerInformationsEntities: {
                    ids: [222],
                    entities: {
                        222: {
                            identifiers: {
                                producerId: 222,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadProducerInformationFailure({
                error: {
                    identifiers: {
                        producerId: 222,
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

    describe("loadAllProducersLicensedStateSet action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                licensedStateSetsEntities: {
                    ids: [333],
                    entities: {
                        333: {
                            identifiers: {
                                mpGroup: 333,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadAllProducersLicensedStateSet({ mpGroup: 333 });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadAllProducersLicensedStateSetSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                licensedStateSetsEntities: {
                    ids: [333],
                    entities: {
                        333: {
                            identifiers: {
                                mpGroup: 333,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ abbreviation: "some abbr", name: "some name" }],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadAllProducersLicensedStateSetSuccess({
                licensedStateSetsEntity: {
                    identifiers: {
                        mpGroup: 333,
                    },
                    data: [{ abbreviation: "some abbr", name: "some name" }],
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadAllProducersLicensedStateSetFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                licensedStateSetsEntities: {
                    ids: [222],
                    entities: {
                        222: {
                            identifiers: {
                                mpGroup: 222,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ProducersActions.loadAllProducersLicensedStateSetFailure({
                error: {
                    identifiers: {
                        mpGroup: 222,
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

    describe("unknown action", () => {
        it("should return the previous state", () => {
            const action = {
                type: "Unknown",
            } as Action;

            const result = reducer(initialState, action);

            // Expected for state to not change when using an unknown action
            expect(result).toBe(initialState);
        });
    });
});
