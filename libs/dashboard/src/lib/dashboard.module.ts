import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { DashboardComponent } from "./dashboard.component";
import { DASHBOARD_ROUTES } from "./dashboard.routes";
import { DeactivateAccountPopupComponent } from "./deactivate-account-popup/deactivate-account-popup.component";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { CdkTableModule } from "@angular/cdk/table";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { DashboardSidenavComponent } from "./dashboard-sidenav/dashboard-sidenav.component";
import { AdminApprovalChecklistComponent } from "./admin-approval-checklist/admin-approval-checklist.component";
import { RequestChangesDialogComponent } from "./admin-approval-checklist/request-changes-dialog/request-changes-dialog.component";
import { ViewDocumentDialogComponent } from "./admin-approval-checklist/view-document-dialog/view-document-dialog.component";
import { ProducerAuthorizationCodePopupComponent } from "./producer-authorization-code-popup/producer-authorization-code-popup.component";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { SpecialInstructionsComponent } from "libs/enrollment-options/src/lib/call-center/instructions/special-instructions.component";
import { RegistrationGuideComponent } from "./registration-guide/registration-guide.component";
import { EditBenefitDollarModalComponent } from "./admin-approval-checklist/edit-benefit-dollar-modal/edit-benefit-dollar-modal.component";
import { RemoveBenefitDollarModalComponent } from "./admin-approval-checklist/remove-benefit-dollar-modal/remove-modal.component";
import { UndoRemoveBenefitDollarModalComponent } from "./admin-approval-checklist/unremove-benefit-dollar-modal/unremove-modal.component";
import { CoreModule } from "@empowered/core";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { MatStepperModule } from "@angular/material/stepper";

@NgModule({
    imports: [
        RouterModule.forChild(DASHBOARD_ROUTES),
        SharedModule,
        CoreModule,
        CdkTableModule,
        LanguageModule,
        MatFormFieldModule,
        MatInputModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        MatStepperModule,
    ],
    providers: [ReplaceTagPipe],
    declarations: [
        DashboardComponent,
        DeactivateAccountPopupComponent,
        DashboardSidenavComponent,
        AdminApprovalChecklistComponent,
        RequestChangesDialogComponent,
        ViewDocumentDialogComponent,
        ProducerAuthorizationCodePopupComponent,
        SpecialInstructionsComponent,
        RegistrationGuideComponent,
        EditBenefitDollarModalComponent,
        RemoveBenefitDollarModalComponent,
        UndoRemoveBenefitDollarModalComponent,
    ],
    exports: [DeactivateAccountPopupComponent, ProducerAuthorizationCodePopupComponent],
})
export class DashboardModule {}
