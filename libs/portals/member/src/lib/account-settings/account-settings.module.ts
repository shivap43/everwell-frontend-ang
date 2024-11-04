import { ACCOUNT_SETTING_ROUTES } from "./account-settings.routes";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AccountSettingsComponent } from "./account-settings.component";
import { RouterModule } from "@angular/router";
import { NotificationPreferencesComponent } from "./notification-preferences/notification-preferences.component";
import { ProfileComponent } from "./profile/profile.component";
import { ProducerInfoComponent } from "./producer-info/producer-info.component";
import { LanguageModule } from "@empowered/language";
import { SharedModule } from "@empowered/shared";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { NgxMaskModule } from "ngx-mask";
import { ChangePasswordComponent } from "./change-password/change-password.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [
        AccountSettingsComponent,
        NotificationPreferencesComponent,
        ChangePasswordComponent,
        ProfileComponent,
        ProducerInfoComponent,
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(ACCOUNT_SETTING_ROUTES),
        LanguageModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        MatRadioModule,
        NgxMaskModule.forRoot(),
        UiModule,
    ],
})
export class AccountSettingsModule {}
