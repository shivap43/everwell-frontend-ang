import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PermissionGuard } from "@empowered/shared";
import { ProducerPortalComponent } from "./producer-portal.component";
import { ConfigName, UserPermissionList } from "@empowered/constants";
import { AuthenticationGuard, ConfigGuard, TPIHQGuard } from "@empowered/ui";

export const PRODUCER_PORTAL_ROUTES: Routes = [
    { path: "sso", loadChildren: () => import("@empowered/tpi/sso").then((m) => m.SsoModule) },
    {
        path: "login",
        component: ProducerPortalComponent,
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
    { path: "register", loadChildren: () => import("@empowered/registration").then((m) => m.RegistrationModule) },
    // NOTE: All routes below this line must pass AuthenticationGuard
    // temp route for development purpouse
    { path: "", redirectTo: "login", pathMatch: "full" },
    {
        path: "",
        component: ProducerPortalComponent,
        canActivateChild: [AuthenticationGuard],
        children: [
            { path: "overview", loadChildren: () => import("@empowered/overview").then((m) => m.OverviewModule) },
            {
                path: "payroll",
                loadChildren: () => import("@empowered/accounts").then((m) => m.AccountsModule),
                canActivate: [PermissionGuard],
                data: {
                    requiredPermission: "core.account.read.account",
                },
            },
            { path: "support", loadChildren: () => import("@empowered/support").then((m) => m.SupportModule) },
            { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
            {
                path: "memberadd",
                loadChildren: () => import("@empowered/members/member-add").then((m) => m.MemberAddModule),
            },
            { path: "team", loadChildren: () => import("@empowered/team").then((m) => m.TeamModule) },

            {
                path: "change-requests",
                loadChildren: () => import("@empowered/policy-change-request").then((m) => m.PolicyChangeRequestModule),
            },
            {
                path: "pended-business",
                loadChildren: () => import("@empowered/pended-business-resolution").then((m) => m.PendedBusinessResolutionModule),
            },
            {
                path: "settings",
                loadChildren: () => import("@empowered/portals/member/settings").then((m) => m.AccountSettingsModule),
            },
            {
                path: "enrollment-options",
                loadChildren: () => import("@empowered/enrollment-options").then((m) => m.EnrollmentOptionsModule),
                canActivate: [TPIHQGuard],
                data: {
                    requiredTPIPermission: UserPermissionList.AFLAC_HQ_TPP_ACCESS,
                },
            },
            { path: "", redirectTo: "overview", pathMatch: "full" },
            {
                path: "direct",
                loadChildren: () => import("@empowered/direct-enrollment").then((m) => m.DirectEnrollmentModule),
                canActivate: [PermissionGuard],
                data: {
                    requiredPermission: "core.account.read.account.direct",
                },
            },
            {
                path: "quick-quote",
                loadChildren: () => import("@empowered/universal-quote").then((m) => m.UniversalQuoteModule),
                canActivate: [PermissionGuard],
                data: {
                    requiredPermission: "aflac.plan.read",
                },
            },

            {
                path: "rate-sheets",
                loadChildren: () => import("@empowered/rate-sheets").then((m) => m.RateSheetsModule),
                canActivate: [PermissionGuard, ConfigGuard],
                data: {
                    requiredPermission: "aflac.plan.read",
                    requiredConfig: "aflac.ratesheet.enabled",
                },
            },
            {
                path: "aflac-forms",
                loadChildren: () => import("@empowered/aflac-forms-repository").then((m) => m.AflacFormsRepositoryModule),
            },
            {
                path: ":mpGroupId/messageCenter",
                loadChildren: () => import("@empowered/message-center").then((m) => m.MessageCenterModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: ConfigName.MESSAGE_CENTER_TOGGLE,
                },
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(PRODUCER_PORTAL_ROUTES)],
    exports: [RouterModule],
})
export class ProducerPortalRoutingModule {}
