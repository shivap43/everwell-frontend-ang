import { Routes } from "@angular/router";
import { CustomersComponent } from "./direct-dashboard/customers/customers.component";
import { CustomerDashboardComponent } from "./direct-dashboard/customers/customer-dashboard/customer-dashboard.component";
import { CoverageSummaryComponent } from "./direct-dashboard/customers/coverage-summary/coverage-summary.component";
import { PermissionGuard } from "@empowered/shared";
import { DirectDashboardComponent } from "./direct-dashboard/direct-dashboard.component";
import { AccountPermissionGuard, ConfigGuard } from "@empowered/ui";

export const DIRECT_ENROLLMENT_ROUTES: Routes = [
    {
        path: "",
        component: DirectDashboardComponent,
        children: [
            {
                path: ":mpGroupId/reports",
                loadChildren: () => import("@empowered/reports").then((m) => m.ReportsModule),
                canActivate: [ConfigGuard, PermissionGuard, AccountPermissionGuard],
                data: { requiredConfig: "portal.account.reports.enabled", requiredPermission: "core.document.read" },
            },
            {
                path: ":mpGroupId/commissions",
                loadChildren: () => import("@empowered/commissions").then((m) => m.CommissionsModule),
                canActivate: [AccountPermissionGuard],
            },
            {
                path: ":mpGroupId/business/schedule-send",
                loadChildren: () => import("@empowered/account-enrollments").then((m) => m.AccountEnrollmentsModule),
                canActivate: [AccountPermissionGuard],
            },
            {
                path: ":mpGroupId/business/pending-enrollments",
                loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
                canActivate: [AccountPermissionGuard],
            },
            {
                path: "customers/:mpGroupId",
                component: CustomersComponent,
                canActivate: [AccountPermissionGuard],
            },
        ],
    },
    {
        path: "customers/:mpGroupId/:customerId",
        component: CustomerDashboardComponent,
        canActivate: [AccountPermissionGuard],
        children: [
            {
                path: "coverage-summary",
                component: CoverageSummaryComponent,
            },
            { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
            {
                path: "documents",
                loadChildren: () => import("@empowered/members/documents").then((m) => m.DocumentsModule),
            },
            {
                path: "memberadd",
                loadChildren: () => import("@empowered/members/member-add").then((m) => m.MemberAddModule),
            },
            {
                path: "dependents",
                loadChildren: () => import("@empowered/members/dependent-list").then((m) => m.DependentListModule),
            },
            {
                path: "dependents/add",
                loadChildren: () => import("@empowered/members/dependent-add").then((m) => m.DependentAddModule),
            },
            {
                path: "dependents/:dependentId",
                loadChildren: () => import("@empowered/members/dependent-add").then((m) => m.DependentAddModule),
            },
            {
                path: "beneficiaries",
                loadChildren: () => import("@empowered/members/member-beneficiary").then((m) => m.MemberBeneficiaryModule),
            },
            {
                path: "change-requests",
                loadChildren: () => import("@empowered/policy-change-request").then((m) => m.PolicyChangeRequestModule),
            },
            {
                path: "pending-applications",
                loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
            },
            {
                path: "activities",
                loadChildren: () => import("@empowered/activities-history").then((m) => m.ActivitiesHistoryModule),
            },
            {
                path: "enrollments",
                loadChildren: () => import("@empowered/enrollment-history").then((m) => m.EnrollmentHistoryModule),
            },
            {
                path: "profile",
                loadChildren: () => import("@empowered/profile-history").then((m) => m.ProfileHistoryModule),
            },
        ],
    },
];
