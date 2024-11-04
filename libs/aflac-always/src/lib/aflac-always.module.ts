/* eslint-disable max-len */
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule, UiModule } from "@empowered/ui";
import { EnrollAflacAlwaysModalComponent } from "./enroll-aflac-always-modal/enroll-aflac-always-modal.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { ConstantsModule } from "@empowered/constants";
import { LanguageModule } from "@empowered/language";
import { FormState, InputState, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";
import { NgxsModule } from "@ngxs/store";
import { NgxDropzoneModule } from "ngx-dropzone";
import { NgxMaskModule } from "ngx-mask";
import { AddNewAccountModalComponent } from "./enroll-aflac-always-modal/components/add-new-account-modal/add-new-account-modal.component";
import { BillingAddressStepComponent } from "./enroll-aflac-always-modal/components/billing-address-step/billing-address-step.component";
import { PaymentMethodStepComponent } from "./enroll-aflac-always-modal/components/payment-method-step/payment-method-step.component";
import { PaymentSettingsStepComponent } from "./enroll-aflac-always-modal/components/payment-settings-step/payment-settings-step.component";
// eslint-disable-next-line max-len
import { EligiblePoliciesTableComponent } from "./enroll-aflac-always-modal/components/select-policies-step/components/eligible-policies-table/eligible-policies-table.component";
// eslint-disable-next-line max-len
import { EnrollmentMethodSelectComponent } from "./enroll-aflac-always-modal/components/select-policies-step/components/enrollment-method-select/enrollment-method-select.component";
// eslint-disable-next-line max-len
import { ImportPolicyFormComponent } from "./enroll-aflac-always-modal/components/select-policies-step/components/import-policy-form/import-policy-form.component";
import { SelectPoliciesStepComponent } from "./enroll-aflac-always-modal/components/select-policies-step/select-policies-step.component";
// eslint-disable-next-line max-len
import { DeductionFrequencyComponent } from "./enroll-aflac-always-modal/components/payment-settings-step/components/deduction-frequency/deduction-frequency.component";
// eslint-disable-next-line max-len
import { EsignatureComponent } from "./enroll-aflac-always-modal/components/payment-settings-step/components/esignature/esignature.component";
// eslint-disable-next-line max-len
import { PaymentDateComponent } from "./enroll-aflac-always-modal/components/payment-settings-step/components/payment-date/payment-date.component";
import { PaymentAcknowledgementCheckboxComponent } from "./enroll-aflac-always-modal/components/payment-settings-step/components/payment-acknowledgement-checkbox/payment-acknowledgement-checkbox.component";
import { AflacAlwaysCardComponent } from "./aflac-always-card/aflac-always-card.component";
import { LearnMoreModalComponent } from "./aflac-always-card/learn-more-modal/learn-more-modal.component";
import { SignatureModalComponent } from "./enroll-aflac-always-modal/components/signature-modal/signature-modal.component";
import { ReviewAflacAlwaysModalComponent } from "./aflac-always-card/review-aflac-always-modal/review-aflac-always-modal.component";

@NgModule({
    imports: [
        CommonModule,
        UiModule,
        FormsModule,
        ReactiveFormsModule,
        LanguageModule,
        ConstantsModule,
        MaterialModule,
        NgxDropzoneModule,
        NgxsModule.forFeature([FormState, InputState]),
        NgxMaskModule.forRoot(),
        EnrollmentMethodNGXSStoreModule,
        ClipboardModule,
    ],
    declarations: [
        AddNewAccountModalComponent,
        BillingAddressStepComponent,
        PaymentMethodStepComponent,
        PaymentSettingsStepComponent,
        EligiblePoliciesTableComponent,
        EnrollmentMethodSelectComponent,
        ImportPolicyFormComponent,
        SelectPoliciesStepComponent,
        EnrollAflacAlwaysModalComponent,
        DeductionFrequencyComponent,
        PaymentDateComponent,
        EsignatureComponent,
        PaymentAcknowledgementCheckboxComponent,
        AflacAlwaysCardComponent,
        LearnMoreModalComponent,
        SignatureModalComponent,
        ReviewAflacAlwaysModalComponent,
    ],
    exports: [
        AddNewAccountModalComponent,
        BillingAddressStepComponent,
        PaymentMethodStepComponent,
        PaymentSettingsStepComponent,
        EligiblePoliciesTableComponent,
        EnrollmentMethodSelectComponent,
        ImportPolicyFormComponent,
        SelectPoliciesStepComponent,
        EnrollAflacAlwaysModalComponent,
        AflacAlwaysCardComponent,
    ],
})
export class AflacAlwaysModule {}
