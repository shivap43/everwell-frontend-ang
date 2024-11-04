import { LoadChildren, Routes } from "@angular/router";
import { AccountPermissionGuard } from "@empowered/ui";
import { AccountListComponent } from "./account-list/account-list.component";
import { ProspectDashboardComponent } from "./prospect-accounts/prospect-list/prospect-dashboard/prospect-dashboard.component";

const membersModule: LoadChildren = () => import("@empowered/members").then((m) => m.MembersModule);

/**
 * Accounts Router Config
 *
 * All paths below will be lazy-loaded using the "/payroll" segment in various AppRouting modules.
 */
export const ACCOUNTS_ROUTES: Routes = [
    { path: "", component: AccountListComponent },
    {
        path: ":accountId",
        loadChildren: () => import("./account-detail").then((m) => m.AccountDetailModule),
    },
    {
        path: ":mpGroupId/dashboard",
        loadChildren: () => import("@empowered/dashboard").then((m) => m.DashboardModule),
        canActivate: [AccountPermissionGuard],
    },
    { path: "support", loadChildren: () => import("@empowered/support").then((m) => m.SupportModule) },
    {
        path: ":accountName/benefits-offering",
        loadChildren: () => import("@empowered/benefits").then((m) => m.BenefitsModule),
    },
    {
        path: ":accountName/business/pending-enrollments",
        loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
    },
    {
        path: ":accountName/reports",
        loadChildren: () => import("@empowered/reports").then((m) => m.ReportsModule),
    },
    { path: ":accountName/employees", loadChildren: membersModule },
    { path: ":mpGroupId/member", loadChildren: membersModule, canActivate: [AccountPermissionGuard] },
    {
        path: "prospect/:prospectId",
        component: ProspectDashboardComponent,
        canActivate: [AccountPermissionGuard],
        children: [
            {
                path: "proposals",
                loadChildren: () => import("@empowered/proposals").then((m) => m.ProposalsModule),
            },
            {
                path: "commissions",
                loadChildren: () => import("@empowered/commissions").then((m) => m.CommissionsModule),
            },
            {
                path: "employees",
                loadChildren: membersModule,
            },
            {
                path: "profile",
                loadChildren: () => import("@empowered/profile").then((m) => m.ProfileModule),
            },
        ],
    },
    {
        path: "prospect/:prospectId/member",
        loadChildren: membersModule,
    },
];
