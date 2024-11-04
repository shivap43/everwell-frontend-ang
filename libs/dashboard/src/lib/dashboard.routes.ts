import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { PermissionGuard } from "@empowered/shared";
import { ConfigName, UserPermissionList } from "@empowered/constants";
import { AccountPermissionGuard, ConfigGuard, TPIHQGuard, HQGuard } from "@empowered/ui";

export const DASHBOARD_ROUTES: Routes = [
    {
        path: "",
        component: DashboardComponent,
        canActivateChild: [AccountPermissionGuard],
        children: [
            {
                path: "profile",
                loadChildren: () => import("@empowered/profile").then((m) => m.ProfileModule),
            },
            {
                path: "change-requests",
                loadChildren: () => import("@empowered/policy-change-request").then((m) => m.PolicyChangeRequestModule),
                canActivate: [PermissionGuard],
                data: {
                    requiredPermission: "core.policyChangeRequest.read",
                },
            },
            {
                path: "enrollment-options",
                loadChildren: () => import("@empowered/enrollment-options").then((m) => m.EnrollmentOptionsModule),
                canActivate: [TPIHQGuard],
                data: {
                    requiredTPIPermission: UserPermissionList.AFLAC_HQ_TPP_ACCESS,
                },
            },
            {
                path: "case-builder",
                loadChildren: () => import("@empowered/case-builder").then((m) => m.CaseBuilderModule),
            },
            {
                path: "assign-admin",
                loadChildren: () => import("@empowered/assign-admin").then((m) => m.AssignAdminModule),
            },
            {
                path: "business/pending-enrollments",
                loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
            },
            {
                path: "reports",
                loadChildren: () => import("@empowered/reports").then((m) => m.ReportsModule),
            },
            {
                path: "commissions",
                loadChildren: () => import("@empowered/commissions").then((m) => m.CommissionsModule),
            },
            {
                path: "employees",
                loadChildren: () => import("@empowered/members").then((m) => m.MembersModule),
            },
            {
                path: "business/schedule-send",
                loadChildren: () => import("@empowered/account-enrollments").then((m) => m.AccountEnrollmentsModule),
            },
            {
                path: "exceptions",
                loadChildren: () => import("@empowered/product-exceptions").then((m) => m.ProductExceptionsModule),
            },
            {
                path: "profile/structure",
                loadChildren: () => import("@empowered/company-structure").then((m) => m.CompanyStructureModule),
                canActivate: [PermissionGuard],
                data: {
                    requiresOnePermission: ["core.account.read.class", "core.account.read.region"],
                },
            },
            {
                path: "resources",
                loadChildren: () => import("@empowered/resources").then((m) => m.ResourcesModule),
            },
            {
                path: "benefits",
                loadChildren: () => import("@empowered/benefits").then((m) => m.BenefitsModule),
            },
            {
                path: "proposals",
                loadChildren: () => import("@empowered/proposals").then((m) => m.ProposalsModule),
                canActivateChild: [HQGuard],
            },
            {
                path: "messageCenter",
                loadChildren: () => import("@empowered/message-center").then((m) => m.MessageCenterModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: ConfigName.MESSAGE_CENTER_TOGGLE,
                },
            },
        ],
    },

    {
        path: "schedule-send",
        loadChildren: () => import("@empowered/account-enrollments").then((m) => m.AccountEnrollmentsModule),
    },
];
