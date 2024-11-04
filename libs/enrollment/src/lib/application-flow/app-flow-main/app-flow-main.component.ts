import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Component, OnInit, Input, OnChanges, AfterViewInit, OnDestroy, AfterContentChecked, ElementRef, ViewChild } from "@angular/core";
import { takeUntil, tap, switchMap } from "rxjs/operators";
import { Subject, Observable, forkJoin, of, Subscription } from "rxjs";
import { CartStatus, ShoppingService, ShoppingCartDisplayService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import {
    UpdateApplicationPanel,
    UpdateSkippedStepResponses,
    UpdateCartData,
    DeclineRiderCartItem,
    DualPlanYearState,
    EnrollmentState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import {
    ConfigName,
    CustomSection,
    CustomStep,
    RiderIndex,
    StepData,
    StepChangeDetails,
    TpiSSOModel,
    DualPlanYearSettings,
    AddCartItem,
    GetCartItems,
    ApplicationResponse,
    MemberQualifyingEvent,
    StepType,
    StepTitle,
} from "@empowered/constants";

@Component({
    selector: "empowered-app-flow-main",
    templateUrl: "./app-flow-main.component.html",
    styleUrls: ["./app-flow-main.component.scss"],
})
export class AppFlowMainComponent implements OnInit, OnChanges, OnDestroy, AfterContentChecked, AfterViewInit {
    @Input() tpiSSODetails: TpiSSOModel;
    @Input() planObject: StepData;
    @ViewChild("planDiv") appFlowPlan: ElementRef;
    updatedPlanObject: StepData;
    showComponents = true;
    stepTitle = StepTitle;
    stepType = StepType;
    private readonly unsubscribe$ = new Subject<void>();
    showSpinner = false;
    activeSectionId = "";
    activestepId = "";
    sectionClicked = false;
    // TODO : default the below index to 0 after data clean up is done
    currentSectionIndex = 0;
    currentStepIndex = 0;
    riderIndexToCompare: RiderIndex;
    riderSectionId: number;
    sectionChangesOnNext = false;
    unBlur = false;
    riderSectionBlur = true;
    sectionToScroll = null;
    previousSectionScroll = false;
    ridersOnLoad = false;
    mpGroup: number;
    memberId: number;
    riderSectionIndex;
    skippedSteps: ApplicationResponse[] = [];
    hasApiError = false;
    errorMessage: string;
    isRider = false;
    fromDirect = false;
    hasAflacAlways = false;
    hasEBSBilling = false;
    isLastStep = false;
    tpiProducerId: number;
    tpiAssistingAdminId: number;
    currentQleId: number;
    firstOnLoad = false;
    primarySheRider: number;
    secondarySheRider: number;
    readonly BENEFICIARY_TITLE = "Beneficiaries";
    readonly RIDERS_TITLE = "Riders";
    appStepDynamicHeight: number;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly store: Store,
        private readonly shoppingService: ShoppingService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly utilService: UtilService,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * @description ng life cycle hook
     * Method to initialize data
     */
    ngOnInit(): void {
        this.getUserDetailsFromStore();
        this.checkAflacAlways();
        this.getTpiAssistingAdminId();
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$?.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        this.appFlowService.updateActiveStepDetails$.subscribe((data) => {
            if (this.riderSectionIndex ? data.currentSectionIndex !== this.riderSectionIndex : true) {
                this.riderSectionBlur = true;
            } else {
                this.riderSectionBlur = false;
            }
            this.currentSectionIndex = data.currentSectionIndex;
            this.currentStepIndex = data.currentStepIndex;
            this.activeSectionId = this.getSectionId(this.currentSectionIndex.toString());
            this.activestepId = this.getStepId(this.currentSectionIndex.toString(), this.currentStepIndex.toString());
            this.appFlowService.planValuesChanged$.next(data);
        });
        this.appFlowService.loadSpinner$.pipe(takeUntil(this.unsubscribe$)).subscribe((input) => {
            this.showSpinner = input;
        });
        this.staticUtilService
            .cacheConfigValue(ConfigName.PRIMARY_SHE_RIDER)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planId) => {
                this.primarySheRider = +planId;
            });
        this.staticUtilService
            .cacheConfigValue(ConfigName.SECONDARY_SHE_RIDER)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planId) => {
                this.secondarySheRider = +planId;
            });
        this.appFlowService.stepChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((details) => {
            if (details.planObject.rider) {
                if (details.sectionIndex >= 0 && details.stepIndex >= 0) {
                    const rider = details.planObject.rider;
                    this.updatedPlanObject.application.riders[rider.riderIndex].appData.sections[rider.riderSectionIndex].steps[
                        rider.riderStepIndex
                    ].step.forEach((step) => {
                        step.completed = true;
                    });
                }
                this.validateRiderStepChange(details);
            } else {
                if (
                    details.sectionIndex >= 0 &&
                    details.stepIndex >= 0 &&
                    this.updatedPlanObject.application.appData.sections.length &&
                    this.updatedPlanObject.application.appData.sections[details.sectionIndex].steps.length
                ) {
                    this.updatedPlanObject.application.appData.sections[details.sectionIndex].steps[details.stepIndex].completed = true;
                }
                this.validateStepChange(details);
            }
        });
        this.appFlowService.CustomSectionChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((section) => {
            const sectionId = this.getSectionId(section.sectionIndex);
            this.sectionClicked = true;
            this.previousSectionScroll = true;
            this.scrollToDiv(sectionId);
        });

        this.appFlowService.riderDiscard$.pipe(takeUntil(this.unsubscribe$)).subscribe((details) => {
            this.handleRiderDiscard(details.planObject, details.riderIndex);
        });
        this.appFlowService.demographicsStepSkipped$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            const planObject: StepData = data.planObject;
            if (!data.planObject.rider) {
                this.updatedPlanObject.application.appData.sections[data.sectionId].steps[data.currentStep].prefilled = true;
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
            } else {
                this.updatedPlanObject.application.riders[planObject.rider.riderIndex].appData.sections[data.sectionId].steps[
                    data.currentStep
                ].prefilled = true;
                this.updatedPlanObject.application.riders[planObject.rider.riderIndex].appData.sections[data.sectionId].steps[
                    data.currentStep
                ].showStep = false;
            }
        });
    }

    /**
     * Life cycle hook called after view init used to set minHeight
     */
    ngAfterViewInit(): void {
        this.appStepDynamicHeight = this.appFlowPlan?.nativeElement.clientHeight;
    }

    ngAfterContentChecked(): void {
        if (this.sectionToScroll && document.getElementById(this.sectionToScroll) && this.previousSectionScroll) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            if (this.getNextInputElement(this.sectionToScroll)) {
                this.getNextInputElement(this.sectionToScroll).focus();
            }
            this.previousSectionScroll = false;
        } else if (
            this.sectionToScroll &&
            document.getElementById(this.sectionToScroll) &&
            document.getElementById(this.sectionToScroll).classList.contains("active-section")
        ) {
            document.getElementById(this.sectionToScroll).scrollIntoView();
            if (this.getNextInputElement(this.sectionToScroll)) {
                this.getNextInputElement(this.sectionToScroll).focus();
            }
            this.sectionToScroll = null;
        }
    }
    /**
     * loads application data based on changes in input planObject
     */
    ngOnChanges(): void {
        if (this.planObject) {
            this.riderSectionBlur = true;
            this.updatedPlanObject = this.utilService.copy(this.planObject);
            const riderSectionIndex = this.getRiderSectionIndex();
            if (riderSectionIndex) {
                this.riderSectionIndex = riderSectionIndex;
            }
            this.checkStepConstraints(0, 0, true);
            if (this.planObject.blurFlag) {
                this.unBlur = false;
                this.appFlowService.lastCompletedSectionIndex$.next({ index: this.currentSectionIndex, unblur: false });
            } else {
                this.scrollToDiv(this.getSectionId("0"));
                this.unBlur = true;
                this.riderSectionBlur = false;
                this.appFlowService.lastCompletedSectionIndex$.next({
                    index: this.currentSectionIndex,
                    unblur: true,
                });
                this.currentSectionIndex = this.planObject.application.appData.sections.length;
            }
        }
    }
    /**
     * To get assisting admin id in TPI flow
     */
    getTpiAssistingAdminId(): void {
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
    }
    getNextInputElement(section: string): HTMLElement {
        const element: HTMLElement = document.querySelector(
            "#" + section + " input, #" + section + " textarea, #" + section + " button, #" + section + " mat-select",
        );
        return element;
    }
    /**
     * @description checks various constraints and decides what step to execute
     * @param sectionIndex {number} the index of the section active
     * @param stepIndex {number} the index of the step active in the particular section
     * @param onLoad {boolean} to determine whether function is called onLoad or not
     */
    checkStepConstraints(sectionIndex: number, stepIndex: number, onLoad?: boolean): void {
        const ADDITIONAL_CONTRIBUTION_QST_TITLE = "Additional Contribution";
        const cartData = this.store
            .selectSnapshot(EnrollmentState.GetCartItem)
            .filter((cart) => cart.id === this.planObject.application.cartData.id)
            .pop();
        const steps = this.planObject.application.appData.sections[sectionIndex].steps;
        if (this.planObject.application.appData.sections[sectionIndex].title === ADDITIONAL_CONTRIBUTION_QST_TITLE) {
            this.appFlowService.additionalContributionSet(true);
        }
        if (
            steps[stepIndex].step.length &&
            (this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].prefilled ||
                this.appFlowService.skipOnConstraints(
                    steps[stepIndex].step[0].constraintAggregates,
                    this.planObject.application.appData.planId,
                    this.planObject,
                    cartData,
                ))
        ) {
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].showStep = false;
            let showSection = false;
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps.forEach((step) => {
                if (step.showStep) {
                    showSection = true;
                }
            });
            this.updatedPlanObject.application.appData.sections[sectionIndex].showSection = showSection;
            this.planObject.application.appData.sections[sectionIndex].steps[stepIndex].step.forEach((step, i) => {
                this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step[i].showStep = false;
            });
            if (!onLoad) {
                const stepId = this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step[0].id;
                const stepResponse: ApplicationResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
                this.skippedSteps.push(stepResponse);
                this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.planObject.basePlanId }));
            }
            if (stepIndex < steps.length - 1) {
                stepIndex += 1;
                this.checkStepConstraints(sectionIndex, stepIndex, onLoad);
            } else if (stepIndex === steps.length - 1) {
                if (this.planObject.application.appData.sections.length - 1 <= sectionIndex) {
                    if (onLoad) {
                        this.loadStepSection(sectionIndex, stepIndex, onLoad);
                    } else {
                        this.saveSkippedStepResponse(this.skippedSteps, this.planObject.application.cartData.id)
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (resp) => {
                                    this.changeProduct();
                                },
                                (error) => {
                                    this.handleSecondaryError(error);
                                },
                            );
                    }
                } else {
                    this.checkStepConstraints(sectionIndex + 1, 0, onLoad);
                }
            }
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            this.updatedPlanObject.application.appData.sections[sectionIndex].showSection = true;
            this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].showStep = true;
            this.planObject.application.appData.sections[sectionIndex].steps[stepIndex].step.forEach((step, i) => {
                this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step[i].showStep = true;
            });
            if (this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].completed && onLoad) {
                if (stepIndex < steps.length - 1) {
                    stepIndex += 1;
                    this.checkStepConstraints(sectionIndex, stepIndex, onLoad);
                } else if (stepIndex === steps.length - 1) {
                    if (this.planObject.application.appData.sections.length - 1 <= sectionIndex) {
                        this.loadStepSection(sectionIndex, stepIndex, onLoad);
                    } else {
                        this.checkStepConstraints(sectionIndex + 1, 0, onLoad);
                    }
                }
            } else if (this.skippedSteps.length) {
                this.showSpinner = true;
                this.saveSkippedStepResponse(this.skippedSteps, this.planObject.application.cartData.id)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (resp) => {
                            this.showSpinner = false;
                            this.loadStepSection(sectionIndex, stepIndex, onLoad);
                        },
                        (error) => {
                            this.handleSecondaryError(error);
                        },
                    );
            } else {
                this.firstOnLoad = true;
                this.loadStepSection(sectionIndex, stepIndex, onLoad);
            }
        }
    }

    loadActiveStepSectionDetails(sectionIndex: number, stepIndex: number): void {
        this.currentSectionIndex = sectionIndex;
        this.currentStepIndex = stepIndex;
        this.activeSectionId = this.getSectionId(this.currentSectionIndex.toString());
        this.activestepId = this.getStepId(this.currentSectionIndex.toString(), this.currentStepIndex.toString());
    }
    /**
     * Saves skipped step responses
     * @param responses - data of skip steps
     */
    saveSkippedStepResponse(responses: ApplicationResponse[], cartId: number): Observable<ApplicationResponse> {
        this.skippedSteps = [];
        return this.shoppingCartDisplayService.saveApplicationResponse(this.memberId, cartId, this.mpGroup, responses);
    }

    loadStepSection(sectionIndex: number, stepIndex: number, onLoad: boolean): void {
        const riderSection = this.updatedPlanObject.application.appData.sections
            .filter((section) => section.title === StepTitle.RIDERS)
            .pop();
        this.getLastStepForFooter(sectionIndex, stepIndex, riderSection);
        const coverageSection: CustomSection = this.getCoverageSection();
        if (coverageSection && sectionIndex === coverageSection.sectionId) {
            this.appFlowService.updateAncillaryOnStepChange(sectionIndex);
        }

        if (this.getSectionIndexFromId(this.activeSectionId) === sectionIndex) {
            this.currentStepIndex = stepIndex;
            this.loadActiveStepSectionDetails(sectionIndex, stepIndex);
            this.scrollToDiv(this.getStepId(sectionIndex.toString(), stepIndex.toString()));
        } else {
            this.currentStepIndex = stepIndex;
            this.currentSectionIndex = sectionIndex;
            const sectionId = this.getSectionId(sectionIndex.toString());
            this.activeSectionId = sectionId;
            this.activestepId = this.getStepId(this.currentSectionIndex.toString(), this.currentStepIndex.toString());
            this.appFlowService.lastCompletedSectionIndex$.next({ index: sectionIndex, unblur: false });
            this.sectionChangesOnNext = true;
            if (riderSection && sectionIndex === riderSection.sectionId) {
                const details = {
                    planObject: this.getTempRiderPlanObject(riderSection.sectionId),
                    sectionIndex: riderSection.sectionId,
                    stepIndex: 0,
                };
                this.riderIndexToCompare = details.planObject.rider;
                this.checkRiderStepConstraints(0, 0, 0, details, onLoad, true);
            } else {
                this.scrollToDiv(sectionId);
                this.scrollToDiv(this.getStepId(sectionIndex.toString(), stepIndex.toString()));
            }
        }
        // handle on load
        if (riderSection && riderSection.sectionId < sectionIndex && onLoad) {
            this.ridersOnLoad = true;
            this.riderSectionBlur = false;
            const details = {
                planObject: this.getTempRiderPlanObject(riderSection.sectionId),
                sectionIndex: riderSection.sectionId,
                stepIndex: 0,
            };
            this.riderIndexToCompare = details.planObject.rider;
            this.checkRiderStepConstraints(0, 0, 0, details, true, false);
            this.updateShowRiderFlag();
        }
    }

    /**
     * @description: Function to determine if the showStep value is true for any of the steps from the API
     * @param riderIndex: Particular rider Index
     * @param sectionIndex: Particular section Index for which the steps are to be checked
     * @returns: Return boolean based on the showStep value in the steps array
     */
    checkForShowStep(riderIndex: number, sectionIndex: number): boolean {
        let isRiderDecline = true;
        this.updatedPlanObject.application.riders[riderIndex].appData.sections.forEach((section) => {
            isRiderDecline =
                isRiderDecline &&
                section.steps.some((step) => !(step.showStep && step.step.length && step.step[0].type === StepType.PLANOPTIONS));
        });
        return isRiderDecline;
    }

    /**
     * It will check if it's direct payment or aflac always
     */
    checkAflacAlways(): void {
        this.fromDirect = Boolean(this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length);
        this.hasAflacAlways = Boolean(this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length);
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }

    /**
     * To get the last step of every application
     * @param sectionIndex index of section
     * @param stepIndex index of step
     * @param riderSection Rider section data
     */
    getLastStepForFooter(sectionIndex: number, stepIndex: number, riderSection: CustomSection): void {
        this.isRider = riderSection && sectionIndex === riderSection.sectionId;
        if (
            sectionIndex === this.updatedPlanObject?.application?.appData?.sections?.length - 1 &&
            this.updatedPlanObject?.application?.appData?.sections[sectionIndex]?.steps?.length - 1 === stepIndex &&
            !this.isRider
        ) {
            this.isLastStep = true;
            const productName = this.appFlowService.onNextTPIButton(
                this.isLastStep,
                this.updatedPlanObject.nextProduct,
                this.hasAflacAlways,
                this.fromDirect,
                this.hasEBSBilling,
            );
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: productName,
            });
        } else {
            this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
        }
    }

    /**
     * @description: Function to determine if there are any rider constraints
     * @param sectionIndex: the particular rider section Index
     * @param stepIndex: particular rider step Index
     * @param riderIndex: the particular rider
     * @param details: details field from the API
     * @param onLoad: boolean to find out if it is on load
     * @param firstRider: Boolean to check if it's the first rider
     */
    checkRiderStepConstraints(
        sectionIndex: number,
        stepIndex: number,
        riderIndex: number,
        details: StepChangeDetails,
        onLoad: boolean,
        firstRider: boolean,
    ): void {
        const cartData = this.store
            .selectSnapshot(EnrollmentState.GetCartItem)
            .filter((cart) => cart.id === this.planObject.application.cartData.id)
            .pop();
        const steps =
            this.planObject.application.riders.length > riderIndex &&
            this.planObject.application.riders[riderIndex].appData.sections.length > sectionIndex &&
            this.planObject.application.riders[riderIndex].appData.sections[sectionIndex].steps.length > stepIndex
                ? this.planObject.application.riders[riderIndex].appData.sections[sectionIndex].steps
                : [];
        details.planObject.application = this.planObject.application.riders[riderIndex];
        const validatedConstraintFlag =
            steps.length > 0 && steps[stepIndex].step.length
                ? this.appFlowService.skipOnConstraints(
                      steps[stepIndex].step[0].constraintAggregates,
                      this.planObject.application.appData.planId,
                      details.planObject,
                      cartData,
                      this.updatedPlanObject.application.appData.id,
                      [this.primarySheRider, this.secondarySheRider],
                  )
                : false;
        if (
            steps.length > 0 &&
            steps[stepIndex].step.length &&
            (this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].prefilled ||
                validatedConstraintFlag)
        ) {
            this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].showStep = false;
            const planOptionsStep = this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[
                stepIndex
            ].step
                .filter((step) => step.type === this.stepType.PLANOPTIONS || step.type === this.stepType.COVERAGELEVELCHOICE)
                .pop();
            if (planOptionsStep && this.checkForShowStep(riderIndex, sectionIndex)) {
                this.showSpinner = true;
                this.updateCartDataForDeclinedRider(riderIndex)
                    .pipe(
                        switchMap((resp) =>
                            forkJoin(
                                this.shoppingCartDisplayService.getAncillaryInformation(
                                    this.memberId,
                                    this.getRiderCartId(riderIndex),
                                    this.mpGroup,
                                    this.planObject.application.riders[riderIndex].appData.planId,
                                ),
                                onLoad ? of(null) : this.updateSkippedStepsInRiders(riderIndex, sectionIndex, stepIndex),
                            ),
                        ),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe(
                        ([ancillaryInformation]) => {
                            this.showSpinner = false;
                            this.appFlowService.patchConstraint(
                                this.planObject.application.riders[riderIndex].appData.id,
                                "",
                                ancillaryInformation,
                            );
                            this.updateRiderSteps(riderIndex, sectionIndex, stepIndex, steps, details, onLoad);
                        },
                        (error) => {
                            this.showSpinner = false;
                        },
                    );
            } else if (!onLoad) {
                this.showSpinner = true;
                this.updateSkippedStepsInRiders(riderIndex, sectionIndex, stepIndex)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (resp) => {
                            this.showSpinner = false;
                            this.updateRiderSteps(riderIndex, sectionIndex, stepIndex, steps, details, onLoad);
                        },
                        (error) => {
                            this.showSpinner = false;
                        },
                    );
            } else {
                this.updateRiderSteps(riderIndex, sectionIndex, stepIndex, steps, details, onLoad);
            }
        } else {
            this.checkRiderConstraints(riderIndex, sectionIndex, stepIndex, onLoad, steps, details, firstRider);
        }
    }
    /**
     *
     * @param riderIndex Index of rider
     * @param sectionIndex Index of section
     * @param stepIndex Index of step
     * @param onLoad Is the step to onload or not
     * @param steps Array of Steps
     * @param details Details of plan option
     * @param firstRider Index of first rider
     * @return Returns void
     */
    checkRiderConstraints(
        riderIndex: number,
        sectionIndex: number,
        stepIndex: number,
        onLoad: boolean,
        steps: CustomStep[],
        details: StepChangeDetails,
        firstRider: boolean,
    ): void {
        this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].showStep = true;
        this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].showSection = true;
        this.planObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step.forEach((step, i) => {
            this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step[i].showStep = true;
        });
        this.checkEnrollmentRequirementsAndEnableRiderScroll(riderIndex, sectionIndex, stepIndex, details, steps, onLoad, firstRider);
    }
    /**
     *
     * @param riderIndex Index of rider
     * @param sectionIndex Index of section
     * @param onLoad Is the step to onload or not
     * @param details Details of plan option
     * @return Returns void
     */
    riderStepConstraint(riderIndex: number, sectionIndex: number, onLoad: boolean, details: StepChangeDetails): void {
        if (sectionIndex >= this.planObject.application.riders[riderIndex].appData.sections.length - 1) {
            if (this.updatedPlanObject.application.riders.length > riderIndex + 1) {
                this.checkRiderStepConstraints(0, 0, riderIndex + 1, details, onLoad, false);
            } else if (!onLoad) {
                this.navigateFromRidersSection(details);
            }
        } else {
            this.checkRiderStepConstraints(sectionIndex + 1, 0, riderIndex, details, onLoad, false);
        }
    }

    mapData(sectionIndex: any, stepIndex: number): StepData {
        return {
            index: `${sectionIndex}${stepIndex}`,
            application: this.updatedPlanObject.application,
            currentSection: this.updatedPlanObject.application.appData.sections[sectionIndex],
            currentStep: stepIndex,
            steps: this.updatedPlanObject.application.appData.sections[sectionIndex].steps[stepIndex].step,
            lastStep:
                sectionIndex === this.updatedPlanObject.application.appData.sections.length - 1
                    ? this.updatedPlanObject.application.appData.sections[sectionIndex].steps.length - 1 === stepIndex
                        ? true
                        : false
                    : false,
            nextProduct: this.updatedPlanObject.nextProduct,
            basePlanId: this.updatedPlanObject.basePlanId,
        };
    }

    updateStepper(sectionId: string): void {
        if (sectionId) {
            if (this.sectionClicked) {
                this.sectionClicked = false;
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else if (this.unBlur || this.getSectionIndexFromId(sectionId) <= this.getSectionIndexFromId(this.activeSectionId)) {
                this.appFlowService.scrolledIndex$.next({
                    sectionIndex: this.getSectionIndexFromId(sectionId),
                });
            }
            if (this.sectionChangesOnNext) {
                this.sectionChangesOnNext = false;
                this.appFlowService.scrolledIndex$.next({
                    sectionIndex: this.getSectionIndexFromId(sectionId),
                });
            }
        }
    }

    getSectionId(index: string): string {
        return "section" + "_" + index;
    }
    getStepId(sectionIndex: string, stepIndex: string): string {
        return "section" + "_" + sectionIndex + "_step_" + stepIndex;
    }
    scrollToDiv(section: string): void {
        this.sectionToScroll = section;
    }
    getSectionIndexFromId(sectionId: string): number | undefined {
        if (sectionId) {
            const splitArray = sectionId.split("_");
            // eslint-disable-next-line radix
            return parseInt(splitArray[splitArray.length - 1]);
        }
        return undefined;
    }
    changeProduct(): void {
        if (this.updatedPlanObject.application.riders) {
            this.store.dispatch(
                new UpdateApplicationPanel(this.updatedPlanObject.application.appData, this.updatedPlanObject.application.riders),
            );
        } else {
            if (this.memberId) {
                const cartData = this.store
                    .selectSnapshot(EnrollmentState.GetCartItem)
                    .filter((cartItem) => cartItem.id === this.updatedPlanObject.application.cartData.id)
                    .pop();
                if (cartData) {
                    this.shoppingService
                        .updateCartItem(this.memberId, this.mpGroup, cartData.id, this.getCartItem(cartData))
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe();
                }
            }
            this.store.dispatch(new UpdateApplicationPanel(this.updatedPlanObject.application.appData, null));
        }
        this.store.dispatch([
            new UpdateCartData(this.planObject.application.cartData.id, this.planObject.application.cartData.planOffering.id),
        ]);
        this.appFlowService.planChanged$.next({
            nextClicked: true,
            discard: false,
        });
    }

    /**
     * Function to get the cart item data
     * @param cartData Get the existing cart item data
     * @returns Returns the cart object with updated data
     */
    getCartItem(cartData: GetCartItems): AddCartItem {
        const cartObject: AddCartItem = {
            planOfferingId: cartData.planOffering.id,
            memberCost: cartData.memberCost,
            totalCost: cartData.totalCost,
            enrollmentMethod: cartData.enrollmentMethod,
            enrollmentState: cartData.enrollmentState,
            coverageLevelId: cartData.coverageLevelId,
            status: CartStatus.COMPLETE,
            dependentAge: cartData.dependentAge || null,
        };
        if (cartData.benefitAmount) {
            cartObject.benefitAmount = cartData.benefitAmount;
        }
        if (cartData.enrollmentCity) {
            cartObject.enrollmentCity = cartData.enrollmentCity;
        }
        if (cartData.riders && cartData.riders.length) {
            cartObject.riders = cartData.riders;
        } else {
            cartObject.riders = [];
        }
        if (cartData.assistingAdminId || this.tpiAssistingAdminId) {
            cartObject.assistingAdminId = this.appFlowService.mapAssistingAdminId(cartData.assistingAdminId);
        }
        if (cartData.riskClassOverrideId) {
            cartObject.riskClassOverrideId = cartData.riskClassOverrideId;
        }
        cartObject.subscriberQualifyingEventId =
            this.currentQleId && cartData.planOffering && cartData.planOffering.planYearId ? this.currentQleId : null;
        // TODO - Need to add logic for riders
        return cartObject;
    }
    validateRiderStepChange(details: any): void {
        this.riderSectionId = details.sectionIndex;
        if (details.stepIndex >= 0) {
            // this.riderSectionId = details.sectionIndex;
            this.riderIndexToCompare = details.planObject.rider;
            if (
                this.updatedPlanObject.application.riders[this.riderIndexToCompare.riderIndex].appData.sections[
                    details.planObject.rider.riderSectionIndex
                ].steps.length -
                    1 ===
                    details.planObject.rider.riderStepIndex &&
                this.updatedPlanObject.application.riders[this.riderIndexToCompare.riderIndex].appData.sections.length - 1 ===
                    details.planObject.rider.riderSectionIndex &&
                details.planObject.rider.riderIndex === this.planObject.application.riders.length - 1
            ) {
                this.navigateFromRidersSection(details);
            } else {
                const riderPlanObject: StepData = details.planObject;
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                details.planObject.currentSection &&
                this.planObject.application.riders[riderPlanObject.rider.riderIndex].appData.sections[
                    riderPlanObject.rider.riderSectionIndex
                ].steps.length -
                    1 >
                    riderPlanObject.rider.riderStepIndex
                    ? this.checkRiderStepConstraints(
                          this.riderIndexToCompare.riderSectionIndex,
                          this.riderIndexToCompare.riderStepIndex + 1,
                          this.riderIndexToCompare.riderIndex,
                          details,
                          null,
                          false,
                      )
                    : this.planObject.application.riders[riderPlanObject.rider.riderIndex].appData.sections.length - 1 >
                      riderPlanObject.rider.riderSectionIndex
                    ? this.checkRiderStepConstraints(
                          this.riderIndexToCompare.riderSectionIndex + 1,
                          0,
                          this.riderIndexToCompare.riderIndex,
                          details,
                          null,
                          false,
                      )
                    : this.planObject.application.riders.length - 1 > riderPlanObject.rider.riderIndex
                    ? this.checkRiderStepConstraints(0, 0, this.riderIndexToCompare.riderIndex + 1, details, null, false)
                    : this.navigateFromRidersSection(details);
            }
        }
        if (this.ridersOnLoad) {
            this.riderIndexToCompare = details.planObject.rider;
            this.checkRiderStepConstraints(0, 0, 0, details, true, true);
            this.ridersOnLoad = false;
        }
    }
    /**
     * to navigate from riders last step to either next plan or next section in same plan
     * @param details details with plan data, section and step Indexes
     */
    navigateFromRidersSection(details: StepChangeDetails): void {
        const riderSection = this.getRiderSectionIndex();
        this.updateShowRiderFlag();
        if (riderSection) {
            this.riderSectionId = riderSection;
        }
        const planObject: StepData = {
            application: this.updatedPlanObject.application,
            currentSection: this.planObject.application.appData.sections[this.riderSectionId],
            currentStep: 0,
            steps: details.steps,
            basePlanId: this.planObject.basePlanId,
        };
        const stepId = this.planObject.application.appData.sections[this.riderSectionId].steps[0].step[0].id;
        const stepResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
        this.skippedSteps.push(stepResponse);
        this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.planObject.application.planId }));
        this.saveSkippedStepResponse(this.skippedSteps, this.planObject.application.cartData.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        if (this.riderSectionId === this.planObject.application.appData.sections.length - 1) {
            this.changeProduct();
        } else {
            this.shoppingCartDisplayService
                .getAncillaryInformation(
                    this.memberId,
                    this.updatedPlanObject.application.cartData.id,
                    this.mpGroup,
                    this.updatedPlanObject.application.planId,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.appFlowService.patchConstraint(this.updatedPlanObject.application.appData.id, "", resp);
                        this.appFlowService.onNextClick(planObject, planObject.currentStep, details.sectionTitle);
                    },
                    (error) => {
                        this.handleSecondaryError(error);
                    },
                );
        }
    }
    /**
     * this function will validate all step change events based on details object and will change product accordingly
     * @param details is a StepChangeDetails object which will hold all step change details
     */
    validateStepChange(details: StepChangeDetails): void {
        this.hasApiError = false;
        this.unBlur = true;
        if (
            details.planObject.currentSection &&
            this.planObject.application.appData.sections[details.sectionIndex].steps.length - 1 > details.stepIndex
        ) {
            this.checkStepConstraints(details.sectionIndex, details.stepIndex + 1);
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (details.sectionIndex === this.planObject.application.appData.sections.length - 1) {
                let lastFlag = true;
                if (details.stepIndex === details.planObject.currentSection.steps.length - 1) {
                    this.changeProduct();
                } else {
                    this.planObject.application.appData.sections[details.sectionIndex].steps
                        .splice(details.stepIndex + 1)
                        .forEach((step) => {
                            if (step.showStep) {
                                lastFlag = true;
                            }
                        });
                    if (lastFlag) {
                        this.changeProduct();
                    }
                }
            } else {
                this.checkStepConstraints(details.sectionIndex + 1, 0);
            }
        }
    }
    navigateToNextProduct(): void {
        this.changeProduct();
    }
    navigateToPreviousProduct(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: false,
            discard: false,
        });
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     * Method to handle rider discard
     * @param planObject : Step data to remove rider
     * @param riderIndex :  rider index to remove rider
     */
    handleRiderDiscard(planObject: StepData, riderIndex: number): void {
        this.updatedPlanObject.application.riders[riderIndex].discard = true;
        this.updatedPlanObject.application.riders[riderIndex].appData.sections.forEach((section, s) => {
            this.updatedPlanObject.application.riders[riderIndex].appData.sections[s].showSection = false;
            this.planObject.application.riders[riderIndex].appData.sections[s].steps.forEach((step, i) => {
                this.updatedPlanObject.application.riders[riderIndex].appData.sections[s].steps[i].showStep = false;

                step.step.forEach((element, j) => {
                    this.updatedPlanObject.application.riders[riderIndex].appData.sections[s].steps[i].step[j].showStep = false;
                });
            });
        });
        if (riderIndex < this.updatedPlanObject.application.riders.length - 1) {
            const riderPlanObject = planObject;
            riderPlanObject.rider.riderIndex = planObject.rider.riderIndex;
            riderPlanObject.rider.riderSectionIndex = this.updatedPlanObject.application.riders[riderIndex].appData.sections.length - 1;
            riderPlanObject.rider.riderStepIndex =
                this.updatedPlanObject.application.riders[riderIndex].appData.sections[
                    this.updatedPlanObject.application.riders[riderIndex].appData.sections.length - 1
                ].steps.length - 1;
            this.validateRiderStepChange({
                planObject: riderPlanObject,
                sectionIndex: this.updatedPlanObject.application.riders[riderIndex].appData.sections.length,
                stepIndex:
                    this.updatedPlanObject.application.riders[riderIndex].appData.sections[
                        this.updatedPlanObject.application.riders[riderIndex].appData.sections.length - 1
                    ].steps.length,
            });
        } else {
            this.navigateFromRidersSection({
                planObject: planObject,
                sectionIndex: planObject.currentSection.sectionId,
                stepIndex: 0,
            });
        }
    }
    enableRiderScroll(riderIndex: number, sectionIndex: number, stepIndex: number): void {
        const sectionToBeScrolled = `section_${this.getRiderSectionIndex()}_riders_${riderIndex}_${sectionIndex}_${stepIndex}`;
        this.appFlowService.ridersScroll$.next({
            section: sectionToBeScrolled,
            riderIndex: riderIndex,
            sectionIndex: sectionIndex,
            stepIndex: stepIndex,
        });
        this.sectionToScroll = sectionToBeScrolled;
    }

    /**
     * update the cart data for declined rider
     * @param riderIndex {number} : index of rider
     * @returns observable that updates cartItem
     */
    updateCartDataForDeclinedRider(riderIndex: number): Observable<HttpResponse<unknown>> {
        if (!this.memberId) {
            this.getUserDetailsFromStore();
        }
        this.store.dispatch(new DeclineRiderCartItem(riderIndex, this.planObject.application.planId, true));
        const riderToBeUpdated = this.planObject.application.cartData.riders
            .filter((rider) => rider.planId === this.planObject.application.riders[riderIndex].appData.planId)
            .pop();
        const cartData = {
            benefitAmount: 0,
            coverageLevelId: 2,
            memberCost: 0,
            totalCost: 0,
            dependentAge: this.planObject.application.cartData.dependentAge ? this.planObject.application.cartData.dependentAge : null,
            planOfferingId: riderToBeUpdated.planOfferingId,
            enrollmentMethod: this.planObject.application.cartData.enrollmentMethod,
            enrollmentState: this.planObject.application.cartData.enrollmentState,
            enrollmentCity: this.planObject.application.cartData.enrollmentCity,
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.planObject.application.cartData.assistingAdminId),
            parentCartItemId: this.planObject.application.cartData.id,
            subscriberQualifyingEventId:
                this.currentQleId &&
                this.planObject.application.cartData.planOffering &&
                this.planObject.application.cartData.planOffering.planYearId
                    ? this.currentQleId
                    : null,
        };
        return this.shoppingService.updateCartItem(this.memberId, this.mpGroup, riderToBeUpdated.cartItemId, cartData).pipe(
            tap((resp) => {
                this.store.dispatch(
                    new UpdateCartData(
                        this.updatedPlanObject.application.cartData.id,
                        this.updatedPlanObject.application.cartData.planOffering.id,
                    ),
                );
            }),
        );
    }
    /**
     * this function will check enrollment restrictions and will enable scroll to rider steps
     * @param riderIndex index of rider in riders array of the enrollment applications
     * @param sectionIndex index of section in rider sections
     * @param stepIndex index of step in a rider section
     * @param details is a StepChangeDetails object which will hold all step change details
     * @param steps holds all the corresponding steps for the riderIndex, stepIndex, sectionIndex
     * @param onLoad boolean flag which determines if this function is called on load.
     * @param firstRider boolean flag which tells if this is a first rider
     */
    checkEnrollmentRequirementsAndEnableRiderScroll(
        riderIndex: number,
        sectionIndex: number,
        stepIndex: number,
        details: StepChangeDetails,
        steps: CustomStep[],
        onLoad: boolean,
        firstRider: boolean,
    ): void {
        if (
            (firstRider || this.riderIndexToCompare.riderIndex < riderIndex) &&
            (this.updatedPlanObject.application.riders[riderIndex].appData.sections.length === 0 ||
                (this.updatedPlanObject.application.riders[riderIndex].enrollmentRequirements &&
                    this.updatedPlanObject.application.riders[riderIndex].enrollmentRequirements.length > 0 &&
                    this.appFlowService.checkEnrollmentRestrictions(
                        this.updatedPlanObject.application.riders[riderIndex].enrollmentRequirements,
                        [this.primarySheRider, this.secondarySheRider],
                        this.updatedPlanObject.application.cartData.id,
                    )))
        ) {
            if (
                this.updatedPlanObject.application.riders[riderIndex] &&
                this.updatedPlanObject.application.riders[riderIndex].planId === this.secondarySheRider
            ) {
                this.appFlowService.setSheRiderDisableVal(true);
                this.enableRiderScroll(riderIndex, sectionIndex, stepIndex);
            } else {
                if (this.updatedPlanObject.application.riders[riderIndex].appData.sections.length > 0) {
                    this.UpdateRiderStepsDispayFlag(riderIndex, false);
                }
                this.showSpinner = true;
                this.updateCartDataForDeclinedRider(riderIndex)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((resp) => {
                        this.showSpinner = false;
                        if (this.planObject.application.riders.length <= riderIndex + 1) {
                            if (!onLoad) {
                                this.navigateFromRidersSection(details);
                            }
                        } else {
                            this.checkRiderStepConstraints(0, 0, riderIndex + 1, details, false, false);
                        }
                    });
            }
        } else if (onLoad) {
            const stepLengthToCompare = steps.length - 1;
            if (stepIndex < stepLengthToCompare) {
                stepIndex += 1;
                this.checkRiderStepConstraints(sectionIndex, stepIndex, riderIndex, details, onLoad, false);
            } else if (stepIndex === stepLengthToCompare) {
                this.riderStepConstraint(riderIndex, sectionIndex, onLoad, details);
            }
        } else {
            this.enableRiderScroll(riderIndex, sectionIndex, stepIndex);
        }
    }
    /**
     * this functions updated the rider steps display flag based on displayFlag param
     * @param riderIndex index of rider in enrollment application
     * @param displayFlag boolean which holds the status of display to be updated
     */
    UpdateRiderStepsDispayFlag(riderIndex: number, displayFlag: boolean): void {
        this.updatedPlanObject.application.riders[riderIndex].appData.sections.forEach((section, i) => {
            this.updatedPlanObject.application.riders[riderIndex].appData.sections[i].showSection = displayFlag;
            section.steps.forEach((step, j) => {
                this.updatedPlanObject.application.riders[riderIndex].appData.sections[i].steps[j].showStep = displayFlag;
                step.step.forEach((innerStep, k) => {
                    innerStep.showStep = displayFlag;
                    this.updatedPlanObject.application.riders[riderIndex].appData.sections[i].steps[j].step[k].showStep = displayFlag;
                });
            });
        });
    }
    /**
     * this function generates a temporary rider plan Object which is used to run enrollment restrictions validations
     * @param riderSectionId index of rider section in enrollment application
     * @returns StepData object which holds the plan enrollment details
     */
    getTempRiderPlanObject(riderSectionId: number): StepData {
        return {
            index: `${riderSectionId}${0}${0}`,
            application: this.planObject.application.riders[0],
            currentSection: this.planObject.application.riders[0].appData.sections[0],
            currentStep: 0,
            steps: this.planObject.application.riders[0].appData.sections[0].steps[0].step,
            rider: {
                riderIndex: 0,
                riderSectionIndex: 0,
                riderStepIndex: 0,
                riderSequenceId: riderSectionId,
            },
            basePlanId: this.planObject.basePlanId,
        };
    }
    /**
     * this function will update the rider section display flag after validating the rider steps constraints
     */
    updateShowRiderFlag(): void {
        let showRiders = false;
        for (const [index, rider] of this.updatedPlanObject.application.riders.entries()) {
            let showRiderFlag = false;
            for (const section of rider.appData.sections) {
                if (section.showSection) {
                    showRiderFlag = true;
                    break;
                }
            }
            this.updatedPlanObject.application.riders[index].showRider = showRiderFlag;
            if (showRiderFlag) {
                showRiders = true;
                break;
            }
        }
        const riderSectionIndex = this.getRiderSectionIndex();
        if (riderSectionIndex) {
            this.updatedPlanObject.application.appData.sections[riderSectionIndex].showSection = showRiders;
        }
    }
    /**
     * this function will get rider section index from base application
     * @returns index of the rider section in enrollment applications array
     */
    getRiderSectionIndex(): number {
        const riderSection = this.updatedPlanObject.application.appData.sections
            .filter((section) => section.title === StepTitle.RIDERS)
            .pop();
        if (riderSection) {
            return riderSection.sectionId;
        }
        return null;
    }
    /**
     * function to get coverage section from application
     * @return CoverageOptions Section form the enrollment application
     */
    getCoverageSection(): CustomSection {
        return this.updatedPlanObject.application.appData.sections
            .filter(
                (section) =>
                    section.steps &&
                    section.steps.length &&
                    section.steps
                        .filter((stepArray) => {
                            const stepTypes = stepArray.step.map((step) => step.type);
                            return stepTypes.indexOf(StepType.PLANOPTIONS) >= 0 || stepTypes.indexOf(StepType.COVERAGELEVELCHOICE) >= 0;
                        })
                        .pop(),
            )
            .pop();
    }
    /**
     * this function will update all rider steps objects field display flag which are skipped due to constraints
     * @param riderIndex index of rider in riders array of the enrollment applications
     * @param sectionIndex index of section in rider sections
     * @param stepIndex index of step in a rider section
     * @returns an observable with api calls to update skipped steps
     */
    updateSkippedStepsInRiders(riderIndex: number, sectionIndex: number, stepIndex: number): Observable<ApplicationResponse> {
        const skippedSteps = [];
        const stepId = this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step[0].id;
        const stepResponse: ApplicationResponse = { stepId: stepId, value: [], type: StepType.GENERICSTEP };
        skippedSteps.push(stepResponse);
        this.store.dispatch(
            new UpdateSkippedStepResponses({
                responses: stepResponse,
                planId: this.updatedPlanObject.application.riders[riderIndex].appData.planId,
            }),
        );
        return this.saveSkippedStepResponse(skippedSteps, this.getRiderCartId(riderIndex));
    }
    /**
     * this function will return rider cart id based on rider index param
     * @param riderIndex index of rider in riders array of the enrollment applications
     * @returns return rider cart id based on rider index param
     */
    getRiderCartId(riderIndex: number): number {
        const riderCartdata = this.updatedPlanObject.application.cartData.riders
            .filter((rider) => rider.planId === this.updatedPlanObject.application.riders[riderIndex].appData.planId)
            .pop();
        if (riderCartdata) {
            return riderCartdata.cartItemId;
        }
        return 0;
    }
    /**
     * this function will update the rider steps display flag based on constraints validated
     * @param riderIndex index of rider in riders array of the enrollment applications
     * @param sectionIndex index of section in rider sections
     * @param stepIndex index of step in a rider section
     * @param steps holds all the corresponding steps for the riderIndex, stepIndex, sectionIndex
     * @param details is a StepChangeDetails object which will hold all step change details
     * @param onLoad boolean flag which determines if this function is called on load.
     */
    updateRiderSteps(
        riderIndex: number,
        sectionIndex: number,
        stepIndex: number,
        steps: CustomStep[],
        details: StepChangeDetails,
        onLoad: boolean,
    ): void {
        this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step.forEach((step, i) => {
            this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps[stepIndex].step[i].showStep = false;
        });
        let showSection = false;
        this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].steps.forEach((step) => {
            if (step.showStep) {
                showSection = true;
            }
        });
        this.updatedPlanObject.application.riders[riderIndex].appData.sections[sectionIndex].showSection = showSection;
        if (stepIndex < steps.length - 1) {
            stepIndex += 1;
            this.checkRiderStepConstraints(sectionIndex, stepIndex, riderIndex, details, onLoad, false);
        } else if (stepIndex === steps.length - 1) {
            if (sectionIndex >= this.planObject.application.riders[riderIndex].appData.sections.length - 1) {
                if (this.updatedPlanObject.application.riders.length <= riderIndex + 1) {
                    if (!onLoad) {
                        this.navigateFromRidersSection(details);
                    }
                } else {
                    this.checkRiderStepConstraints(0, 0, riderIndex + 1, details, onLoad, false);
                }
            } else {
                this.checkRiderStepConstraints(sectionIndex + 1, 0, riderIndex, details, onLoad, false);
            }
        }
    }
    /**
     * this function will get current producer/member details from store
     */
    getUserDetailsFromStore(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
    }
    /**
     * Handles default secondary error. Sets error flag to true, stop spinner and loads error message.
     * @param error error response from api
     */
    handleSecondaryError(error: HttpErrorResponse): void {
        this.hasApiError = true;
        this.showSpinner = false;
        this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
    }
}
