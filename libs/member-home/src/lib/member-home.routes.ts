import { MemberHomeComponent } from "./member-home.component";
import { Routes } from "@angular/router";

export const MEMBER_HOME_ROUTES: Routes = [
    { path: "", component: MemberHomeComponent },
    { path: ":id/employees", loadChildren: () => import("@empowered/members").then((m) => m.MembersModule) },
    { path: "support", loadChildren: () => import("@empowered/support").then((m) => m.SupportModule) },
];
