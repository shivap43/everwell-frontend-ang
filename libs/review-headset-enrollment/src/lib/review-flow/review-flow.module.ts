import { SharedModule } from "@empowered/shared";
import { NgModule } from "@angular/core";
import { ReviewFlowMainComponent } from "./review-flow-main/review-flow-main.component";
import { VerifyUserComponent } from "./verify-user/verify-user.component";
import { EnrollmentReviewComponent } from "./enrollment-review/enrollment-review.component";
import { ConfirmationComponent } from "./confirmation/confirmation.component";
import { EnrollmentDetailsComponent } from "./enrollment-details/enrollment-details.component";
import { REVIEW_FLOW_ROUTES } from "./review-flow-route";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { CensusStatementModalComponent } from "./census-statement-modal/census-statement-modal.component";
import { PdaReviewComponent } from "./pda-review/pda-review.component";
import { UiModule } from "@empowered/ui";
import { AflacAlwaysModule } from "@empowered/aflac-always";

@NgModule({
    declarations: [
        ReviewFlowMainComponent,
        VerifyUserComponent,
        EnrollmentReviewComponent,
        PdaReviewComponent,
        ConfirmationComponent,
        EnrollmentDetailsComponent,
        CensusStatementModalComponent,
    ],
    imports: [SharedModule, LanguageModule, RouterModule.forChild(REVIEW_FLOW_ROUTES), UiModule, AflacAlwaysModule],
})
export class ReviewFlowModule {}
