import { Routes } from "@angular/router";
import { MemberListComponent } from "./member-list/member-list.component";
import { MemberDashboardComponent } from "./member-dashboard/member-dashboard.component";
import { PermissionGuard } from "@empowered/shared";
import { AccountPermissionGuard, ConfigGuard } from "@empowered/ui";

export const MEMBERS_ROUTES: Routes = [
    { path: "", component: MemberListComponent },
    {
        path: ":memberId",
        component: MemberDashboardComponent,
        canActivateChild: [AccountPermissionGuard],
        children: [
            {
                path: "memberadd",
                loadChildren: () => import("./member-add/member-add.module").then((m) => m.MemberAddModule),
            },
            {
                path: "memberdetail",
                loadChildren: () => import("./member-detail/member-detail.module").then((m) => m.MemberDetailModule),
            },
            { path: "support", loadChildren: () => import("@empowered/support").then((m) => m.SupportModule) },
            {
                path: "dependents",
                loadChildren: () => import("./dependent-list/dependent-list.module").then((m) => m.DependentListModule),
            },
            {
                path: "dependents/add",
                loadChildren: () => import("./dependent-add/dependent-add.module").then((m) => m.DependentAddModule),
            },
            {
                path: "dependents/:dependentId",
                loadChildren: () => import("./dependent-add/dependent-add.module").then((m) => m.DependentAddModule),
            },
            {
                path: "beneficiaries",
                loadChildren: () => import("./member-beneficiary/member-beneficiary.module").then((m) => m.MemberBeneficiaryModule),
            },
            {
                path: "documents",
                loadChildren: () => import("./documents/documents.module").then((m) => m.DocumentsModule),
            },
            {
                path: "qle",
                loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
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
                path: "pending-applications",
                loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
            },
            { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
            {
                path: "benefit-dollars",
                loadChildren: () =>
                    import("./member-benefit-dollars/member-benefit-dollars.module").then((m) => m.MemberBenefitDollarsModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: "general.feature.enable.benefitDollars",
                },
            },
            {
                path: "activities",
                loadChildren: () => import("./activities-history/activities-history.module").then((m) => m.ActivitiesHistoryModule),
            },
            {
                path: "enrollments",
                loadChildren: () => import("./enrollment-history/enrollment-history.module").then((m) => m.EnrollmentHistoryModule),
            },
            {
                path: "profile",
                loadChildren: () => import("./profile-history/profile-history.module").then((m) => m.ProfileHistoryModule),
            },
            {
                path: "emails-and-texts",
                loadChildren: () => import("@empowered/email-tracking").then((m) => m.EmailTrackingRoutingModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: "broker.group_portal.audit_history_tab.email_sms",
                },
            },
        ],
    },
    { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
];
