import { Enrollments, MEMBER_PORTAL } from "@empowered/constants";
import { ReviewFlowService, StepTitle } from "./../services/review-flow.service";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthenticationService, EnrollmentService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CsrfService } from "@empowered/util/csrf";

const REDIRECT_TO_LOGIN = "/member/login";
const GROUP_ID = "groupId";
const GUID = "guid";
@Component({
    selector: "empowered-review-enrollment-flow-main",
    templateUrl: "./review-enrollment-flow-main.component.html",
    styleUrls: ["./review-enrollment-flow-main.component.scss"],
})
export class ReviewEnrollmentFlowMainComponent implements OnInit, OnDestroy {
    private unsubscribe$ = new Subject<void>();
    groupId: number;
    memberId: number;
    guid: string;
    linkExpired = false;
    isSpinnerLoading = false;
    stepTitle = StepTitle;
    completedStep: number;
    currentStep: string;
    enrollments: Enrollments[];
    errorMessage: string;
    successMessage: string;
    errorResponse: boolean;
    agentName: string;
    agentEmail: string;
    agentPhone: string;
    showErrorMessage: boolean;
    verifyUserStep = StepTitle.VERIFY_USER;
    enrollmentSummaryStep = StepTitle.ENROLLMENT_SUMMARY;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.review.expired",
        "primary.portal.enrollment.summary.elected.expired.link.text",
        "primary.portal.enrollment.summary.elected.verify.identify",
        "primary.portal.enrollment.summary.elected.enrollment.summary",
        "primary.portal.review.expired.login",
        "primary.portal.review.expired.access",
    ]);
    @ViewChild("stepper") stepper;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly auth: AuthenticationService,
        private readonly language: LanguageService,
        private readonly enrollmentService: EnrollmentService,
        private readonly csrfService: CsrfService,
        private readonly reviewFlowService: ReviewFlowService,
    ) {}

    /**
     * Life cycle hook to get the configurations and also check whether guid is available or not in url
     */
    ngOnInit(): void {
        this.enrollmentService.pendingEnrollments$.next(true);
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.groupId = params[GROUP_ID];
            this.guid = params[GUID];
            if (this.guid && this.groupId) {
                this.csrfService
                    .load()
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(() => {
                        this.checkLinkValidity();
                    });
            } else {
                this.linkExpired = true;
            }
        });

        this.reviewFlowService.stepChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data === StepTitle.ENROLLMENT_SUMMARY) {
                this.currentStep = StepTitle.ENROLLMENT_SUMMARY;
            } else {
                this.currentStep = StepTitle.VERIFY_USER;
            }
            this.loadStep();
        });

        if (!this.groupId && !this.guid) {
            this.router.navigate([REDIRECT_TO_LOGIN]);
        }
    }

    /**
     * Used to verify the validity of the link
     */
    checkLinkValidity(): void {
        this.isSpinnerLoading = true;
        this.auth
            .verifyHeadsetLink(this.guid, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.linkExpired = false;
                    this.isSpinnerLoading = false;
                    this.errorResponse = false;
                    this.currentStep = StepTitle.VERIFY_USER;
                },
                (error: HttpErrorResponse) => {
                    this.isSpinnerLoading = false;
                    this.linkExpired = true;
                    this.errorResponse = true;
                    this.errorMessage = "";
                    if (error.status === 401) {
                        this.agentName = error.error?.adminName ?? "";
                        this.agentEmail = error.error?.adminEmail ?? "";
                        this.agentPhone = error.error?.adminPhone ?? "";
                        this.errorMessage = this.languageStrings["primary.portal.enrollment.summary.elected.expired.link.text"]
                            .replace("{agentName}", this.agentName)
                            .replace("{agentEmail}", this.agentEmail)
                            .replace("{agentPhone}", this.agentPhone);
                    } else {
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.api." + error.error.status + "." + error.error.code,
                        );
                    }
                },
            );
    }

    /**
     * Function to load the current step on stepper
     */
    loadStep(): void {
        this.stepper.linear = false;
        if (this.currentStep === StepTitle.ENROLLMENT_SUMMARY) {
            this.completedStep = 1;
            this.stepper.selectedIndex = 1;
        } else {
            this.completedStep = 0;
            this.stepper.selectedIndex = 0;
        }

        setTimeout(() => {
            this.stepper.linear = true;
        });
    }

    /**
     * Method to redirect to My Aflac Login
     */
    switchToMyAflac() {
        this.isSpinnerLoading = true;
        this.router.navigate([MEMBER_PORTAL]).then(() => {
            this.isSpinnerLoading = false;
        });
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
