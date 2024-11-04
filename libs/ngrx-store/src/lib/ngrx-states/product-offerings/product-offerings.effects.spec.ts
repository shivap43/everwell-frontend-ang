import { TestBed } from "@angular/core/testing";
import { ShoppingService, BenefitsOfferingService, ProductContributionLimit } from "@empowered/api";
import { PlanYearType, ProductOffering, PlanYear, ApiError } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as ProductOfferingsActions from "./product-offerings.actions";
import { ProductOfferingsEffects } from "./product-offerings.effects";

const mockShoppingService = {
    getProductOfferings: (mpGroup: number) => of([{ id: 555 } as ProductOffering]),
} as ShoppingService;

const mockBenefitOfferingService = {
    getPlanYears: (mpGroup: number, useUnapproved: boolean, inOpenEnrollment?: boolean) =>
        of([{ type: PlanYearType.AFLAC_GROUP } as PlanYear]),

    getProductContributionLimits: (productId: number, mpGroup: number) =>
        of({
            minContribution: 10,
            maxContribution: 1000,
            minFamilyContribution: 10,
            maxFamilyContribution: 1000,
        } as ProductContributionLimit),
} as BenefitsOfferingService;

describe("ProductOfferingsEffects", () => {
    let actions$: Observable<Action>;
    let effects: ProductOfferingsEffects;
    let shoppingService: ShoppingService;
    let benefitsOfferingService: BenefitsOfferingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                ProductOfferingsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: BenefitsOfferingService, useValue: mockBenefitOfferingService },
            ],
        });

        effects = TestBed.inject(ProductOfferingsEffects);
        shoppingService = TestBed.inject(ShoppingService);
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
    });

    describe("loadProductOfferingSet$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                ProductOfferingsActions.loadProductOfferingSet({
                    mpGroup: 111,
                    referenceDate: "1990-09-09",
                }),
            );
        });

        it("should get ProductOfferingSets array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getProductOfferings");

            effects.loadProductOfferingSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(111);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadProductOfferingSetSuccess({
                        productOfferingSet: {
                            identifiers: {
                                mpGroup: 111,
                                referenceDate: "1990-09-09",
                            },
                            data: [{ id: 555 } as ProductOffering],
                        },
                    }),
                );

                done();
            });
        });

        it("should get ProductOfferingSets array in decending order on success", (done) => {
            expect.assertions(1);

            const spy = jest.spyOn(shoppingService, "getProductOfferings").mockReturnValue(
                of([
                    {
                        id: 100,
                        product: {
                            displayOrder: 100,
                        },
                    } as ProductOffering,
                    {
                        id: 500,
                        product: {
                            displayOrder: 500,
                        },
                    } as ProductOffering,
                    {
                        id: 300,
                        product: {
                            displayOrder: 300,
                        },
                    } as ProductOffering,
                ]),
            );

            effects.loadProductOfferingSet$.subscribe((action) => {
                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadProductOfferingSetSuccess({
                        productOfferingSet: {
                            identifiers: {
                                mpGroup: 111,
                                referenceDate: "1990-09-09",
                            },
                            data: [
                                {
                                    id: 100,
                                    product: {
                                        displayOrder: 100,
                                    },
                                } as ProductOffering,
                                {
                                    id: 300,
                                    product: {
                                        displayOrder: 300,
                                    },
                                } as ProductOffering,
                                {
                                    id: 500,
                                    product: {
                                        displayOrder: 500,
                                    },
                                } as ProductOffering,
                            ],
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getProductOfferings").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadProductOfferingSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(111);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadProductOfferingSetFailure({
                        error: {
                            identifiers: {
                                mpGroup: 111,
                                referenceDate: "1990-09-09",
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadPlanYearSet$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ProductOfferingsActions.loadPlanYearSet({ mpGroup: 222 }));
        });

        it("should get PlanYearSetsEntity on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(benefitsOfferingService, "getPlanYears");

            effects.loadPlanYearSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(222, false);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadPlanYearSetSuccess({
                        planYearSet: {
                            identifiers: { mpGroup: 222 },
                            data: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(benefitsOfferingService, "getPlanYears").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadPlanYearSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(222, false);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadPlanYearSetFailure({
                        error: {
                            identifiers: { mpGroup: 222 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });

    describe("loadContributionLimit$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ProductOfferingsActions.loadContributionLimit({ mpGroup: 222, productId: 53 }));
        });

        it("should get contributionLimit on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(benefitsOfferingService, "getProductContributionLimits");

            effects.loadContributionLimit$.subscribe((action) => {
                expect(spy).toBeCalledWith(53, 222);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadContributionLimitSuccess({
                        contributionLimitEntity: {
                            identifiers: { mpGroup: 222, productId: 53 },
                            data: {
                                minContribution: 10,
                                maxContribution: 1000,
                                minFamilyContribution: 10,
                                maxFamilyContribution: 1000,
                            } as ProductContributionLimit,
                        },
                    }),
                );

                done();
            });
        });

        it("should get set api error on error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(benefitsOfferingService, "getProductContributionLimits").mockReturnValueOnce(
                throwError({
                    error: { message: "some api error message" },
                }),
            );

            effects.loadContributionLimit$.subscribe((action) => {
                expect(spy).toBeCalledWith(53, 222);

                expect(action).toStrictEqual(
                    ProductOfferingsActions.loadContributionLimitFailure({
                        error: {
                            identifiers: { mpGroup: 222, productId: 53 },
                            data: { message: "some api error message" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });
});
