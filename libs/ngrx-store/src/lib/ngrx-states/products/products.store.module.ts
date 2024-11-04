import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromProducts from "./products.reducer";
import { ProductsEffects } from "./products.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromProducts.PRODUCTS_FEATURE_KEY, fromProducts.reducer),
        EffectsModule.forFeature([ProductsEffects]),
    ],
    providers: [ProductsEffects],
})
export class ProductsStoreModule {}
