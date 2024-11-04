import { Routes } from "@angular/router";
import { EditBrandingComponent } from "./edit-branding/edit-branding.component";
import { CanDeactivateGuard, ConfigGuard } from "@empowered/ui";

export const ACCOUNT_BRANDING_ROUTES: Routes = [
    {
        path: "",
        component: EditBrandingComponent,
        canDeactivate: [CanDeactivateGuard],
        canActivate: [ConfigGuard],
        data: {
            requiredConfig: "general.branding.enabled",
        },
    },
];
