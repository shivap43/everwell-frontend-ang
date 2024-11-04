import { Credential } from "@empowered/constants";
import { initialState } from "./auth.state";
import * as AuthSelectors from "./auth.selectors";
import { AuthPartialState, AUTH_FEATURE_KEY } from "./auth.reducer";
import { getLoadingAsyncData } from "../../ngrx.store.helpers";
import { AsyncStatus } from "@empowered/constants";

describe("Auth Selectors", () => {
    let state: AuthPartialState;

    beforeEach(() => {
        state = {
            [AUTH_FEATURE_KEY]: {
                ...initialState,
                user: {
                    status: AsyncStatus.SUCCEEDED,
                    value: { id: 111, type: "some type" } as Credential,
                    error: null,
                },
            },
        };
    });

    describe("selectUserCredential", () => {
        it("should return user from state", () => {
            const result = AuthSelectors.selectUserCredential(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { id: 111, type: "some type" } as Credential,
                error: null,
            });
        });
    });

    describe("selectIsAuthenticated", () => {
        it("should get LOADING AsyncData if userData is still loading", () => {
            const result = AuthSelectors.selectIsAuthenticated({
                ...state,
                [AUTH_FEATURE_KEY]: {
                    ...state[AUTH_FEATURE_KEY],
                    user: {
                        status: AsyncStatus.LOADING,
                    },
                },
            });

            expect(result).toStrictEqual(getLoadingAsyncData());
        });

        it("should return true if user exists in state", () => {
            const result = AuthSelectors.selectIsAuthenticated(state);

            expect(result).toStrictEqual({ status: AsyncStatus.SUCCEEDED, value: true, error: null });
        });
    });
});
