import { NgModule } from "@angular/core";
import { CensusModule } from "@empowered/members";
import { DirectEnrollmentComponent } from "./direct-enrollment.component";
import { RouterModule } from "@angular/router";
import { DIRECT_ENROLLMENT_ROUTES } from "./direct-enrollment.routes";
import { DirectDashboardComponent } from "./direct-dashboard/direct-dashboard.component";
import { CustomersComponent } from "./direct-dashboard/customers/customers.component";
import { AddCustomerComponent } from "./direct-dashboard/customers/add-customer/add-customer.component";
import { CustomerListComponent } from "./direct-dashboard/customers/customer-list/customer-list.component";
import { LanguageModule } from "@empowered/language";
import { CommonModule, DatePipe } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { CoverageSummaryComponent } from "./direct-dashboard/customers/coverage-summary/coverage-summary.component";
// eslint-disable-next-line max-len
import { PreviousCoveredDependentsComponent } from "./direct-dashboard/customers/coverage-summary/edit-coverage/previous-covered-dependents/previous-covered-dependents.component";
// eslint-disable-next-line max-len
import { ManageDependentComponent } from "./direct-dashboard/customers/coverage-summary/edit-coverage/manage-dependent/manage-dependent.component";
// eslint-disable-next-line max-len
import { CoverageChangingComponent } from "./direct-dashboard/customers/coverage-summary/edit-coverage/coverage-changing/coverage-changing.component";
import { EditCoverageComponent } from "./direct-dashboard/customers/coverage-summary/edit-coverage/edit-coverage.component";
import { VoidCoverageComponent } from "./direct-dashboard/customers/coverage-summary/edit-coverage/void-coverage/void-coverage.component";
import { CustomerDashboardComponent } from "./direct-dashboard/customers/customer-dashboard/customer-dashboard.component";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTreeModule } from "@angular/material/tree";
import { CreateDirectAccountComponent } from "./direct-dashboard/create-direct-account/create-direct-account.component";
import { NgxMaskModule } from "ngx-mask";
import { RemoveCustomerComponent } from "./direct-dashboard/customers/remove-customer/remove-customer.component";
import { UiModule } from "@empowered/ui";
import { DashboardNgxsStoreModule, ProducerListNgxsStoreModule, EnrollmentMethodNGXSStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        CensusModule,
        RouterModule.forChild(DIRECT_ENROLLMENT_ROUTES),
        SharedModule,
        LanguageModule,
        MatBadgeModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSidenavModule,
        MatTreeModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
        ProducerListNgxsStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],

    declarations: [
        DirectEnrollmentComponent,
        DirectDashboardComponent,
        CustomersComponent,
        AddCustomerComponent,
        CustomerListComponent,
        CoverageSummaryComponent,
        PreviousCoveredDependentsComponent,
        ManageDependentComponent,
        CoverageChangingComponent,
        VoidCoverageComponent,
        EditCoverageComponent,
        CustomerDashboardComponent,
        CreateDirectAccountComponent,
        RemoveCustomerComponent,
    ],
    bootstrap: [DirectEnrollmentComponent],
    providers: [DatePipe],
})
export class DirectEnrollmentModule {}
