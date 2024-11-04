import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { MemberListComponent } from "./member-list/member-list.component";
import { MEMBERS_ROUTES } from "./members.routes";
import { CensusModule } from "./census/census.module";
import { MatBadgeModule } from "@angular/material/badge";
import { MemberDashboardComponent } from "./member-dashboard/member-dashboard.component";
import { MemberAddModalComponent } from "./member-add/member-add-modal/member-add-modal.component";
import { TerminateEmployeeComponent } from "./member-add/terminate-employee/terminate-employee.component";
import { RehireEmployeeComponent } from "./member-add/rehire-employee/rehire-employee.component";
import { SalaryUpdateConfirmationComponent } from "./member-add/work-info/salary-update-confirmation/salary-update-confirmation.component";
import { UiModule } from "@empowered/ui";
import {
    MembersNgxsStoreModule,
    MembersService,
    AccountListNgxsStoreModule,
    DashboardNgxsStoreModule,
    DualPlanYearNGXSStoreModule,
    EnrollmentMethodNGXSStoreModule,
} from "@empowered/ngxs-store";

@NgModule({
    imports: [
        RouterModule.forChild(MEMBERS_ROUTES),
        SharedModule,
        LanguageModule,
        MatBadgeModule,
        CensusModule,
        UiModule,
        MembersNgxsStoreModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
    ],
    declarations: [
        MemberListComponent,
        MemberDashboardComponent,
        MemberAddModalComponent,
        TerminateEmployeeComponent,
        RehireEmployeeComponent,
        SalaryUpdateConfirmationComponent,
    ],
    providers: [ReplaceTagPipe, MembersService],
})
export class MembersModule {}
