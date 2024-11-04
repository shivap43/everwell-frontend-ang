import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ShoppingService, CoreService, KnockoutQuestion, ShoppingCartDisplayService } from "@empowered/api";
import {
    ClientErrorResponseCode,
    CoverageDatesEnrollmentType,
    EnrollmentType,
    CoverageLevel,
    PlanOffering,
    CoverageDatesRecord,
    ApplicationResponse,
    PlanOfferingPricing,
    MoreSettings,
} from "@empowered/constants";
import { getSerializableError } from "../../ngrx.store.helpers";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { combineLatest, forkJoin, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

import * as PlanOfferingsActions from "./plan-offerings.actions";
import { PlanOfferingsApiResponse } from "./plan-offerings.model";
import {
    getCoverageDatesRecordEntityId,
    getCoverageLevelEntityId,
    getKnockoutResponsesEntityId,
    getPlanOfferingPricingsEntityId,
    getPlanOfferingRidersEntityId,
    getPlanOfferingsEntityId,
} from "./plan-offerings.state";

@Injectable()
export class PlanOfferingsEffects {
    loadPlanOfferings$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadPlanOfferings),
            fetch({
                id: (identifiers) => getPlanOfferingsEntityId(identifiers),
                run: (action) => {
                    const { mpGroup, enrollmentMethod, stateAbbreviation, memberId, referenceDate } = action;

                    return this.getPlanOfferings(action).pipe(
                        map((planOfferingsArray: PlanOffering[][]) =>
                            PlanOfferingsActions.loadPlanOfferingsSuccess({
                                planOfferingsEntity: {
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                        enrollmentMethod,
                                        stateAbbreviation,
                                        referenceDate,
                                    },
                                    // Sorting product offerings based on display order before saving to store
                                    data: this.sortArrayOfPlanOfferings(planOfferingsArray),
                                },
                            }),
                        ),
                    );
                },

                onError: (
                    { mpGroup, enrollmentMethod, memberId, stateAbbreviation, referenceDate },
                    httpErrorResponse: HttpErrorResponse,
                ) =>
                    PlanOfferingsActions.loadPlanOfferingsFailure({
                        error: {
                            identifiers: { mpGroup, memberId, enrollmentMethod, stateAbbreviation, referenceDate },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadPlanOfferingRiders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadPlanOfferingRiders),
            fetch({
                id: (identifiers) => getPlanOfferingRidersEntityId(identifiers),
                run: ({ planOfferingId, mpGroup, enrollmentMethod, stateAbbreviation, memberId, coverageEffectiveDate }) =>
                    this.shoppingService
                        .getPlanOfferingRiders(
                            planOfferingId.toString(),
                            mpGroup,
                            enrollmentMethod,
                            stateAbbreviation,
                            memberId,
                            coverageEffectiveDate,
                            {},
                        )
                        .pipe(
                            map((planOfferingRiders: PlanOffering[]) =>
                                PlanOfferingsActions.loadPlanOfferingRidersSuccess({
                                    planOfferingRidersEntity: {
                                        identifiers: {
                                            planOfferingId,
                                            mpGroup,
                                            memberId,
                                            enrollmentMethod,
                                            stateAbbreviation,
                                        },
                                        data: this.sortPlanOfferings(planOfferingRiders),
                                    },
                                }),
                            ),
                        ),

                onError: (
                    { planOfferingId, mpGroup, enrollmentMethod, stateAbbreviation, memberId },
                    httpErrorResponse: HttpErrorResponse,
                ) =>
                    PlanOfferingsActions.loadPlanOfferingRidersFailure({
                        error: {
                            identifiers: { planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviation },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadCoverageDateRecord$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadCoverageDateRecord),
            fetch({
                id: (identifiers) => getCoverageDatesRecordEntityId(identifiers),
                run: ({ mpGroup, memberId, coverageDatesEnrollmentType, referenceDate }) => {
                    const enrollmentType: EnrollmentType | null = this.getEnrollmentType(coverageDatesEnrollmentType);
                    return this.shoppingService.getPlanCoverageDatesMap(memberId, mpGroup, enrollmentType, referenceDate).pipe(
                        map((coverageDatesRecord: CoverageDatesRecord) =>
                            PlanOfferingsActions.loadCoverageDateRecordSuccess({
                                coverageDatesRecordEntity: {
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                        coverageDatesEnrollmentType,
                                        referenceDate,
                                    },
                                    data: coverageDatesRecord,
                                },
                            }),
                        ),
                    );
                },

                onError: ({ mpGroup, memberId, coverageDatesEnrollmentType, referenceDate }, httpErrorResponse: HttpErrorResponse) =>
                    PlanOfferingsActions.loadCoverageDateRecordFailure({
                        error: {
                            identifiers: { mpGroup, memberId, coverageDatesEnrollmentType, referenceDate },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadCoverageLevels$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadCoverageLevels),
            fetch({
                id: (identifiers) => getCoverageLevelEntityId(identifiers),
                run: ({ planId, mpGroup, parentCoverageLevelId, fetchRetainRiders, stateCode }) =>
                    this.coreService.getCoverageLevels(planId.toString(), parentCoverageLevelId, !!fetchRetainRiders, stateCode, true).pipe(
                        map((coverageLevels: CoverageLevel[]) =>
                            PlanOfferingsActions.loadCoverageLevelsSuccess({
                                coverageLevelsEntity: {
                                    identifiers: {
                                        planId,
                                        mpGroup,
                                        parentCoverageLevelId,
                                        fetchRetainRiders,
                                        stateCode,
                                    },
                                    data: coverageLevels,
                                },
                            }),
                        ),
                    ),
                onError: ({ planId, mpGroup, parentCoverageLevelId, fetchRetainRiders, stateCode }, httpErrorResponse: HttpErrorResponse) =>
                    PlanOfferingsActions.loadCoverageLevelsFailure({
                        error: {
                            identifiers: {
                                planId,
                                mpGroup,
                                parentCoverageLevelId,
                                fetchRetainRiders,
                                stateCode,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadKnockoutQuestions$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadKnockoutQuestions),
            fetch({
                id: (identifiers) => getKnockoutResponsesEntityId(identifiers),
                run: ({ planOfferingId, mpGroup, memberId, stateAbbreviation }) =>
                    this.shoppingService.getKnockoutQuestions(planOfferingId, stateAbbreviation, mpGroup, memberId).pipe(
                        map((knockoutQuestions: KnockoutQuestion[]) =>
                            PlanOfferingsActions.loadKnockoutQuestionsSuccess({
                                knockoutQuestionsEntity: {
                                    identifiers: {
                                        planOfferingId,
                                        mpGroup,
                                        memberId,
                                        stateAbbreviation,
                                    },
                                    data: knockoutQuestions,
                                },
                            }),
                        ),
                    ),
                onError: ({ planOfferingId, stateAbbreviation, mpGroup, memberId }, httpErrorResponse: HttpErrorResponse) =>
                    PlanOfferingsActions.loadKnockoutQuestionsFailure({
                        error: {
                            identifiers: {
                                planOfferingId,
                                mpGroup,
                                memberId,
                                stateAbbreviation,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadKnockoutResponses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadKnockoutResponses),
            fetch({
                id: (identifiers) => getKnockoutResponsesEntityId(identifiers),
                run: ({ mpGroup, memberId, cartItemIds }) =>
                    combineLatest(
                        cartItemIds.map((cartItemId) =>
                            this.shoppingCartDisplayService.getApplicationResponses(memberId, cartItemId, mpGroup),
                        ),
                    ).pipe(
                        map((knockoutResponses: ApplicationResponse[][]) =>
                            PlanOfferingsActions.loadKnockoutResponsesSuccess({
                                knockoutResponsesEntity: {
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                    },
                                    data: knockoutResponses,
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroup, memberId }, httpErrorResponse: HttpErrorResponse) =>
                    PlanOfferingsActions.loadKnockoutResponsesFailure({
                        error: {
                            identifiers: {
                                mpGroup,
                                memberId,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    saveKnockoutResponses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.saveKnockoutResponses),
            fetch({
                id: (identifiers) => getKnockoutResponsesEntityId(identifiers),
                run: ({ mpGroup, memberId, cartItemId, responses, applicationResponseBaseType }) =>
                    this.shoppingCartDisplayService
                        .saveApplicationResponse(memberId, cartItemId, mpGroup, responses, applicationResponseBaseType)
                        .pipe(
                            map(() =>
                                PlanOfferingsActions.saveKnockoutResponsesSuccess({
                                    knockoutResponsesEntity: {
                                        identifiers: {
                                            mpGroup,
                                            memberId,
                                        },
                                        data: null,
                                    },
                                }),
                            ),
                        ),
                onError: ({ mpGroup, memberId }, httpErrorResponse: HttpErrorResponse) =>
                    PlanOfferingsActions.saveKnockoutResponsesFailure({
                        error: {
                            identifiers: {
                                mpGroup,
                                memberId,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadPlanOfferingPricings$ = createEffect(() =>
        this.actions$.pipe(
            ofType(PlanOfferingsActions.loadPlanOfferingPricings),
            fetch({
                id: (identifiers) => getPlanOfferingPricingsEntityId(identifiers),
                run: ({
                    planOfferingId,
                    memberId,
                    mpGroup,
                    stateAbbreviation,
                    parentPlanId,
                    parentPlanCoverageLevelId,
                    baseBenefitAmount,
                    memberIsTobaccoUser,
                    spouseIsTobaccoUser,
                    coverageEffectiveDate,
                    riskClassId,
                    shoppingCartItemId,
                    includeFee,
                }) => {
                    const moreSettings: MoreSettings = {
                        tobaccoUser: memberIsTobaccoUser ?? undefined,
                        spouseTobaccoUser: spouseIsTobaccoUser ?? undefined,
                    };

                    return this.shoppingService
                        .getPlanOfferingPricing(
                            planOfferingId.toString(),
                            stateAbbreviation,
                            moreSettings,
                            memberId,
                            mpGroup,
                            parentPlanId,
                            parentPlanCoverageLevelId,
                            baseBenefitAmount,
                            undefined,
                            coverageEffectiveDate,
                            riskClassId,
                            false,
                            shoppingCartItemId,
                            includeFee,
                        )
                        .pipe(
                            map((planPricing: PlanOfferingPricing[]) =>
                                PlanOfferingsActions.loadPlanOfferingPricingsSuccess({
                                    planOfferingPricingsEntity: {
                                        identifiers: {
                                            planOfferingId,
                                            memberId,
                                            mpGroup,
                                            stateAbbreviation,
                                            parentPlanId,
                                            parentPlanCoverageLevelId,
                                            baseBenefitAmount,
                                            memberIsTobaccoUser,
                                            spouseIsTobaccoUser,
                                            coverageEffectiveDate,
                                            riskClassId,
                                            shoppingCartItemId,
                                            includeFee,
                                        },
                                        data: planPricing,
                                    },
                                }),
                            ),
                        );
                },
                onError: (
                    {
                        planOfferingId,
                        memberId,
                        mpGroup,
                        stateAbbreviation,
                        parentPlanId,
                        parentPlanCoverageLevelId,
                        baseBenefitAmount,
                        memberIsTobaccoUser,
                        spouseIsTobaccoUser,
                        coverageEffectiveDate,
                        riskClassId,
                        shoppingCartItemId,
                        includeFee,
                    },
                    httpErrorResponse: HttpErrorResponse,
                ) =>
                    PlanOfferingsActions.loadPlanOfferingPricingsFailure({
                        error: {
                            identifiers: {
                                planOfferingId,
                                memberId,
                                mpGroup,
                                stateAbbreviation,
                                parentPlanId,
                                parentPlanCoverageLevelId,
                                baseBenefitAmount,
                                memberIsTobaccoUser,
                                spouseIsTobaccoUser,
                                coverageEffectiveDate,
                                riskClassId,
                                shoppingCartItemId,
                                includeFee,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
    ) {}

    /**
     * Handle making API Requests for PlanOfferings for each ProductOffering. If `productOfferingIds`
     * is provided in `PlanOfferingsActions.loadPlanOfferings`,
     * makes individual API Requests instead of making one API request for all ProductOfferings.
     * This is done to achieve better performance.
     *
     * @param action {PlanOfferingsActions.loadPlanOfferings} PlanOfferingsActions.loadPlanOfferings NGRX Action
     *
     * @returns {Observable<PlanOffering[][]>} 2d Array of PlanOfferings for each ProductOffering
     */
    getPlanOfferings(action: ReturnType<typeof PlanOfferingsActions.loadPlanOfferings>): Observable<PlanOffering[][]> {
        const { mpGroup, enrollmentMethod, stateAbbreviation, memberId, referenceDate, productOfferingIds } = action;

        // If there are no list of ProductOffering ids, make one request with no ProductOffering id
        // This should get all PlanOfferings for all ProductOfferings
        // Or throw an HttpErrorResponse
        if (!productOfferingIds.length) {
            return this.shoppingService
                .getPlanOfferings(undefined, enrollmentMethod, stateAbbreviation, {}, memberId, mpGroup, "plan.productId", referenceDate)
                .pipe(map((planOfferings) => [planOfferings]));
        }

        // If there is a list of ProductOffering ids, make multiple requests for each ProductOffering id
        // This should PlanOfferings for each ProductOfferings
        // Or throw an HttpErrorResponse if response code isn't 400 or 409
        return forkJoin(
            productOfferingIds.map((productOfferingId) =>
                this.shoppingService
                    .getPlanOfferings(
                        productOfferingId.toString(),
                        enrollmentMethod,
                        stateAbbreviation,
                        {},
                        memberId,
                        mpGroup,
                        "plan.productId",
                        referenceDate,
                    )
                    .pipe(
                        // Store Successful API Responses for PlanOffering[]
                        map((planOfferings) => this.getPlanOfferingsApiResponse({ planOfferings })),
                        // Store Failed API Responses for HttpErrorResponse
                        // Or throw an HttpErrorResponse if response code isn't 400 or 409
                        catchError((httpErrorResponse: HttpErrorResponse) => of(this.getPlanOfferingsApiResponse({ httpErrorResponse }))),
                    ),
            ),
        ).pipe(
            map((apiResponses: PlanOfferingsApiResponse[]) => {
                // If every API Request failed, throw first HttpErrorResponse
                if (apiResponses.every((apiResponse) => !!apiResponse.httpErrorResponse)) {
                    throw apiResponses[0].httpErrorResponse;
                }

                // Map each PlanOffering[] to each ProductOffering
                // Use empty array for any ProductOfferings that got an error
                return apiResponses.map((apiResponse) => apiResponse.planOfferings ?? []);
            }),
        );
    }

    /**
     * Used to check for API errors involving anything that is not a 400 or 409 response code.
     * If there is an API Error with some other response code (such as 500), method is expected to throw
     *
     * @param apiResponse {PlanOfferingsApiResponse} PlanOfferings or HttpErrorResponse from API response
     *
     * @returns {PlanOfferingsApiResponse} Same apiResponse if there is no error or if error has response code 400 or 409
     */
    getPlanOfferingsApiResponse(apiResponse: PlanOfferingsApiResponse): PlanOfferingsApiResponse {
        // PlanOfferingsApiResponse has planOfferings property
        // This implies that there is no error
        if (apiResponse.planOfferings) {
            return apiResponse;
        }

        // PlanOfferingsApiResponse has error, but status code is 400 or 409,
        // This is a safe error that doesn't require throwing
        if (
            apiResponse.httpErrorResponse.status === ClientErrorResponseCode.RESP_400 ||
            apiResponse.httpErrorResponse.status === ClientErrorResponseCode.RESP_409
        ) {
            return apiResponse;
        }

        // Handle any other error by throwing
        throw apiResponse.httpErrorResponse;
    }

    /**
     * gets enrollment type based on coverageDatesEnrollmentType
     * @param coverageDatesEnrollmentType with three enum values
     * @returns {EnrollmentType} with 2 enum values
     */
    getEnrollmentType(coverageDatesEnrollmentType: CoverageDatesEnrollmentType): EnrollmentType | null {
        switch (coverageDatesEnrollmentType) {
            case CoverageDatesEnrollmentType.OPEN_ENROLLMENT:
                return EnrollmentType.OPEN_ENROLLMENT;
            case CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT:
                return EnrollmentType.QUALIFYING_LIFE_EVENT;
            default:
                return null;
        }
    }
    /**
     * sort arrays of planOfferings based on display order
     * @param planOfferingsArray array of plan offerings
     * @returns sorted plan offerings
     */
    sortArrayOfPlanOfferings(planOfferingsArray: PlanOffering[][]): PlanOffering[] {
        const planOfferings = planOfferingsArray.reduce((planOfferings1, planOfferings2) => planOfferings1.concat(planOfferings2), []);
        return this.sortPlanOfferings(planOfferings);
    }

    /**
     * sort PlanOffering Array by displayOrder and alphabetically
     * @param {PlanOffering[]} PlanOffering Array
     * @returns {PlanOffering} with sorted values alphabetically and based on displayOrder
     */
    sortPlanOfferings(planOfferings: PlanOffering[]): PlanOffering[] {
        return [...planOfferings].sort(
            (planOffering1, planOffering2) =>
                (planOffering1.plan.displayOrder ?? -1) - (planOffering2.plan.displayOrder ?? -1) ||
                planOffering1.plan.name.toLowerCase().localeCompare(planOffering2.plan.name.toLowerCase()),
        );
    }
}
