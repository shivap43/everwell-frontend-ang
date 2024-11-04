import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WelcomeTabComponent } from "./welcome-tab/welcome-tab.component";
import { MyHouseholdTabComponent } from "./my-household-tab/my-household-tab.component";
import { PreferencesTabComponent } from "./preferences-tab/preferences-tab.component";
import { CoverageTabComponent } from "./coverage-tab/coverage-tab.component";
import { WizardLandingComponent } from "./wizard-landing/wizard-landing.component";
import { CanDeactivateGuard } from "@empowered/ui";
export const MEMBER_WIZARD_ROUTES: Routes = [
    {
        path: "",
        component: WizardLandingComponent,
        children: [
            {
                path: "welcome",
                component: WelcomeTabComponent,
            },
            {
                path: "myhousehold",
                component: MyHouseholdTabComponent,
            },
            {
                path: "preferences",
                component: PreferencesTabComponent,
            },
            {
                path: "coverage",
                component: CoverageTabComponent,
            },
            {
                path: "enrollment",
                loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule),
            },
        ],
        canDeactivate: [CanDeactivateGuard],
    },
    {
        path: "enrollment",
        loadChildren: () => import("@empowered/enrollment").then((m) => m.EnrollmentModule),
    },
];

@NgModule({
    imports: [RouterModule.forChild(MEMBER_WIZARD_ROUTES)],
    exports: [RouterModule],
})
export class MemberWizardRoutingModule {}
