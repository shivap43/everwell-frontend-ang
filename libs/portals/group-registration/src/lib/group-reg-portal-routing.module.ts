import { GroupRegPortalComponent } from "./group-reg-portal.component";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

export const GROUP_REG_PORTAL_ROUTES: Routes = [
    {
        path: "register",
        component: GroupRegPortalComponent,
    },
    { path: "", redirectTo: "register", pathMatch: "full" },
];

@NgModule({
    imports: [RouterModule.forChild(GROUP_REG_PORTAL_ROUTES)],
    exports: [RouterModule],
})
export class GroupRegPortalRoutingModule {}
