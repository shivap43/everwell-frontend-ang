import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { AccountListComponent } from "./account-list/account-list.component";
import { ACCOUNTS_ROUTES } from "./accounts.routes";
import { CreateAccountFormComponent } from "./create-account-form/create-account-form.component";
import { ImportAccountFormComponent } from "./import-account-form/import-account-form.component";
import { NewAccountButtonComponent } from "./new-account-button/new-account-button.component";
import { CdkTableModule } from "@angular/cdk/table";
import { LanguageModule } from "@empowered/language";
import { InvitationPopupComponent } from "./invitation-popup/invitation-popup.component";
import { CallCenterFormComponent } from "./call-center-form/call-center-form.component";
import { LayoutModule } from "@angular/cdk/layout";
import { DatePipe } from "@angular/common";
import { ProducerFilterComponent } from "./producer-filter/producer-filter.component";
import { MoreFilterComponent } from "./more-filter/more-filter.component";
import { ProspectAccountsComponent } from "./prospect-accounts/prospect-accounts.component";
import { CreateProspectComponent } from "./prospect-accounts/create-prospect/create-prospect.component";
import { ProspectListComponent } from "./prospect-accounts/prospect-list/prospect-list.component";
import { ConvertProspectComponent } from "./prospect-accounts/convert-prospect/convert-prospect.component";
import { ProspectDashboardComponent } from "./prospect-accounts/prospect-list/prospect-dashboard/prospect-dashboard.component";
import { StateFilterComponent } from "./account-list/state-filter/state-filter.component";
import { ListItemComponent } from "./account-list/state-filter/list-item/list-item.component";
import { AgImportFormComponent } from "./ag-import-form/ag-import-form.component";
import { AgIndividualFormComponent } from "./ag-import-form/ag-individual-form/ag-individual-form.component";
import { ImportStepSecondComponent } from "./ag-import-form/import-step-second/import-step-second.component";
import { AgIndividualSecondComponent } from "./ag-import-form/ag-individual-second/ag-individual-second.component";
import { AgIndividualMultiAccountComponent } from "./ag-import-form/ag-individual-multi-account/ag-individual-multi-account.component";
import { AgNewHireFormComponent } from "./ag-import-form/ag-new-hire-form/ag-new-hire-form.component";
import { ProspectInvitationComponent } from "./prospect-accounts/prospect-invitation/prospect-invitation.component";
import { DeleteProspectComponent } from "./prospect-accounts/delete-prospect/delete-prospect.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule, BenefitOfferingNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        RouterModule.forChild(ACCOUNTS_ROUTES),
        SharedModule,
        AccountListNgxsStoreModule,
        BenefitOfferingNgxsStoreModule,
        DashboardNgxsStoreModule,
        CdkTableModule,
        LanguageModule,
        LayoutModule,
        UiModule,
    ],
    declarations: [
        AccountListComponent,
        CreateAccountFormComponent,
        ImportAccountFormComponent,
        NewAccountButtonComponent,
        InvitationPopupComponent,
        CallCenterFormComponent,
        ProducerFilterComponent,
        MoreFilterComponent,
        ProspectAccountsComponent,
        CreateProspectComponent,
        ProspectListComponent,
        ConvertProspectComponent,
        ProspectDashboardComponent,
        StateFilterComponent,
        ListItemComponent,
        AgImportFormComponent,
        AgIndividualFormComponent,
        ImportStepSecondComponent,
        AgIndividualSecondComponent,
        AgIndividualMultiAccountComponent,
        AgNewHireFormComponent,
        ProspectInvitationComponent,
        DeleteProspectComponent,
    ],
    providers: [DatePipe],
})
export class AccountsModule {}
