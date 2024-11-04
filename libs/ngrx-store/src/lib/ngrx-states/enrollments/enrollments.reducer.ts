import { AsyncStatus } from "@empowered/constants";
import { createReducer, on, Action } from "@ngrx/store";

import { GlobalActions } from "../global";
import * as EnrollmentsActions from "./enrollments.actions";
import {
    enrollmentsEntityAdapter,
    enrollmentMethodDetailsEntityAdapter,
    State,
    initialState,
    enrollmentBeneficiariesEntityAdapter,
    enrollmentDependentsEntityAdapter,
    importPolicyEntityAdapter,
    enrollmentRidersEntityAdapter,
    downloadPreliminaryFormEntityAdapter,
    emailPreliminaryFormEntityAdapter,
} from "./enrollments.state";

export const ENROLLMENTS_FEATURE_KEY = "enrollments";

export interface EnrollmentsPartialState {
    readonly [ENROLLMENTS_FEATURE_KEY]: State;
}
const enrollmentsReducer = createReducer(
    initialState,

    // Reinitialize EnrollmentsState when all Member related state is cleared
    on(GlobalActions.clearMemberRelatedState, (state): State => ({ ...initialState, selectedEnrollmentId: state.selectedEnrollmentId })),

    // Set which enrollmentId is associated with the currently selected Enrollments (and all related instances such as EnrollmentRiders)
    on(
        EnrollmentsActions.setSelectedEnrollmentId,
        GlobalActions.setSelectedPlanPanelIdentifiers,
        (state, { enrollmentId }): State => ({ ...state, selectedEnrollmentId: enrollmentId }),
    ),

    // #region EnrollmentSets
    on(
        EnrollmentsActions.loadEnrollments,
        (state, { mpGroup, memberId }): State => ({
            ...state,
            enrollmentsEntities: enrollmentsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, memberId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.enrollmentsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentsSuccess,
        (state, { enrollmentsEntity }): State => ({
            ...state,
            enrollmentsEntities: enrollmentsEntityAdapter.setOne(
                {
                    identifiers: { ...enrollmentsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...enrollmentsEntity.data],
                        error: null,
                    },
                },
                { ...state.enrollmentsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentsFailure,
        (state, { error }): State => ({
            ...state,
            enrollmentsEntities: enrollmentsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.enrollmentsEntities },
            ),
        }),
    ),
    // #endregion

    // #region EnrollmentRiders
    on(
        EnrollmentsActions.loadEnrollmentRiders,
        (state, { mpGroup, memberId, enrollmentId }): State => ({
            ...state,
            enrollmentRidersEntities: enrollmentRidersEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, memberId, enrollmentId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.enrollmentRidersEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentRidersSuccess,
        (state, { enrollmentRidersEntity }): State => ({
            ...state,
            enrollmentRidersEntities: enrollmentRidersEntityAdapter.setOne(
                {
                    identifiers: { ...enrollmentRidersEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...enrollmentRidersEntity.data],
                        error: null,
                    },
                },
                { ...state.enrollmentRidersEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentRidersFailure,
        (state, { error }): State => ({
            ...state,
            enrollmentRidersEntities: enrollmentRidersEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.enrollmentRidersEntities },
            ),
        }),
    ),
    // #endregion

    // #region EnrollmentMethodDetails
    on(
        EnrollmentsActions.loadEnrollmentMethodDetails,
        (state, { mpGroup }): State => ({
            ...state,
            enrollmentMethodDetailsEntities: enrollmentMethodDetailsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.enrollmentMethodDetailsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentMethodDetailsSuccess,
        (state, { enrollmentMethodDetailsEntity }): State => ({
            ...state,
            enrollmentMethodDetailsEntities: enrollmentMethodDetailsEntityAdapter.setOne(
                {
                    identifiers: { ...enrollmentMethodDetailsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...enrollmentMethodDetailsEntity.data],
                        error: null,
                    },
                },
                { ...state.enrollmentMethodDetailsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentMethodDetailsFailure,
        (state, { error }): State => ({
            ...state,
            enrollmentMethodDetailsEntities: enrollmentMethodDetailsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.enrollmentMethodDetailsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentBeneficiaries,
        (state, action): State => ({
            ...state,
            enrollmentBeneficiariesEntities: enrollmentBeneficiariesEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId: action.memberId,
                        enrollmentId: action.enrollmentId,
                        mpGroup: action.mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.enrollmentBeneficiariesEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentBeneficiariesSuccess,
        (state, { enrollmentBeneficiariesEntity }): State => ({
            ...state,
            enrollmentBeneficiariesEntities: enrollmentBeneficiariesEntityAdapter.setOne(
                {
                    identifiers: { ...enrollmentBeneficiariesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...enrollmentBeneficiariesEntity.data],
                        error: null,
                    },
                },
                { ...state.enrollmentBeneficiariesEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentBeneficiariesFailure,
        (state, { error }): State => ({
            ...state,
            enrollmentBeneficiariesEntities: enrollmentBeneficiariesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.enrollmentBeneficiariesEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentDependents,
        (state, action): State => ({
            ...state,
            enrollmentDependentsEntities: enrollmentDependentsEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId: action.memberId,
                        enrollmentId: action.enrollmentId,
                        mpGroup: action.mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.enrollmentDependentsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentDependentsSuccess,
        (state, { enrollmentDependentsEntity }): State => ({
            ...state,
            enrollmentDependentsEntities: enrollmentDependentsEntityAdapter.setOne(
                {
                    identifiers: { ...enrollmentDependentsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...enrollmentDependentsEntity.data],
                        error: null,
                    },
                },
                { ...state.enrollmentDependentsEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadEnrollmentDependentsFailure,
        (state, { error }): State => ({
            ...state,
            enrollmentDependentsEntities: enrollmentDependentsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.enrollmentDependentsEntities },
            ),
        }),
    ),
    // #endregion

    //  #region ImportAflacPolicies
    on(
        EnrollmentsActions.loadImportPolicy,
        (state, action): State => ({
            ...state,
            importPolicyEntities: importPolicyEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId: action.memberId,
                        mpGroup: action.mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.importPolicyEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadImportPolicySuccess,
        (state, { importPolicyEntity }): State => ({
            ...state,
            importPolicyEntities: importPolicyEntityAdapter.setOne(
                {
                    identifiers: { ...importPolicyEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: importPolicyEntity.data,
                        error: null,
                    },
                },
                { ...state.importPolicyEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.loadImportPolicyFailure,
        (state, { error }): State => ({
            ...state,
            importPolicyEntities: importPolicyEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.importPolicyEntities },
            ),
        }),
    ),
    // #endregion

    // #region DownloadPreliminaryForm
    on(
        EnrollmentsActions.downloadPreliminaryForm,
        (state, { memberId, preliminaryFormPath, cartItemId, mpGroupId }): State => ({
            ...state,
            downloadPreliminaryFormEntities: downloadPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        preliminaryFormPath,
                        cartItemId,
                        mpGroupId,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.downloadPreliminaryFormEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.downloadPreliminaryFormSuccess,
        (state, { downloadPreliminaryFormEntity }): State => ({
            ...state,
            downloadPreliminaryFormEntities: downloadPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: { ...downloadPreliminaryFormEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: downloadPreliminaryFormEntity.data,
                        error: null,
                    },
                },
                { ...state.downloadPreliminaryFormEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.downloadPreliminaryFormFailure,
        (state, { error }): State => ({
            ...state,
            downloadPreliminaryFormEntities: downloadPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.downloadPreliminaryFormEntities },
            ),
        }),
    ),
    // #endregion

    // #region EmailPreliminaryForm
    on(
        EnrollmentsActions.emailPreliminaryForm,
        (state, { memberId, email, mpGroupId }): State => ({
            ...state,
            emailPreliminaryFormEntities: emailPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        email,
                        mpGroupId,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.emailPreliminaryFormEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.emailPreliminaryFormSuccess,
        (state, { emailPreliminaryFormEntity }): State => ({
            ...state,
            emailPreliminaryFormEntities: emailPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: { ...emailPreliminaryFormEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: emailPreliminaryFormEntity.data,
                        error: null,
                    },
                },
                { ...state.emailPreliminaryFormEntities },
            ),
        }),
    ),
    on(
        EnrollmentsActions.emailPreliminaryFormFailure,
        (state, { error }): State => ({
            ...state,
            emailPreliminaryFormEntities: emailPreliminaryFormEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.emailPreliminaryFormEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return enrollmentsReducer(state, action);
}
