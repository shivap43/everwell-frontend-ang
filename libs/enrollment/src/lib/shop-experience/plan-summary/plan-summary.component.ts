import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy } from "@angular/core";
import {
    EnrollmentStatus,
    MemberService,
    AccountService,
    LanguageModel,
    ShoppingCartDisplayService,
    StaticService,
    AdminService,
    MemberQLETypes,
    ThirdPartyPlatforms,
} from "@empowered/api";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { PayrollFrequencyCalculatorPipe, PlanDetailsComponent } from "@empowered/ui";
import { Store, Select } from "@ngxs/store";
import {
    EnrollmentState,
    ShopCartService,
    SetErrorForShop,
    SharedState,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
} from "@empowered/ngxs-store";
import { Observable, Subject, Subscription, combineLatest } from "rxjs";
import { LanguageService, LanguageState } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { ReinstateDialogComponent } from "../../application-flow-steps/reinstate-dialog/reinstate-dialog.component";
import { VoidCoverageComponent } from "../../benefit-summary/edit-coverage/void-coverage/void-coverage.component";
import { EndCoverageComponent } from "../../benefit-summary/end-coverage/end-coverage.component";
import {
    Permission,
    ProductId,
    CarrierId,
    TPI,
    ConfigName,
    DateFormats,
    PayFrequency,
    EnrollmentStateModel,
    Frequency,
    TpiSSOModel,
    BeneficiaryType,
    PayFrequencyObject,
    EnrollmentConstants,
    AppSettings,
    CoverageLevelNames,
    EnrollmentMethod,
    Characteristics,
    AddCartItem,
    ProductType,
    TaxStatus,
    PolicyOwnershipType,
    GetCartItems,
    MemberBeneficiary,
    Enrollments,
    MemberDependent,
    PlanFlexDollarOrIncentives,
    EnrollmentInformation,
    PlanOfferingPanel,
    Accounts,
    StatusType,
    ProductOfferingPanel,
    MemberQualifyingEvent,
} from "@empowered/constants";
import { Router } from "@angular/router";
import { TPIState } from "@empowered/ngxs-store";
import { map, takeUntil } from "rxjs/operators";
import { DateService } from "@empowered/date";
import { EmpoweredModalService, TpiServices } from "@empowered/common-services";

const DATE_DAY_POSITION = 2;
const DATE_MONTH_POSITION = 1;
const DATE_YEAR_POSITION = 0;
const IS_TPI_END_COVERAGE = "true";
const POSTTAX_LANG = "primary.portal.quoteShop.postTax";
const PRETAX_LANG = "primary.portal.quoteShop.preTax";
const TWO = 2;

