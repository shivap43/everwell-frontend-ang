import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { DualPeoRiskClassIds } from "@empowered/api";

import { combineAsyncDatas, getAsyncDataFromEntitiesState, getIdleAsyncData, mapAsyncData } from "../../ngrx.store.helpers";
import {
    State,
    AccountEntities,
    PayFrequenciesEntities,
    GroupAttributeRecordEntities,
    AccountRiskClassesEntities,
    DualPeoRiskClassSetsEntities,
    getAccountEntityId,
    getExceptionsEntityId,
    ExceptionsEntities,
    AccountAdminsEntities,
    getAccountAdminEntityId,
} from "./accounts.state";
import { ACCOUNTS_FEATURE_KEY } from "./accounts.reducer";
import { DualPeoRiskClassIdsSet, GroupAttributeRecord } from "./accounts.model";
import { SharedSelectors } from "../shared";
import {
    Account,
    AsyncData,
    GroupAttributeName,
    ProductId,
    PayFrequency,
    RiskClass,
    Exceptions,
    ExceptionType,
    RatingCode,
    Admin,
} from "@empowered/constants";

import { DIRECT_RISK_CLASS_NAME } from "./accounts.constant";

// Lookup the 'Accounts' feature state managed by NgRx
export const getAccountsFeatureState = createFeatureSelector<State>(ACCOUNTS_FEATURE_KEY);

export const getDirect = createSelector(getAccountsFeatureState, (state: State) => state.direct);

export const getSelectedMPGroup = createSelector(getAccountsFeatureState, (state: State) => state.selectedMPGroup);

// #region Accounts Selectors
export const getAccountEntities = createSelector(getAccountsFeatureState, (state: State) => state.accountEntities);

