import { ConfigName, CompanyCode, Enrollments, AflacAlwaysStatus, AflacAlwaysEnrollments } from "@empowered/constants";
import { ReviewFlowService, StepTitle } from "./../services/review-flow.service";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import {
    AuthenticationService,
    EnrollmentService,
    MemberService,
    PendingEnrollmentReason,
    StaticService,
    FormType,
    PdaForm,
    Carrier,
    AflacAlwaysService,
} from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { AppFlowService, SetRegex, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { Subject, Observable, forkJoin } from "rxjs";
import { takeUntil, concatMap, filter, switchMap, tap, startWith } from "rxjs/operators";
import { CsrfService } from "@empowered/util/csrf";

export enum ApprovalSteps {
    REVIEW_STEP = 2,
    PDA_STEP = 3,
}
const COMPLETED = "COMPLETED";

@Component({
    selector: "empowered-review-flow-main",
    templateUrl: "./review-flow-main.component.html",
    styleUrls: ["./review-flow-main.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class ReviewFlowMainComponent implements OnInit, OnDestroy {
    loginLanguages: any = [];
    private unsubscribe$ = new Subject<void>();
    memberId: any;
    groupId: any;
    guid: any;
    loginForm: FormGroup;
    isLinear = false;
    firstFormGroup: FormGroup;
    secondFormGroup: FormGroup;
    thirdFormGroup: FormGroup;
    fourthFormGroup: FormGroup;
    linkExpired = true;
    isPda = false;
    isSpinnerLoading = false;
    showComponents = false;
    stepTitle = StepTitle;
    completedStep: number;
    currentStep: string;
    enrollments: Enrollments[];
    reviewAflacAlwaysStatus: string;
    errorMessage: string;
    successMessage: string;
    errorResponse: boolean;
    approvalSteps = ApprovalSteps;
    agentName: any;
    pdaTitle: string;
    agentEmail: any;
    agentPhone: any;
    isPendingEnrollments: boolean;
    isPendingPDA: boolean;
    isStatePR: boolean;
    customerSign: string;
    formId: number;
    formType: string;
    showErrorMessage: boolean;
    isPrPDAConfigEnabled: boolean;
    unsignedPDAForms: PdaForm[];
    isPendingAflacAlwaysEnrollments: boolean;
    aflacAlwaysEnrollments: AflacAlwaysEnrollments[];
    PDAData: any = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.acknowledgetype",
        "primary.portal.enrollment.review.acknowledge",
        "primary.portal.enrollment.review.agent",
        "primary.portal.createReportForm.pda",
        "primary.portal.enrollment.review.agree",
        "primary.portal.enrollment.review.anotherdocument",
        "primary.portal.enrollment.review.application",
        "primary.portal.enrollment.review.approvepda",
        "primary.portal.enrollment.review.birthdate",
        "primary.portal.enrollment.review.business",
        "primary.portal.enrollment.review.byemailat",
        "primary.portal.enrollment.review.calling",
        "primary.portal.common.close",
        "primary.portal.enrollment.review.complete",
        "primary.portal.enrollment.review.completebtn",
        "primary.portal.enrollment.review.confirmation",
        "primary.portal.enrollment.review.confirmidentiy",
        "primary.portal.enrollment.review.consent",
        "primary.portal.enrollment.review.document",
        "primary.portal.enrollment.review.e-signaturev",
        "primary.portal.enrollment.review.edit",
        "primary.portal.enrollment.review.email",
        "primary.portal.enrollment.review.enrollment",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.firstname",
        "primary.portal.enrollment.review.initial",
        "primary.portal.enrollment.review.lastname",
        "primary.portal.enrollment.review.monthly",
        "primary.portal.common.next",
        "primary.portal.enrollment.review.payroll",
        "primary.portal.enrollment.review.question",
        "primary.portal.enrollment.review.reject",
        "primary.portal.enrollment.review.review",
        "primary.portal.enrollment.review.reviewandsign",
        "primary.portal.enrollment.review.reviewcomplete",
        "primary.portal.enrollment.review.reviewinfo",
        "primary.portal.enrollment.review.reviewpda",
        "primary.portal.enrollment.review.reviewplan",
        "primary.portal.enrollment.review.signature",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.signaturefinish",
        "primary.portal.enrollment.review.signout",
        "primary.portal.enrollment.review.submittedsignature",
        "primary.portal.enrollment.review.summary",
        "primary.portal.common.submit",
        "primary.portal.enrollment.review.verify",
        "primary.portal.enrollment.review.verifyidentity",
        "primary.portal.enrollment.review.yourtotalcost",
        "primary.portal.pda.form.viewunsignedpda",
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.coverage.taxstatu",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.shoppingExperience.eliminationPeriod",
        "primary.portal.productExceptions.planName",
        "primary.portal.createReportForm.pda",
        "primary.portal.review.expired",
    ]);
    @ViewChild("stepper") stepper;
    memberRouteDetails: { memberId: any; groupId: any; guid: any };
    carriersData: Carrier[] = [];

    constructor(
        private readonly store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly auth: AuthenticationService,
        private readonly language: LanguageService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly enrollmentService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly csrfService: CsrfService,
        private readonly staticUtilService: StaticUtilService,
        private readonly aflacAlwaysService: AflacAlwaysService,
        private readonly appFlowService: AppFlowService,
    ) {}

    /**
     * Life cycle hook to get the configurations and also check whether guid is available or not in url
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE)
            .pipe(
                filter((prConfig) => prConfig),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.isPrPDAConfigEnabled = true;
            });
        this.enrollmentService.pendingEnrollments$.next(true);
        this.getConfigurationSpecifications();
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.memberId = params["memberId"];
            this.groupId = params["groupId"];
            this.guid = params["guid"];
            if (this.guid) {
                this.csrfService
                    .load()
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((resp) => {
                        this.checkForDirect();
                    });
            } else if (this.memberId && this.groupId) {
                this.checkForPayroll();
            }
        });
        if (this.memberId) {
            this.store.dispatch(new SetRegex());
        }

        // Will be called only if we have guid for getting the PDA Forms
        if (this.guid) {
            this.checkPDACondition()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((PDAData) => {
                    this.setPDAData(PDAData);
                });
        }
        this.serviceCalls();
        this.memberRouteDetails = {
            memberId: this.memberId,
            groupId: this.groupId,
            guid: this.guid,
        };
        this.memberService
            .getAllCompletedForms(this.memberId, this.groupId, true)
            .pipe(
                tap((forms) => (this.unsignedPDAForms = forms.PDA)),
                switchMap((forms) => {
                    const unsignedForms = this.unsignedPDAForms.filter((form) => this.checkForUnsignedFormPR(form));
                    this.isStatePR = !!unsignedForms.length;
                    return forkJoin(unsignedForms.map((form) => this.checkPDACondition(this.memberId)));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((pdaDataList) => pdaDataList.forEach((PDAData) => this.setPDAData(PDAData)));
        this.appFlowService
            .getReviewAflacAlwaysStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((status) => {
                if (status) {
                    this.reviewAflacAlwaysStatus = status;
                }
            });
        if ((!this.memberId || !this.groupId) && !this.guid) {
            this.router.navigate(["/member/login"]);
        }
    }

    /**
     * Used for fetching the memberId and also change the current step as per conditions
     */
    serviceCalls(): void {
        this.reviewFlowService.updateMemberId$
            .pipe(
                tap((memberId) => (this.memberRouteDetails.memberId = memberId)),
                switchMap((memberId) => this.staticUtilService.cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE)),
                tap((prConfig) => (this.isPrPDAConfigEnabled = prConfig)),
                switchMap((prConfig) =>
                    this.enrollmentService
                        .getEnrollments(this.memberRouteDetails.memberId, this.groupId)
                        .pipe(filter((enrollments) => !!enrollments)),
                ),
                tap((enrollments) => {
                    this.enrollments = enrollments;
                    this.checkforPendingEnrollments();
                }),
                switchMap((enrollments) => this.memberService.getAllCompletedForms(this.memberRouteDetails.memberId, this.groupId, true)),
                tap((forms) => {
                    const unsignedForms = forms.PDA.filter((form) => this.checkForUnsignedFormPR(form));
                    this.isStatePR = !!unsignedForms.length;
                }),
                switchMap((forms) => this.checkPDACondition(this.memberRouteDetails.memberId)),
                switchMap((PDAData) =>
                    this.aflacAlwaysService
                        .getAflacAlwaysEnrollments(this.groupId, this.memberRouteDetails.memberId)
                        .pipe(filter((aflacAlwaysEnrollments) => !!aflacAlwaysEnrollments)),
                ),
                tap((aflacAlwaysEnrollments) => {
                    this.aflacAlwaysEnrollments = aflacAlwaysEnrollments;
                    if (this.aflacAlwaysEnrollments?.length) {
                        this.aflacAlwaysEnrollments.forEach((enroll) => {
                            if (enroll.aflacAlwaysStatus && enroll.aflacAlwaysStatus === AflacAlwaysStatus.PENDING_CUSTOMER_SIGNATURE) {
                                this.isPendingAflacAlwaysEnrollments = true;
                            }
                        });
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((PDAData) => {
                this.PDAData = PDAData;
                if (this.isPendingEnrollments || this.isPendingAflacAlwaysEnrollments) {
                    this.currentStep = StepTitle.REVIEW_SIGN;
                } else if (this.isPendingPDA) {
                    this.currentStep = StepTitle.PDA;
                } else {
                    this.currentStep = StepTitle.CONFIRMATION;
                }
                this.loadStep();
                this.setPDAData(this.PDAData);
            });

        this.reviewFlowService.stepChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data === StepTitle.REVIEW_SIGN) {
                if (this.isPendingPDA) {
                    this.currentStep = StepTitle.PDA;
                } else {
                    this.currentStep = StepTitle.CONFIRMATION;
                }
            } else {
                this.currentStep = StepTitle.CONFIRMATION;
            }
            this.loadStep();
        });
    }

    /**
     * Used to verify Headset mode and also set values to different global variables
     */
    checkForDirect(): void {
        this.auth
            .verifyHeadsetLink(this.guid, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.linkExpired = false;
                    this.isSpinnerLoading = false;
                    this.showComponents = true;
                    this.errorResponse = false;
                    this.currentStep = StepTitle.VERIFY_USER;
                },
                (error: HttpErrorResponse) => {
                    this.isSpinnerLoading = false;
                    this.linkExpired = true;
                    this.showComponents = true;
                    this.errorResponse = true;
                    this.errorMessage = "";

                    if (error.status === 401) {
                        this.agentName = error.error?.adminName ?? "";
                        this.agentEmail = error.error?.adminEmail ?? "";
                        this.agentPhone = error.error?.adminPhone ?? "";
                    } else {
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.api." + error.error.status + "." + error.error.code,
                        );
                        this.showErrorMessage = true;
                    }
                },
            );
    }

    /**
     * Get Enrollments Data and also check and set PDA data.
     */
    checkForPayroll(): void {
        this.enrollmentService
            .getEnrollments(this.memberId, this.groupId)
            .pipe(
                tap((enrollments) => {
                    this.enrollments = enrollments;
                    this.checkforPendingEnrollments();
                }),
                switchMap((resp) => this.checkPDACondition(this.memberId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((PDAData) => {
                this.setPDAData(PDAData);
            });
    }

    /**
     * Get the customer signature data from /static/configs API
     */
    getConfigurationSpecifications(): void {
        this.staticService
            .getConfigurations("user.enrollment.telephone_signature_placeholder", this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.customerSign = data[0].value.split(",")[0];
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    this.showErrorMessage = true;
                },
            );
    }

    /**
     * Set the PDA data as per the data we get from backend.
     * @param PdaForm[] Array of PDA Forms for a particular member ID
     */
    setPDAData(param: PdaForm[]): void {
        if (param) {
            const pdaFormsList = param;

            // Following condition is for checking if any PDA form is there or not
            if (pdaFormsList.length) {
                for (const pda of param) {
                    if (pda.signature === this.customerSign || pda.signature === "") {
                        this.formId = pda.id;
                        this.formType = pda.formType;
                        this.isPda = true;
                        this.pdaTitle = this.languageStrings["primary.portal.createReportForm.pda"];
                        this.isPendingPDA = true;
                    }
                }
            }
            this.checkForCurrentStep();
        }
    }

    /**
     * Returns observable of PDA data based on the different scenarios involving member ID
     * @param memId Based on this value we determine which memberId to be passed
     */
    checkPDACondition(memId?: number): Observable<PdaForm[]> {
        if (memId) {
            return this.getPDAFormData(memId);
        }
        return this.reviewFlowService.updateMemberId$.pipe(concatMap((memberId) => this.getPDAFormData(memberId)));
    }

    /**
     * Get the PDA forms for each member.
     * @param memId Used to fetch the PDA of a particular member ID
     * @returns Observable<[PdaForm[]>
     */
    getPDAFormData(memId: number): Observable<PdaForm[]> {
        const formType = this.isStatePR && this.isPrPDAConfigEnabled ? FormType.PDA_PR : FormType.PDA;
        return this.memberService.getMemberFormsByType(memId, formType, this.groupId, COMPLETED);
    }

    /**
     * Get the current step of the user based on conditions
     */
    checkForCurrentStep(): void {
        if (this.isPendingEnrollments || this.isPendingAflacAlwaysEnrollments) {
            this.currentStep = StepTitle.REVIEW_SIGN;
        } else if (this.isPendingPDA) {
            this.currentStep = StepTitle.PDA;
        } else if (this.completedStep >= ApprovalSteps.PDA_STEP) {
            this.currentStep = StepTitle.CONFIRMATION;
        } else {
            this.currentStep = StepTitle.VERIFY_USER;
        }
        this.showComponents = true;
        this.linkExpired = false;
        this.isSpinnerLoading = false;
        this.loadStep(true);
    }

    /**
     * Function to check for any pending enrollment and check te residing state of the member
     */
    checkforPendingEnrollments(): void {
        if (this.unsignedPDAForms?.length) {
            this.unsignedPDAForms.forEach((form) => {
                if (this.checkForUnsignedFormPR(form)) {
                    this.isStatePR = true;
                    return;
                }
            });
        }
        if (this.enrollments?.length) {
            this.enrollments.forEach((enroll) => {
                if (
                    enroll.pendingReason &&
                    enroll.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE &&
                    enroll.subscriberApprovalRequiredByDate &&
                    this.utilService.isPastDate(enroll.subscriberApprovalRequiredByDate)
                ) {
                    this.isPendingEnrollments = true;
                    if (enroll.state === CompanyCode.PR) {
                        this.isStatePR = true;
                    }
                } else if (
                    enroll.pendingReason &&
                    enroll.pendingReason === PendingEnrollmentReason.PDA_COMPLETION &&
                    enroll.subscriberApprovalRequiredByDate &&
                    this.utilService.isPastDate(enroll.subscriberApprovalRequiredByDate)
                ) {
                    this.isStatePR = true;
                }
            });
        }
    }

    /**
     * Checks if the unsigned PDA forms are of PR state
     * @param {PdaForm} form
     * @returns {boolean} true if state is PR
     */
    checkForUnsignedFormPR(form: PdaForm): boolean {
        return form.signature && form.formType === FormType.PDA_PR;
    }

    /**
     * Function to add steps for Approval based on the scenerio for guId
     * @param onLoad Used for determining if validity of the previous steps to be checked or not
     */
    loadStep(onLoad?: boolean): void {
        if (!onLoad) {
            this.stepper.linear = false;
        }
        if (this.guid) {
            this.loadGuIdSteps();
        } else {
            switch (this.currentStep) {
                case StepTitle.PDA:
                    this.completedStep = ApprovalSteps.REVIEW_STEP;
                    if (this.isPendingEnrollments) {
                        this.stepper.selectedIndex = 1;
                    }
                    break;
                case StepTitle.CONFIRMATION:
                    this.completedStep = ApprovalSteps.PDA_STEP;
                    if (this.isPendingEnrollments && this.isPendingPDA) {
                        this.stepper.selectedIndex = ApprovalSteps.REVIEW_STEP;
                    } else if (this.isPendingEnrollments || this.isPendingPDA) {
                        this.stepper.selectedIndex = 1;
                    } else {
                        this.stepper.selectedIndex = 0;
                    }
                    break;
            }
        }
        if (!onLoad) {
            this.stepper.linear = true;
        }
    }

    /**
     * Function to add steps for Approval flow if guId is present in URL
     */
    loadGuIdSteps(): void {
        if (this.currentStep === StepTitle.REVIEW_SIGN) {
            this.completedStep = 1;
            this.stepper.selectedIndex = 1;
        } else if (this.currentStep === StepTitle.PDA) {
            this.completedStep = ApprovalSteps.REVIEW_STEP;
            if (this.isPendingEnrollments || (this.enrollments && this.isPendingPDA)) {
                this.stepper.linear = false;
                this.stepper.selectedIndex = ApprovalSteps.REVIEW_STEP;
                this.stepper.linear = true;
            }
        } else if (this.currentStep === StepTitle.CONFIRMATION) {
            this.completedStep = ApprovalSteps.PDA_STEP;

            if ((this.isPendingEnrollments || this.guid) && this.isPendingPDA) {
                this.stepper.selectedIndex = ApprovalSteps.PDA_STEP;
            } else {
                this.stepper.selectedIndex =
                    this.isPendingEnrollments || this.isPendingPDA || this.reviewAflacAlwaysStatus ? ApprovalSteps.REVIEW_STEP : 0;
            }
        }
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
