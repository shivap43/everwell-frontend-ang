import { AsyncStatus, EnrollmentMethod } from "@empowered/constants";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { EnrollmentMethodModel } from "@empowered/ngxs-store";

import { NGRXEnrollmentState } from "./ngrx-sync.model";

export const MOCK_NGRX_ENROLLMENT_STATE: NGRXEnrollmentState = {
    mpGroup: 111, // This is supposed to always be a number (NGRX)
    memberId: 222,
    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,

    headsetCountryState: { abbreviation: "CA", name: "California" },
    selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
    selectedCity: "Los Angeles",
};

export const MOCK_NGXS_ENROLLMENT_STATE: EnrollmentMethodModel = {
    mpGroup: "111", // This is supposed to be a string and NOT a number (NGXS)
    memberId: 222,
    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
    enrollmentState: "Arizona",
    enrollmentStateAbbreviation: "AZ",
    enrollmentCity: "Los Angeles",
    headSetState: "California",
    headSetStateAbbreviation: "CA",
    userType: "Specific",
};

export const mockInitialState = {
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        selectedMemberId: 222,
        memberContactsEntities: memberContactsEntityAdapter.setOne(
            {
                identifiers: {
                    mpGroup: 111,
                    memberId: 222,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: mockMemberContacts,
                    error: null,
                },
            },
            { ...MembersState.initialState.memberContactsEntities },
        ),
    },
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
        selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
        selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
        selectedHeadsetState: { abbreviation: "CA", name: "California" },
        selectedCity: "Los Angeles",
        countryStates: {
            status: AsyncStatus.SUCCEEDED,
            value: [
                {
                    name: "Arizona",
                    abbreviation: "AZ",
                },
            ],
            error: null,
        },
    },
} as MembersPartialState & AccountsPartialState & SharedPartialState;
