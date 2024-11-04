import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { CARRIER_FORMS_ROUTES } from "./carrier-forms.routes";
import { BenefitSharedModule } from "./../../benefit-shared.module";
import { ConfirmQ60PopupComponent } from "./confirm-q60-popup/confirm-q60-popup.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
@NgModule({
    imports: [
        RouterModule.forChild(CARRIER_FORMS_ROUTES),
        CommonModule,
        SharedModule,
        LanguageModule,
        BenefitSharedModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [ConfirmQ60PopupComponent],
})
export class CarrierFormsModule {}
