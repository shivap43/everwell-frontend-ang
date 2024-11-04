import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MemberWizardRoutingModule } from "./member-wizard-routing.module";
import { WelcomeTabComponent } from "./welcome-tab/welcome-tab.component";
import { MyHouseholdTabComponent } from "./my-household-tab/my-household-tab.component";
import { PreferencesTabComponent } from "./preferences-tab/preferences-tab.component";
import { CoverageTabComponent } from "./coverage-tab/coverage-tab.component";
import { SharedModule } from "@empowered/shared";
import { DependentAddEditComponent } from "./my-household-tab/dependent-add-edit/dependent-add-edit.component";
import { MemberWizardNgxsStoreModule, DualPlanYearNGXSStoreModule } from "@empowered/ngxs-store";
import { QleConfirmationDialogComponent } from "./my-household-tab/qle-confirmation-dialog/qle-confirmation-dialog.component";
import { WizardLandingComponent } from "./wizard-landing/wizard-landing.component";
import { ShoppingCartModule } from "@empowered/enrollment";
import { LanguageModule } from "@empowered/language";
import { DependentListModule } from "@empowered/members";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        CommonModule,
        MemberWizardNgxsStoreModule,
        MemberWizardRoutingModule,
        LanguageModule,
        SharedModule,
        ShoppingCartModule,
        DependentListModule,
        UiModule,
        DualPlanYearNGXSStoreModule,
    ],
    declarations: [
        WelcomeTabComponent,
        MyHouseholdTabComponent,
        PreferencesTabComponent,
        CoverageTabComponent,
        DependentAddEditComponent,
        QleConfirmationDialogComponent,
        WizardLandingComponent,
    ],
})
export class MemberWizardModule {}
