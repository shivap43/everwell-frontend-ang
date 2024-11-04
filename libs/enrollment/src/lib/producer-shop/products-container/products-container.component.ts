import { ApplicationStatusTypes } from "@empowered/api";
import { Component, OnDestroy } from "@angular/core";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { combineLatest, Subject, Observable } from "rxjs";
import { filter, map, pairwise, shareReplay, startWith, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ProductDetails } from "./products-container.model";
import { getEnrollmentStatus } from "@empowered/ngrx-store/services/enrollment-helper/enrollment-helper.service";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import { CombinedOfferings } from "@empowered/constants";

@Component({
    selector: "empowered-products-container",
    templateUrl: "./products-container.component.html",
    styleUrls: ["./products-container.component.scss"],
})
export class ProductsContainerComponent implements OnDestroy {
    // combined offerings list with cart and enrollment data
    readonly combinedOfferingsWithCartAndEnrollment$ = this.ngrxStore
        .onAsyncValue(select(PlanOfferingsSelectors.getCombinedOfferingsWithCartAndEnrollment))
        .pipe(
            filter((combinedOfferingsWithCartAndEnrollment) => !!combinedOfferingsWithCartAndEnrollment.length),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

    // reset selected product or not
    private readonly resetSelectedProduct$ = this.combinedOfferingsWithCartAndEnrollment$.pipe(
        startWith([]),
        pairwise(),
        tap(([previousCombinedOfferings, currentCombinedOfferings]: [CombinedOfferings[], CombinedOfferings[]]) => {
            // If previous and current have the same product offerings Ids then onProductSelection() will not be called.
            if (
                previousCombinedOfferings.length === 0 ||
                previousCombinedOfferings.length !== currentCombinedOfferings.length ||
                previousCombinedOfferings.some(
                    (combinedOffering, index) => combinedOffering.productOffering.id !== currentCombinedOfferings[index].productOffering.id,
                )
            ) {
                // TODO [Products Container]: move away from anti-pattern of subscribing to store selector and dispatching action
                this.onProductSelection(0, currentCombinedOfferings);
            }
        }),
    );

    // Selected product index
    readonly selectedProductIndex$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId)).pipe(
        withLatestFrom(this.combinedOfferingsWithCartAndEnrollment$),
        map(([productId, combinedOfferings]) =>
            combinedOfferings.map((combinedOffering) => combinedOffering.productOffering.product.id).indexOf(productId),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Gets declined product offering ids
    private readonly declinedProductOfferingIds$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getDeclineProductOfferingIds));

    // Gets product details
    readonly productDetails$: Observable<ProductDetails[]> = combineLatest([
        this.declinedProductOfferingIds$,
        this.combinedOfferingsWithCartAndEnrollment$,
    ]).pipe(
        map(([declinedProductIds, combinedOfferingsWithCartAndEnrollment]) =>
            combinedOfferingsWithCartAndEnrollment.map((combinedOffering) => {
                const combinedOfferingEnrollment = combinedOffering.planOfferingsWithCartAndEnrollment.filter((plan) => plan.enrollment)[0]
                    ?.enrollment;
                return {
                    name: combinedOffering.productOffering.product.name,
                    id: combinedOffering.productOffering.product.id,
                    isDeclined: declinedProductIds.includes(combinedOffering.productOffering.product.id),
                    // Gets enrollment status based on enrollment
                    enrollmentStatus: combinedOfferingEnrollment ? getEnrollmentStatus(combinedOfferingEnrollment) : null,
                    productInCart: combinedOffering.planOfferingsWithCartAndEnrollment.some(
                        (planOfferingWithCartAndEnrollment) => planOfferingWithCartAndEnrollment.cartItemInfo,
                    ),
                };
            }),
        ),
    );
    // application status enum
    readonly applicationStatus = ApplicationStatusTypes;

    private readonly unsubscriber$ = new Subject<void>();

    constructor(private readonly ngrxStore: NGRXStore) {
        this.resetSelectedProduct$.pipe(takeUntil(this.unsubscriber$)).subscribe();
    }

    /**
     * Sets selected Product data to store
     * @param selectedIndex selected index
     * @param combinedOfferings combined offerings data
     */
    onProductSelection(selectedIndex: number, combinedOfferings: CombinedOfferings[]): void {
        this.ngrxStore.dispatch(
            GlobalActions.setSelectedProductOfferingIdentifiers({
                productId: combinedOfferings[selectedIndex].productOffering.product.id,
                productOfferingId: combinedOfferings[selectedIndex].productOffering.id,
            }),
        );
    }

    /**
     * Returns unique identifier for ProductDetails
     * trackBy for *ngFor involving ProductDetails used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param product {ProductDetails} current ProductDetails in iteration
     * @returns unique identifier for ProductDetails
     */
    trackByProductId(index: number, product: ProductDetails): number {
        return product.id;
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
