import { BenefitSharedModule } from "./../benefit-shared.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProductsComponent } from "./products/products.component";
import { CarrierFormManageModule } from "./carrier-form-manage/carrier-form-manage.module";
import { RouterModule } from "@angular/router";
import { MAINTENANCE_BENEFIT_ROUTES } from "./maintenance-benefits-offering.routes";
import { SharedModule } from "@empowered/shared";
import { MaintenanceBenefitsOfferingComponent } from "./maintenance-benefits-offering.component";
import { SettingsTabComponent } from "./settings-tab/settings-tab.component";
import { RemovePlanComponent } from "./products/remove-plan/remove-plan.component";
import { RemoveAllPlansComponent } from "./products/remove-all-plans/remove-all-plans.component";
import { EditEmployeesPopUpComponent } from "./settings-tab/edit-employees-pop-up/edit-employees-pop-up.component";
import { EditStatesPopUpComponent } from "./settings-tab/edit-states-pop-up/edit-states-pop-up.component";
import { ApprovalsTabComponent } from "./approvals-tab/approvals-tab.component";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { StopOfferingComponent } from "./products/stop-offering/stop-offering.component";
import { ReplacePlanComponent } from "./products/replace-plan/replace-plan.component";
import { ProductsPlansQuasiComponent } from "./products-plans-quasi/products-plans-quasi.component";
import { ProductQuasiComponent } from "./products-plans-quasi/product-quasi/product-quasi.component";
import { PlanQuasiComponent } from "./products-plans-quasi/plan-quasi/plan-quasi.component";
import { CoverageDateQuasiComponent } from "./products-plans-quasi/coverage-date-quasi/coverage-date-quasi.component";
import { BenefitDollarsComponent } from "./benefit-dollars/benefit-dollars.component";
import { AddEditOfferingComponent } from "./benefit-dollars/add-edit-offering/add-edit-offering.component";
import { OfferingListComponent } from "./benefit-dollars/offering-list/offering-list.component";
import { ReviewSubmitQuasiComponent } from "./products-plans-quasi/review-submit-quasi/review-submit-quasi.component";
import { PlanYearQuasiComponent } from "./products-plans-quasi/plan-year-quasi/plan-year-quasi.component";
import { StopOfferingProductComponent } from "./products/stop-offering-product/stop-offering-product.component";
// eslint-disable-next-line max-len
import { ManagePlansUpdateAvailabilityComponent } from "./products/manage-plans-update-availability/manage-plans-update-availability.component";
import { EditPlanYearComponent } from "./settings-tab/edit-plan-year/edit-plan-year.component";
import { CopyPlansNewPlanyearComponent } from "./products/copy-plans-new-planyear/copy-plans-new-planyear.component";
import { ReplaceAllPlansComponent } from "./products/replace-all-plans/replace-all-plans.component";
import { ActionRequiredComponent } from "./products/action-required/action-required.component";
import { CopyAllPlansComponent } from "./products/copy-all-plans/copy-all-plans.component";
import { PlanListQuasiComponent } from "./products-plans-quasi/plan-list-quasi/plan-list-quasi.component";
import { PriceEligibilityQuasiComponent } from "./price-eligibility-quasi/price-eligibility-quasi.component";
import { SetClassRegionQuasiComponent } from "./price-eligibility-quasi/set-class-region-quasi/set-class-region-quasi.component";
import { SetPricingQuasiComponent } from "./price-eligibility-quasi/set-pricing-quasi/set-pricing-quasi.component";
import { EditPricingEligibilityQuasiComponent } from "./edit-pricing-eligibility-quasi/edit-pricing-eligibility-quasi.component";
import { EffectiveDateQuasiComponent } from "./edit-pricing-eligibility-quasi/effective-date-quasi/effective-date-quasi.component";
import { CopySettingsQuasiComponent } from "./edit-pricing-eligibility-quasi/copy-settings-quasi/copy-settings-quasi.component";
import { EmployeeMinimunPopupComponent } from "./settings-tab/employee-minimun-popup/employee-minimun-popup.component";
import { EditTppPopupComponent } from "./settings-tab/edit-tpp-popup/edit-tpp-popup.component";
import { RemovePlanYearComponent } from "./settings-tab/remove-plan-year/remove-plan-year.component";
import { CancelRequestPopUpComponent } from "./approvals-tab/cancel-request-pop-up/cancel-request-pop-up.component";
import { ChangesReviewPopUpComponent } from "./approvals-tab/changes-review-pop-up/changes-review-pop-up.component";
import { EditAgPlanYearComponent } from "./settings-tab/edit-ag-plan-year/edit-ag-plan-year.component";
import { InforceReportUploadComponent } from "./settings-tab/inforce-report-upload/inforce-report-upload.component";
import { AgViewPricesComponent } from "./products/ag-view-prices/ag-view-prices.component";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { RemovePlanYearPlansComponent } from "./products/remove-plan-year-plans/remove-plan-year-plans.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        ProductsComponent,
        MaintenanceBenefitsOfferingComponent,
        SettingsTabComponent,
        RemovePlanComponent,
        RemoveAllPlansComponent,
        RemovePlanYearPlansComponent,
        EditEmployeesPopUpComponent,
        EditStatesPopUpComponent,
        ApprovalsTabComponent,
        StopOfferingComponent,
        ReplacePlanComponent,
        ProductsPlansQuasiComponent,
        ProductQuasiComponent,
        PlanQuasiComponent,
        CoverageDateQuasiComponent,
        BenefitDollarsComponent,
        AddEditOfferingComponent,
        OfferingListComponent,
        ReviewSubmitQuasiComponent,
        PlanYearQuasiComponent,
        StopOfferingProductComponent,
        ManagePlansUpdateAvailabilityComponent,
        EditPlanYearComponent,
        CopyPlansNewPlanyearComponent,
        ReplaceAllPlansComponent,
        ActionRequiredComponent,
        CopyAllPlansComponent,
        PlanListQuasiComponent,
        PriceEligibilityQuasiComponent,
        SetClassRegionQuasiComponent,
        SetPricingQuasiComponent,
        EditPricingEligibilityQuasiComponent,
        EffectiveDateQuasiComponent,
        CopySettingsQuasiComponent,
        EmployeeMinimunPopupComponent,
        EditTppPopupComponent,
        RemovePlanYearComponent,
        CancelRequestPopUpComponent,
        ChangesReviewPopUpComponent,
        EditAgPlanYearComponent,
        InforceReportUploadComponent,
        AgViewPricesComponent,
    ],
    imports: [
        CommonModule,
        CarrierFormManageModule,
        RouterModule.forChild(MAINTENANCE_BENEFIT_ROUTES),
        SharedModule,
        LanguageModule,
        BenefitSharedModule,
        MatBottomSheetModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    providers: [ReplaceTagPipe],
})
export class MaintenanceBenefitsOfferingModule {}
