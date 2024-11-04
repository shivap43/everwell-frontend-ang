import { NgModule } from "@angular/core";
import { UiModule } from "@empowered/ui";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { PlanSelectionComponent } from "./plan-selection.component";
import { EliminationPeriodComponent } from "./elimination-period/elimination-period.component";
import { CoverageLevelComponent } from "./coverage-level/coverage-level.component";
import { BenefitAmountsComponent } from "./benefit-amounts/benefit-amounts.component";
import { RiderOptionsComponent } from "./rider-options/rider-options.component";
import { PlanTypeComponent } from "./plan-type/plan-type.component";

@NgModule({
    declarations: [
        PlanSelectionComponent,
        EliminationPeriodComponent,
        CoverageLevelComponent,
        BenefitAmountsComponent,
        RiderOptionsComponent,
        PlanTypeComponent,
    ],
    imports: [UiModule, CommonModule, LanguageModule, ReactiveFormsModule],
    exports: [PlanSelectionComponent],
})
export class PlanSelectionModule {}
