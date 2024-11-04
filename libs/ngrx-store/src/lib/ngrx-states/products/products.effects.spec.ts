import { TestBed } from "@angular/core/testing";
import { CoreService } from "@empowered/api";
import { Product, ApiError } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as ProductsActions from "./products.actions";
import { ProductsEffects } from "./products.effects";

const mockCoreService = {
    getProducts: () => of([] as Product[]),
} as CoreService;

describe("ProductsEffects", () => {
    let actions$: Observable<Action>;
    let effects: ProductsEffects;
    let coreService: CoreService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                ProductsEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                { provide: CoreService, useValue: mockCoreService },
            ],
        });

        effects = TestBed.inject(ProductsEffects);
        coreService = TestBed.inject(CoreService);
    });

    describe("loadProducts$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(ProductsActions.loadProducts());
        });

        it("should get Products array on success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(coreService, "getProducts");

            effects.loadProducts$.subscribe((action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(
                    ProductsActions.loadProductsSuccess({
                        products: [],
                    }),
                );

                done();
            });
        });

        it("should get api error on failure", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(coreService, "getProducts").mockReturnValue(throwError({ error: { message: "api error" } }));

            effects.loadProducts$.subscribe((action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(ProductsActions.loadProductsFailure({ error: { message: "api error" } as ApiError }));
                done();
            });
        });
    });
});
