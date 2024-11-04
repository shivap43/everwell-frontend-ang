import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormPageQuestionComponent } from "./benefits-offering/carrier-forms/form-page-question/form-page-question.component";
import { ViewFormComponent } from "./benefits-offering/carrier-forms/view-form/view-form.component";
import { ClasstypePopupComponent } from "./benefits-offering/carrier-forms/classtype-popup/classtype-popup.component";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { NgxMaskModule, NgxMaskPipe } from "ngx-mask";
import { CarrierFormsComponent } from "./benefits-offering/carrier-forms/carrier-forms.component";
import { CarrierFileUploadComponent } from "./benefits-offering/carrier-forms/carrier-file-upload/carrier-file-upload.component";
import { QuestionControlService } from "./benefits-offering/carrier-forms/question-control.service";
import { ProductsPlansQuasiService } from "./maintenance-benefits-offering/products-plans-quasi/services/products-plans-quasi.service";
import { AssignAdminModule } from "@empowered/assign-admin";
import { CoverageDateApprovalComponent } from "./coverage-date-approval/coverage-date-approval.component";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        AssignAdminModule,
        MatBottomSheetModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        CarrierFormsComponent,
        FormPageQuestionComponent,
        ViewFormComponent,
        CarrierFileUploadComponent,
        ClasstypePopupComponent,
        CoverageDateApprovalComponent,
    ],
    exports: [
        CarrierFormsComponent,
        ViewFormComponent,
        FormPageQuestionComponent,
        CarrierFileUploadComponent,
        CoverageDateApprovalComponent,
    ],
    providers: [NgxMaskPipe, QuestionControlService, ProductsPlansQuasiService],
})
export class BenefitSharedModule {}
