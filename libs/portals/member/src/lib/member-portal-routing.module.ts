import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PermissionGuard } from "@empowered/shared";
import { MemberPortalComponent } from "./member-portal.component";
import { Permission, ConfigName } from "@empowered/constants";
import { AuthenticationGuard, ConfigGuard } from "@empowered/ui";
export const MEMBER_PORTAL_ROUTES: Routes = [
    {
        path: "login",
        component: MemberPortalComponent,
        loadChildren: () => import("@empowered/login").then((m) => m.LoginModule),
    },
    {
        path: "reset-password",
        loadChildren: () => import("@empowered/login/reset-password").then((m) => m.ResetPasswordModule),
    },
    {
        path: "forgot-password",
        loadChildren: () => import("@empowered/login/forgot-password").then((m) => m.ForgotPasswordModule),
    },
    {
        path: "forgot-username",
        loadChildren: () => import("@empowered/login/forgot-username").then((m) => m.ForgotUsernameModule),
    },
    {
        path: "register",
        loadChildren: () => import("@empowered/registration").then((m) => m.RegistrationModule),
    },
    {
        path: "review-enrollment",
        loadChildren: () => import("@empowered/review-headset-enrollment").then((m) => m.ReviewHeadsetEnrollmentModule),
    },
    {
        path: "review-enrollment-summary",
        loadChildren: () => import("@empowered/review-enrollments").then((m) => m.ReviewEnrollmentsModule),
    },
    { path: "", redirectTo: "login", pathMatch: "full" },
    // NOTE: All routes below this line must pass AuthenticationGuard
    {
        path: "",
        component: MemberPortalComponent,
        canActivateChild: [AuthenticationGuard],
        children: [
            { path: "home", loadChildren: () => import("@empowered/member-home").then((m) => m.MemberHomeModule) },
            {
                path: "household",
                children: [
                    {
                        path: "profile",
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
                    { path: "", redirectTo: "profile", pathMatch: "full" },
                ],
            },
            {
                path: "memberadd",
                loadChildren: () => import("@empowered/members/member-add").then((m) => m.MemberAddModule),
            },
            { path: "resources", loadChildren: () => import("@empowered/resources").then((m) => m.ResourcesModule) },
            { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
            {
                path: "settings",
                loadChildren: () => import("./account-settings/account-settings.module").then((m) => m.AccountSettingsModule),
            },
            {
                path: ":mpGroupId/member",
                loadChildren: () => import("@empowered/members").then((m) => m.MembersModule),
            },

            {
                path: "coverage",
                children: [
                    {
                        path: "change-requests",
                        loadChildren: () => import("@empowered/policy-change-request").then((m) => m.PolicyChangeRequestModule),
                    },
                    {
                        path: "enrollment",
                        loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule),
                    },
                    {
                        path: "life-events",
                        loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
                    },
                    { path: "", redirectTo: "policy-change-request", pathMatch: "full" },
                    {
                        path: "life-events",
                        loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
                    },
                    {
                        path: "beneficiaries",
                        loadChildren: () => import("@empowered/members/member-beneficiary").then((m) => m.MemberBeneficiaryModule),
                    },
                    {
                        path: "forms",
                        loadChildren: () => import("@empowered/members/completed-forms").then((m) => m.CompletedFormsModule),
                    },
                ],
            },
            {
                path: "wizard",
                loadChildren: () => import("@empowered/member-wizard").then((m) => m.MemberWizardModule),
            },
            {
                path: "commissions",
                loadChildren: () => import("@empowered/commissions").then((m) => m.CommissionsModule),
                canActivate: [ConfigGuard, PermissionGuard],
                data: {
                    requiredConfig: ConfigName.SELF_ENROLLMENT,
                    requiredPermission: Permission.COMMISSION_READ,
                },
            },
            {
                path: "business",
                loadChildren: () => import("@empowered/account-enrollments").then((m) => m.AccountEnrollmentsModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: ConfigName.SELF_ENROLLMENT,
                },
            },
            {
                path: "messageCenter",
                loadChildren: () => import("@empowered/message-center").then((m) => m.MessageCenterModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: ConfigName.MESSAGE_CENTER_TOGGLE,
                },
            },
            { path: "", redirectTo: "home", pathMatch: "full" },
        ],
    },
    {
        path: "self-service",
        loadChildren: () => import("@empowered/registration").then((m) => m.RegistrationModule),
    },
    {
        path: "aflac",
        component: MemberPortalComponent,
        loadChildren: () => import("@empowered/login").then((m) => m.LoginModule),
    },
];

@NgModule({
    imports: [RouterModule.forChild(MEMBER_PORTAL_ROUTES)],
    exports: [RouterModule],
})
export class MemberPortalRoutingModule {}
