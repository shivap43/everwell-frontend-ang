import { createAction, props, union } from "@ngrx/store";
import { ApiError, Credential } from "@empowered/constants";

// #region login
export const login = createAction("[Auth API] Login", props<{ portal: string; loginDetails: { password: string; username: string } }>());
export const loginSuccess = createAction("[Auth API] Login Successful", props<{ user: Credential }>());
export const loginFailure = createAction("[Auth API] Login Failure", props<{ error: ApiError }>());
// #endregion

// #region logout
export const logout = createAction("[Auth API] Logout");
export const logoutSuccess = createAction("[Auth API] Logout Successful");
// #endregion

const actions = union({
    login,
    loginSuccess,
    loginFailure,

    logout,
    logoutSuccess,
});

export type ActionsUnion = typeof actions;
