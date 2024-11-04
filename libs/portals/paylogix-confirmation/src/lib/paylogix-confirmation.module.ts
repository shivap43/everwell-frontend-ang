import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { PaylogixPmtLandingPageComponent } from "./paylogix-pmt-landing-page/paylogix-pmt-landing-page.component";
import { PAYLOGIX_CONFIRMATION_ROUTES } from "./paylogix-confirmation.routes";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [RouterModule.forChild(PAYLOGIX_CONFIRMATION_ROUTES), CommonModule, UiModule],
    declarations: [PaylogixPmtLandingPageComponent],
    exports: [PaylogixPmtLandingPageComponent],
    providers: [],
})
export class PaylogixConfirmationModule {}
