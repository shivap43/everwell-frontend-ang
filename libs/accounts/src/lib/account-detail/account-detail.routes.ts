import { Routes } from "@angular/router";
import { AccountDetailComponent } from "./account-detail.component";

export const ACCOUNT_DETAIL_ROUTES: Routes = [
    { path: "", component: AccountDetailComponent },
    { path: "employees", loadChildren: () => import("@empowered/members").then((m) => m.MembersModule) },
    {
        path: "reports",
        loadChildren: () => import("@empowered/reports").then((m) => m.ReportsModule),
    },
    { path: "resources", loadChildren: () => import("@empowered/resources").then((m) => m.ResourcesModule) },
];
