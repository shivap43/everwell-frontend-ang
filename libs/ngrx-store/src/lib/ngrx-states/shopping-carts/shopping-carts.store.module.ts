import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";

import * as fromShoppingCarts from "./shopping-carts.reducer";
import { ShoppingCartsEffects } from "./shopping-carts.effects";

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        StoreModule.forFeature(fromShoppingCarts.SHOPPING_CARTS_FEATURE_KEY, fromShoppingCarts.reducer),
        EffectsModule.forFeature([ShoppingCartsEffects]),
    ],
})
export class ShoppingCartsStoreModule {}
