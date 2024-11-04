import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminPortalComponent } from "./admin-portal.component";
import { ConfigName } from "@empowered/constants";
import { AuthenticationGuard, ConfigGuard } from "@empowered/ui";

export const ADMIN_PORTAL_ROUTES: Routes = [
    {
        path: "login",
        component: AdminPortalComponent,
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
    { path: "", redirectTo: "login", pathMatch: "full" },

    // NOTE: All routes below this line must pass AuthenticationGuard
    {
        path: "",
        component: AdminPortalComponent,
        canActivateChild: [AuthenticationGuard],
        children: [
            { path: "accountList", loadChildren: () => import("@empowered/accounts").then((m) => m.AccountsModule) },
            {
                path: "accountList/:mpGroupId/dashboard",
                loadChildren: () => import("@empowered/dashboard").then((m) => m.DashboardModule),
            },
            { path: "dashboard", loadChildren: () => import("@empowered/dashboard").then((m) => m.DashboardModule) },
            // FIXME - There should not be a direct route to member here…
            { path: "member", loadChildren: () => import("@empowered/members").then((m) => m.MembersModule) },
            {
                path: ":mpGroupId/member",
                loadChildren: () => import("@empowered/members").then((m) => m.MembersModule),
            },
            {
                path: ":mpGroupId/messageCenter",
                loadChildren: () => import("@empowered/message-center").then((m) => m.MessageCenterModule),
                canActivate: [ConfigGuard],
                data: {
                    requiredConfig: ConfigName.MESSAGE_CENTER_TOGGLE,
                },
            },
            {
                path: "memberadd",
                loadChildren: () => import("@empowered/members/member-add").then((m) => m.MemberAddModule),
            },
            {
                path: "memberadd/:id",
                loadChildren: () => import("@empowered/members/member-add").then((m) => m.MemberAddModule),
            },
            { path: "enrollment", loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule) },
            {
                path: "benefits",
                loadChildren: () => import("@empowered/dashboard").then((m) => m.DashboardModule),
            },
            { path: "employees", loadChildren: () => import("@empowered/members").then((m) => m.MembersModule) },
            { path: "", redirectTo: "dashboard", pathMatch: "full" },
            {
                path: "settings",
                loadChildren: () => import("@empowered/portals/member/settings").then((m) => m.AccountSettingsModule),
            },
            {
                path: "profile",
                children: [
                    {
                        path: "structure",
                        loadChildren: () => import("@empowered/company-structure").then((m) => m.CompanyStructureModule),
                    },
                    // FIXME - should redirect to "rules" once that feature is in place.
                    { path: "", redirectTo: "structure", pathMatch: "full" },
                ],
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(ADMIN_PORTAL_ROUTES)],
    exports: [RouterModule],
})
export class AdminPortalRoutingModule {}
