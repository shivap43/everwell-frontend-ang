import { Routes } from "@angular/router";
import { BenefitsOfferingComponent } from "./benefits-offering.component";
import { CoverageDatesComponent } from "./coverage-dates/coverage-dates.component";
import { PlansComponent } from "./plans/plans.component";
import { ProductsComponent } from "./products/products.component";
import { SettingsComponent } from "./settings/settings.component";
import { PricingEligibilityComponent } from "./pricing-eligibility/pricing-eligibility.component";
import { PlanListComponent } from "./pricing-eligibility/plan-list/plan-list.component";
import { VerifyAndSubmitComponent } from "./verify-and-submit/verify-and-submit.component";
import { CanDeactivateGuard } from "@empowered/ui";

export const BENEFITS_OFFERING_ROUTES: Routes = [
    {
        path: "",
        component: BenefitsOfferingComponent,
        children: [
            // FIXME - Routes should be human readable
            { path: "1", component: SettingsComponent },
            { path: "2", component: ProductsComponent },
            { path: "3", component: PlansComponent },
            { path: "3/:productid", component: PlansComponent },
            { path: "4", component: CoverageDatesComponent },
            { path: "5", component: PlanListComponent },
            { path: "5/:planId", component: PricingEligibilityComponent, canDeactivate: [CanDeactivateGuard] },
            {
                path: "6",
                loadChildren: () => import("./carrier-forms/carrier-forms.module").then((m) => m.CarrierFormsModule),
            },
            { path: "7", component: VerifyAndSubmitComponent, canDeactivate: [CanDeactivateGuard] },
        ],
    },
    { path: "ag-review", component: VerifyAndSubmitComponent, canDeactivate: [CanDeactivateGuard] },
];
