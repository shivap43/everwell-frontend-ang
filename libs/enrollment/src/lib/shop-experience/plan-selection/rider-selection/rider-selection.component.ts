import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, Output, EventEmitter, SimpleChanges, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { CoreService, ShoppingService } from "@empowered/api";
import { EnrollmentState, StaticUtilService } from "@empowered/ngxs-store";
import { forkJoin, Observable, Subscription, of, iif } from "rxjs";

import { MatDialog } from "@angular/material/dialog";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { take, switchMap, tap, catchError, filter, map } from "rxjs/operators";
import {
    ConfigName,
    PlanCoverageLevelRules,
    EnrollmentMethod,
    CoverageLevel,
    DependencyType,
    EnrollmentRequirement,
    GetCartItems,
    Enrollments,
    PlanOfferingPricing,
    DependencyTypes,
    PlanOfferingPanel,
    ProductId,
} from "@empowered/constants";
import { PlanDetailsComponent } from "@empowered/ui";

interface RiderDetail {
    riders: boolean;
    riderDetails: PlanOfferingPanel;
    disable: boolean;
}

const STR_SINGLE_BENEFIT = "isSingleBenefit";
const REQ_ENROLL_PLAN: DependencyType = "REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN";
const REQ_NONENROLL_PLAN: DependencyType = "REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN";
const REQ_PLAN_NAME = "requiredPlanName";
const REQ_PLAN_TYPE = "requirementType";
const BASE = "BASE";
const Waiver_of_Premium_Rider = "Waiver of Premium Rider";
const MAX_AGE_DISABLE_RIDER_PRODUCT_IDS = [ProductId.TERM_LIFE];

