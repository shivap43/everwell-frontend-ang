import { Routes } from "@angular/router";
import { UsernameSentComponent } from "./username-sent/username-sent.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyMethodComponent } from "./verify-method/verify-method.component";

export const FORGOT_USERNAME_ROUTES: Routes = [
    { path: "verifyIdentity", component: VerifyIdentityComponent },
    { path: "verifyMethod/:id", component: VerifyMethodComponent },
    { path: "usernameSent/:id", component: UsernameSentComponent },
    { path: "", pathMatch: "full", redirectTo: "verifyIdentity" },
];
