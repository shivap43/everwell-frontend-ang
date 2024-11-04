import {
    SetAflacAlways,
    SetPayment,
    CopyCartData,
    EnrollmentState,
    UpdateApplicationResponse,
    DiscardCartItem,
    SetReinstateItem,
    DualPlanYearState,
    SharedState,
    AppFlowService,
} from "@empowered/ngxs-store";

import { takeUntil, tap, filter, switchMap, timeout } from "rxjs/operators";
import { Component, OnInit, Input, OnDestroy, ViewChild } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { MemberService, InputType, ShoppingCartDisplayService, AflacService, ShoppingService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatRadioChange } from "@angular/material/radio";
import { MonDialogData } from "@empowered/ui";
import { Observable, Subject, forkJoin } from "rxjs";
import { MatDialogConfig } from "@angular/material/dialog";
import { ReinstateDialogComponent } from "../reinstate-dialog/reinstate-dialog.component";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";
import { ReinstateInfoModalComponent } from "../reinstate-info-modal/reinstate-info-modal.component";

import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ResponsePanel,
    ReinstateResponse,
    BasePlanApplicationPanel,
    ResponseItem,
    Reinstate,
    StepData,
    TpiSSOModel,
    AppSettings,
    GetCartItems,
    Enrollments,
    ApplicationResponse,
    StepType,
    DateFormats,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const TWO_SECONDS = 2000;

interface ReinstateCompletedData {
    completed: boolean;
    planName: string;
}

