import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ClipboardModule } from "@angular/cdk/clipboard";
// TODO: CD - Have to remove language dependency by removing api dependency on user
//  ui -> language -> api -> user -> shared -> ui
import { LanguageModule } from "@empowered/language";
import { ConstantsModule } from "@empowered/constants";
import {
    EmpoweredSheetComponent,
    EmpoweredSheetFooterComponent,
    EmpoweredSheetHeaderComponent,
    EmpoweredStepperSheetComponent,
} from "./components/bottom-sheet";
import { MonIconComponent } from "./components/mon-icon/mon-icon.component";
import { EmpoweredPaginatorComponent } from "./components/paginator/paginator.component";
import { MonUploadComponent } from "./components/mon-upload/mon-upload.component";
import { AflacLegalNamePipe } from "./pipes/aflac-legal-name.pipe";
import { FilterOptionPipe } from "./pipes/beneficiary-option.pipe";
import { CoverageNamePipe } from "./pipes/coverage-name.pipe";
import { EmpoweredModalComponent, EmpoweredModalHeaderComponent, EmpoweredModalFooterComponent } from "./components/modal";
import { MaterialModule } from "./material/material.module";
import { EmpoweredDatePickerComponent } from "./components/date-picker/date-picker.component";
import { EmpoweredInputComponent } from "./business/input/empowered-input/empowered-input.component";
import { InputDirective } from "./business/input/directives/input.directive";
import { NgxsModule } from "@ngxs/store";
import { CartWarningPopupComponent } from "./components/cart-warning-popup/cart-warning-popup.component";
import { PayrollFrequencyCalculatorPipe } from "./pipes/payroll-frequency-calculator.pipe";
import { PhoneFormatConverterPipe } from "./pipes/phone-format-converter.pipe";
import { RelationsPipe } from "./pipes/relations.pipe";
import { SortStatesNamePipe } from "./pipes/sort-state-name.pipe";
import { SortStatesPipe } from "./pipes/order-by.pipe";
import { SsnFormatPipe } from "./pipes/ssn-format.pipe";
import { SsnInputComponent, ConfirmSsnService } from "./components/ssn-input";
import { SummaryPipe } from "./pipes/summary.pipe";
import { TruncatePipe } from "./pipes/truncate.pipe";
import { DataFilter } from "./pipes/custom-data-filter.pipe";
import { FilterSpousePipe, FlexDollarPipe, MaskPaymentPipe } from "./pipes";
import { MenuDividerComponent } from "./components/menu/menu-divider/menu-divider.component";
import {
    DisableControlDirective,
    FocusOnFirstInvalidFieldDirective,
    HasPermissionDirective,
    ConfigEnabledDirective,
    FocusInitialDirective,
    DateTransformDirective,
    IsRestrictedDirective,
    LangDirective,
    NumberValidationDirective,
    PermissionsDirective,
    PhoneNumberFormatDirective,
    ScrollBottomDirective,
    PreventPasteOnHtmlElementsDirective,
    ScrollSpyDirective,
    ScrollTopDirective,
    StepperDirective,
    SsnFormatDirective,
} from "./directives";
import { MonAlertComponent } from "./components/mon-alert/mon-alert.component";
import { MonDialogComponent } from "./components/mon-dialog/mon-dialog.component";
import { MonSpinnerComponent } from "./components/mon-spinner/mon-spinner.component";
import { EmpoweredAttentionModalComponent } from "./components/empowered-attention-modal/empowered-attention-modal.component";
import { EBSRequiredInfoComponent } from "./components/ebs-required-info/ebs-required-info.component";
import { EBSInfoModalComponent } from "./components/ebs-info-modal/ebs-info-modal.component";
import { AccountRefreshModalComponent } from "./components/account-refresh-modal/account-refresh-modal.component";
import { RichTooltipDirective, TooltipComponent } from "./components/rich-tooltip/rich-tooltip.directive";
import { ToastListState } from "./business/toast/+state/empowered-toast.state";
import {
    ConfirmAddressDialogComponent,
    FileRowComponent,
    FileUploaderComponent,
    ImportPeoModalComponent,
    ImportPolicyModalComponent,
    EnrollmentInfoPopupComponent,
    PaymentDetailsPromptComponent,
    ZipCodeInputComponent,
    ZeroPercentCommissionComponent,
    WellthiePopupComponent,
    UpdateArgusEmployeeCountComponent,
    PdaPrComponent,
    ChipSelectComponent,
    NotificationPopupComponent,
    MemberNotificationComponent,
    SendApplicantPdaComponent,
    DropDownPortalComponent,
    PortalTriggerDirective,
    AflacGroupOfferingQuasiComponent,
    AgRefreshComponent,
    AgOfferingSubmitPopupComponent,
    EnrollmentMethodComponent,
} from "./components";
import { GenericSidenavComponent } from "./components/generic-sidenav/generic-sidenav.component";
import { MonNavlistComponent } from "./components/mon-navlist/mon-navlist.component";
import { DateFilterPanelComponent } from "./components/pill-filter/panels/date-filter-panel/date-filter-panel.component";
import { MultiFilterPanelComponent } from "./components/pill-filter/panels/multi-filter-panel/multi-filter-panel.component";
import { SearchFilterPanelComponent } from "./components/pill-filter/panels/search-filter-panel/search-filter-panel.component";
import { SingleFilterPanelComponent } from "./components/pill-filter/panels/single-filter-panel/single-filter-panel.component";
import { PillFilterComponent } from "./components/pill-filter/pill-filter/pill-filter.component";
import { PillFilterGroupComponent } from "./components/pill-filter/pill-filter-group/pill-filter-group.component";
import { OfferingListPopupComponent } from "./components/offering-list-popup";
import { PlanDetailsComponent, PolicyChangeRequestCancelPopupComponent } from "./components";
import { NgxDropzoneModule } from "ngx-dropzone";
import { TrimSpaceDirective } from "./directives/trim-space.directive";
import { TPIRestrictedPermissionForHQDirective } from "./directives/tpi-restricted-permission-for-hq.directive";
import { NgxMaskModule } from "ngx-mask";
import { CreateNewPdaPopupComponent } from "./components/create-new-pda-popup/create-new-pda-popup.component";
import { DateRangePickerComponent } from "./business/date-range-picker/date-range-picker.component";
import { NgxDaterangepickerMd } from "./components/daterangepicker";
import { EnrollmentMethodNGXSStoreModule, FormState, InputState } from "@empowered/ngxs-store";
// eslint-disable-next-line max-len
import { PolicyChangeRequestConfirmationPopupComponent } from "./components/policy-change-request-confirmation-popup/policy-change-request-confirmation-popup.component";
import { ProfileChangesConfirmPromptComponent } from "./business/profile-changes-confirm-prompt/profile-changes-confirm-prompt.component";
import { SearchComponent } from "./components/search/search.component";
import { NewPdaComponent } from "./components/new-pda/new-pda.component";
import {
    DependentAddComponent,
    ConfirmationDialogComponent,
    DependentsContactInfoComponent,
    DependentExitDialogComponent,
    ContactInfoPopupComponent,
    DependentsPersonalInfoComponent,
    ConfirmIneligiblePlansComponent,
    BeneficiaryMissingInfoComponent,
    CensusManualEntryComponent,
    SearchProducerComponent,
    SharePlanResourceComponent,
    AddCommissionSplitsComponent,
    AddressMatchingPromptComponent,
    AddSingleProducerComponent,
    AddUpdateContactInfoComponent,
    EmpoweredToastComponent,
    AddAdminManuallyComponent,
    ExitPopupModalComponent,
    AddAdminComponent,
    AddAdminViaCensusComponent,
    AddAdminByImportingComponent,
    AddressVerificationComponent,
    BeneficiaryAddComponent,
    SettingsDropdownComponent,
    DependentAddressUpdateModalComponent,
    EditDeletePaymentComponent,
    PaymentComponent,
} from "./business";
import { BenefitOfferingUtilService } from "./services";
import { EmpoweredSheetService } from "@empowered/common-services";
import { CheckboxListComponent } from "./components/checkbox-list/checkbox-list.component";
// eslint-disable-next-line max-len
import { SendEnrollmentSummaryEmailModalComponent } from "./components/send-enrollment-summary-email-modal/send-enrollment-summary-email-modal.component";

