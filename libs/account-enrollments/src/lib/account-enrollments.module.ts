import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { AccountEnrollmentsComponent } from "./account-enrollments.component";
import { SentEnrollmentsComponent } from "./sent-enrollments/sent-enrollments.component";
import { UnsentEnrollmentsComponent } from "./unsent-enrollments/unsent-enrollments.component";
import { EnrollmentsFiltersComponent } from "./enrollments-filters/enrollments-filters.component";
import { SharedModule } from "@empowered/shared";
import { ACCOUNT_ENROLLMENTS_ROUTES } from "./account-enrollments.routes";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
// eslint-disable-next-line max-len
import { UnsentEnrollmentNotePopupComponent } from "./unsent-enrollments/unsent-enrollment-note-popup/unsent-enrollment-note-popup.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxMaskModule } from "ngx-mask";
import { OldEAAEnrollmentModalComponent } from "./unsent-enrollments/old-eaa-enrollment-modal/old-eaa-enrollment-modal.component";
import { AccountEnrollmentsNGXSStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        CommonModule,
        AccountEnrollmentsNGXSStoreModule,
        RouterModule.forChild(ACCOUNT_ENROLLMENTS_ROUTES),
        SharedModule,
        LanguageModule,
        FormsModule,
        ReactiveFormsModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        AccountEnrollmentsComponent,
        SentEnrollmentsComponent,
        UnsentEnrollmentsComponent,
        EnrollmentsFiltersComponent,
        UnsentEnrollmentNotePopupComponent,
        OldEAAEnrollmentModalComponent,
    ],
    providers: [DatePipe],
})
export class AccountEnrollmentsModule {}
