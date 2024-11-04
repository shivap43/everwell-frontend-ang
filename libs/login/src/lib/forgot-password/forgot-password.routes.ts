import { Routes } from "@angular/router";
import { ChangePasswordSuccessComponent } from "./change-password-success/change-password-success.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";
import { VerifyCodeComponent } from "./verify-code/verify-code.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyUsernameComponent } from "./verify-username/verify-username.component";

export const FORGOT_PASSWORD_ROUTES: Routes = [
    { path: "verifyUsername", component: VerifyUsernameComponent },
    { path: "verifyIdentity", component: VerifyIdentityComponent },
    { path: "verifyCode", component: VerifyCodeComponent },
    { path: "changePassword", component: ChangePasswordComponent },
    { path: "changePasswordSuccess", component: ChangePasswordSuccessComponent },
    { path: "", pathMatch: "full", redirectTo: "verifyUsername" },
];
