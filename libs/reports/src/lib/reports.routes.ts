import { Routes } from "@angular/router";
import { ReportsComponent } from "./reports.component";
import { PermissionGuard } from "@empowered/shared";
import { ConfigGuard } from "@empowered/ui";

export const REPORTS_ROUTES: Routes = [
    {
        path: "",
        component: ReportsComponent,
        canActivate: [ConfigGuard, PermissionGuard],
        data: { requiredConfig: "portal.account.reports.enabled", requiredPermission: "core.document.read" },
    },
];
