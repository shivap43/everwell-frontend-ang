import { Routes } from "@angular/router";
import { CommissionComponent } from "./commissions.component";

export const COMMISSIONS_ROUTES: Routes = [
    {
        path: "",
        component: CommissionComponent,
        children: [],
    },
];
