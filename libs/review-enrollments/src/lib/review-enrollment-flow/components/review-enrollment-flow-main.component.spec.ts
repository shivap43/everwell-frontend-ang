import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ReviewEnrollmentFlowMainComponent } from "./review-enrollment-flow-main.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockAuthenticationService, mockActivatedRoute, mockRouter } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { ReviewFlowService, StepTitle } from "../services/review-flow.service";
import { ComponentPortal } from "@angular/cdk/portal";
import { MatStepper } from "@angular/material/stepper";
import { of, throwError } from "rxjs";
import { MatDialogModule } from "@angular/material/dialog";

describe("ReviewEnrollmentFlowMainComponent", () => {
    let component: ReviewEnrollmentFlowMainComponent;
    let fixture: ComponentFixture<ReviewEnrollmentFlowMainComponent>;
    let authenticationService: AuthenticationService;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReviewEnrollmentFlowMainComponent],
            imports: [HttpClientTestingModule, MatDialogModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                ReviewFlowService,

                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReviewEnrollmentFlowMainComponent);
        component = fixture.componentInstance;
        authenticationService = TestBed.inject(AuthenticationService);
        fixture.detectChanges();
        router = TestBed.inject(Router);
        component.stepper = { selectedIndex: 0 } as MatStepper;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("loadStep()", () => {
        it("should set completedStep and stepper selectedIndex to 1 while loading ENROLLMENT_SUMMARY", () => {
            component.currentStep = StepTitle.ENROLLMENT_SUMMARY;
            component.loadStep();
            expect(component.completedStep).toBe(1);
            expect(component.stepper.selectedIndex).toBe(1);
        });

        it("should set completedStep and stepper selectedIndex to 0 default when currentStep is blank or null", () => {
            component.currentStep = "";
            component.loadStep();
            expect(component.completedStep).toBe(0);
            expect(component.stepper.selectedIndex).toBe(0);
        });

        it("should set completedStep and stepper selectedIndex to 0 default when currentStep is other than ENROLLMENT_SUMMARY", () => {
            component.currentStep = "ANY OTHER";
            component.loadStep();
            expect(component.completedStep).toBe(0);
            expect(component.stepper.selectedIndex).toBe(0);
        });
    });

    describe("checkLinkValidity()", () => {
        it("should set linkExpire to false and currentStep to VERIFY_USER when get a success response", () => {
            jest.spyOn(authenticationService, "verifyHeadsetLink").mockReturnValue(of({}));
            component.checkLinkValidity();
            expect(component.linkExpired).toBeFalsy();
            expect(component.currentStep).toBe(StepTitle.VERIFY_USER);
            expect(component.errorResponse).toBeFalsy();
        });

        it("should set linkExpire to true on error response", () => {
            jest.spyOn(authenticationService, "verifyHeadsetLink").mockReturnValue(throwError({}));
            component.checkLinkValidity();
            expect(component.linkExpired).toBeTruthy();
            expect(component.errorResponse).toBeTruthy();
        });

        it("should set linkExpire to true and display the agent info on error response", () => {
            const errorPayload = {
                status: 401,
                statusText: "Bad Request",
                error: { status: 401, code: "link expired", adminName: "Test Name", adminEmail: "test@email.com" },
            };
            component.languageStrings["primary.portal.enrollment.summary.elected.expired.link.text"] =
                "The link has been expired. Please contact {agentName}, email: {agentEmail}, phone: {agentPhone}";
            jest.spyOn(authenticationService, "verifyHeadsetLink").mockReturnValue(throwError(errorPayload));

            component.checkLinkValidity();
            expect(component.linkExpired).toBeTruthy();
            expect(component.errorResponse).toBeTruthy();
            expect(component.errorMessage).toContain("Test Name");
            expect(component.errorMessage).toContain("test@email.com");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("switchToMyAflac()", () => {
        it("should call router", fakeAsync(() => {
            const navigateSpy = jest.spyOn(router, "navigate").mockImplementation(() => Promise.resolve(true));
            component.switchToMyAflac();
            expect(navigateSpy).toHaveBeenCalled();
            tick();
            expect(component.isSpinnerLoading).toBe(false);
        }));
    });
});
