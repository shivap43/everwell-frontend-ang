import { HttpErrorResponse } from "@angular/common/http";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { ProducerDetails, TpiSSOModel } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SetMPGroup, SetMemberId, SetRegex, SetTPISSODetail } from "@empowered/ngxs-store";
import {
    mockActivatedRoute,
    mockAuthenticationService,
    mockCsrfService,
    mockLanguageService,
    mockPhoneFormatConverterPipe,
    mockRouter,
    mockStore,
} from "@empowered/testing";
import { PhoneFormatConverterPipe } from "@empowered/ui";
import { CsrfService } from "@empowered/util/csrf";
import { NgxsDispatchPluginModule } from "@ngxs-labs/dispatch-decorator";
import { NgxsModule, Store } from "@ngxs/store";
import { SsoComponent } from "./sso.component";

describe("SsoComponent", () => {
    let component: SsoComponent;
    let fixture: ComponentFixture<SsoComponent>;
    let router: Router;
    let route: ActivatedRoute;
    let csrfService: CsrfService;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SsoComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: Store, useValue: mockStore },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                { provide: CsrfService, useValue: mockCsrfService },
                { provide: PhoneFormatConverterPipe, useValue: mockPhoneFormatConverterPipe },
            ],
            imports: [NgxsModule.forRoot([]), NgxsDispatchPluginModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SsoComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        route = TestBed.inject(ActivatedRoute);
        csrfService = TestBed.inject(CsrfService);
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onExit", () => {
        it("Should close the modal on click of 'Exit' button", () => {
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.onExit();
            expect(spy).toBeCalledWith([EXIT]);
        });
    });

    describe("producerSSO()", () => {
        it("should navigate to producer login page if consented data is false", () => {
            const spy = jest.spyOn(router, "navigate");
            const PRODUCER_CONSENT_URL = "/producer/login/consent";
            component.producerSSO({ consented: false });
            expect(spy).toBeCalledWith([PRODUCER_CONSENT_URL], {
                relativeTo: route,
            });
        });

        it("should navigate to producer direct page if consented data and directPermission is true ", () => {
            const spy = jest.spyOn(router, "navigate");
            const PRODUCER_DIRECT_URL = "/producer/direct";
            component.directPermission = true;
            component.producerSSO({ consented: true });
            expect(spy).toBeCalledWith([PRODUCER_DIRECT_URL], {
                relativeTo: route,
            });
        });

        it("should navigate to producer payroll page if consented data is false and directPermission is true ", () => {
            const spy = jest.spyOn(router, "navigate");
            const PRODUCER_PAYROLL_URL = "/producer/payroll";
            component.directPermission = false;
            component.producerSSO({ consented: true });
            expect(spy).toBeCalledWith([PRODUCER_PAYROLL_URL], {
                relativeTo: route,
            });
        });
    });

    describe("handleTpiErrorResponse()", () => {
        it("should contain invalid phone language", () => {
            const error = { status: 400, error: { details: [{ field: "phoneNumber" }] } } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.preferredContactErrorMessage).toEqual(["secondary.portal.tpiEnrollment.invalidPhone"]);
        });

        it("should contain invalid email language", () => {
            const error = { status: 400, error: { details: [{ field: "email" }] } } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.preferredContactErrorMessage).toEqual(["secondary.portal.tpiEnrollment.invalidEmail"]);
        });

        it("should contain invalid city language", () => {
            const error = { status: 400, error: { details: [{ field: "city" }] } } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.preferredContactErrorMessage).toEqual(["secondary.portal.tpiEnrollment.invalidCity"]);
        });

        it("should contain invalid city as well as phoneNumber language", () => {
            const error = { status: 400, error: { details: [{ field: "city" }, { field: "phoneNumber" }] } } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.preferredContactErrorMessage).toEqual([
                "secondary.portal.tpiEnrollment.invalidCity",
                "secondary.portal.tpiEnrollment.invalidPhone",
            ]);
        });

        it("should display server down error message when API returns 500 error code response", () => {
            const error = { status: 503, error: { code: "" } } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.errorMessage).toBe(
                "Sorry, the site is temporarily unavailable. We're working to fix the issue. Please try again later",
            );
        });

        it("should display unique error messages when API returns multiple validation errors for same field", () => {
            const error = {
                status: 400,
                error: { details: [{ field: "city" }, { field: "email" }, { field: "city" }, { field: "email" }] },
            } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.preferredContactErrorMessage).toEqual([
                "secondary.portal.tpiEnrollment.invalidCity",
                "secondary.portal.tpiEnrollment.invalidEmail",
            ]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("handleTpiErrorResponse()", () => {
        describe("should set errorMessage for error status 401", () => {
            it("error message for notAuthorized", () => {
                const error = {
                    error: {
                        details: [
                            {
                                field: "producerId",
                            },
                        ],
                        code: "notAuthorized",
                    },
                    status: 401,
                } as HttpErrorResponse;
                component.handleTpiErrorResponse(error);
                expect(component.errorMessage).toStrictEqual("secondary.portal.tpiEnrollment.incorrectLicense.message");
                error.error.details = [
                    {
                        field: "npn",
                    },
                ];
                component.handleTpiErrorResponse(error);
                expect(component.errorMessage).toStrictEqual("secondary.portal.tpiEnrollment.wrongNPNEmail.message");
                error.error.details = [
                    {
                        field: "memberId",
                    },
                ];
                component.handleTpiErrorResponse(error);
                expect(component.errorMessage).toStrictEqual("secondary.portal.tpiEnrollment.subscriberNotFound.message");
            });
            it("should set errorMessage for 401 other than notAuthorized", () => {
                const error = {
                    error: {
                        details: [
                            {
                                field: "field",
                            },
                        ],
                        status: "status",
                        code: "code",
                    },
                    status: 401,
                } as HttpErrorResponse;
                component.handleTpiErrorResponse(error);
                expect(component.errorMessage).toStrictEqual("secondary.portal.tpiEnrollment.code.status.field");
            });
        });
        it("should set errorMessage for error status 400", () => {
            const error = {
                error: {
                    details: [
                        {
                            field: "field",
                        },
                    ],
                    status: "status",
                    code: "code",
                },
                status: 400,
            } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.errorMessage).toStrictEqual("secondary.portal.tpiEnrollment.status.code");
        });
        it("should call load for error status 403 and code csrfMismatch", () => {
            const error = {
                error: {
                    status: "status",
                    code: "csrfMismatch",
                },
                status: 403,
            } as HttpErrorResponse;
            const spy = jest.spyOn(csrfService, "load");
            component.handleTpiErrorResponse(error);
            expect(spy).toBeCalledTimes(2);
        });
        it("should set approvalPending for error status 503 and error code groupMaintenance", () => {
            const error = {
                error: {
                    status: "status",
                    code: "groupMaintenance",
                },
                status: 503,
            } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.approvalPending).toStrictEqual("primary.portal.tpi.allOfferings.approvalPending.agentAssisted");
        });
        it("should set duplicateMember for error status 409 and code duplicate", () => {
            const error = {
                error: {
                    status: "status",
                    code: "duplicate",
                },
                status: 409,
            } as HttpErrorResponse;
            component.tpiSSODetail = { user: { producerId: 111 } } as TpiSSOModel;
            component.handleTpiErrorResponse(error);
            expect(component.duplicateMember).toStrictEqual("secondary.portal.tpiAgentEnrollment.DuplicateMember.message");
            component.tpiSSODetail.user.producerId = null;
            component.primaryProducer = {
                name: { firstName: "firstName", lastName: "lastName" },
                emailAddress: "test@gmail.com",
                phoneNumber: "1111111111",
            } as ProducerDetails;
            component.handleTpiErrorResponse(error);
            expect(component.duplicateMember).toStrictEqual("secondary.portal.tpiSelfEnrollment.DuplicateMember.message");
        });
        it("should set internalServerErrorSpecificMessage for error status 500", () => {
            const error = {
                status: 500,
            } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.internalServerErrorSpecificMessage).toStrictEqual("secondary.portal.tpiEnrollment.500.displayText");
        });
        it("should set generic message to errorMessage for other cases", () => {
            const error = {
                status: 501,
            } as HttpErrorResponse;
            component.handleTpiErrorResponse(error);
            expect(component.errorMessage).toStrictEqual(
                "Sorry, the site is temporarily unavailable. We're working to fix the issue. Please try again later",
            );
        });
    });
    describe("getTpiSSO()", () => {
        it("should set tpiSSODetail and dispatch action", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.encData = "encData";
            component.getTpiSSO({ user: { producerId: 111 } } as TpiSSOModel);
            expect(component.tpiSSODetail).toStrictEqual({ user: { producerId: 111 } });
            expect(spy).toBeCalledWith(new SetTPISSODetail(component.tpiSSODetail));
        });

        it("should dispatch the SetMPGroup, SetMemberId and SetRegex actions", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.encData = "encData";
            component.getTpiSSO({ user: { groupId: 12345, memberId: 1 } } as TpiSSOModel);
            expect(spy).toHaveBeenCalledWith(new SetMPGroup(12345));
            expect(spy).toHaveBeenCalledWith(new SetMemberId(1));
            expect(spy).toHaveBeenCalledWith(new SetRegex());
        });
    });
});
