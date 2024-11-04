import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { AccountLookupComponent } from "./account-lookup.component";
import { ACCOUNT_LOOKUP_ROUTES } from "./account-lookup.routes";
import { AccountMessagesComponent } from "./account-messages/account-messages.component";
import { SetPasswordComponent } from "./set-password/set-password.component";
import { VerifyAuthenticationComponent } from "./verify-authentication/verify-authentication.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyMethodComponent } from "./verify-method/verify-method.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [
        AccountLookupComponent,
        VerifyIdentityComponent,
        VerifyMethodComponent,
        VerifyAuthenticationComponent,
        SetPasswordComponent,
        AccountMessagesComponent,
    ],
    imports: [CommonModule, SharedModule, RouterModule.forChild(ACCOUNT_LOOKUP_ROUTES), LanguageModule, UiModule],
})
export class AccountLookupModule {}
