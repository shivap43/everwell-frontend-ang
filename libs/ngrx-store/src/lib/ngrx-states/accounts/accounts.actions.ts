import { Account, GroupAttributeName, ApiError, PayFrequency, RiskClass, Exceptions, ExceptionType, Admin } from "@empowered/constants";
import { createAction, props, union } from "@ngrx/store";

import { AccountEntity, GroupAttributeRecord, DualPeoRiskClassIdsSet, ExceptionsEntity, AccountAdminEntity } from "./accounts.model";

export const setDirect = createAction("[Accounts] Set Direct", props<{ direct: boolean }>());

export const setSelectedMPGroup = createAction("[Accounts] Set Selected mpGroup", props<{ mpGroup: number }>());

// #region Accounts Actions
export const loadAccount = createAction("[Accounts/API] Load Accounts", props<{ mpGroup: number }>());

export const loadAccountSuccess = createAction("[Accounts/API] Load Account Success", props<{ accountsEntity: AccountEntity<Account> }>());

export const loadAccountFailure = createAction("[Accounts/API] Load Account Failure", props<{ error: AccountEntity<ApiError> }>());
// #endregion

// #region PayFrequencies Actions
export const loadPayFrequencies = createAction("[Accounts/PayFrequencies/API] Load PayFrequencies", props<{ mpGroup: number }>());

export const loadPayFrequenciesSuccess = createAction(
    "[Accounts/PayFrequencies/API] Load PayFrequencies Success",
    props<{ payFrequenciesEntity: AccountEntity<PayFrequency[]> }>(),
);

export const loadPayFrequenciesFailure = createAction(
    "[Accounts/PayFrequencies/API] Load PayFrequencies Failure",
    props<{ error: AccountEntity<ApiError> }>(),
);
// #endregion

// #region GroupAttributeRecord Actions
export const loadGroupAttributeRecord = createAction(
    "[Accounts/GroupAttributes/API] Load GroupAttributeRecord",
    props<{ groupAttributeNames: GroupAttributeName[]; mpGroup: number }>(),
);

export const loadGroupAttributeRecordSuccess = createAction(
    "[Accounts/GroupAttributes/API] Load GroupAttributeRecord Success",
    props<{ groupAttributeRecordEntity: AccountEntity<GroupAttributeRecord> }>(),
);

export const loadGroupAttributeRecordFailure = createAction(
    "[Accounts/GroupAttributes/API] Load GroupAttributeRecord Failure",
    props<{ error: AccountEntity<ApiError> }>(),
);
// #endregion

// #region RiskClassesSets Actions
export const loadRiskClasses = createAction("[Accounts/CarrierRiskClasses/API] Load RiskClasseSets", props<{ mpGroup: number }>());

export const loadRiskClassesSuccess = createAction(
    "[Accounts/CarrierRiskClasses/API] Load RiskClasseSets Success",
    props<{ riskClassesEntity: AccountEntity<RiskClass[]> }>(),
);

export const loadRiskClassesFailure = createAction(
    "[Accounts/CarrierRiskClasses/API] Load RiskClasseSets Failure",
    props<{ error: AccountEntity<ApiError> }>(),
);
// #endregion

// #region DualPeoRiskClasseSets Actions
export const loadDualPeoRiskClassIdsSet = createAction(
    "[Aflac/BenefitOffering/PeoClasses/Dual] Load DualPeoRiskClasseSets Failure",
    props<{ mpGroup: number }>(),
);

export const loadDualPeoRiskClassIdsSetSuccess = createAction(
    "[Accounts/CarrierRiskClasses/API] Load DualPeoRiskClasseSets Success",
    props<{ dualPeoRiskClassIdsSetsEntity: AccountEntity<DualPeoRiskClassIdsSet> }>(),
);

export const loadDualPeoRiskClassIdsSetFailure = createAction(
    "[Accounts/CarrierRiskClasses/API] Load DualPeoRiskClasseSets Failure",

    props<{ error: AccountEntity<ApiError> }>(),
);
// #endregion

// #region Exceptions Actions
export const loadExceptions = createAction(
    "[Accounts/Exceptions/API] Load Exceptions",
    props<{ mpGroup: number; exceptionType: ExceptionType }>(),
);

export const loadExceptionsSuccess = createAction(
    "[Accounts/Exceptions/API] Load Exception Success",
    props<{ exceptionsEntity: ExceptionsEntity<Exceptions[]> }>(),
);

export const loadExceptionsFailure = createAction(
    "[Accounts/Exceptions/API] Load Exception Failure",
    props<{ error: ExceptionsEntity<ApiError> }>(),
);

// region getAccountAdmins
export const loadAccountAdmins = createAction("[Accounts/Admins/API] Get AccountAdmins", props<{ mpGroup: number }>());

export const loadAccountAdminsSuccess = createAction(
    "[Accounts/Admins/API] Get AccountAdmins Success",
    props<{ accountAdminsEntity: AccountAdminEntity<Admin[]> }>(),
);

export const loadAccountAdminsFailure = createAction(
    "[Accounts/Admins/API] Get AccountAdmins Failure",
    props<{ error: AccountAdminEntity<ApiError> }>(),
);
// #endregion

const actions = union({
    setDirect,

    setSelectedMPGroup,

    loadAccount,
    loadAccountSuccess,
    loadAccountFailure,

    loadPayFrequencies,
    loadPayFrequenciesSuccess,
    loadPayFrequenciesFailure,

    loadGroupAttributeRecord,
    loadGroupAttributeRecordSuccess,
    loadGroupAttributeRecordFailure,

    loadRiskClasses,
    loadRiskClassesSuccess,
    loadRiskClassesFailure,

    loadDualPeoRiskClassIdsSet,
    loadDualPeoRiskClassIdsSetSuccess,
    loadDualPeoRiskClassIdsSetFailure,

    loadExceptions,
    loadExceptionsSuccess,
    loadExceptionsFailure,

    loadAccountAdmins,
    loadAccountAdminsSuccess,
    loadAccountAdminsFailure,
});

export type ActionsUnion = typeof actions;
