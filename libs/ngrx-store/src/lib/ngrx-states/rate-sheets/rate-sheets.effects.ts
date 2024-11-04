import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AflacService, CoreService } from "@empowered/api";
import { Plan, PlanSeries, RateSheetPlanSeriesOption, RateSheetPlanSeriesOptionBenefitAmounts } from "@empowered/constants";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";
import * as RateSheetsActions from "./rate-sheets.actions";
import {
    getDownloadRateSheetEntityId,
    getRateSheetPlanSeriesOptionBenefitAmountsEntityId,
    getRateSheetPlanSeriesOptionsEntityId,
} from "./rate-sheets.state";
import { AflacBusinessService } from "@empowered/api-service";

@Injectable()
export class RateSheetsEffects {
    constructor(
        private readonly actions$: Actions,
        private readonly coreService: CoreService,
        private readonly aflacService: AflacService,
        private readonly aflacBusinessService: AflacBusinessService,
    ) {}

    // effect for getPlanSeries api call
    loadPlanSeries$ = createEffect(() =>
        this.actions$.pipe(
            ofType(RateSheetsActions.loadPlanSeries),
            fetch({
                run: () =>
                    this.coreService
                        .getPlanSeries()
                        .pipe(map((planSeries: PlanSeries[]) => RateSheetsActions.loadPlanSeriesSuccess({ planSeries }))),

                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    RateSheetsActions.loadPlanSeriesFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    // effect for getQuickQuotePlans call
    loadQuickQuotePlans$ = createEffect(() =>
        this.actions$.pipe(
            ofType(RateSheetsActions.loadQuickQuotePlans),
            fetch({
                run: ({ state, partnerAccountType, payrollFrequencyId, riskClassId, append }) =>
                    this.aflacService.getQuickQuotePlans(state, partnerAccountType, payrollFrequencyId, riskClassId, append).pipe(
                        map((quickQuotePlans: Plan[]) =>
                            RateSheetsActions.loadQuickQuotePlansSuccess({
                                quickQuotePlans,
                            }),
                        ),
                    ),
                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    RateSheetsActions.loadQuickQuotePlansFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    // effect for getRateSheetPlanSeriesOptions api call
    loadRateSheetPlanSeriesOptions$ = createEffect(() =>
        this.actions$.pipe(
            ofType(RateSheetsActions.loadRateSheetPlanSeriesOptions),
            fetch({
                id: (identifiers) => getRateSheetPlanSeriesOptionsEntityId(identifiers),
                run: ({
                    productId,
                    planSeriesId,
                    state,
                    partnerAccountType,
                    payrollFrequencyId,
                    riskClassId,
                    zipCode,
                    sicCode,
                    eligibleSubscribers,
                }) =>
                    this.aflacBusinessService
                        .getRateSheetPlanSeriesOptions(
                            planSeriesId,
                            state,
                            partnerAccountType,
                            payrollFrequencyId,
                            riskClassId,
                            zipCode,
                            sicCode,
                            eligibleSubscribers,
                        )
                        .pipe(
                            map((rateSheetPlanSeriesOptions: RateSheetPlanSeriesOption[]) =>
                                RateSheetsActions.loadRateSheetPlanSeriesOptionsSuccess({
                                    rateSheetPlanSeriesOptionsEntity: {
                                        identifiers: {
                                            productId,
                                            planSeriesId,
                                        },
                                        data: rateSheetPlanSeriesOptions,
                                    },
                                }),
                            ),
                        ),

                onError: ({ productId, planSeriesId }, httpErrorResponse: HttpErrorResponse) =>
                    RateSheetsActions.loadRateSheetPlanSeriesOptionsFailure({
                        error: {
                            identifiers: {
                                productId,
                                planSeriesId,
                            },
                            data: httpErrorResponse.error,
                        },
                    }),
            }),
        ),
    );

    // effect for downloadRateSheet api call that downloads the customized rate sheet pdf
    downloadRateSheet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(RateSheetsActions.downloadRateSheet),
            fetch({
                id: (identifiers) => getDownloadRateSheetEntityId(identifiers),
                run: ({
                    state,
                    partnerAccountType,
                    payrollFrequencyId,
                    riskClassId,
                    rateSheetTitle,
                    planSeriesChoices,
                    zipCode,
                    sicCode,
                    eligibleSubscribers,
                }) =>
                    this.aflacService
                        .downloadRateSheet(
                            state,
                            partnerAccountType,
                            payrollFrequencyId,
                            riskClassId,
                            rateSheetTitle,
                            planSeriesChoices,
                            zipCode,
                            sicCode,
                            eligibleSubscribers,
                        )
                        .pipe(
                            map((response: BlobPart) => {
                                const unSignedBlob = new Blob([response], { type: "application/pdf" });
                                const unSignedFileURL = window.URL.createObjectURL(unSignedBlob);
                                return RateSheetsActions.downloadRateSheetSuccess({
                                    downloadRateSheetEntity: {
                                        identifiers: {
                                            state,
                                            partnerAccountType,
                                            payrollFrequencyId,
                                            riskClassId,
                                            rateSheetTitle,
                                            zipCode,
                                            sicCode,
                                            eligibleSubscribers,
                                        },
                                        data: unSignedFileURL,
                                    },
                                });
                            }),
                        ),

                onError: (
                    { state, partnerAccountType, payrollFrequencyId, riskClassId, rateSheetTitle, zipCode, sicCode, eligibleSubscribers },
                    httpErrorResponse: HttpErrorResponse,
                ) =>
                    RateSheetsActions.downloadRateSheetFailure({
                        error: {
                            identifiers: {
                                state,
                                partnerAccountType,
                                payrollFrequencyId,
                                riskClassId,
                                rateSheetTitle,
                                zipCode,
                                sicCode,
                                eligibleSubscribers,
                            },
                            data: httpErrorResponse.error,
                        },
                    }),
            }),
        ),
    );

    // effect for getRateSheetPlanSeriesOptionBenefitAmounts api call
    loadRateSheetPlanSeriesOptionBenefitAmounts$ = createEffect(() =>
        this.actions$.pipe(
            ofType(RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmounts),
            fetch({
                id: (identifiers) => getRateSheetPlanSeriesOptionBenefitAmountsEntityId(identifiers),
                run: ({
                    planSeriesId,
                    state,
                    partnerAccountType,
                    payrollFrequencyId,
                    riskClassId,
                    minAge,
                    maxAge,
                    zipCode,
                    sicCode,
                    eligibleSubscribers,
                    baseBenefitAmount,
                }) =>
                    this.aflacService
                        .getRateSheetPlanSeriesOptionBenefitAmounts(
                            planSeriesId,
                            state,
                            partnerAccountType,
                            payrollFrequencyId,
                            riskClassId,
                            minAge,
                            maxAge,
                            zipCode,
                            sicCode,
                            eligibleSubscribers,
                            baseBenefitAmount,
                        )
                        .pipe(
                            map((rateSheetPlanSeriesOptionBenefitAmounts: RateSheetPlanSeriesOptionBenefitAmounts[]) =>
                                RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsSuccess({
                                    rateSheetPlanSeriesOptionBenefitAmountsEntity: {
                                        identifiers: {
                                            planSeriesId,
                                            state,
                                            partnerAccountType,
                                            payrollFrequencyId,
                                            riskClassId,
                                            minAge,
                                            maxAge,
                                        },
                                        data: rateSheetPlanSeriesOptionBenefitAmounts,
                                    },
                                }),
                            ),
                        ),

                onError: (
                    { planSeriesId, state, partnerAccountType, payrollFrequencyId, riskClassId, minAge, maxAge },
                    httpErrorResponse: HttpErrorResponse,
                ) =>
                    RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsFailure({
                        error: {
                            identifiers: {
                                planSeriesId,
                                state,
                                partnerAccountType,
                                payrollFrequencyId,
                                riskClassId,
                                minAge,
                                maxAge,
                            },
                            data: httpErrorResponse.error,
                        },
                    }),
            }),
        ),
    );
}