export const getSelectedAccount: MemoizedSelector<object, AsyncData<Account>> = createSelector(
    getAccountEntities,
    getSelectedMPGroup,
    (entitiesState: AccountEntities, mpGroup?: number | null): AsyncData<Account> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region PayFrequenciess Selectors
export const getPayFrequenciessEntities = createSelector(getAccountsFeatureState, (state: State) => state.payFrequenciesEntities);

export const getSelectedPayFrequencies: MemoizedSelector<object, AsyncData<PayFrequency[]>> = createSelector(
    getPayFrequenciessEntities,
    getSelectedMPGroup,
    (entitiesState: PayFrequenciesEntities, mpGroup?: number | null): AsyncData<PayFrequency[]> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region PayFrequency Selectors
export const getSelectedAccountPayFrequency: MemoizedSelector<object, AsyncData<PayFrequency | null>> = createSelector(
    getSelectedAccount,
    getSelectedPayFrequencies,
    (selectedAccountData, payFrequencyData) => {
        const combinedAsyncDatas = combineAsyncDatas([selectedAccountData, payFrequencyData]);

        return mapAsyncData(combinedAsyncDatas, ({ value: [account, payFrequencySet] }) => {
            const accountPayFrequencyId = account.payFrequencyId;

            if (accountPayFrequencyId != null) {
                return payFrequencySet.find((payFrequency) => payFrequency.id === accountPayFrequencyId) ?? null;
            }

            return null;
        });
    },
);
// #endRegion

// #region GroupAttributeRecord Selectors
export const getGroupAttributeRecordEntities = createSelector(
    getAccountsFeatureState,
    (state: State) => state.groupAttributeRecordEntities,
);

export const getSelectedGroupAttributeRecord: MemoizedSelector<object, AsyncData<GroupAttributeRecord>> = createSelector(
    getGroupAttributeRecordEntities,
    getSelectedMPGroup,
    (entitiesState: GroupAttributeRecordEntities, mpGroup?: number | null): AsyncData<GroupAttributeRecord> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region RiskClasses Selectors
export const getRiskClassesEntities = createSelector(getAccountsFeatureState, (state: State) => state.riskClassesEntities);

// Gets possible RiskClasses when Account.ratingCode is RatingCode.STANDARD
export const getSelectedPossibleStandardRiskClasses: MemoizedSelector<object, AsyncData<RiskClass[]>> = createSelector(
    getRiskClassesEntities,
    getSelectedMPGroup,
    (entitiesState: AccountRiskClassesEntities, mpGroup?: number | null): AsyncData<RiskClass[]> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedStandardRiskClass: MemoizedSelector<object, AsyncData<RiskClass>> = createSelector(
    getSelectedPossibleStandardRiskClasses,
    getSelectedGroupAttributeRecord,
    getDirect,
    (riskClassesData: AsyncData<RiskClass[]>, groupAttributesData: AsyncData<GroupAttributeRecord>, isDirect): AsyncData<RiskClass> => {
        const combinedAsyncDatas = combineAsyncDatas([riskClassesData, groupAttributesData]);

        return mapAsyncData(combinedAsyncDatas, ({ value }) => {
            // For RatingCode.STANDARD, we expect only one set of riskClasses,
            const [riskClasses, groupAttributes] = value;

            // Whenever we are using the Direct shop, we always default to DIRECT_RISK_CLASS_NAME ("C")
            // If not we check INDUSTRY_CODE attribute for default RiskClass name
            const riskClassName = isDirect ? DIRECT_RISK_CLASS_NAME : groupAttributes[GroupAttributeName.INDUSTRY_CODE]?.value;

            // Check set of riskClasses for match
            // Fallback to first RiskClass of riskClasses if no match was found
            return riskClasses.find(({ name }) => name === riskClassName) ?? riskClasses[0];
        });
    },
);
// #endregion

// #region DualPeoRiskClassIdsSets Selectors
export const getDualPeoRiskClassIdsSetsEntities = createSelector(
    getAccountsFeatureState,
    (state: State) => state.dualPeoRiskClassIdsSetsEntities,
);

export const getSelectedDualPeoRiskClassIdsSet: MemoizedSelector<object, AsyncData<DualPeoRiskClassIdsSet>> = createSelector(
    getDualPeoRiskClassIdsSetsEntities,
    getSelectedMPGroup,
    (entitiesState: DualPeoRiskClassSetsEntities, mpGroup?: number | null): AsyncData<DualPeoRiskClassIdsSet> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedDualPeoRiskClassIds: MemoizedSelector<object, AsyncData<DualPeoRiskClassIds>> = createSelector(
    getSelectedDualPeoRiskClassIdsSet,
    (dualPeoRiskClassIdsSet: AsyncData<DualPeoRiskClassIdsSet>) =>
        mapAsyncData(dualPeoRiskClassIdsSet, ({ value }) => value.dualPeoRiskClassIds),
);

export const getSelectedAflacCarrierDualPeoRiskClassIds: MemoizedSelector<object, AsyncData<DualPeoRiskClassIds>> = createSelector(
    getSelectedDualPeoRiskClassIdsSet,
    (dualPeoRiskClassIdsSet: AsyncData<DualPeoRiskClassIdsSet>) =>
        mapAsyncData(dualPeoRiskClassIdsSet, ({ value }) => value.aflacCarrierDualPeoRiskClassIds),
);

/**
 * Helper method to filter RiskClass[] with matching ids
 *
 * @param riskClassIds Expected ids to match
 * @param riskClasses Full list of RiskClasses to filter from
 *
 * @returns {RiskClass[]} Filtered RiskClass[]
 */
export function filterRiskClassesByIds(riskClassIds: number[], riskClasses: RiskClass[]): RiskClass[] {
    return riskClasses.filter(({ id }) => riskClassIds.includes(id));
}

// Gets possible RiskClassSets when Account.ratingCode is RatingCode.DUAL
export const getSelectedPossibleDualRiskClassSets: MemoizedSelector<object, AsyncData<RiskClass[][]>> = createSelector(
    SharedSelectors.getCarrierRiskClasses,
    getSelectedAflacCarrierDualPeoRiskClassIds,
    (allRiskClassesData: AsyncData<RiskClass[]>, dualPeoRiskClassIdsData: AsyncData<DualPeoRiskClassIds>): AsyncData<RiskClass[][]> => {
        const combinedAsyncDatas = combineAsyncDatas([allRiskClassesData, dualPeoRiskClassIdsData]);

        return mapAsyncData(combinedAsyncDatas, ({ value }) => {
            const [allRiskClasses, dualPeoRiskClassIds] = value;

            const accidentRiskClasses = filterRiskClassesByIds(dualPeoRiskClassIds[ProductId.ACCIDENT], allRiskClasses);
            const stdRiskClasses = filterRiskClassesByIds(dualPeoRiskClassIds[ProductId.SHORT_TERM_DISABILITY], allRiskClasses);

            return [
                // Add ProductId.ACCIDENT to all RiskClasses involved for ProductId.ACCIDENT
                accidentRiskClasses.map((riskClass) => ({
                    ...riskClass,
                    productId: ProductId.ACCIDENT,
                })),
                // Add ProductId.SHORT_TERM_DISABILITY to all RiskClasses involved for ProductId.SHORT_TERM_DISABILITY
                stdRiskClasses.map((riskClass) => ({
                    ...riskClass,
                    productId: ProductId.SHORT_TERM_DISABILITY,
                })),
            ];
        });
    },
);

export const getSelectedDualRiskClasses: MemoizedSelector<object, AsyncData<[RiskClass, RiskClass]>> = createSelector(
    getSelectedPossibleDualRiskClassSets,
    getSelectedDualPeoRiskClassIds,
    (dualRiskClassSetsData: AsyncData<RiskClass[][]>, dualPeoRiskClassIdsData: AsyncData<DualPeoRiskClassIds>) => {
        const combinedAsyncDatas = combineAsyncDatas([dualRiskClassSetsData, dualPeoRiskClassIdsData]);

        return mapAsyncData(combinedAsyncDatas, ({ value }) => {
            // For RatingCode.DUAL, we expect the first set of riskClasses to be for ProductId.ACCIDENT.
            // and the second set of riskClasses to be for ProductId.SHORT_TERM_DISABILITY
            const [[accidentRiskClasses, stdRiskClasses], dualPeoRiskClassIds] = value;

            // Check first RiskClasses that aren't related to any CarrierId for ProductId.ACCIDENT and roductId.SHORT_TERM_DISABILITY
            const accidentRiskClassId = dualPeoRiskClassIds[ProductId.ACCIDENT][0];
            const stdRiskClassId = dualPeoRiskClassIds[ProductId.SHORT_TERM_DISABILITY][0];

            // Check both sets of riskClasses for match
            // Fallback to first RiskClass of each set if no match was found
            const defaultAccidentRiskClass = accidentRiskClasses.find(({ id }) => id === accidentRiskClassId) ?? accidentRiskClasses[0];
            const defaultSTDRiskClass = stdRiskClasses.find(({ id }) => id === stdRiskClassId) ?? stdRiskClasses[0];

            return [defaultAccidentRiskClass, defaultSTDRiskClass];
        });
    },
);
// #endregion

// #region Exception Selectors
export const getExceptionsEntities = createSelector(getAccountsFeatureState, (state: State) => state.exceptionsEntities);

export const getSelectedSpouseExceptions: MemoizedSelector<object, AsyncData<Exceptions[]>> = createSelector(
    getExceptionsEntities,
    getSelectedMPGroup,
    (entitiesStateSets: ExceptionsEntities, mpGroup?: number | null): AsyncData<Exceptions[]> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getExceptionsEntityId({ mpGroup, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE });

        return getAsyncDataFromEntitiesState(entitiesStateSets, id);
    },
);
// #endregion

// #region Account Admin Selectors
export const getAccountAdminEntities = createSelector(getAccountsFeatureState, (state: State) => state.accountAdminsEntities);

export const getSelectedAccountAdmins: MemoizedSelector<object, AsyncData<Admin[]>> = createSelector(
    getAccountAdminEntities,
    getSelectedMPGroup,
    (entitiesStateSets: AccountAdminsEntities, mpGroup?: number | null): AsyncData<Admin[]> => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getAccountAdminEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesStateSets, id);
    },
);
// #endregion

export const getSelectedRatingCode: MemoizedSelector<object, AsyncData<RatingCode | null>> = createSelector(
    getSelectedAccount,
    (account: AsyncData<Account>) => mapAsyncData(account, ({ value }) => value.ratingCode ?? null),
);
