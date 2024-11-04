import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlanSettingsModule } from "./plan-settings/plan-settings.module";
import { StandardPlanComponent } from "./standard-plan.component";
import { PlanPricesComponent } from "./plan-prices/plan-prices.component";
import { UiComponentsModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { PlanDetailsLinkModule } from "../plan-details-link/plan-details-link.module";
import { AddUpdateCartButtonWrapperModule } from "../add-update-cart-button-wrapper/add-update-cart-button-wrapper.module";
import { EndCoverageLinkModule } from "../end-coverage-link/end-coverage-link.module";
import { UiModule, MaterialModule } from "@empowered/ui";

@NgModule({
    declarations: [StandardPlanComponent, PlanPricesComponent],
    imports: [
        CommonModule,
        PlanSettingsModule,
        MaterialModule,
        UiComponentsModule,
        LanguageModule,
        PlanDetailsLinkModule,
        AddUpdateCartButtonWrapperModule,
        EndCoverageLinkModule,
        UiModule,
    ],
    exports: [StandardPlanComponent],
})
export class StandardPlanModule {}
