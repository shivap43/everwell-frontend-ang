import {
    TobaccoStatusObject,
    Salary,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
} from "@empowered/constants";
import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";
import { CrossBorderRule } from "@empowered/api";

import { MemberProfileEntity, MemberProfileIdentifiers, MemberRiskClasses } from "./members.model";
import { AsyncData } from "@empowered/constants";

export const getMemberProfileEntityId = ({ memberId, mpGroup }: MemberProfileIdentifiers) => `${mpGroup}-${memberId}`;

// #region Members State
export const memberProfileEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberProfile>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type MemberProfileEntities = EntityState<MemberProfileEntity<AsyncData<MemberProfile>>>;

// #endregion

// #region Salaries State
export const salariesEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<Salary[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type SalariesEntities = EntityState<MemberProfileEntity<AsyncData<Salary[]>>>;
// #endregion

// #region Member Dependents State
export const memberDependentsEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberDependent[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type MemberDependentsEntities = EntityState<MemberProfileEntity<AsyncData<MemberDependent[]>>>;
// #endregion

// #region MemberRiskClasses State
export const riskClassesEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberRiskClasses>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type MemberRiskClassesEntities = EntityState<MemberProfileEntity<AsyncData<MemberRiskClasses>>>;
// #endregion

// #region QualifyingEvents State
export const qualifyingEventsEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberQualifyingEvent[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type QualifyingEventsEntities = EntityState<MemberProfileEntity<AsyncData<MemberQualifyingEvent[]>>>;
// #endregion

// #region MemberContacts State
export const memberContactsEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberContact[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type MemberContactsEntities = EntityState<MemberProfileEntity<AsyncData<MemberContact[]>>>;
// #endregion

// #region MemberFlexDollars State
export const memberFlexDollarsEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<MemberFlexDollar[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type MemberFlexDollarsEntities = EntityState<MemberProfileEntity<AsyncData<MemberFlexDollar[]>>>;
// #endregion

// #region CrossBorderRules State
export const crossBorderRulesEntityAdapter: EntityAdapter<MemberProfileEntity<AsyncData<CrossBorderRule[]>>> = createEntityAdapter({
    selectId: ({ identifiers }) => getMemberProfileEntityId(identifiers),
});

export type CrossBorderRulesEntities = EntityState<MemberProfileEntity<AsyncData<CrossBorderRule[]>>>;
// #endregion

export interface State {
    // which Members record has been selected
    selectedMemberId?: number | null;
    // tobaccoStatus is based on the latest update for any Member / Dependent
    tobaccoStatus?: TobaccoStatusObject | null;

    membersEntities: MemberProfileEntities;
    salariesEntities: SalariesEntities;
    memberDependentsEntities: MemberDependentsEntities;
    riskClassesEntities: MemberRiskClassesEntities;
    qualifyingEventsEntities: QualifyingEventsEntities;
    memberContactsEntities: MemberContactsEntities;
    memberFlexDollarsEntities: MemberFlexDollarsEntities;
    crossBorderRulesEntities: CrossBorderRulesEntities;
}

export const initialState: State = {
    membersEntities: memberProfileEntityAdapter.getInitialState({}),
    salariesEntities: salariesEntityAdapter.getInitialState({}),
    memberDependentsEntities: memberDependentsEntityAdapter.getInitialState({}),
    riskClassesEntities: riskClassesEntityAdapter.getInitialState({}),
    qualifyingEventsEntities: qualifyingEventsEntityAdapter.getInitialState({}),
    memberContactsEntities: memberContactsEntityAdapter.getInitialState({}),
    memberFlexDollarsEntities: memberFlexDollarsEntityAdapter.getInitialState({}),
    crossBorderRulesEntities: crossBorderRulesEntityAdapter.getInitialState({}),
};
