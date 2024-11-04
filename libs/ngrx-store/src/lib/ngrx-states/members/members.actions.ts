import { createAction, props, union } from "@ngrx/store";
import { CrossBorderRule } from "@empowered/api";

import { MemberProfileEntity, MemberRiskClasses } from "./members.model";
import {
    ApiError,
    Salary,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
} from "@empowered/constants";

// Set which memberId is associated with the currently selected MemberProfile (and all related instances such as Salaries)
export const setSelectedMemberId = createAction("[Members] Set Selected MemberId", props<{ memberId: number }>());

// #region Members Actions
export const loadMemberProfile = createAction("[Members/API] Load Member Profile", props<{ memberId: number; mpGroup: number }>());

export const loadMemberProfileSuccess = createAction(
    "[Members/API] Load Member Profile Success",
    props<{ memberProfileEntity: MemberProfileEntity<MemberProfile> }>(),
);

export const loadMemberProfileFailure = createAction(
    "[Members/API] Load Member Profile Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region Salaries Actions
export const loadSalaries = createAction("[Members/API] Load Salaries", props<{ memberId: number; mpGroup: number }>());

export const loadSalariesSuccess = createAction(
    "[Members/API] Load Salaries Success",
    props<{ salariesEntity: MemberProfileEntity<Salary[]> }>(),
);

export const loadSalariesFailure = createAction("[Members/API] Load Salaries Failure", props<{ error: MemberProfileEntity<ApiError> }>());
// #endregion

// #region Member Dependents Actions
export const loadMemberDependents = createAction("[Members/API] Load Member Dependents", props<{ memberId: number; mpGroup: number }>());

export const loadMemberDependentsSuccess = createAction(
    "[Members/API] Load Member Dependents Success",
    props<{ memberDependentsEntity: MemberProfileEntity<MemberDependent[]> }>(),
);

export const loadMemberDependentsFailure = createAction(
    "[Members/API] Load Member Dependents Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region RiskClasses Actions
export const loadRiskClasses = createAction(
    "[Members/CarrierRiskClasses/API] Load RiskClasses",
    props<{ memberId: number; mpGroup: number }>(),
);

export const loadRiskClassesSuccess = createAction(
    "[Members/CarrierRiskClasses/API] Load RiskClasses Success",
    props<{ riskClassesEntity: MemberProfileEntity<MemberRiskClasses> }>(),
);

export const loadRiskClassesFailure = createAction(
    "[Members/CarrierRiskClasses/API] Load RiskClasses Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region QualifyingEvents Actions
export const loadQualifyingEvents = createAction(
    "[GetQualifyingEvent] Load Qualify Events",
    props<{ memberId: number; mpGroup: number }>(),
);

export const loadQualifyingEventsSuccess = createAction(
    "[GetQualifyingEvent/Member/API] Load Qualify Events Success",
    props<{ qualifyingEventsEntity: MemberProfileEntity<MemberQualifyingEvent[]> }>(),
);

export const loadQualifyingEventsFailure = createAction(
    "[GetQualifyingEventMethods/Member/API] Load Qualify Events Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region MemberContacts Actions
export const loadMemberContacts = createAction("[GetMemberContacts] Load Member Contacts", props<{ memberId: number; mpGroup: number }>());

export const loadMemberContactsSuccess = createAction(
    "[GetMemberContacts/Member/API] Load Member Contacts Success",
    props<{ memberContactsEntity: MemberProfileEntity<MemberContact[]> }>(),
);

export const loadMemberContactsFailure = createAction(
    "[GetMemberContacts/Member/API] Load Member Contacts Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region MemberFlexDollars Actions
export const loadMemberFlexDollars = createAction(
    "[Members/FlexDollars/API] Load Member Flex Dollars",
    props<{ memberId: number; mpGroup: number }>(),
);

export const loadMemberFlexDollarsSuccess = createAction(
    "[Members/FlexDollars/API] Load Member Flex Dollars Success",
    props<{ memberFlexDollarsEntity: MemberProfileEntity<MemberFlexDollar[]> }>(),
);

export const loadMemberFlexDollarsFailure = createAction(
    "[Members/FlexDollars/API] Load Member Flex Dollars Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

// #region CrossBorderRules
export const loadCrossBorderRules = createAction(
    "[Members/Aflac API] Load CrossBorderRules",
    props<{ mpGroup: number; memberId: number }>(),
);
export const loadCrossBorderRulesSuccess = createAction(
    "[Members/Aflac API] Load CrossBorderRules Success",
    props<{ crossBorderRulesEntity: MemberProfileEntity<CrossBorderRule[]> }>(),
);
export const loadCrossBorderRulesFailure = createAction(
    "[Members/Aflac API] Load CrossBorderRules Failure",
    props<{ error: MemberProfileEntity<ApiError> }>(),
);
// #endregion

const actions = union({
    setSelectedMemberId,

    loadMemberProfile,
    loadMemberProfileSuccess,
    loadMemberProfileFailure,

    loadSalaries,
    loadSalariesSuccess,
    loadSalariesFailure,

    loadMemberDependents,
    loadMemberDependentsSuccess,
    loadMemberDependentsFailure,

    loadRiskClasses,
    loadRiskClassesSuccess,
    loadRiskClassesFailure,

    loadQualifyingEvents,
    loadQualifyingEventsSuccess,
    loadQualifyingEventsFailure,

    loadMemberContacts,
    loadMemberContactsSuccess,
    loadMemberContactsFailure,

    loadMemberFlexDollars,
    loadMemberFlexDollarsSuccess,
    loadMemberFlexDollarsFailure,

    loadCrossBorderRules,
    loadCrossBorderRulesSuccess,
    loadCrossBorderRulesFailure,
});

export type ActionsUnion = typeof actions;
