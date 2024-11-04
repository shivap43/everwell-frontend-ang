import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlanSettingsComponent } from "./plan-settings.component";
import { RidersComponent } from "./riders/riders.component";
import { BenefitAmountComponent } from "./benefit-amount/benefit-amount.component";
import { EliminationPeriodComponent } from "./elimination-period/elimination-period.component";
import { DependentAgeComponent } from "./dependent-age/dependent-age.component";
import { UiComponentsModule } from "@empowered/shared";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { MaterialModule, UiModule } from "@empowered/ui";

@NgModule({
    declarations: [PlanSettingsComponent, RidersComponent, BenefitAmountComponent, EliminationPeriodComponent, DependentAgeComponent],
    imports: [CommonModule, LanguageModule, MaterialModule, UiComponentsModule, ReactiveFormsModule, UiModule],
    exports: [PlanSettingsComponent],
})
export class PlanSettingsModule {}
