import { TermsConditionsComponent } from "./tpi-main/terms-conditions/terms-conditions.component";
import { FooterNavComponent } from "./tpi-main/footer-nav/footer-nav.component";
import { TpiBenefitSummaryComponent } from "./tpi-main/tpi-benefit-summary/tpi-benefit-summary.component";
import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { TpiMainComponent } from "./tpi-main/tpi-main.component";
import { PartialCensusComponent } from "./tpi-main/partial-census/partial-census.component";
import { CommisionSplitComponent } from "./tpi-main/commision-split/commision-split.component";
import { EnrollmentMethodTpiComponent } from "./tpi-main/enrollment-method-tpi/enrollment-method-tpi.component";
import { ConsentStatementComponent } from "./tpi-main/consent-statement/consent-statement.component";
import { EnrollmentInitiateComponent } from "./tpi-main/enrollment-initiate/enrollment-initiate.component";
import { ConfirmAddressComponent } from "./tpi-main/confirm-address/confirm-address.component";
import { TpiApplicationFlowComponent } from "./tpi-main/tpi-application-flow/tpi-application-flow.component";
import { ExitPlaceholderComponent } from "./tpi-main/exit-placeholder/exit-placeholder.component";
import { TpiNpnSearchComponent } from "./tpi-main/tpi-npn-search/tpi-npn-search.component";
import { ShopOverviewPlaceholderComponent } from "./tpi-main/shop-overview-placeholder/shop-overview-placeholder.component";
import { PrivacyPolicyComponent } from "./tpi-main/privacy-policy/privacy-policy.component";
import { TpiFooterConsentStatementComponent } from "./tpi-main/tpi-footer-consent-statement/tpi-footer-consent-statement.component";
import { AddressMatchingComponent } from "./tpi-main/address-matching/address-matching.component";
import { ConfigGuard, ModalModeGuard } from "@empowered/ui";
import { ConfigName } from "@empowered/constants";

export const TPI_ROUTES: Routes = [
    {
        path: "",
        component: TpiMainComponent,
        children: [
            {
                path: "commission-split",
                component: CommisionSplitComponent,
            },
            {
                path: "enrollment-method",
                component: EnrollmentMethodTpiComponent,
            },
            {
                path: "enrollment-initiate",
                component: EnrollmentInitiateComponent,
            },
            { path: "consent-statement", component: ConsentStatementComponent },
            { path: "partial-census", component: PartialCensusComponent },
            { path: "address-matched/:mpGroupId/:memberId", component: AddressMatchingComponent },
            { path: "confirm-address", component: ConfirmAddressComponent },
            { path: "npn-search", component: TpiNpnSearchComponent },
            { path: "app-flow/:mpGroupId/:memberId", component: TpiApplicationFlowComponent },
            { path: "shop", component: ShopOverviewPlaceholderComponent },
            { path: "coverage-summary", component: TpiBenefitSummaryComponent },
            { path: "pda", loadChildren: () => import("./tpi-pda/tpi-pda.module").then((m) => m.TpiPdaModule) },
            {
                path: "footer",
                component: FooterNavComponent,
                children: [
                    { path: "", component: TermsConditionsComponent },
                    { path: "terms-conditions", component: TermsConditionsComponent },
                    { path: "privacy-policy", component: PrivacyPolicyComponent },
                    { path: "consent-statement", component: TpiFooterConsentStatementComponent },
                ],
            },
            {
                path: "aflac-always",
                loadChildren: () => import("./tpi-aflac-always/tpi-aflac-always.module").then((m) => m.TpiAflacAlwaysModule),
                canActivate: [ConfigGuard, ModalModeGuard],
                data: {
                    requiredConfig: ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_TPI,
                },
            },
        ],
    },
    { path: "sso", loadChildren: () => import("./sso/util-sso.module").then((m) => m.SsoModule) },
    { path: "exit", component: ExitPlaceholderComponent },
];

@NgModule({
    imports: [RouterModule.forChild(TPI_ROUTES)],
    exports: [RouterModule],
})
export class TPIRoutingModule {}
