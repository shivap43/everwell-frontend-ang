import { Routes } from "@angular/router";

export const REVIEW_ENROLLMENTS_ROUTES: Routes = [
    {
        path: "",
        loadChildren: () => import("./review-enrollment-flow/review-enrollment-flow.module").then((m) => m.ReviewEnrollmentFlowModule),
    },
];
