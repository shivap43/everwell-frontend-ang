import { createReducer, on, Action } from "@ngrx/store";
import { GroupAttribute, GroupAttributeRecord } from "./accounts.model";
import * as AccountsActions from "./accounts.actions";
import {
    accountAdminsEntityAdapter,
    accountEntityAdapter,
    dualPeoRiskClassIdsSetsEntityAdapter,
    exceptionsEntityAdapter,
    getAccountEntityId,
    groupAttributeRecordEntityAdapter,
    initialState,
    payFrequenciesEntitiesAdapter,
    riskClassesEntityAdapter,
    State,
} from "./accounts.state";
import { AsyncStatus, GroupAttributeName } from "@empowered/constants";

export const ACCOUNTS_FEATURE_KEY = "accounts";

export interface AccountsPartialState {
    readonly [ACCOUNTS_FEATURE_KEY]: State;
}

const accountsReducer = createReducer(
    initialState,

    on(AccountsActions.setDirect, (state, { direct }): State => ({ ...state, direct })),

    // Set which mpGroup is associated with the currently selected Account
    // and all related instances such as PayFrequencies
    on(AccountsActions.setSelectedMPGroup, (state, { mpGroup }): State => ({ ...state, selectedMPGroup: mpGroup })),

    // #region Accounts
    on(
        AccountsActions.loadAccount,
        (state, { mpGroup }): State => ({
            ...state,
            accountEntities: accountEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.accountEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadAccountSuccess,
        (state, { accountsEntity }): State => ({
            ...state,
            accountEntities: accountEntityAdapter.setOne(
                {
                    identifiers: { ...accountsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: accountsEntity.data,
                        error: null,
                    },
                },
                { ...state.accountEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadAccountFailure,
        (state, { error }): State => ({
            ...state,
            accountEntities: accountEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.accountEntities },
            ),
        }),
    ),
    // #endregion

    // #region PayFrequencies
    on(
        AccountsActions.loadPayFrequencies,
        (state, { mpGroup }): State => ({
            ...state,
            payFrequenciesEntities: payFrequenciesEntitiesAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.payFrequenciesEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadPayFrequenciesSuccess,
        (state, { payFrequenciesEntity }): State => ({
            ...state,
            payFrequenciesEntities: payFrequenciesEntitiesAdapter.setOne(
                {
                    identifiers: { ...payFrequenciesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: payFrequenciesEntity.data,
                        error: null,
                    },
                },
                { ...state.payFrequenciesEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadPayFrequenciesFailure,
        (state, { error }): State => ({
            ...state,
            payFrequenciesEntities: payFrequenciesEntitiesAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.payFrequenciesEntities },
            ),
        }),
    ),
    // #endregion

    // #region GroupAttributeSets
    on(AccountsActions.loadGroupAttributeRecord, (state, { mpGroup }): State => {
        // Get entity id from incoming groupAttributeRecordEntity
        const entityId = getAccountEntityId({ mpGroup });

        // Store existing groupAttributeRecordEntity's groupAttributeRecord
        const existingGroupAttributeRecord: GroupAttributeRecord | null =
            state.groupAttributeRecordEntities.entities[entityId]?.data?.value ?? null;

        return {
            ...state,
            groupAttributeRecordEntities: groupAttributeRecordEntityAdapter.upsertOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                        value: existingGroupAttributeRecord ?? null,
                        error: null,
                    },
                },
                { ...state.groupAttributeRecordEntities },
            ),
        };
    }),
    on(AccountsActions.loadGroupAttributeRecordSuccess, (state, { groupAttributeRecordEntity }): State => {
        // Get entity id from incoming groupAttributeRecordEntity
        const entityId = getAccountEntityId(groupAttributeRecordEntity.identifiers);

        // Store existing groupAttributeRecordEntity's groupAttributeRecord
        const existingGroupAttributeRecord: GroupAttributeRecord | null =
            state.groupAttributeRecordEntities.entities[entityId]?.data?.value ?? null;

        // Iterate over values of incoming
        const entries = Object.entries(groupAttributeRecordEntity.data) as [
            GroupAttributeName,
            GroupAttribute<GroupAttributeName> | null,
        ][];

        const groupAttributeRecord: GroupAttributeRecord = entries.reduce(
            (record, [key, value]) => {
                // Merge entry into existing record
                record[key] = value;

                return record;
            },
            { ...(existingGroupAttributeRecord ?? {}) },
        );

        return {
            ...state,
            groupAttributeRecordEntities: groupAttributeRecordEntityAdapter.upsertOne(
                {
                    identifiers: { ...groupAttributeRecordEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: groupAttributeRecord,
                        error: null,
                    },
                },
                { ...state.groupAttributeRecordEntities },
            ),
        };
    }),
    on(
        AccountsActions.loadGroupAttributeRecordFailure,
        (state, { error }): State => ({
            ...state,
            groupAttributeRecordEntities: groupAttributeRecordEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.groupAttributeRecordEntities },
            ),
        }),
    ),
    // #endregion

    // #region RiskClasses
    on(
        AccountsActions.loadRiskClasses,
        (state, { mpGroup }): State => ({
            ...state,
            riskClassesEntities: riskClassesEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.riskClassesEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadRiskClassesSuccess,
        (state, { riskClassesEntity }): State => ({
            ...state,
            riskClassesEntities: riskClassesEntityAdapter.setOne(
                {
                    identifiers: { ...riskClassesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: riskClassesEntity.data,
                        error: null,
                    },
                },
                { ...state.riskClassesEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadRiskClassesFailure,
        (state, { error }): State => ({
            ...state,
            riskClassesEntities: riskClassesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.riskClassesEntities },
            ),
        }),
    ),
    // #endregion

    // #region DualPeoRiskClassIdsSets
    on(
        AccountsActions.loadDualPeoRiskClassIdsSet,
        (state, { mpGroup }): State => ({
            ...state,
            dualPeoRiskClassIdsSetsEntities: dualPeoRiskClassIdsSetsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.dualPeoRiskClassIdsSetsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadDualPeoRiskClassIdsSetSuccess,
        (state, { dualPeoRiskClassIdsSetsEntity }): State => ({
            ...state,
            dualPeoRiskClassIdsSetsEntities: dualPeoRiskClassIdsSetsEntityAdapter.setOne(
                {
                    identifiers: { ...dualPeoRiskClassIdsSetsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: dualPeoRiskClassIdsSetsEntity.data,
                        error: null,
                    },
                },
                { ...state.dualPeoRiskClassIdsSetsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadDualPeoRiskClassIdsSetFailure,
        (state, { error }): State => ({
            ...state,
            dualPeoRiskClassIdsSetsEntities: dualPeoRiskClassIdsSetsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.dualPeoRiskClassIdsSetsEntities },
            ),
        }),
    ),
    // #endregion

    // #region ExceptionSets
    on(
        AccountsActions.loadExceptions,
        (state, { mpGroup, exceptionType }): State => ({
            ...state,
            exceptionsEntities: exceptionsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, exceptionType },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.exceptionsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadExceptionsSuccess,
        (state, { exceptionsEntity }): State => ({
            ...state,
            exceptionsEntities: exceptionsEntityAdapter.setOne(
                {
                    identifiers: { ...exceptionsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: exceptionsEntity.data,
                        error: null,
                    },
                },
                { ...state.exceptionsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadExceptionsFailure,
        (state, { error }): State => ({
            ...state,
            exceptionsEntities: exceptionsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.exceptionsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadAccountAdmins,
        (state, action): State => ({
            ...state,
            accountAdminsEntities: accountAdminsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup: action.mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.accountAdminsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadAccountAdminsSuccess,
        (state, { accountAdminsEntity }): State => ({
            ...state,
            accountAdminsEntities: accountAdminsEntityAdapter.setOne(
                {
                    identifiers: { ...accountAdminsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...accountAdminsEntity.data],
                        error: null,
                    },
                },
                { ...state.accountAdminsEntities },
            ),
        }),
    ),
    on(
        AccountsActions.loadAccountAdminsFailure,
        (state, { error }): State => ({
            ...state,
            accountAdminsEntities: accountAdminsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.accountAdminsEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return accountsReducer(state, action);
}
