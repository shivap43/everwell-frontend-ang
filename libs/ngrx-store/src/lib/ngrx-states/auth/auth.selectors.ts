import { AsyncData, AsyncStatus, Credential } from "@empowered/constants";
import { getLoadingAsyncData } from "../../ngrx.store.helpers";
import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { AUTH_FEATURE_KEY } from "./auth.reducer";
import { State } from "./auth.state";

// Lookup the 'Auth' feature state managed by NgRx
export const getAuthFeatureState = createFeatureSelector<State>(AUTH_FEATURE_KEY);

export const selectUserCredential: MemoizedSelector<object, AsyncData<Credential | null>> = createSelector(
    getAuthFeatureState,
    (state: State) => state.user,
);

export const selectIsAuthenticated = createSelector(selectUserCredential, (userData: AsyncData<Credential | null>) => {
    if (userData.status === AsyncStatus.LOADING) {
        return getLoadingAsyncData();
    }

    return { value: !!userData.value, status: AsyncStatus.SUCCEEDED, error: null };
});
