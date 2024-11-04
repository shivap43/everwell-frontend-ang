import { SelfEnrollmentPopupComponent, SelfEnrollmentPersonalInfoComponent, SelfEnrollmentSitCodeComponent } from "@empowered/accounts";
import { NgModule } from "@angular/core";
import { SharedModule } from "@empowered/shared";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core";
import { LayoutModule } from "./layout";
import { LanguageModule } from "@empowered/language";

import { PrivacyPolicyComponent, TermsConditionsComponent, SiteMapComponent, FooterNavComponent } from "./pages";
import { RouteInterceptorService } from "@empowered/common-services";
import { RxStompService } from "@stomp/ng2-stompjs";

import { NgIdleKeepaliveModule } from "@ng-idle/keepalive";
import { TitleCasePipe } from "@angular/common";
import { ConsentStatementComponent } from "./pages/consent-statement/consent-statement.component";

// NGRX
import * as fromShared from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import * as fromAuth from "@empowered/ngrx-store/ngrx-states/auth/auth.reducer";
import * as fromAccounts from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import * as fromProducts from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import * as fromMembers from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import * as fromEnrollments from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import * as fromProducers from "@empowered/ngrx-store/ngrx-states/producers/producers.reducer";
import * as fromPlanOfferings from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import * as fromProductOfferings from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import * as fromShoppingCarts from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import * as fromRateSheets from "@empowered/ngrx-store/ngrx-states/rate-sheets/rate-sheets.reducer";
import * as fromAflacAlways from "@empowered/ngrx-store/ngrx-states/aflac-always/aflac-always.reducer";

import { State } from "@empowered/ngrx-store/ngrx-states/app.state";

import { EffectsModule } from "@ngrx/effects";
import { StoreRouterConnectingModule, routerReducer } from "@ngrx/router-store";
import { StoreModule, ActionReducerMap, ActionReducer, MetaReducer } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { localStorageSync } from "ngrx-store-localstorage";

// NGXS
import { AppNgxsStoreModule } from "@empowered/ngxs-store";
import { PathNgxsStoreModule, PathState } from "@empowered/ngxs-store";
import { NgxsModule, NGXS_PLUGINS } from "@ngxs/store";
import { NgxsReduxDevtoolsPluginModule } from "@ngxs/devtools-plugin";
import { logoutPlugin } from "./+state/logout-plugin";

import { AppStoreModule } from "@empowered/ngrx-store/ngrx-states/app.store.module";

import { environment } from "../environments/environment";
import { AuthActions } from "@empowered/ngrx-store/ngrx-states/auth";
import { UiModule } from "@empowered/ui";

const reducers: ActionReducerMap<State> = {
    [fromShared.SHARED_FEATURE_KEY]: fromShared.reducer,
    [fromAuth.AUTH_FEATURE_KEY]: fromAuth.reducer,
    [fromAccounts.ACCOUNTS_FEATURE_KEY]: fromAccounts.reducer,
    [fromProducts.PRODUCTS_FEATURE_KEY]: fromProducts.reducer,
    [fromMembers.MEMBERS_FEATURE_KEY]: fromMembers.reducer,
    [fromEnrollments.ENROLLMENTS_FEATURE_KEY]: fromEnrollments.reducer,
    [fromProducers.PRODUCERS_FEATURE_KEY]: fromProducers.reducer,
    [fromPlanOfferings.PLAN_OFFERINGS_FEATURE_KEY]: fromPlanOfferings.reducer,
    [fromProductOfferings.PRODUCT_OFFERINGS_FEATURE_KEY]: fromProductOfferings.reducer,
    [fromShoppingCarts.SHOPPING_CARTS_FEATURE_KEY]: fromShoppingCarts.reducer,
    [fromRateSheets.RATE_SHEETS_FEATURE_KEY]: fromRateSheets.reducer,
    [fromAflacAlways.AFLAC_ALWAYS_FEATURE_KEY]: fromAflacAlways.reducer,
};

export function clearState(reducer: ActionReducer<State>): ActionReducer<State> {
    return function (state: State, action: AuthActions.ActionsUnion): State {
        if (action.type === AuthActions.logout.type) {
            return reducer(undefined, action);
        }

        return reducer(state, action);
    };
}

export function localStorageSyncReducer(reducer: ActionReducer<State>): ActionReducer<State> {
    // Add NGRX Store FEATURE_KEY to keys to enable rehydration for that store
    return localStorageSync({
        // Any Shared data is expected to be safe to cache
        // Auth data is loaded on login and has to be retrieved till log out
        keys: [fromShared.SHARED_FEATURE_KEY, fromAuth.AUTH_FEATURE_KEY],
        rehydrate: true,
        // TODO: We need to switch to using sessionStorage to match expected behavior
        // for how local storage works on existing application.
        // Expectation is that openning a new tab shouldn't keep the user signed in, etc
        // Before setting storage to sessionStorage, the keys should be renamed to be prefixed if it is from NGRX
        // This is important since the keys may conflict with existing NGXS keys since they'll both be stored in SessionStorage
        //
        // storage: sessionStorage,
    })(reducer);
}

const metaReducers: Array<MetaReducer<any, any>> = [localStorageSyncReducer, clearState];

@NgModule({
    declarations: [
        AppComponent,
        PrivacyPolicyComponent,
        TermsConditionsComponent,
        SiteMapComponent,
        FooterNavComponent,
        ConsentStatementComponent,
        SelfEnrollmentSitCodeComponent,
        SelfEnrollmentPersonalInfoComponent,
        SelfEnrollmentPopupComponent,
    ],
    imports: [
        CoreModule,
        AppRoutingModule,
        LayoutModule,
        UiModule,
        SharedModule,
        LanguageModule,
        NgIdleKeepaliveModule.forRoot(),
        // NGXS

        NgxsModule.forRoot([], { developmentMode: !environment.production }),
        PathNgxsStoreModule,
        AppNgxsStoreModule,
        // NgxsReduxDevtoolsPluginModule should be imported after all NGXS related modules have been imported
        // source: https://www.ngxs.io/plugins/devtools#notes
        NgxsReduxDevtoolsPluginModule.forRoot({ name: "S - NGXS store", disabled: environment.production }),

        // NGRX
        StoreModule.forRoot(
            {
                ...reducers,
                router: routerReducer,
            },
            {
                metaReducers,
                runtimeChecks: {
                    strictStateImmutability: true,
                    strictActionImmutability: true,
                    // We are disabling this flag temporarily
                    // This check verifies if the state is serializable.
                    // TODO: Create a new JIRA ticket to investigate how to resolve this issue and turn this flag back on
                    // https://ngrx.io/guide/store/configuration/runtime-checks#strictstateserializability
                    strictStateSerializability: false,
                    strictActionSerializability: true,
                    strictActionWithinNgZone: true,
                },
            },
        ),
        EffectsModule.forRoot([]),
        // Connects RouterModule with StoreModule, uses MinimalRouterStateSerializer by default
        // source: https://ngrx.io/guide/router-store
        StoreRouterConnectingModule.forRoot(),
        StoreDevtoolsModule.instrument({ name: "X - NGRX store", maxAge: 25, logOnly: environment.production }),

        AppStoreModule,
    ],
    providers: [
        RouteInterceptorService,
        RxStompService,
        TitleCasePipe,
        // NGXS
        {
            provide: NGXS_PLUGINS,
            useValue: logoutPlugin,
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
    exports: [SelfEnrollmentPopupComponent],
})
export class AppModule {}
