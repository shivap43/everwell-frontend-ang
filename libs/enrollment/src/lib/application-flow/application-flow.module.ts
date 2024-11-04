import { NgModule } from "@angular/core";
import { ApplicationFlowComponent } from "./application-flow.component";
import { RouterModule } from "@angular/router";
import { APP_FLOW_ROUTES } from "./application-flow.routes";

import { AppFlowMainComponent } from "./app-flow-main/app-flow-main.component";
import { AppFlowSidenavComponent } from "./app-flow-sidenav/app-flow-sidenav.component";
import { SharedModule } from "@empowered/shared";
import { SectionSidenavComponent } from "./app-flow-sidenav/section-sidenav/section-sidenav.component";
import { ApplicationFlowStepsModule } from "../application-flow-steps/application-flow-steps.module";
import { LanguageModule } from "@empowered/language";
import { UiModule, MaskPaymentPipe } from "@empowered/ui";
import {
    MemberBeneficiaryNgxsStoreModule,
    DualPlanYearNGXSStoreModule,
    EnrollmentMethodNGXSStoreModule,
    DashboardNgxsStoreModule,
} from "@empowered/ngxs-store";

@NgModule({
    declarations: [ApplicationFlowComponent, AppFlowMainComponent, AppFlowSidenavComponent, SectionSidenavComponent],
    imports: [
        SharedModule,
        ApplicationFlowStepsModule,
        RouterModule.forChild(APP_FLOW_ROUTES),
        LanguageModule,
        UiModule,
        MemberBeneficiaryNgxsStoreModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
        DashboardNgxsStoreModule,
    ],
    bootstrap: [ApplicationFlowComponent],
    providers: [MaskPaymentPipe],
    exports: [ApplicationFlowComponent, AppFlowMainComponent, AppFlowSidenavComponent, SectionSidenavComponent],
})
export class ApplicationFlowModule {}
