import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UiComponentsModule, SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";

import { ProducerShopRoutingModule } from "./producer-shop-routing.module";
import { ProducerShopComponent } from "./producer-shop.component";
import { EnrollmentSettingsModule } from "./enrollment-settings/enrollment-settings.module";
import { ProductsContainerComponent } from "./products-container/products-container.component";
import { PlansContainerModule } from "./plans-container/plans-container.module";
import { ShoppingCartModule } from "../shopping-cart/shopping-cart.module";
import { UiModule, MaterialModule } from "@empowered/ui";

@NgModule({
    declarations: [ProducerShopComponent, ProductsContainerComponent],
    imports: [
        CommonModule,
        ProducerShopRoutingModule,
        EnrollmentSettingsModule,
        PlansContainerModule,
        MaterialModule,
        LanguageModule,
        UiComponentsModule,
        ShoppingCartModule,
        SharedModule,
        UiModule,
    ],
})
export class ProducerShopModule {}
