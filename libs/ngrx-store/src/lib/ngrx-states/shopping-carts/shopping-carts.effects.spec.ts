import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ShoppingCartDisplayService, ShoppingService } from "@empowered/api";
import {
    AddToCartItem,
    EnrollmentMethod,
    UpdateCartItem,
    GetCartItems,
    FlexDollarModel,
    PlanFlexDollarOrIncentives,
    AggregateFlexDollarOrIncentive,
    ApiError,
} from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as ShoppingCartsActions from "./shopping-carts.actions";
import { ShoppingCartsEffects } from "./shopping-carts.effects";
import { HttpResponse } from "@angular/common/http";

const mockShoppingService = {
    getCartItems: (memberId: number, mpGroup: number, expand?: string | undefined, planYearId?: number[] | undefined) =>
        of([{ enrollmentMethod: EnrollmentMethod.FACE_TO_FACE } as GetCartItems]),
    getCartItem: (memberId: number, itemId: number, mpGroup: number) =>
        of({ enrollmentMethod: EnrollmentMethod.FACE_TO_FACE } as GetCartItems),
    addCartItem: (memberId: number, mpGroup: number, addCart: AddToCartItem): Observable<HttpResponse<unknown>> => of(),
    updateCartItem: (memberId: number, mpGroup: number, id: number, cart: UpdateCartItem): Observable<HttpResponse<unknown>> => of(),
    deleteCartItem: (memberId: number, itemId: number, mpGroup: number): Observable<any> => of(),
} as ShoppingService;

const mockShoppingCartDisplayService = {
    getAppliedFlexDollarOrIncentivesForCart: (memberID: number, mpGroup: string) =>
        of({
            aggregateFlexDollarOrIncentives: [
                {
                    flexDollarOrIncentiveName: "incentive",
                    flexDollarOrIncentiveAmount: 888,
                },
            ] as AggregateFlexDollarOrIncentive[],
            planFlexDollarOrIncentives: [
                {
                    planId: 200,
                },
            ] as PlanFlexDollarOrIncentives[],
        } as FlexDollarModel),
} as ShoppingCartDisplayService;

describe("ShoppingCartsEffects", () => {
    let actions$: Observable<Action>;
    let effects: ShoppingCartsEffects;
    let shoppingService: ShoppingService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NxModule.forRoot()],
            providers: [
                ShoppingCartsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: ShoppingService, useValue: mockShoppingService },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
            ],
        });

        effects = TestBed.inject(ShoppingCartsEffects);
        shoppingService = TestBed.inject(ShoppingService);
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
    });

    it("should create", () => {
        expect(effects).toBeTruthy();
    });

    describe("loadCartItemsSet$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                ShoppingCartsActions.loadCartItemsSet({
                    mpGroup: 111,
                    memberId: 333,
                    expand: undefined,
                    planYearIds: undefined,
                }),
            );
        });
        it("should get CartItemSets array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getCartItems");

            effects.loadCartItemsSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111, undefined, undefined);

                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadCartItemsSetSuccess({
                        cartItemsSet: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                            },
                            data: [{ enrollmentMethod: EnrollmentMethod.FACE_TO_FACE } as GetCartItems],
                        },
                    }),
                );
                done();
            });
        });
        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getCartItems").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadCartItemsSet$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 111, undefined, undefined);
                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadCartItemsSetFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 111,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );
                done();
            });
        });
    });
    describe("getCartItem$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                ShoppingCartsActions.loadCartItem({
                    mpGroup: 111,
                    itemId: 26,
                    memberId: 333,
                }),
            );
        });
        it("should get CartItem on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getCartItem");

            effects.getCartItem$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 26, 111);

                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadCartItemSuccess({
                        cartItemSet: {
                            identifiers: {
                                mpGroup: 111,
                                itemId: 26,
                                memberId: 333,
                            },
                            data: { enrollmentMethod: EnrollmentMethod.FACE_TO_FACE } as GetCartItems,
                        },
                    }),
                );
                done();
            });
        });
        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingService, "getCartItem").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.getCartItem$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, 26, 111);
                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadCartItemFailure({
                        error: {
                            identifiers: {
                                memberId: 333,
                                itemId: 26,
                                mpGroup: 111,
                            },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );
                done();
            });
        });
    });

    describe("loadAppliedFlexDollars$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ShoppingCartsActions.loadAppliedFlexDollars({ mpGroup: 111, memberId: 333 }));
        });

        it("should get MemberContacts array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "getAppliedFlexDollarOrIncentivesForCart");

            effects.loadAppliedFlexDollarsSets$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, "111");

                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadAppliedFlexDollarsSuccess({
                        appliedFlexDollars: {
                            identifiers: { mpGroup: 111, memberId: 333 },
                            data: {
                                aggregateFlexDollarOrIncentives: [
                                    {
                                        flexDollarOrIncentiveName: "incentive",
                                        flexDollarOrIncentiveAmount: 888,
                                    },
                                ] as AggregateFlexDollarOrIncentive[],
                                planFlexDollarOrIncentives: [
                                    {
                                        planId: 200,
                                    },
                                ] as PlanFlexDollarOrIncentives[],
                            } as FlexDollarModel,
                        },
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(shoppingCartDisplayService, "getAppliedFlexDollarOrIncentivesForCart").mockReturnValue(
                throwError({
                    error: { message: "api error" },
                }),
            );

            effects.loadAppliedFlexDollarsSets$.subscribe((action) => {
                expect(spy).toBeCalledWith(333, "111");

                expect(action).toStrictEqual(
                    ShoppingCartsActions.loadAppliedFlexDollarsFailure({
                        error: {
                            identifiers: { mpGroup: 111, memberId: 333 },
                            data: { message: "api error" } as ApiError,
                        },
                    }),
                );

                done();
            });
        });
    });
});
