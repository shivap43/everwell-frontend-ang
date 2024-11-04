import {
    EnrollmentState,
    UpdateApplicationResponse,
    UpdateConstraintValues,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { MemberService, InputType, ShoppingCartDisplayService, AflacService, EnrollmentService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatRadioChange } from "@angular/material/radio";
import {} from "@empowered/shared";
import { Observable, Subject } from "rxjs";

import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { switchMap, tap, takeUntil, filter, map } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";

import {
    ConfigName,
    QleTypeId,
    StepConstraints,
    StepData,
    AllConstraint,
    AppSettings,
    Enrollments,
    ApplicationResponse,
    MemberQualifyingEvent,
    StepType,
} from "@empowered/constants";
import { DateService } from "@empowered/date";

const constraintIS = "IS_";
const POLICY_NOT_FOUND = "secondary.portal.applicationFlow.conversion.policyNotFound";

@Component({
    selector: "empowered-conversion",
    templateUrl: "./conversion.component.html",
    styleUrls: ["./conversion.component.scss"],
    providers: [DatePipe],
})
export class ConversionComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId: number;
    importRequired: boolean;
    includePolicyImport: boolean;
    stepId: number;
    cartId: number;
    date: string;
    form: FormGroup;
    radioValue: string;
    policyToBeShown: boolean;
    body: string;
    policyText: string;
    inputType = InputType;
    validationRegex: any;
    showSpinner: boolean;
    radioError = false;
    applicationResponse = [];
    hasApiError: boolean;
    mpGroup: number;
    memberId: number;
    errorMessage: string;
    stepData;
    disableRadio = false;
    hasAflacAlways = false;
    hasEBSBilling = false;
    fromDirect = false;
    private unsubscribe$ = new Subject<void>();
    policyToggle = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.requiredField",
        "primary.portal.common.yes",
        "primary.portal.common.no",
        "primary.portal.common.next",
        "primary.portal.applicationFlow.conversion.policyNumber",
        "primary.portal.applicationFlow.conversion.nextFinishApplications",
        "primary.portal.applicationFlow.conversion.nextAflacAlways",
        "primary.portal.applicationFlow.conversion.nextBilling",
        "primary.portal.applicationFlow.conversion.next",
        "primary.portal.applicationFlow.conversion.policyHolderBirthdate",
        "primary.portal.applicationFlow.conversion.policyNotFound",
        "primary.portal.applicationFlow.conversion.MustBeAlphaNumCharacters",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.errorResponse",
        "secondary.portal.common.errorSavingResponse",
        "secondary.portal.applicationFlow.conversion.policyNotEligible",
        "secondary.portal.applicationFlow.conversion.fetchingAncillaryinfo",
        "secondary.portal.applicationFlow.conversion.fetchingAflacService",
        POLICY_NOT_FOUND,
    ]);
    @Select(SharedState.regex) regex$: Observable<any>;
    currentQualifyingEvents: MemberQualifyingEvent[] = [];
    enableToggle: boolean;
    enrollments: Enrollments[] = [];

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly aflacService: AflacService,
        private readonly appFlowService: AppFlowService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly datePipe: DatePipe,
        private readonly staticUtil: StaticUtilService,
        private readonly dateService: DateService,
        private readonly enrollmentService: EnrollmentService,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.planId = this.planObject.application.appData.planId;
        this.cartId = this.planObject.application.cartData.id;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        if (this.planObject.steps.length) {
            this.stepData = this.planObject.steps[0];
        }
        this.stepId = this.stepData.id;
        this.getResponse();
        this.checkAflacAlways();
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();

        this.staticUtil
            .cacheConfigEnabled(ConfigName.POLICY_CANCELLATION_TOGGLE)
            .pipe(
                tap((resp) => (this.enableToggle = resp)),
                filter((isEnabled) => isEnabled),
                switchMap((isEnabled) => this.memberService.getMemberQualifyingEvents(this.memberId, this.mpGroup)),
                switchMap((qle) =>
                    this.enrollmentService.getEnrollments(this.memberId, this.mpGroup).pipe(
                        map((enrollments) => ({
                            qle: qle,
                            enrollments: enrollments,
                        })),
                    ),
                ),
                tap((resp) => {
                    this.currentQualifyingEvents = resp.qle;
                    this.enrollments = resp.enrollments;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to check next step
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    getResponse(): void {
        this.applicationResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        this.initializeForm();
        this.getBody();
        this.getMemberBirthday();
    }
    getBody(): void {
        if (
            this.stepData.type === StepType.CONVERSION ||
            this.stepData.type === StepType.ADDITION ||
            this.stepData.type === StepType.DOWNGRADE
        ) {
            this.body = this.appFlowService.getRenderedText(this.stepData.body);
            this.policyText = this.stepData.policyNumberText;
            this.importRequired = this.stepData.importRequired;
            this.includePolicyImport = this.stepData.includePolicyImport;
            if (!this.body) {
                this.policyToBeShown = true;
            }
            if (this.importRequired) {
                this.disableRadio = true;
                this.policyToBeShown = true;
                this.radioValue = AppSettings.YES;
            }
        }
    }
    /**
     * This method is used to get the member's birth date and to initialize the values of the form
     */
    getMemberBirthday(): void {
        const birthDate = this.store.selectSnapshot(EnrollmentState.GetMemberData).info.birthDate;
        this.date = this.formatDate(this.dateService.toDate(this.utilService.getCurrentTimezoneOffsetDate(birthDate.toString())));
        const item = this.applicationResponse.filter((element) => element.planId === this.planId).pop();
        let prepopulateData;
        if (item) {
            prepopulateData = item.response.filter((res) => res.stepId === this.stepId).pop();
        }
        if (this.planObject.application.isAdditionalUnit && this.stepData.type === StepType.CONVERSION) {
            let policy: string;
            const constraintValues: StepConstraints = this.store
                .selectSnapshot(EnrollmentState.GetConstraint)
                .filter((constraintData) => constraintData.flowId === this.planObject.application.appData.id)
                .pop();
            if (constraintValues) {
                policy = constraintValues[AllConstraint.CURRENT_POLICY_NUMBER];
            }
            this.radioValue = AppSettings.YES;
            this.policyToBeShown = true;
            this.initializeForm(this.radioValue, policy);
        } else if (prepopulateData && prepopulateData.value.length) {
            const questionValue = prepopulateData.value[0].question;
            this.radioValue = questionValue;
            this.initializeForm(questionValue, prepopulateData.value[0].policyNumber);
            if (this.radioValue === AppSettings.YES && this.stepData.type === StepType.CONVERSION) {
                this.policyToBeShown = true;
            }
        } else {
            const constraintValues: StepConstraints = this.store
                .selectSnapshot(EnrollmentState.GetConstraint)
                .find((constraintData) => constraintData.flowId === this.planObject.application.appData.id);
            this.initializeForm("", constraintValues[AllConstraint.CURRENT_POLICY_NUMBER]);
        }
    }
    initializeForm(question?: string, policy?: string): void {
        this.form = this.fb.group({
            question: this.importRequired ? [AppSettings.YES] : [question],
            policy: [policy, [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMBERCHECK))]],
            date: [this.date],
        });
        if (this.planObject.application.isAdditionalUnit && this.stepData.type === StepType.CONVERSION) {
            this.form.controls.question.disable();
            this.form.controls.policy.disable();
        }
        this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (
                this.form.dirty &&
                !this.planObject.rider &&
                (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                if (this.planObject.reinstate) {
                    this.appFlowService.updateReinstateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                    });
                } else {
                    this.appFlowService.updateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                        planObject: this.planObject,
                    });
                }
            }
        });
    }
    formatDate(date: Date): string {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }
    getRadioValue(event: MatRadioChange): void {
        this.hasApiError = false;
        this.radioValue = event.value;
        this.radioError = false;
        this.showPolicy();
    }
    showPolicy(): void {
        if (this.radioValue) {
            this.radioError = false;
            if (
                this.radioValue === AppSettings.YES &&
                (this.importRequired || this.includePolicyImport || (this.policyText && this.stepData.type === StepType.CONVERSION))
            ) {
                this.policyToBeShown = true;
            } else {
                this.policyToBeShown = false;
            }
        } else {
            this.radioError = true;
        }
    }
    hasImport(): boolean {
        let returnValue = false;
        if (this.includePolicyImport || this.importRequired || (this.policyText && this.stepData.type === StepType.CONVERSION)) {
            returnValue = true;
        }
        return returnValue;
    }
    saveChoice(): void {
        if (this.radioValue) {
            this.showSpinner = true;
            const payload = [];
            payload.push({ question: this.radioValue });
            const schema: ApplicationResponse = {
                stepId: this.stepId,
                type: this.stepData.type,
                value: payload,
            };
            this.saveApplicationResp(schema);
            this.store.dispatch(
                new UpdateConstraintValues(constraintIS + this.stepData.type.toUpperCase(), false, this.planObject.application.appData.id),
            );
        } else {
            this.radioError = true;
        }
    }
    saveApplicationResp(payload: ApplicationResponse): void {
        this.shoppingCartService
            .saveApplicationResponse(this.memberId, this.cartId, this.mpGroup, [payload])
            .pipe(
                tap(
                    () => {
                        this.store.dispatch(new UpdateApplicationResponse(this.memberId, this.cartId, this.mpGroup));
                    },
                    () => {
                        this.handleSecondaryError("secondary.portal.common.errorSavingResponse");
                    },
                ),
                switchMap(() => this.shoppingCartService.getAncillaryInformation(this.memberId, this.cartId, this.mpGroup, this.planId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (res) => {
                    this.appFlowService.patchConstraint(this.planObject.application.appData.id, "", res);
                    this.showSpinner = false;
                    this.nextStep();
                },
                () => {
                    this.handleSecondaryError("secondary.portal.common.errorResponse");
                },
            );
    }
    nextStep(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * This method is used to check the validity of the policy. The policy lookup call will be made based on current qle and its criteria
     */
    validatePolicy(): void {
        const value = this.form.controls.policy.value;
        if (this.form.valid) {
            this.showSpinner = true;
            const productId = this.planObject.application.productId;
            let enrollments: Enrollments[] = [];
            const payload = [];
            let schema: ApplicationResponse;
            this.hasApiError = false;
            const currentProductEnrollment = this.enrollments?.find(
                (enrollment) => enrollment.plan?.productId === this.planObject?.application?.productId,
            );

            const isCurrentProductPolicyCancellationInitiated = this.currentQualifyingEvents
                ?.filter((qualifyingEvent) => qualifyingEvent.type?.id === QleTypeId.BY_REQUEST)
                ?.find((item) => item.id === currentProductEnrollment?.qualifyingEventId);
            if (
                (this.importRequired || this.includePolicyImport) &&
                !this.planObject.application.isAdditionalUnit &&
                (this.enableToggle
                    ? !this.currentQualifyingEvents.length ||
                      (this.currentQualifyingEvents.length && !isCurrentProductPolicyCancellationInitiated)
                    : true)
            ) {
                const isConversionFlow = !!(this.stepData.type === StepType.CONVERSION);
                this.aflacService
                    .policyLookup(this.memberId, value, this.mpGroup, productId, isConversionFlow)
                    .pipe(
                        tap(() => {
                            payload.push({ question: AppSettings.YES, policyNumber: value });
                            schema = {
                                stepId: this.stepId,
                                type: this.stepData.type,
                                value: payload,
                            };
                        }),
                        switchMap((resp) => {
                            enrollments = resp.enrollments;
                            return this.shoppingCartService.getAncillaryInformation(this.memberId, this.cartId, this.mpGroup, this.planId);
                        }),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe(
                        (res) => {
                            if (
                                res &&
                                (res.conversionEligible || this.stepData.type !== StepType.CONVERSION) &&
                                (res.downgradeEligible || this.stepData.type !== StepType.DOWNGRADE) &&
                                (res.additionEligible || this.stepData.type !== StepType.ADDITION)
                            ) {
                                const enrollmentData: Enrollments = enrollments
                                    .filter((enrollment) => !enrollment.riderOfEnrollmentId)
                                    .pop();
                                this.appFlowService.updateAncillary(enrollmentData.coverageLevelId);
                                this.saveApplicationResp(schema);
                            } else {
                                this.handleSecondaryError("secondary.portal.applicationFlow.conversion.policyNotEligible");
                            }
                        },
                        (error) => {
                            if (error.status === AppSettings.API_RESP_400) {
                                this.form.controls.policy.setErrors({ policy: true });
                                this.showSpinner = false;
                            } else if (error.status === AppSettings.API_RESP_503) {
                                this.handleSecondaryError("secondary.portal.applicationFlow.conversion.fetchingAflacService");
                            } else {
                                this.handleSecondaryError(null, error);
                            }
                        },
                    );
            } else if (
                (this.policyText && this.stepData.type === StepType.CONVERSION) ||
                this.stepData.type === StepType.DOWNGRADE ||
                this.planObject.application.isAdditionalUnit ||
                (this.stepData.type === StepType.CONVERSION && isCurrentProductPolicyCancellationInitiated)
            ) {
                payload.push({ question: this.radioValue, policyNumber: value });
                schema = {
                    stepId: this.stepId,
                    type: this.stepData.type,
                    value: payload,
                };
                this.saveApplicationResp(schema);
                this.store.dispatch(
                    new UpdateConstraintValues(
                        constraintIS + this.stepData.type.toUpperCase(),
                        true,
                        this.planObject.application.appData.id,
                    ),
                );
            }
        }
    }
    /**
     * Handles secondary error showing secondary error message on screen
     * @param errorMessageKey error message key to be displayed
     * @param error api error response
     */
    handleSecondaryError(errorMessageKey?: string, error?: HttpErrorResponse): void {
        this.showSpinner = false;
        this.hasApiError = true;
        if (errorMessageKey) {
            this.errorMessage = this.languageSecondStringsArray[errorMessageKey];
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.applicationFlow.api.${error.error.status}.${error.error.code}`,
            );
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
