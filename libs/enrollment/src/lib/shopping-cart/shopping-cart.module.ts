import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ShoppingCartDisplayComponent } from "./shopping-cart-display/shopping-cart-display.component";
import { SharedModule } from "@empowered/shared";
import { ExpandedShoppingCartComponent } from "./expanded-shopping-cart/expanded-shopping-cart.component";
import { DatePipe } from "@angular/common";
import { RemoveCartItemComponent } from "./remove-cart-item/remove-cart-item.component";
import { LanguageModule } from "@empowered/language";
import { EmployeeRequiredInfoComponent } from "./employee-required-info/employee-required-info.component";
import { TotalCostDialogComponent } from "./expanded-shopping-cart/total-cost-dialog/total-cost-dialog.component";
import { CreateShoppingCartQuoteComponent } from "./create-shopping-cart-quote/create-shopping-cart-quote.component";
import { CdkTableModule } from "@angular/cdk/table";
import { EditPlanOrderComponent } from "./edit-plan-order/edit-plan-order.component";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { PayrollFrequencyCalculatorPipe, UiModule } from "@empowered/ui";
import {
    AccountListNgxsStoreModule,
    DashboardNgxsStoreModule,
    DualPlanYearNGXSStoreModule,
    EnrollmentMethodNGXSStoreModule,
} from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        ShoppingCartDisplayComponent,
        ExpandedShoppingCartComponent,
        RemoveCartItemComponent,
        EmployeeRequiredInfoComponent,
        TotalCostDialogComponent,
        CreateShoppingCartQuoteComponent,
        EditPlanOrderComponent,
    ],
    exports: [ShoppingCartDisplayComponent],
    providers: [DatePipe, PayrollFrequencyCalculatorPipe],
    imports: [
        CommonModule,
        SharedModule,
        LanguageModule,
        CdkTableModule,
        DragDropModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],
})
export class ShoppingCartModule {}
