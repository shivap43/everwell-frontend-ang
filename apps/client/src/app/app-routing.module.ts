import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { NgxsRouterPluginModule } from "@ngxs/router-plugin";

import {
    PageNotFoundComponent,
    PrivacyPolicyComponent,
    SiteMapComponent,
    TermsConditionsComponent,
    ConsentStatementComponent,
} from "./pages";
import { NGXS_ROUTE_SERIALIZER } from "./util/route-serializer";
import { FooterNavComponent } from "./pages/footer-nav/footer-nav.component";
import { NonProdGuard } from "@empowered/ui";

export const ROUTES: Routes = [
    { path: "admin", loadChildren: () => import("@empowered/portals/admin").then((m) => m.AdminPortalModule) },
    { path: "member", loadChildren: () => import("@empowered/portals/member").then((m) => m.MemberPortalModule) },
    { path: "producer", loadChildren: () => import("@empowered/portals/producer").then((m) => m.ProducerPortalModule) },
    {
        path: "paylogixconfirmation",
        loadChildren: () => import("@empowered/paylogix-confirmation").then((m) => m.PaylogixConfirmationModule),
    },
    { path: "tpi", loadChildren: () => import("@empowered/tpi").then((m) => m.TpiModule) },
    {
        path: "auth",
        loadChildren: () => import("@empowered/portals/member").then((m) => m.MemberPortalModule),
    },
    {
        path: "registerGroupMembers",
        loadChildren: () => import("@empowered/portals/group-registration").then((m) => m.GroupRegPortalModule),
        canActivate: [NonProdGuard],
        data: { requiredConfig: "general.environment.name" },
    },
    // NOTE: We want to default all users to Member portal if they do not specify otherwise.
    { path: "member/support", loadChildren: () => import("@empowered/support").then((m) => m.SupportModule) },
    { path: "not-found", component: PageNotFoundComponent },
    // { path: "privacy-policy", component: PrivacyPolicyComponent },
    {
        path: "footer",
        component: FooterNavComponent,
        children: [
            { path: "", component: TermsConditionsComponent },
            { path: "terms-conditions", component: TermsConditionsComponent },
            { path: "privacy-policy", component: PrivacyPolicyComponent },
            { path: "site-map", component: SiteMapComponent },
            { path: "consent-statement", component: ConsentStatementComponent },
        ],
    },
    // { path: "site-map", component: SiteMapComponent },
    { path: "not-authorized", loadChildren: () => import("./pages/not-authorized").then((m) => m.NotAuthorizedModule) },
    // DO NOT CHANGE DEFAULT ROUTE TO MEMBER PORTAL
    { path: "", redirectTo: "member", pathMatch: "full" },
    { path: "**", redirectTo: "not-found" },
];

@NgModule({
    imports: [
        RouterModule.forRoot(ROUTES, {
            initialNavigation: "enabledBlocking",
            relativeLinkResolution: "corrected",
        }),
        NgxsRouterPluginModule.forRoot(),
    ],
    providers: [NGXS_ROUTE_SERIALIZER],
    exports: [RouterModule],
})
export class AppRoutingModule {}
