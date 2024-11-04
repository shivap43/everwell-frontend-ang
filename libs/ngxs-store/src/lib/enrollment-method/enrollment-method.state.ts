import { Action, Selector, State, StateContext } from "@ngxs/store";
import {
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetEnrollmentStateArray,
    SetMemberInfo,
    SetDirectUserState,
    SetDirectUserStateAbbr,
    SetGenericUserInfo,
    SetPlanLevelFlexIncetives,
    SetDirectAccountId,
    SetDateFilterInfo,
    Set8x8CallCenterDisabilityRestriction,
} from "./enrollment-method.action";
import {
    EnrollmentMethodStateModel,
    EnrollmentMethodModel,
    MemberIdentity,
    MemberInfo,
    DirectUserSitusState,
    GenericRequiredInfo,
    CoverageSummaryDateFilter,
    CoverageSummaryFilterInfo,
} from "./enrollment-method.model";
import { patch } from "@ngxs/store/operators";
import { ResetState } from "@empowered/user/state/actions";
import { CountryState, PlanFlexDollarOrIncentives } from "@empowered/constants";
import { Injectable } from "@angular/core";

const defaultState: EnrollmentMethodStateModel = {
    specificEnrollment: null,
    currentEnrollment: null,
    visitedMpGroups: [],
    planFlexDollarOrIncentives: [],
    is8x8CallCenterDisabilityRestricted: undefined,
};

@State<EnrollmentMethodStateModel>({
    name: "EnrollmentMethodState",
    defaults: defaultState,
})
@State<MemberIdentity>({
    name: "MemberIdState",
    defaults: {
        uniqueMemberId: null,
        enrollmentStateArray: [],
    },
})
@State<MemberInfo>({
    name: "MemberIdInfo",
    defaults: {
        memberInfo: null,
    },
})
@State<DirectUserSitusState>({
    name: "DirectUserStateInfo",
    defaults: {
        directUserState: null,
        directUserStateAbbr: null,
        directAccountId: null,
    },
})
@State<GenericRequiredInfo>({
    name: "GenericMemberContactInfo",
    defaults: {
        genericContactInfo: null,
    },
})
@State<CoverageSummaryDateFilter>({
    name: "CoverageSummaryDateFilter",
    defaults: {
        dateFilterInfo: null,
    },
})
@Injectable()
export class EnrollmentMethodState {
    constructor() {}

    @Selector()
    static specificEnrollmentMethod(state: EnrollmentMethodStateModel): EnrollmentMethodModel {
        return state.specificEnrollment;
    }
    @Selector()
    static currentEnrollment(state: EnrollmentMethodStateModel): EnrollmentMethodModel {
        return state.currentEnrollment;
    }
    @Selector()
    static visitedMpGroups(state: EnrollmentMethodStateModel): string[] {
        return state.visitedMpGroups;
    }
    @Selector()
    static getUniqueMemberId(state: MemberIdentity): number {
        return state.uniqueMemberId;
    }
    @Selector()
    static getMemberInfo(state: any): any {
        return state.memberDetails;
    }
    @Selector()
    static getEnrollmentStateArray(state: MemberIdentity): CountryState[] {
        return state.enrollmentStateArray;
    }
    @Selector()
    static getDirectUserState(state: DirectUserSitusState): string {
        return state.directUserState;
    }
    @Selector()
    static getDirectUserStateAbbr(state: DirectUserSitusState): string {
        return state.directUserStateAbbr;
    }
    @Selector()
    static getGenericContactInfo(state: GenericRequiredInfo): any {
        return state.genericContactInfo;
    }
    /**
     * Selector to get coverage summary filter details
     * @param state: state model of coverage summary date filter
     * @returns CoverageSummaryFilterInfo
     */
    @Selector()
    static getDateFilterInfo(state: CoverageSummaryDateFilter): CoverageSummaryFilterInfo {
        return state.dateFilterInfo;
    }
    /**
     * Selector to get plan level Flex dollars
     * @param state: state model of enrollment method state
     * @returns {PlanFlexDollarOrIncentives[]}
     */
    @Selector()
    static getPlanLevelFlexIncentives(state: EnrollmentMethodStateModel): PlanFlexDollarOrIncentives[] {
        return state.planFlexDollarOrIncentives;
    }
    /**
     * Selector to get direct accountId
     * @param state: state model of DirectUserSitusState state
     * @returns direct AccountId
     */
    @Selector()
    static getDirectAccountId(state: DirectUserSitusState): string {
        return state.directAccountId;
    }

    /**
     * Get whether disability enrollment is restricted for 8x8 call center enrollment.
     *
     * @returns whether disability enrollment is restricted
     */
    @Selector()
    static get8x8CallCenterDisabilityRestriction(state: EnrollmentMethodStateModel): any {
        return state.is8x8CallCenterDisabilityRestricted;
    }

