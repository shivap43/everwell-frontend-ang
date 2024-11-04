import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ApproveDenialQleComponent } from "./approve-denial-qle/approve-denial-qle.component";
import { LifeEventsComponent } from "./life-events/life-events.component";
import { PendingEnrollmentComponent } from "./pending-enrollment/pending-enrollment.component";
import { AddNewQleComponent } from "./add-new-qle/add-new-qle.component";
import { RouterModule } from "@angular/router";
import { QLE_ROUTES } from "./qle.routes";
import { SharedModule } from "@empowered/shared";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { PendingEnrollmentApplicationsModule } from "./pending-enrollment-applications/pending-enrollment-applications.module";
import { ApprovalDenialEnrollmentsComponent } from "./pending-enrollment/approval-denial-enrollments/approval-denial-enrollments.component";
import { PendingQleComponent } from "./pending-enrollment/pending-qle/pending-qle.component";
import { MoreFilterComponent } from "./more-filter/more-filter.component";
import { ApproveDenyEndCoverageComponent } from "./approve-deny-end-coverage/approve-deny-end-coverage.component";
import { QleNGXSStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        LanguageModule,
        RouterModule.forChild(QLE_ROUTES),
        QleNGXSStoreModule,
        SharedModule,
        PendingEnrollmentApplicationsModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],
    declarations: [
        LifeEventsComponent,
        ApproveDenialQleComponent,
        PendingEnrollmentComponent,
        AddNewQleComponent,
        ApprovalDenialEnrollmentsComponent,
        PendingQleComponent,
        MoreFilterComponent,
        ApproveDenyEndCoverageComponent,
    ],
    exports: [AddNewQleComponent, PendingEnrollmentComponent, ApproveDenialQleComponent, PendingEnrollmentApplicationsModule],
    providers: [DatePipe, ReplaceTagPipe],
})
export class QleModule {}
