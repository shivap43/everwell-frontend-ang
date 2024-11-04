import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReviewEnrollmentFlowMainComponent } from "./components/review-enrollment-flow-main.component";
import { VerifyIdentityComponent } from "./components/verify-identity/verify-identity.component";
import { EnrollmentSummaryComponent } from "./components/enrollment-summary/enrollment-summary.component";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { RouterModule } from "@angular/router";
import { UiModule } from "@empowered/ui";
import { REVIEW_ENROLLMENT_FLOW_ROUTES } from "./review-enollment-flow-route";
import { CensusStatementModalComponent } from "./components/census-statement-modal/census-statement-modal.component";

@NgModule({
    declarations: [ReviewEnrollmentFlowMainComponent, VerifyIdentityComponent, EnrollmentSummaryComponent, CensusStatementModalComponent],
    imports: [CommonModule, SharedModule, LanguageModule, RouterModule.forChild(REVIEW_ENROLLMENT_FLOW_ROUTES), UiModule],
})
export class ReviewEnrollmentFlowModule {}
