import { ReinstatementComponent } from "./reinstatement/reinstatement.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { QuestionComponent } from "./question/question.component";
import { BeneficiaryComponent } from "./beneficiary/beneficiary.component";
import { ConversionComponent } from "./conversion/conversion.component";
import { DemographicComponent } from "./demographic/demographic.component";
// import { PaymentComponent } from "@empowered/ui";
import { PlanOptionsComponent } from "./plan-options/plan-options.component";
import { SignatureAppComponent } from "./signature-app/signature-app.component";
import { TextComponent } from "./text/text.component";
import { TobaccoComponent } from "./tobacco/tobacco.component";
import { PlaninfoCompactComponent } from "./planinfo-compact/planinfo-compact.component";
import { ConfirmationComponent } from "./confirmation/confirmation.component";
import { SharedModule, UiComponentsModule } from "@empowered/shared";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { BucketPlanFlowComponent } from "./bucket-plan-flow/bucket-plan-flow.component";
import { RidersComponent } from "./riders/riders.component";
import { DependentsComponent } from "./dependents/dependents.component";
import { ReinstateDialogComponent } from "./reinstate-dialog/reinstate-dialog.component";
import { PdaFormComponent } from "./pda-form/pda-form.component";
import { DirectPaymentComponent } from "./direct-payment/direct-payment.component";
import { CloseSepPopupComponent } from "./close-sep-popup/close-sep-popup.component";
import { ApplicationPdfDialogComponent } from "./application-pdf-dialog/application-pdf-dialog.component";
import { NgxMaskModule } from "ngx-mask";
import { OccupationClassComponent } from "./occupation-class/occupation-class.component";
import { CloseLifeEventPopupComponent } from "./confirmation/close-life-event-popup/close-life-event-popup.component";
import { EditDeletePaymentComponent } from "@empowered/ui";
import { ViewPlanInfoComponent } from "./view-plan-info/view-plan-info.component";
import { TpiAddDependentsComponent } from "./tpi-add-dependents/tpi-add-dependents.component";
import { ReinstateInfoModalComponent } from "./reinstate-info-modal/reinstate-info-modal.component";
import { AgGroupInformationComponent } from "./ag-group-information/ag-group-information.component";
import { ViewPlanDetailsComponent } from "./view-plan-details/view-plan-details.component";
import { SendOtpComponent } from "./virtual-F2F/send-otp/send-otp.component";
import { VerifyOtpComponent } from "./virtual-F2F/verify-otp/verify-otp.component";
import { ScreenHandOffComponent } from "./virtual-F2F/screen-hand-off/screen-hand-off.component";
import { ConsentStatementComponent } from "./signature-app/consent-statement/consent-statement.component";
// eslint-disable-next-line max-len
import { CompleteRequiredDependentInfoComponent } from "./dependents/complete-required-dependent-info/complete-required-dependent-info.component";
import { EDeliveryPromptComponent } from "./confirmation/edelivery-prompt/edelivery-prompt.component";
import { EBSPaymentComponent } from "./ebs-payment/ebs-payment.component";
import { UiModule } from "@empowered/ui";
import {
    DashboardNgxsStoreModule,
    MemberBeneficiaryNgxsStoreModule,
    DualPlanYearNGXSStoreModule,
    EnrollmentMethodNGXSStoreModule,
} from "@empowered/ngxs-store";
import { PreliminaryStatementComponent } from "./preliminary-statement/preliminary-statement.component";
import { PaperCopyModalComponent } from "./preliminary-statement/paper-copy-modal/paper-copy-modal.component";
import { AflacAlwaysModule } from "@empowered/aflac-always";

@NgModule({
    imports: [
        CommonModule,
        UiComponentsModule,
        SharedModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
        MemberBeneficiaryNgxsStoreModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
        AflacAlwaysModule,
    ],
    declarations: [
        QuestionComponent,
        BeneficiaryComponent,
        ConfirmationComponent,
        ConversionComponent,
        DemographicComponent,
        // PaymentComponent,
        PlanOptionsComponent,
        PlaninfoCompactComponent,
        SignatureAppComponent,
        TextComponent,
        TobaccoComponent,
        BucketPlanFlowComponent,
        ReinstatementComponent,
        RidersComponent,
        DependentsComponent,
        ReinstateDialogComponent,
        PdaFormComponent,
        DirectPaymentComponent,
        CloseSepPopupComponent,
        ApplicationPdfDialogComponent,
        OccupationClassComponent,
        CloseLifeEventPopupComponent,
        EBSPaymentComponent,
        ViewPlanInfoComponent,
        TpiAddDependentsComponent,
        ReinstateInfoModalComponent,
        AgGroupInformationComponent,
        ViewPlanDetailsComponent,
        SendOtpComponent,
        VerifyOtpComponent,
        ScreenHandOffComponent,
        ConsentStatementComponent,
        CompleteRequiredDependentInfoComponent,
        EDeliveryPromptComponent,
        PreliminaryStatementComponent,
        PaperCopyModalComponent,
    ],
    exports: [
        QuestionComponent,
        BeneficiaryComponent,
        ConfirmationComponent,
        ConversionComponent,
        DemographicComponent,
        // PaymentComponent,
        PlanOptionsComponent,
        PlaninfoCompactComponent,
        SignatureAppComponent,
        TextComponent,
        TobaccoComponent,
        BucketPlanFlowComponent,
        ReinstatementComponent,
        RidersComponent,
        DependentsComponent,
        ReinstateDialogComponent,
        PdaFormComponent,
        DirectPaymentComponent,
        EBSPaymentComponent,
        OccupationClassComponent,
        ReinstateInfoModalComponent,
        AgGroupInformationComponent,
        ScreenHandOffComponent,
        EDeliveryPromptComponent,
        PreliminaryStatementComponent,
    ],
    providers: [ReplaceTagPipe],
})
export class ApplicationFlowStepsModule {}