const POLICY_NOT_FOUND = "secondary.portal.applicationFlow.conversion.policyNotFound";
@Component({
    selector: "empowered-reinstatement",
    templateUrl: "./reinstatement.component.html",
    styleUrls: ["./reinstatement.component.scss"],
})
export class ReinstatementComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    @Input() policyData: string;
    @ViewChild("reinstateInfoModal", { static: true }) reinstateInfoModal;
    @ViewChild("reinstateModal") reinstateModal;
    @Input() tpiSSODetails: TpiSSOModel;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId: number;
    importRequired: boolean;
    stepId: number;
    cartId: number;
    date: string;
    form: FormGroup;
    importRadioValue: string;
    policyToBeShown: boolean;
    body: string;
    policyText: string;
    inputType = InputType;
    validationRegex: any;
    showSpinner: boolean;
    radioError = false;
    applicationResponse: ResponseItem[] = [];
    hasApiError: boolean;
    mpGroup: number;
    memberId: number;
    errorMessage: string;
    productName: string;
    isMandatory = false;
    isOptional = false;
    isNotEligible = false;
    isDiscard = false;
    policyNumber: string;
    stepData;
    enrollmentData: any;
    denied: boolean;
    deniedText: string;
    isReinstateRequired: boolean;
    dialogRef;
    yesValue = "yes";
    noValue = "no";
    mandatory = "MANDATORY";
    optional = "OPTIONAL";
    enrollments: Enrollments[];
    cartItems: GetCartItems[];
    private readonly unsubscribe$ = new Subject<void>();
    reinstateSubTitle: string;
    reinstateAlertMessage: string;
    applicationList: BasePlanApplicationPanel[] = [];
    reinstateOption: string;
    readonly KEEP = "keep";
    readonly APPLY = "apply";
    reinstatedPlanName: string;
    reinstateOptionSelectionError: boolean;
    dialogData: MonDialogData;
    coverageSummaryUrl: string;
    @Select(SharedState.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.yes",
        "primary.portal.common.no",
        "primary.portal.applicationFlow.reinstate.productPolicyimport",
        "primary.portal.applicationFlow.reinstate.policyholderBirthdate",
        "primary.portal.applicationFlow.reinstate.matchingPolicyfound",
        "primary.portal.applicationFlow.reinstate.eligiblePolicy",
        "primary.portal.applicationFlow.reinstate.productnameCoverage",
        "primary.portal.applicationFlow.reinstate.withoutProductname",
        "primary.portal.applicationFlow.conversion.policyNumber",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.common.gotIt",
        "primary.portal.applicationFlow.confirmation.viewCoverageSummary",
        "primary.portal.applicationFlow.policyReinstated",
        "primary.portal.applicationFlow.reinstate.sameSubtitle",
        "primary.portal.applicationFlow.reinstate.sameAlertMessage",
        "primary.portal.applicationFlow.reinstate.diffAlertMessage",
        "primary.portal.applicationFlow.reinstate.diffMul.subTitle",
        "primary.portal.applicationFlow.reinstate.diffSin.subTitle",
        "primary.portal.applicationFlow.reinstate.complete",
        "primary.portal.applicationFlow.reinstate.option",
        "primary.portal.applicationFlow.reinstate.keep",
        "primary.portal.applicationFlow.reinstate.allow",
        "primary.portal.common.next",
        "primary.portal.applicationFlow.reinstate.declineReinstate",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.reinstate.musteightalphnum",
        "secondary.portal.applicationFlow.reinstate.invalidPolicynumber",
        "secondary.portal.applicationFlow.question.selectionRequired",
        "secondary.portal.common.errorMemberBirthday",
        "secondary.portal.common.errorResponse",
        "secondary.portal.common.errorSavingResponse",
        "secondary.portal.common.errorAncillaryInformation",
        "secondary.portal.common.errorAflacService",
        "secondary.portal.common.errorDeletingCart",
        "secondary.portal.applicationFlow.question.selectionRequired",
        "secondary.portal.applicationFlow.policyNotRecognized",
        POLICY_NOT_FOUND,
    ]);

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly aflacService: AflacService,
        private readonly appFlowService: AppFlowService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly shoppingService: ShoppingService,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
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
        this.productName = this.planObject.application.productName;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        if (this.planObject.steps.length) {
            this.stepData = this.planObject.steps[0];
        }
        this.stepId = this.stepData.id;
        if (!this.planObject.reinstate) {
            this.resumeReinstate();
        }
        this.getResponse();
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        this.memberService
            .getReinstatementPopupStatus()
            .pipe(
                filter((resp) => resp),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((resp) => {
                this.resumeReinstate();
                this.memberService.setReinstatementPopupStatus(false);
            });
    }
    /**
     * Logic to check and resume reinstate flow
     */
    resumeReinstate(): void {
        const reinstateData = this.store.selectSnapshot(EnrollmentState.GetReinstate);
        if (
            reinstateData &&
            reinstateData.isReinstate &&
            reinstateData.enrollments &&
            reinstateData.enrollments.length &&
            reinstateData.cartItemId === this.cartId
        ) {
            this.enrollments = reinstateData.enrollments;
            this.enrollmentData = this.enrollments.filter((enrollment) => !enrollment.riderOfEnrollmentId).pop();
            if (this.enrollmentData.reinstatement === this.mandatory) {
                this.isMandatory = true;
            } else {
                this.isOptional = true;
            }
            this.policyNumber = reinstateData.policyNumber;
            this.appFlowService.updateActiveStepDetails$.next({
                currentSectionIndex: this.planObject.currentSection.sectionId,
                currentStepIndex: this.planObject.currentStep,
                planObject: this.planObject,
            });
            this.openModal();
        }
    }
    getResponse(): void {
        this.applicationResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        this.getBody();
        this.initializeForm();
        this.getMemberBirthday();
    }
    /**
     * get the message to display for the reinstatement
     */
    getBody(): void {
        if (this.stepData.type === StepType.REINSTATEMENT) {
            this.body = this.stepData.body;
            this.policyText = this.stepData.policyNumberText;
            this.importRequired = this.stepData.includePolicyImport;
            // TODO - Need to remove hardcoded and implement language
            this.deniedText = this.stepData.deniedText
                ? this.stepData.deniedText
                : this.languageStrings["primary.portal.applicationFlow.reinstate.declineReinstate"].replace(
                    "##productName##",
                    this.productName,
                );
            if (this.stepData.type === StepType.REINSTATEMENT && !this.body) {
                // FIXME Hardcoding body as it is not coming from API.
                this.body = "Do you have an existing " + this.planObject.application.productName + " policy?";
                this.importRequired = true;
            }
            if (!this.body) {
                this.policyToBeShown = true;
            }
        }
    }
    /**
     * gets member birth date and cart items and loads the data
     */
    getMemberBirthday(): void {
        this.showSpinner = true;
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        forkJoin(
            this.memberService.getMember(this.memberId, false, this.mpGroup.toString()),
            this.shoppingService.getCartItems(this.memberId, this.mpGroup, "planOfferingId", planYearId),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.showSpinner = false;
                    const birthDate: string = resp[0].body.birthDate;
                    this.cartItems = resp[1];
                    this.date = this.formatDate(birthDate);
                    const item: ResponseItem = this.applicationResponse.filter((element) => element.planId === this.planId).pop();
                    let prePopulateData: ResponsePanel;
                    if (item) {
                        prePopulateData = item.response.filter((res) => res.stepId === this.stepId).pop();
                    }
                    if (this.policyNumber) {
                        this.importRadioValue = this.yesValue;
                        this.policyToBeShown = true;
                        this.initializeForm(this.yesValue, this.policyNumber);
                        if (this.isMandatory) {
                            this.form.controls.mandatoryQuestion.setValue(this.yesValue);
                        } else if (this.isOptional) {
                            this.form.controls.optionalQuestion.setValue(this.yesValue);
                        }
                    } else if (prePopulateData && prePopulateData.value.length) {
                        const previousResponse: ReinstateResponse = prePopulateData.value[0] as ReinstateResponse;
                        this.importRadioValue = previousResponse.question;
                        this.initializeForm(previousResponse.question, previousResponse.policyNumber);
                    } else {
                        this.initializeForm();
                    }
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorMemberBirthday"];
                },
            );
    }
    initializeForm(question?: string, policy?: string): void {
        if (policy && this.importRequired) {
            this.policyToBeShown = true;
        }
        this.form = this.fb.group({
            question: [question],
            policy: [policy, [Validators.required, Validators.pattern(new RegExp(this.validationRegex.NUMBERCHECK))]],
            date: [this.date],
            mandatoryQuestion: [null],
            optionalQuestion: [null],
        });
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
            this.hasApiError = false;
        });
    }
    formatDate(date: string): string {
        return this.datepipe.transform(this.dateService.toDate(date), DateFormats.MONTH_DAY_YEAR);
    }
    getImportRadioValue(event: MatRadioChange): void {
        this.importRadioValue = event.value;
        this.radioError = false;
        this.showPolicy();
    }

    reinstateRadioValue(event: any): void {
        if (event.value === "no" && this.isMandatory) {
            this.isDiscard = true;
        } else {
            this.isDiscard = false;
        }
    }
    /**
     * save the reinstatement or response to optional questions based on the question type
     */
    reinstate(): void {
        this.radioError = true;
        if (this.isOptional && this.form.controls.optionalQuestion.value === this.noValue) {
            this.saveChoice(this.noValue);
        } else if (!this.isOptional && this.form.controls.mandatoryQuestion.value) {
            const reinstate: Reinstate = {
                enrollments: this.enrollments,
                policyNumber: this.policyNumber,
                cartItemId: this.cartId,
            };
            this.store.dispatch(new SetReinstateItem(reinstate));
            this.openModal();
        }
    }
    showPolicy(): void {
        if (this.importRadioValue) {
            this.radioError = false;
            if (this.importRadioValue === "yes") {
                this.policyToBeShown = this.importRequired ? true : false;
                this.isDiscard = false;
            } else {
                this.policyToBeShown = false;
                this.isDiscard = this.importRequired ? false : true;
            }
            this.isReinstateRequired = this.importRequired ? false : true;
            this.isNotEligible = false;
            this.isMandatory = false;
            this.isOptional = false;
        } else {
            this.radioError = true;
        }
    }
    /**
     * saves user choice for reinstate question
     * @param value user choice (yes or no)
     */
    saveChoice(value?: string): void {
        if (this.importRadioValue) {
            this.showSpinner = true;
            const payload = [];
            if (this.policyData && this.planObject.reinstate) {
                payload.push({ question: value ? value : this.importRadioValue, policyNumber: this.policyData });
                this.store.dispatch(new CopyCartData(this.cartItems));
            } else {
                payload.push({ question: value ? value : this.importRadioValue });
            }
            const schema: ApplicationResponse = {
                stepId: this.stepId,
                type: this.stepData.type,
                value: payload,
            };
            this.saveApplicationResp(schema);
        } else {
            this.radioError = true;
        }
    }
    saveApplicationResp(payload: ApplicationResponse): void {
        this.showSpinner = false;
        this.shoppingCartService
            .saveApplicationResponse(this.memberId, this.cartId, this.mpGroup, [payload])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.store
                        .dispatch(new UpdateApplicationResponse(this.memberId, this.cartId, this.mpGroup))
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(
                            (resp) => {
                                this.showSpinner = false;
                                this.nextStep();
                            },
                            (error) => {
                                this.showSpinner = false;
                                this.hasApiError = true;
                                // TODO error message should come from language
                                this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorResponse"];
                            },
                        );
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorSavingResponse"];
                },
            );
    }
    nextStep(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * validates entered policy for reinstatement
     */
    validatePolicy(): void {
        this.policyNumber = this.form.controls.policy.value;
        if (this.form.valid) {
            this.showSpinner = true;
            const productId = this.planObject.application.productId;
            let isValidPolicy = false;
            this.aflacService
                .policyLookup(this.memberId, this.policyNumber, this.mpGroup, productId)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap(
                        (resp) => {
                            if (resp.policyEnrollable) {
                                if (resp.enrollments) {
                                    this.enrollments = resp.enrollments;
                                    this.enrollmentData = resp.enrollments.filter((enrollment) => !enrollment.riderOfEnrollmentId).pop();
                                    if (
                                        this.enrollmentData &&
                                        this.enrollmentData.reinstatement &&
                                        (this.enrollmentData.reinstatement === this.mandatory ||
                                            this.enrollmentData.reinstatement === this.optional)
                                    ) {
                                        if (this.enrollmentData.reinstatement === this.mandatory) {
                                            this.isMandatory = true;
                                        } else {
                                            this.isOptional = true;
                                        }
                                        isValidPolicy = true;
                                    } else {
                                        this.isNotEligible = true;
                                        this.showSpinner = false;
                                    }
                                } else {
                                    this.isNotEligible = true;
                                    this.showSpinner = false;
                                }
                            } else {
                                this.form.controls.policy.setErrors({ policy: true });
                                this.handleSecondaryError("secondary.portal.applicationFlow.policyNotRecognized");
                            }
                        },
                        (error) => {
                            this.form.controls.policy.setErrors({ policy: true });
                            if (error.status === ClientErrorResponseCode.RESP_400) {
                                this.handleSecondaryError(POLICY_NOT_FOUND);
                            } else if (error.status === ServerErrorResponseCode.RESP_503) {
                                this.handleSecondaryError("secondary.portal.applicationFlow.conversion.fetchingAflacService");
                            } else {
                                this.handleSecondaryError("secondary.portal.common.errorAflacService");
                            }
                        },
                    ),
                    filter((resp) => isValidPolicy),
                    switchMap((response) =>
                        this.shoppingCartService.getAncillaryInformation(this.memberId, this.cartId, this.mpGroup, this.planId),
                    ),
                )
                .subscribe(
                    (res) => {
                        this.checkReinstatemetEligibility(res);
                        this.appFlowService.patchConstraint(this.planObject.application.appData.id, "", res);
                    },
                    (error) => {
                        if (!isValidPolicy) {
                            if (error.status === ClientErrorResponseCode.RESP_400) {
                                this.handleSecondaryError(POLICY_NOT_FOUND);
                            } else if (error.status === ServerErrorResponseCode.RESP_503) {
                                this.handleSecondaryError("secondary.portal.applicationFlow.conversion.fetchingAflacService");
                            }
                        } else {
                            this.handleSecondaryError("secondary.portal.common.errorAncillaryInformation");
                        }
                    },
                );
        }
    }
    /**
     * handles secondary error
     * @param errorMessageKey key for error message to be displayed
     */
    handleSecondaryError(errorMessageKey: string): void {
        this.showSpinner = false;
        this.hasApiError = true;
        this.errorMessage = this.languageSecondStringsArray[errorMessageKey];
    }

    checkReinstatemetEligibility(res: any): void {
        // TODO - remove hardcoded value
        if (res && res.reinstatementEligible) {
            this.showSpinner = false;
            this.patchAndSaveResponse(res);
        } else {
            this.isNotEligible = true;
            this.isMandatory = false;
            this.isOptional = false;
            this.showSpinner = false;
        }
    }

    patchAndSaveResponse(res: any): void {
        const flowId = this.planObject.application.appData.id;
        this.appFlowService.patchConstraint(flowId, this.stepData.type.toLowerCase(), res);
    }

    resetImports(event: any): void {
        if (this.policyNumber !== event.value) {
            this.isOptional = false;
            this.isMandatory = false;
            this.isNotEligible = false;
        }
    }
    /**
     * discards application from list and updates in store
     */
    discardApplication(): void {
        if (this.planObject.reinstate) {
            this.showSpinner = true;
            this.store
                .dispatch(new DiscardCartItem(this.planObject.application.cartData.id, false, this.planObject.reinstate))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.empoweredModalService.closeDialog();
                        this.showSpinner = false;
                    },
                    (error) => {
                        this.hasApiError = true;
                        this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorDeletingCart"];
                        this.showSpinner = false;
                    },
                );
        } else {
            this.appFlowService.discardApplication(this.planObject.application.cartData.id);
        }
    }
    /**
     * Opens reinstate modal
     */
    openModal(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.minWidth = "100%";
        dialogConfig.height = "100%";
        dialogConfig.panelClass = "add-beneficiary";
        dialogConfig.data = {
            planId: this.enrollmentData.planId,
            memberId: this.memberId,
            mpGroup: this.mpGroup,
            state: this.planObject.application.cartData.enrollmentState,
            enrollmentMethod: this.planObject.application.cartData.enrollmentMethod,
            policyData: { enrollments: this.enrollments },
            fromAppFlow: true,
            cartData: this.planObject.application.cartData,
            tpiSSODetails: this.tpiSSODetails,
        };
        this.showSpinner = false;
        this.dialogRef = this.empoweredModalService.openDialog(ReinstateDialogComponent, dialogConfig);
        this.dialogRef
            .afterClosed()
            .pipe(
                tap((response: ReinstateCompletedData) => {
                    if (response && response.completed && this.enrollmentData.planId !== this.planObject.application.planId) {
                        this.reinstatedPlanName = response.planName;
                        this.dialogRef = this.empoweredModalService.openDialog(this.reinstateInfoModal);
                    }
                }),
                filter(
                    (response: ReinstateCompletedData) =>
                        response && response.completed && this.enrollmentData.planId === this.planObject.application.planId,
                ),
                switchMap((response: ReinstateCompletedData) => {
                    this.showSpinner = true;
                    this.setReinstateDialogText();
                    return this.discardCartItem();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * discards old cart item or saves current application data based on Reinstate option selection
     */
    updateReinstateSelection(): void {
        if (this.reinstateOption) {
            this.dialogRef.close();
            this.showSpinner = true;
            if (this.reinstateOption === this.KEEP) {
                this.setReinstateDialogText();
                this.discardCartItem().pipe(takeUntil(this.unsubscribe$)).subscribe();
            } else {
                this.saveApplicationResponse();
            }
        } else {
            this.reinstateOptionSelectionError = true;
        }
    }
    /**
     * saves current application responses
     */
    saveApplicationResponse(): void {
        const payload = [];
        payload.push({ question: this.importRadioValue, policyNumber: this.policyNumber });
        const schema: ApplicationResponse = {
            stepId: this.stepId,
            type: this.stepData.type,
            value: payload,
        };
        this.store.dispatch(new SetAflacAlways());
        this.store.dispatch(new SetPayment());
        this.saveApplicationResp(schema);
    }
    /**
     * discards current cart item
     * @returns Observable<number> for discarding current cartItem
     */
    discardCartItem(): Observable<number> {
        return this.store.dispatch(new DiscardCartItem(this.planObject.application.cartData.id, false, false)).pipe(
            tap(
                (resp) => {
                    this.showSpinner = false;
                    this.appFlowService.planChanged$.next({
                        discard: true,
                        nextClicked: true,
                    });
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                },
            ),
        );
    }
    /**
     * Sets data for reinstate info dialog
     */
    setReinstateDialogText(): void {
        this.applicationList = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
        if (this.enrollmentData.planId === this.planObject.application.planId) {
            this.reinstateSubTitle = this.languageStrings["primary.portal.applicationFlow.reinstate.sameSubtitle"];
            if (this.applicationList.length > 1) {
                this.reinstateAlertMessage = this.languageStrings["primary.portal.applicationFlow.reinstate.sameAlertMessage"];
            }
        } else if (this.applicationList.length > 1) {
            this.reinstateSubTitle = this.languageStrings["primary.portal.applicationFlow.reinstate.diffMul.subTitle"]
                .replace("##productName##", this.planObject.application.productName)
                .replace("##productName##", this.planObject.application.productName);
            this.reinstateAlertMessage = this.languageStrings["primary.portal.applicationFlow.reinstate.diffAlertMessage"];
        } else {
            this.reinstateSubTitle = this.languageStrings["primary.portal.applicationFlow.reinstate.diffSin.subTitle"].replace(
                "##productName##",
                this.planObject.application.planName,
            );
        }
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {
            content: this.reinstateSubTitle,
            subContent: this.reinstateAlertMessage,
        };
        const dialogRef = this.empoweredModalService.openDialog(ReinstateInfoModalComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(
                filter((response) => this.applicationList.length <= 1),
                takeUntil(this.unsubscribe$),
                timeout(TWO_SECONDS),
            )
            .subscribe(() => {
                const coverageSummaryUrl: string = this.appFlowService.getCoverageSummaryUrl(this.router.url, this.mpGroup, this.memberId);
                this.router.navigate([coverageSummaryUrl]);
            });
    }

    /**
     * closes reinstate option modal
     */
    closeReinstateOptionModal(): void {
        this.dialogRef.close();
        this.showSpinner = true;
        this.saveApplicationResponse();
    }
    /**
     * gets and updates reinstate option selected
     * @param value value selected by user
     */
    reinstateSelection(value: string): void {
        this.reinstateOptionSelectionError = false;
        this.reinstateOption = value;
    }
    /**
     * life cycle that runs on destroy of component
     * unsubscribes all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
