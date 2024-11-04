import { Routes } from "@angular/router";
import { AccountInfoComponent } from "./account-info/account-info.component";
import { AccountContactsComponent } from "./account-contacts/account-contacts.component";
import { CarriersComponent } from "./carriers/carriers.component";
import { RulesComponent } from "./rules/rules.component";
import { PermissionGuard } from "@empowered/shared";

export const PROFILE_ROUTES: Routes = [
    { path: "account-info", component: AccountInfoComponent },
    { path: "contacts", component: AccountContactsComponent },
    { path: "carriers", component: CarriersComponent },
    { path: "rules", component: RulesComponent },
    {
        path: "branding",
        loadChildren: () => import("@empowered/branding").then((m) => m.AccountBrandingModule),
        canActivate: [PermissionGuard],
        data: {
            brandingDomainType: "ACCOUNT",
            requiredPermission: "core.account.create.branding",
        },
    },
    { path: "", redirectTo: "dashboard", pathMatch: "full" },
];
