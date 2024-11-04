import { NgModule } from "@angular/core";
import { PlanSeriesSettingsComponent } from "./plan-series-settings.component";
import { GenderComponent } from "./gender/gender.component";
import { TobaccoStatusComponent } from "./tobacco-status/tobacco-status.component";
import { AgesComponent } from "./ages/ages.component";
import { UiModule } from "@empowered/ui";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { AgeBandsComponent } from "./age-bands/age-bands.component";

@NgModule({
    declarations: [PlanSeriesSettingsComponent, GenderComponent, TobaccoStatusComponent, AgesComponent, AgeBandsComponent],
    imports: [UiModule, CommonModule, LanguageModule, ReactiveFormsModule],
    exports: [PlanSeriesSettingsComponent],
})
export class PlanSeriesSettingsModule {}
