import { ApplicationFlowStepsModule } from "../application-flow-steps/application-flow-steps.module";
import { ShoppingCartModule } from "./../shopping-cart/shopping-cart.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { ShopOverviewComponent } from "./shop-overview/shop-overview.component";
import { RouterModule } from "@angular/router";
import { SHOP_EXPERIENCE_ROUTES } from "./shop-experience.routes";
import { ProductInfoComponent } from "./product-info/product-info.component";
import { ProductNavComponent } from "./product-nav/product-nav.component";
import { ProductDetailsComponent } from "./product-details/product-details.component";
import { PlanSelectionComponent } from "./plan-selection/plan-selection.component";
import { PlanSummaryComponent } from "./plan-summary/plan-summary.component";
import { CoverageLevelSelectionComponent } from "./plan-selection/coverage-level-selection/coverage-level-selection.component";
import { BenefitAmountSelectionComponent } from "./plan-selection/benefit-amount-selection/benefit-amount-selection.component";
import { EliminationPeriodSelectionComponent } from "./plan-selection/elimination-period-selection/elimination-period-selection.component";
import { RiderSelectionComponent } from "./plan-selection/rider-selection/rider-selection.component";
import { LanguageModule } from "@empowered/language";
import { KnockoutQuestionsModule } from "../knockout-questions/knockout-questions.module";
import { ReplacementPlanModalComponent } from "./plan-selection/replacement-plan-modal/replacement-plan-modal.component";
import { GrandFatherPlanMmpComponent } from "./product-details/grand-father-plan-mmp/grand-father-plan-mmp.component";
import { PlanMissingInfoPopupComponent } from "./product-details/plan-missing-info-popup/plan-missing-info-popup.component";
// eslint-disable-next-line max-len
import { CompanyProvidedProductsDialogComponent } from "./shop-overview/company-provided-products-dialog/company-provided-products-dialog.component";
import { AflacPassProductComponent } from "./aflac-pass-product/aflac-pass-product.component";
import { LeaveConfirmationDialogComponent } from "./aflac-pass-product/leave-confirmation-dialog/leave-confirmation-dialog.component";
import { ShopReviewComponent } from "./shop-review/shop-review.component";
import { RemovePlanComponent } from "./modals/remove-plan/remove-plan.component";
import { UiModule, MaterialModule } from "@empowered/ui";
import { DualPlanYearNGXSStoreModule, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(SHOP_EXPERIENCE_ROUTES),
        SharedModule,
        LanguageModule,
        ShoppingCartModule,
        MaterialModule,
        KnockoutQuestionsModule,
        ApplicationFlowStepsModule,
        UiModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],
    declarations: [
        ShopOverviewComponent,
        ProductInfoComponent,
        ProductNavComponent,
        ProductDetailsComponent,
        PlanSelectionComponent,
        PlanSummaryComponent,
        CoverageLevelSelectionComponent,
        BenefitAmountSelectionComponent,
        EliminationPeriodSelectionComponent,
        RiderSelectionComponent,
        ReplacementPlanModalComponent,
        GrandFatherPlanMmpComponent,
        CompanyProvidedProductsDialogComponent,
        AflacPassProductComponent,
        LeaveConfirmationDialogComponent,
        ShopReviewComponent,
        PlanMissingInfoPopupComponent,
        RemovePlanComponent,
    ],
    exports: [
        CompanyProvidedProductsDialogComponent,
        ShopOverviewComponent,
        ProductInfoComponent,
        ProductNavComponent,
        ProductDetailsComponent,
        AflacPassProductComponent,
        GrandFatherPlanMmpComponent,
        PlanSummaryComponent,
        PlanSelectionComponent,
        CoverageLevelSelectionComponent,
        EliminationPeriodSelectionComponent,
        BenefitAmountSelectionComponent,
        RiderSelectionComponent,
        ShopReviewComponent,
        PlanMissingInfoPopupComponent,
    ],
})
export class ShopExperienceModule {}
