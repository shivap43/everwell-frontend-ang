import { CommonModule } from "@angular/common";
import { ENROLLMENT_ROUTES } from "./enrollment.route";
import { NgModule } from "@angular/core";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { ShoppingCartModule } from "./shopping-cart/shopping-cart.module";
import { MatDialogModule } from "@angular/material/dialog";
import { NgxMaskModule } from "ngx-mask";
import { ApplicationFlowModule } from "./application-flow/application-flow.module";
import { ApplicationFlowStepsModule } from "./application-flow-steps/application-flow-steps.module";
import { ShopExperienceModule } from "./shop-experience/shop-experience.module";
import { BenefitSummaryModule } from "./benefit-summary/benefit-summary.module";
import { SharedModule } from "@empowered/shared";
import { EnrollmentNGXSStoreModule, DashboardNgxsStoreModule, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";
import { ReplacePlanDialogComponent } from "./replace-plan-dialog/replace-plan-dialog.component";
import { CartLockDialogComponent } from "./cart-lock-dialog/cart-lock-dialog.component";
import { SwitchEnrollmentMethodComponent } from "./switch-enrollment-method/switch-enrollment-method.component";
import { RouterModule } from "@angular/router";

@NgModule({
    imports: [
        CommonModule,
        EnrollmentNGXSStoreModule,
        LanguageModule,
        UiModule,
        SharedModule,
        RouterModule.forChild(ENROLLMENT_ROUTES),
        MatDialogModule,
        NgxMaskModule.forRoot(),
        ApplicationFlowStepsModule,
        UiModule,
        DashboardNgxsStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],
    exports: [ShoppingCartModule, ShopExperienceModule, BenefitSummaryModule, ApplicationFlowModule, ApplicationFlowStepsModule],
    providers: [ReplaceTagPipe],
    declarations: [ReplacePlanDialogComponent, CartLockDialogComponent, SwitchEnrollmentMethodComponent],
})
export class EnrollmentModule {}
