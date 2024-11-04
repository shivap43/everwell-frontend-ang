import { Routes } from "@angular/router";
import { ResetPasswordSuccessComponent } from "./reset-password-success/reset-password-success.component";
import { ResetPasswordComponent } from "./reset-password.component";

export const RESET_PASSWORD_ROUTES: Routes = [
    { path: "resetPassword", component: ResetPasswordComponent },
    { path: "resetPasswordSuccess", component: ResetPasswordSuccessComponent },
    { path: "", pathMatch: "full", redirectTo: "resetPassword" },
];
