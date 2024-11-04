import { HttpResponse } from "@angular/common/http";
import { EnrollmentMethodDetail } from "@empowered/api";
import { ApiError, EnrollmentRider, EnrollmentDependent, EnrollmentBeneficiary, Enrollments, PreliminaryForm } from "@empowered/constants";
import { createAction, props, union } from "@ngrx/store";

import {
    DownloadPreliminaryFormEntity,
    EmailPreliminaryFormEntity,
    EnrolledDependentEntity,
    EnrollmentBeneficiariesEntity,
    EnrollmentMethodDetailsEntity,
    EnrollmentRidersEntity,
    EnrollmentsEntity,
    ImportPolicyEntity,
} from "./enrollments.model";

// Set which enrollmentId is associated with the currently selected Enrollments (and all related instances such as EnrollmentRiders)
export const setSelectedEnrollmentId = createAction("[Enrollments] Set Selected EnrollmentId", props<{ enrollmentId: number }>());

export const loadEnrollments = createAction("[Enrollments/API] Load Enrollments", props<{ memberId: number; mpGroup: number }>());

export const loadEnrollmentsSuccess = createAction(
    "[Enrollments/API] Load Enrollments Success",
    props<{ enrollmentsEntity: EnrollmentsEntity<Enrollments[]> }>(),
);

export const loadEnrollmentsFailure = createAction(
    "[Enrollments/API] Load Enrollments Failure",
    props<{ error: EnrollmentsEntity<ApiError> }>(),
);

export const loadEnrollmentRiders = createAction(
    "[Enrollments/API] Load EnrollmentRiders",
    props<{ memberId: number; mpGroup: number; enrollmentId: number }>(),
);

export const loadEnrollmentRidersSuccess = createAction(
    "[Enrollments/API] Load EnrollmentRiders Success",
    props<{ enrollmentRidersEntity: EnrollmentRidersEntity<EnrollmentRider[]> }>(),
);

export const loadEnrollmentRidersFailure = createAction(
    "[Enrollments/API] Load EnrollmentRiders Failure",
    props<{ error: EnrollmentRidersEntity<ApiError> }>(),
);

export const loadEnrollmentMethodDetails = createAction(
    "[GetEnrollmentMethods/Shopping/API] Get EnrollmentMethodDetails",
    props<{ mpGroup: number }>(),
);

export const loadEnrollmentMethodDetailsSuccess = createAction(
    "[GetEnrollmentMethods/Shopping/API] Get EnrollmentMethodDetails Success",
    props<{ enrollmentMethodDetailsEntity: EnrollmentMethodDetailsEntity<EnrollmentMethodDetail[]> }>(),
);

export const loadEnrollmentMethodDetailsFailure = createAction(
    "[GetEnrollmentMethods/Shopping/API] Get EnrollmentMethodDetails Failure",
    props<{ error: EnrollmentMethodDetailsEntity<ApiError> }>(),
);

// Load beneficiaries information of enrolled plan coverage data
export const loadEnrollmentBeneficiaries = createAction(
    "[PlanOfferings/Shopping/API] Load beneficiaries for enrolled Coverage",
    props<{ memberId: number; enrollmentId: number; mpGroup: number }>(),
);

// Load beneficiaries information of enrolled plan coverage data success
export const loadEnrollmentBeneficiariesSuccess = createAction(
    "[PlanOfferings/Shopping/API] Load beneficiaries for enrolled Coverage Success",
    props<{ enrollmentBeneficiariesEntity: EnrollmentBeneficiariesEntity<EnrollmentBeneficiary[]> }>(),
);

// Load beneficiaries information of enrolled plan coverage data failure
export const loadEnrollmentBeneficiariesFailure = createAction(
    "[PlanOfferings/Shopping/API] Load beneficiaries for enrolled Coverage failure",
    props<{ error: EnrollmentBeneficiariesEntity<ApiError> }>(),
);

// Load dependent information of enrolled plan coverage data
export const loadEnrollmentDependents = createAction(
    "[PlanOfferings/Shopping/API] Load Enrollment Dependents",
    props<{ memberId: number; enrollmentId: number; mpGroup: number }>(),
);