@Component({
    selector: "empowered-plan-summary",
    templateUrl: "./plan-summary.component.html",
    styleUrls: ["./plan-summary.component.scss"],
})
export class PlanSummaryComponent implements OnInit, OnChanges, OnDestroy {
    @Input() product: ProductOfferingPanel;
    @Input() planOffering: PlanOfferingPanel;
    @Output() editPlanEvent = new EventEmitter();
    @Output() updateAmountEvent = new EventEmitter();
    @Input() payFrequencyObject: PayFrequencyObject;
    @Input() isWageWorksCompanyProvided: boolean;
    // Language
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];

    // Store
    payFrequency: PayFrequency;
    mpGroup: number;
    memberId: number;
    memberName: string;
    memberDependents: MemberDependent[];
    memberBeneficiaries: MemberBeneficiary[];
    enrollmentMethod: EnrollmentMethod;
    enrollmentState: string;
    isOpenEnrollment: boolean;
    isQLEPeriod: boolean;
    enrollmentInfo: EnrollmentInformation;
    cartItem: GetCartItems;
    enrollment: Enrollments;
    planFlexDollars: PlanFlexDollarOrIncentives[] = [];
    isBenefitDollarConfigEnabled = false;
    flexCost = 0;
    expiryDate: any;
    todayDate = new Date();
    isHsaFsa: boolean;
    accPayFrequencyId;
    status = {
        companyProvided: "COMPANY_PROVIDED",
        inCart: "IN_CART",
        approved: EnrollmentStatus.approved,
        lapsed: EnrollmentStatus.lapsed,
    };
    isLoading: boolean;
    ACTIVE = "ACTIVE";
    IS_VOID = "Void";
    CANCELLED = "CANCELLED";
    isEndCoverage = false;
    isVoidCoverage = false;
    currentDate = new Date();
    isTPI = this.router.url.includes(TPI.TPI);
    planSummary: {
        name: string;
        planOfferingId: number;
        planId: number;
        totalCost: number;
        baseCost?: number;
        adjustments?: number;
        coverage?: string;
        benefitAmount: number;
        eliminationPeriod?: string;
        rider?: Array<string>;
        taxStatus: string;
        coveredIndividuals: Array<string>;
        beneficiaries?: Array<string>;
        coverageDate?: string;
        coverageEndDate?: string;
        status: string;
        contributions?: number;
        contributionYear?: string;
        planType?: string;
        isReinstate?: boolean;
        isCoverageLevelNameMatch?: boolean;
        childAge?: number;
        companyProvided?: boolean;
    };
    enrollmentDetails: EnrollmentStateModel;
    tpiEndCoverageEnable$: Observable<boolean>;
    UserPermissions = Permission;
    DECLINED_ID = 2;
    readonly NEW_YORK_ABBR = "NY";
    readonly OHIO_ABBR = "OH";

    @Select(EnrollmentState.GetPayFrequency) payFrequency$: Observable<PayFrequency>;
    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetMemberName) memberName$: Observable<string>;
    @Select(EnrollmentState.GetMemberDependents) memberDependents$: Observable<MemberDependent[]>;
    @Select(EnrollmentState.GetMemberBeneficiaries) memberBeneficiaries$: Observable<MemberBeneficiary[]>;
    @Select(EnrollmentState.GetEnrollmentMethod) enrollmentMethod$: Observable<EnrollmentMethod>;
    @Select(EnrollmentState.GetEnrollmentState) enrollmentState$: Observable<string>;
    @Select(EnrollmentState.GetIsOpenEnrollment) isOpenEnrollment$: Observable<boolean>;
    @Select(EnrollmentState.GetIsQLEPeriod) isQLEPeriod$: Observable<boolean>;
    @Select(EnrollmentState.GetEnrollmentInfo) enrollmentInfo$: Observable<EnrollmentInformation>;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.reinstate",
        "primary.portal.planDetails.title",
        "primary.portal.shoppingExperience.endCoverage",
        "primary.portal.editCoverage.voidCoverage",
        "primary.portal.endCoverage.endCoverage",
        "primary.portal.benefitOffering.contribution",
        "primary.portal.shoppingExperience.adjustments",
        "primary.portal.shoppingExperience.yourCost",
        "primary.portal.applicationFlow.estimatedCost",
        "primary.portal.expandedShoppingCart.employerContribution",
        "primary.portal.members.dependentList.ageColumn",
        "primary.portal.shoppingExperience.zero",
        "primary.portal.endCoverage.noAdminTooltip",
        "primary.portal.coverage.estate",
        "primary.portal.coverage.charity",
        PRETAX_LANG,
        POSTTAX_LANG,
    ]);
    isJuvenilePlan = false;
    benefitDollars: PlanFlexDollarOrIncentives;
    tpiSSODetail: TpiSSOModel;
    hasAdmin: boolean;
    readonly PRETAX = TaxStatus.PRETAX;
    displayReinstateButton: boolean;
    dependentAge: number;
    currentQualifyingEvents: MemberQualifyingEvent[];
    private unsubscribe$ = new Subject<void>();
    isTpiEndCoverageAllowed = false;

    constructor(
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly shopCartService: ShopCartService,
        private readonly memberService: MemberService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly shopDisplayService: ShoppingCartDisplayService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly staticService: StaticService,
        private readonly adminService: AdminService,
        private readonly utilService: UtilService,
        private readonly payrollFrequencyPipe: PayrollFrequencyCalculatorPipe,
        private readonly dateService: DateService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly tpiService: TpiServices,
    ) {
        this.payFrequency$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.payFrequency = x));
        this.mpGroup$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.mpGroup = x));
        this.memberId$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.memberId = x));
        this.memberName$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.memberName = x));
        this.memberDependents$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.memberDependents = x ? x : []));
        this.memberBeneficiaries$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.memberBeneficiaries = x ? x : []));
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.enrollmentMethod$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.enrollmentMethod = x));
        this.isOpenEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isOpenEnrollment = x));
        this.isQLEPeriod$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isQLEPeriod = x));
        this.enrollmentInfo$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.enrollmentInfo = x));
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isBenefitDollarConfigEnabled = result;
            });
    }

    /**
     * Initializes the component.
     * sets required configurations.
     * sets enrollment details
     * @memberof PlanSummaryComponent
     */
    ngOnInit(): void {
        this.tpiSSODetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.currentQualifyingEvents = this.store.selectSnapshot(EnrollmentState.GetQLEResponse);
        if (this.isTPI) {
            this.tpiEndCoverageEnable$ = this.staticService
                .getConfigurations(ConfigName.TPI_END_COVERAGE_ENABLE, this.tpiSSODetail.user.groupId)
                .pipe(map((custom) => custom[0].value.toLowerCase() === IS_TPI_END_COVERAGE));
        }
        this.enrollmentDetails = this.store.selectSnapshot(EnrollmentState);
        this.isLoading = false;
        this.enrollmentState$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.enrollmentState = x));
        if (this.enrollment) {
            this.checkEndCoverage();
            this.isVoid();
            if (
                this.isBenefitDollarConfigEnabled &&
                this.enrollmentInfo &&
                this.enrollmentInfo.flexDollarOrIncentivesApplied &&
                this.enrollmentInfo.flexDollarOrIncentivesApplied.planFlexDollarOrIncentives.length &&
                this.enrollmentState !== this.NEW_YORK_ABBR &&
                this.enrollmentState !== this.OHIO_ABBR
            ) {
                this.planFlexDollars = this.enrollmentInfo.flexDollarOrIncentivesApplied.planFlexDollarOrIncentives.filter(
                    (flexDollar) => flexDollar.enrollmentId === this.enrollment.id,
                );
                this.benefitDollars = this.enrollmentInfo.flexDollarOrIncentivesApplied.planFlexDollarOrIncentives.find(
                    (planFlexDollar) =>
                        planFlexDollar.planId === this.enrollment.plan.id && planFlexDollar.enrollmentId === this.enrollment.id,
                );
                this.flexCost = 0;
                if (this.planFlexDollars.length) {
                    this.flexCost = this.planFlexDollars.reduce((total, current) => total + current.flexDollarOrIncentiveAmount, 0);
                }
            }
            this.getPayFrequencies();
        }
        // check for admins in the account
        this.adminService
            .getAccountAdmins(this.mpGroup, "roleId,reportsToId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.hasAdmin = Boolean(response.length);
            });

        // logic to fetch value memberEnrollmentCancellationAllowed if it is tpi
        this.tpiService
            .isMemberCancellationAllowed(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isMemberCancellationAllowed) => (this.isTpiEndCoverageAllowed = isMemberCancellationAllowed));
    }
    /**
     * This method is used to get payFrequencies
     * This method will check length of payFrequencies in @var payFrequencyObject which was inputted
     * If it does not have payFrequency values, then an API will be called to fetch payFrequencies
     */
    getPayFrequencies(): void {
        if (this.payFrequencyObject.payFrequencies.length) {
            this.updatePlanAmount();
        } else {
            this.isLoading = true;
            this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
            combineLatest([
                this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
                this.accountService.getPayFrequencies(this.mpGroup.toString()),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    ([member, payFrequencies]) => {
                        this.accPayFrequencyId = member.body.workInformation.payrollFrequencyId;
                        this.payFrequencyObject.payFrequencies = [...payFrequencies];
                        this.payFrequency = payFrequencies.find(
                            (frequency) => frequency.id.toString() === this.accPayFrequencyId.toString(),
                        );
                        this.payFrequencyObject.pfType = this.payFrequency.name;
                        const monthlyPayFrequency: PayFrequency = payFrequencies.find(
                            (ele) => ele.frequencyType === Frequency.MONTHLY.toUpperCase(),
                        );
                        this.payFrequencyObject.payrollsPerYear = monthlyPayFrequency.payrollsPerYear;
                        this.updatePlanAmount();
                        this.isLoading = false;
                    },
                    (error) => {
                        if (error.error) {
                            this.store.dispatch(new SetErrorForShop(error.error));
                        }
                        this.updatePlanAmount();
                        this.isLoading = false;
                    },
                );
        }
    }

    /**
     * This method is used update plan amount in product details component by emitting an event
     */
    updatePlanAmount(): void {
        const cost: number = this.cartItem ? this.planSummary.totalCost + this.flexCost : this.planSummary.totalCost;
        this.updateAmountEvent.emit({
            cost: cost,
        });
    }
    /**
     * This method checks if a particular enrollment is eligible for end coverage
     * @returns void
     */
    checkEndCoverage(): void {
        const coverageStartDate = this.dateService.toDate(this.enrollment.validity.effectiveStarting).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        const isByRequestQLE = this.currentQualifyingEvents?.some(
            (qle) => qle.id === this.enrollment.qualifyingEventId && qle.type?.description === MemberQLETypes.BY_REQUEST,
        );
        if (this.enrollment.plan.carrierId === CarrierId.AFLAC_GROUP) {
            this.isEndCoverage = !this.isOpenEnrollment || this.dateService.toDate(coverageStartDate) <= this.dateService.toDate(today);
        } else {
            this.isEndCoverage =
                (this.enrollment.status === EnrollmentStatus.approved.toUpperCase() ||
                    this.enrollment.status.toUpperCase() === this.ACTIVE) &&
                this.enrollment.plan.carrierId === CarrierId.AFLAC &&
                this.enrollment.carrierStatus === this.ACTIVE &&
                !isByRequestQLE &&
                this.dateService.toDate(coverageStartDate) <= this.dateService.toDate(today);
        }
    }
    /**
     * This method checks if enrollment is void
     * @returns void
     */
    isVoid(): void {
        this.isVoidCoverage =
            this.enrollment.feedSentDate === undefined &&
            this.enrollment.carrierStatus === undefined &&
            this.enrollment.status !== this.IS_VOID &&
            this.enrollment.status !== this.CANCELLED &&
            this.enrollment.status !== EnrollmentStatus.ended.toUpperCase();
        if (
            this.enrollment.plan.characteristics &&
            (this.enrollment.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                this.enrollment.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                this.enrollment.plan.characteristics.includes(Characteristics.DECLINE))
        ) {
            this.isVoidCoverage = false;
        }
        // If plan is in cart then plan can't be withdrawn
        if (this.planOffering.cartItem) {
            this.isVoidCoverage = false;
        }
    }
    /**
     * This method opens void coverage dialog
     * @returns void
     */
    showVoidCoveragePopup(): void {
        this.empoweredModalService.openDialog(VoidCoverageComponent, {
            data: {
                planName: this.enrollment.plan.name,
                mpGroup: this.mpGroup,
                memberId: this.memberId,
                enrollId: this.enrollment.id,
                isShop: true,
                productId: this.product.id,
            },
        });
    }
    /** *
     * This method is called to open End Coverage popup
     * @returns void
     */
    openEndCoveragePopup(): void {
        this.empoweredModalService.openDialog(EndCoverageComponent, {
            data: {
                memberId: this.memberId,
                employeeName: this.memberName,
                mpGroup: this.mpGroup,
                enrollmentId: this.enrollment.id,
                enrollmentTaxStatus: this.enrollment.taxStatus,
                coverageStartDate: this.enrollment.validity.effectiveStarting,
                expiresAfter: this.enrollment.validity.expiresAfter,
                planName: this.enrollment.plan.name,
                isShop: true,
                productId: this.product?.id,
                isArgus: this.enrollment.plan.carrierId === CarrierId.ADV,
            },
        });
    }
    /**
     * Angular Life-cycle hook ngOnChanges
     * Detect changes passed to the component as input
     */
    ngOnChanges(): void {
        if (this.planOffering) {
            this.isJuvenilePlan = !!(
                this.product.product.id === ProductId.JUVENILE_TERM_LIFE || this.product.product.id === ProductId.JUVENILE_WHOLE_LIFE
            );
            this.isHsaFsa = this.product.productType === ProductType.HSA || this.product.productType === ProductType.FSA;
            this.cartItem = this.planOffering.cartItem;
            this.enrollment = this.planOffering.enrollment;
            this.resetPlanSummary();
            if (this.cartItem) {
                this.setPlanFromCartItem();
                if (this.isBenefitDollarConfigEnabled) {
                    this.getPlanFlexDollars();
                }
            } else if (this.enrollment) {
                this.setPlanFromEnrollment();
            }
        }
    }

    /**
     * get plan flex dollar details of the cart item
     */
    getPlanFlexDollars(): void {
        this.shopDisplayService
            .getAppliedFlexDollarOrIncentivesForCart(this.memberId, this.mpGroup.toString(), this.cartItem.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (
                    response &&
                    response.planFlexDollarOrIncentives &&
                    response.planFlexDollarOrIncentives.length &&
                    this.enrollmentState !== this.NEW_YORK_ABBR &&
                    this.enrollmentState !== this.OHIO_ABBR
                ) {
                    this.planFlexDollars = response.planFlexDollarOrIncentives;
                    this.flexCost = 0;
                    this.planFlexDollars.forEach((flex) => {
                        this.flexCost += flex.flexDollarOrIncentiveAmount;
                    });
                    this.updateAmountEvent.emit({
                        cost: this.planSummary.totalCost + this.flexCost,
                    });
                }
            });
    }
    /**
     * Set details for plan in cart
     */
    setPlanFromCartItem(): void {
        this.planSummary = {
            name: this.planOffering.plan.name,
            planId: this.planOffering.plan.id,
            planOfferingId: this.cartItem.planOfferingId,
            totalCost: this.cartItem.memberCost,
            baseCost: null,
            adjustments: null,
            benefitAmount: this.cartItem.benefitAmount,
            coveredIndividuals: this.getCoveredIndividuals(),
            coverageDate: this.convertDate(
                this.cartItem.coverageEffectiveDate
                    ? this.cartItem.coverageEffectiveDate
                    : this.cartItem.coverageValidity.effectiveStarting,
            ),
            taxStatus: this.getTaxStatus(this.planOffering.taxStatus),
            status: this.product.companyProvided || this.isWageWorksCompanyProvided ? this.status.companyProvided : this.status.inCart,
            beneficiaries: this.getBeneficiaries(),
            childAge: this.cartItem.dependentAge,
        };
        if (this.planOffering.selectedCoverage) {
            this.planSummary.coverage = this.planOffering.selectedCoverage.name;
            if (this.planSummary.coverage) {
                this.planSummary.isCoverageLevelNameMatch = this.isDependentCovered(this.planSummary.coverage);
            }
            this.planSummary.eliminationPeriod = this.planOffering.selectedCoverage.eliminationPeriod;
        }
        if (this.planOffering.selectedPricing) {
            let adjustmentAmount =
                !this.benefitDollars || !this.isBenefitDollarConfigEnabled
                    ? 0.0
                    : this.planOffering.selectedPricing.totalCost - this.planOffering.selectedPricing.memberCost;
            this.planSummary.baseCost += this.planOffering.selectedPricing.memberCost;
            if ([CarrierId.ADV, CarrierId.AFLAC_GROUP, CarrierId.ARGUS].includes(this.planOffering.plan.carrier.id)) {
                adjustmentAmount = this.planOffering.selectedPricing.totalCost - this.planOffering.selectedPricing.memberCost;
                this.planSummary.baseCost = this.planOffering.selectedPricing.totalCost;
            }
            this.planSummary.adjustments += adjustmentAmount;
        }
        if (this.cartItem.coverageValidity.expiresAfter) {
            this.planSummary.coverageEndDate = this.convertDate(this.cartItem.coverageValidity.expiresAfter);
        }
        if (this.cartItem.riders && this.cartItem.riders.length) {
            const riderCost = this.cartItem.riders.map((x) => x.totalCost).reduce((a, b) => a + b);
            this.planSummary.totalCost += riderCost;
            this.planSummary.baseCost += riderCost;
            this.planSummary.rider = this.planOffering.ridersData ? this.getCartRidersArray() : [];
        }
        if (this.isHsaFsa) {
            this.planSummary.contributions = this.getContributionAmount(this.cartItem.totalCost);
            this.planSummary.contributionYear = this.cartItem.coverageValidity.effectiveStarting.slice(0, 4);
            this.planSummary.coverage = this.planOffering.hsaFsaCoverage;
            if (this.planSummary.coverage) {
                this.planSummary.isCoverageLevelNameMatch = this.isDependentCovered(this.planSummary.coverage);
            }
        }
    }

    /**
     * Method to get enrolled dependent
     * @returns Member dependent
     */
    getEnrolledDependent(): MemberDependent {
        let dependent: MemberDependent;
        if (this.enrollment && this.enrollment.enrolledDependents && this.enrollment.enrolledDependents.length) {
            dependent = this.memberDependents.find((member) => member.id === this.enrollment.enrolledDependents[0].dependentId);
        }
        return dependent;
    }

    /**
     * Set details for enrolled plan
     */
    setPlanFromEnrollment(): void {
        let enrollmentStatus: string;
        const dependent = this.getEnrolledDependent();
        if (this.planOffering.enrollmentStatus) {
            enrollmentStatus = this.planOffering.enrollmentStatus;
        } else if (this.planOffering.enrollment && this.planOffering.enrollment.status) {
            enrollmentStatus = this.planOffering.enrollment.status;
        }
        const adjustmentAmount = this.enrollment.totalCostPerPayPeriod - this.enrollment.memberCostPerPayPeriod;
        this.planSummary = {
            name: this.enrollment.plan.name,
            planId: this.enrollment.plan.id,
            planOfferingId: this.planOffering.id,
            totalCost: this.enrollment.totalCostPerPayPeriod,
            baseCost: this.enrollment.totalCostPerPayPeriod,
            adjustments: adjustmentAmount,
            benefitAmount: this.enrollment.benefitAmount,
            coverageDate: this.convertDate(this.enrollment.validity.effectiveStarting),
            taxStatus: this.getTaxStatus(this.enrollment.taxStatus),
            status: enrollmentStatus,
            coveredIndividuals: this.getCoveredIndividuals(),
            beneficiaries: this.getBeneficiaries(),
            isReinstate: Boolean(this.enrollment.reinstatement),
            childAge: dependent && dependent.birthDate ? this.getDependentAge(dependent.birthDate) : null,
            companyProvided: this.enrollment.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED),
        };
        const todayDate = this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY);
        this.displayReinstateButton =
            this.enrollment.reinstatementPeriodEndDate < todayDate && this.enrollment.reinstatementEndDate < todayDate;
        this.planSummary.rider = this.getEnrollmentRidersArray();
        this.planSummary.adjustments = this.planSummary.adjustments ?? 0;
        if (this.enrollment.coverageLevel) {
            this.planSummary.coverage = this.enrollment.coverageLevel.name;
            if (this.planSummary.coverage) {
                this.planSummary.isCoverageLevelNameMatch = this.isDependentCovered(this.planSummary.coverage);
            }
            this.planSummary.eliminationPeriod = this.enrollment.coverageLevel.eliminationPeriod;
        }
        if (this.enrollment.validity.expiresAfter) {
            this.planSummary.coverageEndDate = this.convertDate(this.enrollment.validity.expiresAfter);
        }
        this.expiryDate =
            this.enrollment && this.enrollment.validity.expiresAfter !== undefined
                ? this.convertDate(this.enrollment.validity.expiresAfter)
                : this.convertDate(this.todayDate);
    }

    /**
     * Method to get the tax text that needs to be displayed in the UI for each of the tax status
     *  @param tax TaxStatus of the plan
     *  @returns taxText that is used to display in the front end
     */
    getTaxStatus(tax: TaxStatus | string): string {
        let taxStatus = "";
        if (tax === TaxStatus.POSTTAX) {
            taxStatus = this.languageStrings[POSTTAX_LANG];
        }
        if (tax === TaxStatus.PRETAX) {
            taxStatus = this.languageStrings[PRETAX_LANG];
        }
        if (tax === TaxStatus.VARIABLE) {
            taxStatus = this.isOpenEnrollment || this.isQLEPeriod ? this.languageStrings[PRETAX_LANG] : this.languageStrings[POSTTAX_LANG];
        }
        return taxStatus;
    }

    getCartRidersArray(): string[] {
        const riders = [];
        if (this.cartItem.riders && this.cartItem.riders.length) {
            this.cartItem.riders.forEach((cartRider) => {
                const idx = this.planOffering.ridersData.findIndex(
                    (x) => x.plan.id === cartRider.planId && cartRider.coverageLevelId !== this.DECLINED_ID,
                );
                if (idx > -1) {
                    let temp = this.planOffering.ridersData[idx].plan.name;
                    if (cartRider.benefitAmount) {
                        temp += " with $" + cartRider.benefitAmount + " Benefit Amount";
                    }
                    riders.push(temp);
                }
            });
        }
        return riders;
    }

    /**
     * Function to get Enrollment Rider details
     * @returns array of string with rider name and benefit amount {string[]}
     */
    getEnrollmentRidersArray(): string[] {
        const riders = [];
        if (this.enrollment.riders?.length) {
            this.enrollment.riders.forEach((eRider) => {
                let temp = eRider.plan.name;
                if (eRider.benefitAmount) {
                    temp += " with $" + eRider.benefitAmount + " Benefit Amount";
                }
                riders.push(temp);
                const eRiderTotalCostPerPayPeriod = Number(
                    this.payrollFrequencyPipe.transform(eRider.totalCost, this.payFrequencyObject).toFixed(TWO),
                );
                this.planSummary.totalCost += eRiderTotalCostPerPayPeriod;
                this.planSummary.baseCost += eRiderTotalCostPerPayPeriod;
                this.planSummary.adjustments += eRiderTotalCostPerPayPeriod - eRider.memberCostPerPayPeriod;
            });
        }
        return riders;
    }

    getContributionAmount(cost: number): number {
        let amount = cost;
        if (this.payFrequency) {
            amount = Math.round(amount * this.payFrequency.payrollsPerYear * 10000) / 10000;
        }
        return amount;
    }

    getCoveredIndividuals(): Array<string> {
        const array = [this.memberName];
        if (this.cartItem && this.memberDependents && this.memberDependents.length) {
            const isSpouse = EnrollmentConstants.coverageId.SPOUSE.some((x) => x.id === this.cartItem.coverageLevelId);
            const isSingleParentFamily = EnrollmentConstants.coverageId.ONE_PARENT_FAMILY.some(
                (x) => x.id === this.cartItem.coverageLevelId,
            );
            const isTwoParent = EnrollmentConstants.coverageId.TWO_PARENT_FAMILY.some((x) => x.id === this.cartItem.coverageLevelId);
            if (isSpouse) {
                this.memberDependents
                    .filter((x) => x.dependentRelationId === EnrollmentConstants.dependentRelation.SPOUSE)
                    .forEach((x) => array.push(`${x.name.firstName} ${x.name.lastName}`));
            } else if (isSingleParentFamily) {
                this.memberDependents
                    .filter((x) => x.dependentRelationId !== EnrollmentConstants.dependentRelation.SPOUSE)
                    .forEach((x) => array.push(`${x.name.firstName} ${x.name.lastName}`));
            } else if (isTwoParent) {
                this.memberDependents.forEach((x) => array.push(`${x.name.firstName} ${x.name.lastName}`));
            }
        } else if (this.enrollment && this.enrollment.enrolledDependents && this.enrollment.enrolledDependents.length) {
            this.enrollment.enrolledDependents.forEach((x) => array.push(x.name));
        }
        return array;
    }
    /**
     * This method is used to fetch beneficiaries, forms an array of string with those details and returns the same
     * @returns an array of string
     */
    getBeneficiaries(): Array<string> {
        const array = [];
        if (this.cartItem && this.memberBeneficiaries && this.memberBeneficiaries.length) {
            this.memberBeneficiaries.forEach((benef) => {
                if (benef.name && benef.allocations && benef.allocations.length) {
                    const idx = benef.allocations.findIndex((x) => x.product === this.product.product.name);
                    if (idx > -1) {
                        const str = `${this.getBeneficiaryName(benef)} - ${benef.allocations[idx].percent}%`;
                        array.push(str);
                    }
                }
            });
        } else if (this.enrollment && this.enrollment.beneficiaries && this.enrollment.beneficiaries.length) {
            this.enrollment.beneficiaries.forEach((x) => {
                if (x.beneficiary) {
                    let str = `${this.getBeneficiaryName(x.beneficiary)} (${x.allocationType.toLowerCase()})`;
                    if (x.percent) {
                        str += ` - ${x.percent}%`;
                    }
                    array.push(str);
                }
            });
        }
        return array;
    }
    /**
     * This method is used to beneficiary name based on data-type of beneficiary name
     * @param beneficiary contains beneficiary details and of type MemberBeneficiary
     * @returns beneficiary name
     */
    getBeneficiaryName(beneficiary: MemberBeneficiary): string {
        let beneficiaryName: string;
        switch (beneficiary.type) {
            case BeneficiaryType.TRUST.toUpperCase():
                beneficiaryName = `${beneficiary.trustee.firstName} ${beneficiary.trustee.lastName}`;
                break;
            case BeneficiaryType.ESTATE.toUpperCase():
                beneficiaryName = this.languageStrings["primary.portal.coverage.estate"];
                break;
            case BeneficiaryType.CHARITY.toUpperCase():
                beneficiaryName = this.languageStrings["primary.portal.coverage.charity"];
                break;
            case BeneficiaryType.INDIVIDUAL.toUpperCase():
                beneficiaryName = `${beneficiary.name.firstName} ${beneficiary.name.lastName}`;
                break;
        }
        return beneficiaryName;
    }

    resetPlanSummary(): void {
        this.planSummary = {
            name: "",
            planOfferingId: null,
            planId: null,
            totalCost: null,
            baseCost: null,
            adjustments: null,
            coverage: "",
            benefitAmount: null,
            eliminationPeriod: "",
            rider: [],
            taxStatus: "",
            coveredIndividuals: [],
            coverageDate: "",
            status: "",
            beneficiaries: [],
            contributions: null,
            contributionYear: "",
            planType: "",
        };
    }

    editPlan(): void {
        this.editPlanEvent.emit();
    }

    /**
     * This function will open pop up for plan detail
     */
    showPlanDetailsPopup(): void {
        const memberGroupAccount: Accounts = this.store.selectSnapshot(SharedState.getState).memberMPGroupAccount;
        this.dialog.open(PlanDetailsComponent, {
            data: {
                planId: this.planSummary.planId,
                planName: this.planSummary.name,
                states: [
                    {
                        abbreviation:
                            this.planOffering.plan.policyOwnershipType === PolicyOwnershipType.GROUP && memberGroupAccount
                                ? memberGroupAccount.situs.state.abbreviation
                                : this.enrollmentState,
                    },
                ],
                mpGroup: this.store.selectSnapshot(EnrollmentState.GetMPGroup),
                productId: this.product?.product.id,
                isCarrierOfADV: this.planOffering.plan.carrier.id === CarrierId.ADV,
                situsState: memberGroupAccount?.situs?.state?.abbreviation,
                referenceDate: this.dualPlanYearService.getReferenceDate(),
            },
        });
    }

    /**
     * Method to display edit button based on different conditions
     * @returns boolean value
     */
    displayEditButton(): boolean {
        if (this.planOffering?.agentAssistanceRequired) {
            return false;
        }
        if (this.planSummary.status === this.status.lapsed) {
            return false;
        }
        if (this.planSummary.status === this.status.inCart) {
            return true;
        }
        if (
            this.planSummary.status === this.status.companyProvided &&
            [ProductId.VISION, ProductId.DENTAL].includes(this.product.product.id)
        ) {
            return true;
        }
        if (this.planSummary.status === this.status.companyProvided || this.isWageWorksCompanyProvided) {
            return false;
        }
        if (
            ((this.planOffering.plan.enrollable &&
                this.planOffering.coverageLevel &&
                this.enrollment &&
                (this.enrollment.status === StatusType.APPROVED || this.enrollment.status === StatusType.PENDING) &&
                (this.enrollmentDetails.isOpenEnrollment ||
                    this.enrollmentDetails.isQLEPeriod ||
                    this.enrollment.taxStatus === TaxStatus.POSTTAX)) ||
                (this.isTPI && this.planOffering.plan.enrollable)) &&
            !this.planOffering.hideEditButton
        ) {
            return true;
        }

        return false;
    }

    close(element: any): any {
        element.closeAll();
    }
    /**
     * @description converts date to the MM/DD/YYYY format
     * @param date1 {string | Date} the date to convert
     * @returns {string} the converted date string
     */
    convertDate(date1: string | Date): string {
        let endDate = this.datepipe.transform(date1, AppSettings.DATE_FORMAT);
        const p = endDate.split(/\D/g);
        endDate = [p[DATE_MONTH_POSITION], p[DATE_DAY_POSITION], p[DATE_YEAR_POSITION]].join("/");

        return endDate;
    }

    /**
     * Get dependent's age as per the coverage effective date
     * @param birthDate dependent birth date
     * @returns dependent age in years
     */
    getDependentAge(birthDate: string): number {
        const coverageDate = this.convertDate(this.enrollment.validity.effectiveStarting);
        return this.dateService.getDifferenceInYears(
            this.dateService.toDate(birthDate),
            coverageDate ? this.dateService.toDate(coverageDate) : new Date(),
        );
    }

    openReinstate(): void {
        this.openDialog();
    }

    openDialog(): void {
        const enrollment: Enrollments = this.utilService.copy(this.enrollment);
        enrollment.planOfferingId = this.planOffering.id;
        if (enrollment.riders && enrollment.riders.length && this.planOffering.ridersData && this.planOffering.ridersData.length) {
            enrollment.riders.forEach((rider) => {
                const riderOfferingData: PlanOfferingPanel = this.planOffering.ridersData.find(
                    (riderData) => riderData.plan.id === rider.plan.id,
                );
                if (riderOfferingData) {
                    rider.planOfferingId = riderOfferingData.id;
                }
            });
        }
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.minWidth = "100%";
        dialogConfig.height = "100%";
        dialogConfig.panelClass = "add-beneficiary";
        dialogConfig.data = {
            planId: this.enrollment.plan.id,
            memberId: this.memberId,
            mpGroup: this.mpGroup,
            state: this.enrollmentState,
            enrollmentMethod: this.enrollmentMethod,
            planOfferingId: this.planOffering.id,
            cartData: this.cartItem,
            policyData: enrollment,
        };
        const dialogRef = this.dialog.open(ReinstateDialogComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response && response.completed) {
                    this.shopCartService.refreshAfterReinstate$.next(this.product.id);
                }
            });
    }
    /**
     * Method to get the addCartItem object for the plan being to added to the cart
     * @returns { AddCartItem}
     */
    getCartObject(): AddCartItem {
        const cartObject: AddCartItem = {
            planOfferingId: this.enrollment.planOfferingId,
            memberCost: this.enrollment.totalCost,
            totalCost: this.enrollment.totalCost,
            enrollmentMethod: this.enrollmentMethod,
            enrollmentState: this.enrollmentState,
        };
        if (this.enrollment && this.enrollment.coverageLevel) {
            cartObject.coverageLevelId = this.enrollment.coverageLevel.id;
        } else {
            cartObject.coverageLevelId = this.enrollment.coverageLevelId;
        }
        if (this.enrollment.benefitAmount) {
            cartObject.benefitAmount = this.enrollment.benefitAmount;
        }
        // TODO - Need to add logic for riders
        return cartObject;
    }

    /**
     * will check if dependent covered or not in enrolled plan
     * @param  coverageLevelName selected plan coverage level name
     * @return is dependent covered or not
     */
    isDependentCovered(coverageLevelName: string): boolean {
        return (
            coverageLevelName === CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE ||
            coverageLevelName === CoverageLevelNames.TWO_PARENT_FAMILY_COVERAGE ||
            coverageLevelName === CoverageLevelNames.NAME_INSURED_SPOUSE_ONLY_COVERAGE
        );
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
