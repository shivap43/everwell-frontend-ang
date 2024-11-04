import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedStoreModule } from "./shared";
import { AuthStoreModule } from "./auth";
import { AccountsStoreModule } from "./accounts";
import { ProductsStoreModule } from "./products";
import { MembersStoreModule } from "./members";
import { EnrollmentsStoreModule } from "./enrollments";
import { ProducersStoreModule } from "./producers";
import { PlanOfferingsStoreModule } from "./plan-offerings";
import { ProductOfferingsStoreModule } from "./product-offerings";
import { ShoppingCartsStoreModule } from "./shopping-carts";
import { RateSheetsStoreModule } from "./rate-sheets";
import { AflacAlwaysStoreModule } from "./aflac-always";

@NgModule({
    imports: [
        CommonModule,
        SharedStoreModule,
        AuthStoreModule,
        AccountsStoreModule,
        ProductsStoreModule,
        MembersStoreModule,
        EnrollmentsStoreModule,
        ProducersStoreModule,
        PlanOfferingsStoreModule,
        ProductOfferingsStoreModule,
        ShoppingCartsStoreModule,
        RateSheetsStoreModule,
        AflacAlwaysStoreModule,
    ],
})
export class AppStoreModule {}
