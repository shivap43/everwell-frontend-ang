import { Routes } from "@angular/router";
import { DisplaySubProducerListComponent } from "./display-sub-producer-list/display-sub-producer-list.component";

export const TEAM_ROUTES: Routes = [
    { path: "sub-producers", component: DisplaySubProducerListComponent },
    { path: "", redirectTo: "sub-producers", pathMatch: "full" },
];
