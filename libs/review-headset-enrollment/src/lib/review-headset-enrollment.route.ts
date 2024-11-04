import { Routes } from "@angular/router";

export const RIVIEW_HEADSET_ENROLLMENT_ROUTES: Routes = [
    { path: "", loadChildren: () => import("./review-flow/review-flow.module").then((m) => m.ReviewFlowModule) },
];
