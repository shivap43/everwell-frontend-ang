import { Component } from "@angular/core";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { map } from "rxjs/operators";

@Component({
    selector: "empowered-products",
    templateUrl: "./products.component.html",
    styleUrls: ["./products.component.scss"],
})
export class ProductsComponent {
    combinedQuickQuotePlansAndPlanSeries$ = this.ngrxStore.onAsyncValue(
        select(RateSheetsSelectors.getCombinedQuickQuotePlansAndPlanSeries),
    );
    rateSheetProductSelections$ = this.ngrxStore
        .pipe(select(RateSheetsSelectors.getRateSheetProductSelections))
        .pipe(map((selections) => selections.reduce((acc, curr) => ({ ...acc, [curr]: true }), {})));

    constructor(private readonly ngrxStore: NGRXStore) {}

    /**
     * Called when the user selects a product.
     *
     * @param productIndex selected product's index into the array
     */
    onProductSelection(productIndex: number): void {
        this.ngrxStore.dispatch(RateSheetsActions.setSelectedProductIndex({ productIndex }));
    }
}
