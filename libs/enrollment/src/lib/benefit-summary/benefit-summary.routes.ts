import { Routes } from "@angular/router";
import { CanDeactivateGuard } from "@empowered/ui";
import { CoverageSummaryComponent } from "./coverage-summary/coverage-summary.component";

export const BENEFIT_SUMMARY_ROUTES: Routes = [
    {
        path: "coverage-summary",
        component: CoverageSummaryComponent,
        canDeactivate: [CanDeactivateGuard],
    },
    { path: "", redirectTo: "coverage-summary", pathMatch: "full" },
];
