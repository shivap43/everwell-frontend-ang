import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { CoverageSummaryComponent } from "./coverage-summary/coverage-summary.component";
import { RouterModule } from "@angular/router";
import { BENEFIT_SUMMARY_ROUTES } from "./benefit-summary.routes";
import { SharedModule } from "@empowered/shared";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { EditCoverageComponent } from "./edit-coverage/edit-coverage.component";
import { ManageDependentComponent } from "./edit-coverage/manage-dependent/manage-dependent.component";
import { NgxMaskModule } from "ngx-mask";
import { ReactiveFormsModule } from "@angular/forms";
import { CoverageChangingComponent } from "./edit-coverage/coverage-changing/coverage-changing.component";
import { PreviousCoveredDependentsComponent } from "./edit-coverage/previous-covered-dependents/previous-covered-dependents.component";
import { DeclineCoverageComponent } from "./edit-coverage/decline-coverage/decline-coverage.component";
import { EndCoverageComponent } from "./end-coverage/end-coverage.component";
import { VoidCoverageComponent } from "./edit-coverage/void-coverage/void-coverage.component";
import { PdaCompletionComponent } from "./pda-completion/pda-completion.component";
import { BenefitSharedModule, ProductsPlansQuasiService } from "@empowered/benefits";
import { PayrollFrequencyCalculatorPipe, UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";
import { AflacAlwaysModule } from "@empowered/aflac-always";

@NgModule({
    declarations: [
        CoverageSummaryComponent,
        EditCoverageComponent,
        ManageDependentComponent,
        CoverageChangingComponent,
        PreviousCoveredDependentsComponent,
        DeclineCoverageComponent,
        EndCoverageComponent,
        VoidCoverageComponent,
        PdaCompletionComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        RouterModule.forChild(BENEFIT_SUMMARY_ROUTES),
        NgxMaskModule.forRoot(),
        ReactiveFormsModule,
        LanguageModule,
        BenefitSharedModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        EnrollmentMethodNGXSStoreModule,
        AflacAlwaysModule,
    ],
    providers: [PayrollFrequencyCalculatorPipe, DatePipe, ReplaceTagPipe, ProductsPlansQuasiService],
    exports: [CoverageSummaryComponent],
})
export class BenefitSummaryModule {}
