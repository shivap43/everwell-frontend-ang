/* eslint-disable max-classes-per-file */

import { CoverageSummaryFilterInfo, EnrollmentMethodModel, GenericRequiredInfo } from "./enrollment-method.model";
import { CountryState, PlanFlexDollarOrIncentives } from "@empowered/constants";

export class SetEnrollmentMethodSpecific {
    static readonly type = "[EnrollmentData] setEnrollmentMethodSpecific";

    constructor(public enrollmentMethodSpecific: EnrollmentMethodModel) {}
}

export class SetMemberIdentity {
    static readonly type = "[MemberInfo] setMemberIdentity";
    constructor(public uniqueMemberId: number) {}
}
export class SetMemberInfo {
    static readonly type = "[MemberDetails] SetMemberInfo";
    constructor(public memberDetails: any) {}
}
export class SetEnrollmentStateArray {
    static readonly type = "[MemberInfo] setEnrollmentStateArray";

    constructor(public enrollmentStateArray: CountryState[]) {}
}
export class SetDirectUserState {
    static readonly type = "[DirectUserData] setDirectUserState";
    constructor(public directUserState: string) {}
}

export class SetDirectUserStateAbbr {
    static readonly type = "[DirectUserData] setDirectUserStateAbbr";
    constructor(public directUserStateAbbr: string) {}
}

export class SetGenericUserInfo {
    static readonly type = "[GenericMemberConatctInfo] setGenericUserInfo";
    constructor(public genericContactInfo: GenericRequiredInfo) {}
}
/**
 * Method to set coverage summary filter details
 */
export class SetDateFilterInfo {
    static readonly type = "[CoverageSummaryDateFilter] setDateFilterInfo";
    constructor(public dateFilterInfo: CoverageSummaryFilterInfo) {}
}
/**
 * Method to set plan level flex dollars
 */
export class SetPlanLevelFlexIncetives {
    static readonly type = "[EnrollmentStateModel] SetPlanLevelFlexIncetives";
    constructor(public planFlexDollarOrIncentives: PlanFlexDollarOrIncentives[]) {}
}
/**
 * Method to set direct accountId
 */
export class SetDirectAccountId {
    static readonly type = "[DirectUserData] SetDirectAccountId";
    constructor(public directAccountId: string) {}
}

export class Set8x8CallCenterDisabilityRestriction {
    static readonly type = "[EnrollmentStateModel] Set8x8CallCenterDisabilityRestriction";
    constructor(public is8x8CallCenterDisabilityRestricted: boolean) {}
}
