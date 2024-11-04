import { Action } from "@ngrx/store";
import { Credential, ApiError } from "@empowered/constants";
import * as AuthActions from "./auth.actions";
import { State, initialState } from "./auth.state";
import { reducer } from "./auth.reducer";
import { AsyncStatus } from "@empowered/constants";

describe("Auth Reducer", () => {
    describe("login action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                user: {
                    status: AsyncStatus.LOADING,
                    value: null,
                },
            };

            const action = AuthActions.login({
                portal: "some portal",
                loginDetails: { password: "some password", username: "some username" },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loginSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                user: {
                    status: AsyncStatus.SUCCEEDED,
                    value: { id: 111, type: "some type" } as Credential,
                    error: null,
                },
            };

            const action = AuthActions.loginSuccess({ user: { id: 111, type: "some type" } as Credential });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loginFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                user: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: { message: "some error" } as ApiError,
                },
            };

            const action = AuthActions.loginFailure({ error: { message: "some error" } as ApiError });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("logout action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                user: {
                    status: AsyncStatus.LOADING,
                    value: null,
                },
            };

            const action = AuthActions.logout();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("logoutSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                user: {
                    status: AsyncStatus.SUCCEEDED,
                    value: null,
                    error: null,
                },
            };

            const action = AuthActions.logoutSuccess();

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

            expect(result).toBe(initialState);
        });
    });
});
