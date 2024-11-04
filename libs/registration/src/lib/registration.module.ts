import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { ConsentPageComponent } from "./consent-page/consent-page.component";
import { ContactInfoComponent } from "./contact-info/contact-info.component";
import { DependentsFormComponent } from "./dependents-form/dependents-form.component";
import { ManageDependentsComponent } from "./manage-dependents/manage-dependents.component";
import { PersonalInfoComponent } from "./personal-info/personal-info.component";
import { RegistrationComponent } from "./registration.component";
import { REGISTRATION_ROUTES } from "./registration.routes";
import { DatePipe } from "@angular/common";
import { NgxMaskModule } from "ngx-mask";
import { RegistrationNGXSStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        SharedModule,
        ReactiveFormsModule,
        RouterModule.forChild(REGISTRATION_ROUTES),
        RegistrationNGXSStoreModule,
        LanguageModule,
        FormsModule,
        NgxMaskModule.forRoot(),
        UiModule,
    ],
    declarations: [
        RegistrationComponent,
        PersonalInfoComponent,
        ContactInfoComponent,
        ConsentPageComponent,
        DependentsFormComponent,
        ManageDependentsComponent,
    ],
    exports: [PersonalInfoComponent],
    providers: [DatePipe],
})
export class RegistrationModule {}
