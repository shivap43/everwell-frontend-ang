import { createReducer, on, Action } from "@ngrx/store";
import { initialState, State } from "./auth.state";
import * as AuthActions from "./auth.actions";
import { AsyncStatus } from "@empowered/constants";

export const AUTH_FEATURE_KEY = "auth";

export interface AuthPartialState {
    readonly [AUTH_FEATURE_KEY]: State;
}

const authReducer = createReducer(
    initialState,

    // #region login
    on(
        AuthActions.login,
        (state): State => ({
            ...state,
            user: {
                status: AsyncStatus.LOADING,
                value: null,
            },
        }),
    ),
    on(
        AuthActions.loginSuccess,
        (state, { user }): State => ({
            ...state,
            user: {
                status: AsyncStatus.SUCCEEDED,
                value: user,
                error: null,
            },
        }),
    ),
    on(
        AuthActions.loginFailure,
        (state, { error }): State => ({
            ...state,
            user: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #endregion

    // #region logout
    on(
        AuthActions.logout,
        (state): State => ({
            ...state,
            user: {
                status: AsyncStatus.LOADING,
                value: null,
            },
        }),
    ),
    on(
        AuthActions.logoutSuccess,
        (state): State => ({
            ...state,
            user: {
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            },
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return authReducer(state, action);
}
