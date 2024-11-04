import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, AfterViewChecked, OnDestroy } from "@angular/core";
import { CoreService, ShoppingService, ShoppingCartDisplayService, MemberService, AccountService, Juvenile } from "@empowered/api";
import { FormControl, Validators, FormBuilder } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { Observable, forkJoin, Subscription, of } from "rxjs";
import { EnrollmentState, SetErrorForShop, DualPlanYearState, UtilService } from "@empowered/ngxs-store";
import { LanguageModel } from "@empowered/api";
import { RiderSelectionComponent } from "./rider-selection/rider-selection.component";
import { LanguageService, LanguageState } from "@empowered/language";
import { FlexDollarPipe } from "@empowered/ui";
import { Router } from "@angular/router";
import {
    EnrollmentEnums,
    ProductId,
    DEPENDENT_AGE_OPTIONS,
    CarrierId,
    PayFrequency,
    PlanCoverageLevelRules,
    PayFrequencyObject,
    EnrollmentMethod,
    ProductType,
    CoverageLevel,
    PlanOffering,
    GetCartItems,
    Enrollments,
    PlanOfferingPricing,
    MemberFlexDollar,
    ContributionType,
    PlanOfferingPanel,
    ProductOfferingPanel,
    Characteristics,
    Plan,
} from "@empowered/constants";
import { catchError } from "rxjs/operators";
import { MPGroupAccountService } from "@empowered/common-services";

// Component Level Constant
const TPI = "tpi";
const PERCENTAGE_BASE = 100;
const FSA = "fsa";
const TRANSIT = "transit";
const PARKING = "parking";

