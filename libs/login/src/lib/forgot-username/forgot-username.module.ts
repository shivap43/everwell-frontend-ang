import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { MaterialModule, UiModule } from "@empowered/ui";

import { ForgotUsernameComponent } from "./forgot-username.component";
import { FORGOT_USERNAME_ROUTES } from "./forgot-username.routes";
import { UsernameSentComponent } from "./username-sent/username-sent.component";
import { VerifyIdentityComponent } from "./verify-identity/verify-identity.component";
import { VerifyMethodComponent } from "./verify-method/verify-method.component";

@NgModule({
    declarations: [ForgotUsernameComponent, VerifyIdentityComponent, VerifyMethodComponent, UsernameSentComponent],
    imports: [RouterModule.forChild(FORGOT_USERNAME_ROUTES), SharedModule, FormsModule, LanguageModule, MaterialModule, UiModule],
})
export class ForgotUsernameModule {}
