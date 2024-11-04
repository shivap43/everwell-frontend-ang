import { Account, AsyncData, PayFrequency, RiskClass, Exceptions, Admin } from "@empowered/constants";
import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";

import { getEntityId } from "../../ngrx.store.helpers";
import {
    AccountEntity,
    AccountIdentifiers,
    GroupAttributeRecord,
    DualPeoRiskClassIdsSet,
    ExceptionsIdentifiers,
    ExceptionsEntity,
    AccountAdminsIdentifiers,
    AccountAdminEntity,
} from "./accounts.model";

export const getAccountEntityId = ({ mpGroup }: AccountIdentifiers) => mpGroup;
export const getExceptionsEntityId = ({ mpGroup, exceptionType }: ExceptionsIdentifiers) => getEntityId(mpGroup, exceptionType);

// #region Accounts State
export const accountEntityAdapter: EntityAdapter<AccountEntity<AsyncData<Account>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getAccountEntityId(identifiers),
});

export type AccountEntities = EntityState<AccountEntity<AsyncData<Account>>>;
// #endregion

// #region PayFrequencies State
export const payFrequenciesEntitiesAdapter: EntityAdapter<AccountEntity<AsyncData<PayFrequency[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getAccountEntityId(identifiers),
});

export type PayFrequenciesEntities = EntityState<AccountEntity<AsyncData<PayFrequency[]>>>;
// #endregion

// #region GroupAttributeSets State
export const groupAttributeRecordEntityAdapter: EntityAdapter<AccountEntity<AsyncData<GroupAttributeRecord>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getAccountEntityId(identifiers),
});

export type GroupAttributeRecordEntities = EntityState<AccountEntity<AsyncData<GroupAttributeRecord>>>;
// #endregion

// #region AccountRiskClasses State
export const riskClassesEntityAdapter: EntityAdapter<AccountEntity<AsyncData<RiskClass[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getAccountEntityId(identifiers),
});

export type AccountRiskClassesEntities = EntityState<AccountEntity<AsyncData<RiskClass[]>>>;
// #endregion

// #region DualPeoRiskClassSets State
export const dualPeoRiskClassIdsSetsEntityAdapter: EntityAdapter<AccountEntity<AsyncData<DualPeoRiskClassIdsSet>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getAccountEntityId(identifiers),
});

export type DualPeoRiskClassSetsEntities = EntityState<AccountEntity<AsyncData<DualPeoRiskClassIdsSet>>>;
// #endregion

// #region ExceptionSets State
export const exceptionsEntityAdapter: EntityAdapter<ExceptionsEntity<AsyncData<Exceptions[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getExceptionsEntityId(identifiers),
});

export type ExceptionsEntities = EntityState<ExceptionsEntity<AsyncData<Exceptions[]>>>;

// #region AccountAdmin State
export const getAccountAdminEntityId = ({ mpGroup }: AccountAdminsIdentifiers) => getEntityId(mpGroup);

export const accountAdminsEntityAdapter = createEntityAdapter<AccountAdminEntity<AsyncData<Admin[]>>>({
    selectId: ({ identifiers }) => getAccountAdminEntityId(identifiers),
});

export type AccountAdminsEntities = EntityState<AccountAdminEntity<AsyncData<Admin[]>>>;

// #endregion

export interface State {
    direct?: boolean | null;
    selectedMPGroup?: number | null; // which Accounts record has been selected

    accountEntities: AccountEntities;
    payFrequenciesEntities: PayFrequenciesEntities;
    groupAttributeRecordEntities: GroupAttributeRecordEntities;
    riskClassesEntities: AccountRiskClassesEntities;
    dualPeoRiskClassIdsSetsEntities: DualPeoRiskClassSetsEntities;
    exceptionsEntities: ExceptionsEntities;
    accountAdminsEntities: AccountAdminsEntities;
}

export const initialState: State = {
    accountEntities: accountEntityAdapter.getInitialState({}),
    payFrequenciesEntities: payFrequenciesEntitiesAdapter.getInitialState({}),
    groupAttributeRecordEntities: groupAttributeRecordEntityAdapter.getInitialState({}),
    riskClassesEntities: riskClassesEntityAdapter.getInitialState({}),
    dualPeoRiskClassIdsSetsEntities: dualPeoRiskClassIdsSetsEntityAdapter.getInitialState({}),
    exceptionsEntities: exceptionsEntityAdapter.getInitialState({}),
    accountAdminsEntities: accountAdminsEntityAdapter.getInitialState({}),
};