// TODO: CD Should not be exporting components instead has to create a package
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        LanguageModule,
        ConstantsModule,
        MaterialModule,
        NgxDropzoneModule,
        NgxsModule.forFeature([FormState, InputState, ToastListState]),
        NgxMaskModule.forRoot(),
        NgxDaterangepickerMd.forRoot(),
        EnrollmentMethodNGXSStoreModule,
        ClipboardModule,
    ],
    declarations: [
        BeneficiaryMissingInfoComponent,
        CensusManualEntryComponent,
        CartWarningPopupComponent,
        ChipSelectComponent,
        EmpoweredSheetComponent,
        EmpoweredSheetHeaderComponent,
        EmpoweredSheetFooterComponent,
        EmpoweredStepperSheetComponent,
        EmpoweredModalComponent,
        EmpoweredModalHeaderComponent,
        EmpoweredModalFooterComponent,
        MonIconComponent,
        EmpoweredPaginatorComponent,
        MonUploadComponent,
        AflacLegalNamePipe,
        CoverageNamePipe,
        FilterOptionPipe,
        EmpoweredDatePickerComponent,
        EmpoweredInputComponent,
        InputDirective,
        PayrollFrequencyCalculatorPipe,
        PhoneFormatConverterPipe,
        RelationsPipe,
        SortStatesNamePipe,
        SortStatesPipe,
        SsnFormatPipe,
        SummaryPipe,
        TrimSpaceDirective,
        TPIRestrictedPermissionForHQDirective,
        TruncatePipe,
        MenuDividerComponent,
        DisableControlDirective,
        FocusOnFirstInvalidFieldDirective,
        HasPermissionDirective,
        MonAlertComponent,
        MonDialogComponent,
        MonSpinnerComponent,
        SsnInputComponent,
        SsnFormatDirective,
        ConfigEnabledDirective,
        DateTransformDirective,
        FocusInitialDirective,
        EmpoweredAttentionModalComponent,
        DataFilter,
        FlexDollarPipe,
        MaskPaymentPipe,
        PreventPasteOnHtmlElementsDirective,
        ScrollBottomDirective,
        ScrollSpyDirective,
        ScrollTopDirective,
        StepperDirective,
        FilterSpousePipe,
        IsRestrictedDirective,
        LangDirective,
        NumberValidationDirective,
        PermissionsDirective,
        PhoneNumberFormatDirective,
        EBSRequiredInfoComponent,
        EBSInfoModalComponent,
        AccountRefreshModalComponent,
        AddAdminManuallyComponent,
        TooltipComponent,
        RichTooltipDirective,
        EmpoweredToastComponent,
        GenericSidenavComponent,
        MonNavlistComponent,
        DateFilterPanelComponent,
        MultiFilterPanelComponent,
        SearchFilterPanelComponent,
        SingleFilterPanelComponent,
        PillFilterComponent,
        PillFilterGroupComponent,
        OfferingListPopupComponent,
        PlanDetailsComponent,
        PolicyChangeRequestCancelPopupComponent,
        PaymentDetailsPromptComponent,
        EnrollmentInfoPopupComponent,
        ZipCodeInputComponent,
        FileUploaderComponent,
        FileRowComponent,
        ImportPeoModalComponent,
        ImportPolicyModalComponent,
        CreateNewPdaPopupComponent,
        DateRangePickerComponent,
        ZeroPercentCommissionComponent,
        WellthiePopupComponent,
        UpdateArgusEmployeeCountComponent,
        ConfirmationDialogComponent,
        DependentAddComponent,
        DependentsContactInfoComponent,
        DependentExitDialogComponent,
        DependentsPersonalInfoComponent,
        ContactInfoPopupComponent,
        ConfirmIneligiblePlansComponent,
        ConfirmAddressDialogComponent,
        PdaPrComponent,
        PolicyChangeRequestConfirmationPopupComponent,
        ProfileChangesConfirmPromptComponent,
        SearchComponent,
        NotificationPopupComponent,
        MemberNotificationComponent,
        NewPdaComponent,
        SearchProducerComponent,
        SharePlanResourceComponent,
        SendApplicantPdaComponent,
        AddressMatchingPromptComponent,
        AddUpdateContactInfoComponent,
        AddSingleProducerComponent,
        AddCommissionSplitsComponent,
        ExitPopupModalComponent,
        AddAdminComponent,
        AddAdminViaCensusComponent,
        AddAdminByImportingComponent,
        AddressVerificationComponent,
        BeneficiaryAddComponent,
        DropDownPortalComponent,
        PortalTriggerDirective,
        SettingsDropdownComponent,
        AflacGroupOfferingQuasiComponent,
        AgRefreshComponent,
        AgOfferingSubmitPopupComponent,
        CheckboxListComponent,
        EnrollmentMethodComponent,
        DependentAddressUpdateModalComponent,
        EditDeletePaymentComponent,
        PaymentComponent,
        SendEnrollmentSummaryEmailModalComponent,
    ],
    providers: [
        EmpoweredSheetService,
        SortStatesNamePipe,
        SortStatesPipe,
        TruncatePipe,
        FlexDollarPipe,
        MaskPaymentPipe,
        ConfirmSsnService,
        SsnFormatPipe,
        BenefitOfferingUtilService,
    ],
    exports: [
        BeneficiaryMissingInfoComponent,
        CensusManualEntryComponent,
        CartWarningPopupComponent,
        ChipSelectComponent,
        EmpoweredSheetComponent,
        EmpoweredStepperSheetComponent,
        EmpoweredSheetHeaderComponent,
        EmpoweredSheetFooterComponent,
        EmpoweredModalComponent,
        EmpoweredModalHeaderComponent,
        EmpoweredModalFooterComponent,
        MonIconComponent,
        EmpoweredPaginatorComponent,
        MonUploadComponent,
        AflacLegalNamePipe,
        CoverageNamePipe,
        FilterOptionPipe,
        MaterialModule,
        EmpoweredDatePickerComponent,
        EmpoweredInputComponent,
        InputDirective,
        PayrollFrequencyCalculatorPipe,
        PhoneFormatConverterPipe,
        RelationsPipe,
        SortStatesNamePipe,
        SortStatesPipe,
        SsnFormatPipe,
        SummaryPipe,
        TrimSpaceDirective,
        TPIRestrictedPermissionForHQDirective,
        TruncatePipe,
        DataFilter,
        FlexDollarPipe,
        MenuDividerComponent,
        DisableControlDirective,
        FocusOnFirstInvalidFieldDirective,
        HasPermissionDirective,
        MonAlertComponent,
        MonSpinnerComponent,
        SsnInputComponent,
        SsnFormatDirective,
        ConfigEnabledDirective,
        DateTransformDirective,
        FocusInitialDirective,
        EmpoweredAttentionModalComponent,
        MaskPaymentPipe,
        PreventPasteOnHtmlElementsDirective,
        ScrollBottomDirective,
        ScrollSpyDirective,
        ScrollTopDirective,
        StepperDirective,
        FilterSpousePipe,
        IsRestrictedDirective,
        LangDirective,
        NumberValidationDirective,
        PermissionsDirective,
        PhoneNumberFormatDirective,
        EBSRequiredInfoComponent,
        EBSInfoModalComponent,
        AccountRefreshModalComponent,
        AddAdminManuallyComponent,
        RichTooltipDirective,
        GenericSidenavComponent,
        MonNavlistComponent,
        PillFilterGroupComponent,
        OfferingListPopupComponent,
        PlanDetailsComponent,
        PaymentDetailsPromptComponent,
        EnrollmentInfoPopupComponent,
        ZipCodeInputComponent,
        FileUploaderComponent,
        ImportPolicyModalComponent,
        CreateNewPdaPopupComponent,
        DateRangePickerComponent,
        ZeroPercentCommissionComponent,
        WellthiePopupComponent,
        UpdateArgusEmployeeCountComponent,
        ConfirmationDialogComponent,
        DependentAddComponent,
        DependentsContactInfoComponent,
        DependentExitDialogComponent,
        DependentsPersonalInfoComponent,
        ContactInfoPopupComponent,
        ConfirmIneligiblePlansComponent,
        ConfirmAddressDialogComponent,
        PdaPrComponent,
        ProfileChangesConfirmPromptComponent,
        SearchComponent,
        NotificationPopupComponent,
        MemberNotificationComponent,
        NewPdaComponent,
        SearchProducerComponent,
        SharePlanResourceComponent,
        SendApplicantPdaComponent,
        AddressMatchingPromptComponent,
        AddUpdateContactInfoComponent,
        AddSingleProducerComponent,
        AddCommissionSplitsComponent,
        ExitPopupModalComponent,
        AddAdminComponent,
        AddAdminViaCensusComponent,
        AddAdminByImportingComponent,
        AddressVerificationComponent,
        BeneficiaryAddComponent,
        DropDownPortalComponent,
        PortalTriggerDirective,
        SettingsDropdownComponent,
        AflacGroupOfferingQuasiComponent,
        AgRefreshComponent,
        AgOfferingSubmitPopupComponent,
        CheckboxListComponent,
        EnrollmentMethodComponent,
        DependentAddressUpdateModalComponent,
        EditDeletePaymentComponent,
        PaymentComponent,
    ],
})
export class UiModule {}
