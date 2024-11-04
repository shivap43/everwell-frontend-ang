import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { EnrollmentHistoryRoutingModule } from "./enrollment-history-routing.module";
import { EnrollmentHistoryComponent } from "./enrollment-history/enrollment-history.component";
import { PlanHistoryComponent } from "./plan-history/plan-history.component";
import { CoveredIndividualsComponent } from "./covered-individuals/covered-individuals.component";
import { BeneficiaryHistoryComponent } from "./beneficiary-history/beneficiary-history.component";
import { QuestionHistoryComponent } from "./question-history/question-history.component";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";
import { DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        EnrollmentHistoryComponent,
        PlanHistoryComponent,
        CoveredIndividualsComponent,
        QuestionHistoryComponent,
        BeneficiaryHistoryComponent,
    ],
    imports: [CommonModule, EnrollmentHistoryRoutingModule, SharedModule, UiModule, DashboardNgxsStoreModule],
})
export class EnrollmentHistoryModule {}
