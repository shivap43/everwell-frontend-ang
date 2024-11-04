import { Action, createReducer, on } from "@ngrx/store";
import { State, initialState, aflacAlwaysEnrollmentsEntityAdapter } from "./aflac-always.state";
import * as AflacAlwaysActions from "./aflac-always.actions";
import { AsyncStatus } from "@empowered/constants";

export const AFLAC_ALWAYS_FEATURE_KEY = "aflacalways";

export interface AflacAlwaysPartialState {
    readonly [AFLAC_ALWAYS_FEATURE_KEY]: State;
}

const aflacAlwaysReducer = createReducer(
    initialState,

    // Resets Aflac Always State
    on(AflacAlwaysActions.resetAflacAlwaysState, (): State => ({ ...initialState })),

    // For Fetching Aflac Always Enrollments
    on(
        AflacAlwaysActions.loadAflacAlwaysEnrollments,
        (state, { mpGroupId, memberId }): State => ({
            ...state,
            aflacAlwaysEnrollmentsEntities: aflacAlwaysEnrollmentsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroupId,
                        memberId,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.aflacAlwaysEnrollmentsEntities,
                },
            ),
        }),
    ),

    on(
        AflacAlwaysActions.loadAflacAlwaysEnrollmentsSuccess,
        (state, { aflacAlwaysEnrollmentsEntity }): State => ({
            ...state,
            aflacAlwaysEnrollmentsEntities: aflacAlwaysEnrollmentsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...aflacAlwaysEnrollmentsEntity.identifiers,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: aflacAlwaysEnrollmentsEntity.data,
                        error: null,
                    },
                },
                {
                    ...state.aflacAlwaysEnrollmentsEntities,
                },
            ),
        }),
    ),

    on(
        AflacAlwaysActions.loadAflacAlwaysEnrollmentsFailure,
        (state, { error }): State => ({
            ...state,
            aflacAlwaysEnrollmentsEntities: aflacAlwaysEnrollmentsEntityAdapter.setOne(
                {
                    identifiers: {
                        ...error.identifiers,
                    },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                {
                    ...state.aflacAlwaysEnrollmentsEntities,
                },
            ),
        }),
    ),

    // For setting the enrollment Ids chosen by the user
    on(
        AflacAlwaysActions.setAflacAlwaysEnrollmentIds,
        (state, { enrollmentIds }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: {
                ...state.aflacAlwaysEnrollmentsUserSelection,
                enrollmentIds,
            },
        }),
    ),

    // For setting the Pay Frequency chosen by the user
    on(
        AflacAlwaysActions.setAflacAlwaysPaymentFrequency,
        (state, { payFrequency }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: { ...state.aflacAlwaysEnrollmentsUserSelection, payFrequency },
        }),
    ),

    // For setting the subscriber Payment Id
    on(
        AflacAlwaysActions.setAflacAlwaysSubscriberPaymentId,
        (state, { subscriberPaymentId }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: { ...state.aflacAlwaysEnrollmentsUserSelection, subscriberPaymentId },
        }),
    ),

    // For setting the first payment day
    on(
        AflacAlwaysActions.setAflacAlwaysFirstPaymentDay,
        (state, { firstPaymentDay }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: { ...state.aflacAlwaysEnrollmentsUserSelection, firstPaymentDay },
        }),
    ),

    // For setting the subscriber's total cost
    on(
        AflacAlwaysActions.setAflacAlwaysCumulativeTotalCost,
        (state, { cumulativeTotalCost }): State => ({
            ...state,
            cumulativeTotalCost,
        }),
    ),

    on(
        AflacAlwaysActions.setAflacAlwaysEnrollmentMethod,
        (state, { enrollmentMethod }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: { ...state.aflacAlwaysEnrollmentsUserSelection, enrollmentMethod },
        }),
    ),

    // For setting the subscriber Payment Id
    on(
        AflacAlwaysActions.setAflacAlwaysEsignature,
        (state, { signature }): State => ({
            ...state,
            aflacAlwaysEnrollmentsUserSelection: { ...state.aflacAlwaysEnrollmentsUserSelection, signature },
        }),
    ),
);

export function reducer(state: State | undefined, action: Action): State {
    return aflacAlwaysReducer(state, action);
}
