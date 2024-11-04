import {
    EnrollmentState,
    QuoteShopHelperService,
    UpdateCartData,
    UpdateApplicationResponse,
    DeclineRiderCartItem,
    SetReinstateItem,
    TPIState,
    AccountInfoState,
    DualPlanYearState,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { Component, OnInit, Input, AfterContentChecked, OnDestroy, Output, EventEmitter } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { CoreService, ShoppingCartDisplayService, ShoppingService, MemberService, AccountService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators, AbstractControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { forkJoin, Observable, Subject, combineLatest, of, ObservableInput } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil, map, tap, filter, switchMap, withLatestFrom, catchError, take } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { TpiAddDependentsComponent } from "../tpi-add-dependents/tpi-add-dependents.component";
import { HttpResponse } from "@angular/common/http";
import {
    CarrierId,
    ConfigName,
    Permission,
    BasePlanApplicationPanel,
    CustomSection,
    Reinstate,
    StepData,
    Cost,
    TpiSSOModel,
    KnockoutType,
    Question,
    Validity,
    AppSettings,
    CoverageLevelNames,
    DualPlanYearSettings,
    EnrollmentMethod,
    Portals,
    Characteristics,
    RatingCode,
    RiderCart,
    AddCartItem,
    Step,
    TaxStatus,
    CoverageLevelRule,
    CoverageLevel,
    GetCartItems,
    EnrollmentRider,
    Enrollments,
    ApplicationResponse,
    PlanOfferingPricing,
    Relations,
    GetPlan,
    MemberDependent,
    MoreSettings,
    MemberQualifyingEvent,
    StepType,
    GetAncillary,
    Relation,
    APPLICATION_STEPTYPE,
    StepTitle,
    CoverageLevelProperty,
    ProducerCredential,
    ClientErrorResponseCode,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import { TPIRestrictionsForHQAccountsService, EmpoweredModalService } from "@empowered/common-services";
import { AuthSelectors } from "@empowered/ngrx-store/ngrx-states/auth";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store";

const ENROLLED = "Enrolled";
const COVERAGE_PRICE = "coveragePrice";
const COVERAGE_LEVEL = "coverageLevel";
const ENROLLED_COVERAGE_LEVEL = 1;
const COMMA = ",";
const TPI = "tpi";
interface BenefitAmountDisplay {
    value: number;
    viewValue: number;
}

interface CoverageLevelOptions {
    value: number;
    viewValue: string;
    disable: boolean;
}

interface CoverageRule {
    coverageLevelRule: CoverageLevelRule;
    coverageLevelId: number;
}

@Component({
    selector: "empowered-plan-options",
    templateUrl: "./plan-options.component.html",
    styleUrls: ["./plan-options.component.scss"],
})
export class PlanOptionsComponent implements OnInit, AfterContentChecked, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    @Input() riderIndex: number;
    @Output() closeForm = new EventEmitter();
    @Output() handleError = new EventEmitter();
    isReinstateAddSpouse: boolean;
    enrolled = ENROLLED;
    planFlowId: number;
    dependentId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId;
    appData: BasePlanApplicationPanel;
    panelData: CustomSection;
    savedAppResponse;
    priceOptions = [];
    currentRiderInDisplay: any;
    coverageLevelOptions: CoverageLevelOptions[] = [];
    dependentsAdditionRequired = false;
    dependentsMessage = "";
    taxOptions = [];
    coverageLevelForm: FormGroup;
    StepResponse: ApplicationResponse[];
    ConflictdependentType = "spouse";
    question: "QUESTION";
    dependents: MemberDependent[];
    fieldErrorflag = false;
    APPLICATION_STEPTYPE = APPLICATION_STEPTYPE;
    taxStatus: string;
    dependentsAddition = [];
    dependentAdditionType: string;
    mpGroup: number;
    memberId: number;
    steps: Step[];
    showBenefitAmount = false;
    coverageLevels: CoverageLevel[] = [];
    dependentRelations: Relations[];
    riderCartData: RiderCart;
    stepType = StepType;
    cartData: GetCartItems;
    showSpinner = false;
    dependentScroll = false;
    dependentsHeading = "";
    sectionToScroll = "";
    coverageRules: CoverageRule[] = [];
    hasAflacAlways = false;
    hasEBSBilling = false;
    fromDirect = false;
    planResponse: any;
    hasError: boolean;
    errorMessage: string;
    private readonly unsubscribe$ = new Subject<void>();
    ancillaryInformation$: Observable<BenefitAmountDisplay[]>;
    spouseData: MemberDependent;
    isJuvenilePlan = false;
    spouseAge: string;
    dependentsHeadingreplaceContent;
    dependentsMessageReplaceContent;
    actionButtonsconst = "actionButtons";
    isMember: boolean;
    spouseKnockoutQuestion: Question[] = [];
    policyFeeRiderIds: string[];
    defaultPostTaxPlan: string[];
    enableEnrolledButton = false;
    benefitAmountOptions: BenefitAmountDisplay[];
    ancillaryInformation: GetAncillary;
    declineCoverageLevelId = 2;
    isSingleCoverageLevel = false;
    isSpouseKnockout = true;
    coverageRulesAPICalls: Observable<CoverageLevelRule>[] = [];
    tobaccoPlanOfferingPrices: PlanOfferingPricing[] = [];
    nonTobaccoPlanOfferingPrices: PlanOfferingPricing[] = [];
    isRider = false;
    spouseInvolvedCoverageLevels: number[] = [];
    retainRiders: number[] = [];
    increaseRiders: number[] = [];
    ineligibleRiders: number[] = [];
    isRetain = false;
    TaxStatus = TaxStatus;
    isGhostRider: boolean;
    disableSecondarySheRider = false;
    taxStatusReadOnly: boolean;
    disableNewRider = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planOption.preTax",
        "primary.portal.applicationFlow.planOption.next",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.applicationFlow.planOption.nextApplications",
        "primary.portal.applicationFlow.planOption.changeCoverageLevel",
        "primary.portal.common.add",
        "primary.portal.applicationFlow.posttaxOption",
        "primary.portal.applicationFlow.pretaxOption",
        "primary.portal.applicationflow.dependents",
        "primary.portal.applicationflow.spouseandchild",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.applicationflow.newRider",
        "primary.portal.applicationflow.retainRider",
        "primary.portal.applicationflow.increaseRider",
        "primary.portal.applicationflow.noRider",
        "primary.portal.applicationflow.direct.mpp.requireddependentsmessage",
        "primary.portal.applicationflow.mmp.requireddependentsmessage",
        "primary.portal.applicationflow.payroll.mpp.requireddependentsmessage",
        "primary.portal.applicationflow.direct.mpp.requireddependentsmessage.multi",
        "primary.portal.applicationflow.mmp.requireddependentsmessage.multi",
        "primary.portal.applicationflow.payroll.mpp.requireddependentsmessage.multi",
        "primary.portal.applicationflow.child",
        "primary.portal.applicationflow.children",
        "primary.portal.applicationFlow.planOption.selectCurrentamount",
        "primary.portal.applicationFlow.planOption.retainCurrentamount",
        "primary.portal.applicationFlow.planOption.retainCurrentAmountDisabled",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(COMMA);
    isTpi = false;
    tpiAssistingAdminId: number;
    retainCurrentAmountForm: FormGroup;
    isRetainCurrentAmount = false;
    secondarySheRiderId: number;
    @Input() tpiSSODetails: TpiSSOModel;
    hideRiderBenefitAmount = false;
    disableRetainCurrentAmount = false;
    currentQleId: number;
    isOpenEnrollment: boolean;
    isQLEPeriod: boolean;
    assistingAdminId$ = this.ngrxStore
        .pipe(select(AuthSelectors.selectUserCredential))
        .pipe(map((resp) => (resp.value ? resp.value.adminId || (resp.value as ProducerCredential).producerId : null)));
    protected displayError: boolean;
    readonly SALARY_REQUIRED = "Salary required";
    private assistingAdminIdVal: number;

    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    @Select(EnrollmentState.GetIsOpenEnrollment) isOpenEnrollment$: Observable<boolean>;
    @Select(EnrollmentState.GetIsQLEPeriod) isQLEPeriod$: Observable<boolean>;
    constructor(
        private readonly store: Store,
        private readonly coreService: CoreService,
        private readonly fb: FormBuilder,
        private readonly shopingCartService: ShoppingCartDisplayService,
        private readonly shoppingService: ShoppingService,
        private readonly appFlowService: AppFlowService,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly route: ActivatedRoute,
        private readonly utilService: UtilService,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly empoweredService: EmpoweredModalService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly dateService: DateService,
        private readonly ngrxStore: NGRXStore,
    ) {
        this.isOpenEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isOpenEnrollment = x));
        this.isQLEPeriod$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isQLEPeriod = x));
    }

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component
     */
    ngOnInit(): void {
        this.planId = this.planObject.application.appData.planId;
        if (this.planObject.rider) {
            this.isRider = true;
        }
        this.staticUtilService
            .cacheConfigValue(ConfigName.SECONDARY_SHE_RIDER)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((sheRiderId) => {
                this.secondarySheRiderId = +sheRiderId;
                if (this.planId === +sheRiderId) {
                    this.disableSecondarySheRider = this.appFlowService.getSheRiderDisableVal();
                }
            });
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        combineLatest([
            this.staticUtilService.cacheConfigValue(ConfigName.ENROLLMENT_MANDATORY_RIDER_ID),
            this.staticUtilService.cacheConfigValue(ConfigName.JUVENILE_PLANS),
            this.staticUtilService.cacheConfigValue("user.enrollment.planflow.hide_plan_options_for_addon_riders"),
            this.staticUtilService.cacheConfigValue(ConfigName.HIDE_RIDERS_BENEFIT_AMOUNT),
            this.staticUtilService.cacheConfigValue(ConfigName.DEFAULT_POST_TAX_PLAN),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([riderIds, planIds, ghostPlanIds, benefitAmountRiderId, defaultPostTaxPlan]) => {
                if (riderIds) {
                    if (
                        this.planObject.rider &&
                        ghostPlanIds?.split(COMMA).some((riderPlanId) => this.planObject.application.appData.planId === +riderPlanId)
                    ) {
                        this.isGhostRider = true;
                    }
                    if (
                        this.planObject.rider &&
                        benefitAmountRiderId &&
                        benefitAmountRiderId.split(COMMA).some((riderId) => this.planObject.application.appData.planId === +riderId)
                    ) {
                        this.hideRiderBenefitAmount = true;
                    }
                    this.policyFeeRiderIds = riderIds.split(COMMA);

                    this.policyFeeRiderIds.forEach((id) => {
                        if (this.planId === Number(id)) {
                            this.enableEnrolledButton = true;
                        }
                    });
                }
                this.isJuvenilePlan = planIds ? planIds.includes(this.planId) : false;
                this.defaultPostTaxPlan = defaultPostTaxPlan?.split(COMMA);
            });
        this.coverageLevelForm = this.fb.group({});
        this.retainCurrentAmountForm = this.fb.group({
            retainCurrentAmount: [],
        });
        this.appData = this.planObject.application;
        this.cartData = this.utilService.copy(this.appData.cartData);
        const cartItems: GetCartItems[] = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetCartItem));
        if (cartItems && cartItems.length && this.planObject.rider) {
            this.cartData = cartItems
                .filter((cartItem) => cartItem.id === this.cartData.id && cartItem.applicationType === this.cartData.applicationType)
                .pop();
        }
        this.subscribeToCartData();
        this.riderCartData = this.getRiderCartDataFromCart();
        this.getSpouseKnockoutQuestions();
        this.initializeData();
        this.checkAflacAlways();
        this.coverageLevelForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            // when the form value is changed we need to pass the data to update the step details
            // passing the data will stop the user to navigate to the next section unless he completes all the steps
            // user can navigate to the step by clicking on next or by scrolling to the step
            if (this.coverageLevelForm.dirty && !this.planObject.rider) {
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
            if (
                this.coverageLevelForm.dirty &&
                this.planObject.rider &&
                (this.planObject.rider.riderIndex !== this.riderIndex ||
                    this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                this.appFlowService.updateRiderActiveStepDetails$.next({
                    currentRiderIndex: this.planObject.rider.riderIndex,
                    currentSectionIndex: this.planObject.rider.riderSectionIndex,
                    currentStepIndex: this.planObject.rider.riderStepIndex,
                });
            }
        });
        this.appFlowService.getKnockoutTrigger.pipe(takeUntil(this.unsubscribe$)).subscribe((knockoutType) => {
            this.removeSpouseInvolvedCoverageLevel(knockoutType);
        });
        this.updateAncillaryDataOnStepChange();
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();

        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            if ("memberId" in credential) {
                this.isMember = true;
            }
        });
        this.getTPIMemberValue();
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
        this.appFlowService.getAncillarySubject
            .pipe(
                tap((coverageLevelId) => {
                    if (!this.planObject.rider && this.coverageLevelForm.controls[COVERAGE_LEVEL]) {
                        this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(coverageLevelId);
                    }
                }),
                filter((coverageId) => this.isRider),
                switchMap((step) => this.getAncillaryInformation()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.checkSpouseKnockout();
        this.assistingAdminId$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.assistingAdminIdVal = response;
        });
    }
    /**
     * Method to get Member value based on condition
     * @returns void
     */
    getTPIMemberValue(): void {
        if (this.router.url.indexOf(TPI) >= 0) {
            this.isTpi = true;
            this.isMember = !(
                Boolean(this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId) ||
                Boolean(this.store.selectSnapshot(TPIState.getTPIProducerId))
            );
        }
    }
    /**
     * Method to get updatedAncillaryData on step change
     */
    updateAncillaryDataOnStepChange(): void {
        this.appFlowService.updateAncillaryOnstepChange
            .pipe(
                filter((sectionIndex) => sectionIndex === this.planObject.currentSection.sectionId),
                switchMap((step) => this.getAncillaryInformation()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to get updated cartData whenever the store value changes
     */
    subscribeToCartData(): void {
        this.store
            .select((store) => store.enrollment.cartItems)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((cartItems) => cartItems && cartItems.length > 0),
                map((cartItems) => cartItems.filter((cartItem) => cartItem.id === this.planObject.application.cartData.id).pop()),
                filter((cartData) => cartData),
                tap((cartData: GetCartItems) => {
                    this.getUpdatedCartData(cartData);
                    if (this.planObject.rider && cartData.coverageLevelId !== this.cartData.coverageLevelId) {
                        this.initializeData();
                    }
                }),
            )
            .subscribe();
    }

    /* Getting Spouse knockout questions by iterating questions option
    inside PlanObject and checking if option knockout type is spouse knockout
    */

    getSpouseKnockoutQuestions(): void {
        if (this.planObject && !this.planObject.rider) {
            this.planObject.application.appData.sections.forEach((section) => {
                section.steps.forEach((stepList) => {
                    stepList.step.forEach((step) => {
                        if (step.type === this.question) {
                            const question: Question = step.question as Question;
                            if (question.options) {
                                question.options.forEach((option) => {
                                    if (option.knockoutType === KnockoutType.SPOUSE_KNOCKOUT) {
                                        this.spouseKnockoutQuestion.push(step.question as Question);
                                    }
                                });
                            }
                        }
                    });
                });
            });
        }
    }

    ngAfterContentChecked(): void {
        if (document.getElementById(this.sectionToScroll)) {
            document.getElementById("dependents").scrollIntoView();
            this.sectionToScroll = "";
        }
    }
    /**
     * updates retain rider options based on ancillary information
     * @param ancillaryInformation ancillary information of plan
     * @param includeRules flag to indicate if rules are to be included or not
     */
    updateRetainRiders(ancillaryInformation: GetAncillary, includeRules?: boolean): void {
        this.coverageLevelOptions = [];
        this.coverageRulesAPICalls = [];
        this.retainRiders = [];
        this.ineligibleRiders = [];
        let onlyRetain = false;
        if (ancillaryInformation && ancillaryInformation.coverageLevels && ancillaryInformation.coverageLevels.length) {
            if (ancillaryInformation.conversion) {
                this.retainRiders = ancillaryInformation.coverageLevels
                    .filter((coverageLevel) => coverageLevel.coverageLevelProperty === CoverageLevelProperty.RETAIN)
                    .map((coverageLevel) => coverageLevel.coverageLevelId);
                this.increaseRiders = ancillaryInformation.coverageLevels
                    .filter((coverageLevel) => coverageLevel.coverageLevelProperty === CoverageLevelProperty.INCREASE)
                    .map((coverageLevel) => coverageLevel.coverageLevelId);
            }
            this.ineligibleRiders = ancillaryInformation.coverageLevels
                .filter((coverageLevel) => coverageLevel.coverageLevelProperty === CoverageLevelProperty.HIDE)
                .map((coverageLevel) => coverageLevel.coverageLevelId);
        }
        // Filter coverage levels to remove or keep only retain riders in case of additional unit plans
        this.coverageLevels = this.getFilteredRiderCoverageLevels();
        this.coverageLevels.forEach((coverageLevel) => {
            if (includeRules) {
                this.coverageRulesAPICalls.push(
                    this.coreService.getCoverageLevelRule(
                        coverageLevel.id.toString(),
                        this.cartData.enrollmentState,
                        this.planId.toString(),
                    ),
                );
            }
            let coverageLevelName: string = coverageLevel.name;
            let addCoverageLevel = false;
            if (this.planObject.rider) {
                if (!this.ineligibleRiders.length || this.ineligibleRiders.indexOf(coverageLevel.id) < 0) {
                    if (this.increaseRiders && this.increaseRiders.length && this.increaseRiders.indexOf(coverageLevel.id) >= 0) {
                        coverageLevelName = this.languageStrings["primary.portal.applicationflow.increaseRider"];
                    } else if (this.retainRiders && this.retainRiders.length && this.retainRiders.indexOf(coverageLevel.id) >= 0) {
                        if (this.appFlowService.getRetainRiderVal() && this.planObject.rider) {
                            onlyRetain = true;
                        }
                        coverageLevelName = this.languageStrings["primary.portal.applicationflow.retainRider"];
                    } else if (coverageLevel.id === this.cartData.coverageLevelId || coverageLevel.id === ENROLLED_COVERAGE_LEVEL) {
                        coverageLevelName = this.languageStrings["primary.portal.applicationflow.newRider"];
                    } else if (coverageLevel.id === this.declineCoverageLevelId) {
                        coverageLevelName = this.languageStrings["primary.portal.applicationflow.noRider"];
                    }
                    addCoverageLevel = true;
                }
            } else {
                addCoverageLevel = true;
            }
            if (addCoverageLevel) {
                this.coverageLevelOptions.push({
                    value: coverageLevel.id,
                    viewValue: coverageLevelName,
                    disable: false,
                });
            }
        });
        if (onlyRetain) {
            this.coverageLevelOptions = this.coverageLevelOptions.filter(
                (coverageLevel) => coverageLevel.value !== this.declineCoverageLevelId,
            );
        }
        if (this.disableNewRider) {
            this.coverageLevelOptions.splice(
                this.coverageLevelOptions.findIndex(
                    (coverageLevelOptions) =>
                        coverageLevelOptions.viewValue === this.languageStrings["primary.portal.applicationflow.newRider"],
                ),
                1,
            );
        }
        this.enableDisableCoverageLevel();
        if (this.coverageLevelOptions.length === 1) {
            this.isSingleCoverageLevel = true;
        } else {
            this.isSingleCoverageLevel = false;
        }
        if (this.coverageLevelForm.controls[COVERAGE_LEVEL]) {
            if (this.isSingleCoverageLevel) {
                this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(this.coverageLevelOptions[0].value);
            } else if (this.isRetainCurrentAmount) {
                this.retainCurrentAmount(this.isRetain);
            }
        }
    }

    /**
     * Gets filtered rider coverage levels in case of additional unit plans
     * @returns {CoverageLevel[]} filtered rider coverage levels
     */
    getFilteredRiderCoverageLevels(): CoverageLevel[] {
        const baseEnrollment: Enrollments = this.store
            .selectSnapshot(EnrollmentState?.GetEnrollments)
            .find((enrollment) => !!enrollment?.plan?.dependentPlanIds?.includes(this.planObject.basePlanId));
        if (!this.cartData?.planOffering?.plan?.characteristics?.includes(Characteristics.SUPPLEMENTARY)) {
            return this.coverageLevels;
        }
        if (this.isRiderEnrolledInBasePlan(baseEnrollment)) {
            // no rider option should be available if current rider isn't enrolled in base plan
            const shouldNoRiderAvailable = baseEnrollment?.riders?.some(
                (rider) => rider?.plan?.id === this.planObject?.application?.baseRiderId,
            );
            if (shouldNoRiderAvailable) {
                // remove no riders option
                this.coverageLevels = this.coverageLevels.filter(
                    (riderCoverageLevel) => riderCoverageLevel.id !== this.declineCoverageLevelId,
                );
            }
            // Get the coverage level name from base enrollment
            const enrolledCoverageLevelName = baseEnrollment?.riders?.find(
                (rider) => rider?.plan?.id === this.planObject?.application?.baseRiderId,
            )?.coverageLevel?.name;
            // Filter the coverage level id with retain coverage level flag as true and enrolled coverage level name
            const enrolledCoverageLevelId = this.coverageLevels.find(
                (coverageLevel) => coverageLevel.retainCoverageLevel && enrolledCoverageLevelName === coverageLevel.name,
            )?.id;
            this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(enrolledCoverageLevelId);
            this.updateBenefitAmountValues();
        }
        // if base plan has some rider enrolled then only retain riders coverage levels should be displayed
        // else retain rider coverage levels should be removed
        if (baseEnrollment.riders?.some((parentPlanRiders) => parentPlanRiders.plan.policySeries === this.appData?.riderPolicySeries)) {
            return this.coverageLevels.filter(
                (riderCoverageLevel) => riderCoverageLevel.retainCoverageLevel || riderCoverageLevel.id === this.declineCoverageLevelId,
            );
        } else {
            return this.coverageLevels.filter((riderCoverageLevel) => !riderCoverageLevel.retainCoverageLevel);
        }
    }

    /**
     * Method to check next step
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    /**
     * initializes data for coverage levels
     * @param checkDependents: optional param checks valid dependents for selected coverage
     */
    initializeData(checkDependents?: boolean): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);

        this.accountService
            .getDependentRelations(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp: Relations[]) => {
                this.dependentRelations = resp;
            });

        this.memberService
            .getMemberDependents(this.memberId, true, this.mpGroup)
            .pipe(
                switchMap((dependents) => {
                    this.dependents = dependents;
                    return this.coreService.getCoverageLevels(
                        this.planId,
                        this.planObject.rider ? this.cartData.coverageLevelId : 0.0,
                        true,
                    );
                }),
                tap((coverageLevels) => (this.coverageLevels = coverageLevels)),
                switchMap((coverageLevels) => this.getPlanOfferingPricesForCalculation()),
                switchMap((planOfferingPricing) => this.initializeCoverageLevelsData()),
                filter((response) => !!(this.planObject.rider && this.riderCartData.baseRiderId)),
                switchMap((response) => this.updateCartData(false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((_) => {
                if (checkDependents) {
                    this.checkDependentsCriteria(false);
                }
            });
        this.panelData = this.appData.appData.sections.filter((section) => section.title === this.planObject.currentSection.title).pop();
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        const stepIds = this.planObject.steps.length > 0 ? this.planObject.steps.map((step) => step.id) : [];
        this.planResponse = appResponse.filter((resp) => resp.planId === this.planId).pop();
        if (this.planResponse) {
            this.StepResponse = this.planResponse.response.filter((stepResponse) => stepIds.indexOf(stepResponse.stepId) >= 0);
        }

        this.taxOptions = [
            { value: TaxStatus.PRETAX, viewValue: this.languageStrings["primary.portal.applicationFlow.pretaxOption"] },
            {
                value: TaxStatus.POSTTAX,
                viewValue: this.languageStrings["primary.portal.applicationFlow.posttaxOption"],
            },
        ];
    }
    /**
     * initializes form
     */
    initializeForm(): void {
        this.steps = this.planObject.steps ? this.planObject.steps : [];
        this.steps.forEach((step) => {
            if (step.type === APPLICATION_STEPTYPE.PLAN_OPTIONS || step.type === StepType.COVERAGELEVELCHOICE) {
                let coverageLevel;
                if (this.planId === this.secondarySheRiderId && this.appFlowService.getSheRiderDisableVal()) {
                    coverageLevel = this.fb.control(this.declineCoverageLevelId, Validators.required);
                } else {
                    coverageLevel = this.fb.control(
                        this.planObject.rider ? this.getRiderCoverageLevelId() : this.cartData.coverageLevelId || null,
                        Validators.required,
                    );
                }
                if (step.readOnly || this.planObject.reinstate || this.planObject.application.isAdditionalUnit) {
                    coverageLevel.disable();
                }
                this.coverageLevelForm.addControl(COVERAGE_LEVEL, coverageLevel);
                if (this.isSingleCoverageLevel && this.coverageLevelOptions.length) {
                    this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(this.coverageLevelOptions[0].value);
                } else if (this.isRetainCurrentAmount && this.retainCurrentAmountForm.controls.retainCurrentAmount.value) {
                    this.retainCurrentAmount(this.retainCurrentAmountForm.controls.retainCurrentAmount.value);
                }
                this.updateBenefitAmountValues();
                if (
                    this.showBenefitAmount &&
                    this.coverageLevelForm.controls[COVERAGE_PRICE] &&
                    !this.coverageLevelForm.controls[COVERAGE_PRICE].value
                ) {
                    this.coverageLevelForm.controls[COVERAGE_PRICE].patchValue(this.getLowestBenefitAmount(this.priceOptions));
                }
            }
            if (step.type === APPLICATION_STEPTYPE.TAX_STATUS) {
                const taxOption = this.fb.control("", Validators.required);
                this.coverageLevelForm.addControl("taxStatus", taxOption);
                this.setTaxStatus(step);
                this.coverageLevelForm.markAsPristine();
            }
        });
        this.coverageLevelForm.markAsPristine();
        const cartId: number = this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id;
        const appResponse = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter(
                (resp) => resp.application.planId === this.planId && (resp.application.cartItemId === cartId || this.planObject.reinstate),
            )
            .pop();
        let planOptionsStepResponse: string;
        if (appResponse && this.steps.length && this.isRetainCurrentAmount) {
            appResponse.response.forEach((step) => {
                if (
                    step.type &&
                    (step.type === APPLICATION_STEPTYPE.PLAN_OPTIONS || step.type === StepType.COVERAGELEVELCHOICE) &&
                    this.isRetainCurrentAmount
                ) {
                    planOptionsStepResponse = step.value[0] as string;
                }
            });
            if (planOptionsStepResponse) {
                this.isRetain = planOptionsStepResponse["retainCurrentAmount"];
            } else {
                this.isRetain = true;
            }
            this.retainCurrentAmount(this.isRetain);
            this.retainCurrentAmountForm.markAsPristine();
        }
    }

    /**
     * Get the coverage level id of rider plan.
     * If the coverage level of rider is different from the base plan and is not declined or enrolled coverage,
     * rider coverage is set to base plan coverage id if it exists in rider coverage levels
     * @returns coverage level id of rider
     */
    getRiderCoverageLevelId(): number {
        let riderCoverageLevel: number = null;
        if (this.planObject.rider && this.riderCartData.coverageLevelId) {
            if (this.cartData?.planOffering?.plan?.characteristics?.includes(Characteristics.SUPPLEMENTARY)) {
                return this.riderCartData.coverageLevelId;
            }
            riderCoverageLevel =
                [this.declineCoverageLevelId, ENROLLED_COVERAGE_LEVEL, this.cartData.coverageLevelId].every(
                    (id) => this.riderCartData.coverageLevelId !== id,
                ) && this.coverageLevels.some((coverage) => coverage.id === this.cartData.coverageLevelId)
                    ? this.cartData.coverageLevelId
                    : this.riderCartData.coverageLevelId;
        }
        return riderCoverageLevel;
    }

    /**
     * sets tax status options
     * @param step tax status step data
     */
    setTaxStatus(step: Step): void {
        const taxStatusControl = this.coverageLevelForm.controls.taxStatus;
        const planYearData = this.store.selectSnapshot(DualPlanYearState)?.planYearsData;
        const currentPlanYear = planYearData.find((year) => year.id === this.planObject.application.cartData.planOffering.planYearId);
        const isOpenEnrl = this.isEnrollementOpen(currentPlanYear?.enrollmentPeriod);
        this.isOpenEnrollment = isOpenEnrl && this.isOpenEnrollment;
        if (this.planObject.rider) {
            this.taxStatusReadOnly = step.readOnly;
            if (step.readOnly) {
                if (this.defaultPostTaxPlan.includes(this.planObject.application.appData.planId.toString())) {
                    this.taxStatusReadOnly = true;
                    taxStatusControl.patchValue(TaxStatus.POSTTAX);
                } else {
                    taxStatusControl.patchValue(this.appFlowService.getParentPlanTaxStatus(this.planObject.application.cartData.id));
                }
            } else {
                const previousValue = this.appFlowService.getParentPlanTaxStatus(this.riderCartData.cartItemId);
                if (previousValue) {
                    taxStatusControl.patchValue(previousValue);
                } else {
                    taxStatusControl.patchValue(this.appFlowService.getParentPlanTaxStatus(this.planObject.application.cartData.id));
                }
            }
        } else {
            this.taxStatus = this.cartData.planOffering.taxStatus;
            if (this.taxStatus === this.TaxStatus.VARIABLE) {
                taxStatusControl.patchValue(this.isOpenEnrollment || this.isQLEPeriod ? this.TaxStatus.PRETAX : this.TaxStatus.POSTTAX);
            } else {
                taxStatusControl.patchValue(this.taxStatus);
            }
            this.taxStatusReadOnly =
                this.planObject.reinstate ||
                (this.taxStatus === TaxStatus.VARIABLE && !this.isOpenEnrollment && !this.isQLEPeriod) ||
                this.taxStatus !== TaxStatus.VARIABLE;
        }
    }

    /**
     * To check whether enrollment is active
     * @param enrollmentPeriod refers enrollment period
     * @return boolean
     */
    isEnrollementOpen(enrollmentPeriod: Validity): boolean {
        return this.dateService.isBetween(
            this.dateService.toDate(enrollmentPeriod?.effectiveStarting),
            this.dateService.toDate(enrollmentPeriod?.expiresAfter),
        );
    }

    /**
     * Function called on form submit
     * Form required field validation for rider coverage level selection
     */
    onSubmit(): void {
        if (this.isSingleCoverageLevel && this.coverageLevelForm.controls[COVERAGE_LEVEL]) {
            this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(this.coverageLevelOptions[0].value);
        }
        const isValidCoverageLevel = this.coverageLevelOptions.find(
            (a) => a.value === this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
        );
        if (!isValidCoverageLevel) {
            this.coverageLevelForm.controls[COVERAGE_LEVEL].setErrors({ invalid: true });
        }
        if (this.coverageLevelForm.invalid) {
            this.fieldErrorflag = true;
            return;
        }
        this.showSpinner = true;
        if (this.isRetain && !this.coverageLevelForm.controls[COVERAGE_LEVEL].value) {
            if (!this.coverageLevelForm.controls[COVERAGE_PRICE]) {
                this.coverageLevelForm.addControl(COVERAGE_PRICE, this.fb.control(null));
                this.showBenefitAmount = true;
            }
            this.retainCurrentAmount(true);
        }
        this.updateCoverageLevelData();
        this.checkDependentsCriteria(true);
    }

    /**
     * It will update the coverage level name based on coverage level id
     */
    updateCoverageLevelData(): void {
        if (this.coverageLevelForm.controls[COVERAGE_LEVEL].value) {
            const coverageName = this.coverageLevelOptions.find(
                (a) => a.value === this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
            ).viewValue;
            this.appFlowService.updateCoverageLevelName(coverageName);
        }
    }

    /**
     * function to check dependents criteria
     * @param onNextFlag boolean
     */
    checkDependentsCriteria(onNextFlag: boolean): void {
        if (this.coverageRules) {
            this.ValidateCoverageRule(
                this.coverageRules.filter((rule) => rule.coverageLevelId === this.coverageLevelForm.controls[COVERAGE_LEVEL].value).pop()
                    .coverageLevelRule,
                onNextFlag,
            );
        }
    }
    /**
     * validates coverage level rules
     * @param rule coverage level rule
     * @param onNextFlag indicates if called on next button click
     */
    // eslint-disable-next-line complexity
    ValidateCoverageRule(rule: CoverageLevelRule, onNextFlag: boolean): void {
        this.dependentsAddition = [];
        const children = this.dependents.filter(
            (dependent) =>
                dependent.dependentRelationId === this.dependentRelations.filter((relation) => relation.code === "CHILD").pop().id,
        );
        const spouse = this.dependents
            .filter(
                (dependent) =>
                    dependent.dependentRelationId === this.dependentRelations.filter((relation) => relation.code === "SPOUSE").pop().id,
            )
            .pop();
        // Cheking for eligible children
        if (
            (rule.childMaxAge || rule.childMinAge) &&
            ((rule.minDependents > 0 && !rule.coversSpouse) || (rule.minDependents > 1 && rule.coversSpouse))
        ) {
            let validChildren = 0;
            const requiredChildren = rule.coversSpouse ? rule.minDependents - 1 : rule.minDependents;
            for (const child of children) {
                let validChildFlag = true;
                const age = this.calculateAge(child.birthDate, false);
                const ageOnCoverageStart = this.calculateAge(child.birthDate, true);
                if (
                    rule.childMaxAge &&
                    (!child.profile.disabled ||
                        (this.planObject.application.carrierId !== CarrierId.ARGUS &&
                            this.planObject.application.carrierId !== CarrierId.AFLAC_DENTAL_AND_VISION)) &&
                    !(rule.childMaxAge !== 200 && ageOnCoverageStart < rule.childMaxAge)
                ) {
                    validChildFlag = false;
                }
                if (rule.childMinAge && !(rule.childMinAge && rule.childMinAge !== 0 && age < rule.childMinAge)) {
                    validChildFlag = false;
                }
                if (validChildFlag) {
                    validChildren++;
                }
            }
            if (requiredChildren > validChildren) {
                this.dependentsAddition.push(
                    requiredChildren - validChildren > 1
                        ? this.languageStrings["primary.portal.applicationflow.children"]
                        : this.languageStrings["primary.portal.applicationflow.child"],
                );
            }
        }
        // need to check for covers spouse
        if (rule.maxDependents !== 0 && rule.maxDependents >= this.dependents.length) {
            // need to check what message has to be displayed if max and min dependents validations failed
        }
        if (rule.minDependents !== 0 && rule.minDependents <= this.dependents.length) {
            // need to check what message has to be displayed if max and min dependents validations failed
        }
        if (rule.coversSpouse && !spouse) {
            this.dependentsAddition.push("SPOUSE");
        }
        if (this.dependentsAddition.length !== 0) {
            this.dependentsAddition = Array.from(new Set(this.dependentsAddition));
            const dependentAddition = this.dependentsAddition.length === 1 ? this.dependentsAddition[0].toLowerCase() : "";
            this.dependentsHeading = "primary.portal.applicationflow.requireddependentsheading";
            const dependentMessage =
                this.router.url.indexOf(AppSettings.DIRECT) >= 0
                    ? "primary.portal.applicationflow.direct.mpp.requireddependentsmessage"
                    : this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_MEMBER
                        ? "primary.portal.applicationflow.mmp.requireddependentsmessage"
                        : "primary.portal.applicationflow.payroll.mpp.requireddependentsmessage";
            this.dependentsMessageReplaceContent =
                dependentAddition.length > 0 ? dependentAddition : this.languageStrings["primary.portal.applicationflow.spouseandchild"];
            if (this.dependentsMessageReplaceContent === this.languageStrings["primary.portal.applicationflow.children"].toLowerCase()) {
                this.dependentsMessage = this.languageStrings[dependentMessage + ".multi"];
            } else {
                this.dependentsMessage = this.languageStrings[dependentMessage].replace(
                    "{dependenttype}",
                    this.dependentsMessageReplaceContent,
                );
            }
            this.dependentsHeadingreplaceContent =
                dependentAddition.length > 0 ? dependentAddition : this.languageStrings["primary.portal.applicationflow.dependents"];
            this.dependentsAdditionRequired = true;
            this.showSpinner = false;
            this.sectionToScroll = this.actionButtonsconst;
        } else {
            this.dependentsAdditionRequired = false;
            if (onNextFlag) {
                this.updateCartData(true).pipe(takeUntil(this.unsubscribe$)).subscribe();
            }
        }
    }
    /**
     * method to calculate the Age of dependent
     * @param birthDate - date of birth of dependent
     * @param onCoverageStart - value to check if age of dependent needs to be calculated on coverage effective start date
     * @returns the Age of dependent in years
     */
    calculateAge(birthDate: string, onCoverageStart: boolean): number {
        const timeDiff = Math.abs(
            (onCoverageStart
                ? new Date(
                    this.cartData.coverageEffectiveDate
                        ? this.cartData.coverageEffectiveDate
                        : this.cartData.coverageValidity.effectiveStarting,
                ).getTime()
                : Date.now()) - this.dateService.toDate(birthDate).getTime(),
        );
        return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
    }
    getResponseObjectsToBeUpdated(): ApplicationResponse[] {
        const responseToBeUpdated: ApplicationResponse[] = [];
        if (this.planObject.steps.length > 0) {
            this.planObject.steps.forEach((step) => {
                const stepValue = [];
                if (step.type === APPLICATION_STEPTYPE.PLAN_OPTIONS || step.type === StepType.COVERAGELEVELCHOICE) {
                    stepValue.push({
                        coverageLevelId: this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
                        benefitAmount:
                            this.showBenefitAmount && this.coverageLevelForm.controls[COVERAGE_PRICE]
                                ? this.coverageLevelForm.controls[COVERAGE_PRICE].value
                                : 0,
                        retainCurrentAmount: this.isRetainCurrentAmount
                            ? this.retainCurrentAmountForm.controls.retainCurrentAmount.value.toString()
                            : false,
                    });
                } else if (step.type === APPLICATION_STEPTYPE.TAX_STATUS) {
                    stepValue.push(this.coverageLevelForm.controls["taxStatus"].value.toString());
                }
                const responseObject: ApplicationResponse = {
                    type:
                        step.type === APPLICATION_STEPTYPE.PLAN_OPTIONS || step.type === StepType.COVERAGELEVELCHOICE
                            ? APPLICATION_STEPTYPE.PLAN_OPTIONS
                            : step.type,
                    stepId: step.id,
                    value: stepValue,
                };
                responseToBeUpdated.push(responseObject);
            });
        }
        return responseToBeUpdated;
    }
    /**
     * updates cartData
     * @param onNext indicates if called on click of next or onload
     * @returns Observable<HttpResponse<void>>
     */
    /* eslint-disable-next-line complexity */
    updateCartData(onNext: boolean): Observable<HttpResponse<unknown>> {
        let cartData: AddCartItem;
        const cartItemId: number = this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id;
        let reinstatementData: BasePlanApplicationPanel;
        const reinstatementPanelItem = this.store.selectSnapshot(EnrollmentState.GetReinstatementPanel);
        if (reinstatementPanelItem) {
            reinstatementData = reinstatementPanelItem.find((item) => item.cartData.id === cartItemId);
        }
        const cost: Cost =
            reinstatementData && reinstatementData.cartData ? this.getReinstatePrice(reinstatementData.cartData) : this.GetPlanPrice();

        if (!this.planObject.rider) {
            cartData = {
                benefitAmount: this.showBenefitAmount ? this.coverageLevelForm.controls[COVERAGE_PRICE].value : this.cartData.benefitAmount,
                memberCost: cost.memberCost,
                dependentAge: this.cartData.dependentAge ? this.cartData.dependentAge : null,
                totalCost: cost.totalCost,
                enrollmentMethod: this.isMember ? EnrollmentMethod.SELF_SERVICE : this.cartData.enrollmentMethod,
                enrollmentState: this.cartData.enrollmentState,
                enrollmentCity: this.cartData.enrollmentCity,
                planOfferingId: this.cartData.planOffering.id,
                coverageLevelId: this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
                riders: this.cartData.riders || [],
                assistingAdminId: this.assistingAdminIdVal
                    ? this.assistingAdminIdVal
                    : this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
                riskClassOverrideId: this.cartData.riskClassOverrideId && !this.isMember ? this.cartData.riskClassOverrideId : null,
                coverageEffectiveDate: this.cartData.coverageEffectiveDate
                    ? this.appFlowService.getCoverageDateToUpdateCart(this.cartData.coverageEffectiveDate)
                    : null,
                subscriberQualifyingEventId:
                    this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
            };
        } else {
            const riderToBeUpdated = this.cartData.riders.find((rider) => rider.planId === this.planObject.application.planId);
            let benefitAmount: number = riderToBeUpdated.benefitAmount;
            if (riderToBeUpdated.baseRiderId) {
                const baseRider: RiderCart = this.cartData.riders.find((rider) => rider.planId === riderToBeUpdated.baseRiderId);
                benefitAmount = baseRider && baseRider.benefitAmount;
            }
            cartData = {
                benefitAmount: this.showBenefitAmount ? this.coverageLevelForm.controls[COVERAGE_PRICE].value : benefitAmount,
                coverageLevelId:
                    this.coverageLevelForm.controls[COVERAGE_LEVEL] && this.coverageLevelForm.controls[COVERAGE_LEVEL].value
                        ? this.coverageLevelForm.controls[COVERAGE_LEVEL].value
                        : riderToBeUpdated.coverageLevelId,
                memberCost: cost.memberCost,
                dependentAge: this.cartData.dependentAge ? this.cartData.dependentAge : null,
                totalCost: cost.totalCost,
                planOfferingId: this.riderCartData.planOfferingId,
                enrollmentMethod: this.isMember ? EnrollmentMethod.SELF_SERVICE : this.cartData.enrollmentMethod,
                enrollmentState: this.cartData.enrollmentState,
                enrollmentCity: this.cartData.enrollmentCity,
                assistingAdminId: this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
                parentCartItemId: this.cartData.id,
                baseRiderId: this.riderCartData.baseRiderId,
                subscriberQualifyingEventId:
                    this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
            };
        }
        return this.shoppingService.updateCartItem(this.memberId, this.mpGroup, cartItemId, cartData).pipe(
            tap(
                (resp) => {
                    if (onNext) {
                        this.updateApplicationResponseDataToServer();
                        this.appFlowService.UpdateRiderDetails(true);
                    }
                },
                (error) => {
                    this.showSpinner = false;
                    this.hasError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            ),
            takeUntil(this.unsubscribe$),
        );
    }
    /**
     * fetch cost for reinstatement plan
     * @param cartData cart details
     */
    getReinstatePrice(cartData: GetCartItems): Cost {
        return {
            memberCost: cartData.memberCost || 0.0,
            totalCost: cartData.totalCost || 0.0,
        };
    }
    /**
     * fetch cart details when no rider present in cart
     * @param cost plan cost
     */
    getCartDataWithoutRider(cost: Cost): AddCartItem {
        return {
            benefitAmount: this.showBenefitAmount ? this.coverageLevelForm.controls[COVERAGE_PRICE].value : this.cartData.benefitAmount,
            memberCost: cost.memberCost,
            totalCost: cost.totalCost,
            enrollmentMethod: this.isMember ? EnrollmentMethod.SELF_SERVICE : this.cartData.enrollmentMethod,
            enrollmentState: this.cartData.enrollmentState,
            enrollmentCity: this.cartData.enrollmentCity,
            planOfferingId: this.cartData.planOffering.id,
            coverageLevelId: this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
            riders: this.cartData.riders || [],
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
            riskClassOverrideId: this.cartData.riskClassOverrideId && !this.isMember ? this.cartData.riskClassOverrideId : null,
            coverageEffectiveDate: this.cartData.coverageEffectiveDate
                ? this.appFlowService.getCoverageDateToUpdateCart(this.cartData.coverageEffectiveDate)
                : null,
            subscriberQualifyingEventId:
                this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
        };
    }
    /**
     * fetch cart details when rider present in cart
     * @param cost plan cost
     */
    getCartDataWithRider(cost: Cost, benefitAmount: number, riderToBeUpdated: RiderCart): AddCartItem {
        return {
            benefitAmount: this.showBenefitAmount ? this.coverageLevelForm.controls[COVERAGE_PRICE].value : benefitAmount,
            coverageLevelId:
                this.coverageLevelForm.controls[COVERAGE_LEVEL] && this.coverageLevelForm.controls[COVERAGE_LEVEL].value
                    ? this.coverageLevelForm.controls[COVERAGE_LEVEL].value
                    : riderToBeUpdated.coverageLevelId,
            memberCost: cost.memberCost,
            totalCost: cost.totalCost,
            planOfferingId: this.riderCartData.planOfferingId,
            enrollmentMethod: this.isMember ? EnrollmentMethod.SELF_SERVICE : this.cartData.enrollmentMethod,
            enrollmentState: this.cartData.enrollmentState,
            enrollmentCity: this.cartData.enrollmentCity,
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
            parentCartItemId: this.cartData.id,
            baseRiderId: this.riderCartData.baseRiderId,
            subscriberQualifyingEventId:
                this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
        };
    }
    updateApplicationResponseDataToServer(): void {
        this.showSpinner = true;
        // TODO Handle error response form api
        this.shopingCartService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id,
                this.mpGroup,
                this.getResponseObjectsToBeUpdated(),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    const storeUpdates$ = [];
                    storeUpdates$.push(
                        this.store.dispatch(
                            new UpdateApplicationResponse(
                                this.memberId,
                                this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id,
                                this.mpGroup,
                            ),
                        ),
                    );
                    storeUpdates$.push(this.store.dispatch([new UpdateCartData(this.cartData.id, this.cartData.planOffering.id)]));
                    storeUpdates$.push(
                        this.shopingCartService.getAncillaryInformation(this.memberId, this.cartData.id, this.mpGroup, this.planId),
                    );
                    forkJoin(storeUpdates$)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((resp: GetAncillary[]) => {
                            this.appFlowService.patchConstraint(this.planObject.application.appData.id, "", resp[AppSettings.TWO]);
                            if (this.planObject.rider) {
                                let declineFlag = false;
                                if (this.coverageLevelForm.controls[COVERAGE_LEVEL].value === this.declineCoverageLevelId) {
                                    declineFlag = true;
                                }
                                this.store
                                    .dispatch(
                                        new DeclineRiderCartItem(this.planObject.rider.riderIndex, this.planObject.basePlanId, declineFlag),
                                    )
                                    .pipe(takeUntil(this.unsubscribe$))
                                    .subscribe((respo) => {
                                        this.onNext();
                                        this.showSpinner = false;
                                    });
                            } else {
                                this.onNext();
                                this.showSpinner = false;
                            }
                        });
                },
                (error) => {
                    // TEMP FIX NEED TO REMOVE AFTER RIDER IMPLEMENTATION
                    this.showSpinner = false;
                    this.onNext();
                },
            );
    }
    // TODO: It will be used in Back Functionality
    onBack(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: false,
            discard: false,
        });
    }

    onNext(): void {
        this.displayError = false;
        this.coverageLevelForm.markAsPristine();
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }

    getUpdatedCartData(cartData: GetCartItems): void {
        this.cartData = this.utilService.copy(cartData);
        if (this.planObject.rider) {
            this.riderCartData = this.getRiderCartDataFromCart();
        }
    }
    /**
     * get the price of plans
     * @returns {Cost} sum of all costs of selected plans
     */
    GetPlanPrice(): Cost {
        const cost: Cost = { memberCost: 0.0, totalCost: 0.0 };
        let planOfferingPrices: PlanOfferingPricing[] = [];
        const coveragePrice = this.coverageLevelForm.controls[COVERAGE_PRICE];
        const coverageLevel = this.coverageLevelForm.controls[COVERAGE_LEVEL];
        if (this.appFlowService.getTobaccoResponse(this.planObject)) {
            planOfferingPrices = this.tobaccoPlanOfferingPrices;
        } else {
            planOfferingPrices = this.nonTobaccoPlanOfferingPrices;
        }

        const planPricesBasedOnCoverage = planOfferingPrices
            ? planOfferingPrices.filter((price) => price.coverageLevelId === coverageLevel.value)
            : undefined;

        /**
         * block to execute if it is juvenile plan
         */
        if (this.isJuvenilePlan) {
            if (planPricesBasedOnCoverage) {
                /**
                 * block to execute if coverage price exists
                 */
                if (coveragePrice) {
                    const planPrice = planPricesBasedOnCoverage.find(
                        (price) => price.benefitAmount === coveragePrice.value && price.coverageLevelId === coverageLevel.value,
                    );
                    /**
                     * block to execute if totalCost exists.
                     */
                    if (planPrice) {
                        cost.totalCost = planPrice.totalCost;
                        cost.memberCost = planPrice.memberCost;
                        return cost;
                    }
                    return cost;
                }
                /**
                 * block to execute if coverage price does not exist.
                 */
                const planOfferingPrice = planOfferingPrices.find(
                    (price) =>
                        price.coverageLevelId === coverageLevel.value &&
                        price.benefitAmount === this.planObject.application.cartData.benefitAmount,
                );
                /**
                 * block to execute if coverage price does not exist and planOfferingPrices exists.
                 */
                if (planOfferingPrice) {
                    cost.totalCost = planOfferingPrice.totalCost;
                    cost.memberCost = planOfferingPrice.memberCost;
                }
                return cost;
            }
            return cost;
        }
        if (planPricesBasedOnCoverage && coveragePrice) {
            const planPrice = planPricesBasedOnCoverage.find(
                (price) => price.benefitAmount === coveragePrice.value && price.coverageLevelId === coverageLevel.value,
            );
            if (planPrice) {
                cost.memberCost = planPrice.memberCost;
                cost.totalCost = planPrice.totalCost;
            }
        } else {
            const planOfferingPrice = planOfferingPrices.find((price) => price.coverageLevelId === coverageLevel.value);
            if (planOfferingPrice) {
                cost.memberCost = planOfferingPrice.memberCost;
                cost.totalCost = planOfferingPrice.totalCost;
            }
        }
        return cost;
    }
    updateBenefitAmountValues(): void {
        let planOfferingPrices: PlanOfferingPricing[] = [];
        if (this.appFlowService.getTobaccoResponse(this.planObject)) {
            planOfferingPrices = this.tobaccoPlanOfferingPrices;
        } else {
            planOfferingPrices = this.nonTobaccoPlanOfferingPrices;
        }
        if (this.coverageLevelForm.controls[COVERAGE_LEVEL]) {
            const benefitAmounts = planOfferingPrices.filter(
                (price) => price.coverageLevelId === this.coverageLevelForm.controls[COVERAGE_LEVEL].value,
            );
            this.priceOptions = [];
            if (benefitAmounts) {
                benefitAmounts.forEach((price) => {
                    if (price.benefitAmount) {
                        this.priceOptions.push({ value: price.benefitAmount, viewValue: price.benefitAmount });
                    }
                });
                if (this.priceOptions.length === 0) {
                    this.showBenefitAmount = false;
                    if (this.coverageLevelForm.controls[COVERAGE_PRICE]) {
                        this.coverageLevelForm.removeControl(COVERAGE_PRICE);
                    }
                } else {
                    if (this.coverageLevelForm.controls[COVERAGE_PRICE]) {
                        this.coverageLevelForm.controls[COVERAGE_PRICE].patchValue(this.getBenefitAmountToPrePopulate());
                    } else {
                        this.coverageLevelForm.addControl(COVERAGE_PRICE, this.fb.control(this.getBenefitAmountToPrePopulate()));
                    }
                    this.showBenefitAmount = true;
                    if (this.planObject.reinstate || this.planObject.application.isAdditionalUnit) {
                        this.coverageLevelForm.controls[COVERAGE_PRICE].disable();
                    } else {
                        this.coverageLevelForm.controls[COVERAGE_PRICE].enable();
                    }
                }
                this.loadBenefitAmountValues(this.ancillaryInformation);
            } else {
                this.removeBenefitAmount();
            }
        }
        this.calculatePriceForDisplay();
        if (this.coverageLevelForm.dirty) {
            this.checkDependentsCriteria(false);
        }
    }

    removeBenefitAmount(): void {
        this.showBenefitAmount = false;
        if (this.coverageLevelForm.controls[COVERAGE_PRICE]) {
            this.coverageLevelForm.removeControl(COVERAGE_PRICE);
        }
    }

    /**
     * This method is used to open modal pop-up for adding a dependent
     * Once dialog is closed, it will call @method initializeData and update dependent listing
     */
    openAddDependentsModal(): void {
        const addDependentModal = this.empoweredService.openDialog(TpiAddDependentsComponent, {
            data: this.tpiSSODetails,
        });
        addDependentModal
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.memberService.setReinstatementPopupStatus(true);
                this.initializeData();
            });
    }
    /**
     * This method will navigate to add dependent screen if it is not opened from TPI flow
     * This method will open dialog to add dependent if it is opened from TPI flow
     */
    navigateToAddDependents(): void {
        if (this.planObject.reinstate) {
            let index;
            this.closeForm.emit();
            this.quoteShopHelperService.currentSelectedProductOfferingIndex.pipe(takeUntil(this.unsubscribe$)).subscribe((productIndex) => {
                index = productIndex;
            });
            const reinstate: Reinstate = {
                isReinstate: true,
                selectedCartItemIndex: index,
            };
            this.store.dispatch(new SetReinstateItem(reinstate));
        }
        const portal: string = this.store.selectSnapshot(SharedState.portal);
        if (this.isTpi) {
            this.openAddDependentsModal();
        } else if (this.router.url.indexOf("direct") >= 0) {
            this.router.navigate([`/producer/direct/customers/${this.mpGroup}/${this.memberId}/dependents/add`]);
        } else if (portal === Portals.MEMBER) {
            this.router.navigate(["/member/household/dependents/add"]);
        } else if (portal === Portals.PRODUCER) {
            this.router.navigate([`/producer/payroll/${this.mpGroup}/member/${this.memberId}/dependents/add`]);
        } else {
            // TODO : add relative route once extended shopping cart activated route issue is solved
            this.router.navigate(["../../../../dependents/add"], { relativeTo: this.route });
        }
    }
    /**
     * Initializes coverage level data
     * @returns Observable<[GetAncillary, boolean]>
     */
    initializeCoverageLevelsData(): Observable<[GetAncillary, boolean]> {
        this.showSpinner = true;
        this.coverageRulesAPICalls = [];
        const canAccessAllCoverageLevels$: Observable<boolean> = this.tpiRestrictions
            .canAccessTPIRestrictedModuleInHQAccount(null, null, this.mpGroup)
            .pipe(
                withLatestFrom(this.store.select(SharedState.portal)),
                switchMap(([isNonHQAccount, portal]) => {
                    if (portal === Portals.MEMBER) {
                        return of(isNonHQAccount);
                    }
                    return isNonHQAccount ? of(true) : this.staticUtilService.hasPermission(Permission.AFLAC_HQ_COVERAGE_LEVEL_EDIT);
                }),
            );
        return combineLatest([this.getAncillaryInformation(), canAccessAllCoverageLevels$]).pipe(
            take(1),
            tap(
                ([ancillaryInformation, canAccessAllCoverageLevels]) => {
                    this.coverageLevels =
                        canAccessAllCoverageLevels || this.planObject.rider || this.checkCoverageLevelName(this.coverageLevels)
                            ? this.coverageLevels
                            : this.appFlowService.restrictCoverageLevelsBasedOnDependents(
                                this.store.selectSnapshot(EnrollmentState.GetMemberDependents),
                                this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation),
                                this.coverageLevels,
                            );
                    this.ancillaryInformation = ancillaryInformation;
                    this.coverageLevelOptions = [];
                    this.updateRetainRiders(this.ancillaryInformation, true);
                    this.fetchCoverageRules(this.coverageRulesAPICalls);
                    this.showSpinner = false;
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }

    /**
     * function to check coverage level names present or not based on enum
     * @param coverageLevels CoverageLevel[]
     * @returns boolean true if coverage level names not present
     */
    checkCoverageLevelName(coverageLevels: CoverageLevel[]): boolean {
        return !Object.values(CoverageLevelNames).some((name) => coverageLevels.some((coverageName) => coverageName.name === name));
    }

    /**
     * Method that returns rider plan cost
     * @returns {number} rider plan cost
     */
    getRiderPlanCost(): number {
        const planCost = this.GetPlanPrice();
        return planCost ? planCost.totalCost + this.cartData.totalCost : this.cartData.totalCost;
    }
    getRiderCartDataFromCart(): RiderCart {
        return this.cartData.riders
            ? this.cartData.riders.length > 0
                ? this.cartData.riders.filter((rider) => rider.planId === this.planId).pop()
                : null
            : null;
    }
    removeSpouseInvolvedCoverageLevel(knockout: string): void {
        if (knockout === KnockoutType.SPOUSE_KNOCKOUT) {
            this.isSpouseKnockout = true;
        } else {
            this.isSpouseKnockout = false;
        }
        this.enableDisableCoverageLevel();
    }
    /**
     * enables or disables coverage levels based on spouse knockout and ancillary information
     */
    enableDisableCoverageLevel(): void {
        let disableRiders: number[] = [];
        const coverageLevelControl = this.coverageLevelForm.controls[COVERAGE_LEVEL];
        let isValidCoverageLevel = false;
        let checkForInvalidCoverageLevel = false;
        if (
            this.ancillaryInformation &&
            this.ancillaryInformation.coverageLevels &&
            this.ancillaryInformation.coverageLevels.length &&
            this.ancillaryInformation.downgrade
        ) {
            checkForInvalidCoverageLevel = true;
            disableRiders = this.ancillaryInformation.coverageLevels
                .filter((coverageLevel) => coverageLevel.coverageLevelProperty === CoverageLevelProperty.DISABLE)
                .map((coverageLevel) => coverageLevel.coverageLevelId);
        }
        const coverageIdPricing = [...this.tobaccoPlanOfferingPrices, ...this.nonTobaccoPlanOfferingPrices]
            .map((pricing) => pricing.coverageLevelId)
            .concat(this.planObject.application.cartData.coverageLevelId);
        const baseEnrollment: Enrollments = this.store
            .selectSnapshot(EnrollmentState?.GetEnrollments)
            .find((enrollment) => !!enrollment?.plan?.dependentPlanIds?.includes(this.planObject.basePlanId));
        this.coverageLevelOptions = this.coverageLevelOptions.map((option) => {
            let disableFlag = false;
            if (
                (this.spouseInvolvedCoverageLevels.indexOf(option.value) >= 0 && this.isSpouseKnockout) ||
                (option.value !== this.declineCoverageLevelId && coverageIdPricing.length && !coverageIdPricing.includes(option.value)) ||
                (this.ancillaryInformation.downgrade && disableRiders.indexOf(option.value) >= 0)
            ) {
                checkForInvalidCoverageLevel = true;
                disableFlag = true;
            }
            if (
                this.planObject.application.isAdditionalUnit ||
                // disable coverage level if rider is enrolled in parent plan and its belongs to supplementary plans
                (this.cartData?.planOffering?.plan?.characteristics?.includes(Characteristics.SUPPLEMENTARY) &&
                    this.isRiderEnrolledInBasePlan(baseEnrollment))
            ) {
                disableFlag = true;
            }
            option.disable = disableFlag;
            if (!disableFlag && coverageLevelControl && option.value === coverageLevelControl.value) {
                isValidCoverageLevel = true;
            }
            return option;
        });
        // Coverage level in the form must never set to null for Additional units plan
        if (
            !isValidCoverageLevel &&
            coverageLevelControl &&
            checkForInvalidCoverageLevel &&
            !this.planObject.application.isAdditionalUnit &&
            // If rider's plan belongs to supplementary
            !this.cartData?.planOffering?.plan?.characteristics?.includes(Characteristics.SUPPLEMENTARY)
        ) {
            this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(null);
            this.removeBenefitAmount();
        }
    }

    /**
     * Retrieve coverage rules from API and proceed to knockout question(s) if applicable.
     * @param coverageRulesAPICalls observables through which the coverage rules are retrieved
     */
    fetchCoverageRules(coverageRulesAPICalls: Observable<CoverageLevelRule>[]): void {
        this.coverageRules = [];
        this.spouseInvolvedCoverageLevels = [];
        forkJoin(coverageRulesAPICalls)
            .pipe(
                tap((coverageLevelRulesResponse) => {
                    this.coverageRules = coverageLevelRulesResponse.map((coverageLevelRule, index) => ({
                        coverageLevelId: this.coverageLevels[index] ? this.coverageLevels[index].id : undefined,
                        coverageLevelRule: coverageLevelRule,
                    }));
                    this.spouseInvolvedCoverageLevels = this.coverageRules
                        .filter((coverageRule) => coverageRule.coverageLevelRule.coversSpouse)
                        .map((coverageRule) => coverageRule.coverageLevelId);
                    this.showSpinner = false;
                }),
                switchMap(() => this.appFlowService.getKnockoutTrigger),
                tap((knockoutType) => {
                    if (knockoutType === KnockoutType.SPOUSE_KNOCKOUT) {
                        this.removeSpouseInvolvedCoverageLevel(knockoutType);
                    } else {
                        this.checkSpouseKnockout();
                    }
                }),
                catchError((error) => {
                    this.showSpinner = false;
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /* Checking if app response contain spouse knockout by checking if response contains the same value
    as spouse knockout question in spouseKnockoutQuestion  */
    checkSpouseKnockout(): void {
        let isKnockout = false;
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        this.planResponse = appResponse.filter((resp) => resp.planId === this.planId).pop();
        this.spouseKnockoutQuestion.forEach((question) => {
            const spouseKnockOutOption = question.options.filter((option) => option.knockoutText === KnockoutType.SPOUSE_KNOCKOUT);
            this.planResponse.response.map((response) => {
                if (response.planQuestionId === question.id) {
                    response.value.map((value) => {
                        if (value === spouseKnockOutOption[0].value) {
                            isKnockout = true;
                        }
                    });
                }
            });
        });

        if (!isKnockout) {
            this.removeSpouseInvolvedCoverageLevel(KnockoutType.NOT_APPLICABLE);
        } else {
            this.removeSpouseInvolvedCoverageLevel(KnockoutType.SPOUSE_KNOCKOUT);
        }
    }
    scrollToCoverageLevel(): void {
        document.getElementById("coverageLevels").scrollIntoView();
        this.dependentsAdditionRequired = false;
    }

    getLowestBenefitAmount(options: BenefitAmountDisplay[]): number {
        return options.length > 0 ? options[0].value : null;
    }
    /**
     * gets more settings required for pricing api based on member data
     * @param tobaccoStatus indicates tobacco status of the employee
     * @param coverageDate coverage effective date of product
     * @returns more settings required for pricing api
     */
    getTobaccoSettings(tobaccoStatus: boolean, coverageDate: string): MoreSettings {
        let effectiveDate;
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        const birthdate = memberData.info.birthDate;
        if (coverageDate) {
            effectiveDate = this.dateService.toDate(coverageDate).getTime();
        } else {
            effectiveDate = Date.now;
        }
        const timeDiff = Math.abs(effectiveDate - this.dateService.toDate(birthdate).getTime());
        const memberAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
        const payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        const payFrequencyId = payFrequency.id;
        let addressInfo;
        const salary: number = this.appFlowService.getMemberSalary(coverageDate);
        if (memberData.contactInfo && memberData.contactInfo.length) {
            addressInfo = memberData.contactInfo.filter((contact) => contact.address).pop();
        }
        this.getSpouseData();
        const allPlanOfferings = this.store.selectSnapshot(EnrollmentState.GetAllPlanOfferings);
        const isSpouseCovered = this.coverageLevels.some(
            (coverageLevel) => this.cartData.coverageLevelId === coverageLevel.id && coverageLevel.spouseCovered,
        );

        // TODO: Need to get clarification on mandatory fields to be passed.
        const settings: MoreSettings = {
            age: memberAge,
            gender: memberData.info.gender,
            tobaccoUser: tobaccoStatus,
            state: addressInfo ? addressInfo.state : null,
            payrollFrequencyId: payFrequencyId.toString(),
            spouseAge: this.spouseAge,
            spouseGender: this.spouseData ? this.spouseData.gender : null,
            annualSalary: salary ? salary : null,
            spouseTobaccoUser:
                allPlanOfferings && allPlanOfferings.some((planOffering) => planOffering.familyBasedTobaccoStatusPricing) && isSpouseCovered
                    ? tobaccoStatus
                    : this.appFlowService.getSpouseTobaccoUseAnswer(),
        };

        if (this.planObject.rider && this.appData.appData.sections.some((section) => section.title === StepTitle.SPOUSE_TOBACCO)) {
            // change 'spouseTobaccoUser'
            // and set 'tobaccoUser' according to the user's response to the tobacco question
            return {
                ...settings,
                tobaccoUser: this.appFlowService.getTobaccoStatus(),
                spouseTobaccoUser: tobaccoStatus,
            };
        }

        return settings;
    }

    getSpouseData(): void {
        const dependentsData = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependents));
        const memberRelations = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation));
        if (dependentsData.length && memberRelations.length) {
            const spouseRelation = memberRelations.filter((relation) => relation.relationType === Relation.SPOUSE).pop();
            const spouseDependent = dependentsData.filter((dependent) => dependent.dependentRelationId === spouseRelation.id);
            if (spouseDependent && spouseDependent.length) {
                this.spouseData = spouseDependent[0];
                const timeDiff = Math.abs(Date.now() - this.dateService.toDate(this.spouseData.birthDate).getTime());
                this.spouseAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25).toString();
            }
        }
    }
    /**
     * gets list of pricing observables
     * @returns list of pricing observables
     */
    getPlanPricingObservables(): Observable<PlanOfferingPricing[]>[] {
        const coverageEffectiveDate = this.planObject.application.cartData.coverageEffectiveDate;
        const planPricingEndPoints$: Observable<PlanOfferingPricing[]>[] = [];
        planPricingEndPoints$.push(this.getPlanOfferingPricing(this.getTobaccoSettings(true, coverageEffectiveDate)));
        planPricingEndPoints$.push(this.getPlanOfferingPricing(this.getTobaccoSettings(false, coverageEffectiveDate)));
        return planPricingEndPoints$;
    }

    /**
     * Method to invoke getPlanOfferingPricing based on coverage level selection
     * @param tobaccoSettings
     * @returns {Observable<PlanOfferingPricing[]>}
     */
    // eslint-disable-next-line complexity
    getPlanOfferingPricing(tobaccoSettings: MoreSettings): Observable<PlanOfferingPricing[]> {
        const CHILD_AGE = "CHILD_AGE";
        const constraintValues = this.store
            .selectSnapshot(EnrollmentState.GetConstraint)
            .filter((constraintData) => constraintData.flowId === this.planObject.application.appData.id)
            .pop();
        const planOfferingId = this.planObject.rider
            ? this.riderCartData.planOfferingId.toString()
            : this.cartData.planOffering.id.toString();
        const coverageEffectiveDate = this.planObject.application.cartData.coverageEffectiveDate;
        let basePlanId: number;
        if (this.planObject.rider && this.riderCartData.baseRiderId) {
            basePlanId = this.riderCartData.baseRiderId;
        } else {
            basePlanId = this.planObject.basePlanId;
        }
        let dependentAge: number;
        let benefitAmount: number;
        const isPolicyFeeRider = this.planObject.rider && this.policyFeeRiderIds?.includes(this.planId.toString());
        if (this.isJuvenilePlan && this.dependents && !this.planObject.rider) {
            dependentAge = constraintValues[CHILD_AGE];
            benefitAmount = this.planObject.application.cartData.benefitAmount ? this.planObject.application.cartData.benefitAmount : null;
        } else if (this.planObject.rider && this.planObject.basePlanId) {
            benefitAmount = isPolicyFeeRider ? this.cartData.benefitAmount : this.getAdditionalUnitBenefitAmount();
        }
        let riskClassOverrideId: number;
        if (this.cartData.riskClassOverrideId) {
            riskClassOverrideId = this.cartData.riskClassOverrideId;
        } else if (this.planObject.application.carrierId === CarrierId.AFLAC) {
            const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
            if (currentAccount && currentAccount.ratingCode === RatingCode.DUAL) {
                riskClassOverrideId = this.appFlowService.getDualAccountRiskClassId(this.planObject.application.productId);
            } else {
                riskClassOverrideId = this.store.selectSnapshot(EnrollmentState.GetMemberData).riskClassId;
            }
        }

        const planPricingEndPoint$ = this.shoppingService
            .getPlanOfferingPricing(
                // TODO : update below parameter after rider plan offering id is in place
                planOfferingId,
                this.cartData.enrollmentState,
                tobaccoSettings,
                this.memberId,
                this.mpGroup,
                this.planObject.rider ? basePlanId : null,
                this.planObject.rider ? this.cartData.coverageLevelId : null,
                benefitAmount,
                dependentAge,
                coverageEffectiveDate ? coverageEffectiveDate : null,
                riskClassOverrideId,
                true,
                this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id,
                isPolicyFeeRider,
            )
            .pipe(catchError((err) => this.handleErrorLog(err)));
        return planPricingEndPoint$;
    }

    /**
     * Handles error logging, emits an event
     * Event captured within riders component
     * @param errorResp - error log from API resp
     */
    handleErrorLog(errorResp): ObservableInput<any> {
        if (errorResp.status === ClientErrorResponseCode.RESP_400 && errorResp.error.message === this.SALARY_REQUIRED) {
            this.displayError = true;
            this.handleError.emit(errorResp);
        }
        return errorResp;
    }
    /**
     * gets base benefit amount for additional unit riders
     */
    getAdditionalUnitBenefitAmount(): number {
        let benefitAmount: number;
        const allPlans: GetPlan[] = this.store.selectSnapshot(EnrollmentState.GetAllPlans);
        const additionalPlanOrStackablePlan: GetPlan = allPlans.find(
            (plan) =>
                !!(
                    plan.id === this.planObject.basePlanId &&
                    (plan.characteristics?.includes(Characteristics.SUPPLEMENTARY) ||
                        plan.characteristics?.includes(Characteristics.STACKABLE))
                ),
        );

        if (additionalPlanOrStackablePlan) {
            if (this.riderCartData.baseRiderId === this.planObject.basePlanId) {
                benefitAmount = this.cartData.benefitAmount;
            } else {
                const baseEnrollment: Enrollments = this.store
                    .selectSnapshot(EnrollmentState.GetEnrollments)
                    .find(
                        (enrollment) =>
                            !!(
                                enrollment.plan &&
                                enrollment.plan.dependentPlanIds &&
                                enrollment.plan.dependentPlanIds.includes(this.planObject.basePlanId)
                            ),
                    );
                if (baseEnrollment) {
                    const riderEnrollment: EnrollmentRider = baseEnrollment.riders.find(
                        (enrollment) =>
                            enrollment.benefitAmount && enrollment.plan && enrollment.plan.id === this.riderCartData.baseRiderId,
                    );
                    if (riderEnrollment) {
                        benefitAmount = riderEnrollment.benefitAmount;
                    }
                }
            }
        }
        return benefitAmount;
    }
    getAncillaryInformation(): Observable<GetAncillary> {
        return this.shopingCartService.getAncillaryInformation(this.memberId, this.cartData.id, this.mpGroup, this.planId).pipe(
            tap((ancillaryInformation) => {
                this.appFlowService.patchConstraint(this.planObject.application.appData.id, "", ancillaryInformation);
                this.ancillaryInformation = ancillaryInformation;
                if (
                    this.planObject.currentSection.steps[0].step[0].retainCurrentAmount &&
                    ancillaryInformation.conversion &&
                    !ancillaryInformation.downgrade &&
                    !ancillaryInformation.downgradeByBenefitEligible &&
                    !this.planObject.rider
                ) {
                    this.isRetainCurrentAmount = true;
                    this.isRetain = true;
                    this.retainCurrentAmount(this.isRetain);
                } else {
                    this.isRetainCurrentAmount = false;
                    this.isRetain = false;
                    this.retainCurrentAmount(this.isRetain);
                }
                this.updateRetainRiders(ancillaryInformation);
                this.loadBenefitAmountValues(ancillaryInformation);
            }),
        );
    }
    /**
     * loads valid benefit amount values based on ancillary information
     * @param ancillaryInformation ancillary information
     */
    loadBenefitAmountValues(ancillaryInformation: GetAncillary): void {
        const benefitAmountControl = this.coverageLevelForm.controls[COVERAGE_PRICE];
        if (benefitAmountControl && ancillaryInformation) {
            if (ancillaryInformation.benefitAmountOptions && ancillaryInformation.benefitAmountOptions.length) {
                this.benefitAmountOptions = this.priceOptions.filter((priceOption) =>
                    ancillaryInformation.benefitAmountOptions.includes(priceOption.value),
                );
            } else {
                this.benefitAmountOptions = this.priceOptions;
            }
            this.benefitAmountOptions = this.benefitAmountOptions.slice().sort((first, next) => first.value - next.value);
            this.setBenefitAmount(benefitAmountControl);
            if (
                ancillaryInformation.currentBenefitAmount &&
                this.benefitAmountOptions &&
                this.benefitAmountOptions.length &&
                this.benefitAmountOptions.map((option) => option.value).includes(ancillaryInformation.currentBenefitAmount) &&
                (ancillaryInformation.downgrade || ancillaryInformation.conversion)
            ) {
                if (this.retainRiders.indexOf(this.coverageLevelForm.controls.coverageLevel.value) >= 0) {
                    this.coverageLevelForm.controls.coveragePrice.setValue(ancillaryInformation.currentBenefitAmount);
                    this.coverageLevelForm.controls.coveragePrice.disable();
                } else if (ancillaryInformation.downgrade) {
                    if (ancillaryInformation.downgradeByBenefitEligible) {
                        this.benefitAmountOptions = this.benefitAmountOptions.filter(
                            (option) => option.value < ancillaryInformation.currentBenefitAmount,
                        );
                    } else {
                        this.benefitAmountOptions = this.benefitAmountOptions.filter(
                            (option) => option.value <= ancillaryInformation.currentBenefitAmount,
                        );
                    }
                    this.setBenefitAmount(benefitAmountControl);
                }
            }
        }
        if (this.planObject.application.isAdditionalUnit && this.coverageLevelForm.controls[COVERAGE_PRICE]) {
            this.coverageLevelForm.controls[COVERAGE_PRICE].disable();
        }
        if (
            this.isRetainCurrentAmount &&
            this.retainCurrentAmountForm.controls.retainCurrentAmount.value &&
            this.coverageLevelForm.controls.coveragePrice
        ) {
            this.coverageLevelForm.controls.coveragePrice.setValue(ancillaryInformation.currentBenefitAmount);
        }
    }

    setBenefitAmount(benefitAmountControl: AbstractControl): void {
        if (this.benefitAmountOptions && !this.benefitAmountOptions.map((option) => option.value).includes(benefitAmountControl.value)) {
            // If amount is already set but benefitAmountOptions does not contain it,
            // set form control value to the lowest benefitAmountOption
            this.coverageLevelForm.controls[COVERAGE_PRICE].setValue(this.getLowestBenefitAmount(this.benefitAmountOptions));
        }
    }
    /**
     * Method to calculate the price for the displaying in the pricing table
     */
    calculatePriceForDisplay(): void {
        let riderCost = 0;
        let basePlanCost = 0;
        if (this.planObject.rider) {
            const filteredRiders = this.cartData.riders.filter((riders) => riders.planOfferingId !== this.riderCartData.planOfferingId);
            if (filteredRiders.length > 0) {
                filteredRiders.forEach((rider) => {
                    riderCost += rider.totalCost;
                });
            }
            riderCost += this.GetPlanPrice().totalCost;
            basePlanCost = this.cartData.memberCost;
        } else {
            basePlanCost = this.GetPlanPrice().memberCost;
            if (this.cartData.riders.length > 0) {
                this.cartData.riders.forEach((rider) => {
                    riderCost += rider.totalCost;
                });
            }
        }
        if (!this.planObject.reinstate) {
            this.appFlowService.updateCost$.next(basePlanCost + riderCost);
        }
    }
    // this function is to get the benefit amount to be pre populated based on base plan/ rider coverage level
    getBenefitAmountToPrePopulate(): number {
        const coverageLevelIdToCompare = this.coverageLevelForm.controls[COVERAGE_LEVEL].value;
        const lowestBenefitAmount = this.getLowestBenefitAmount(this.priceOptions);
        return this.planObject.rider
            ? this.riderCartData.coverageLevelId === coverageLevelIdToCompare && this.riderCartData.benefitAmount
                ? this.riderCartData.benefitAmount
                : lowestBenefitAmount
            : this.cartData.coverageLevelId === coverageLevelIdToCompare && this.cartData.benefitAmount
                ? this.cartData.benefitAmount
                : lowestBenefitAmount;
    }
    populateBenefitAmountValues(priceOptions: PlanOfferingPricing[]): void {
        this.priceOptions = [];
        priceOptions.forEach((price) => {
            if (price && price.benefitAmount) {
                this.priceOptions.push({
                    value: price.benefitAmount,
                    viewValue: price.benefitAmount,
                });
            }
        });
    }
    /**
     * get plan offering observables for prices calculation
     * @returns observables of plan offering pricing
     */
    getPlanOfferingPricesForCalculation(): Observable<PlanOfferingPricing[][]> {
        if (!this.planObject.rider) {
            if (this.planObject.application.isAdditionalUnit) {
                this.appFlowService.setRetainRiderVal(true);
            } else {
                this.appFlowService.setRetainRiderVal(false);
            }
        }
        return combineLatest(this.getPlanPricingObservables()).pipe(
            takeUntil(this.unsubscribe$),
            take(1),
            tap(
                (prices) => {
                    this.priceOptions = [];
                    this.tobaccoPlanOfferingPrices = prices[0];
                    this.nonTobaccoPlanOfferingPrices = prices[1];
                    this.populateBenefitAmountValues(prices[0]);
                    this.policyFeeRiderIds?.forEach((id) => {
                        if (this.planId === Number(id) && !prices[0].length) {
                            this.enableEnrolledButton = false;
                            this.disableNewRider = true;
                        }
                    });
                    this.initializeForm();
                },
                (error) => {
                    this.initializeForm();
                },
            ),
        );
    }
    /**
     * Select or Deselect the Retain current amount checkbox and
     * set the coverage level and benefit amount
     * @param isChecked {boolean} value for checkbox
     * @memberof PlanOptionsComponent
     */
    retainCurrentAmount(isChecked: boolean): void {
        if (
            this.coverageLevelOptions &&
            this.coverageLevelOptions.length &&
            this.coverageLevelOptions.some((x) => x.value === this.ancillaryInformation.currentCoverageLevelId) &&
            this.ancillaryInformation.retainCoverageAmountEligible &&
            (this.ancillaryInformation.currentBenefitAmount || !this.coverageLevelForm.controls.coveragePrice)
        ) {
            this.disableRetainCurrentAmount = false;
            this.retainCurrentAmountForm.controls.retainCurrentAmount.setValue(isChecked);
            if (this.isRetainCurrentAmount) {
                if (isChecked) {
                    if (this.coverageLevelForm.controls.coveragePrice) {
                        this.coverageLevelForm.controls.coveragePrice.setValue(this.ancillaryInformation.currentBenefitAmount);
                        this.coverageLevelForm.controls.coveragePrice.disable();
                    }
                    if (this.coverageLevelForm.controls[COVERAGE_LEVEL]) {
                        this.coverageLevelForm.controls[COVERAGE_LEVEL].setValue(this.ancillaryInformation.currentCoverageLevelId);
                        this.coverageLevelForm.controls[COVERAGE_LEVEL].disable();
                    }
                } else {
                    this.enableCoverageLevel();
                }
            }
        } else {
            this.disableRetainCurrentAmount = true;
            this.retainCurrentAmountForm.controls.retainCurrentAmount.setValue(false);
            this.enableCoverageLevel();
        }
    }

    /**
     * When retainCurrentAmount is not checked, enable coverage level and benefit amount form controls
     */
    enableCoverageLevel(): void {
        if (this.coverageLevelForm.controls.coveragePrice) {
            this.coverageLevelForm.controls.coveragePrice.enable();
        }
        if (this.coverageLevelForm.controls.coverageLevel && !this.planObject.reinstate) {
            this.coverageLevelForm.controls.coverageLevel.enable();
        }
    }

    /**
     * Function to return whether rider is enrolled in base plan for supplementary plan
     * @param baseEnrollment {Enrollments}
     * @returns boolean
     */
    isRiderEnrolledInBasePlan(baseEnrollment: Enrollments): boolean {
        return (
            this.planObject.rider && baseEnrollment?.riders?.some((rider) => rider?.plan.id === this.planObject?.application?.baseRiderId)
        );
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
