import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { SharedModule, UiComponentsModule } from "@empowered/shared";

import { EnrollmentSettingsComponent } from "./enrollment-settings.component";
import { EnrollmentLocationComponent } from "./enrollment-location/enrollment-location.component";
import { EnrollmentMethodSettingsComponent } from "./enrollment-method/enrollment-method.component";
import { OccupationClassComponent } from "./occupation-class/occupation-class.component";
import { MoreSettingsComponent } from "./more-settings/more-settings.component";
import { CoverageDatesComponent } from "./coverage-dates/coverage-dates.component";
import { EmployerContributionsComponent } from "./employer-contributions/employer-contributions.component";
import { UiModule, MaterialModule } from "@empowered/ui";
import { ApplicantDetailsComponent } from "./applicant-details/applicant-details.component";
import { SpouseDetailsComponent } from "./spouse-details/spouse-details.component";

@NgModule({
    declarations: [
        EnrollmentSettingsComponent,
        EnrollmentLocationComponent,
        EnrollmentMethodSettingsComponent,
        OccupationClassComponent,
        MoreSettingsComponent,
        CoverageDatesComponent,
        EmployerContributionsComponent,
        ApplicantDetailsComponent,
        SpouseDetailsComponent,
    ],
    exports: [EnrollmentSettingsComponent],
    imports: [CommonModule, ReactiveFormsModule, LanguageModule, UiComponentsModule, MaterialModule, SharedModule, UiModule],
})
export class EnrollmentSettingsModule {}
