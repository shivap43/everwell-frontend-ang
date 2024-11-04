import { Routes } from "@angular/router";
import { DependentAddComponent } from "./dependent-add.component";
import { CanDeactivateGuard } from "@empowered/ui";

export const DEPENDENT_ADD_ROUTES: Routes = [
    {
        path: "",
        component: DependentAddComponent,
        canDeactivate: [CanDeactivateGuard],
    },
];
