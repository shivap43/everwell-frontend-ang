import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule, Optional, SkipSelf } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ApiModule, Configuration, ConfigurationParameters } from "@empowered/api";
import { LanguageModule } from "@empowered/language";
import { UserModule } from "@empowered/user";
import { CsrfModule } from "@empowered/util/csrf";
import { NgxsDispatchPluginModule } from "@ngxs-labs/dispatch-decorator";
import { NgxsFormPluginModule } from "@ngxs/form-plugin";
import { NgxsRouterPluginModule } from "@ngxs/router-plugin";
import { NgxsStoragePluginModule, StorageOption } from "@ngxs/storage-plugin";
import { CookieService } from "ngx-cookie-service";
import { PageNotFoundComponent } from "../pages";
import { InitialLoadLanguageModule } from "./initial-load-language";

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        HttpClientModule,
        ApiModule.forRoot(EMPOWERED_API_CONFIG_FACTORY),
        NgxsDispatchPluginModule.forRoot(),
        NgxsFormPluginModule.forRoot(),
        NgxsRouterPluginModule.forRoot(),
        /**
         * Added all current state slices into the session storage as a band-aid for poor store management.
         * All state slices need to be added manualy, default all keys is not an option
         */
        // Removed productOffering [ benefits-offering ] from session storage as it is overloading
        NgxsStoragePluginModule.forRoot({
            storage: StorageOption.SessionStorage,
            key: [
                "user",
                "language",
                "app",
                "accountEnrollments",
                "AudienceGroupBuilder",
                "commissionsModel",
                "documents",
                "enrollment",
                "MemberWizardState",
                "membersNew",
                "memberdependents",
                "MemberAdd",
                "memberbeneficiarylistmodel",
                "members",
                "beneficiary",
                "memberInfo",
                "changeRequest",
                "removeRiderRequest",
                "changeTransactionRequestData",
                "proposalProductChoices",
                "proposals",
                "qle",
                "RegistrationState",
                "resources",
                "accounts",
                "accountInfo",
                "EnrollmentMethodState",
                "MemberIdState",
                "MemberIdInfo",
                "DirectUserStateInfo",
                "GenericMemberContactInfo",
                "Member",
                "path",
                "core",
                "UniversalQuoteState",
                "MemberHomeState",
                "dualPlanYear",
                "TPIState",
                "messageCenter",
                "GroupState",
            ],
        }),
        CsrfModule,
        InitialLoadLanguageModule,
        LanguageModule,
        UserModule,
    ],
    providers: [CookieService],
    declarations: [PageNotFoundComponent],
    exports: [],
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error("CoreModule is already loaded. Import in your base AppModule only.");
        }
    }
}

export function EMPOWERED_API_CONFIG_FACTORY(): Configuration {
    const params: ConfigurationParameters = {
        // set configuration parameters here.
    };
    return new Configuration(params);
}
