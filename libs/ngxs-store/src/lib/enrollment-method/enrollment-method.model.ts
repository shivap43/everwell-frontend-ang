import { CountryState, MemberProfile, PlanFlexDollarOrIncentives } from "@empowered/constants";

export interface EnrollmentMethodModel {
    enrollmentMethod: string;
    enrollmentState: string;
    headSetState: string;
    headSetStateAbbreviation: string;
    enrollmentStateAbbreviation: string;
    enrollmentCity?: string;
    userType: string;
    memberId: number;
    mpGroup: any;
}
export interface EnrollmentMethodStateModel {
    specificEnrollment: EnrollmentMethodModel;
    currentEnrollment: EnrollmentMethodModel;
    visitedMpGroups: string[];
    planFlexDollarOrIncentives: PlanFlexDollarOrIncentives[];
    is8x8CallCenterDisabilityRestricted: boolean;
}

export interface MemberIdentity {
    uniqueMemberId: number;
    enrollmentStateArray: CountryState[];
}
export interface MemberInfo {
    memberInfo: MemberProfile;
}
/**
 * Interface for DirectUserSitusState model
 */
export interface DirectUserSitusState {
    directUserState: string;
    directUserStateAbbr: string;
    directAccountId: string;
}

export interface GenericRequiredInfo {
    genericContactInfo: GenericMemberContactInfo;
}
interface GenericMemberContactInfo {
    city: string;
    state: string;
    zip: string;
    birthDate: string;
    gender: string;
}

export interface CoverageSummaryDateFilter {
    dateFilterInfo: CoverageSummaryFilterInfo;
}
export interface CoverageSummaryFilterInfo {
    mpGroup: number;
    specificDate: string;
    startDate: string;
    endDate: string;
    priceFilter?: string;
}
