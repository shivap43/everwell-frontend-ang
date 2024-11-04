import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { SsoLoginComponent } from "./sso-login.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MockComponent, mockAuthenticationService, mockCsrfService, mockUserService } from "@empowered/testing";
import { CsrfService } from "@empowered/util/csrf";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService } from "@empowered/api";
import { Subscription, of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "@empowered/user";
import { Credential } from "@empowered/constants";

const ACTIVATED_ROUTE = { queryParams: of({ encData: "123456" }) };

describe("SsoLoginComponent", () => {
    let component: SsoLoginComponent;
    let fixture: ComponentFixture<SsoLoginComponent>;
    let router: Router;
    let userService: UserService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SsoLoginComponent, MockComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: CsrfService, useValue: mockCsrfService },
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: ActivatedRoute, useValue: ACTIVATED_ROUTE },
                { provide: UserService, useValue: mockUserService },
            ],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot(),
                RouterTestingModule.withRoutes([
                    {
                        path: "producer/login/consent",
                        component: MockComponent,
                    },
                ]),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SsoLoginComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        userService = TestBed.inject(UserService);
    });

    describe("SsoLoginComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const spy = jest.spyOn(component["unsubscribe$"], "next");
                const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

                fixture.destroy();

                expect(spy).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
            });
        });

        describe("ngOnInit()", () => {
            afterAll(() => {
                jest.restoreAllMocks();
            });
            it("should populate encoded data and continue to SSO", fakeAsync(() => {
                const producerSSOSpy = jest.spyOn(component, "producerSSO").mockImplementation(() => {});
                component.ngOnInit();
                tick();
                expect(component.showPreloader).toBe(true);
                expect(producerSSOSpy).toHaveBeenCalled();
            }));
        });

        describe("producerSSO()", () => {
            it("should navigate to /producer/login/consent when user has not consented", fakeAsync(() => {
                const userServiceSpy = jest.spyOn(userService, "setUserCredential");
                const routerSpy = jest.spyOn(router, "navigate");
                component.producerSSO("sample encoded string");
                tick();
                expect(component.showPreloader).toBe(false);
                expect(component.ssoLoginError).toBe(false);
                expect(window.sessionStorage.getItem("userInfo")).toBe(JSON.stringify({}));
                expect(userServiceSpy).toHaveBeenCalledWith({});
                expect(routerSpy).toHaveBeenCalledWith(["/producer/login/consent"], { relativeTo: ACTIVATED_ROUTE });
            }));
        });
    });
});
