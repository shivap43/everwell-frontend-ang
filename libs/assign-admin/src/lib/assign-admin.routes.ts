import { Routes } from "@angular/router";

export const ASSIGN_ADMIN_ROUTES: Routes = [
    {
        path: "display-admin-list",
        loadChildren: () => import("./administrators.module").then((m) => m.AdministratorsModule),
    },
    { path: "", redirectTo: "dashboard", pathMatch: "full" },
];
