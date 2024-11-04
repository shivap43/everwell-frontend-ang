import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AflacGroupOfferingComponent } from "./aflac-group-offering.component";
import { AgAiOfferingSetupAlertComponent } from "./ag-ai-offering-setup-alert/ag-ai-offering-setup-alert.component";
import { ReplaceTagPipe, LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { RouterModule } from "@angular/router";
import { AFLAC_GROUP_OFFERING_ROUTES } from "./aflac-group-offering.routes";
import { BenefitSharedModule } from "../benefit-shared.module";
import { UiModule } from "@empowered/ui";
import { DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        LanguageModule,
        RouterModule.forChild(AFLAC_GROUP_OFFERING_ROUTES),
        BenefitSharedModule,
        UiModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [AflacGroupOfferingComponent, AgAiOfferingSetupAlertComponent],
    providers: [ReplaceTagPipe],
})
export class AflacGroupOfferingModule {}
