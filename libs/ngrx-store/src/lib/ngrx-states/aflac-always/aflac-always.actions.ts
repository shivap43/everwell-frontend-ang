import { AflacAlwaysEnrollments, ApiError, EnrollmentMethod } from "@empowered/constants";
import { createAction, props, union } from "@ngrx/store";
import { AflacAlwaysEnrollmentsEntity } from "./aflac-always.model";

export const resetAflacAlwaysState = createAction("[AflacAlways] Reset Aflac Always State");

export const loadAflacAlwaysEnrollments = createAction(
    "[AflacAlways/API] Load AflacAlways Enrollments",
    props<{ mpGroupId: number; memberId: number }>(),
);

export const loadAflacAlwaysEnrollmentsSuccess = createAction(
    "[AflacAlways/API] Load AflacAlways Enrollments Success",
    props<{ aflacAlwaysEnrollmentsEntity: AflacAlwaysEnrollmentsEntity<AflacAlwaysEnrollments[]> }>(),
);

export const loadAflacAlwaysEnrollmentsFailure = createAction(
    "[AflacAlways/API] Load AflacAlways Enrollments Failure",
    props<{ error: AflacAlwaysEnrollmentsEntity<ApiError> }>(),
);

export const setAflacAlwaysEnrollmentIds = createAction(
    "[AflacAlways] Sets Aflac Always Enrollments",
    props<{ enrollmentIds: number[] }>(),
);

export const setAflacAlwaysPaymentFrequency = createAction(
    "[AflacAlways] Sets Aflac Always Payment Frequency",
    props<{ payFrequency: string }>(),
);

export const setAflacAlwaysSubscriberPaymentId = createAction(
    "[AflacAlways] Sets Aflac Always Subscriber Payment Id",
    props<{ subscriberPaymentId: number }>(),
);

export const setAflacAlwaysFirstPaymentDay = createAction(
    "[Aflac Always] Sets Aflac Always First Payment Date",
    props<{ firstPaymentDay: number }>(),
);

export const setAflacAlwaysCumulativeTotalCost = createAction(
    "[AflacAlways] Sets Aflac Always Total Cost",
    props<{ cumulativeTotalCost: number }>(),
);

export const setAflacAlwaysEnrollmentMethod = createAction(
    "[AflacAlways] Sets Aflac Always Enrollment Method",
    props<{ enrollmentMethod: EnrollmentMethod }>(),
);

export const setAflacAlwaysEsignature = createAction("[AflacAlways] Sets Aflac Always Esignature", props<{ signature: string }>());

const actions = union({
    loadAflacAlwaysEnrollments,
    loadAflacAlwaysEnrollmentsSuccess,
    loadAflacAlwaysEnrollmentsFailure,

    setAflacAlwaysEnrollmentIds,
    setAflacAlwaysPaymentFrequency,
    setAflacAlwaysSubscriberPaymentId,
    setAflacAlwaysFirstPaymentDay,
    setAflacAlwaysCumulativeTotalCost,
    setAflacAlwaysEnrollmentMethod,
    setAflacAlwaysEsignature,
});

export type ActionsUnion = typeof actions;
