import { Routes } from "@angular/router";
import { ConsentPageComponent } from "./consent-page/consent-page.component";
import { ContactInfoComponent } from "./contact-info/contact-info.component";
import { DependentsFormComponent } from "./dependents-form/dependents-form.component";
import { ManageDependentsComponent } from "./manage-dependents/manage-dependents.component";
import { PersonalInfoComponent } from "./personal-info/personal-info.component";

export const REGISTRATION_ROUTES: Routes = [
    {
        path: "",
        loadChildren: () => import("./account-lookup/account-lookup.module").then((m) => m.AccountLookupModule),
    },
    { path: "consent", component: ConsentPageComponent },
    { path: "personal-info", component: PersonalInfoComponent },
    { path: "contact-info", component: ContactInfoComponent },
    { path: "dependents/:id", component: DependentsFormComponent },
    { path: "manage", component: ManageDependentsComponent },
];
