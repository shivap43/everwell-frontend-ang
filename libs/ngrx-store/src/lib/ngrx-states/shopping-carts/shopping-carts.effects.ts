import { Injectable } from "@angular/core";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import * as ShoppingCartsActions from "./shopping-carts.actions";
import { GetShoppingCart, ShoppingCartDisplayService, ShoppingService } from "@empowered/api";
import { GetCartItems, FlexDollarModel } from "@empowered/constants";
import { DeleteCartItemEntity } from "./shopping-carts.model";
import { combineLatest } from "rxjs";
import { forkJoin } from "rxjs";
import { UpdateCartItemEntity } from "./shopping-carts.model";
import { addUpdateCartItemsEntityId, getCartItemEntityId, getCartItemsEntityId } from "./shopping-carts.state";
import { getSerializableError } from "../../ngrx.store.helpers";

@Injectable()
export class ShoppingCartsEffects {
    loadCartItemsSet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.loadCartItemsSet),
            fetch({
                run: ({ memberId, mpGroup, expand, planYearIds }) =>
                    this.shoppingService.getCartItems(memberId, mpGroup, expand, planYearIds).pipe(
                        map((cartItems: GetCartItems[]) =>
                            ShoppingCartsActions.loadCartItemsSetSuccess({
                                cartItemsSet: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                    },
                                    data: cartItems,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.loadCartItemsSetFailure({
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

    loadCart$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.loadShoppingCart),
            fetch({
                run: ({ memberId, mpGroup, planYearIds }) =>
                    this.shoppingService.getShoppingCart(memberId, mpGroup, planYearIds).pipe(
                        map((cartDetails: GetShoppingCart) =>
                            ShoppingCartsActions.loadShoppingCartSuccess({
                                shoppingCart: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                    },
                                    data: cartDetails,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.loadShoppingCartFailure({
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

    getCartItem$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.loadCartItem),
            fetch({
                run: ({ memberId, itemId, mpGroup }) =>
                    this.shoppingService.getCartItem(memberId, itemId, mpGroup).pipe(
                        map((cartItem: GetCartItems) =>
                            ShoppingCartsActions.loadCartItemSuccess({
                                cartItemSet: {
                                    identifiers: {
                                        memberId,
                                        itemId,
                                        mpGroup,
                                    },
                                    data: cartItem,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, itemId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.loadCartItemFailure({
                        error: {
                            identifiers: {
                                memberId,
                                itemId,
                                mpGroup,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    addToCartItem$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.addCartItem),
            fetch({
                run: ({ memberId, mpGroup, addCartObject }) =>
                    this.shoppingService.addCartItem(memberId, mpGroup, addCartObject).pipe(
                        map((successResponse: HttpResponse<unknown>) =>
                            ShoppingCartsActions.addCartItemSuccess({
                                addCartResponse: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                        enrollmentMethod: addCartObject.enrollmentMethod,
                                        enrollmentState: addCartObject.enrollmentState,
                                    },
                                    data: this.getItemIdFromResponseHeader(successResponse),
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup, addCartObject }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.addCartItemFailure({
                        error: {
                            identifiers: {
                                memberId,
                                mpGroup,
                                enrollmentMethod: addCartObject.enrollmentMethod,
                                enrollmentState: addCartObject.enrollmentState,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    updateCartItem$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.updateCartItem),
            fetch({
                run: ({ memberId, mpGroup, cartItemId, updateCartObject }) =>
                    this.shoppingService.updateCartItem(memberId, mpGroup, cartItemId, updateCartObject).pipe(
                        map(() =>
                            ShoppingCartsActions.updateCartItemSuccess({
                                updateCartResponse: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                        enrollmentMethod: updateCartObject.enrollmentMethod,
                                        enrollmentState: updateCartObject.enrollmentState,
                                    },
                                    data: cartItemId,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup, cartItemId, updateCartObject }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.updateCartItemFailure({
                        error: {
                            identifiers: {
                                memberId,
                                mpGroup,
                                enrollmentMethod: updateCartObject.enrollmentMethod,
                                enrollmentState: updateCartObject.enrollmentState,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    updateCartItemsSets$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.updateCartItemsSets),
            fetch({
                run: ({ mpGroup, memberId, updateCartObjects }) =>
                    forkJoin(
                        updateCartObjects.map((updateCartObject) =>
                            this.shoppingService.updateCartItem(memberId, mpGroup, updateCartObject.cartItemId, updateCartObject).pipe(
                                map(() => ({
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                        enrollmentMethod: updateCartObject.enrollmentMethod,
                                        enrollmentState: updateCartObject.enrollmentState,
                                    },
                                    data: null,
                                })),
                            ),
                        ),
                    ).pipe(
                        map((updateCartItemsResponse: UpdateCartItemEntity<null>[]) =>
                            ShoppingCartsActions.updateCartItemSuccess({
                                updateCartResponse: updateCartItemsResponse[0],
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup, updateCartObjects }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.updateCartItemFailure({
                        error: {
                            identifiers: {
                                memberId,
                                mpGroup,
                                enrollmentMethod: updateCartObjects[0].enrollmentMethod,
                                enrollmentState: updateCartObjects[0].enrollmentState,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    deleteCartItem$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.deleteCartItem),
            fetch({
                run: ({ memberId, mpGroup, cartItemId }) =>
                    this.shoppingService.deleteCartItem(memberId, cartItemId, mpGroup).pipe(
                        map(() =>
                            ShoppingCartsActions.deleteCartItemSuccess({
                                deleteCartItemResponse: {
                                    identifiers: {
                                        memberId,
                                        mpGroup,
                                    },
                                    data: cartItemId,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.deleteCartItemFailure({
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

    clearCartItems$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.clearCartItems),
            fetch({
                run: ({ memberId, mpGroup, ignoreGroupPlans }) =>
                    this.shoppingService.clearShoppingCart(memberId, mpGroup, ignoreGroupPlans).pipe(
                        map(() =>
                            ShoppingCartsActions.clearCartItemsSuccess({
                                clearCartItemResponse: {
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
                    ShoppingCartsActions.clearCartItemsFailure({
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
    // Effect to delete multiple cart items
    deleteCartItemsSets$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.deleteCartItemsSets),
            fetch({
                run: ({ mpGroup, memberId, cartItemIds }) =>
                    combineLatest(
                        cartItemIds.map((cartItemId) =>
                            this.shoppingService.deleteCartItem(memberId, cartItemId, mpGroup).pipe(
                                map(() => ({
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                    },
                                    data: cartItemId,
                                })),
                            ),
                        ),
                    ).pipe(
                        map((deleteCartItemsResponse: DeleteCartItemEntity<number>[]) =>
                            ShoppingCartsActions.deleteCartItemSuccess({
                                deleteCartItemResponse: deleteCartItemsResponse[0],
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.deleteCartItemFailure({
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

    // Effect to load applied flex dollars
    loadAppliedFlexDollarsSets$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ShoppingCartsActions.loadAppliedFlexDollars),
            fetch({
                run: ({ memberId, mpGroup }) =>
                    this.shoppingCartDisplayService.getAppliedFlexDollarOrIncentivesForCart(memberId, mpGroup.toString()).pipe(
                        map((appliedFlexDollar: FlexDollarModel | null) =>
                            ShoppingCartsActions.loadAppliedFlexDollarsSuccess({
                                appliedFlexDollars: {
                                    identifiers: {
                                        mpGroup,
                                        memberId,
                                    },
                                    data: appliedFlexDollar,
                                },
                            }),
                        ),
                    ),
                onError: ({ memberId, mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ShoppingCartsActions.loadAppliedFlexDollarsFailure({
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
    constructor(
        private readonly actions$: Actions,
        private readonly shoppingService: ShoppingService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
    ) {}

    /**
     * gets Item id from response header
     * @param response http response from api
     * @returns item id
     */
    getItemIdFromResponseHeader(response: HttpResponse<unknown>): number | null {
        const location = response.headers.get("location");
        const numberMatches = location?.match(/\d+/g);
        // Item id will be the last number match
        return numberMatches?.length ? +numberMatches[numberMatches.length - 1] : null;
    }
}
