import { Routes } from "@angular/router";
import { AccountEnrollmentsComponent } from "./account-enrollments.component";

export const ACCOUNT_ENROLLMENTS_ROUTES: Routes = [
    {
        path: "",
        component: AccountEnrollmentsComponent,
        children: [],
    },
];
