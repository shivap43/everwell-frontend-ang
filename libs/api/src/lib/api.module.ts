import { HttpClient } from "@angular/common/http";
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from "@angular/core";
import { MPGROUP_INTERCEPTOR, API_GENERAL_INTERCEPTOR_PROVIDER } from "./interceptors";
import {
    AccountProfileService,
    AccountService,
    AuthenticationService,
    CommonService,
    Configuration,
    DashboardService,
    DocumentApiService,
    MemberService,
    ShoppingService,
    StaticService,
    NotificationService,
    MessagingService,
} from "./services";

@NgModule({
    imports: [],
    providers: [
        MPGROUP_INTERCEPTOR,
        API_GENERAL_INTERCEPTOR_PROVIDER,
        AuthenticationService,
        AccountService,
        CommonService,
        MemberService,
        StaticService,
        DashboardService,
        AccountProfileService,
        ShoppingService,
        DocumentApiService,
        NotificationService,
        MessagingService,
    ],
})
export class ApiModule {
    constructor(@Optional() @SkipSelf() parentModule: ApiModule, @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error("ApiModule is already loaded. Import in your base AppModule only.");
        }
        if (!http) {
            throw new Error(
                "You need to import the HttpClientModule in your AppModule! \n" +
                    "See also https://github.com/angular/angular/issues/20575"
            );
        }
    }

    static forRoot(configurationFactory: () => Configuration): ModuleWithProviders<ApiModule> {
        return {
            ngModule: ApiModule,
            providers: [{ provide: Configuration, useFactory: configurationFactory }],
        };
    }
}
