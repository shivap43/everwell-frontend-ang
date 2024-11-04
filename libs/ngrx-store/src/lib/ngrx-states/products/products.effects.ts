import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CoreService } from "@empowered/api";
import { Product } from "@empowered/constants";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";

import * as ProductsActions from "./products.actions";

@Injectable()
export class ProductsEffects {
    loadProducts$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProductsActions.loadProducts),
            fetch({
                run: (action) =>
                    this.coreService.getProducts().pipe(map((products: Product[]) => ProductsActions.loadProductsSuccess({ products }))),

                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    ProductsActions.loadProductsFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    constructor(private readonly actions$: Actions, private readonly coreService: CoreService) {}
}