// Load dependent information of enrolled plan coverage data success
export const loadEnrollmentDependentsSuccess = createAction(
    "[PlanOfferings/Shopping/API] Load Enrollment Dependents Success",
    props<{ enrollmentDependentsEntity: EnrolledDependentEntity<EnrollmentDependent[]> }>(),
);

// Load dependent information of enrolled plan coverage data failure
export const loadEnrollmentDependentsFailure = createAction(
    "[PlanOfferings/Shopping/API] Load Enrollment Dependents failure",
    props<{ error: EnrolledDependentEntity<ApiError> }>(),
);

// Import policy from Aflac on backend
export const loadImportPolicy = createAction(
    "[AflacService/Policies/API] Import Policy",
    props<{
        memberId: number;
        mpGroup: number;
    }>(),
);

// Import policy from Aflac success
export const loadImportPolicySuccess = createAction(
    "[AflacService/Policies/API] Import policy Success",
    props<{ importPolicyEntity: ImportPolicyEntity<string | null> }>(),
);

// Import policy from Aflac failure
export const loadImportPolicyFailure = createAction(
    "[AflacService/Policies/API] Import policy failure",
    props<{ error: ImportPolicyEntity<ApiError> }>(),
);

// action called to download the preliminary form
export const downloadPreliminaryForm = createAction(
    "[Enrollments/PreliminaryStatement/API] Download preliminary form",
    props<{
        memberId: number;
        preliminaryFormPath: string;
        cartItemId: number;
        mpGroupId: number;
    }>(),
);

// action automatically triggered on successful download of the preliminary form
export const downloadPreliminaryFormSuccess = createAction(
    "[Enrollments/PreliminaryStatement/API] Download Preliminary Form Success",
    props<{ downloadPreliminaryFormEntity: DownloadPreliminaryFormEntity<string> }>(),
);

// action automatically triggered on failure to download the preliminary form
export const downloadPreliminaryFormFailure = createAction(
    "[Enrollments/PreliminaryStatement/API] Download Preliminary Form Failure",
    props<{ error: DownloadPreliminaryFormEntity<ApiError> }>(),
);

// action called to email the preliminary form
export const emailPreliminaryForm = createAction(
    "[Enrollments/PreliminaryStatement/API] Email preliminary form",
    props<{
        memberId: number;
        email: string;
        mpGroupId: number;
        preliminaryForms: PreliminaryForm[];
    }>(),
);

// action automatically triggered on successful email of the preliminary form
export const emailPreliminaryFormSuccess = createAction(
    "[Enrollments/PreliminaryStatement/API] Email Preliminary Form Success",
    props<{ emailPreliminaryFormEntity: EmailPreliminaryFormEntity<HttpResponse<unknown>> }>(),
);

// action automatically triggered on failure to email the preliminary form
export const emailPreliminaryFormFailure = createAction(
    "[Enrollments/PreliminaryStatement/API] Email Preliminary Form Failure",
    props<{ error: EmailPreliminaryFormEntity<ApiError> }>(),
);

const actions = union({
    setSelectedEnrollmentId,

    loadEnrollments,
    loadEnrollmentsSuccess,
    loadEnrollmentsFailure,

    loadEnrollmentRiders,
    loadEnrollmentRidersSuccess,
    loadEnrollmentRidersFailure,

    loadEnrollmentMethodDetails,
    loadEnrollmentMethodDetailsSuccess,
    loadEnrollmentMethodDetailsFailure,

    loadEnrollmentBeneficiaries,
    loadEnrollmentBeneficiariesSuccess,
    loadEnrollmentBeneficiariesFailure,

    loadEnrollmentDependents,
    loadEnrollmentDependentsSuccess,
    loadEnrollmentDependentsFailure,

    loadImportPolicy,
    loadImportPolicySuccess,
    loadImportPolicyFailure,

    downloadPreliminaryForm,
    downloadPreliminaryFormSuccess,
    downloadPreliminaryFormFailure,

    emailPreliminaryForm,
    emailPreliminaryFormSuccess,
    emailPreliminaryFormFailure,
});

export type ActionsUnion = typeof actions;
