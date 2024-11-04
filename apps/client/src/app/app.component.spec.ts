import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { provideMockStore } from "@ngrx/store/testing";
import { of, Subject } from "rxjs";
import { AppComponent } from "./app.component";
import { DatePipe } from "@angular/common";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { CookieService } from "ngx-cookie-service";
import { Idle } from "@ng-idle/core";
import { Keepalive } from "@ng-idle/keepalive";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { AuthenticationService, EnrollmentService, StaticService } from "@empowered/api";
import { Platform } from "@angular/cdk/platform";
import { TpiServices, SharedService } from "@empowered/common-services";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { LoadExternalJsService, RouteInterceptorService } from "@empowered/common-services";

/**
 * @deprecated REMOVE WHEN WE MIGRATE TO ANGULAR 13
 * */
import { ɵivyEnabled as ivyEnabled } from "@angular/core";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { BreakPointUtilService, StaticUtilService, UtilService } from "@empowered/ngxs-store";

const mockPayrollFrequencyCalculatorPipe = {
    transform: () => 1,
};

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
};

const mockSharedService = {
    userPortal$: of({ type: "some type" }),
    currentTpi$: of(true),
};

const mockRouterInterceptor = {
    routerStateParams$: of({}),
    trackCurrentRoute: () => {},
    googleAnalyticsNavigationEnd$: of({}),
    pageLog$: of({}),
};

const mockIdle = {
    setIdle: () => 1,
    setTimeout: () => 1,
    setInterrupts: () => [],
    onTimeout: new Subject<number>(),
    onIdleEnd: new Subject<number>(),
    watch: () => {},
    stop: () => {},
};

const mockKeepalive = {
    interval: () => 1,
};

const mockStaticService = {
    getConfigurations: of([]),
};

const mockUserService = {
    isAuthenticated$: of(false),
    credential$: of({}),
};

const mockCookieService = {
    get: () => "cookie service get",
};

const mockStaticUtil = {
    cacheConfigValue: () => of("some config string"),
    cacheConfigEnabled: () => of(0),
    hasPermission: () => of(true),
};

const mockPlatform = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SAFARI: false,
};

const mockEnrollmentService = {
    pendingEnrollments$: of(false),
};

const mockUtilService = {
    setSidenav: () => {},
};

const mockAuthenticationService = {
    keepalive: () => of({}),
};

const mockBreakPointUtilService = {
    breakpointObserver$: of({}),
};

const mockLoadExternalJsService = {
    loadScript: () => {},
};

const mockTpiService = {
    isLinkAndLaunchMode: () => false,
};

describe.skip("AppComponent", () => {
    let fixture: ComponentFixture<AppComponent>;
    let app: AppComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                NgxsModule.forRoot([]), // import real module without state
            ],
            declarations: [AppComponent],
            providers: [
                NGRXStore,
                provideMockStore({}),
                DatePipe,
                { provide: PayrollFrequencyCalculatorPipe, useValue: mockPayrollFrequencyCalculatorPipe },
                { provide: Store, useValue: mockStore },
                { provide: UserService, useValue: mockUserService },
                { provide: RouteInterceptorService, useValue: mockRouterInterceptor },
                { provide: EnrollmentService, useValue: mockEnrollmentService },
                { provide: Platform, useValue: mockPlatform },
                { provide: UtilService, useValue: mockUtilService },
                { provide: CookieService, useValue: mockCookieService },
                { provide: StaticService, useValue: mockStaticService },
                { provide: SharedService, useValue: mockSharedService },
                { provide: Idle, useValue: mockIdle },
                { provide: Keepalive, useValue: mockKeepalive },
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: BreakPointUtilService, useValue: mockBreakPointUtilService },
                { provide: StaticUtilService, useValue: mockStaticUtil },
                { provide: LoadExternalJsService, useValue: mockLoadExternalJsService },
                { provide: TpiServices, useValue: mockTpiService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;
    }, 60 * 1000); // Set jest timeout to 1 minute since ci tends to take longer than the default 5 seconds

    /**
     * We need to make sure Ivy is enabled for jest.
     * @deprecated REMOVE WHEN WE MIGRATE TO ANGULAR 13
     * */
    it("should use ivy", () => {
        expect(ivyEnabled).toBe(true);
    });

    it("should create the app", () => {
        expect(app).toBeTruthy();
    });

    describe("isPegaChatConfigEnable()", () => {
        it("should return config value for producer", () => {
            const configs = [
                {
                    name: "general.pegaChat.producer.enable",
                    value: "TRUE",
                    dataType: "BOOLEAN",
                },
            ];
            const configValue = app.isPegaChatConfigEnable("producer", configs);
            expect(configValue).toBe("TRUE");
        });
        it("should return config value for member", () => {
            const configs = [
                {
                    name: "general.pegaChat.member.enable",
                    value: "TRUE",
                    dataType: "BOOLEAN",
                },
            ];
            const configValue = app.isPegaChatConfigEnable("producer", configs);
            expect(configValue).toBe("TRUE");
        });
        it("should return config value for admin", () => {
            const configs = [
                {
                    name: "general.pegaChat.admin.enable",
                    value: "FALSE",
                    dataType: "BOOLEAN",
                },
            ];
            const configValue = app.isPegaChatConfigEnable("producer", configs);
            expect(configValue).toBe("FALSE");
        });
        it("should return config value for admin", () => {
            const configs = [];
            const configValue = app.isPegaChatConfigEnable("producer", configs);
            expect(configValue).toBe("false");
        });
    });
});
