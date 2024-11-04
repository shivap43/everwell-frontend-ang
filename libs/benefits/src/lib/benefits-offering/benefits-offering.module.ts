import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { BenefitsOfferingComponent } from "./benefits-offering.component";
import { BENEFITS_OFFERING_ROUTES } from "./benefits-offering.routes";
import { CoverageDatesComponent } from "./coverage-dates/coverage-dates.component";
import { PlansComponent } from "./plans/plans.component";
import { ProductsComponent } from "./products/products.component";
import { SettingsComponent } from "./settings/settings.component";
import { SideNavComponent } from "./side-nav/side-nav.component";
import { LanguageModule } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { PricingEligibilityComponent } from "./pricing-eligibility/pricing-eligibility.component";
import { PlanListComponent } from "./pricing-eligibility/plan-list/plan-list.component";
import { SetClassesRegionsComponent } from "./pricing-eligibility/set-classes-regions/set-classes-regions.component";
import { SetPricingComponent } from "./pricing-eligibility/set-pricing/set-pricing.component";
import { VerifyAndSubmitComponent } from "./verify-and-submit/verify-and-submit.component";
import { PricingPopupComponent } from "./pricing-eligibility/pricing-popup/pricing-popup.component";
import { NgxMaskModule } from "ngx-mask";
import { BenefitSharedModule } from "../benefit-shared.module";
import { BenefitDollarsComponent } from "./benefit-dollars/benefit-dollars.component";
import { AddEditOfferingComponent } from "./benefit-dollars/add-edit-offering/add-edit-offering.component";
import { OfferingDollarsListComponent } from "./benefit-dollars/offering-dollars-list/offering-dollars-list.component";
import { SkipNonAgPopupComponent } from "../aflac-group-offering/skip-non-ag-popup/skip-non-ag-popup.component";
import { AccountListNgxsStoreModule, BenefitOfferingNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        SharedModule,
        BenefitOfferingNgxsStoreModule,
        RouterModule.forChild(BENEFITS_OFFERING_ROUTES),
        LanguageModule,
        NgxMaskModule.forRoot(),
        BenefitSharedModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        SettingsComponent,
        SideNavComponent,
        ProductsComponent,
        PlansComponent,
        CoverageDatesComponent,
        BenefitsOfferingComponent,
        PricingEligibilityComponent,
        PlanListComponent,
        SetClassesRegionsComponent,
        SetPricingComponent,
        VerifyAndSubmitComponent,
        PricingPopupComponent,
        BenefitDollarsComponent,
        AddEditOfferingComponent,
        OfferingDollarsListComponent,
        SkipNonAgPopupComponent,
    ],
    bootstrap: [BenefitsOfferingComponent],
    providers: [DatePipe],
})
export class BenefitsOfferingModule {}
