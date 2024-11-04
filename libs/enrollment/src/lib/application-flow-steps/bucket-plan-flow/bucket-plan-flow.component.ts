import { Store, Select } from "@ngxs/store";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { MatRadioChange } from "@angular/material/radio";

import {
    EnrollmentState,
    UpdateApplicationResponse,
    UpdateCartData,
    DualPlanYearState,
    SharedState,
    AppFlowService,
    StaticUtilService,
} from "@empowered/ngxs-store";

import { ShoppingCartDisplayService, BenefitsOfferingService, MemberService, ShoppingService, CoreService } from "@empowered/api";
import { LanguageService } from "@empowered/language";

import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import {
    ConfigName,
    BucketCoverageType,
    DualPlanYearSettings,
    AddCartItem,
    CoverageLevel,
    ApplicationResponse,
    MemberDependent,
    MemberQualifyingEvent,
    StepType,
    ContraintsType,
} from "@empowered/constants";

const DECLINED_COVERAGE_LEVEL_ID = 2;
const DECIMALS_TO_RESTRICT = 4;
const CONTRIBUTION_DECIMALS_TO_RESTRICT = 2;

@Component({
    selector: "empowered-bucket-plan-flow",
    templateUrl: "./bucket-plan-flow.component.html",
    styleUrls: ["./bucket-plan-flow.component.scss"],
})
export class BucketPlanFlowComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    form: FormGroup;
    radioValue: string;
    radioError = false;
    showContributionStep = false;
    planId: number;
    employerMinContribution: number;
    employerMaxContribution: number;
    stepId: number;
    memberId: number;
    mpGroup: number;
    cartId: number;
    showSpinner = false;
    hasApiError = false;
    errorMessage: string;
    minLimit = 0;
    maxLimit = 0;
    contributionAmount = "";
    monthlyContribution: string;
    productId: number;
    appResponses: any;
    loadForm: boolean;
    planCoverageLevel: CoverageLevel;
    isHSA: boolean;
    employerContributionAmount: number;
    totalAnnualContribution: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.yes",
        "primary.portal.common.next",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.yes",
        "primary.portal.common.no",
        "primary.portal.applicationFlow.bucketPlanFlow.annualContribution",
        "primary.portal.applicationFlow.bucketPlanFlow.enrollHsaPlan",
        "primary.portal.applicationFlow.bucketPlanFlow.amountRequired",
        "primary.portal.applicationFlow.bucketPlanFlow.next",
        "primary.portal.applicationFlow.bucketPlanFlow.nextAflacAlways",
        "primary.portal.applicationFlow.bucketPlanFlow.nextBilling",
        "primary.portal.applicationFlow.bucketPlanFlow.nextFinishApplications",
        "primary.portal.applicationFlow.bucketPlanFlow.betweenLimit",
        "primary.portal.applicationFlow.bucketPlanFlow.mustBeBetweenLimit",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.shoppingCart.employerContribution",
        "primary.portal.applicationFlow.bucketPlanFlow.employerContribution",
        "primary.portal.applicationFlow.bucketPlanFlow.totalAnnualContribution",
        "primary.portal.applicationFlow.bucketPlanFlow.fsaPlanPara",
        "primary.portal.applicationFlow.bucketPlanFlow.employerAnnualContribution",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.bucketPlanFlow.errorinContributionLimits",
        "secondary.portal.applicationFlow.bucketPlanFlow.errorinDependentDetails",
        "secondary.portal.common.errorResponse",
        "secondary.portal.common.errorSavingResponse",
        "secondary.portal.common.errorUpdatingCart",
    ]);
    validationRegex: any;
    yesValue = "Yes";
    dependents: MemberDependent[];
    familyCoveragelevel: boolean;
    contributionLimits: any;
    initialContributionAmount: string;
    isInit = false;
    haveCoverageLevelQuestion = false;
    @Select(SharedState.regex) regex$: Observable<any>;
    payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
    hasAflacAlways = false;
    fromDirect = false;
    hasEBSBilling = false;
    tpiAssistingAdminId: number;
    private readonly unsubscribe$ = new Subject<void>();
    currentQleId: number;
    isHCFSAEmployerContributionPLan = false;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    additionalContributionQuestionId: number;
    additionalContributionAmount = "0";

    constructor(
        private readonly appFlowService: AppFlowService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * @description Lifecycle method on initializing the component
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.planId = this.planObject.application.appData.planId;
        const plans = this.appFlowService.getEmployerContributionPlans();
        if (plans && plans.length) {
            plans.forEach((id) => {
                if (this.planId === Number(id)) {
                    this.isHCFSAEmployerContributionPLan = true;
                    this.staticUtilService
                        .cacheConfigValue(ConfigName.HCFSA_SINGLE_MIN_CONTRIBUTION)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((minContribution) => {
                            this.employerMinContribution = +minContribution;
                        });
                    this.staticUtilService
                        .cacheConfigValue(ConfigName.HCFSA_SINGLE_MAX_CONTRIBUTION)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((maxContribution) => {
                            this.employerMaxContribution = +maxContribution;
                        });
                }
            });
        }
        this.additionalContributionQuestionIdSet();
        this.cartId = this.planObject.application.cartData.id;
        this.stepId = this.planObject.steps[0].id;
        this.productId = this.planObject.application.productId;
        this.showSpinner = true;
        // FIXME - Make changes to get differnce between HAS and FSA after confirmation.
        this.isHSA = this.planObject.application.productName.indexOf("HSA") >= 0;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
        if (!this.planObject.application.cartData.coverageLevelId) {
            this.coreService
                .getCoverageLevels(this.planId.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp) => {
                    this.planCoverageLevel = resp.find((cvl) => cvl.id !== DECLINED_COVERAGE_LEVEL_ID);
                });
        } else {
            this.planCoverageLevel = { id: this.planObject.application.cartData.coverageLevelId };
        }
        this.checkAflacAlways();
        this.formLoad();
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
        if (!this.isHSA) {
            this.showContributionStep = true;
            this.radioValue = this.yesValue;
        }
        const bucketResponse = this.store
            .selectSnapshot(EnrollmentState.GetConstraint)
            .filter((constraints) => constraints.flowId === this.planObject.application.appData.id)
            .pop();
        if (
            bucketResponse &&
            bucketResponse.constraint &&
            bucketResponse.constraint[ContraintsType.BUCKET_COVERAGE_LEVEL] === BucketCoverageType.FAMILY
        ) {
            this.familyCoveragelevel = true;
        } else {
            this.familyCoveragelevel = false;
        }

        this.appFlowService.updateBucketCoverageLevel$.pipe(takeUntil(this.unsubscribe$)).subscribe((coverageType) => {
            this.haveCoverageLevelQuestion = true;
            if (BucketCoverageType.FAMILY === coverageType) {
                this.familyCoveragelevel = true;
            } else {
                this.familyCoveragelevel = false;
            }
            this.getMinMaxLimits();
            this.form.controls.annualContribution.updateValueAndValidity();
        });
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
    }
    /**
     * @description sets the additional contribution question Id
     */
    additionalContributionQuestionIdSet(): void {
        const sectionObj = this.planObject.application.appData.sections.find((section) => section.title === "Additional Contribution");
        if (sectionObj) {
            this.additionalContributionQuestionId = sectionObj.steps[0].step[0].id;
            this.appFlowService.getAdditionalContributionAmount$
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((amount) => (this.additionalContributionAmount = amount));
        }
    }
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    /**
     * This method will execute on click of next.
     * @returns void
     */
    onSubmit(): void {
        if (this.form.valid) {
            this.getAmount();
            this.saveChoice();
        }
    }

    formLoad(): void {
        this.memberService
            .getMemberDependents(this.memberId, true, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.dependents = response;
                    this.benefitOfferingService.getProductContributionLimits(this.productId, this.mpGroup).subscribe(
                        (resp) => {
                            this.showSpinner = false;
                            this.contributionLimits = resp;
                            this.getMinMaxLimits();
                            this.initializeForm();
                            this.loadForm = true;
                        },
                        (error) => {
                            this.hasApiError = true;
                            this.errorMessage =
                                this.languageSecondStringsArray[
                                    "secondary.portal.applicationFlow.bucketPlanFlow.errorinContributionLimits"
                                ];
                            this.showSpinner = false;
                        },
                    );
                },
                (error) => {
                    this.hasApiError = true;
                    this.errorMessage =
                        this.languageSecondStringsArray["secondary.portal.applicationFlow.bucketPlanFlow.errorinDependentDetails"];
                    this.showSpinner = false;
                },
            );
    }
    /**
     * @description sets the min and max contribution amounts
     */
    getMinMaxLimits(): void {
        if (
            this.contributionLimits &&
            ((this.dependents && this.dependents.length && !this.haveCoverageLevelQuestion) || this.familyCoveragelevel) &&
            this.isHSA
        ) {
            this.minLimit = this.contributionLimits.minFamilyContribution;
            this.maxLimit = this.contributionLimits.maxFamilyContribution;
        } else {
            this.minLimit = this.contributionLimits.minContribution;
            this.maxLimit = this.contributionLimits.maxContribution;
        }
    }

    getRadioValue(event: MatRadioChange): void {
        this.radioValue = event.value;
        this.radioError = false;
        this.showContribution();
    }
    /**
     * this function gets the total annual contribution amount.
     */
    getAnnualContribution(): void {
        this.setTotalAnnualContribution(+this.form.controls.annualContribution.value);
    }
    /**
     * @description initializes form.
     */
    initializeForm(): void {
        this.appResponses = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter((resp) => resp.application.planId === this.planId)
            .pop();
        let previousResponse;

        if (this.appResponses !== undefined) {
            this.isInit = true;
            previousResponse = this.appResponses.response.filter((response) => response.type === StepType.BUCKET).pop();
            if (previousResponse && previousResponse.value && previousResponse.value.length) {
                this.radioValue = previousResponse.value[0].question;
                this.showContribution();
            }
            if (this.additionalContributionQuestionId) {
                const additionalContributionResponse = this.appResponses.response.find(
                    (resp) => resp.stepId === this.additionalContributionQuestionId && resp.value && resp.value.length,
                );
                if (additionalContributionResponse) {
                    this.additionalContributionAmount = (
                        parseFloat(additionalContributionResponse.value[0]) / this.payFrequency.payrollsPerYear
                    )
                        .toFixed(DECIMALS_TO_RESTRICT)
                        .toString();
                }
            }
        }
        if (this.planObject.currentSection.steps[0].step[0].amountContributed > +this.additionalContributionAmount) {
            this.contributionAmount = (
                parseFloat(
                    (this.planObject.currentSection.steps[0].step[0].amountContributed - +this.additionalContributionAmount).toString(),
                ) * this.payFrequency.payrollsPerYear
            )
                .toFixed(CONTRIBUTION_DECIMALS_TO_RESTRICT)
                .toString();
        } else {
            this.contributionAmount = (
                parseFloat(
                    (+this.additionalContributionAmount - this.planObject.currentSection.steps[0].step[0].amountContributed).toString(),
                ) * this.payFrequency.payrollsPerYear
            )
                .toFixed(CONTRIBUTION_DECIMALS_TO_RESTRICT)
                .toString();
        }

        if (this.planObject.currentSection.steps[0].step[0].employerContribution) {
            this.employerContributionAmount = this.planObject.currentSection.steps[0].step[0].employerContribution;
            if (this.isHCFSAEmployerContributionPLan) {
                this.setTotalAnnualContribution(+this.contributionAmount);
            }
        }
        this.form = this.fb.group({
            question: [this.radioValue],
            annualContribution: [
                this.contributionAmount ? this.contributionAmount : null,
                [Validators.required, this.checkMinMaxLimit.bind(this)],
            ],
        });

        this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            this.blurBelowStepsOnChange();
        });

        if (this.contributionAmount) {
            this.getAmount();
        }
    }
    /**
     * this function set the total annual contribution amount.
     * @param contributionAmount employee contribution amount to set the annual contribution
     */
    setTotalAnnualContribution(contributionAmount: number): void {
        if (
            this.employerContributionAmount <= this.employerMinContribution ||
            this.employerContributionAmount === contributionAmount ||
            this.employerContributionAmount < contributionAmount
        ) {
            this.totalAnnualContribution = this.employerContributionAmount + contributionAmount;
        } else if (
            this.employerContributionAmount > this.employerMinContribution &&
            contributionAmount < this.employerContributionAmount &&
            contributionAmount <= this.employerMinContribution
        ) {
            this.totalAnnualContribution = contributionAmount + this.employerMinContribution;
        } else if (
            this.employerContributionAmount > this.employerMinContribution &&
            contributionAmount >= this.employerMinContribution &&
            contributionAmount < this.employerContributionAmount
        ) {
            this.totalAnnualContribution = contributionAmount + contributionAmount;
        }
    }
    /**
     * @description blurs the below steps in side-nav when step is changed
     */
    blurBelowStepsOnChange(): void {
        if (
            this.form.dirty &&
            !this.planObject.rider &&
            (this.planObject.currentSection.sectionId !== this.currentSectionIndex || this.planObject.currentStep !== this.currentStepIndex)
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
    }

    checkMinMaxLimit(control: FormControl): any {
        if (control.value) {
            let validationResult = null;
            if (isNaN(control.value)) {
                validationResult = { required: true };
            }
            if (!(this.minLimit <= control.value && control.value <= this.maxLimit)) {
                validationResult = { limitError: true };
            }
            return validationResult;
        }
    }
    /**
     * @description sets monthly contribution amount.
     */
    getMonthlyContribution(): void {
        this.monthlyContribution = (parseFloat(this.form.controls.annualContribution.value) / this.payFrequency.payrollsPerYear)
            .toFixed(DECIMALS_TO_RESTRICT)
            .toString();
    }

    numberValidation(event: any): void {
        if (event.type === "keypress" && ((event.keyCode <= 57 && event.keyCode >= 48) || event.keyCode === 46)) {
            if (event.keyCode === 46 && this.form.controls.annualContribution.value.indexOf(".") >= 0) {
                event.preventDefault();
            }
        } else {
            event.preventDefault();
        }
        if (event.type === "paste") {
            const CURRENCY_REGEXP = new RegExp(this.validationRegex.ANNUAL_SALARY);
            if (!CURRENCY_REGEXP.test(event.clipboardData.getData("Text"))) {
                event.preventDefault();
            }
        }
    }
    /**
     * @description sets the contribution amount
     */
    getAmount(): void {
        if (!isNaN(parseFloat(this.form.controls.annualContribution.value))) {
            if (this.form.controls.annualContribution.value) {
                this.contributionAmount = parseFloat(this.form.controls.annualContribution.value).toFixed(2).toString();
                this.monthlyContribution = (parseFloat(this.form.controls.annualContribution.value) / this.payFrequency.payrollsPerYear)
                    .toFixed(DECIMALS_TO_RESTRICT)
                    .toString();
                if (!this.form.controls.annualContribution.errors && !this.planObject.reinstate) {
                    if (+this.additionalContributionAmount) {
                        this.appFlowService.updateCost$.next(
                            parseFloat((+this.monthlyContribution + +this.additionalContributionAmount).toString())
                                .toFixed(DECIMALS_TO_RESTRICT)
                                .toString(),
                        );
                    } else {
                        this.appFlowService.updateCost$.next(this.monthlyContribution);
                    }
                }
            } else {
                if (!this.planObject.reinstate) {
                    this.appFlowService.updateCost$.next(0);
                }
                this.contributionAmount = null;
                this.monthlyContribution = null;
            }
        }

        if (this.isInit) {
            this.initialContributionAmount = this.contributionAmount;
        }
        this.isInit = false;
    }

    showContribution(): void {
        if (this.radioValue) {
            this.radioError = false;
            if (this.radioValue === this.yesValue) {
                this.showContributionStep = true;
            } else {
                this.showContributionStep = false;
                this.contributionAmount = "";
                this.monthlyContribution = "";
                if (!this.planObject.reinstate) {
                    this.appFlowService.updateCost$.next(0);
                }
                if (this.loadForm) {
                    this.form.controls.annualContribution.setValue("");
                }
            }
        } else {
            this.radioError = true;
        }
    }
    /**
     * @description Method to save the employer contribution.
     */
    saveChoice(): void {
        if (this.radioValue) {
            this.showSpinner = true;
            const payload = [];
            if (this.radioValue === this.yesValue) {
                payload.push({
                    question: this.radioValue,
                    amount: this.form.controls.annualContribution.value,
                    employerContribution: this.employerContributionAmount ? this.employerContributionAmount : null,
                });
            } else {
                payload.push({ question: this.radioValue });
            }
            const schema: ApplicationResponse = {
                stepId: this.stepId,
                type: StepType.BUCKET,
                value: payload,
            };
            this.saveApplicationResp(schema);
        } else {
            this.radioError = true;
        }
    }
    /**
     * @description saves the application response before moving to next step
     * @param payload {ApplicationResponse} the application response from the form
     */
    saveApplicationResp(payload: ApplicationResponse): void {
        this.shoppingCartService
            .saveApplicationResponse(this.memberId, this.cartId, this.mpGroup, [payload])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.store.dispatch(new UpdateApplicationResponse(this.memberId, this.cartId, this.mpGroup)).subscribe(
                        (resp) => {
                            if (this.initialContributionAmount === this.contributionAmount) {
                                this.showSpinner = false;
                                this.nextStep();
                            } else {
                                this.initialContributionAmount = this.contributionAmount;
                                this.updateCostInCart();
                            }
                        },
                        (error) => {
                            this.showSpinner = false;
                            this.hasApiError = true;
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
    /**
     * @description Method to update cost of a plan in cart
     */
    updateCostInCart(): void {
        const cartData: AddCartItem = {
            memberCost: parseFloat(
                this.monthlyContribution ? (+this.monthlyContribution + +this.additionalContributionAmount).toString() : "0",
            ),
            totalCost: parseFloat(
                this.monthlyContribution ? (+this.monthlyContribution + +this.additionalContributionAmount).toString() : "0",
            ),
            dependentAge: this.planObject.application.cartData.dependentAge ? this.planObject.application.cartData.dependentAge : null,
            enrollmentMethod: this.planObject.application.cartData.enrollmentMethod,
            enrollmentState: this.planObject.application.cartData.enrollmentState,
            planOfferingId: this.planObject.application.cartData.planOffering.id,
            subscriberQualifyingEventId:
                this.planObject.application.cartData.planOffering &&
                this.planObject.application.cartData.planOffering.planYearId &&
                this.currentQleId
                    ? this.currentQleId
                    : null,
            coverageLevelId: this.planCoverageLevel.id,
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.planObject.application.cartData.assistingAdminId),
        };
        this.shoppingService
            .updateCartItem(this.memberId, this.mpGroup, this.cartId, cartData)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.showSpinner = false;
                    this.store.dispatch([new UpdateCartData(this.cartId, this.planObject.application.cartData.planOffering.id)]);
                    this.nextStep();
                },
                () => {
                    this.showSpinner = false;
                    this.hasApiError = true;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.common.errorUpdatingCart"];
                },
            );
    }

    nextStep(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * This method will unsubscribe all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
