import { Injectable } from "@angular/core";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { EnrollmentMethodDetail, EnrollmentService, ShoppingService, AflacService } from "@empowered/api";
import { map } from "rxjs/operators";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { EnrollmentMethod, EnrollmentRider, EnrollmentDependent, EnrollmentBeneficiary, Enrollments } from "@empowered/constants";

import * as EnrollmentsActions from "./enrollments.actions";
import {
    getEnrollmentBeneficiariesEntityId,
    getEnrollmentDependentsEntityId,
    getEnrollmentMethodDetailsEntityId,
    getEnrollmentRidersEntityId,
    getEnrollmentsEntityId,
    getImportPolicyEntityId,
    getDownloadPreliminaryFormEntityId,
    getEmailPreliminaryFormEntityId,
} from "./enrollments.state";
import { getSerializableError } from "../../ngrx.store.helpers";

@Injectable()
export class EnrollmentsEffects {
    loadEnrollments$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadEnrollments),
            fetch({
                id: (identifiers) => getEnrollmentsEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.enrollmentService.getEnrollments(memberId, mpGroup).pipe(
                        // TODO [NGRX]: Enrollments has properties that are Date | string,
                        // But Date is not serializable which means we can't store it persistantly
                        // And will it cause errors
                        // TODO [Types]: Enrollments has properties like riders that doesn't actually come from the api
                        // These are values mutuated into the instance after the api response is received on the ngxs implementation
                        // We should provide an actual type that matches the api contract
                        map((enrollments: Enrollments[]) =>
                            EnrollmentsActions.loadEnrollmentsSuccess({
                                enrollmentsEntity: { identifiers: { memberId, mpGroup }, data: enrollments },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadEnrollmentsFailure({
                        error: { identifiers: { memberId, mpGroup }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    loadEnrollmentRiders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadEnrollmentRiders),
            fetch({
                id: (identifiers) => getEnrollmentRidersEntityId(identifiers),
                run: ({ memberId, mpGroup, enrollmentId }) =>
                    this.enrollmentService.getEnrollmentRiders(memberId, enrollmentId, mpGroup).pipe(
                        map((enrollmentRiders: EnrollmentRider[]) =>
                            EnrollmentsActions.loadEnrollmentRidersSuccess({
                                enrollmentRidersEntity: {
                                    identifiers: { memberId, mpGroup, enrollmentId },
                                    data: enrollmentRiders,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup, enrollmentId }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadEnrollmentRidersFailure({
                        error: { identifiers: { memberId, mpGroup, enrollmentId }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    loadEnrollmentMethodDetails$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadEnrollmentMethodDetails),
            fetch({
                id: (identifiers) => getEnrollmentMethodDetailsEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.shoppingService.getEnrollmentMethods(mpGroup).pipe(
                        map((enrollmentMethodDetails: EnrollmentMethodDetail[]) => {
                            const filteredEnrollmentMethodDetails = enrollmentMethodDetails.filter(
                                (method) => method.name !== EnrollmentMethod.SELF_SERVICE,
                            );

                            return EnrollmentsActions.loadEnrollmentMethodDetailsSuccess({
                                enrollmentMethodDetailsEntity: {
                                    identifiers: { mpGroup },
                                    data: filteredEnrollmentMethodDetails,
                                },
                            });
                        }),
                    ),
                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadEnrollmentMethodDetailsFailure({
                        error: { identifiers: { mpGroup }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    // Effect for loading beneficiary data of existing coverage
    loadEnrollmentBeneficiaries$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadEnrollmentBeneficiaries),
            fetch({
                id: (identifiers) => getEnrollmentBeneficiariesEntityId(identifiers),
                run: ({ memberId, enrollmentId, mpGroup }) =>
                    this.enrollmentService.getEnrollmentBeneficiaries(memberId, enrollmentId, mpGroup).pipe(
                        map((enrollmentBeneficiaries: EnrollmentBeneficiary[]) =>
                            EnrollmentsActions.loadEnrollmentBeneficiariesSuccess({
                                enrollmentBeneficiariesEntity: {
                                    identifiers: {
                                        memberId,
                                        enrollmentId,
                                        mpGroup,
                                    },
                                    data: enrollmentBeneficiaries,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, enrollmentId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadEnrollmentBeneficiariesFailure({
                        error: {
                            identifiers: {
                                memberId,
                                enrollmentId,
                                mpGroup,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    // Effect for loading dependent data of existing coverage
    loadEnrollmentDependents$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadEnrollmentDependents),
            fetch({
                id: (identifiers) => getEnrollmentDependentsEntityId(identifiers),
                run: ({ memberId, enrollmentId, mpGroup }) =>
                    this.enrollmentService.getEnrollmentDependents(memberId, enrollmentId, mpGroup).pipe(
                        map((dependents: EnrollmentDependent[]) =>
                            EnrollmentsActions.loadEnrollmentDependentsSuccess({
                                enrollmentDependentsEntity: {
                                    identifiers: {
                                        memberId,
                                        enrollmentId,
                                        mpGroup,
                                    },
                                    data: dependents,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, enrollmentId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadEnrollmentDependentsFailure({
                        error: {
                            identifiers: {
                                memberId,
                                enrollmentId,
                                mpGroup,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    // Effect for import policy
    loadImportPolicy$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.loadImportPolicy),
            fetch({
                id: (identifiers) => getImportPolicyEntityId(identifiers),
                run: ({ memberId, mpGroup }) =>
                    this.aflacService.importAflacPolicies(memberId, mpGroup).pipe(
                        map(() =>
                            EnrollmentsActions.loadImportPolicySuccess({
                                importPolicyEntity: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                    },
                                    data: null,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.loadImportPolicyFailure({
                        error: {
                            identifiers: {
                                memberId,
                                mpGroup,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    // effect for downloadPreliminaryForm api call that downloads the preliminary form
    downloadPreliminaryForm$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.downloadPreliminaryForm),
            fetch({
                id: (identifiers) => getDownloadPreliminaryFormEntityId(identifiers),
                run: ({ memberId, preliminaryFormPath, cartItemId, mpGroupId }) =>
                    this.enrollmentService.downloadPreliminaryForm(memberId, preliminaryFormPath, cartItemId, mpGroupId).pipe(
                        map((response: BlobPart) => {
                            const unSignedBlob = new Blob([response], { type: "application/pdf" });
                            const unSignedFileURL = window.URL.createObjectURL(unSignedBlob);
                            return EnrollmentsActions.downloadPreliminaryFormSuccess({
                                downloadPreliminaryFormEntity: {
                                    identifiers: {
                                        memberId,
                                        preliminaryFormPath,
                                        cartItemId,
                                        mpGroupId,
                                    },
                                    data: unSignedFileURL,
                                },
                            });
                        }),
                    ),

                onError: ({ memberId, preliminaryFormPath, cartItemId, mpGroupId }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.downloadPreliminaryFormFailure({
                        error: {
                            identifiers: {
                                memberId,
                                preliminaryFormPath,
                                cartItemId,
                                mpGroupId,
                            },
                            data: httpErrorResponse.error,
                        },
                    }),
            }),
        ),
    );

    // effect for emailPreliminaryForms api call that emails the preliminary forms
    emailPreliminaryForm$ = createEffect(() =>
        this.actions$.pipe(
            ofType(EnrollmentsActions.emailPreliminaryForm),
            fetch({
                id: (identifiers) => getEmailPreliminaryFormEntityId(identifiers),
                run: ({ memberId, email, mpGroupId, preliminaryForms }) =>
                    this.enrollmentService.emailPreliminaryForms(memberId, email, mpGroupId, preliminaryForms).pipe(
                        map((response: HttpResponse<unknown>) =>
                            EnrollmentsActions.emailPreliminaryFormSuccess({
                                emailPreliminaryFormEntity: {
                                    identifiers: {
                                        memberId,
                                        email,
                                        mpGroupId,
                                    },
                                    data: response,
                                },
                            }),
                        ),
                    ),

                onError: ({ memberId, email, mpGroupId }, httpErrorResponse: HttpErrorResponse) =>
                    EnrollmentsActions.emailPreliminaryFormFailure({
                        error: {
                            identifiers: {
                                memberId,
                                email,
                                mpGroupId,
                            },
                            data: httpErrorResponse.error,
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly shoppingService: ShoppingService,
        private readonly enrollmentService: EnrollmentService,
        private readonly aflacService: AflacService,
    ) {}
}
