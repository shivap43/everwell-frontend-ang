import { AsyncStatus } from "@empowered/constants";
import { createReducer, on, Action } from "@ngrx/store";
import { GlobalActions } from "../global";
import * as MembersActions from "./members.actions";
import {
    initialState,
    State,
    memberProfileEntityAdapter,
    salariesEntityAdapter,
    memberDependentsEntityAdapter,
    riskClassesEntityAdapter,
    qualifyingEventsEntityAdapter,
    memberContactsEntityAdapter,
    memberFlexDollarsEntityAdapter,
    crossBorderRulesEntityAdapter,
} from "./members.state";

export const MEMBERS_FEATURE_KEY = "members";

export interface MembersPartialState {
    readonly [MEMBERS_FEATURE_KEY]: State;
}

const membersReducer = createReducer(
    initialState,

    // Reinitialize MembersState when all Member related state is cleared
    // We must clear memberId when entering or leaving Producer Shop Rewrite so that we can determine if ngrx is being used
    // When there is no `selectedMemberId` in MembersState, this should mean that ngrx is NOT currently used
    on(GlobalActions.clearMemberRelatedState, (): State => ({ ...initialState })),

    // Set which memberId is associated with the currently selected MemberProfile (and all related instances such as Salaries)
    on(MembersActions.setSelectedMemberId, (state, { memberId }): State => ({ ...state, selectedMemberId: memberId })),

    // #region MemberProfiles
    on(
        MembersActions.loadMemberProfile,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            membersEntities: memberProfileEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.membersEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberProfileSuccess,
        (state, { memberProfileEntity }): State => ({
            ...state,
            membersEntities: memberProfileEntityAdapter.setOne(
                {
                    identifiers: { ...memberProfileEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: memberProfileEntity.data,
                        error: null,
                    },
                },
                { ...state.membersEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberProfileFailure,
        (state, { error }): State => ({
            ...state,
            membersEntities: memberProfileEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.membersEntities },
            ),
        }),
    ),
    // #endregion

    // #region Salaries
    on(
        MembersActions.loadSalaries,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            salariesEntities: salariesEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.salariesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadSalariesSuccess,
        (state, { salariesEntity }): State => ({
            ...state,
            salariesEntities: salariesEntityAdapter.setOne(
                {
                    identifiers: { ...salariesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...salariesEntity.data],
                        error: null,
                    },
                },
                { ...state.salariesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadSalariesFailure,
        (state, { error }): State => ({
            ...state,
            salariesEntities: salariesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.salariesEntities },
            ),
        }),
    ),
    // #endregion

    // #region Member Dependents
    on(
        MembersActions.loadMemberDependents,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            memberDependentsEntities: memberDependentsEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.memberDependentsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberDependentsSuccess,
        (state, { memberDependentsEntity }): State => ({
            ...state,
            memberDependentsEntities: memberDependentsEntityAdapter.setOne(
                {
                    identifiers: { ...memberDependentsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...memberDependentsEntity.data],
                        error: null,
                    },
                },
                { ...state.memberDependentsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberDependentsFailure,
        (state, { error }): State => ({
            ...state,
            memberDependentsEntities: memberDependentsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.memberDependentsEntities },
            ),
        }),
    ),
    // #endregion

    // #region RiskClasses
    on(
        MembersActions.loadRiskClasses,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            riskClassesEntities: riskClassesEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.riskClassesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadRiskClassesSuccess,
        (state, { riskClassesEntity }): State => ({
            ...state,
            riskClassesEntities: riskClassesEntityAdapter.setOne(
                {
                    identifiers: { ...riskClassesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            memberRiskClasses: [...riskClassesEntity.data.memberRiskClasses],
                            aflacCarrierRiskClasses: [...riskClassesEntity.data.aflacCarrierRiskClasses],
                        },
                        error: null,
                    },
                },
                { ...state.riskClassesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadRiskClassesFailure,
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

    // #region QualifyingEvents
    on(
        MembersActions.loadQualifyingEvents,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            qualifyingEventsEntities: qualifyingEventsEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.qualifyingEventsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadQualifyingEventsSuccess,
        (state, { qualifyingEventsEntity }): State => ({
            ...state,
            qualifyingEventsEntities: qualifyingEventsEntityAdapter.setOne(
                {
                    identifiers: { ...qualifyingEventsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...qualifyingEventsEntity.data],
                        error: null,
                    },
                },
                { ...state.qualifyingEventsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadQualifyingEventsFailure,
        (state, { error }): State => ({
            ...state,
            qualifyingEventsEntities: qualifyingEventsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.qualifyingEventsEntities },
            ),
        }),
    ),
    // #endregion

    // #region MemberContacts
    on(
        MembersActions.loadMemberContacts,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            memberContactsEntities: memberContactsEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.memberContactsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberContactsSuccess,
        (state, { memberContactsEntity }): State => ({
            ...state,
            memberContactsEntities: memberContactsEntityAdapter.setOne(
                {
                    identifiers: { ...memberContactsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...memberContactsEntity.data],
                        error: null,
                    },
                },
                { ...state.memberContactsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberContactsFailure,
        (state, { error }): State => ({
            ...state,
            memberContactsEntities: memberContactsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.memberContactsEntities },
            ),
        }),
    ),
    // #endregion

    // #region MemberFlexDollars
    on(
        MembersActions.loadMemberFlexDollars,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            memberFlexDollarsEntities: memberFlexDollarsEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.memberFlexDollarsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberFlexDollarsSuccess,
        (state, { memberFlexDollarsEntity }): State => ({
            ...state,
            memberFlexDollarsEntities: memberFlexDollarsEntityAdapter.setOne(
                {
                    identifiers: { ...memberFlexDollarsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...memberFlexDollarsEntity.data],
                        error: null,
                    },
                },
                { ...state.memberFlexDollarsEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadMemberFlexDollarsFailure,
        (state, { error }): State => ({
            ...state,
            memberFlexDollarsEntities: memberFlexDollarsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.memberFlexDollarsEntities },
            ),
        }),
    ),
    // #endregion

    // #region CrossBorderRules
    on(
        MembersActions.loadCrossBorderRules,
        (state, { mpGroup, memberId }): State => ({
            ...state,
            crossBorderRulesEntities: crossBorderRulesEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, memberId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.crossBorderRulesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadCrossBorderRulesSuccess,
        (state, { crossBorderRulesEntity }): State => ({
            ...state,
            crossBorderRulesEntities: crossBorderRulesEntityAdapter.setOne(
                {
                    identifiers: { ...crossBorderRulesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...crossBorderRulesEntity.data],
                        error: null,
                    },
                },
                { ...state.crossBorderRulesEntities },
            ),
        }),
    ),
    on(
        MembersActions.loadCrossBorderRulesFailure,
        (state, { error }): State => ({
            ...state,
            crossBorderRulesEntities: crossBorderRulesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.crossBorderRulesEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return membersReducer(state, action);
}
