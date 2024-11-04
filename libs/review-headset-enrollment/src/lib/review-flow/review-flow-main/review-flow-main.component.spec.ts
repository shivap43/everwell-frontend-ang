import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatStepper } from "@angular/material/stepper";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService, EnrollmentService, MemberService, PdaForm, StaticService } from "@empowered/api";
import { Configurations, Enrollments } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AppFlowService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    mockEnrollmentsService,
    mockActivatedRoute,
    mockAuthenticationService,
    mockLanguageService,
    mockMemberService,
    mockRouter,
    mockStaticService,
    mockStaticUtilService,
    mockStore,
    mockUserService,
    mockUtilService,
    mockAppFlowService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { CsrfService } from "@empowered/util/csrf";
import { Store } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { ReviewFlowService } from "../services/review-flow.service";
import { ReviewFlowMainComponent } from "./review-flow-main.component";

describe("ReviewFlowMainComponent", () => {
    let component: ReviewFlowMainComponent;
    let fixture: ComponentFixture<ReviewFlowMainComponent>;
    let authenticationService: AuthenticationService;
    let memberService: MemberService;
    let enrollmentService: EnrollmentService;
    let staticService: StaticService;
    let utilService: UtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [ReviewFlowMainComponent],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ReviewFlowService,
                    useValue: {
                        updateMemberId$: of({}),
                    },
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: CsrfService,
                    useValue: {},
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: EnrollmentService,
                    useValue: mockEnrollmentsService,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReviewFlowMainComponent);
        component = fixture.componentInstance;
        authenticationService = TestBed.inject(AuthenticationService);
        memberService = TestBed.inject(MemberService);
        enrollmentService = TestBed.inject(EnrollmentService);
        staticService = TestBed.inject(StaticService);
        utilService = TestBed.inject(UtilService);
        component.stepper = { selectedIndex: 0 } as MatStepper;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("checkForDirect()", () => {
        it("should set currentStep", () => {
            component.guid = "1111";
            component.groupId = "2222";
            const spy = jest.spyOn(authenticationService, "verifyHeadsetLink");
            component.checkForDirect();
            expect(spy).toBeCalledTimes(1);
            expect(component.linkExpired).toBe(false);
            expect(component.currentStep).toStrictEqual("VERIFYUSER");
        });
        describe("should set error messages when there is api error", () => {
            it("should set agent details when api error status is 401", () => {
                const error = {
                    message: "api error message",
                    status: 401,
                    error: {
                        adminName: "Johny Bairstow",
                        adminEmail: "johny@gmail.com",
                    },
                };
                jest.spyOn(authenticationService, "verifyHeadsetLink").mockReturnValue(throwError(error));
                component.checkForDirect();
                expect(component.linkExpired).toBe(true);
                expect(component.errorMessage).toStrictEqual("");
                expect(component.agentName).toStrictEqual("Johny Bairstow");
                expect(component.agentEmail).toStrictEqual("johny@gmail.com");
                expect(component.agentPhone).toStrictEqual("");
            });
            it("should set error message when api error status is other than 401", () => {
                const error = {
                    message: "api error message",
                    status: 400,
                    error: {
                        adminName: "Johny Bairstow",
                        adminEmail: "johny@gmail.com",
                        status: 400,
                        code: "errorCode",
                    },
                };
                jest.spyOn(authenticationService, "verifyHeadsetLink").mockReturnValue(throwError(error));
                component.checkForDirect();
                expect(component.errorMessage).toStrictEqual("secondary.api.400.errorCode");
                expect(component.showErrorMessage).toBe(true);
            });
        });
    });
    describe("checkForPayroll()", () => {
        it("should set enrollments", () => {
            component.memberId = 1;
            component.groupId = "2222";
            const spy1 = jest.spyOn(enrollmentService, "getEnrollments").mockReturnValue(of([{ id: 1, planId: 11 }] as Enrollments[]));
            const spy2 = jest.spyOn(memberService, "getMemberFormsByType");
            component.checkForPayroll();
            expect(spy1).toBeCalledWith(1, "2222");
            expect(component.enrollments).toStrictEqual([{ id: 1, planId: 11 }]);
            expect(spy2).toBeCalledWith(1, "PDA", "2222", "COMPLETED");
        });
    });
    describe("getConfigurationSpecifications()", () => {
        it("should set customer sign", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([
                    {
                        value: "customerSign,data",
                    },
                ] as Configurations[]),
            );
            component.getConfigurationSpecifications();
            expect(component.customerSign).toStrictEqual("customerSign");
        });
        it("should set errorMessage", () => {
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                throwError({
                    message: "api error message",
                    status: 400,
                    code: "errorCode",
                }),
            );
            component.getConfigurationSpecifications();
            expect(component.errorMessage).toStrictEqual("secondary.api.400.errorCode");
        });
    });
    describe("checkPDACondition()", () => {
        it("should call getPDAFormData method", () => {
            const spy = jest.spyOn(memberService, "getMemberFormsByType").mockReturnValue(of({}));
            component.checkPDACondition(1).subscribe();
            expect(spy).toBeCalled();
        });
    });
    describe("getPDAFormData()", () => {
        it("should call getMemberFormsByType", () => {
            const spy = jest.spyOn(memberService, "getMemberFormsByType").mockReturnValue(of({}));
            component.groupId = 12345;
            component.getPDAFormData(2).subscribe();
            expect(spy).toBeCalledWith(2, "PDA", 12345, "COMPLETED");
        });
    });
    describe("checkForCurrentStep()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should set currentStep to REVIEWSIGN", () => {
            component.isPendingEnrollments = true;
            component.checkForCurrentStep();
            expect(component.currentStep).toStrictEqual("REVIEWSIGN");
            expect(component.linkExpired).toBe(false);
        });
        it("should set currentStep to PDA", () => {
            component.isPendingEnrollments = false;
            component.isPendingPDA = true;
            component.checkForCurrentStep();
            expect(component.currentStep).toStrictEqual("PDA");
        });
        it("should set currentStep to CONFIRMATION", () => {
            component.isPendingEnrollments = false;
            component.isPendingPDA = false;
            component.completedStep = 4;
            component.checkForCurrentStep();
            expect(component.currentStep).toStrictEqual("CONFIRMATION");
        });
        it("should set currentStep to VERIFYUSER", () => {
            component.isPendingEnrollments = false;
            component.isPendingPDA = false;
            component.completedStep = 2;
            component.checkForCurrentStep();
            expect(component.currentStep).toStrictEqual("VERIFYUSER");
        });
    });
    describe("checkforPendingEnrollments()", () => {
        it("should set isStatePR if unsignedPDAForms are there", () => {
            component.unsignedPDAForms = [
                {
                    signature: "test",
                    formType: "PDA_PR",
                },
            ] as PdaForm[];
            component.checkforPendingEnrollments();
            expect(component.isStatePR).toBe(true);
        });
        it("should set isPendingEnrollments and set isStatePR based on PendingEnrollmentReason if enrollments are there", () => {
            jest.spyOn(utilService, "isPastDate").mockReturnValue(true);
            component.enrollments = [
                {
                    pendingReason: "CUSTOMER_SIGNATURE",
                    subscriberApprovalRequiredByDate: "06/25/2023",
                    state: "PR",
                },
            ] as Enrollments[];
            component.checkforPendingEnrollments();
            expect(component.isStatePR).toBe(true);
            expect(component.isPendingEnrollments).toBe(true);
            component.isPendingEnrollments = false;
            component.isStatePR = false;
            component.enrollments = [
                {
                    pendingReason: "PDA_COMPLETION",
                    subscriberApprovalRequiredByDate: "06/25/2023",
                    state: "PR",
                },
            ] as Enrollments[];
            component.checkforPendingEnrollments();
            expect(component.isStatePR).toBe(true);
            expect(component.isPendingEnrollments).toBe(false);
        });
    });
    describe("loadStep()", () => {
        it("should call loadGuIdSteps() if the guid is there", () => {
            component.guid = "1234";
            component.currentStep = "REVIEWSIGN";
            component.loadStep();
            expect(component.completedStep).toBe(1);
        });
        it("should set completedStep and selectedIndex when currentStep is PDA", () => {
            component.guid = "";
            component.currentStep = "PDA";
            component.isPendingEnrollments = true;
            component.loadStep();
            expect(component.completedStep).toBe(2);
            expect(component.stepper.selectedIndex).toBe(1);
        });
        it("should set completedStep and selectedIndex when currentStep is CONFIRMATION", () => {
            component.currentStep = "CONFIRMATION";
            component.isPendingEnrollments = true;
            component.isPendingPDA = true;
            component.loadStep();
            expect(component.completedStep).toBe(3);
            expect(component.stepper.selectedIndex).toBe(2);
            component.isPendingPDA = false;
            component.loadStep();
            expect(component.stepper.selectedIndex).toBe(1);
            component.isPendingEnrollments = false;
            component.loadStep();
            expect(component.stepper.selectedIndex).toBe(0);
        });
    });
    describe("checkForUnsignedFormPR()", () => {
        it("should check if form is signed and formType is PDA_PR", () => {
            const result1 = component.checkForUnsignedFormPR({ signature: "sign", formType: "PDA_PR" } as PdaForm);
            expect(result1).toBe(true);
            const result2 = component.checkForUnsignedFormPR({ signature: "sign", formType: "PDA" } as PdaForm);
            expect(result2).toBe(false);
        });
    });
    describe("loadGuIdSteps()", () => {
        it("should set completedStep when current step is REVIEWSIGN", () => {
            component.currentStep = "REVIEWSIGN";
            component.loadGuIdSteps();
            expect(component.completedStep).toBe(1);
            expect(component.stepper.selectedIndex).toBe(1);
        });
        it("should set data when currentStep is PDA", () => {
            component.currentStep = "PDA";
            component.isPendingEnrollments = true;
            component.loadGuIdSteps();
            expect(component.completedStep).toBe(2);
            expect(component.stepper.selectedIndex).toBe(2);
        });
        it("should set data when currentStep is CONFIRMATION", () => {
            component.currentStep = "CONFIRMATION";
            component.isPendingEnrollments = true;
            component.isPendingPDA = true;
            component.loadGuIdSteps();
            expect(component.completedStep).toBe(3);
            expect(component.stepper.selectedIndex).toBe(3);
            component.isPendingPDA = false;
            component.loadGuIdSteps();
            expect(component.stepper.selectedIndex).toBe(2);
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
