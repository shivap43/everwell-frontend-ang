import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AccountPendingEnrollmentsComponent } from "./account-pending-enrollments/account-pending-enrollments.component";
import { PendingApplicationsComponent } from "./pending-applications/pending-applications.component";
import { PENDING_ENROLLMENTS_ROUTES } from "./pending-enrollment-applications.routes";
import { EditStatusPopUpComponent } from "./edit-status-pop-up/edit-status-pop-up.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [AccountPendingEnrollmentsComponent, PendingApplicationsComponent, EditStatusPopUpComponent],
    imports: [
        CommonModule,
        RouterModule,
        RouterModule.forChild(PENDING_ENROLLMENTS_ROUTES),
        SharedModule,
        LanguageModule,
        UiModule,
        AccountListNgxsStoreModule,
    ],
    exports: [AccountPendingEnrollmentsComponent, PendingApplicationsComponent, EditStatusPopUpComponent],
    providers: [DatePipe, ReplaceTagPipe],
})
export class PendingEnrollmentApplicationsModule {}
