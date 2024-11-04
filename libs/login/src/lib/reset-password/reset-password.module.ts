import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { ResetPasswordSuccessComponent } from "./reset-password-success/reset-password-success.component";
import { ResetPasswordComponent } from "./reset-password.component";
import { RESET_PASSWORD_ROUTES } from "./reset-password.routes";
import { UiModule } from "@empowered/ui";
@NgModule({
    declarations: [ResetPasswordComponent, ResetPasswordSuccessComponent],
    imports: [
        LanguageModule,
        CommonModule,
        SharedModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(RESET_PASSWORD_ROUTES),
        UiModule,
    ],
})
export class ResetPasswordModule {}
