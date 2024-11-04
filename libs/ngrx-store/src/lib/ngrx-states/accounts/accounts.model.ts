import { DualPeoRiskClassIds } from "@empowered/api";
import { Entity, GroupAttributeName, ExceptionType } from "@empowered/constants";

export interface AccountIdentifiers {
    mpGroup: number; // Primary ID
}

export type AccountEntity<Value> = Entity<AccountIdentifiers, Value>;

/**
 * exceptionType is optional outside of the producer shop, for now let's make it required
 */
export interface ExceptionsIdentifiers {
    mpGroup: number;
    exceptionType: ExceptionType;
}

export type ExceptionsEntity<Value> = Entity<ExceptionsIdentifiers, Value>;

// #region GroupAttributeRecordEntity types

// libs/api/src/lib/services/account/models/group-attribute.model.ts
// TODO [Types]: Update the existing group attribute model to have all properties required
// This is to better match the response documentation:
// https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=account#operation/getGroupAttributesByName
export interface GroupAttribute<T extends string = GroupAttributeName> {
    id: number; // required on update
    attribute: T;
    value: string;
}

export type GroupAttributeRecord = {
    // If the strict types using the GroupAttributeName Enum is causing ts errors or makes development harder,
    // please change GroupAttributeName to string
    [groupAttributeName in GroupAttributeName]?: GroupAttribute<groupAttributeName> | null;
};

// #endregion

export interface DualPeoRiskClassIdsSet {
    dualPeoRiskClassIds: DualPeoRiskClassIds;
    aflacCarrierDualPeoRiskClassIds: DualPeoRiskClassIds;
}

/**
 * Interface for the "AccountAdmin" data
 */
export interface AccountAdminsIdentifiers {
    mpGroup: number;
}

export type AccountAdminEntity<Value> = Entity<AccountAdminsIdentifiers, Value>;
