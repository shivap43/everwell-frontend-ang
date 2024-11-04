import { Component, OnInit, Inject, ViewChild, AfterContentChecked, AfterViewChecked, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

import {
    EnrollmentState,
    ReinstatementFlow,
    SetMPGroup,
    SetMemberId,
    SetMemberData,
    UpdateConstraintValues,
    PatchApplication,
    AddcartData,
    LoadApplicationResponses,
    MapApplicationResponse,
    SetAflacAlways,
    LoadApplicationFlowData,
    SetPayment,
    SetPartnerAccountType,
    UpdateSkippedStepResponses,
    MakeReinstateStoreEmpty,
    CopyCartData,
    SetProductPlanData,
    QuoteShopHelperService,
    MemberBeneficiaryService,
    DualPlanYearState,
    AppFlowService,
    UtilService,
} from "@empowered/ngxs-store";

import {
    CustomSection,
    RiderIndex,
    StepData,
    AllConstraint,
    StaticStep,
    DualPlanYearSettings,
    AddCartItem,
    Application,
    GetCartItems,
    PlanOfferingPricing,
    MemberQualifyingEvent,
    StepType,
    StepTitle,
    FileDetails,
    Percentages,
    SuccessResponseCode,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    DECIMAL,
} from "@empowered/constants";
import { Store, Select } from "@ngxs/store";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { LanguageService } from "@empowered/language";
import {
    ApplicationService,
    CoreService,
    StaticService,
    ShoppingService,
    DocumentApiService,
    EnrollmentService,
    ShoppingCartDisplayService,
    Signature,
    Enrollment,
    RiderCartItem,
    CartStatus,
    API_RESP_HEADER_LOCATION,
} from "@empowered/api";
import { forkJoin, Subscription, Subject, Observable, of } from "rxjs";
import { takeUntil, finalize, switchMap, tap, catchError } from "rxjs/operators";
import { FileUploadService } from "@empowered/common-services";

@Component({
    selector: "empowered-reinstate-dialog",
    templateUrl: "./reinstate-dialog.component.html",
    styleUrls: ["./reinstate-dialog.component.scss"],
})
export class ReinstateDialogComponent implements OnInit, AfterContentChecked, AfterViewChecked, OnDestroy {
    planObject: StepData;
    updatedPlanObject: StepData;
    currentSection: CustomSection;
    applicationData: any;
    showComponents = false;
    currentSectionIndex = 0;
    completedSectionIndex = 0;
    currentStepIndex = 0;
    stepType = StepType;
    unBlur = false;
    sectionClicked = false;
    activeSectionId = "";
    sectionChangesOnNext = false;
    sections = [];
    riderIndexToCompare: RiderIndex;
    riderSectionId: number;
    cartItems: GetCartItems[];
    cartItem: GetCartItems;
    showSpinner: boolean;
    hasApiError = false;
    errorMessage: string;
    lastCompletedStaticStep: number;
    lastCompletedPaymentStep: number;
    lastCompletedBillingStep: number;
    showAflacAlways = true;
    showBilling = false;
    staticStep = StaticStep;
    actualStep: StaticStep;
    previousSectionScroll = false;
    sectionToScroll: string;
    activestepId = "";
    planName = "";
    reinstateCompleted = false;
    activeSectionIndex = 0;
    isReinstate = true;

    online = false;
    fileName: string;
    acceptableFormats = ".pdf";
    isFileViewable = false;
    fileType: string;
    location: string;
    document: any;
    files: any[] = [];
    isFileSelected: boolean;
    isProgressBarEnabled: boolean;
    isFileUploaded: boolean;
    isUploadingStarted: boolean;
    modeProgress: string;
    fileUploadPercentage: number;
    hasError: any[];
    isSucess: any[];
    isFileAvailable: boolean;
    uploadErrorStatus: any[];
    uploadSuccessStatus: any[];
    fileExtension: any;
    invalidFileExtension: boolean;
    errorLog: any[];
    notAllowedFormats = ["bat", "exe", "dll", "sh", "bmp", "avi", "mov", "gif", "ini", "jpg", "sys", "wav", "mp3"];
    modifiedName: string;
    uploadSubscription: Subscription;
    completeCheck = true;
    allPlansCompleted = false;
    paymentNotCompleted = false;
    carrierId: number;
    private unsubscribe$ = new Subject<void>();
    isStepperEditable = true;
    baseEnrollment: Enrollment;
    riderEnrollments: Enrollment[];
    planId: number;
    fromApplicationFlow: boolean;
    pricingValues: PlanOfferingPricing[][] = [];
    cartItemData: Observable<HttpResponse<unknown>>;
    hasDocumentError = false;
    documentId: number;
    @ViewChild("progressIndicator") progressIndicator;
    @ViewChild("paymentIndicator") paymentIndicator;
    @ViewChild("billingIndicator") billingIndicator;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.reinstate.reinstatementPlanname",
        "primary.portal.applicationFlow.reinstate.billing",
        "primary.portal.applicationFlow.reinstate.payment",
        "primary.portal.applicationFlow.reinstate.billingAddress",
        "primary.portal.applicationFlow.reinstate.paymentSettings",
        "primary.portal.applicationFlow.reinstate.aflacAlways",
        "primary.portal.applicationFlow.reinstate.enroll",
        "primary.portal.applicationFlow.reinstate.finishApplication",
        "primary.portal.applicationFlow.reinstate.confirmation",
        "primary.portal.applicationFlow.reinstate.downloadApplication",
        "primary.portal.applicationFlow.reinstate.download ",
        "primary.portal.applicationFlow.reinstate.uploadApplication",
        "primary.portal.applicationFlow.reinstate.completedApplication",
        "primary.portal.applicationFlow.reinstate.documentNotFound",
        "primary.portal.common.submit",
        "primary.portal.common.close",
    ]);
    tpiAssistingAdminId: number;
    currentQLEId: number;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    planYearId = undefined;
    firstOnLoad = true;
    multipartFileUploadConfig = false;
    maxFileSizeAllowed: number;

    constructor(
        private readonly dialogRef: MatDialogRef<ReinstateDialogComponent>,
        private readonly store: Store,
        private readonly appFlowService: AppFlowService,
        private readonly applicationServie: ApplicationService,
        private readonly coreService: CoreService,
        private readonly shoppingService: ShoppingService,
        private readonly memberService: MemberBeneficiaryService,
        private readonly staticService: StaticService,
        private readonly documentService: DocumentApiService,
        private readonly language: LanguageService,
        private readonly enrollmentService: EnrollmentService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly cdr: ChangeDetectorRef,
        private readonly utilService: UtilService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly fileUploadService: FileUploadService,
    ) {}
    /**
     * life cycle hook that runs on load of component
     * loads required data for component
     */
    ngOnInit(): void {
        this.planId = this.data.planId;
        this.fromApplicationFlow = this.data.fromAppFlow;
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.getEnrollmentData();
        this.serviceCall();
        this.appFlowService.reinstateStepChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((details) => {
            this.validateStepChange(details);
        });
        this.appFlowService.updateReinstateActiveStepDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.currentSectionIndex = data.currentSectionIndex;
            this.currentStepIndex = data.currentStepIndex;
            this.activeSectionId = this.getSectionId(this.currentSectionIndex.toString());
            this.activestepId = this.getStepId(this.currentSectionIndex.toString(), this.currentStepIndex.toString());
            this.completedSectionIndex = this.currentSectionIndex;
            this.lastCompletedStaticStep = 0;
        });
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
        this.appFlowService.reinstateLastCompletedPaymentIndex$.pipe(takeUntil(this.unsubscribe$)).subscribe((num) => {
            this.lastCompletedPaymentStep = num;
            this.paymentIndicator.linear = false;
            this.paymentIndicator.selectedIndex = num - 1;
            this.paymentIndicator.linear = true;
        });
        this.appFlowService.reinstateLastCompleteStaticStep$.pipe(takeUntil(this.unsubscribe$)).subscribe((index) => {
            this.lastCompletedStaticStep = index;
            this.progressIndicator.linear = false;
            this.progressIndicator.selectedIndex =
                this.paymentIndicator || this.billingIndicator
                    ? this.planObject.application.appData.sections.length + index
                    : this.planObject.application.appData.sections.length + index - 1;
            this.progressIndicator.linear = true;
        });
        this.appFlowService.reinstateLastCompletedBillingIndex$.pipe(takeUntil(this.unsubscribe$)).subscribe((num) => {
            this.lastCompletedBillingStep = num;
            this.billingIndicator.linear = false;
            this.billingIndicator.selectedIndex = num - 1;
            this.billingIndicator.linear = true;
        });
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQLEId = qle ? qle.id : null));
        }
        this.appFlowService.reinstateDemographicsStepSkipped$.subscribe((data) => {
            const planObject: StepData = data.planObject;
            if (!data.planObject.rider) {
                this.updatedPlanObject.application.appData.sections[data.sectionId].steps[data.currentStep].prefilled = true;
                if (data.sectionId || data.currentStep) {
                    if (data.sectionId === this.currentSectionIndex && data.currentStep === this.currentStepIndex) {
                        if (this.firstOnLoad && planObject.application.cartData.status === CartStatus.TODO) {
                            this.firstOnLoad = false;
                            this.checkStepConstraints(data.sectionId, data.currentStep, true);
                        } else {
                            this.checkStepConstraints(data.sectionId, data.currentStep);
                        }
                    } else {
                        this.updatedPlanObject.application.appData.sections[data.sectionId].steps[data.currentStep].showStep = false;
                    }
                }
            } else {
                this.updatedPlanObject.application.riders[planObject.rider.riderIndex].appData.sections[data.sectionId].steps[
                    data.currentStep
                ].prefilled = true;
                this.updatedPlanObject.application.riders[planObject.rider.riderIndex].appData.sections[data.sectionId].steps[
                    data.currentStep
                ].showStep = false;
            }
        });
        this.fileUploadService
            .fetchFileUploadConfigs()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((fileUploadConfigData) => {
                this.multipartFileUploadConfig = fileUploadConfigData.allowMultipartFileUpload;
                this.maxFileSizeAllowed = fileUploadConfigData.maxFileUploadSize;
            });
    }

    /**
     * gets enrollment data
     */
    getEnrollmentData(): void {
        if (this.data.policyData.enrollments) {
            this.baseEnrollment = this.data.policyData.enrollments.filter((enrollment) => !enrollment.riderOfEnrollmentId).pop();
            this.riderEnrollments = this.data.policyData.enrollments.filter((enrollment) => enrollment.riderOfEnrollmentId);
        } else {
            this.baseEnrollment = this.data.policyData;
            this.riderEnrollments = this.data.policyData.riders.filter((rider) => rider.planOfferingId);
        }
    }
    /**
     * This function will validate all step change events based on details object and will change product accordingly
     * @param details is a StepChangeDetails object which will hold all step change details
     */
    validateStepChange(details: any): void {
        this.unBlur = true;
        const sections = this.planObject.application.appData.sections;
        if (details.planObject.currentSection && sections[details.sectionIndex].steps.length - 1 > details.stepIndex) {
            this.checkStepConstraints(details.sectionIndex, details.stepIndex + 1);
            this.lastCompletedStaticStep = 0;
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (details.sectionIndex === sections.length - 1) {
                let lastFlag = true;
                if (details.stepIndex === details.planObject.currentSection.steps.length - 1) {
                    this.completedSectionIndex += 1;
                    this.progressIndicator.linear = false;
                    this.progressIndicator.selectedIndex += 1;
                    this.progressIndicator.linear = true;
                } else {
                    const stepsToBeChecked = sections[details.sectionIndex].steps.splice(details.stepIndex + 1);
                    lastFlag = stepsToBeChecked.some((step) => Boolean(step.showStep));
                    if (lastFlag) {
                        this.completedSectionIndex += 1;
                        this.progressIndicator.linear = false;
                        this.progressIndicator.selectedIndex += 1;
                        this.progressIndicator.linear = true;
                    }
                }
            } else {
                this.checkStepConstraints(details.sectionIndex + 1, 0);
                this.lastCompletedStaticStep = 0;
            }
        }
    }

    /**
     *
     * @param sectionIndex : number, index of the current section
     * @param stepIndex : number, index of the current step of the current section
     * @param onLoad : boolean, true if the screen is loaded
     * @returns void
     */
    checkStepConstraints(sectionIndex: number, stepIndex: number, onLoad?: boolean): void {
        const steps = this.planObject.application.appData.sections[sectionIndex].steps;
        if (
            steps[stepIndex].step.length &&
            (this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].prefilled ||
                this.appFlowService.skipOnConstraints(
                    steps[stepIndex].step[0].constraintAggregates,
                    this.planObject.application.appData.planId,
                    this.planObject,
                    this.planObject.application.cartData,
                ))
        ) {
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].showStep = false;
            let showSection = false;
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps.forEach((step) => {
                if (step.showStep) {
                    showSection = true;
                }
            });
            this.showHideStepSection(false, false, sectionIndex, stepIndex);
            if (!onLoad) {
                this.saveSkippedStepResponse(this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step[0].id);
            }
            if (stepIndex < steps.length - 1) {
                stepIndex += 1;
                this.checkStepConstraints(sectionIndex, stepIndex, onLoad);
            } else if (stepIndex === steps.length - 1) {
                if (this.planObject.application.appData.sections.length - 1 <= sectionIndex) {
                    this.loadActiveStepSectionDetails(sectionIndex, stepIndex);
                    if (!onLoad || (onLoad && !this.allPlansCompleted)) {
                        this.completedSectionIndex = this.applicationData.appData.sections.length;
                        this.progressIndicator.linear = false;
                        this.progressIndicator.selectedIndex = this.applicationData.appData.sections.length;
                        this.progressIndicator.linear = true;
                    }
                } else {
                    this.checkStepConstraints(sectionIndex + 1, 0, onLoad);
                }
            }
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            this.showHideStepSection(true, true, sectionIndex, stepIndex);
            if (this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].completed && onLoad) {
                if (stepIndex < steps.length - 1) {
                    stepIndex += 1;
                    this.checkStepConstraints(sectionIndex, stepIndex, onLoad);
                } else if (stepIndex === steps.length - 1 && this.planObject.application.appData.sections.length - 1 > sectionIndex) {
                    this.checkStepConstraints(sectionIndex + 1, 0, onLoad);
                }
            } else {
                this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].completed = true;
                if (this.getSectionIndexFromId(this.activeSectionId) === sectionIndex) {
                    this.currentStepIndex = stepIndex;
                    this.scrollToDiv(this.getStepId(sectionIndex.toString(), stepIndex.toString()));
                } else {
                    this.goToNextSection(stepIndex, sectionIndex);
                }
            }
        }
    }

    showHideStepSection(showSection: boolean, showStep: boolean, sectionIndex: number, stepIndex: number): void {
        this.updatedPlanObject.application.appData.sections[sectionIndex].showSection = showSection;
        this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].showStep = showStep;
        this.planObject.application.appData.sections[sectionIndex].steps[stepIndex].step.forEach((step, i) => {
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step[i].showStep = showStep;
        });
    }

    goToNextSection(stepIndex: number, sectionIndex: number): void {
        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;
        const sectionId = this.getSectionId(sectionIndex.toString());
        this.activeSectionId = sectionId;
        this.completedSectionIndex = sectionIndex;
        this.progressIndicator.linear = false;
        this.progressIndicator.selectedIndex = sectionIndex;
        this.progressIndicator.linear = true;
        this.sectionChangesOnNext = true;
        this.scrollToDiv(sectionId);
        this.scrollToDiv(this.getStepId(sectionIndex.toString(), stepIndex.toString()));
    }

    onPaymentChange(event: any): void {
        this.appFlowService.paymentStepPosition.next(event.selectedIndex);
    }
    /**
     * closes form after updating data in store
     * @param fromDependents indicates whether called from dependents component or not
     */
    closeForm(fromDependents: boolean = false): void {
        this.showSpinner = true;
        if (!fromDependents) {
            this.store.dispatch(new MakeReinstateStoreEmpty());
        }
        if (this.data.fromAppFlow) {
            if (this.reinstateCompleted) {
                this.quoteShopHelperService.updateMandatoryReinstate.next(true);
                this.store.dispatch(
                    new SetProductPlanData({
                        mpGroup: this.data.mpGroup,
                        selectedMethod: this.data.enrollmentMethod,
                        selectedState: this.data.state,
                        memberId: this.data.memberId,
                    }),
                );
            }
            this.store
                .dispatch(new LoadApplicationFlowData(this.data.memberId, this.data.mpGroup))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.store.dispatch(new SetAflacAlways());
                        this.store.dispatch(new SetPayment());
                        this.dialogRef.close({ completed: this.reinstateCompleted, planName: this.planName });
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.hasApiError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    },
                );
        } else {
            this.dialogRef.close({ completed: this.reinstateCompleted });
        }
    }

    mapData(sectionIndex: any, stepIndex: number): StepData {
        return {
            index: `${sectionIndex}${stepIndex}`,
            application: this.planObject.application,
            currentSection: this.planObject.application.appData.sections[sectionIndex],
            currentStep: stepIndex,
            steps: this.planObject.application.appData.sections[sectionIndex].steps[stepIndex].step,
            lastStep:
                sectionIndex === this.planObject.application.appData.sections.length - 1
                    ? this.planObject.application.appData.sections[sectionIndex].steps.length - 1 === stepIndex
                        ? true
                        : false
                    : false,
            nextProduct: null,
            basePlanId: this.updatedPlanObject.basePlanId,
            reinstate: true,
        };
    }

    getSectionId(index: string): string {
        return "rsection" + "_" + index;
    }

    getStepId(sectionIndex: string, stepIndex: string): string {
        return "rsection" + "_" + sectionIndex + "_step_" + stepIndex;
    }

    getSectionIndexFromId(sectionId: string): number | undefined {
        if (sectionId) {
            const splitArray = sectionId.split("_");
            // eslint-disable-next-line radix
            return parseInt(splitArray[splitArray.length - 1]);
        }
        return undefined;
    }

    updateStepper(sectionId: string): void {
        if (sectionId) {
            if (this.sectionClicked) {
                this.sectionClicked = false;
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else if (this.unBlur || this.getSectionIndexFromId(sectionId) <= this.getSectionIndexFromId(this.activeSectionId)) {
                this.activeSectionIndex = this.getSectionIndexFromId(sectionId);
            }
            if (this.sectionChangesOnNext) {
                this.sectionChangesOnNext = false;
                this.activeSectionIndex = this.getSectionIndexFromId(sectionId);
            }
        }
    }
    /** To manipulate actual step based on section change
     * @param event - used to store the selected index
     * @returns void
     */
    onSectionChange(event: any): void {
        const sectionLength = this.applicationData.appData.sections.length;
        if (event.selectedIndex >= sectionLength) {
            this.currentSectionIndex = sectionLength;
            if (this.showAflacAlways) {
                if (event.selectedIndex === sectionLength) {
                    this.actualStep = this.staticStep.AFLAC_ALWAYS;
                } else if (event.selectedIndex === sectionLength + 1) {
                    this.actualStep = this.staticStep.ONE_SIGNATURE;
                } else if (event.selectedIndex === sectionLength + 2) {
                    this.confirmReinstate();
                }
            } else if (this.showBilling) {
                if (event.selectedIndex === sectionLength) {
                    this.actualStep = this.staticStep.PAYMENT;
                } else if (event.selectedIndex === sectionLength + 1) {
                    this.actualStep = this.staticStep.ONE_SIGNATURE;
                } else if (event.selectedIndex === sectionLength + 2) {
                    this.confirmReinstate();
                }
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (event.selectedIndex === sectionLength) {
                    this.actualStep = this.staticStep.ONE_SIGNATURE;
                } else if (event.selectedIndex === sectionLength + 1) {
                    this.confirmReinstate();
                }
            }
        } else {
            this.actualStep = this.staticStep.NORMAL_STEP;
            const sectionId = this.getSectionId(event.selectedIndex);
            this.sectionClicked = true;
            this.previousSectionScroll = true;
            this.scrollToDiv(sectionId);
        }
    }

    confirmReinstate(): void {
        this.actualStep = this.staticStep.CONFIRMATION;
        this.isStepperEditable = false;
        this.reinstateCompleted = true;
        this.store
            .dispatch(new LoadApplicationFlowData(this.data.memberId, this.data.mpGroup))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    scrollToDiv(section: string): void {
        this.sectionToScroll = section;
    }
    /**
     * Method get all required info
     */
    serviceCall(): void {
        this.showSpinner = true;
        this.store.dispatch(new SetMPGroup(this.data.mpGroup));
        this.store.dispatch(new SetMemberId(this.data.memberId));
        this.memberService.mpGroup.next(this.data.mpGroup);
        this.memberService.memberId.next(this.data.memberId);
        this.staticService
            .getConfigurations("portal.member.form.beneficiary.*", this.data.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.memberService.validators.next(Response);
            });
        this.getPricingValues();
        forkJoin([
            this.applicationServie.getApplicationsByPlan(
                this.data.planId,
                this.data.memberId,
                this.data.mpGroup,
                this.baseEnrollment.state,
                this.data.enrollmentMethod,
                false,
            ),
            // FIXME - Make changes to check for cart items from store instead of api
            this.shoppingService.getCartItems(this.data.memberId, this.data.mpGroup, "planOfferingId", this.planYearId),
            this.coreService.getPlan(this.data.planId),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.planName = response[2].name;
                    this.carrierId = response[2].carrierId;
                    if (response && response.length && response[0].length) {
                        this.showSpinner = true;
                        this.online = true;
                        this.store.dispatch(new PatchApplication(response[0][0]));
                        this.store.dispatch(new UpdateConstraintValues(AllConstraint.REINSTATEMENT_ELIGIBLE, true, response[0][0].id));
                        this.store.dispatch(new UpdateConstraintValues(AllConstraint.REINSTATEMENT_IS_REQUIRED, true, response[0][0].id));
                        this.store.dispatch(new CopyCartData(response[1]));
                        this.store
                            .dispatch(new SetMemberData())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((resp) => {
                                this.checkAddDeleteCartData(response[1], response[0]);
                            });
                    } else {
                        this.online = false;
                        this.serviceCallOffline();
                    }
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }
    /**
     * gets pricing values for the enrollments
     */
    getPricingValues(): void {
        const pricingList: Observable<PlanOfferingPricing[]>[] = [];
        pricingList.push(this.getPricingObservable(this.baseEnrollment));
        if (this.riderEnrollments && this.riderEnrollments.length) {
            this.riderEnrollments.forEach((enrollment) => {
                pricingList.push(this.getPricingObservable(enrollment));
            });
        }
        forkJoin(pricingList)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.pricingValues = resp;
            });
    }
    /**
     * gets pricing observable for each enrollment
     * @param enrollment enrollment data
     * @returns planOfferingPricing observable
     */
    getPricingObservable(enrollment: Enrollment): Observable<PlanOfferingPricing[]> {
        return this.shoppingService.getPlanOfferingPricing(
            enrollment.planOfferingId.toString(),
            this.baseEnrollment.state,
            null,
            this.data.memberId,
            this.data.mpGroup,
        );
    }
    loadPlanObject(): void {
        this.showSpinner = false;
        this.planObject = {
            application: this.applicationData,
            currentSection: null,
            currentStep: null,
            steps: null,
            blurFlag: true,
            nextProduct: null,
            previousProduct: null,
            basePlanId: this.applicationData.planId,
            reinstate: true,
        };
        this.updatedPlanObject = this.utilService.copy(this.planObject);
        this.sections = this.applicationData.appData.sections.map((section) => section.title);
    }
    /**
     * Method to check for planoffering id and add to cart if not present
     */
    checkAddDeleteCartData(items: any, application: Application[]): void {
        // TODO - Add data to check for planoffering id and add to cart if not present
        const cartItem = items
            .filter(
                (item) => item.planOffering.id === this.baseEnrollment.planOfferingId && item.applicationType === StepType.REINSTATEMENT,
            )
            .pop();

        if (cartItem) {
            this.cartItemData = this.shoppingService.updateCartItem(
                this.data.memberId,
                this.data.mpGroup,
                cartItem.id,
                this.getCartObject(cartItem),
            );
        } else {
            this.cartItemData = this.shoppingService.addCartItem(this.data.memberId, this.data.mpGroup, this.getCartObject());
        }
        this.cartItemData
            .pipe(
                switchMap(() =>
                    this.shoppingService.getCartItems(this.data.memberId, this.data.mpGroup, "planOfferingId", this.planYearId),
                ),
                tap((response) => {
                    this.cartItems = response;
                    this.loadReinstatePanel(application);
                }),
                catchError((error) => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        `secondary.api.${error.error.status}.${error.error.code}`,
                    );
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    loadAncillaryInformation(cartItem: GetCartItems, applicationId: number): void {
        this.shoppingCartDisplayService
            .getAncillaryInformation(this.data.memberId, cartItem.id, this.data.mpGroup, this.data.planId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.appFlowService.patchConstraint(applicationId, "", resp);
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }
    /**
     * @description Method to get cart object based on conditions
     * @param cartItem cart item
     * @returns CartObject with valid data
     */
    getCartObject(cartItem?: GetCartItems): AddCartItem {
        let coverageLevelId: number;
        if (this.baseEnrollment && this.baseEnrollment.coverageLevel) {
            coverageLevelId = this.baseEnrollment.coverageLevel.id;
        } else {
            coverageLevelId = this.baseEnrollment.coverageLevelId;
        }
        const costData = this.getCost(this.baseEnrollment, coverageLevelId, 0);
        const cartObject: AddCartItem = {
            planOfferingId: this.baseEnrollment.planOfferingId,
            totalCost: (costData && costData.totalCost) || this.baseEnrollment.totalCostPerPayPeriod || this.baseEnrollment.totalCost,
            memberCost: (costData && costData.totalCost) || this.baseEnrollment.memberCostPerPayPeriod || this.baseEnrollment.memberCost,
            enrollmentMethod: this.data.enrollmentMethod,
            enrollmentState: this.baseEnrollment.state,
            enrollmentCity: this.baseEnrollment.city,
            subscriberQualifyingEventId:
                this.baseEnrollment.validity && this.baseEnrollment.validity.expiresAfter && this.currentQLEId ? this.currentQLEId : null,
        };
        cartObject.coverageLevelId = coverageLevelId;
        if (this.baseEnrollment.benefitAmount) {
            cartObject.benefitAmount = this.baseEnrollment.benefitAmount;
        }
        if (this.riderEnrollments && this.riderEnrollments.length) {
            cartObject.riders = this.getRiderCartItems(cartItem);
        } else {
            cartObject.riders = [];
        }
        if ((this.data.cartData && this.data.cartData.assistingAdminId) || this.tpiAssistingAdminId) {
            cartObject.assistingAdminId =
                this.data.cartData && this.data.cartData.assistingAdminId
                    ? this.appFlowService.mapAssistingAdminId(this.data.cartData.assistingAdminId)
                    : this.appFlowService.mapAssistingAdminId(this.tpiAssistingAdminId);
        }
        cartObject.applicationType = StepType.REINSTATEMENT;
        return cartObject;
    }
    /**
     * Logic to get rider cartItems
     * @param cartItem cart item
     * @returns rider cart item array
     */
    getRiderCartItems(cartItem?: GetCartItems): RiderCartItem[] {
        const riderArray = [];
        this.riderEnrollments.forEach((rider, i) => {
            let coverageLevelId: number;
            if (rider.coverageLevel) {
                coverageLevelId = rider.coverageLevel.id;
            } else {
                coverageLevelId = rider.coverageLevelId;
            }
            const costData: PlanOfferingPricing = this.getCost(rider, coverageLevelId, i + 1);
            const cartItemId = cartItem?.riders.find((riderCart) => riderCart.planOfferingId === rider.planOfferingId)?.cartItemId;
            const riderCartObject: RiderCartItem = {
                planOfferingId: rider.planOfferingId,
                coverageLevelId: coverageLevelId,
                totalCost: costData ? costData.totalCost : rider.totalCost,
                memberCost: costData ? costData.memberCost : rider.memberCost,
                benefitAmount: rider.benefitAmount ? rider.benefitAmount : null,
                cartItemId,
            };
            riderArray.push(riderCartObject);
        });
        return riderArray;
    }
    /**
     * gets cost based on enrollment data and coverage level id
     * @param enrollment enrollment data
     * @param coverageLevelId coverage level id
     * @returns plan offering pricing data
     */
    getCost(enrollment: Enrollment, coverageLevelId: number, index: number): PlanOfferingPricing {
        let costData: PlanOfferingPricing;
        if (this.pricingValues && this.pricingValues.length > index) {
            costData = this.pricingValues[index]
                .filter(
                    (price) =>
                        price.coverageLevelId === coverageLevelId &&
                        (price.benefitAmount === enrollment.benefitAmount || !enrollment.benefitAmount),
                )
                .pop();
        }
        return costData;
    }

    loadReinstatePanel(applications: Application[]): void {
        const planIds = [];
        const application = this.utilService.copy(applications.filter((app) => app.planId === this.data.planId));
        if (application && application.length) {
            application.forEach((app) => {
                planIds.push(app.planId);
                let appSections = [];
                appSections = app.sections.filter((section) => section.title !== StepTitle.RIDERS);
                appSections
                    .filter(
                        (section) =>
                            section.steps &&
                            section.steps.length &&
                            section.steps[0].type &&
                            section.title !== StepType.AFLACALWAYS &&
                            section.title !== StepTitle.REQUIREDFORMS &&
                            section.title !== StepTitle.REQUIREDFORMS1 &&
                            section.title !== StepTitle.REQUIREDFORMS2 &&
                            section.title !== StepTitle.APPLICANTS &&
                            section.title !== StepTitle.PAYMENTOPTION &&
                            section.title !== StepTitle.PAYMENTLCOPTION,
                    )
                    .forEach((section, i) => {
                        section.sectionId = i;
                    });
            });
        }
        forkJoin(
            this.store.dispatch(new ReinstatementFlow(application, planIds, this.data.planId, this.cartItems)),
            this.store.dispatch(new SetPartnerAccountType()),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.cartItem = this.cartItems.filter((item) => item.planOffering.id === this.baseEnrollment.planOfferingId).pop();
                this.loadAncillaryInformation(this.cartItem, application[0].id);
                this.store.dispatch(new AddcartData(this.cartItem));
                this.store.dispatch(new SetPayment(this.carrierId));
                this.store.dispatch(new SetAflacAlways());
                this.showAflacAlways = this.store
                    .selectSnapshot(EnrollmentState.GetAflacAlways)
                    .filter((data) => data.applicationType === StepType.REINSTATEMENT && this.cartItem.id === data.itemId).length
                    ? true
                    : false;
                this.showBilling = this.store
                    .selectSnapshot(EnrollmentState.GetDirectPayment)
                    .filter((data) => data.applicationType === StepType.REINSTATEMENT && this.cartItem.id === data.itemId).length
                    ? true
                    : false;
                this.loadData();
            });
    }

    loadData(): void {
        this.store
            .dispatch(new LoadApplicationResponses())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.store.dispatch(MapApplicationResponse);
                this.applicationData = this.store
                    .selectSnapshot(EnrollmentState.GetReinstatementPanel)
                    .filter((appData) => this.data.planId === appData.planId)
                    .pop();
                if (
                    this.applicationData.appData &&
                    this.applicationData.appData.sections &&
                    this.applicationData.appData.sections.length &&
                    this.checkForOnlineFlow()
                ) {
                    this.loadPlanObject();
                    this.showComponents = true;
                } else {
                    this.online = false;
                    this.serviceCallOffline();
                }
            });
    }
    /**
     * function to check for Reinstatement Document and get data if present otherwise display error
     */
    serviceCallOffline(): void {
        this.coreService
            .getPlanDocuments([this.data.planId], this.baseEnrollment.state, this.data.mpGroup.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    this.showSpinner = false;
                }),
            )
            .subscribe(
                (response) => {
                    if (response.length) {
                        this.document = response.filter((resp) => resp.type === "REINSTATEMENT").pop();
                        if (this.document) {
                            this.location = this.document.location;
                            this.fileName = this.document.name;
                            this.showComponents = true;
                        } else {
                            this.hasDocumentError = true;
                            this.errorMessage = this.languageStrings["primary.portal.applicationFlow.reinstate.documentNotFound"];
                        }
                    } else {
                        this.hasDocumentError = true;
                        this.errorMessage = this.languageStrings["primary.portal.applicationFlow.reinstate.documentNotFound"];
                    }
                },
                (error) => {
                    this.hasDocumentError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }
    downloadPDF(): void {
        window.open(this.location, "_blank");
    }

    /**
     * @description Method to validate file
     * @param event has the document uploaded by user
     * @returns void
     */
    validateFileAndUpload(event: File): void {
        const name = event.name;
        this.fileExtension = event.name.split(".").pop();
        this.invalidFileExtension = false;
        this.errorLog = [];
        this.uploadErrorStatus = [];
        this.uploadSuccessStatus = [];
        this.hasError = [];
        this.isSucess = [];
        this.files = [];
        this.isFileSelected = true;
        this.fileUploadPercentage = 0;
        this.isProgressBarEnabled = false;
        this.isUploadingStarted = false;
        this.notAllowedFormats.forEach((extension) => {
            if (extension === this.fileExtension) {
                this.invalidFileExtension = true;
            }
        });
        if (name.length > 24) {
            const first16 = name.substring(0, 15);
            const last8 = name.substring(event.name.length - 8, event.name.length);
            this.modifiedName = first16 + "..." + last8;
        } else {
            this.modifiedName = name;
        }
        const file: FileDetails = {
            name: event.name,
            modifiedName: this.modifiedName,
            lastModified: event.lastModified,
            size: event.size,
            type: event.type,
            slice: event.slice,
            documentId: null,
        };
        this.files.push(file);
        if (this.invalidFileExtension) {
            this.setDataError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.fileFormat.error");
        } else if (file.size > this.maxFileSizeAllowed) {
            this.setDataError();
            this.uploadErrorStatus.push("secondary.portal.shared.monUpload.maxFileSize.error");
        } else {
            this.isFileSelected = true;
            this.isProgressBarEnabled = true;
            this.isFileUploaded = false;
            this.isUploadingStarted = true;
            this.modeProgress = "determine";
            this.fileUploadPercentage = 0;
            this.uploadFile(event);
        }
    }

    /**
     * @description function to set data for file error
     * @returns void
     */
    setDataError(): void {
        this.hasError.push(true);
        this.isSucess.push(false);
        this.uploadSuccessStatus.push("");
        this.isProgressBarEnabled = true;
        this.isFileSelected = true;
    }
    /**
     * @description method to upload file to aws s3 using presigned url
     * @param file file for uploading
     * @returns void
     */
    uploadFile(file: File): void {
        if (this.multipartFileUploadConfig) {
            this.uploadSubscription = this.processFile(file).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.uploadSubscription = this.fileUploadService
                .upload(file)
                .pipe(
                    switchMap(() => this.processFile(file)),
                    catchError(() => {
                        this.hasError.push(true);
                        this.isSucess.push(false);
                        this.uploadSuccessStatus.push("");
                        this.uploadErrorStatus.push("secondary.portal.shared.monUpload.genericError");
                        return of(null);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description method to process the uploaded file
     * @param file the file uploaded
     * @returns Observable<void>
     */
    processFile(file: File): Observable<void> {
        return this.documentService.uploadDocument(file, this.multipartFileUploadConfig, this.data.mpGroup, "REINSTATEMENT").pipe(
            switchMap((events) => {
                if (events.type === HttpEventType.UploadProgress) {
                    this.fileUploadPercentage = Math.round((Percentages.FILE_UPLOAD_PERCENTAGE_95 * events.loaded) / events.total);
                } else if (events.type === HttpEventType.Response && events.status === SuccessResponseCode.RESP_202) {
                    const locationData = events.headers.get(API_RESP_HEADER_LOCATION).split("?")[0].split("/");
                    this.documentId = parseInt(locationData[locationData.length - 1], DECIMAL);
                    this.isFileUploaded = true;
                    this.isProgressBarEnabled = true;
                    this.isSucess.push(true);
                    this.hasError.push(false);
                    this.uploadErrorStatus.push("");
                    this.uploadSuccessStatus.push("secondary.portal.shared.monupload.uploadsucess.subtitle");
                }
                return of(null);
            }),
            catchError((error) => {
                this.hasError = [];
                this.isSucess = [];
                this.uploadErrorStatus = [];
                this.uploadSuccessStatus = [];
                this.isFileUploaded = false;
                this.isUploadingStarted = false;
                this.isProgressBarEnabled = false;
                this.hasError.push(true);
                this.isSucess.push(false);
                this.uploadSuccessStatus.push("");
                this.getErrorMessage(error);
                if (this.errorMessage === "") {
                    this.uploadErrorStatus.push("secondary.portal.shared.monUpload.uploadError.label");
                } else {
                    this.uploadErrorStatus.push(this.errorMessage);
                }
                return of(null);
            }),
        );
    }

    getErrorMessage(error: any): void {
        if (error.status === ClientErrorResponseCode.RESP_413) {
            this.errorMessage = "secondary.portal.shared.monUpload.maxFileSize.error";
        } else if (error.status === ClientErrorResponseCode.RESP_415) {
            this.errorMessage = "secondary.portal.shared.monUpload.fileFormat.error";
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            this.errorMessage = "secondary.portal.shared.monUpload.uploading.error";
        } else if (error.status === ClientErrorResponseCode.RESP_400) {
            this.get400ErrorMessage(error);
        } else if (error.status === ClientErrorResponseCode.RESP_403) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.forbiddenError";
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.InternalServerError";
        } else {
            this.errorMessage = "secondary.portal.shared.monUpload.unknown.error";
        }
    }

    get400ErrorMessage(error: any): void {
        if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.badParameter.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.Censuserror";
        } else if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.parseError.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.FileUnreadableerror";
        } else if (error.error.code === this.language.fetchPrimaryLanguageValue("primary.portal.census.400.missingParameter.label")) {
            this.errorMessage = "secondary.portal.shared.monUpload.file.FileRequirederror";
        } else if (error.error.details[0].message === "Empty census file") {
            this.errorMessage = "secondary.portal.shared.monUpload.emptyCensusFile";
        } else if (
            error.error.details?.length &&
            error.error.details[0].field ===
                this.language.fetchPrimaryLanguageValue("primary.portal.members.document.addUpdate.virusDetected.fieldMessage")
        ) {
            this.errorMessage = "primary.portal.members.document.addUpdate.virusDetectedError";
        }
    }

    uploadCancel(): void {
        this.uploadSubscription.unsubscribe();
        this.uploadSuccessStatus = [];
        this.uploadErrorStatus = [];
        this.isFileSelected = false;
        this.hasError = [];
        this.isSucess = [];
        this.files = [];
        this.isUploadingStarted = false;
    }
    /**
     * updates document id and signs cart item on offline reinstatement submit
     */
    onSubmit(): void {
        let reinstateItemId = 0;
        const cartItem = this.cartItems.filter((item) => item.planOffering.id === this.baseEnrollment.planOfferingId).pop();
        if (cartItem) {
            reinstateItemId = cartItem.id;
        }
        if (this.files.length && this.isSucess.length && this.isSucess[0]) {
            this.showSpinner = true;
            const signature: Signature = {
                signature: "BRUP",
            };
            const cartData: AddCartItem = this.getCartData(cartItem);
            this.shoppingService
                .updateCartItem(this.data.memberId, this.data.mpGroup, reinstateItemId, cartData)
                .pipe(
                    switchMap((resp) =>
                        this.enrollmentService.signShoppingCartItem(this.data.memberId, this.data.mpGroup, signature, reinstateItemId),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (response) => {
                        this.showSpinner = false;
                        this.reinstateCompleted = true;
                        this.store.dispatch(new LoadApplicationFlowData(this.data.memberId, this.data.mpGroup));
                        this.closeForm();
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.hasApiError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    },
                );
        }
    }
    /**
     * gets cart data to be updated
     * @param cartItem cart item
     * @returns cart data to be updated
     */
    getCartData(cartItem: GetCartItems): AddCartItem {
        return {
            benefitAmount: cartItem.benefitAmount,
            memberCost: cartItem.memberCost,
            dependentAge: cartItem.dependentAge,
            totalCost: cartItem.totalCost,
            enrollmentMethod: cartItem.enrollmentMethod,
            enrollmentState: cartItem.enrollmentState,
            enrollmentCity: cartItem.enrollmentCity,
            planOfferingId: cartItem.planOffering.id,
            coverageLevelId: cartItem.coverageLevelId,
            riders: cartItem.riders,
            assistingAdminId: cartItem.assistingAdminId,
            riskClassOverrideId: cartItem.riskClassOverrideId,
            subscriberQualifyingEventId: cartItem.subscriberQualifyingEventId,
            documentId: this.documentId,
        };
    }

    ngAfterContentChecked(): void {
        if (this.sectionToScroll && document.getElementById(this.sectionToScroll) && this.previousSectionScroll) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            this.previousSectionScroll = false;
        } else if (
            this.sectionToScroll &&
            document.getElementById(this.sectionToScroll) &&
            document.getElementById(this.sectionToScroll).classList.contains("active-section")
        ) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            this.sectionToScroll = null;
        }
    }

    checkForOnlineFlow(): boolean {
        let isOnlineFlow = false;
        this.applicationData.appData.sections.forEach((section) => {
            if (!isOnlineFlow) {
                section.steps.forEach((stepArray) => {
                    if (!isOnlineFlow) {
                        isOnlineFlow = this.isReinstateStep(stepArray.step);
                    }
                });
            }
        });
        return isOnlineFlow;
    }

    // eslint-disable-next-line complexity
    isReinstateStep(steps: any): boolean {
        let isReinstateStep = false;
        if (steps && steps.length) {
            const constraints = steps[0].constraintAggregates;
            if (constraints && constraints.show && constraints.show.and) {
                if (constraints.show.and.constraints && constraints.show.and.constraints.length) {
                    isReinstateStep = this.checkforReinstateConstraint(constraints.show.and.constraints);
                }
                if (
                    constraints.show.and.or &&
                    constraints.show.and.or.constraints &&
                    constraints.show.and.or.constraints.length &&
                    !isReinstateStep
                ) {
                    isReinstateStep = this.checkforReinstateConstraint(constraints.show.and.or.constraints);
                }
            }
            if (constraints && constraints.skip && constraints.skip.and && !isReinstateStep) {
                if (constraints.skip.and.constraints && constraints.skip.and.constraints.length && !isReinstateStep) {
                    isReinstateStep = this.checkforReinstateConstraint(constraints.skip.and.constraints);
                }
                if (
                    constraints.skip.and.or &&
                    constraints.skip.and.or.constraints &&
                    constraints.skip.and.or.constraints.length &&
                    !isReinstateStep
                ) {
                    isReinstateStep = this.checkforReinstateConstraint(constraints.skip.and.or.constraints);
                }
            }
        }
        return isReinstateStep;
    }

    checkforReinstateConstraint(constraints: any): boolean {
        let returnVal = false;
        if (constraints.filter((constraint) => constraint.type === "REINSTATEMENT_IS_REQUIRED").pop()) {
            returnVal = true;
        }
        return returnVal;
    }

    ngAfterViewChecked(): void {
        if (this.progressIndicator && this.applicationData && this.completeCheck) {
            this.completeCheck = false;
            this.checkCompletedSteps();
            this.checkStepConstraints(0, 0, true);
        }
        this.cdr.detectChanges();
    }

    checkCompletedSteps(): void {
        let stepCompleted = true;
        for (const section of this.applicationData.appData.sections) {
            for (const stepArray of section.steps) {
                if (!stepArray.completed) {
                    stepCompleted = false;
                    break;
                }
            }
            if (!stepCompleted) {
                break;
            }
            if (stepCompleted) {
                this.changeSelectedIndex(1);
            }
        }
        if (stepCompleted) {
            this.allPlansCompleted = true;
        }
        if (!this.allPlansCompleted) {
            this.appFlowService.showStaticStep.next(this.staticStep.NORMAL_STEP);
        }
        if (this.allPlansCompleted && this.showAflacAlways) {
            const aflacSteps = this.store
                .selectSnapshot(EnrollmentState.GetAflacAlways)
                .filter((data) => data.applicationType === StepType.REINSTATEMENT && data.itemId === this.cartItem.id);
            for (const item of aflacSteps) {
                if (!item.steps.filter((step) => step.completed).pop()) {
                    this.paymentNotCompleted = true;
                    break;
                }
            }
        }
        if (this.allPlansCompleted && !this.paymentNotCompleted && this.showAflacAlways) {
            this.lastCompletedStaticStep = 1;
            this.changeSelectedIndex(1);
        }
    }

    changeSelectedIndex(value: number): void {
        this.progressIndicator.linear = false;
        this.progressIndicator.selectedIndex += value;
        this.completedSectionIndex += value;
        this.progressIndicator.linear = true;
    }

    saveSkippedStepResponse(stepId: number): void {
        const responses = [];
        const stepResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
        responses.push(stepResponse);
        this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.data.planId }));
        this.shoppingCartDisplayService
            .saveApplicationResponse(this.data.memberId, this.planObject.application.cartData.id, this.data.mpGroup, responses)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {},
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }

    loadActiveStepSectionDetails(sectionIndex: number, stepIndex: number): void {
        this.currentSectionIndex = sectionIndex;
        this.currentStepIndex = stepIndex;
        this.activeSectionId = this.getSectionId(this.currentSectionIndex.toString());
        this.activestepId = this.getStepId(this.currentSectionIndex.toString(), this.currentStepIndex.toString());
    }
    onBillingChange(event: any): void {
        this.appFlowService.paymentStepPosition.next(event.selectedIndex);
    }

    /**
     * Function to close the reinstate dialog
     * @returns void
     */
    discardReinstateDialog(): void {
        this.dialogRef.close();
    }
    ngOnDestroy(): void {
        if (this.uploadSubscription) {
            this.uploadSubscription.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
