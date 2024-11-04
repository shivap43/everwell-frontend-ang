import { EnrollmentState, UpdateHashKeys, EnrollmentMethodState, AppFlowService, AccountInfoState, TPIState } from "@empowered/ngxs-store";

import { Component, OnInit, Output, EventEmitter, ViewChild, Input, OnDestroy } from "@angular/core";
import { takeUntil, switchMap, tap } from "rxjs/operators";
import { Subject, defer, Observable, iif } from "rxjs";
import { AccountService, CoreService, MemberService } from "@empowered/api";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { Store } from "@ngxs/store";
import { Router, ActivatedRoute } from "@angular/router";
import { UserService } from "@empowered/user";
import { ENROLLMENT_SIDE_NAV, SIDE_NAV_LANGUAGES, SIDE_NAV_STEPS } from "./app-flow-sidenav.constant";
import { LanguageService } from "@empowered/language";
import {
    EnrollmentMethod,
    CarrierId,
    RESIDENT_STATE,
    BasePlanApplicationPanel,
    ResponseItem,
    HashKeys,
    StepData,
    StaticStep,
    AppSettings,
    Characteristics,
    MemberCredential,
    ProducerCredential,
    Accounts,
    StepType,
    PdaAccount,
    StepTitle,
} from "@empowered/constants";

const SIDE_NAV_CONFIG = {
    PDA: {
        mandatoryStateForPDA: ["PR"],
        pdaStepNo: 2,
        mandatoryPDAStepNo: 3,
    },
};

