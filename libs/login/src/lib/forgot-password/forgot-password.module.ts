import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { ChangePasswordSuccessComponent } from "./change-password-success/change-password-success.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";
import { ForgotPasswordComponent } from "./forgot-password.component";
import { FORGOT_PASSWORD_ROUTES } from "./forgot-password.routes";
import { VerifyCodeComponent } from "./verify-code/verify-code.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyUsernameComponent } from "./verify-username/verify-username.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [
        ForgotPasswordComponent,
        VerifyUsernameComponent,
        VerifyIdentityComponent,
        VerifyCodeComponent,
        ChangePasswordComponent,
        ChangePasswordSuccessComponent,
    ],
    imports: [
        LanguageModule,
        CommonModule,
        SharedModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(FORGOT_PASSWORD_ROUTES),
        UiModule,
    ],
})
export class ForgotPasswordModule {}
