import { Routes } from "@angular/router";
import { SsoComponent } from "./sso.component";

export const SSO_ROUTES: Routes = [
    { path: "", component: SsoComponent },
    { path: "login", component: SsoComponent },
    { path: "register", loadChildren: () => import("@empowered/registration").then((m) => m.RegistrationModule) },
];