@Component({
    selector: "empowered-app-flow-sidenav",
    templateUrl: "./app-flow-sidenav.component.html",
    styleUrls: ["./app-flow-sidenav.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class AppFlowSidenavComponent implements OnInit, OnDestroy {
    @Input() carrierIds: number[];
    @Input() applicationData: BasePlanApplicationPanel[];
    @Output() planChangeEvent: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("paymentIndicator") paymentIndicator;
    @ViewChild("billingIndicator") billingIndicator;
    // finish application steps.
    @ViewChild("finishApplicationSteps") finishApplicationSteps;
    @Input() planObject: StepData;
    // TODO - hard coded application data for now, need to get data from store
    currentPlan: number;
    currentPlanIndex: number;
    currentSection: string;
    stepType = StepType;
    stepTitle = StepTitle;
    activeSectionIndex: number;
    staticStep = StaticStep;
    sideNavStaticStep = SIDE_NAV_STEPS;
    sideNavSteps: string[];
    carrierLength: number;
    /**
     * type can not be defined specifically carrier because carrier details is getting attached
     * based on availability [it can have any number of details]. Alternative is using arrays but
     * for that we have to call filter methods of array in html.
     */
    carrierDetails = {};
    private unsubscribe$ = new Subject<void>();
    completedCartIds: number[] = [];
    mpGroupId: number;
    lastCompletedSectionIndex: number;
    lastCompletedPaymentStep: number;
    lastCompletedBillingStep: number;
    lastCompletedStaticStep: number;
    enrollmentState: string;
    enrollmentMethod: string;
    enrollments = EnrollmentMethod;
    unblurFlag = false;
    showAflacAlways = true;
    showEBSBilling = false;
    showBilling = false;
    showPda: boolean;
    FACE_TO_FACE = AppSettings.FACE_TO_FACE;
    PUERTO_RICO = AppSettings.PUERTO_RICO;
    isStepperEditable = true;
    pdaStepNo = this.getPdaStepNo();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(SIDE_NAV_LANGUAGES);
    isTpi = false;
    isTpiMember = false;
    isAflacAlways = true;
    isPayment = true;
    resumeCheckCompleted = false;
    completedVf2fSteps = 0;
    onlyVASandPCPlans = false;
    ebsPaymentIndex = 0;
    showPreliminaryStatement: boolean;

    constructor(
        private readonly language: LanguageService,
        private readonly appFlowService: AppFlowService,
        private readonly coreService: CoreService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly userService: UserService,
        private readonly memberService: MemberService,
    ) {
        this.showPda = false;
    }

    /**
     * Oninit life cycle hook of angular. It will be called when component will be initialized.
     * @returns void
     */
    ngOnInit(): void {
        this.getCarrierDetails();
        const mpGroupObj = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        if (mpGroupObj && this.router.url.indexOf("payroll") >= 0) {
            this.mpGroupId = mpGroupObj;
        } else {
            this.mpGroupId = this.route.snapshot?.params.mpGroupId;
        }
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.isTpiMember = !(
                this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId)
            );
        }
        this.checkAflacAlways();
        this.currentPlanIndex = 0;
        this.loadPlanObject();
        this.getEnrollmentStateAndMethod();
        this.ebsPaymentIndex = this.showEBSBilling ? 1 : 0;
        this.appFlowService.lastCompletedSectionIndex$.pipe(takeUntil(this.unsubscribe$)).subscribe((lastCompletedSection) => {
            this.lastCompletedSectionIndex = lastCompletedSection.index;
            this.unblurFlag = lastCompletedSection.unblur;
        });
        this.appFlowService.planChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data.discard) {
                this.displayPDAStep();
                this.progressIndicator.linear = false;
                this.progressIndicator.selectedIndex = this.progressIndicator.selectedIndex + 1;
                this.progressIndicator.selectedIndex = this.progressIndicator.selectedIndex - 1;
                this.progressIndicator.linear = true;
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (!data.nextClicked) {
                    this.progressIndicator.selectedIndex = this.progressIndicator.selectedIndex - 1;
                } else {
                    if (data.nextClicked && this.applicationData.length > this.progressIndicator.selectedIndex) {
                        this.completedCartIds.push(this.applicationData[this.progressIndicator.selectedIndex].cartData.id);
                    }
                    if (data.nextClicked && this.progressIndicator.selectedIndex >= this.applicationData.length - 1) {
                        this.progressIndicator.linear = false;
                        if (this.progressIndicator.selectedIndex !== this.applicationData.length + this.sideNavStaticStep.STEP_FOUR) {
                            this.progressIndicator.selectedIndex = this.progressIndicator.selectedIndex + 1;
                        }

                        this.progressIndicator.linear = true;
                    } else {
                        this.progressIndicator.linear = false;
                        this.progressIndicator.selectedIndex = this.currentPlanIndex + 1;
                        this.progressIndicator.linear = true;
                    }
                }
            }
        });
        this.appFlowService.planValuesChanged$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (this.completedCartIds.indexOf(data.planObject.application.cartData.id) >= 0) {
                this.lastCompletedStaticStep = 0;
                this.completedCartIds = this.applicationData
                    .filter((application) => application.cartData.id < data.planObject.application.cartData.id)
                    .map((application) => application.cartData.id);
            }
        });
        this.appFlowService.scrolledIndex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.activeSectionIndex = data.sectionIndex;
        });
        this.appFlowService.lastCompletedPaymentIndex.pipe(takeUntil(this.unsubscribe$)).subscribe((num) => {
            this.lastCompletedPaymentStep = num;
            if (this.paymentIndicator) {
                this.paymentIndicator.linear = false;
                this.paymentIndicator.selectedIndex = num - 1;
                this.paymentIndicator.linear = true;
            }
        });
        this.appFlowService.lastCompletedBillingIndex.pipe(takeUntil(this.unsubscribe$)).subscribe((num) => {
            this.lastCompletedBillingStep = num;
            if (this.billingIndicator) {
                this.billingIndicator.linear = false;
                this.billingIndicator.selectedIndex = num - 1;
                this.billingIndicator.linear = true;
            }
        });

        this.appFlowService.getVf2fSubSteps$.pipe(takeUntil(this.unsubscribe$)).subscribe((completedStep: number) => {
            this.completedVf2fSteps = completedStep;
            if (this.finishApplicationSteps) {
                this.finishApplicationSteps.linear = false;
                this.finishApplicationSteps.selectedIndex = this.completedVf2fSteps;
                this.finishApplicationSteps.linear = true;
            }
        });
        this.appFlowService.lastCompleteStaticStep.pipe(takeUntil(this.unsubscribe$)).subscribe((index) => {
            if (index > this.carrierIds.length - 1) {
                this.lastCompletedStaticStep = index + (this.carrierIds.length - 1);
            } else {
                this.lastCompletedStaticStep = index;
            }
        });
    }
    /**
     * Method to display PDA step in app flow
     */
    displayPDAStep(): void {
        this.onlyVASandPCPlans = this.applicationData?.every(
            (data) =>
                data.cartData.planOffering.plan.carrierId !== CarrierId.AFLAC ||
                data.cartData.planOffering.plan.characteristics.some((characteristic) =>
                    [Characteristics.COMPANY_PROVIDED, Characteristics.AUTOENROLLABLE].includes(characteristic),
                ),
        );
    }
    /**
     * This method updates static steps
     * @returns ["One_Signature","PDA", "CONFIRMATION"] -> if showPda === true
     * @returns ["One_Signature", "CONFIRMATION"] -> if showPda === false
     * @returns ["Preliminary_Statement", "One_Signature", "CONFIRMATION"] -> if enrollmentMethod is F2F, enrollmentState is New York
     */
    getStaticSteps(): string[] {
        const steps = ENROLLMENT_SIDE_NAV.slice();
        if (this.showPda && !this.onlyVASandPCPlans) {
            steps.splice(1, 0, this.staticStep.PDA);
        }
        this.appFlowService.showPreliminaryStatementStep$.pipe(takeUntil(this.unsubscribe$)).subscribe((showPreliminaryStatement) => {
            if (showPreliminaryStatement) {
                this.showPreliminaryStatement = showPreliminaryStatement;
                steps.splice(0, 0, this.staticStep.PRELIMINARY_STATEMENT);
            }
        });
        return steps;
    }
    /**
     * Get the details of carrier based on carrier ID
     */
    getCarrierDetails(): void {
        let carrierId;
        const carrierObs = defer(() => this.coreService.getCarrier(carrierId));
        this.carrierIds?.forEach((id) => {
            carrierId = id;
            carrierObs.pipe(takeUntil(this.unsubscribe$)).subscribe((carrierDetails) => {
                this.carrierDetails[id] = carrierDetails;
            });
        });
    }

    /**
     * This methods adds billing steps on basis of carriers
     */
    addBillingSteps(): void {
        const sideSteps = [];
        const sideNavStaticSteps = this.getStaticSteps();
        if (!this.showAflacAlways && this.showBilling) {
            if (this.showEBSBilling) {
                sideSteps.push(this.staticStep.EBS_PAYMENT);
            }
            this.carrierIds.forEach((carrierId) => {
                sideSteps.push(this.staticStep.PAYMENT);
            });
            this.carrierLength = this.carrierIds.length;
            this.sideNavSteps = sideSteps.concat(sideNavStaticSteps.slice());
        } else if (this.showAflacAlways && this.showBilling) {
            const indexOfAflacCarrierId = this.carrierIds.indexOf(1);
            if (indexOfAflacCarrierId >= 0) {
                this.carrierIds.splice(indexOfAflacCarrierId, 1);
            }
            const combinedStep = sideNavStaticSteps.slice();
            combinedStep.unshift(this.staticStep.AFLAC_ALWAYS);
            // TODO This code needs to removed once config changes are made
            if (this.showEBSBilling) {
                sideSteps.push(this.staticStep.EBS_PAYMENT);
            }
            this.carrierIds.forEach((carrierId) => {
                sideSteps.push(this.staticStep.PAYMENT);
            });
            this.carrierLength = this.carrierIds.length;
            this.sideNavSteps = sideSteps.concat(combinedStep.slice());
        } else if (this.showAflacAlways && !this.showBilling) {
            const combinedStep = sideNavStaticSteps.slice();
            combinedStep.unshift(this.staticStep.AFLAC_ALWAYS);
            this.carrierLength = 0;
            // TODO This code needs to removed once config changes are made
            if (this.showEBSBilling) {
                sideSteps.push(this.staticStep.EBS_PAYMENT);
            }

            this.sideNavSteps = sideSteps.concat(combinedStep.slice());
        } else if (!this.showAflacAlways && !this.showBilling && this.showEBSBilling) {
            const combinedStep = sideNavStaticSteps.slice();
            combinedStep.unshift(this.staticStep.EBS_PAYMENT);
            this.carrierLength = 0;
            this.sideNavSteps = combinedStep;
        } else {
            this.sideNavSteps = sideNavStaticSteps.slice();
        }
        if (!this.resumeCheckCompleted) {
            this.resumeCheckCompleted = true;
            this.checkCompletedSteps();
        }
    }
    /**
     * This method will fetch enrolled state from store and returns stepNo for PDA.
     * specific condition for state 'Puerto Rico' because PDA is mandatory for Puerto Rico.
     * @returns step number for PDA side nav step [if state==='PR' ? 3 : 2]
     */
    getPdaStepNo(): number {
        const pdaConfig = { ...SIDE_NAV_CONFIG }.PDA;
        const isPdaMandatory = this.store.selectSnapshot<boolean>((state) => {
            const enrollmentState: string =
                state.EnrollmentMethodState &&
                state.EnrollmentMethodState.currentEnrollment &&
                state.EnrollmentMethodState.currentEnrollment.enrollmentStateAbbreviation
                    ? state.EnrollmentMethodState.currentEnrollment.enrollmentStateAbbreviation
                    : "";
            return pdaConfig.mandatoryStateForPDA.includes(enrollmentState);
        });
        return isPdaMandatory ? pdaConfig.mandatoryPDAStepNo : pdaConfig.pdaStepNo;
    }

    /**
     * Function to return partner account type
     */
    getPartnerAccountType(): void {
        let account: string;
        this.getAccount()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res: Accounts) => {
                account = res.partnerAccountType;
                this.getTPIData(account);
                this.addBillingSteps();
            });
    }

    /**
     * Function to get the data for TPI, we have multiple business scenarios, so we need to check all the conditions.
     * @param accountData Account type
     */
    getTPIData(accountData: string): void {
        if (!this.isTpiMember) {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
            this.showPda = this.appFlowService.iteratePdaAccount(accountData, this.enrollmentMethod, this.enrollmentState);
        } else {
            this.checkMemberId(accountData);
        }
    }
    /**
     * function is used to get partnerAccountType
     * @returns {Observable<Accounts>} to fetch the partnerAccountType
     */
    getAccount(): Observable<Accounts> {
        return this.accountService.getAccount(this.mpGroupId?.toString());
    }

    /**
     * To get the enrollment state and method, we have multiple business scenarios, so we need to check all the conditions.
     * @return void
     */
    getEnrollmentStateAndMethod(): void {
        if (this.isTpi) {
            this.getPartnerAccountType();
        } else {
            let account: string = null;
            this.getAccount()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    tap((res: Accounts) => {
                        account = res.partnerAccountType;
                        if (
                            PdaAccount.PAYROLL === account &&
                            (this.enrollmentMethod === AppSettings.FACE_TO_FACE ||
                                this.enrollmentMethod === AppSettings.HEADSET ||
                                this.enrollmentMethod === AppSettings.CALL_CENTER) &&
                            this.enrollmentState === AppSettings.PUERTO_RICO
                        ) {
                            this.showPda = true;
                        }
                        this.addBillingSteps();
                    }),
                    switchMap((res) => this.userService.credential$),
                )
                .subscribe((credential: ProducerCredential & MemberCredential) => {
                    if (credential.producerId) {
                        this.checkProducerId(account);
                    }
                    if (credential.memberId) {
                        this.checkMemberId(account);
                    }
                });
        }
        this.displayPDAStep();
    }
    /**
     * To get the enrollment state and method based on memberId credential
     * @param account Account type
     * @return void
     */
    checkMemberId(account: string): void {
        const memberContact = this.store.selectSnapshot(EnrollmentState.GetMemberContact);
        if (memberContact) {
            if (PdaAccount.PAYROLL === account && memberContact.address.state === RESIDENT_STATE.PUERTO_RICO) {
                this.showPda = true;
            }
            this.addBillingSteps();
        }
    }
    /**
     * To get the enrollment state and method based on producerId credential
     * @param account Account type
     * @returns void
     */
    checkProducerId(account: string): void {
        const enrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (enrollment) {
            this.enrollmentMethod = !(enrollment.enrollmentMethod === null || enrollment.enrollmentMethod === undefined)
                ? enrollment.enrollmentMethod
                : "";
            this.enrollmentState = !(
                enrollment.enrollmentStateAbbreviation === null || enrollment.enrollmentStateAbbreviation === undefined
            )
                ? enrollment.enrollmentStateAbbreviation
                : "";
            this.showPda = this.appFlowService.iteratePdaAccount(account, this.enrollmentMethod, this.enrollmentState);
            this.addBillingSteps();
        }
    }
    /**
     * adds previous/ knockout responses to store based on question hash key
     */
    updateHashKeys(): void {
        const responses: ResponseItem[] = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        const hashKeys: HashKeys[] = [];
        this.applicationData.forEach((application) => {
            let appResponses: ResponseItem;
            if (responses.length) {
                appResponses = responses.filter((response) => response.planId === application.planId).pop();
            }
            application.appData.sections.forEach((section) => {
                section.steps.forEach((stepArray) => {
                    if (appResponses && stepArray.step[0].type === StepType.QUESTION) {
                        const stepResponses = appResponses.response.filter((stepResponse) => stepResponse.stepId === stepArray.step[0].id);
                        if (stepResponses.length) {
                            stepResponses.forEach((response) => {
                                hashKeys.push({
                                    key: response.key,
                                    value: response.value as string[],
                                    planFlowId: application.appData.id,
                                    cartItemId: this.applicationData[this.progressIndicator.selectedIndex].cartData.id,
                                });
                            });
                        }
                    }
                });
            });
        });
        this.store.dispatch(new UpdateHashKeys(hashKeys));
    }

    /**
     * load finish application step.
     * @returns void
     */
    loadFinishApplication(): void {
        if (this.sideNavSteps.indexOf(this.staticStep.ONE_SIGNATURE) >= 0) {
            this.progressIndicator.linear = false;
            this.progressIndicator.selectedIndex = this.applicationData.length + this.sideNavSteps.indexOf(this.staticStep.ONE_SIGNATURE);
            this.progressIndicator.linear = true;
            this.lastCompletedStaticStep = this.sideNavSteps.indexOf(this.staticStep.ONE_SIGNATURE);
        }
    }

    /**
     * load aflac always step
     * @returns void
     */
    loadAflacAlways(): void {
        let paymentNotCompleted = false;
        const indexOfAflacAlways = this.sideNavSteps.indexOf(this.staticStep.AFLAC_ALWAYS);
        if (this.showAflacAlways && indexOfAflacAlways >= 0) {
            const aflacSteps = this.store.selectSnapshot(EnrollmentState.GetAflacAlways);
            paymentNotCompleted = aflacSteps?.some((record) => !record.steps.some((step) => step.completed));
            if (paymentNotCompleted) {
                this.progressIndicator.linear = false;
                this.progressIndicator.selectedIndex = this.applicationData.length + indexOfAflacAlways;
                this.progressIndicator.linear = true;
                this.lastCompletedStaticStep = this.sideNavSteps.indexOf(this.staticStep.AFLAC_ALWAYS);
            }
        }
        if (!paymentNotCompleted) {
            this.loadFinishApplication();
        }
    }

    /**
     * load billing step.
     * @returns void
     */
    loadPaymentStep(): void {
        let directPaymentCompleted = true;
        if (this.sideNavSteps.indexOf(this.staticStep.PAYMENT) >= 0) {
            const paymentRecords = this.store.selectSnapshot(EnrollmentState.GetDirectPayment);
            const unfinishedPayment = paymentRecords.filter((record) => !record.steps.some((step) => step.completed));
            if (unfinishedPayment[0] && unfinishedPayment[0].carrierId) {
                directPaymentCompleted = false;
                const indexOfCarrierId = this.carrierIds.indexOf(unfinishedPayment[0].carrierId);
                this.progressIndicator.linear = false;
                this.progressIndicator.selectedIndex = this.applicationData.length + indexOfCarrierId;
                this.progressIndicator.linear = true;
                this.lastCompletedStaticStep = indexOfCarrierId;
            }
        }
        if (directPaymentCompleted) {
            this.loadAflacAlways();
        }
    }

    /**
     * load EBS billing step.
     * @returns void
     */
    loadEBSPaymentStep(): void {
        const ebsPaymentStep = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
        if (!ebsPaymentStep) {
            this.loadPaymentStep();
        }
    }

    /**
     * updates variables on resume of application flow based on previous data
     */
    checkCompletedSteps(): void {
        let allPlansCompleted = false;
        let stepCompleted = true;
        this.updateHashKeys();
        for (const application of this.applicationData) {
            for (const section of application.appData.sections) {
                for (const stepArray of section.steps) {
                    if (!stepArray.completed) {
                        stepCompleted = false;
                        this.loadPlanObject();
                        break;
                    }
                }
                if (!stepCompleted) {
                    break;
                }
            }
            if (stepCompleted) {
                this.completedCartIds.push(this.applicationData[this.progressIndicator.selectedIndex].cartData.id);
                // to send call completedCardData  less than equal to  added
                if (this.currentPlanIndex <= this.applicationData.length - 1) {
                    this.currentPlanIndex++;
                    this.changeSelectedIndex(1);
                } else {
                    allPlansCompleted = true;
                }
            } else {
                break;
            }
        }
        if (!this.currentPlanIndex) {
            this.appFlowService.showStaticStep.next(this.staticStep.NORMAL_STEP);
        }
        if (allPlansCompleted) {
            this.loadEBSPaymentStep();
        }
    }

    /**
     * sending completedCart Data in changeSelectedIndex function
     * @param number - to increase count of selectedIndex based on step completed
     * sending completedCart Data
     * @param completedCartData of type number Array which holds completed cart Ids
     */
    changeSelectedIndex(value: number): void {
        this.progressIndicator.linear = false;
        this.progressIndicator.selectedIndex += value;
        this.progressIndicator.linear = true;
        const completedCartData = this.applicationData.map((cart) => cart.productId);
        this.memberService.sendApplicationCartData(completedCartData);
    }

    loadPlanObject(): void {
        if (this.applicationData?.length) {
            this.currentPlan = this.applicationData[this.currentPlanIndex].planId;
            if (
                this.applicationData[this.currentPlanIndex].appData.sections.length &&
                this.applicationData[this.currentPlanIndex].appData.sections[0].steps.length &&
                this.applicationData[this.currentPlanIndex].appData.sections[0].steps[0].step.length
            ) {
                this.currentSection = this.applicationData[this.currentPlanIndex].appData.sections[0].title;
            }
            const planObject: StepData = {
                application: this.applicationData[this.currentPlanIndex],
                currentSection: null,
                currentStep: null,
                steps: null,
                blurFlag: true,
                nextProduct: this.applicationData[this.currentPlanIndex + 1]
                    ? this.applicationData[this.currentPlanIndex + 1].productName
                    : null,
                previousProduct: this.applicationData[this.currentPlanIndex - 1]
                    ? this.applicationData[this.currentPlanIndex - 1].productName
                    : null,
                basePlanId: this.applicationData[this.currentPlanIndex].planId,
            };
            this.activeSectionIndex = 0;
            this.planChangeEvent.emit(planObject);
            this.appFlowService.CustomSectionChanged$.next({
                sectionIndex: 0,
            });
        }
    }
    /**
     * this method handles steps for billing flow when if show aflac is false
     * @param selectedIndex - index of selected step.
     */
    stepsFlow(selectedIndex: number): void {
        for (let index = 0; index < this.sideNavSteps.length; index++) {
            if (selectedIndex === this.applicationData.length + index) {
                const stepVal = this.carrierIds[index] ? this.sideNavSteps[index] + "_" + this.carrierIds[index] : this.sideNavSteps[index];
                this.appFlowService.showStaticStep.next(stepVal);
                this.isAflacAlways = this.sideNavSteps[index] === this.staticStep.AFLAC_ALWAYS;
                this.isPayment = this.sideNavSteps[index] === this.staticStep.PAYMENT;
                if (index === this.sideNavSteps.length - 1) {
                    this.isStepperEditable = false;
                }
                break;
            }
        }
    }
    // eslint-disable-next-line complexity
    /** To create plan change object based on plan change
     * @param event - used to store the selected index
     * @returns void
     */
    onPlanChange(event: any): void {
        this.checkAflacAlways();
        this.addBillingSteps();
        if (event.selectedIndex >= this.applicationData.length) {
            this.stepsFlow(event.selectedIndex);
        } else {
            this.appFlowService.showStaticStep.next(this.staticStep.NORMAL_STEP);
            this.currentPlan = this.applicationData[event.selectedIndex].planId;
            if (
                this.applicationData[event.selectedIndex].appData.sections.length &&
                this.applicationData[event.selectedIndex].appData.sections[0].steps.length &&
                this.applicationData[event.selectedIndex].appData.sections[0].steps[0].step.length
            ) {
                this.currentSection = this.applicationData[event.selectedIndex].appData.sections[0].title;
                this.currentPlanIndex = event.selectedIndex;
                const planChangeObject = {
                    application: this.applicationData[event.selectedIndex],
                    currentSection: this.currentSection,
                    currentPlan: this.currentPlan,
                    sectionId: this.applicationData[event.selectedIndex].appData.sections[0].sectionId,
                    stepIndex: 0,
                    steps: this.applicationData[event.selectedIndex].appData.sections[0].steps[0].step,
                    blurFlag: this.completedCartIds.indexOf(this.applicationData[event.selectedIndex].cartData.id) < 0,
                    nextProduct:
                        event.selectedIndex < this.applicationData.length - 1
                            ? this.applicationData[event.selectedIndex + 1].productName
                            : null,
                    previousProduct:
                        event.selectedIndex !== 0 && event.selectedIndex <= this.applicationData.length - 1
                            ? this.applicationData[event.selectedIndex - 1].productName
                            : null,
                    basePlanId: this.applicationData[event.selectedIndex].planId,
                };
                this.planChangeEvent.emit(planChangeObject);
                this.activeSectionIndex = 0;
                this.appFlowService.CustomSectionChanged$.next({
                    sectionIndex: 0,
                });
            }
        }
    }

    onSectionChange(planChangeObject: any): void {
        // FIX ME : Add scripts to handle section change
    }
    onPaymentChange(event: any): void {
        if (event.selectedIndex === 0) {
            this.appFlowService.paymentStepPosition.next(0);
        } else if (event.selectedIndex === 1) {
            this.appFlowService.paymentStepPosition.next(1);
        } else if (event.selectedIndex === 2) {
            this.appFlowService.paymentStepPosition.next(2);
        } else if (event.selectedIndex === 3) {
            this.appFlowService.paymentStepPosition.next(3);
        }
    }

    /**
     * This method updates selected step for VF2F.
     * @param selectedIndex index of selected step
     * @returns void
     */
    onVf2fSubStepChange(selectedIndex: number): void {
        this.completedVf2fSteps = selectedIndex;
        this.appFlowService.onVf2fSubStepChange(selectedIndex);
    }

    /**
     * Method to check Aflac Always, Payment or EBS Payment step
     */
    checkAflacAlways(): void {
        this.showAflacAlways = Boolean(
            this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.filter((data) => data.applicationType !== StepType.REINSTATEMENT)
                .length,
        );
        this.showBilling = Boolean(this.store.selectSnapshot(EnrollmentState.GetDirectPayment));
        this.showEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }

    onBillingChange(event: any): void {
        this.appFlowService.paymentStepPosition.next(event.selectedIndex);
    }

    /**
     * It is a ng life cycle hook, used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
