import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { ConsentPageComponent } from "./consent-page/consent-page.component";
import { LoginComponent } from "./login.component";
import { LOGIN_ROUTES } from "./login.routes";
import { ResourceAcknowledgmentComponent } from "./acknowledgements/members/resource-acknowlegdement/resource-acknowlegdement.component";
import { FfsComponent } from "./ffs/ffs.component";
import { SelectAccountComponent } from "./select-account/select-account.component";
import { Oauth2LoginComponent } from "./oauth2-login/oauth2-login.component";
import { NoAccessComponent } from "./no-access/no-access.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        LoginComponent,
        ConsentPageComponent,
        ResourceAcknowledgmentComponent,
        FfsComponent,
        SelectAccountComponent,
        Oauth2LoginComponent,
        NoAccessComponent,
    ],
    imports: [SharedModule, LanguageModule, RouterModule.forChild(LOGIN_ROUTES), UiModule, AccountListNgxsStoreModule],
    exports: [ConsentPageComponent],
})
export class LoginModule {}
