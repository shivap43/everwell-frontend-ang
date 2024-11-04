import { Routes } from "@angular/router";
import { Permission } from "@empowered/constants";
import { PermissionGuard } from "@empowered/shared";
import { TPIHQGuard } from "@empowered/ui";

export const BENEFIT_ROUTES: Routes = [
    {
        path: "offering",
        loadChildren: () => import("./benefits-offering/benefits-offering.module").then((m) => m.BenefitsOfferingModule),
        canActivate: [TPIHQGuard, PermissionGuard],
        data: {
            requiredTPIPermission: Permission.HQ_PRODUCER_BENEFITS_OFFERING_ENABLED,
            requiredPermission: Permission.BO_PRODUCT_CREATE,
        },
    },
    {
        path: "maintenance-offering",
        loadChildren: () =>
            import("./maintenance-benefits-offering/maintenance-benefits-offering.module").then((m) => m.MaintenanceBenefitsOfferingModule),
        canActivate: [TPIHQGuard],
        data: {
            requiredTPIPermission: Permission.HQ_PRODUCER_BENEFITS_OFFERING_ENABLED,
        },
    },
    {
        path: "aflac-group-offering",
        loadChildren: () => import("./aflac-group-offering/aflac-group-offering.module").then((m) => m.AflacGroupOfferingModule),
    },
];
