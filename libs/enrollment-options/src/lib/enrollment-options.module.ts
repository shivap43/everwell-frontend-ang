import { CommonModule, DatePipe } from "@angular/common";
import { ENROLLMENTOPTIONS_ROUTES } from "./enrollment-options.route";
import { NgModule } from "@angular/core";

import { RouterModule } from "@angular/router";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { ThirdPartyComponent } from "./third-party/third-party.component";
import { EnrollmentOptionsComponent } from "./enrollment-options/enrollment-options.component";
import { CallCenterComponent } from "./call-center/call-center.component";
import { CallCenterListComponent } from "./call-center/call-center-list/call-center-list.component";
import { ManageCallCenterDialogComponent } from "./call-center/manage-call-center-dialog/manage-call-center-dialog.component";
import { SharedModule } from "@empowered/shared";
import { ReactiveFormsModule } from "@angular/forms";
import { ApprovalDialogComponent } from "./call-center/approval-dialog/approval-dialog.component";
import { AddEditThirdPartyPlatformComponent } from "./third-party/add-edit-third-party-platform/add-edit-third-party-platform.component";
import { EnrollmentExceptionsComponent } from "./enrollment-exceptions/enrollment-exceptions.component";
import { ExceptionFormComponent } from "./enrollment-exceptions/exception-form/exception-form.component";
import { AddEditThirdPartyPopUpComponent } from "./third-party/add-edit-third-party-pop-up/add-edit-third-party-pop-up.component";
import { ThirdPartyPreviewComponent } from "./third-party/add-edit-third-party-platform/third-party-preview/third-party-preview.component";
import { CallCenterAvailabilityComponent } from "./call-center/call-center-availability/call-center-availability.component";
import { NgxMaskModule } from "ngx-mask";
import { TollFreeNumberComponent } from "./call-center/toll-free-number/toll-free-number.component";
import { UiModule, MaterialModule, PhoneFormatConverterPipe } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { EnrollmentOptionsNGXSStoreModule } from "@empowered/ngxs-store";
import { MatDialogModule } from "@angular/material/dialog";

@NgModule({
    declarations: [
        ThirdPartyComponent,
        EnrollmentOptionsComponent,
        CallCenterComponent,
        CallCenterListComponent,
        ManageCallCenterDialogComponent,
        ApprovalDialogComponent,
        AddEditThirdPartyPlatformComponent,
        EnrollmentExceptionsComponent,
        ExceptionFormComponent,
        AddEditThirdPartyPopUpComponent,
        ThirdPartyPreviewComponent,
        CallCenterAvailabilityComponent,
        TollFreeNumberComponent,
    ],
    imports: [
        CommonModule,
        EnrollmentOptionsNGXSStoreModule,
        LanguageModule,
        SharedModule,
        RouterModule.forChild(ENROLLMENTOPTIONS_ROUTES),
        MaterialModule,
        ReactiveFormsModule,
        NgxMaskModule.forRoot(),
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        MatDialogModule,
    ],
    providers: [ReplaceTagPipe, DatePipe, PhoneFormatConverterPipe],
})
export class EnrollmentOptionsModule {}
