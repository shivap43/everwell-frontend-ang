import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";
import { AflacService, ShoppingService } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { EnrollmentState, SetErrorForShop, SetOfferingState, TPIState, DualPlanYearService } from "@empowered/ngxs-store";
import { NgxsModule, Store } from "@ngxs/store";
import { ConsentStatementComponent } from "./consent-statement.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiError, ProducerDetails, TpiSSOModel, PlanOffering } from "@empowered/constants";
import { of, throwError } from "rxjs";
import { mockDatePipe, mockLanguageService, mockDomSanitizer, mockTpiService, mockRouter, mockActivatedRoute } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { TpiServices, SharedService } from "@empowered/common-services";
import { MatMenuModule } from "@angular/material/menu";

const tpiSsoDetail = {
    user: {
        id: 1,
        groupId: 111,
        memberId: 1,
    },
} as TpiSSOModel;
describe("ConsentStatementComponent", () => {
    let component: ConsentStatementComponent;
    let fixture: ComponentFixture<ConsentStatementComponent>;
    let aflacService: AflacService;
    let shoppingService: ShoppingService;
    let dualPlanYearService: DualPlanYearService;
    let sharedService: SharedService;
    let store: Store;
    let tpiService: TpiServices;
    let stateForNgxsStore: Store;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConsentStatementComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([TPIState, EnrollmentState, LanguageState]), MatMenuModule],
            providers: [
                AflacService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: TpiServices,
                    useValue: mockTpiService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                ShoppingService,
                DualPlanYearService,
                SharedService,
                Store,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConsentStatementComponent);
        component = fixture.componentInstance;
        aflacService = TestBed.inject(AflacService);
        sharedService = TestBed.inject(SharedService);
        dualPlanYearService = TestBed.inject(DualPlanYearService);
        shoppingService = TestBed.inject(ShoppingService);
        tpiService = TestBed.inject(TpiServices);
        store = TestBed.inject(Store);
        router = TestBed.inject(Router);
        stateForNgxsStore = {
            ...store.snapshot(),
            TPIState: {
                tpiSSODetail: tpiSsoDetail,
            },
            enrollment: {
                apiError: {
                    status: 400,
                    errorKey: "error.detail.displayText.getPlanOfferings.400.producer.state",
                    value: "api error message",
                },
            },
            language: {
                apiError: {
                    status: 400,
                    errorKey: "error.detail.displayText.getPlanOfferings.400.member.tooOld",
                    value: "api error message for age",
                },
            },
        };
        store.reset(stateForNgxsStore);
        component.mpGroup = 111;
        component.memberId = 1;
        component.tpiSsoDetail = tpiSsoDetail;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("ngOnInit()", () => {
        it("should call getPrimaryProducer", () => {
            const spy1 = jest.spyOn(sharedService, "getPrimaryProducer");
            const spy2 = jest.spyOn(tpiService, "isLinkAndLaunchMode");
            fixture.detectChanges();
            expect(component.ssoAuthData).toStrictEqual({
                user: {
                    id: 1,
                    groupId: 111,
                    memberId: 1,
                },
            });
            expect(spy1).toBeCalledWith("111");
            expect(spy2).toBeCalledTimes(1);
        });
    });
    describe("showErrorAlertMessage()", () => {
        it("should set invalidEnrollmentStateErrorMessage", () => {
            const error = {
                error: {
                    status: 400,
                    code: "value",
                    details: [],
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.primaryProducerInfo = {
                name: {
                    firstName: "fn",
                    lastName: "ln",
                },
                emailAddress: "test123@gmail.com",
                phoneNumber: "111111111",
            } as ProducerDetails;
            component.showErrorAlertMessage(error);
            expect(component.invalidEnrollmentStateErrorMessage).toStrictEqual("primary.portal.assist.enrollment");
            store.reset({
                ...store.snapshot(),
                enrollment: {
                    apiError: {
                        status: 400,
                        errorKey: "error.detail.displayText.getPlanOfferings.400.member.state",
                        value: "api error message",
                    },
                },
            });
            component.showErrorAlertMessage(error);
            expect(component.invalidEnrollmentStateErrorMessage).toStrictEqual("primary.portal.assist.enrollment");
        });
        it("should set errorMessage", () => {
            const error = {
                error: {
                    status: 400,
                    details: [
                        {
                            field: "errorDetails",
                        },
                    ],
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            store.reset({
                ...store.snapshot(),
                enrollment: {
                    apiError: {
                        status: 400,
                        errorKey: "error.detail.displayText.getPlanOfferings.400.member.tooOld",
                        value: "api error message",
                    },
                },
            });
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toStrictEqual("secondary.portal.members.api.400.value.errorDetails");
            const error2 = {
                error: {
                    status: 403,
                    code: "duplicate",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error2);
            expect(component.errorMessage).toStrictEqual("secondary.portal.members.api.403.duplicate");
            const error3 = {
                error: {
                    status: 503,
                    code: "code",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error3);
            expect(component.errorMessage).toStrictEqual("secondary.api.503.code");
        });
    });
    describe("getPlanOfferingError()", () => {
        it("action should be dispatched for error", () => {
            const spy = jest.spyOn(store, "dispatch");
            const error = {
                status: "400",
            } as ApiError;
            component.getPlanOfferingError(error);
            expect(spy).toBeCalledWith(new SetErrorForShop(error));
        });
    });
    describe("getPlanOffering()", () => {
        it("getPlanOfferings() should be called", () => {
            component.memberId = 1;
            component.mpGroup = 111;
            const spy1 = jest.spyOn(dualPlanYearService, "getReferenceDate").mockReturnValue("2022-09-13");
            const spy2 = jest.spyOn(shoppingService, "getPlanOfferings");
            component
                .getPlanOffering()
                .toPromise()
                .then(() => {
                    expect(spy1).toBeCalledTimes(1);
                    expect(spy2).toBeCalledWith(undefined, "SELF_SERVICE", undefined, {}, 1, 111, "plan.productId", "2022-09-13");
                });
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
    describe("onContinue()", () => {
        it("should call setStep() and dispatch action when planOfferings are empty", () => {
            const planOfferings = [] as PlanOffering[];
            jest.spyOn(aflacService, "acceptMemberConsent").mockReturnValue(of(void {}));
            jest.spyOn(component, "getPlanOffering").mockReturnValue(of(planOfferings));
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(tpiService, "setStep");
            component.onContinue();
            expect(spy1).toBeCalledWith(new SetOfferingState(planOfferings));
            expect(spy2).toBeCalledWith(1);
        });
        it("should call getPlanOffering() and dispatch action", () => {
            const planOfferings = [{ id: 1, agentAssistanceRequired: false }] as PlanOffering[];
            jest.spyOn(aflacService, "acceptMemberConsent").mockReturnValue(of(void {}));
            const spy1 = jest.spyOn(component, "getPlanOffering").mockReturnValue(of(planOfferings));
            const spy2 = jest.spyOn(store, "dispatch");
            const spy3 = jest.spyOn(tpiService, "setStep");
            component.onContinue();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith(new SetOfferingState(planOfferings));
            component.tpiSsoDetail.user.producerId = 123;
            component.onContinue();
            expect(spy3).toHaveBeenNthCalledWith(2, null);
        });
        it("should call getPlanOfferingError and showErrorAlertMessage for api error response", () => {
            const error = {
                error: {
                    status: 503,
                    code: "code",
                },
            };
            jest.spyOn(aflacService, "acceptMemberConsent").mockReturnValue(throwError(error));
            const spy1 = jest.spyOn(component, "getPlanOfferingError");
            const spy2 = jest.spyOn(component, "showErrorAlertMessage");
            component.onContinue();
            expect(spy1).toBeCalledWith(error.error);
            expect(spy2).toBeCalledWith(error);
        });
    });
    describe("onCancel()", () => {
        it("should call router navigate method", () => {
            const spy = jest.spyOn(router, "navigate");
            component.onCancel();
            expect(spy).toBeCalledWith(["tpi/exit"]);
        });
    });
});
