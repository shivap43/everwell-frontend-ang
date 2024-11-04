import { Routes } from "@angular/router";
import { LifeEventsComponent } from "./life-events/life-events.component";

export const QLE_ROUTES: Routes = [
    { path: "life-events", component: LifeEventsComponent },
    { path: "", redirectTo: "life-events", pathMatch: "full" },
    {
        path: "view-enrollments",
        loadChildren: () =>
            import("./pending-enrollment-applications/pending-enrollment-applications.module").then(
                (m) => m.PendingEnrollmentApplicationsModule
            ),
    },
];
