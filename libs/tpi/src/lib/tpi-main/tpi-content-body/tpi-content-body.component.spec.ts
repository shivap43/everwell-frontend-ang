import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
    AccountService,
    AdminService,
    AflacService,
    BenefitsOfferingService,
    CoreService,
    MemberService,
    ProductSelection,
    ShoppingService,
} from "@empowered/api";
import { ApiError, TpiSSOModel, PlanOffering, Product, MemberProfile, EnrollmentMethod } from "@empowered/constants";
import { TpiContentBodyComponent } from "./tpi-content-body.component";
import { of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { SetEnrollmentMethod, SetErrorForShop } from "@empowered/ngxs-store";
import { TpiServices, SharedService } from "@empowered/common-services";
import { throwError } from "rxjs";

import {
    mockAccountService,
    mockAdminService,
    mockBenefitsOfferingService,
    mockCoreService,
    mockLanguageService,
    mockMemberService,
    mockRouter,
    mockSharedService,
    mockShoppingService,
    mockStore,
    mockTpiService,
} from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { DatePipe } from "@angular/common";
import { DualPlanYearService } from "@empowered/ngxs-store";

describe("TpiContentBodyComponent", () => {
    let component: TpiContentBodyComponent;
    let fixture: ComponentFixture<TpiContentBodyComponent>;
    let store: Store;
    let tpiService: TpiServices;
    let memberService: MemberService;
    let aflacService: AflacService;
    let router: Router;
    let coreService: CoreService;
    let dualPlanYearService: DualPlanYearService;
    let httpClient: HttpClient;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiContentBodyComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
            providers: [
                { provide: SharedService, useValue: mockSharedService },
                { provide: MemberService, useValue: mockMemberService },
                { provide: CoreService, useValue: mockCoreService },
                { provide: BenefitsOfferingService, useValue: mockBenefitsOfferingService },
                { provide: Router, useValue: mockRouter },
                { provide: AdminService, useValue: mockAdminService },
                { provide: AccountService, useValue: mockAccountService },
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: TpiServices, useValue: mockTpiService },
                { provide: Store, useValue: mockStore },
                DualPlanYearService,
                AflacService,
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiContentBodyComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        tpiService = TestBed.inject(TpiServices);
        memberService = TestBed.inject(MemberService);
        aflacService = TestBed.inject(AflacService);
        coreService = TestBed.inject(CoreService);
        router = TestBed.inject(Router);
        dualPlanYearService = TestBed.inject(DualPlanYearService);
        httpClient = TestBed.inject(HttpClient);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("postConsentOperation", () => {
        it("Should call getPlanOffering() method if producer id is not there", () => {
            component.ssoDetails = {
                user: {},
                modal: true,
                planId: 1,
            } as TpiSSOModel;

            const spy = jest.spyOn(component, "getPlanOffering");
            const spy1 = jest.spyOn(dualPlanYearService, "getReferenceDate").mockReturnValue("2022-09-13");
            component.postConsentOperation();
            expect(spy1).toBeCalledTimes(1);
            expect(spy).toBeCalledTimes(1);
        });

        it("Should Navigate to enrollment-method component if producer id is there ", () => {
            component.ssoDetails = {
                user: {
                    producerId: 1,
                },
                modal: true,
                planId: 1,
            } as TpiSSOModel;

            const ENROLLMENT_METHOD = "tpi/enrollment-method";
            const spy1 = jest.spyOn(tpiService, "setStep");
            const spy2 = jest.spyOn(router, "navigate");
            component.postConsentOperation();
            expect(spy1).toBeCalledWith(null);
            expect(spy2).toBeCalledWith([ENROLLMENT_METHOD]);
        });
    });

    describe("onExit", () => {
        it("Should close the modal on click of 'Exit' button", () => {
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.onExit();
            expect(spy).toBeCalledWith([EXIT]);
        });
    });

    describe("checkEmployeeStatus()", () => {
        it("Should call router navigate method if termination date is there", () => {
            const spy2 = jest.spyOn(router, "navigate");
            const COVERAGE = "tpi/coverage-summary";
            const memberInfo = {
                body: {
                    workInformation: {
                        termination: { terminationDate: "2022-09-01" },
                    },
                },
            } as HttpResponse<MemberProfile>;

            jest.spyOn(memberService, "getMember").mockReturnValue(of(memberInfo));

            component.checkEmployeeStatus();
            memberService.getMember(3, true, "122924").subscribe((res) => {
                expect(spy2).toBeCalledWith([COVERAGE]);
                expect(spy2).toBeCalledTimes(1);
            });
        });
        it("Should call getPlanYears method if termination date is not there", () => {
            const spy = jest.spyOn(component, "getPlanYears");
            const memberInfo = {
                body: {
                    workInformation: {
                        termination: {},
                    },
                },
            } as HttpResponse<MemberProfile>;

            jest.spyOn(memberService, "getMember").mockReturnValue(of(memberInfo));

            component.checkEmployeeStatus();
            memberService.getMember(3, true, "122924").subscribe((res) => {
                expect(spy).toBeCalledTimes(1);
            });
        });
    });
    describe("getMemberConsent()", () => {
        it("should navigate to consent-statement page if getMemberConsent return false", (done) => {
            expect.assertions(1);
            const CONSENT_STATEMENT = "tpi/consent-statement";
            const spy = jest.spyOn(router, "navigate");
            jest.spyOn(aflacService, "getMemberConsent").mockReturnValue(of(false));
            component.memberId = 3;
            component.mpGroup = 122924;
            component.getMemberConsentValue().subscribe((consentValue) => {
                expect(spy).toBeCalledWith([CONSENT_STATEMENT]);
                done();
            });
        });
        it("should call postConsentOperation method when getMemberConsent return true", (done) => {
            expect.assertions(1);
            jest.spyOn(aflacService, "getMemberConsent").mockReturnValue(of(true));
            component.memberId = 4;
            component.mpGroup = 122924;
            component.ssoDetails = {
                user: {
                    producerId: 1,
                },
                modal: true,
                planId: 1,
            } as TpiSSOModel;
            const spy1 = jest.spyOn(component, "postConsentOperation");
            component.getMemberConsentValue().subscribe((consentValue) => {
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
    });
    describe("checkProducerId", () => {
        it("should call getMemberConsentValue method if producerId is not available", () => {
            component.producerId = null;
            component.memberId = 4;
            component.mpGroup = 122924;
            jest.spyOn(component, "getMemberConsentValue");
            component.ssoDetails = {
                user: {
                    producerId: 1,
                },
                modal: true,
                planId: 1,
            } as TpiSSOModel;
            jest.spyOn(component, "checkProducerId").mockReturnValueOnce(of(true));
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
    describe("isPlanOrProductPartOfGroup()", () => {
        it("should check product is available in plan offering or not", () => {
            const planOfferingList = [
                { id: 1, agentAssistanceRequired: true, plan: { id: 11, productId: 12, product: { id: 15 } } },
            ] as PlanOffering[];
            component.ssoDetails = {
                user: {
                    producerId: 1,
                },
                modal: true,
                planId: 1,
                productId: 10,
            } as TpiSSOModel;
            expect(component.isPlanOrProductPartOfGroup(planOfferingList)).toBeTruthy();
        });
    });

    describe("getProductDetails()", () => {
        it("should get productDetails based on productId", () => {
            const mockproductDetail = {
                id: 123,
                name: "Accident",
            } as Product;
            const spy = jest.spyOn(coreService, "getProduct").mockReturnValueOnce(of(mockproductDetail));
            component.ssoDetails = {
                productId: 123,
            } as TpiSSOModel;
            component.getProductDetails(342);
            expect(component.productDetail).toStrictEqual({
                id: 123,
                name: "Accident",
            });
        });
    });

    describe("setAgOrStateErrorMessage()", () => {
        beforeEach(() => {
            component.ssoDetails = {
                productId: 1,
            } as TpiSSOModel;
        });
        it("should set error messages related to aflac group", () => {
            component.productChoices = [
                {
                    id: 1,
                    group: true,
                },
            ] as ProductSelection[];
            jest.spyOn(tpiService, "setIsAgeError");
            component.primaryLangStrings = { "primary.portal.tpi.MemberPortalInfoMessage": "MemberPortalInfoMessage" } as Record<
            string,
            string
            >;
            component.setAgOrStateErrorMessage();
            expect(component.agInfoMessage).toStrictEqual("MemberPortalInfoMessage");
        });
        it("should dispatch SetEnrollmentMethod action with SELF_SERVICE when group attribute is not there in productChoice", () => {
            const spy1 = jest.spyOn(router, "navigate");
            const spy2 = jest.spyOn(store, "dispatch");
            component.productChoices = [
                {
                    id: 1,
                },
            ] as ProductSelection[];
            component.setAgOrStateErrorMessage();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalledWith(new SetEnrollmentMethod(EnrollmentMethod.SELF_SERVICE));
        });
    });

    describe("checkBenefitOffering()", () => {
        it("should call importAflacPolicies service", () => {
            const spy = jest.spyOn(aflacService, "importAflacPolicies").mockReturnValue(throwError("No benefit offering setup"));
            component.memberId = 2;
            component.mpGroup = 2345;
            component.checkBenefitOffering();
            expect(spy).toBeCalled();
        });
    });

    describe("setAgeErrorMessageForAgent()", () => {
        it("should set an error message for single product", () => {
            const spy = jest.spyOn(tpiService, "setIsAgeError");
            component.langStrings = { "secondary.portal.tpiEnrollment.producer.tooOld.singleProduct": "Single product" } as Record<
            string,
            string
            >;
            component.ssoDetails = {
                productId: 3,
            } as TpiSSOModel;
            component.setAgeErrorMessageForAgent();
            expect(spy).toBeCalled();
            expect(component.invalidEnrollmentAgeErrorMessage).toStrictEqual("Single product");
        });

        it("should set an error message for all product", () => {
            const spy = jest.spyOn(tpiService, "setIsAgeError");
            component.langStrings = { "secondary.portal.tpiEnrollment.producer.tooOld.allProducts": "All products" } as Record<
            string,
            string
            >;
            component.ssoDetails = {
                modal: true,
            } as TpiSSOModel;
            component.setAgeErrorMessageForAgent();
            expect(spy).toBeCalled();
            expect(component.invalidEnrollmentAgeErrorMessage).toStrictEqual("All products");
        });
    });

    describe("keepAlive()", () => {
        it("should call get method", () => {
            const spy = jest.spyOn(httpClient, "get").mockReturnValue(throwError("Error"));
            component.ssoDetails = {
                keepalive: "alive",
            } as TpiSSOModel;
            component.keepAlive();
            expect(spy).toBeCalledWith("alive");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
