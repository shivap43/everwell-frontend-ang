import { PendingApplicationsComponent } from "./pending-applications/pending-applications.component";
import { Routes } from "@angular/router";
import { AccountPendingEnrollmentsComponent } from "./account-pending-enrollments/account-pending-enrollments.component";

export const PENDING_ENROLLMENTS_ROUTES: Routes = [
    { path: "", component: AccountPendingEnrollmentsComponent },
    { path: "manage", component: PendingApplicationsComponent },
];
