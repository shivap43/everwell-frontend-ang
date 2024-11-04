import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AccountService, Enrollment, EnrollmentService } from "@empowered/api";
import { TpiServices } from "@empowered/common-services";
import { AccountProducer, EnrollmentMethod, Enrollments, PlanOffering, TpiSSOModel } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SetEnrollmentMethod, TPIState } from "@empowered/ngxs-store";
import { NgxsModule, Store } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { EnrollmentInitiateComponent } from "./enrollment-initiate.component";
import { mockLanguageService, mockRouter } from "@empowered/testing";

describe("EnrollmentInitiateComponent", () => {
    let component: EnrollmentInitiateComponent;
    let fixture: ComponentFixture<EnrollmentInitiateComponent>;
    let store: Store;
    let tpiService: TpiServices;
    let accountService: AccountService;
    let enrollmentService: EnrollmentService;
    let router: Router;

    const mockTpiService = {
        isLinkAndLaunchMode: () => true,
        setStep: (step: number) => void {},
        step$: of(2),
    } as TpiServices;

    const mockEnrollmentService = {
        searchMemberEnrollments: (memberId: number, mpGroup: number) => of([{ id: 1 } as Enrollment]),
    } as EnrollmentService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentInitiateComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([TPIState])],
            providers: [
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: EnrollmentService, useValue: mockEnrollmentService },
                { provide: Router, useValue: mockRouter },
                { provide: TpiServices, useValue: mockTpiService },
                { provide: Router, useValue: mockRouter },
                AccountService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentInitiateComponent);
        component = fixture.componentInstance;
        tpiService = TestBed.inject(TpiServices);
        accountService = TestBed.inject(AccountService);
        enrollmentService = TestBed.inject(EnrollmentService);
        store = TestBed.inject(Store);
        router = TestBed.inject(Router);
        store.reset({
            ...store.snapshot(),
            TPIState: {
                tpiSSODetail: {
                    user: {
                        id: 1,
                        groupId: 111,
                        memberId: 1,
                        name: {
                            firstName: "Jest",
                        },
                    },
                },
                planOffering: [
                    {
                        id: 1,
                        plan: {
                            product: {
                                name: "Term Life",
                            },
                        },
                        agentAssistanceRequired: false,
                    },
                    {
                        id: 2,
                        plan: {
                            product: {
                                name: "Whole Life",
                            },
                        },
                        agentAssistanceRequired: true,
                    },
                ] as PlanOffering[],
            },
        });
        component.selectedOption = new FormControl("selfService", Validators.required);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getPrimaryProducer()", () => {
        it("should call getAccountProducers method", () => {
            const spy = jest.spyOn(accountService, "getAccountProducers").mockReturnValue(
                of([
                    {
                        role: "PRIMARY_PRODUCER",
                        producer: {
                            name: {
                                firstName: "john",
                                lastName: "richie",
                            },
                            phoneNumber: "1234567890",
                            emailAddress: "john12@gmail.com",
                        },
                    } as AccountProducer,
                ]),
            );
            component.getPrimaryProducer();
            expect(spy).toBeCalledTimes(1);
            expect(component.primaryProducerEmail).toStrictEqual("john12@gmail.com");
            expect(component.primaryProducerFirstName).toStrictEqual("john");
            expect(component.primaryProducerLastname).toStrictEqual("richie");
            expect(component.primaryProducerMobile).toStrictEqual("1234567890");
        });
        it("should call showErrorAlertMessage method for api error", () => {
            const error = {
                error: { status: 400 },
                name: "error name",
                message: "error message",
            } as Error;
            const spy = jest.spyOn(accountService, "getAccountProducers").mockReturnValue(throwError(error));
            const spy2 = jest.spyOn(component, "showErrorAlertMessage");
            component.getPrimaryProducer();
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith(error);
        });
    });
    describe("getProductsList()", () => {
        it("should set data for selfAssistedProductArray and language for enroll products", () => {
            component.getProductsList();
            expect(component.selfAssistedProductArray).toStrictEqual(["Term Life"]);
            expect(component.enrollProducts).toStrictEqual("primary.portal.tpiEnrollment.enrollProduct");
            component.listOfSelfServiceProduct = [
                {
                    plan: {
                        product: {
                            name: "Term Life",
                        },
                    },
                },
                {
                    plan: {
                        product: {
                            name: "Whole Life",
                        },
                    },
                },
            ] as PlanOffering[];
            component.getProductsList();
            expect(component.enrollProducts).toStrictEqual("primary.portal.tpiEnrollment.enrollProducts");
        });
        it("should set data for agentAssistedProductArray and language for helpProducts", () => {
            component.getProductsList();
            expect(component.agentAssistedProductArray).toStrictEqual(["Whole Life"]);
            expect(component.helpProducts).toStrictEqual("primary.portal.tpiEnrollment.helpProduct");
            component.listOfAgentAssistedProduct = [
                {
                    plan: {
                        product: {
                            name: "Term Life",
                        },
                    },
                },
                {
                    plan: {
                        product: {
                            name: "Whole Life",
                        },
                    },
                },
            ] as PlanOffering[];
            component.getProductsList();
            expect(component.helpProducts).toStrictEqual("primary.portal.tpiEnrollment.helpProducts");
        });
    });
    describe("chooseOption()", () => {
        it("should set value for selected option", () => {
            component.chooseOption("faceToFace");
            expect(component.selectedOption.value).toStrictEqual("faceToFace");
        });
    });

    describe("showErrorAlertMessage()", () => {
        it("should set errorMessage for api error response", () => {
            const error = {
                error: {
                    status: 400,
                    details: [
                        {
                            field: "errorDetails",
                        },
                    ],
                    code: "code",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toStrictEqual("secondary.portal.commission.api.400.code.errorDetails");
            const error2 = {
                error: {
                    status: 400,
                    details: [],
                    code: "duplicate",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error2);
            expect(component.errorMessage).toStrictEqual("secondary.portal.commission.api.400.duplicate");
            const error3 = {
                error: {
                    status: 500,
                    code: "code",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.showErrorAlertMessage(error3);
            expect(component.errorMessage).toStrictEqual("secondary.api.500.code");
        });
    });
    describe("proceedFurther()", () => {
        describe("when selectedOption value is selectedOption", () => {
            beforeEach(() => {
                component.selectedOption = new FormControl("selfService");
                component.ssoAuthData = { user: { memberId: 1, groupId: 12345 }, productId: 67 } as TpiSSOModel;
                jest.clearAllMocks();
            });
            it("should call redirectToResidentialPage and dispatch action if step id is 3", () => {
                component.stepId = 3;
                const spy = jest.spyOn(store, "dispatch");
                component.proceedFurther();
                expect(spy).toBeCalledWith(new SetEnrollmentMethod(EnrollmentMethod.SELF_SERVICE));
            });
            it("should call searchMemberEnrollments", () => {
                component.planOffered = [{ id: 1 } as PlanOffering];
                component.listOfAgentAssistedProduct = [{ id: 1 } as PlanOffering];
                const spy = jest.spyOn(enrollmentService, "searchMemberEnrollments").mockReturnValue(of([{ id: 1 }] as Enrollments[]));
                component.proceedFurther();
                expect(spy).toBeCalledTimes(1);
                expect(component.existingCoverageSummaryFlag).toBe(true);
            });
            it("should set error in case of searchMemberEnrollments api failure", () => {
                component.planOffered = [{ id: 1 } as PlanOffering];
                component.listOfAgentAssistedProduct = [{ id: 1 } as PlanOffering];
                jest.spyOn(enrollmentService, "searchMemberEnrollments").mockReturnValue(
                    throwError({
                        message: "api error message",
                        error: {
                            status: 500,
                            code: "errorCode",
                        },
                    }),
                );
                component.proceedFurther();
                expect(component.errorMessage).toStrictEqual("secondary.api.500.errorCode");
            });
            it("should call redirectToResidentialPage if producer id is there", () => {
                component.stepId = 2;
                component.planOffered = [];
                component.listOfAgentAssistedProduct = [{ id: 1 } as PlanOffering];
                const spy = jest.spyOn(router, "navigate");
                component.proceedFurther();
                expect(spy).toBeCalledWith(["tpi/confirm-address"]);
            });
            it("should call getProductsList method and set data", () => {
                component.ssoAuthData = { user: { memberId: 1, groupId: 12345 } } as TpiSSOModel;
                component.listOfSelfServiceProduct = [
                    {
                        plan: {
                            product: {
                                name: "Term Life",
                            },
                        },
                    },
                ] as PlanOffering[];
                expect(component.enrollProducts).toStrictEqual("primary.portal.tpiEnrollment.enrollProduct");
            });
        });
        it("should set stepId and navigate to npn-search", () => {
            component.stepId = 0;
            component.selectedOption = new FormControl("faceToFace");
            const spy = jest.spyOn(router, "navigate");
            component.proceedFurther();
            expect(component.stepId).toBe(3);
            expect(spy).toBeCalledWith(["tpi/npn-search"]);
        });
    });
    describe("onExit", () => {
        it("Should naviagte to COVERAGE_SUMMARY_ROUTE when existingCoverageSummaryFlag is true and stepId is STEP_TWO", () => {
            component.existingCoverageSummaryFlag = true;
            component.stepId = 2;
            const COVERAGE_SUMMARY_ROUTE = "/tpi/coverage-summary";
            const spy = jest.spyOn(router, "navigate");
            component.onExit();
            expect(spy).toHaveBeenCalledWith([COVERAGE_SUMMARY_ROUTE]);
        });
        it("Should naviagte to tpi/Exit when existingCoverageSummaryFlag is false", () => {
            component.existingCoverageSummaryFlag = false;
            component.stepId = 1;
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.onExit();
            expect(spy).toHaveBeenCalledWith([EXIT]);
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
});