@Component({
    selector: "empowered-plan-selection",
    templateUrl: "./plan-selection.component.html",
    styleUrls: ["./plan-selection.component.scss"],
})
export class PlanSelectionComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
    @Input() eligibilityCheck: any;
    @Input() planOffering: PlanOfferingPanel;
    @Input() productOffering: ProductOfferingPanel;
    @Input() editMode: boolean;
    @Input() expanded: boolean;
    @Input() cartItems: GetCartItems[];
    @Input() memberAgeOnCoverageEffectiveDate: number;
    @Output() addPlanEvent = new EventEmitter<PlanOffering>();
    @Output() editCancelEvent = new EventEmitter();
    @Output() updateAmountEvent = new EventEmitter<{ cost: number; coverage: string }>();
    @Output() childAgeChangedEvent = new EventEmitter<Juvenile>();
    @ViewChild(RiderSelectionComponent)
    planRider: RiderSelectionComponent;
    accPayFrequencyId: number;
    plan: Plan;
    originalPlan: PlanOfferingPanel;
    enrollment: Enrollments;
    cartItem: GetCartItems;
    isCollapsed = true;
    planUpdated = false;
    hsaFormControl: FormControl;
    isHSAPlan: boolean;
    isFSAPlan: boolean;
    fsaQuestionNumber = 0;
    fsaQuestion: string;
    transitQuestion: string;
    parkingQuestion: string;
    memberId: number;
    mpGroup: number;
    payrollsPerYear: number;
    payFrequency: PayFrequency;
    payFrequencyObject: PayFrequencyObject;
    coverageLevelData: CoverageLevel[];
    planOfferingPriceingData: PlanOfferingPricing[];
    isLoading: boolean;
    selectedCoverageLevel: PlanOfferingPricing;
    questionsArray: Array<{ section: string; question: string; singleOptionQuestion?: string; num?: number }> = [];
    baseCoverageLevelRules: PlanCoverageLevelRules;
    shoppingCart: any;
    locked = false;
    DECLINE_ID = 2;
    riderQuestionFlag: boolean;
    supplementaryBaseEnrollment: Enrollments;
    enrollmentMethod: string;
    enrollmentState: string;
    accountName = "";
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    subscriptions: Subscription[] = [];
    multiQuestion: boolean;
    isTransitPlan = false;
    isParkingPlan = false;
    flexDollars: MemberFlexDollar[];
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.coveragePlanQuestion",
        "primary.portal.shoppingExperience.singleBenefitAmountOption",
        "primary.portal.shoppingExperience.benefitAmountQuestion",
        "primary.portal.shoppingExperience.eliminationPeriodQuestion",
        "primary.portal.shoppingExperience.riderQuestion",
        "primary.portal.shoppingExperience.hsaQuestion",
        "primary.portal.shoppingExperience.fsaQuestion",
        "primary.portal.shoppingExperience.parkingQuestion",
        "primary.portal.shoppingExperience.transitQuestion",
        "primary.portal.shoppingExperience.policy",
        "primary.portal.common.update",
        "primary.portal.shoppingExperience.inCart",
        "primary.portal.shoppingExperience.adjustmentsQuestion",
        "primary.portal.shoppingExperience.adjustmentDescription",
        "primary.portal.shoppingExperience.discountAmount",
        "primary.portal.common.select",
        "primary.portal.tpi.selected",
        "primary.portal.benefitDollars.payment.message",
        "primary.portal.expandedShoppingCart.employerContribution",
        "primary.portal.shoppingExperience.childAge",
        "primary.portal.shoppingExperience.selectChildAge",
    ]);

    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetPayFrequency) payFrequency$: Observable<PayFrequency>;
    @Select(EnrollmentState.GetEnrollmentMethod) enrollmentMethod$: Observable<EnrollmentMethod>;
    @Select(EnrollmentState.GetEnrollmentState) enrollmentState$: Observable<string>;
    isTpi = false;
    isJuvenilePlan = false;
    isCompanyProvided = false;
    childAgeControl = new FormControl(0);
    dependentAgeOptions = DEPENDENT_AGE_OPTIONS;
    readonly NEW_YORK_ABBR = "NY";
    readonly OHIO_ABBR = "OH";
    flexDollarPipe = new FlexDollarPipe();

    constructor(
        private readonly coreService: CoreService,
        private readonly shpService: ShoppingService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly shoppingService: ShoppingService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly languageService: LanguageService,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly accService: AccountService,
        private readonly mpGroupService: MPGroupAccountService,
        private readonly router: Router,
    ) {
        if (this.router.url.indexOf(TPI) >= 0) {
            this.isTpi = true;
        }
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.subscriptions.push(this.mpGroup$.subscribe((x) => (this.mpGroup = x)));
        this.subscriptions.push(this.memberId$.subscribe((x) => (this.memberId = x)));
        this.subscriptions.push(
            this.payFrequency$.subscribe((x) => {
                this.payrollsPerYear = x ? x.payrollsPerYear : 1;
                this.payFrequency = x;
            }),
        );
        this.subscriptions.push(this.enrollmentMethod$.subscribe((x) => (this.enrollmentMethod = x)));
        this.hsaFormControl = this.fb.control({ value: null }, { updateOn: "blur" });
        this.subscriptions.push(
            this.hsaFormControl.valueChanges.subscribe((element) => {
                if (this.planOffering) {
                    this.planOffering.hsaFsaAmount = element;
                    this.calculatePlanPrice();
                    if (this.editMode) {
                        this.checkPlanUpdated();
                    }
                }
            }),
        );
        this.subscriptions.push(
            this.mpGroupService.mpGroupAccount$.subscribe((account) => (this.accountName = account ? account.name : "")),
        );
    }

    /**
     * Function to implement Angular's OnInit lifecycle hook, call getShoppingCart API and initialize payFrequencyObject
     */
    ngOnInit(): void {
        this.isCompanyProvided = !!this.planOffering?.plan?.characteristics?.includes(Characteristics.COMPANY_PROVIDED);
        if (
            this.productOffering.flexDollars &&
            this.productOffering.flexDollars.length &&
            this.enrollmentState !== this.NEW_YORK_ABBR &&
            this.enrollmentState !== this.OHIO_ABBR &&
            !this.isCompanyProvided
        ) {
            this.flexDollars = this.productOffering.flexDollars.map((obj) => {
                const flexDollar = { ...obj };
                flexDollar.name = flexDollar.name
                    .toLowerCase()
                    .includes(this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"].toLowerCase())
                    ? this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"]
                    : flexDollar.name;
                return flexDollar;
            });
        }
        this.subscriptions.push(this.shoppingService.acquireShoppingCartLock(this.memberId, this.mpGroup).subscribe());
        this.getShoppingCart();
        this.payFrequencyObject = {
            payFrequencies: [],
            pfType: "",
            payrollsPerYear: 0,
        };
    }
    /**
     * @description Lifecycle method to execute when detected change
     */
    ngOnChanges(): void {
        this.subscriptions.push(this.enrollmentState$.subscribe((x) => (this.enrollmentState = x)));
        if (!this.questionsArray.length) {
            this.setQuestionsArray();
        }
        this.isJuvenilePlan = !!(
            this.productOffering.product.id === ProductId.JUVENILE_TERM_LIFE ||
            this.productOffering.product.id === ProductId.JUVENILE_WHOLE_LIFE
        );
        this.isHSAPlan = this.productOffering.productType === ProductType.HSA;
        this.isFSAPlan = this.productOffering.productType === ProductType.FSA;
        this.isTransitPlan = EnrollmentEnums.productIds.TRANSIT.includes(this.productOffering.product.id);
        this.isParkingPlan = EnrollmentEnums.productIds.PARKING.includes(this.productOffering.product.id);
        this.fsaQuestionNumber = this.getQuestionNumber(FSA);
        this.fsaQuestion = this.getQuestion(FSA);
        this.transitQuestion = this.getQuestion(TRANSIT);
        this.parkingQuestion = this.getQuestion(PARKING);
        if (this.planOffering) {
            this.planOffering = this.utilService.copy(this.planOffering);
            if (this.planOffering.supplementary) {
                const enrollments = this.store.selectSnapshot(EnrollmentState.GetEnrollments);
                if (enrollments && enrollments.length) {
                    this.supplementaryBaseEnrollment = enrollments.find(
                        (enrollment) =>
                            enrollment.status === "APPROVED" &&
                            enrollment.plan.dependentPlanIds.some((x) => x === this.planOffering.plan.id),
                    );
                }
            }
            if (this.isHSAPlan || this.isFSAPlan) {
                const planOfr = { ...this.planOffering };
                planOfr.isBenefitAmountSection = false;
                planOfr.isEliminationPeriodSection = false;
                planOfr.isRiderSection = false;
                planOfr.isHsaSection = true;
                this.planOffering = { ...planOfr };
                this.setQuestionNumbers();
                if (this.expanded) {
                    this.hsaFormControl.setValue(this.planOffering.hsaFsaAmount);
                    this.hsaFormControl.setValidators([Validators.max(this.planOffering.maxHSA), Validators.min(this.planOffering.minHSA)]);
                    this.calculatePlanPrice();
                }
            } else if (this.isJuvenilePlan) {
                if (this.editMode) {
                    this.planOffering.childAge = this.planOffering.cartItem.dependentAge;
                }
                this.childAgeControl.setValue(this.planOffering.childAge);
                const planOfr = { ...this.planOffering };
                planOfr.isCoverageSection = false;
                planOfr.isEliminationPeriodSection = false;
                planOfr.isRiderSection = false;
                planOfr.isHsaSection = false;
                planOfr.isJuvenileSection = true;
                this.planOffering = { ...planOfr };
                if (this.expanded) {
                    if (this.planOffering.coverageLevel) {
                        this.checkSections(this.planOffering);
                        this.setQuestionNumbers();
                        this.calculatePlanPrice();
                    } else {
                        this.setValuesToState();
                    }
                }
            } else if (this.expanded) {
                if (this.planOffering.coverageLevel && this.planOffering.ridersData) {
                    this.checkSections(this.planOffering);
                    this.setQuestionNumbers();
                    this.calculatePlanPrice();
                } else {
                    this.setValuesToState();
                }
            }
            if (this.editMode) {
                this.cartItem = this.planOffering.cartItem;
                this.enrollment = this.planOffering.enrollment;
                this.checkPlanUpdated();
            }
        }
    }
    /**
     * Method to get shopping cart
     */
    getShoppingCart(): void {
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.subscriptions.push(
            this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : planYearId).subscribe((res) => {
                this.shoppingCart = res;
                this.shoppingCartService.setShoppingCart(this.shoppingCart);
                this.locked = this.shoppingCart.locked;
            }),
        );
    }

    /**
     * create questions array for each plan section
     */
    setQuestionsArray(): void {
        this.questionsArray = [
            {
                section: "coverage",
                question: this.languageStrings["primary.portal.shoppingExperience.coveragePlanQuestion"],
                singleOptionQuestion: this.languageStrings["primary.portal.shoppingExperience.policy"],
            },
            {
                section: "singleBenefit",
                question: this.languageStrings["primary.portal.shoppingExperience.singleBenefitAmountOption"],
            },
            {
                section: "benefit",
                question: this.languageStrings["primary.portal.shoppingExperience.benefitAmountQuestion"],
            },
            {
                section: "elimination",
                question: this.languageStrings["primary.portal.shoppingExperience.eliminationPeriodQuestion"],
            },
            {
                section: "rider",
                question: this.languageStrings["primary.portal.shoppingExperience.riderQuestion"],
            },
            { section: "hsa", question: this.languageStrings["primary.portal.shoppingExperience.hsaQuestion"] },
            { section: FSA, question: this.languageStrings["primary.portal.shoppingExperience.fsaQuestion"] },
            { section: TRANSIT, question: this.languageStrings["primary.portal.shoppingExperience.transitQuestion"] },
            { section: PARKING, question: this.languageStrings["primary.portal.shoppingExperience.parkingQuestion"] },
            {
                section: "adjustments",
                question: this.languageStrings["primary.portal.shoppingExperience.adjustmentsQuestion"],
            },
        ];
    }

    /**
     * Function to set question numbers
     * @param section {string}
     * @param num {number}
     */
    setQuestionNumber(section: string, num: number): void {
        const idx = this.questionsArray.findIndex((x) => x.section === section);
        if (idx > -1) {
            if (this.isJuvenilePlan && section === "benefit") {
                this.questionsArray[idx].num = num + 1;
            } else {
                this.questionsArray[idx].num = num;
            }
        }
    }

    getQuestionNumber(section: string): number {
        return this.questionsArray.find((x) => x.section === section).num;
    }

    getQuestion(section: string): string {
        const questionObj = this.questionsArray.find((x) => x.section === section);
        if (
            section === "coverage" &&
            (this.isHSAPlan || (this.planOffering.coverageLevel && this.planOffering.coverageLevel.length === 1))
        ) {
            return questionObj.singleOptionQuestion;
        }
        return questionObj.question;
    }

    addPlan(): void {
        if (this.planOffering) {
            this.isLoading = true;
            if ((this.isHSAPlan || this.isFSAPlan) && this.hsaFormControl.errors) {
                return;
            }
            this.planOffering.inCart = true;
            this.addPlanEvent.emit(this.planOffering);
            this.isLoading = false;
        }
    }

    updatePlan(): void {
        this.addPlan();
    }

    cancelEdit(): void {
        this.editCancelEvent.emit();
    }
    /**
     * Method to calculate plan price
     */
    calculatePlanPrice(): void {
        if (this.planOffering) {
            let cost = 0;
            let totalCost = 0;
            if (this.planOffering.selectedPricing) {
                if (!this.planOffering.selectedCoverage) {
                    const plan = { ...this.planOffering };
                    plan.selectedCoverage = plan.coverageLevel.find((x) => x.id === plan.selectedPricing.coverageLevelId);
                    this.planOffering = { ...plan };
                }
                cost += this.planOffering.selectedPricing.memberCost;
                if (this.planOffering.plan.carrier.id === CarrierId.AFLAC_GROUP) {
                    totalCost += this.planOffering.selectedPricing.memberCost;
                } else {
                    totalCost += this.planOffering.selectedPricing.totalCost;
                }
            }
            if (this.planOffering.ridersData) {
                let riderAmt = 0;
                this.planOffering.ridersData.forEach((rider) => {
                    if (rider.inCart && rider.selectedPricing) {
                        rider.totalCost = rider.selectedPricing.totalCost;
                        rider.cost = rider.selectedPricing.memberCost;
                        riderAmt += rider.selectedPricing.memberCost;
                        cost += rider.cost;
                        totalCost += rider.totalCost;
                    } else if (rider.inCart && !rider.selectedPricing && rider.totalCost) {
                        riderAmt += rider.totalCost;
                        totalCost += rider.totalCost;
                    }
                });
                this.planOffering.riderAmount = riderAmt;
            }
            if (this.planOffering.hsaFsaAmount) {
                const amt = Math.round((this.planOffering.hsaFsaAmount / this.payrollsPerYear) * 10000) / 10000;
                cost += amt;
                totalCost += amt;
            }
            const planOfr = { ...this.planOffering };
            planOfr.cost = cost;
            planOfr.totalCost = totalCost;
            planOfr.adjustments = totalCost - cost;
            this.planOffering = { ...planOfr };
            if (this.isHSAPlan || this.isFSAPlan) {
                this.updateAmountEvent.emit({
                    cost: this.planOffering.totalCost,
                    coverage: this.planOffering.hsaFsaCoverage ? this.planOffering.hsaFsaCoverage : "",
                });
            } else {
                const companyProvided = this.planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED);
                let calculatedCost = !companyProvided ? this.planOffering.totalCost : this.planOffering.selectedPricing.memberCost;
                if (this.cartItem) {
                    calculatedCost = this.flexDollarPipe.transform(
                        !this.isCompanyProvided ? this.planOffering.totalCost : this.planOffering.selectedPricing.memberCost,
                        this.flexDollars,
                        this.payFrequency,
                        this.enrollmentState,
                    );
                }
                this.updateAmountEvent.emit({
                    cost: calculatedCost,
                    coverage: this.planOffering.selectedCoverage ? this.planOffering.selectedCoverage.name : "",
                });
            }
        }
    }

    /**
     * Method to update plan and riders amount
     * @param obj: PlanOfferingPricing
     * @returns void
     */
    updateAmount(obj: PlanOfferingPricing): void {
        if (obj) {
            this.selectedCoverageLevel = obj;
            const planOfr = { ...this.planOffering };
            planOfr.selectedPricing = obj;
            planOfr.selectedCoverage = planOfr.coverageLevel.find((x) => x.id === obj.coverageLevelId);
            if (planOfr.ridersData.length) {
                planOfr.ridersData = planOfr.ridersData.map((rider) => {
                    if (rider.planPricing && rider.selectedCoverage) {
                        rider.selectedPricing = rider.planPricing.find((pricing) => pricing.coverageLevelId === rider.selectedCoverage.id);
                    }
                    if (rider.coverageLevel && !rider.selectedCoverage) {
                        rider.selectedCoverage = rider.coverageLevel.find((x) => x.id === obj.coverageLevelId);
                    }
                    rider.inCart = false;
                    return rider;
                });
            }
            this.planOffering = { ...planOfr };
            this.calculatePlanPrice();
            if (this.editMode) {
                this.checkPlanUpdated();
            }
        }
    }
    /**
     * Method to update rider amount
     * @param riders: PlanOfferingPanel
     * @returns void
     */
    updateRiderAmount(riders: PlanOfferingPanel): void {
        this.planOffering.ridersData = riders.ridersData.map((rider) => {
            if (rider.inCart && !rider.selectedPricing) {
                rider.selectedPricing = rider.planPricing.find(
                    (pricing) => rider.selectedCoverage && pricing.coverageLevelId === rider.selectedCoverage.id,
                );
            }
            return rider;
        });
        this.calculatePlanPrice();
        this.checkPlanUpdated();
    }
    /**
     * Check if plan in the cart is updated
     */
    checkPlanUpdated(): void {
        if (this.cartItem) {
            if (this.isHSAPlan || this.isFSAPlan) {
                this.planUpdated = this.cartItem.memberCost !== this.planOffering.cost;
            } else {
                this.comparePlanToCartItem();
            }
        } else if (this.enrollment) {
            this.compareCartToEnrollment();
        }
    }
    /**
     * @description will compare Plan Offering with in cart item
     * @return void
     */
    comparePlanToCartItem(): void {
        this.planUpdated =
            this.cartItem.coverageLevelId !== this.planOffering.selectedPricing.coverageLevelId ||
            this.cartItem.benefitAmount !== this.planOffering.selectedPricing.benefitAmount ||
            (this.isJuvenilePlan && this.cartItem.dependentAge !== this.childAgeControl.value);
        if (!this.planUpdated) {
            const selectedRiders =
                this.planOffering.ridersData && this.planOffering.ridersData.length
                    ? this.planOffering.ridersData.filter((x) => x.inCart).length
                    : 0;
            const cartRiders = this.cartItem.riders.filter((rider) => rider.coverageLevelId !== this.DECLINE_ID).length;
            if (selectedRiders !== cartRiders) {
                this.planUpdated = true;
                return;
            }
            if (cartRiders) {
                for (const rider of this.cartItem.riders) {
                    const riderPlan = this.planOffering.ridersData.find((x) => x.plan.id === rider.planId);
                    if (riderPlan) {
                        this.planUpdated =
                            !riderPlan.inCart ||
                            riderPlan.selectedPricing.coverageLevelId !== rider.coverageLevelId ||
                            riderPlan.selectedPricing.benefitAmount !== rider.benefitAmount;
                        if (this.planUpdated) {
                            return;
                        }
                    } else {
                        this.planUpdated = true;
                        return;
                    }
                }
            }
        }
    }

    compareCartToEnrollment(): void {
        if (this.enrollment.coverageLevel && this.planOffering.selectedPricing) {
            this.planUpdated = this.enrollment.coverageLevel.id !== this.planOffering.selectedPricing.coverageLevelId;
            if (!this.planUpdated && this.enrollment.benefitAmount) {
                this.planUpdated = this.enrollment.benefitAmount !== this.planOffering.selectedPricing.benefitAmount;
            }
            if (!this.planUpdated) {
                const selectedRiders =
                    this.planOffering.ridersData && this.planOffering.ridersData.length
                        ? this.planOffering.ridersData.filter((x) => x.inCart).length
                        : 0;
                const enrollRiders = this.enrollment.riders ? this.enrollment.riders.length : 0;
                if (selectedRiders !== enrollRiders) {
                    this.planUpdated = true;
                    return;
                }
                if (enrollRiders) {
                    for (const rider of this.enrollment.riders) {
                        const riderPlan = this.planOffering.ridersData.find((x) => x.plan.id === rider.planId);
                        if (riderPlan) {
                            this.planUpdated =
                                !riderPlan.inCart ||
                                riderPlan.selectedPricing.coverageLevelId !== rider.coverageLevelId ||
                                riderPlan.selectedPricing.benefitAmount !== rider.benefitAmount;
                            if (this.planUpdated) {
                                return;
                            }
                        } else {
                            this.planUpdated = true;
                            return;
                        }
                    }
                }
            }
        } else {
            this.planUpdated = true;
        }
    }

    /**
     * Fetch coverage levels and plan riders of the plan offering
     */
    setValuesToState(): void {
        if (this.planOffering) {
            this.isLoading = true;
            this.subscriptions.push(
                this.manageAllAPICall().subscribe(
                    ([coverageLevels, riders]) => {
                        this.isLoading = false;
                        this.getPayFrequencyData();
                        const planOfr = { ...this.planOffering };
                        if (coverageLevels) {
                            if (this.planOffering.supplementary) {
                                if (this.supplementaryBaseEnrollment) {
                                    planOfr.coverageLevel = coverageLevels.filter(
                                        (coverage) => coverage.id === this.supplementaryBaseEnrollment.coverageLevel.id,
                                    );
                                } else {
                                    planOfr.coverageLevel = [];
                                }
                            } else {
                                planOfr.coverageLevel = coverageLevels;
                            }
                        }
                        if (riders) {
                            planOfr.ridersData = riders;
                        }
                        this.checkSections(planOfr);
                        this.planOffering = { ...planOfr };
                        this.riderQuestionFlag = planOfr.isRiderSection;
                        this.setQuestionNumbers();
                        this.calculatePlanPrice();
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                ),
            );
        }
    }

    /**
     * Api call to get coverage levels and plan riders
     * @returns Observable of an array containing CoverageLevel array and PlanOffering array
     */
    manageAllAPICall(): Observable<[CoverageLevel[], PlanOffering[]]> {
        return forkJoin(
            this.coreService.getCoverageLevels(this.planOffering.plan.id.toString()),
            this.shpService
                .getPlanOfferingRiders(
                    this.planOffering.id.toString(),
                    this.mpGroup,
                    this.enrollmentMethod,
                    this.enrollmentState,
                    this.memberId,
                )
                .pipe(catchError(() => of([]))),
        );
    }

    /**
     * Function to check sections
     * @param planOfr {PlanOfferingPanel}
     */
    checkSections(planOfr: PlanOfferingPanel): void {
        if (planOfr) {
            planOfr.isBenefitAmountSection = this.planOffering.planPricing.filter((x) => !!x.benefitAmount).length > 0;
            if (!this.isJuvenilePlan) {
                if (planOfr.coverageLevel.filter((x) => x.eliminationPeriod != null).length > 0) {
                    planOfr.isEliminationPeriodSection = true;
                    planOfr.isCoverageSection = false;
                } else {
                    planOfr.isCoverageSection = true;
                    if (this.planOffering.supplementary && this.supplementaryBaseEnrollment) {
                        planOfr.coverageLevel = planOfr.coverageLevel.filter(
                            (coverage) => coverage.id === this.supplementaryBaseEnrollment.coverageLevel.id,
                        );
                        planOfr.selectedCoverage = this.supplementaryBaseEnrollment.coverageLevel;
                    }
                    planOfr.isEliminationPeriodSection = false;
                }
                planOfr.isRiderSection = planOfr.ridersData.length > 0;
            }
        }
    }

    /**
     * Push sections to display in an array and then set their question number if more than 1 question
     */
    setQuestionNumbers(): void {
        if (this.planOffering) {
            const array = [];
            if (this.planOffering.isCoverageSection) {
                array.push("coverage");
            }
            if (this.planOffering.isEliminationPeriodSection) {
                array.push("elimination");
            }
            if (this.planOffering.isBenefitAmountSection) {
                array.push("benefit");
            }
            if (this.planOffering.isRiderSection) {
                array.push("rider");
            }
            if (this.isHSAPlan) {
                array.push("hsa");
            }
            if (this.isFSAPlan) {
                array.push(FSA);
            }
            if (this.isTransitPlan) {
                array.push(TRANSIT);
            }
            if (this.isParkingPlan) {
                array.push(PARKING);
            }
            if (this.productOffering.flexDollars && this.productOffering.flexDollars.length && !this.isJuvenilePlan) {
                array.push("adjustments");
            }
            if (array.length > 0) {
                if (array.length > 1) {
                    this.multiQuestion = true;
                }
                array.forEach((sec, idx) => this.setQuestionNumber(sec, idx + 1));
            }
        }
    }
    ngAfterViewChecked(): void {
        if (this.planRider) {
            this.riderQuestionFlag = false;
            if (
                this.planRider.allRiderDetails.length > 0 &&
                this.planRider.allRiderDetails.filter((x) => x.riderDetails.planPricing.length > 0).length > 0
            ) {
                this.riderQuestionFlag = true;
            }
        }
    }
    isBaseCoverageRuleExist(coverageId: number): boolean {
        const tempObj = this.store.selectSnapshot(EnrollmentState.GetBaseCoverageLevelRules).find((x) => x.coverageLevelId === coverageId);
        if (tempObj) {
            return true;
        }
        return false;
    }
    getPayFrequencyData(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()).subscribe(
                (member) => {
                    this.accPayFrequencyId = member.body.workInformation.payrollFrequencyId;
                    this.accService.getPayFrequencies(this.mpGroup.toString()).subscribe(
                        (res) => {
                            this.payFrequencyObject.payFrequencies = [...res];
                            this.payFrequency = res.find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());

                            this.payFrequencyObject.pfType = this.payFrequency.name;
                            const monthlypayFrequency = res.find((ele) => ele.frequencyType === "MONTHLY");
                            this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                            this.isLoading = false;
                        },
                        () => {
                            this.isLoading = false;
                        },
                    );
                },
                (error) => {
                    if (error.error) {
                        this.store.dispatch(new SetErrorForShop(error.error));
                    }
                    this.isLoading = false;
                },
            ),
        );
    }

    /**
     * get flex dollar cost
     * @param flexDollar flex dollar object
     * @returns number : flex cost
     */
    getFlexAmount(flexDollar: MemberFlexDollar): number {
        if (flexDollar.contributionType === ContributionType.FLAT_AMOUNT) {
            return flexDollar.currentAmount ? flexDollar.currentAmount : flexDollar.amount;
        }
        const cost: number = this.planOffering.totalCost
            ? this.planOffering.totalCost
            : this.planOffering.enrollment
            ? this.planOffering.enrollment.memberCostPerPayPeriod
            : 0;
        if (flexDollar.contributionType === ContributionType.PERCENTAGE) {
            return (cost * flexDollar.amount) / PERCENTAGE_BASE;
        }
        return flexDollar.amount;
    }

    /**
     * This method used for validating against benefit multiple option or single,
     * based on selected coverage plan and updating benefit header text accordingly.
     * @param planOffering {PlanOfferingPanel}
     * @returns boolean, returns true if selected pricing value and coverage level matches with selected coverage level id,
     *  else it returns false.
     */
    checkSingleBenefit = (planOffering: PlanOfferingPanel): boolean =>
        planOffering.planPricing.filter(
            (benefit) => planOffering.selectedPricing && benefit.coverageLevelId === planOffering.selectedPricing.coverageLevelId,
        ).length > 1;

    /**
     * Function called when child age is changed
     */
    onChildAgeChange(): void {
        if (this.editMode) {
            this.checkPlanUpdated();
        }
        this.planOffering.childAge = this.childAgeControl.value;
        this.childAgeChangedEvent.emit({
            childAge: this.childAgeControl.value,
            planOfferingId: this.planOffering.id,
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
