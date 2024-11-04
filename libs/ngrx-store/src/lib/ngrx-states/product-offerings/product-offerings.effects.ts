import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BenefitsOfferingService, ProductContributionLimit, ShoppingService } from "@empowered/api";
import { ProductOffering, PlanYear } from "@empowered/constants";
import { getSerializableError } from "../../ngrx.store.helpers";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";

import * as ProductOfferingsActions from "./product-offerings.actions";
import { getDeclineProductOfferingEntityId, getPlanYearsEntityId, getProductOfferingsEntityId } from "./product-offerings.state";

@Injectable()
export class ProductOfferingsEffects {
    loadProductOfferingSet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProductOfferingsActions.loadProductOfferingSet),
            fetch({
                id: (identifiers) => getProductOfferingsEntityId(identifiers),
                run: ({ mpGroup, referenceDate }) =>
                    this.shoppingService.getProductOfferings(mpGroup).pipe(
                        map((productOfferings: ProductOffering[]) =>
                            ProductOfferingsActions.loadProductOfferingSetSuccess({
                                productOfferingSet: {
                                    identifiers: {
                                        mpGroup,
                                        referenceDate,
                                    },
                                    // Sorting product offerings based on display order before saving to store
                                    data: productOfferings.sort(
                                        (productOffering1, productOffering2) =>
                                            (productOffering1.product.displayOrder ?? -1) - (productOffering2.product.displayOrder ?? -1),
                                    ),
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup, referenceDate }, httpErrorResponse: HttpErrorResponse) =>
                    ProductOfferingsActions.loadProductOfferingSetFailure({
                        error: {
                            identifiers: { mpGroup, referenceDate },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    declineProductOffering$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProductOfferingsActions.declineProductOffering),
            fetch({
                id: (identifiers) => getDeclineProductOfferingEntityId(identifiers),
                run: (action) =>
                    this.shoppingService
                        .declineProduct(String(action.productOfferingId), action.memberId, action.enrollmentMethod, action.mpGroup)
                        .pipe(
                            map(() => {
                                const { productOfferingId, memberId, enrollmentMethod, mpGroup } = action;
                                return ProductOfferingsActions.declineProductOfferingSuccess({
                                    declineProductOfferingEntity: {
                                        identifiers: { productOfferingId, memberId, enrollmentMethod, mpGroup },
                                        data: null,
                                    },
                                });
                            }),
                        ),

                onError: (action, httpErrorResponse: HttpErrorResponse) => {
                    const { productOfferingId, memberId, enrollmentMethod, mpGroup } = action;
                    return ProductOfferingsActions.declineProductOfferingFailure({
                        error: {
                            identifiers: { productOfferingId, memberId, enrollmentMethod, mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    });
                },
            }),
        ),
    );

    loadPlanYearSet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProductOfferingsActions.loadPlanYearSet),
            fetch({
                id: (identifiers) => getPlanYearsEntityId(identifiers),
                run: ({ mpGroup }) =>
                    // useUnapproved is not necessary in shop page as coverageEffectiveDate logic is moved to api
                    // dualPlanYearService is being reused,so useUnapproved is not necessary for that scenario as well
                    // isOpenEnrollment is optional and it is been handled by filtering plan years
                    this.benefitsOfferingService.getPlanYears(mpGroup, false).pipe(
                        map((planYears: PlanYear[]) =>
                            ProductOfferingsActions.loadPlanYearSetSuccess({
                                planYearSet: {
                                    identifiers: { mpGroup },
                                    data: planYears,
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ProductOfferingsActions.loadPlanYearSetFailure({
                        error: {
                            identifiers: { mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadContributionLimit$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProductOfferingsActions.loadContributionLimit),
            fetch({
                run: ({ mpGroup, productId }) =>
                    this.benefitsOfferingService.getProductContributionLimits(productId, mpGroup).pipe(
                        map((contributionLimit: ProductContributionLimit) =>
                            ProductOfferingsActions.loadContributionLimitSuccess({
                                contributionLimitEntity: {
                                    identifiers: { mpGroup, productId },
                                    data: contributionLimit,
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup, productId }, httpErrorResponse: HttpErrorResponse) =>
                    ProductOfferingsActions.loadContributionLimitFailure({
                        error: {
                            identifiers: { mpGroup, productId },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly shoppingService: ShoppingService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
    ) {}
}
