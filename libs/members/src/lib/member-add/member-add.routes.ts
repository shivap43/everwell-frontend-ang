import { Routes } from "@angular/router";
import { MemberAddComponent } from "./member-add.component";
import { CanDeactivateGuard } from "@empowered/ui";

export const MEMBER_ADD_ROUTES: Routes = [
    {
        path: "",
        component: MemberAddComponent,
        canDeactivate: [CanDeactivateGuard],
    },
];
