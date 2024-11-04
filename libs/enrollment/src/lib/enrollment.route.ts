import { Routes } from "@angular/router";
import { PermissionGuard } from "@empowered/shared";

export const ENROLLMENT_ROUTES: Routes = [
    {
        path: "quote-shop/:mpGroupId",
        loadChildren: () => import("./producer-shop/producer-shop.module").then((m) => m.ProducerShopModule),
    },
    {
        path: "shop",
        loadChildren: () => import("./shop-experience/shop-experience.module").then((m) => m.ShopExperienceModule),
        canActivate: [PermissionGuard],
        data: { requiredPermission: "core.enrollment.member.shop" },
    },
    {
        path: "app-flow/:mpGroupId/:memberId",
        loadChildren: () => import("./application-flow/application-flow.module").then((m) => m.ApplicationFlowModule),
    },
    {
        path: "benefit-summary",
        loadChildren: () => import("./benefit-summary/benefit-summary.module").then((m) => m.BenefitSummaryModule),
    },
    {
        path: "direct/app-flow/:mpGroupId/:memberId",
        loadChildren: () => import("./application-flow/application-flow.module").then((m) => m.ApplicationFlowModule),
    },
    {
        path: "direct/app-flow/:mpGroupId/:memberId",
        loadChildren: () => import("./application-flow/application-flow.module").then((m) => m.ApplicationFlowModule),
    },
    {
        path: "/view-enrollments/manage",
        loadChildren: () => import("@empowered/qle").then((m) => m.QleModule),
    },
];
