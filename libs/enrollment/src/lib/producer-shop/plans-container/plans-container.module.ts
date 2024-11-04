import { EndCoverageLinkModule } from "./end-coverage-link/end-coverage-link.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PlansContainerComponent } from "./plans-container.component";
import { BucketPlanComponent } from "./bucket-plan/bucket-plan.component";
import { StandardPlanModule } from "./standard-plan/standard-plan.module";
import { EnrollmentPlanComponent } from "./enrollment-plan/enrollment-plan.component";
import { UiComponentsModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { PlanDetailsLinkModule } from "./plan-details-link/plan-details-link.module";
import { AddUpdateCartButtonWrapperModule } from "./add-update-cart-button-wrapper/add-update-cart-button-wrapper.module";
import { RedirectPlanComponent } from "./redirect-plan/redirect-plan.component";
import { RedirectConfirmationModalComponent } from "./redirect-plan/redirect-confirmation-modal/redirect-confirmation-modal.component";
import { PlanWithdrawLinkComponent } from "./plan-withdraw-link/plan-withdraw-link.component";
import { PlanContainerComponent } from "./plan-container/plan-container.component";
import { ImportPolicyLinkComponent } from "./import-policy-link/import-policy-link.component";
import { ReactiveFormsModule } from "@angular/forms";
import { ReinstateButtonWrapperComponent } from "./reinstate-button-wrapper/reinstate-button-wrapper.component";
import { UiModule, MaterialModule } from "@empowered/ui";

@NgModule({
    declarations: [
        PlansContainerComponent,
        BucketPlanComponent,
        EnrollmentPlanComponent,
        RedirectPlanComponent,
        RedirectConfirmationModalComponent,
        PlanWithdrawLinkComponent,
        PlanContainerComponent,
        ImportPolicyLinkComponent,
        ReinstateButtonWrapperComponent,
    ],
    imports: [
        CommonModule,
        StandardPlanModule,
        MaterialModule,
        UiComponentsModule,
        AddUpdateCartButtonWrapperModule,
        LanguageModule,
        PlanDetailsLinkModule,
        EndCoverageLinkModule,
        ReactiveFormsModule,
        UiModule,
    ],
    exports: [PlansContainerComponent],
})
export class PlansContainerModule {}
