import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { NgxsModule } from "@ngxs/store";
import { CommonModule } from "@angular/common";
import { PolicyChangeRequestComponent } from "./policy-change-request.component";
import { POLICY_CHANGE_REQUEST_ROUTES } from "./policy-change-request.routes";
import { FindPolicyHolderComponent } from "./policy-change-request-flow/find-policy-holder/find-policy-holder.component";
import { RequestPolicyChangesComponent } from "./policy-change-request-flow/request-policy-changes/request-policy-changes.component";
import { PolicyChangesComponent } from "./policy-change-request-flow/policy-changes/policy-changes.component";
import { ReviewAndSubmitComponent } from "./policy-change-request-flow/review-and-submit/review-and-submit.component";
import { SideNavComponent } from "./policy-change-request-flow/side-nav/side-nav.component";
import { PolicyChangeRequestViewComponent } from "./policy-change-request-view/policy-change-request-view.component";
import { PolicyChangeRequestListComponent } from "./policy-change-request-list/policy-change-request-list.component";
import { LanguageModule } from "@empowered/language";
import { PcrFileUploadComponent } from "./pcr-file-upload/pcr-file-upload.component";
import { AffectedPoliciesComponent } from "./policy-change-request-flow/affected-policies/affected-policies.component";
// eslint-disable-next-line max-len
import { DowngradeDisabilityComponent } from "./policy-change-request-flow/policy-transactions/downgrade-disability/downgrade-disability.component";
import { DowngradeCancerComponent } from "./policy-change-request-flow/policy-transactions/downgrade-cancer/downgrade-cancer.component";
// eslint-disable-next-line max-len
import { DowngradeAccidentComponent } from "./policy-change-request-flow/policy-transactions/downgrade-accident/downgrade-accident.component";
import { ChangeGenderComponent } from "./policy-change-request-flow/policy-transactions/change-gender/change-gender.component";
import { ChangeAddressComponent } from "./policy-change-request-flow/policy-transactions/change-address/change-address.component";
import { ChangeNameComponent } from "./policy-change-request-flow/policy-transactions/change-name/change-name.component";
// eslint-disable-next-line max-len
import { TransferToPayrollComponent } from "./policy-change-request-flow/policy-transactions/transfer-to-payroll/transfer-to-payroll.component";
import { RemoveDependentComponent } from "./policy-change-request-flow/policy-transactions/remove-dependent/remove-dependent.component";
import { RemoveRiderComponent } from "./policy-change-request-flow/policy-transactions/remove-rider/remove-rider.component";
// eslint-disable-next-line max-len
import { TransferToDirectComponent } from "./policy-change-request-flow/policy-transactions/transfer-to-direct/transfer-to-direct.component";
// eslint-disable-next-line max-len
import { ChangeOccupationalClassComponent } from "./policy-change-request-flow/policy-transactions/change-occupational-class/change-occupational-class.component";
// eslint-disable-next-line max-len
// eslint-disable-next-line max-len
import { ChangeBeneficiaryComponent } from "./policy-change-request-flow/policy-transactions/change-beneficiary/change-beneficiary.component";
// eslint-disable-next-line max-len
import { AddEditBeneficiaryComponent } from "./policy-change-request-flow/policy-transactions/change-beneficiary/add-edit-beneficiary/add-edit-beneficiary.component";
// eslint-disable-next-line max-len
import { RemoveBeneficiaryPopupComponent } from "./policy-change-request-flow/policy-transactions/change-beneficiary/remove-beneficiary-popup/remove-beneficiary-popup.component";
import { NgxMaskModule } from "ngx-mask";
import { DatePickerMonthYearComponent } from "./policy-change-request-flow/date-picker-month-year/date-picker-month-year.component";
import { MoreFilterComponent } from "./more-filter/more-filter.component";
import { UiModule } from "@empowered/ui";
import {
    AccountListNgxsStoreModule,
    DashboardNgxsStoreModule,
    EnrollmentMethodNGXSStoreModule,
    PolicyChangeRequestStoreModule,
} from "@empowered/ngxs-store";
import { AflacAlwaysModule } from "@empowered/aflac-always";

@NgModule({
    imports: [
        SharedModule,
        NgxsModule,
        LanguageModule,
        CommonModule,
        PolicyChangeRequestStoreModule,
        RouterModule.forChild(POLICY_CHANGE_REQUEST_ROUTES),
        NgxMaskModule.forRoot(),
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        EnrollmentMethodNGXSStoreModule,
        AflacAlwaysModule,
    ],
    declarations: [
        FindPolicyHolderComponent,
        RequestPolicyChangesComponent,
        PolicyChangesComponent,
        ReviewAndSubmitComponent,
        SideNavComponent,
        PolicyChangeRequestComponent,
        PolicyChangeRequestViewComponent,
        PolicyChangeRequestListComponent,
        PcrFileUploadComponent,
        AffectedPoliciesComponent,
        DowngradeDisabilityComponent,
        DowngradeCancerComponent,
        DowngradeAccidentComponent,
        ChangeGenderComponent,
        ChangeAddressComponent,
        ChangeNameComponent,
        TransferToPayrollComponent,
        RemoveDependentComponent,
        RemoveRiderComponent,
        TransferToDirectComponent,
        ChangeOccupationalClassComponent,
        ChangeBeneficiaryComponent,
        AddEditBeneficiaryComponent,
        RemoveBeneficiaryPopupComponent,
        DatePickerMonthYearComponent,
        MoreFilterComponent,
    ],
    bootstrap: [PolicyChangeRequestComponent],
})
export class PolicyChangeRequestModule {}
