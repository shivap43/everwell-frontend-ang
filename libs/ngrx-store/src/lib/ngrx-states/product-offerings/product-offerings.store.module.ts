import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromProductOfferings from "./product-offerings.reducer";
import { ProductOfferingsEffects } from "./product-offerings.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromProductOfferings.PRODUCT_OFFERINGS_FEATURE_KEY, fromProductOfferings.reducer),
        EffectsModule.forFeature([ProductOfferingsEffects]),
    ],
    providers: [ProductOfferingsEffects],
})
export class ProductOfferingsStoreModule {}
