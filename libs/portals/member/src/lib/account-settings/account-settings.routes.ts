import { AccountSettingsComponent } from "./account-settings.component";
import { Routes } from "@angular/router";
import { NotificationPreferencesComponent } from "./notification-preferences/notification-preferences.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";
import { ProfileComponent } from "./profile/profile.component";
import { ProducerInfoComponent } from "./producer-info/producer-info.component";
import { PermissionGuard } from "@empowered/shared";
import { UserPermissionList } from "@empowered/constants";
import { ConfigGuard } from "@empowered/ui";

export const ACCOUNT_SETTING_ROUTES: Routes = [
    {
        path: "",
        component: AccountSettingsComponent,
        children: [
            {
                path: "notificationPreferences",
                component: NotificationPreferencesComponent,
                canActivate: [ConfigGuard],
                data: { requiredConfig: "portal.member_communication_preference.enabled" },
            },
            { path: "change-password", component: ChangePasswordComponent },
            { path: "profile", component: ProfileComponent },
            { path: "producerInfo", component: ProducerInfoComponent },
            {
                path: "branding",
                loadChildren: () => import("@empowered/branding").then((m) => m.AccountBrandingModule),
                canActivate: [PermissionGuard],
                data: {
                    brandingDomainType: "BROKERAGE",
                    requiredPermission: UserPermissionList.CREATE_BRANDING,
                },
            },
        ],
    },
];
