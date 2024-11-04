import { ProposalListComponent } from "./proposal-list/proposal-list.component";
import { Routes } from "@angular/router";
import { PermissionGuard } from "@empowered/shared";
import { Permission, ConfigName } from "@empowered/constants";
import { ConfigGuard } from "@empowered/ui";

export const PROPOSALS_ROUTE: Routes = [
    {
        path: "",
        component: ProposalListComponent,
        canActivate: [ConfigGuard, PermissionGuard],
        data: {
            requiredConfig: ConfigName.PROPOSALS,
            requiredPermission: Permission.PROPOSAL_READ,
        },
    },
];
