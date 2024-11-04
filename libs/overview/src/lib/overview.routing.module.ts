import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OverviewComponent } from "./overview.component";
import { ConfigGuard } from "@empowered/ui";

export const PRODUCER_PORTAL_ROUTES: Routes = [
    {
        path: "",
        component: OverviewComponent,
        canActivate: [ConfigGuard],
        data: {
            requiredConfig: "portal.producer.overview_tab.enabled",
            requiredConfigRedirect: "portal.producer.overview_tab.disabled.redirect_url",
            requiredConfigRelative: false,
        },
    },
];

@NgModule({
    imports: [RouterModule.forChild(PRODUCER_PORTAL_ROUTES)],
    exports: [RouterModule],
})
export class OverviewRoutingModule {}
