import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SsoComponent } from "./sso.component";
import { RouterModule } from "@angular/router";
import { SSO_ROUTES } from "./util-sso.module.routes";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "@empowered/shared";
import { SsoLoginComponent } from "./sso-login/sso-login.component";
import { LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";
import { TpiModule } from "../tpi.module";

@NgModule({
    imports: [
        LanguageModule,
        SharedModule,
        CommonModule,
        RouterModule.forChild(SSO_ROUTES),
        FormsModule,
        ReactiveFormsModule,
        UiModule,
        TpiModule,
    ],
    declarations: [SsoComponent, SsoLoginComponent],
})
export class SsoModule {}