    /**
     * Selector for enrollment city
     * @param state
     * @returns enrollment city
     */
    @Selector()
    static GetEnrollmentCity(state: EnrollmentMethodStateModel): string {
        return state.currentEnrollment?.enrollmentCity;
    }

    @Action(ResetState)
    resetState(context: StateContext<EnrollmentMethodStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetEnrollmentMethodSpecific)
    setEnrollmentMethodSpecific(
        ctx: StateContext<EnrollmentMethodStateModel>,
        { enrollmentMethodSpecific }: SetEnrollmentMethodSpecific,
    ): void {
        const state = ctx.getState();
        const mpGroups: string[] = enrollmentMethodSpecific?.mpGroup
            ? [...state.visitedMpGroups, enrollmentMethodSpecific.mpGroup.toString()]
            : state.visitedMpGroups;
        ctx.patchState({
            specificEnrollment: enrollmentMethodSpecific,
            currentEnrollment: enrollmentMethodSpecific,
            visitedMpGroups: mpGroups,
        });
    }

    @Action(SetMemberIdentity)
    setMemberId({ patchState }: StateContext<MemberIdentity>, { uniqueMemberId }: SetMemberIdentity): void {
        patchState({
            uniqueMemberId: uniqueMemberId,
        });
    }

    @Action(SetMemberInfo)
    setMemberInfo({ patchState }: StateContext<any>, { memberDetails }: SetMemberInfo): void {
        patchState({
            memberDetails: memberDetails,
        });
    }
    @Action(SetEnrollmentStateArray)
    setEnrollmentStateArray({ patchState }: StateContext<MemberIdentity>, { enrollmentStateArray }: SetEnrollmentStateArray): void {
        patchState({
            enrollmentStateArray: enrollmentStateArray,
        });
    }

    @Action(SetDirectUserState)
    setDirectUserState({ patchState }: StateContext<DirectUserSitusState>, { directUserState }: SetDirectUserState): void {
        patchState({
            directUserState: directUserState,
        });
    }
    @Action(SetDirectUserStateAbbr)
    setDirectUserStateAbbr({ patchState }: StateContext<DirectUserSitusState>, { directUserStateAbbr }: SetDirectUserStateAbbr): void {
        patchState({
            directUserStateAbbr: directUserStateAbbr,
        });
    }
    @Action(SetGenericUserInfo)
    setGenericUserInfo({ patchState }: StateContext<GenericRequiredInfo>, genericContactInfo: GenericRequiredInfo): void {
        patchState({
            genericContactInfo: genericContactInfo.genericContactInfo,
        });
    }
    @Action(SetDateFilterInfo)
    setDateFilterInfo(ctx: StateContext<CoverageSummaryDateFilter>, { dateFilterInfo }: CoverageSummaryDateFilter): void {
        ctx.setState(
            patch({
                dateFilterInfo: dateFilterInfo,
            }),
        );
    }
    /**
     * Set plan level flex dollars for specific member
     * @param ctx: State context of enrollment state model
     * @param { planFlexDollarOrIncentives } : Plan level flex dollars to be stored in state
     */
    @Action(SetPlanLevelFlexIncetives)
    SetPlanLevelFlexIncetives(
        ctx: StateContext<EnrollmentMethodStateModel>,
        { planFlexDollarOrIncentives }: SetPlanLevelFlexIncetives,
    ): void {
        ctx.setState(
            patch({
                planFlexDollarOrIncentives: planFlexDollarOrIncentives,
            }),
        );
    }
    /**
     * Set direct accountId for logged in producer
     * @param param0 patchState: State context of DirectUserSitusState model
     * @param param1 directAccountId: direct account Id stored in state
     */
    @Action(SetDirectAccountId)
    SetDirectAccountId({ patchState }: StateContext<DirectUserSitusState>, { directAccountId }: SetDirectAccountId): void {
        patchState({
            directAccountId: directAccountId,
        });
    }

    /**
     * Sets whether disability enrollment is restricted for 8x8 call center enrollment.
     *
     * @param param0 patchState patches the existing state with the provided value
     * @param param1 is8x8CallCenterDisabilityRestricted whether disability enrollment is restricted
     */
    @Action(Set8x8CallCenterDisabilityRestriction)
    set8x8CallCenterDisabilityRestriction(
        { patchState }: StateContext<EnrollmentMethodStateModel>,
        { is8x8CallCenterDisabilityRestricted }: Set8x8CallCenterDisabilityRestriction,
    ) {
        patchState({ is8x8CallCenterDisabilityRestricted });
    }
}
