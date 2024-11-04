import { Routes } from "@angular/router";
import { ConsentPageComponent } from "./consent-page/consent-page.component";
import { LoginComponent } from "./login.component";
import { FfsComponent } from "./ffs/ffs.component";
import { SelectAccountComponent } from "./select-account/select-account.component";
import { Oauth2LoginComponent } from "./oauth2-login/oauth2-login.component";
import { NoAccessComponent } from "./no-access/no-access.component";

export const LOGIN_ROUTES: Routes = [
    { path: "", component: LoginComponent },
    { path: "consent", component: ConsentPageComponent },
    { path: "ffs", component: FfsComponent },
    { path: "select-account", component: SelectAccountComponent },
    { path: "no-access", component: NoAccessComponent },
    { path: "resume", component: Oauth2LoginComponent },
];
