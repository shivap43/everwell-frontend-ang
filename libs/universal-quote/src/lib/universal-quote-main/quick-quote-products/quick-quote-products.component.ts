import { Component, OnInit, Input, ViewChild, OnDestroy } from "@angular/core";
import { UniversalService } from "../universal.service";
import { UniversalQuoteState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ProductDetail } from "@empowered/api";

@Component({
    selector: "empowered-quick-quote-products",
    templateUrl: "./quick-quote-products.component.html",
    styleUrls: ["./quick-quote-products.component.scss"],
})
export class QuickQuoteProductsComponent implements OnInit, OnDestroy {
    @Input() quickQuotePlans: any[];
    @ViewChild("tab", { static: true }) mattabStepper;
    productStatus: ProductDetail[];
    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly universalService: UniversalService, private readonly store: Store) {}

    ngOnInit(): void {
        this.mattabStepper.selectedIndex = 0;
        this.productStatus = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        this.universalService.planSelectionUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((selection) => {
            this.productStatus = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        });
    }

    /**
     * Returns whether a given product is included in either the quote or rate sheet.
     *
     * @param productId id of the selected product
     * @returns true if the product is included in either the quote or rate sheet
     */
    getProductStatus(productId: number): boolean {
        return this.store
            .selectSnapshot(UniversalQuoteState.GetQuickQuotePlans)
            ?.find((product) => product.productId === productId)
            ?.plans.some(
                (plan) =>
                    plan.planPriceSelection?.length ||
                    (plan.multiplePlanPriceSelections && Object.keys(plan.multiplePlanPriceSelections).length) ||
                    plan.rateSheetSelection,
            );
    }

    onTabChanged(event: any): void {
        this.universalService.currentProductId$.next(event.index);
    }
    // ng life cycle hook
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