@Component({
    selector: "empowered-rider-selection",
    templateUrl: "./rider-selection.component.html",
    styleUrls: ["./rider-selection.component.scss"],
})
export class RiderSelectionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() planOfferingObj: PlanOfferingPanel;
    @Input() productOfferingId: number;
    @Input() baseCoverageLevel: CoverageLevel;
    @Input() cartItems: GetCartItems[];
    @Input() memberAgeOnCoverageEffectiveDate: number;
    @Output() updateAmount = new EventEmitter<PlanOfferingPanel>();
    enrollments: Enrollments[];
    allPlanOfferings: PlanOfferingPanel[];
    riderRulesRepo: PlanCoverageLevelRules[];
    basePlanCoverageRules: PlanCoverageLevelRules[];
    ridersData: PlanOfferingPanel[];
    coverageLevesData: CoverageLevel[];
    allRiderDetails: RiderDetail[];
    allBasicRiders: PlanOfferingPanel[];
    isLoading: boolean;
    isCoverageLevelSection: boolean;
    isBenefitAmountSection: boolean;
    isEliminationPeriodSection: boolean;
    isRiderOffeingSection: boolean;
    mpGroup: number;
    enrollmentState: string;
    enrollmentMethod: EnrollmentMethod;
    memberId: number;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    coverageRuleLoader: number;
    riderBenefitAmt: number;
    supplementaryBaseEnrollment: Enrollments;
    subscriptions: Subscription[] = [];
    tooltipMsg: string;
    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetEnrollmentState) enrollmentState$: Observable<string>;
    @Select(EnrollmentState.GetEnrollmentMethod) enrollmentMethod$: Observable<EnrollmentMethod>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetAllPlanOfferings) allPlanOfferings$: Observable<PlanOfferingPanel[]>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.riderDetails",
        "primary.portal.shoppingExperience.enrollmentIneligible",
        "primary.portal.shoppingCart.planOfferings.label.riderSelectPriceText",
        "primary.portal.shoppingCart.planOfferings.label.riderSinglePriceText",
        "primary.portal.shoppingExperience.ropRiderInfo",
    ]);
    policyFeeRiderIds: string[];
    isRiderDisabledList: boolean[];

    constructor(
        private readonly store: Store,
        private readonly shpService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly cd: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.subscriptions.push(this.mpGroup$.subscribe((x) => (this.mpGroup = x)));
        this.subscriptions.push(this.memberId$.subscribe((x) => (this.memberId = x)));
        this.subscriptions.push(this.enrollmentState$.subscribe((x) => (this.enrollmentState = x)));
        this.subscriptions.push(this.enrollmentMethod$.subscribe((x) => (this.enrollmentMethod = x)));
        this.subscriptions.push(this.allPlanOfferings$.subscribe((x) => (this.allPlanOfferings = x)));
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigValue(ConfigName.ENROLLMENT_MANDATORY_RIDER_ID)
                .pipe(filter((id) => id && id.length > 0))
                .subscribe((policyRiderIds) => (this.policyFeeRiderIds = policyRiderIds.split(","))),
        );
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    /**
     * Life cycle hook to initialize and set all rider values and configurations
     */
    ngOnInit(): void {
        this.tooltipMsg = this.languageStrings["primary.portal.shoppingExperience.enrollmentIneligible"];
        this.cd.markForCheck();
        this.allRiderDetails = [];
        this.isRiderDisabledList = [];
        this.coverageRuleLoader = 0;
    }
    /**
     * get all riders' info
     */
    getAllDataForRiders(): void {
        this.isLoading = true;
        const riderDataArray: PlanOfferingPanel[] = [];
        this.subscriptions.push(
            iif(
                () => !this.planOfferingObj.ridersData,
                this.shpService.getPlanOfferingRiders(
                    this.planOfferingObj.id.toString(),
                    this.mpGroup,
                    this.enrollmentMethod,
                    this.enrollmentState,
                    this.memberId,
                ),
                of(this.planOfferingObj.ridersData),
            )
                .pipe(
                    filter((riders) => riders.length > 0),
                    switchMap((riders: PlanOfferingPanel[]) => {
                        const baseBenefitAmount =
                            this.planOfferingObj.selectedPricing && this.planOfferingObj.selectedPricing.benefitAmount
                                ? this.planOfferingObj.selectedPricing.benefitAmount
                                : null;
                        return forkJoin(
                            riders.map((rider) => {
                                let parentPlan: PlanOfferingPanel;
                                if (rider.parentPlanId) {
                                    parentPlan = riders.find((data) => data.plan.id === rider.parentPlanId);
                                }
                                if (parentPlan && parentPlan.inCart) {
                                    rider.inCart = false;
                                }
                                return forkJoin(
                                    this.shpService.getPlanOfferingPricing(
                                        rider.id.toString(),
                                        this.enrollmentState,
                                        null,
                                        this.store.selectSnapshot(EnrollmentState.GetMemberId),
                                        this.store.selectSnapshot(EnrollmentState.GetMPGroup),
                                        rider.parentPlanId,
                                        rider.parentPlanCoverageLevelId,
                                        parentPlan && parentPlan.selectedPricing
                                            ? parentPlan.selectedPricing.benefitAmount
                                            : baseBenefitAmount,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        this.policyFeeRiderIds.includes(rider.plan.id.toString()),
                                    ),
                                    this.coreService.getCoverageLevels(
                                        rider.plan.id.toString(),
                                        this.planOfferingObj.selectedPricing.coverageLevelId,
                                        this.planOfferingObj.supplementary,
                                    ),
                                ).pipe(
                                    catchError((error) => {
                                        this.isLoading = false;
                                        return of([]);
                                    }),
                                    map(([planPricing, coverageLevels]) => {
                                        if (coverageLevels) {
                                            const coverageRetainLevels = coverageLevels.filter((coverage) => coverage.retainCoverageLevel);
                                            rider.coverageLevel =
                                                this.planOfferingObj.supplementary && coverageRetainLevels && coverageRetainLevels.length
                                                    ? coverageRetainLevels
                                                    : coverageLevels;
                                        }
                                        if (planPricing) {
                                            rider.planPricing = this.planOfferingObj.supplementary
                                                ? planPricing.filter((price) =>
                                                      rider.coverageLevel.some((coverage) => price.coverageLevelId === coverage.id),
                                                  )
                                                : planPricing;
                                        }
                                        return rider;
                                    }),
                                );
                            }),
                        );
                    }),
                    switchMap((response: PlanOfferingPanel[]) => {
                        this.allRiderDetails = [];
                        response.forEach((rider) => {
                            this.checkSections([rider.planPricing, rider.coverageLevel]);
                            rider.isCoverageSection = this.isCoverageLevelSection;
                            rider.isBenefitAmountSection = this.isBenefitAmountSection;
                            rider.isEliminationPeriodSection = this.isEliminationPeriodSection;
                            if (
                                rider.inCart &&
                                rider.selectedPricing &&
                                !rider.planPricing.some((x) => x.coverageLevelId === rider.selectedPricing.coverageLevelId)
                            ) {
                                rider.inCart = false;
                                rider.selectedPricing = this.getDefaultPricing(rider.planPricing, rider);
                            }
                            if (!rider.inCart) {
                                rider.selectedPricing = this.getDefaultPricing(rider.planPricing, rider);
                            }
                            Object.defineProperty(rider, STR_SINGLE_BENEFIT, {
                                value: this.checkForSinglePricing(rider),
                                writable: true,
                            });
                            if (!this.isRiderExist(rider) && rider.planPricing.length) {
                                this.allRiderDetails.push({
                                    riders: true,
                                    riderDetails: rider,
                                    disable: this.checkRiderEligibility(rider, response),
                                });
                            }
                            riderDataArray.push(rider);
                        });
                        this.allRiderDetails.forEach((elm, i) => {
                            // Disable riders based on age of the member on coverage effective date
                            // And such riders must not be added to cart
                            if (
                                this.memberAgeOnCoverageEffectiveDate > elm.riderDetails?.planPricing[0]?.maxAge &&
                                !elm.riderDetails?.enrollmentRequirements?.length &&
                                MAX_AGE_DISABLE_RIDER_PRODUCT_IDS.includes(elm.riderDetails?.plan.productId) &&
                                elm.riderDetails?.plan?.name === Waiver_of_Premium_Rider
                            ) {
                                this.isRiderDisabledList[i] = true;
                                riderDataArray.splice(i, 1);
                            } else {
                                this.isRiderDisabledList[i] = false;
                            }
                        });
                        return this.setPolicyFeeId(this.allRiderDetails);
                    }),
                )
                .subscribe(
                    () => {
                        this.closeLoader(riderDataArray);
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                ),
        );
    }

    /**
     * Function to add Aflac Policy fee id pre applied to the base plan cost..
     * @param riderArray : RiderDetail array which consists of individual plan offering/riders.
     * @returns PlanOfferingPricing array with coverage level and pricing api calls
     */
    setPolicyFeeId(riderArray: RiderDetail[]): Observable<[PlanOfferingPricing[], CoverageLevel[]]> {
        const event: HTMLInputElement = {} as HTMLInputElement;
        event.checked = true;
        let observableToReturn: Observable<[PlanOfferingPricing[], CoverageLevel[]]>;
        (riderArray || []).forEach((rider, i) => {
            (this.policyFeeRiderIds || []).forEach((id) => {
                if (rider.riderDetails.plan.id === Number(id)) {
                    observableToReturn = this.addRidertoCart(event, rider.riderDetails, false);
                    this.isRiderDisabledList[i] = true;
                    rider.riderDetails.disable = {
                        planDisable: true,
                    };
                }
            });
            if (
                rider.riderDetails.enrollmentRequirements &&
                rider.riderDetails.enrollmentRequirements.length &&
                rider.riderDetails.enrollmentRequirements.some(
                    (requirement) => requirement.dependencyType === DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION,
                )
            ) {
                if (rider.riderDetails.brokerSelected) {
                    observableToReturn = this.addRidertoCart(event, rider.riderDetails, false);
                }
                this.isRiderDisabledList[i] = true;
                rider.riderDetails.disable = {
                    planDisable: true,
                    enrollmentRequirement: rider.riderDetails.enrollmentRequirements.find(
                        (req) => req.dependencyType === DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION,
                    ),
                };
            }
        });
        return observableToReturn;
    }
    /**
     * Search plan for enrollment requirements of type:
     * 1. Requires enrollment in another plan
     * 2. Requires non-enrollment in another plan
     * If plan is not disabled, remove previously added disabling details.
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    checkPlanEnrollmentRequirements(planOffering: PlanOfferingPanel): boolean {
        let disablePlan = false;
        const enrollRequirements = planOffering.enrollmentRequirements.filter(
            (req) => req.dependencyType === REQ_ENROLL_PLAN || req.dependencyType === REQ_NONENROLL_PLAN,
        );
        if (enrollRequirements.length) {
            disablePlan = enrollRequirements.some((requirement) => this.findEnrollmentRequirement(requirement, planOffering));
        }
        if (!disablePlan) {
            delete planOffering[REQ_PLAN_NAME];
            delete planOffering[REQ_PLAN_TYPE];
        }
        return disablePlan;
    }

    /**
     * Search either base plan or rider plan based on the requirement plan type
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean: boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    findEnrollmentRequirement(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        return requirement.relatedPlanType === BASE
            ? this.isBasePlanInCart(requirement, planOffering)
            : this.isRiderPlanInCart(requirement, planOffering);
    }

    /**
     * Search the base plans in the cart to check if the required planId for enrollment is in cart.
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    isBasePlanInCart(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        const basePlanOffering = this.allPlanOfferings.find((planOfr) => planOfr.plan.id === requirement.relatedPlanId);
        if (basePlanOffering) {
            const cartItem = this.cartItems.find((item) => item.planOfferingId === basePlanOffering.id);
            const enrollment = this.enrollments.find((enrolledPlan) => enrolledPlan.planOfferingId === basePlanOffering.id);
            let coverageLevelCheck: boolean;
            if (requirement.coverageLevels) {
                coverageLevelCheck = Boolean(
                    requirement.coverageLevels.find((coverage) => coverage.id === this.planOfferingObj.selectedCoverage.id),
                );
            }
            if (
                ((cartItem || enrollment) && requirement.dependencyType === REQ_NONENROLL_PLAN) ||
                (!(cartItem || enrollment) && requirement.dependencyType === REQ_ENROLL_PLAN && !coverageLevelCheck)
            ) {
                this.setLabelIfPlanDependency(requirement);
                return true;
            }
        }
        return false;
    }

    /**
     * @description: Function to set the toolTip on Plan dependency
     * @param requirement: Parameter to check the type of plan dependency
     */
    setLabelIfPlanDependency(requirement: EnrollmentRequirement): void {
        this.tooltipMsg =
            requirement.dependencyType === REQ_NONENROLL_PLAN
                ? this.language
                      .fetchSecondaryLanguageValue("secondary.portal.enrollment.requiresNonEnrollmentRider")
                      .replace("##planName##", requirement.relatedPlanName)
                : this.language
                      .fetchSecondaryLanguageValue("secondary.portal.enrollment.requiresEnrollmentRider")
                      .replace("##planName##", requirement.relatedPlanName);
    }

    /**
     * Search the riders in the cart items to check if the required planId for enrollment is in cart.
     * If rider is found, api call to get plan name is made which is used to display in the tooltip.
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    isRiderPlanInCart(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        const riderCoverage =
            (this.cartItems &&
                this.cartItems.some((item) =>
                    item.riders.some(
                        (riderItem) =>
                            riderItem?.planId === requirement.relatedPlanId &&
                            Boolean(requirement.coverageLevels.find((coverage) => riderItem.coverageLevelId === coverage.id)),
                    ),
                )) ||
            (this.enrollments &&
                this.enrollments.some((enrollment) =>
                    enrollment.riders.some(
                        (rider) =>
                            rider?.plan?.id === requirement.relatedPlanId &&
                            Boolean(requirement.coverageLevels.find((coverage) => rider.coverageLevel.id === coverage.id)),
                    ),
                ));
        if (riderCoverage && requirement.dependencyType === REQ_NONENROLL_PLAN) {
            this.setLabelIfPlanDependency(requirement);
            return true;
        }
        const planFound =
            (this.cartItems &&
                this.cartItems.some((item) =>
                    item.riders.some(
                        (riderItem) =>
                            riderItem.planId === requirement.relatedPlanId &&
                            Boolean(
                                requirement.coverageLevels.find((coverage) => this.planOfferingObj.selectedCoverage.id === coverage.id),
                            ),
                    ),
                )) ||
            (this.enrollments &&
                this.enrollments.some((enrollment) =>
                    enrollment.riders.some(
                        (rider) =>
                            rider.planId === requirement.relatedPlanId &&
                            Boolean(
                                requirement.coverageLevels.find((coverage) => this.planOfferingObj.selectedCoverage.id === coverage.id),
                            ),
                    ),
                ));
        if (
            (planFound && requirement.dependencyType === REQ_NONENROLL_PLAN) ||
            (!planFound && requirement.dependencyType === REQ_ENROLL_PLAN)
        ) {
            this.setLabelIfPlanDependency(requirement);
            return true;
        }
        return false;
    }

    /**
     * @description Function checks for rider enrollment requirements
     * @param rider {PlanOfferingPanel} each individual rider from the list of riders
     * @param riders {PlanOfferingPanel[]} All available riders
     * @returns {boolean} whether the rider should be disabled or not
     */
    checkRiderEligibility(rider: PlanOfferingPanel, riders: PlanOfferingPanel[]): boolean {
        this.enrollments = this.store.selectSnapshot(EnrollmentState.GetEnrollments);
        if (rider.parentPlanId) {
            const baseRider: PlanOfferingPanel = riders.find((element) => element.plan.id === rider.parentPlanId);
            if (baseRider && !baseRider.inCart) {
                return true;
            }
        }
        return rider.enrollmentRequirements && rider.enrollmentRequirements.length ? this.checkPlanEnrollmentRequirements(rider) : false;
    }

    closeLoader(riderArray: any[]): void {
        this.isLoading = false;
        this.planOfferingObj.ridersData = [...riderArray];
        this.updateAmount.emit(this.planOfferingObj);
    }

    /**
     * Function to update rider plan amount
     * @param $event {PlanOfferingPricing}
     * @param riderPlanOff {PlanOfferingPanel}
     */
    updateAmountRider($event: PlanOfferingPricing, riderPlanOff: PlanOfferingPanel): void {
        riderPlanOff.selectedPricing = $event;
        this.planOfferingObj.ridersData.filter((x) => x.id === riderPlanOff.id)[0].selectedPricing = $event;
        const childRider = this.allRiderDetails.find((element) => element.riderDetails.parentPlanId === riderPlanOff.plan.id);
        if (childRider) {
            childRider.riderDetails.inCart = false;
            this.subscriptions.push(
                this.getChildRiderDetails(childRider.riderDetails, riderPlanOff.selectedPricing.benefitAmount).subscribe(),
            );
        }
        this.updateAmount.emit(this.planOfferingObj);
    }
    checkSections(dataList: any[]): void {
        this.isBenefitAmountSection = dataList[0].filter((x) => x.benefitAmount !== undefined).length > 0;
        if (dataList[1].filter((x) => x.eliminationPeriod !== undefined).length) {
            this.isEliminationPeriodSection = true;
            this.isCoverageLevelSection = false;
        } else {
            this.isCoverageLevelSection = true;
            this.isEliminationPeriodSection = false;
        }
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.planOfferingObj) {
            this.planOfferingObj = changes.planOfferingObj.currentValue;
            if (this.planOfferingObj.supplementary) {
                const enrollments = this.store.selectSnapshot(EnrollmentState.GetEnrollments);
                this.supplementaryBaseEnrollment = enrollments.find(
                    (enrollment) =>
                        enrollment.status === "APPROVED" &&
                        enrollment.plan.dependentPlanIds.some((x) => x === this.planOfferingObj.plan.id),
                );
            }
        }
        if (changes.baseCoverageLevel) {
            this.getAllDataForRiders();
        }
    }

    /**
     * Method to set pricing for riders
     * @param data: PlanOfferingPricing[]
     * @param plan {PlanOfferingPanel}
     * @returns planOfferingPricing
     */
    getDefaultPricing(data: PlanOfferingPricing[], plan: PlanOfferingPanel): PlanOfferingPricing {
        let lowestPrice = null;
        if (data && data.length) {
            const baseCoverageId = this.planOfferingObj.selectedCoverage ? this.planOfferingObj.selectedCoverage.id : null;
            lowestPrice = data.find((x) => x.coverageLevelId === baseCoverageId);
            if (!lowestPrice) {
                lowestPrice = data.find((price) => plan.coverageLevel.some((coverageLevel) => coverageLevel.id === price.coverageLevelId));
                if (!lowestPrice) {
                    lowestPrice = data[0];
                }
            }
            data.forEach((element1) => {
                if (baseCoverageId === element1.coverageLevelId && lowestPrice.memberCost > element1.memberCost) {
                    lowestPrice = element1;
                }
            });
        }
        return lowestPrice;
    }
    showPlanDetailsPopup(planOffering: PlanOfferingPanel): void {
        this.dialog.open(PlanDetailsComponent, {
            data: {
                planId: planOffering.plan.id,
                planName: planOffering.plan.name,
                states: [
                    {
                        abbreviation: this.enrollmentState,
                    },
                ],
                mpGroup: this.mpGroup,
                isRider: true,
            },
        });
    }
    /**
     * Method to add rider to cart
     * @param $event: HTMLInputElement
     * @param rider: PlanOfferingPanel
     * @param updateAmount: boolean, default: true. Emits the plan cost to parent component when true.
     * @returns PlanOfferingPricing array with coverage level and pricing api calls
     */
    addRidertoCart(
        $event: HTMLInputElement,
        rider: PlanOfferingPanel,
        updateAmount: boolean = true,
    ): Observable<[PlanOfferingPricing[], CoverageLevel[]]> {
        let observableToReturn: Observable<[PlanOfferingPricing[], CoverageLevel[]]>;
        if ($event.checked) {
            if (rider.selectedPricing === null) {
                let tempPrice = rider.planPricing[0];
                rider.planPricing.forEach((ele) => {
                    if (tempPrice.memberCost > ele.memberCost) {
                        tempPrice = ele;
                    }
                });
                rider.selectedPricing = tempPrice;
            }

            rider.inCart = true;
            if (!rider.selectedPricing) {
                rider.selectedPricing = rider.planPricing[0];
                rider.planPricing.forEach((elementq) => {
                    if (rider.selectedPricing.totalCost > elementq.totalCost) {
                        rider.selectedPricing = elementq;
                    }
                });
            }
        } else {
            rider.inCart = false;
            rider.selectedPricing = this.getDefaultPricing(rider.planPricing, rider);
        }
        const childRider = this.allRiderDetails.find((element) => element.riderDetails.parentPlanId === rider.plan.id);
        const inCartRiders = this.allRiderDetails
            .filter((riderDetails) => riderDetails.riderDetails.inCart)
            .map((inCart) => inCart.riderDetails.plan.id);
        rider.selectedCoverage = rider.coverageLevel.find((x) => x.id === rider.selectedPricing.coverageLevelId);
        if (childRider) {
            childRider.riderDetails.inCart = false;
            observableToReturn = this.getChildRiderDetails(childRider.riderDetails, rider.selectedPricing.benefitAmount);
        }
        const dependantRiderDetails = this.allRiderDetails.find(
            (element) => element.riderDetails.enrollmentRequirements.length && element.disable,
        );
        // If we select dependent riders then required rider will be auto selected
        if (dependantRiderDetails) {
            const dependantRider = dependantRiderDetails.riderDetails.enrollmentRequirements.reduce((acc, curr) => {
                acc.push(curr.relatedPlanId);
                return acc;
            }, []);
            dependantRiderDetails.riderDetails.inCart = !dependantRider.some((dependant) => !inCartRiders.includes(dependant));
        }
        const riderArray = [...this.planOfferingObj.ridersData];
        riderArray.forEach((erider, $index) => {
            if (erider.id === rider.id) {
                riderArray[$index] = rider;
            }
        });
        this.planOfferingObj.ridersData = [...riderArray];
        if (updateAmount) {
            this.updateAmount.emit(this.planOfferingObj);
        }
        return observableToReturn;
    }
    /**
     * Determine if the rider plan has single or multiple plan pricing for base plan coverage level
     * @param riderData {PlanOfferingPanel}
     * @returns Boolean: true if the rider has multiple plan pricing for the base plan coverage level
     */
    getBenefitRiderPlans(riderData: PlanOfferingPanel): boolean {
        const selectedRider: PlanOfferingPanel = this.planOfferingObj.ridersData.find((rider) => rider.id === riderData.id);
        if (!selectedRider || !selectedRider.planPricing) {
            return false;
        }
        return selectedRider.planPricing.filter(
            (planPrice) => planPrice.coverageLevelId === this.planOfferingObj.selectedPricing.coverageLevelId,
        ).length > 1
            ? true
            : (this.getRiderAmountForSinglePricing(riderData), false);
    }

    /**
     * Displaying pricing amount for single rider plan
     * @param {PlanOfferingPanel} riderDetails
     */
    getRiderAmountForSinglePricing(riderData: PlanOfferingPanel): void {
        const riderDataValue = this.planOfferingObj.ridersData.find((rider) => rider.id === riderData.id);
        if (riderDataValue) {
            if (!riderDataValue.selectedPricing) {
                riderDataValue.selectedPricing = this.getDefaultPricing(riderDataValue.planPricing, riderDataValue);
            }
            this.riderBenefitAmt = riderDataValue.selectedPricing.benefitAmount;
        }
        this.riderBenefitAmt = riderDataValue.selectedPricing.benefitAmount;
    }

    isRiderExist(rider: PlanOfferingPanel): boolean {
        let flag = false;
        if (this.allRiderDetails && this.allRiderDetails.length) {
            const d = this.allRiderDetails.find((x) => x.riderDetails.id === rider.id);
            if (d) {
                flag = true;
            }
        }
        return flag;
    }
    checkforHasBenefits(rider: PlanOfferingPanel): boolean {
        return rider.planPricing.filter((x) => x.benefitAmount).length > 1;
    }

    /**
     * Function to sort the riders based on id
     * @param allRiderDetails
     * @returns array of PlanOfferingPanel
     */
    orderById(allRiderDetails: any[]): PlanOfferingPanel[] {
        return allRiderDetails.sort((x, y) => (x.id > y.id ? y : x));
    }
    /**
     * To check whether rider has single benefit amount
     */
    checkForSinglePricing(rider: PlanOfferingPanel): boolean {
        let flag = false;
        for (const cLevel of rider.coverageLevel) {
            const count = rider.planPricing.filter((pricing) => pricing.coverageLevelId === cLevel.id).length;
            if (count > 1) {
                break;
            }
            if (count === 1) {
                flag = true;
            }
        }
        return flag;
    }

    /**
     * Function to get child rider details
     * @param childRider {PlanOfferingPanel}
     * @param baseBenefitAmount {number}
     * @returns Planofferingpricing array with coverage level and pricing api calls
     */
    getChildRiderDetails(childRider: PlanOfferingPanel, baseBenefitAmount: number): Observable<[PlanOfferingPricing[], CoverageLevel[]]> {
        return forkJoin([
            this.shpService.getPlanOfferingPricing(
                childRider.id.toString(),
                this.enrollmentState,
                null,
                this.store.selectSnapshot(EnrollmentState.GetMemberId),
                this.store.selectSnapshot(EnrollmentState.GetMPGroup),
                childRider.parentPlanId,
                childRider.parentPlanCoverageLevelId,
                baseBenefitAmount,
            ),
            this.coreService.getCoverageLevels(
                childRider.plan.id.toString(),
                this.planOfferingObj.selectedPricing.coverageLevelId,
                this.planOfferingObj.supplementary,
            ),
        ]).pipe(
            take(1),
            tap(([planPricing, coverageLevels]) => {
                if (planPricing) {
                    childRider.planPricing = planPricing;
                }
                if (coverageLevels) {
                    childRider.coverageLevel = this.planOfferingObj.supplementary
                        ? coverageLevels.filter((coverage) => coverage.retainCoverageLevel)
                        : coverageLevels;
                }
                this.checkSections([planPricing, coverageLevels]);
                childRider.isCoverageSection = this.isCoverageLevelSection;
                childRider.isBenefitAmountSection = this.isBenefitAmountSection;
                childRider.isEliminationPeriodSection = this.isEliminationPeriodSection;
                if (
                    childRider.inCart &&
                    childRider.selectedPricing &&
                    childRider.planPricing.findIndex((x) => x.coverageLevelId === childRider.selectedPricing.coverageLevelId) === -1
                ) {
                    childRider.inCart = false;
                    childRider.selectedPricing = this.getDefaultPricing(childRider.planPricing, childRider);
                }
                if (!childRider.inCart) {
                    childRider.selectedPricing = this.getDefaultPricing(childRider.planPricing, childRider);
                }
                Object.defineProperty(childRider, STR_SINGLE_BENEFIT, {
                    value: this.checkForSinglePricing(childRider),
                    writable: true,
                });
                if (!this.isRiderExist(childRider) && childRider.planPricing.length > 0) {
                    this.allRiderDetails.push({
                        riders: true,
                        riderDetails: childRider,
                        disable: this.checkRiderEligibility(childRider, this.planOfferingObj.ridersData),
                    });
                }
                this.isLoading = false;
                const childIndex = this.planOfferingObj.ridersData.findIndex((rider) => rider.id === childRider.id);
                if (childIndex !== -1) {
                    this.planOfferingObj.ridersData[childIndex] = childRider;
                }
                this.updateAmount.emit(this.planOfferingObj);
            }),
            catchError(() => {
                this.isLoading = false;
                const childIndex = this.planOfferingObj.ridersData.findIndex((rider) => rider.id === childRider.id);
                if (childIndex !== -1) {
                    this.planOfferingObj.ridersData[childIndex] = childRider;
                }
                this.updateAmount.emit(this.planOfferingObj);
                return of(null);
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
