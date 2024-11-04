import { Routes } from "@angular/router";
import { AccountMessagesComponent } from "./account-messages/account-messages.component";
import { SetPasswordComponent } from "./set-password/set-password.component";
import { VerifyAuthenticationComponent } from "./verify-authentication/verify-authentication.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyMethodComponent } from "./verify-method/verify-method.component";

export const ACCOUNT_LOOKUP_ROUTES: Routes = [
    { path: "1", component: VerifyIdentityComponent },
    { path: "2/:id", component: VerifyMethodComponent },
    { path: "3/:id", component: VerifyAuthenticationComponent },
    { path: "4", component: SetPasswordComponent },
    { path: "5/:id", component: AccountMessagesComponent },
    { path: "", pathMatch: "full", redirectTo: "1" },
];
