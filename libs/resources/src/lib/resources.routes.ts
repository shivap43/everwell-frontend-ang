import { Routes } from "@angular/router";
import { ResourcesComponent } from "./resources/resources.component";
import { PermissionGuard } from "@empowered/shared";
import { UserPermissionList } from "@empowered/constants";
import { ConfigGuard, HQGuard } from "@empowered/ui";

export const RESOURCES_ROUTES: Routes = [
    {
        path: "",
        component: ResourcesComponent,
        canActivate: [ConfigGuard, PermissionGuard, HQGuard],
        data: {
            requiredConfig: "portal.resources_config.enabled",
            requiredPermission: UserPermissionList.READ_RESOURCE,
            requiredHQPermission: UserPermissionList.READ_RESOURCE_ALWAYS,
        },
    },
];
