import { UtilService } from "../../state-services/util.service";
import { Injectable, OnDestroy } from "@angular/core";
import {
    GetShoppingCart,
    ShoppingService,
    ShoppingCartDisplayService,
    DependentAge,
    ApplicationStatusTypes,
    TableTags,
    STATUS,
    EnrollmentStatusType,
    ReinstatementType,
    AccountDetails,
} from "@empowered/api";
import { BehaviorSubject, Subject, forkJoin, Observable, of } from "rxjs";
import { Store } from "@ngxs/store";
import { SetAllPlanOfferings, SetProductPlanData, SetIsOpenEnrollment, SetQLE, SetErrorForShop } from "../../enrollment";
import { LanguageService } from "@empowered/language";
import { Router, ActivatedRoute } from "@angular/router";
import { ShopCartService } from "../../services/shop-cart/shop-cart.service";
import { DatePipe } from "@angular/common";

import {
    CarrierId,
    DateFormats,
    ConfigName,
    DateInfo,
    ProductId,
    EnrollmentMethod,
    ApiError,
    RiskClass,
    AppSettings,
    CoverageLevelNames,
    GroupAttribute,
    Characteristics,
    RatingCode,
    RiderCart,
    AddCartItem,
    MissingInfoType,
    TaxStatus,
    CoverageLevel,
    PolicyOwnershipType,
    EnrollmentRequirement,
    PlanOffering,
    ProductOffering,
    GetCartItems,
    ProducerCredential,
    Enrollments,
    MemberFlexDollar,
    DependencyTypes,
    DisableType,
    PlanOfferingPanel,
    TableModel,
    StatusType,
    MemberQualifyingEvent,
    PlanYear,
    ProductOfferingPanel,
    StepType,
    VasFunding,
} from "@empowered/constants";
import { takeUntil, mergeMap, switchMap, filter, catchError } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";
import { AccountListState } from "../../account-list/account-list.state";
import { DualPlanYearState } from "../../dual-plan-year/";
import { EnrollmentMethodModel, EnrollmentMethodState } from "../../enrollment-method";
import { StaticUtilService } from "../../state-services/static-util.service";
import { ApplicationStatusService } from "../../state-services/application-status.service";

interface EnrollmentData {
    enrollmentStateAbbr: string;
    enrollmentMethod: string;
}
interface JobClass {
    id: number;
    name: string;
    productId?: number;
}
const DECLINED_COVERAGE_ID = 2;
const DECIMAL_POINTS = 2;
const PERCENTAGE = 100;
const INDIVIDUAL_COVERAGE_ID = 1;

@Injectable({
    providedIn: "root",
})
export class QuoteShopHelperService implements OnDestroy {
    private readonly occupationClass$ = new BehaviorSubject<RiskClass>(null);
    currentOccupationClass = this.occupationClass$.asObservable();
    reinstateUpdate$ = new Subject<ProductOffering>(); // Used in enrolled-details component
    updateMandatoryReinstate = new Subject<boolean>(); // Used in enrollment and Plans display component
    private readonly selectedProductOfferingIndex$ = new BehaviorSubject<number>(0);
    currentSelectedProductOfferingIndex = this.selectedProductOfferingIndex$.asObservable();
    private readonly selectedPlanIndex$ = new BehaviorSubject<number>(0);
    currentSelectedPlanIndex = this.selectedPlanIndex$.asObservable();
    private benefitAmountChange$ = new BehaviorSubject<any>(null);
    onBenefitAmountChanges = this.benefitAmountChange$.asObservable();
    private selectedCoverageLevelChange$ = new BehaviorSubject<any>(null);
    onSelectedCoverageLevelChange = this.selectedCoverageLevelChange$.asObservable();
    private riderApply$ = new BehaviorSubject<any>(null);
    onRiderApply = this.riderApply$.asObservable();
    private readonly enrollmentData$ = new BehaviorSubject<EnrollmentData>(null);
    currentEnrollmentData = this.enrollmentData$.asObservable();
    private selectedJobClass$ = new BehaviorSubject<any>(null);
    currentSelectedJobClass = this.selectedJobClass$.asObservable();
    private readonly selectedAccidentJobClass$ = new BehaviorSubject<any>(null);
    currentSelectedAccidentJobClass = this.selectedAccidentJobClass$.asObservable();
    private readonly selectedStdJobClass$ = new BehaviorSubject<any>(null);
    currentSelectedStdJobClass = this.selectedStdJobClass$.asObservable();
    private readonly selectedDependentAge$ = new BehaviorSubject<DependentAge>(null);
    currentDependentAge = this.selectedDependentAge$.asObservable();
    private readonly closeAfterSelect$ = new BehaviorSubject<boolean>(null);
    productSideNavToggle$ = this.closeAfterSelect$.asObservable();
    private readonly unsubscribe$ = new Subject<void>();
    private readonly riderBenAmountChange$ = new BehaviorSubject<PlanOfferingPanel>(null);
    riderBenAmountChanged = this.riderBenAmountChange$.asObservable();
    private readonly maxDayDiff$ = new BehaviorSubject<number>(0);
    maxDayDiffValue = this.maxDayDiff$.asObservable();
    dependentPlanIds = [];
    buyUpPlan = [];
    isLoading = false;
    currentDate = this.dateService.addDays(new Date(), 1);
    today = new Date();
    aflacCarrierId = 1;
    NEXT_FIFTEENTH_OF_MONTH_DATE = 15;
    DAY_AFTER = "DAY_AFTER";
    NEXT_FIRST_OF_MONTH = "NEXT_FIRST_OF_MONTH";
    NEXT_FIRST_OR_FIFTEENTH_OF_MONTH = "NEXT_FIRST_OR_FIFTEENTH_OF_MONTH";
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.coverage.declined",
        "primary.portal.coverage.Pendingcustomersignature",
        "primary.portal.coverage.approved",
        "primary.portal.coverage.Ended",
        "primary.portal.coverage.Pendingcarrierapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.PendingPDAcompletion",
        "primary.portal.coverage.Pending3rdpartyapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.Applicationdenied",
        "primary.portal.coverage.Lapsed",
        "primary.portal.editCoverage.void",
    ]);
    memberId: any;
    mpGroup: number;
    currentEnrollmentObj: EnrollmentMethodModel;
    initialCoverage: string;
    coverageEndDateCarriers: string[] = [];
    isPlanDisableConfig = false;
    customSingleCvgDate: { date: string; oldPlans: ProductOfferingPanel[]; oldCoverageData: ProductOfferingPanel[] };
    customMultipleCvgDate: ProductOfferingPanel[];
    constructor(
        private readonly store: Store,
        private readonly util: UtilService,
        private readonly language: LanguageService,
        private readonly shoppingService: ShoppingService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly shopCartService: ShopCartService,
        private readonly datePipe: DatePipe,
        private readonly userService: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly applicationStatusService: ApplicationStatusService,
        private readonly dateService: DateService,
    ) {
        this.staticUtilService
            .cacheConfigValue(ConfigName.COVERAGE_END_DATE_CARRIERS)
            .pipe(filter((id) => id && id.length > 0))
            .subscribe((carrierIds) => (this.coverageEndDateCarriers = carrierIds.split(",")));
    }

    changeSelectedJobClass(jobClass: JobClass): void {
        this.selectedJobClass$.next(jobClass);
    }
    /**
     * Selected accident job class
     * @param jobClass Job class value
     */
    changeSelectedAccidentJobClass(jobClass: JobClass): void {
        this.selectedAccidentJobClass$.next(jobClass);
    }
    /**
     * Selected short term disability job class
     * @param jobClass Job class value
     */
    changeSelectedStdJobClass(jobClass: JobClass): void {
        this.selectedStdJobClass$.next(jobClass);
    }
    changeEnrollmentData(newEnrollmentData: EnrollmentData): void {
        this.enrollmentData$.next(newEnrollmentData);
    }
    changeSelectedProductOfferingIndex(newProductOfferingIndex: number): void {
        this.selectedProductOfferingIndex$.next(newProductOfferingIndex);
    }
    currentOccupationClassData(riskClassData: RiskClass): void {
        this.occupationClass$.next(riskClassData);
    }
    riderApply(data: any): void {
        this.riderApply$.next(data);
    }
    benefitAmountChange(data: any): void {
        this.benefitAmountChange$.next(data);
    }
    selectedCoverageLevelChange(data: any): void {
        this.selectedCoverageLevelChange$.next(data);
    }
    changeSelectedPlanIndex(newPlanIndex: number): void {
        this.selectedPlanIndex$.next(newPlanIndex);
    }
    resetSelectedPlanIndex(): void {
        this.selectedPlanIndex$.next(0);
    }
    changeDependentAge(changeDependent: DependentAge): void {
        this.selectedDependentAge$.next(changeDependent);
    }

    /**
     * On base benefit amount change riders dependent benefit amount change
     * @param plan base plan
     */
    onRiderBenAmountChange(plan: PlanOfferingPanel): void {
        this.riderBenAmountChange$.next(plan);
    }
    /**
     *
     * @description subject to collapse product side-nav drop down for smaller screens
     * @param data returns true/false
     * @memberof QuoteShopHelperService
     */
    closeAfterSelect(data: boolean): void {
        this.closeAfterSelect$.next(data);
    }

    /**
     * Checks if rider is selected by broker in carrier form
     * @param rider
     * @returns riderSelected by broker in carrier form
     */
    riderBrokerSelected(rider: PlanOfferingPanel): boolean {
        if (
            rider.enrollmentRequirements &&
            rider.enrollmentRequirements.length &&
            rider.enrollmentRequirements.find((enrq) => enrq.dependencyType === DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION.toString())
        ) {
            return rider.brokerSelected;
        }
        return false;
    }
    /**
     * Method to check if the shopping cart needs to be cleared.
     * Clear Shopping cart when there is a change in the enrollment method and enrollment state for the following types of plans :
     * 1. Aflac Group
     * 2. Plan Type = INDIVIDUAL
     * Not called for the following types of plans :
     * 1. Company provided
     * 2. Declined plans
     * 3. Plan Type = GROUP
     * @param cartItems Items present in the cart
     * @param planOfferings plans offered in the group
     * @returns {boolean} eligible for clear shopping cart
     */
    clearShoppingCartCheck(cartItems: GetCartItems[], planOfferings: PlanOffering[]): boolean {
        return cartItems
            .filter((cartItem) => cartItem.coverageLevelId !== DECLINED_COVERAGE_ID)
            .some(
                (item) =>
                    this.currentEnrollmentObj &&
                    (item.enrollmentMethod !== this.currentEnrollmentObj.enrollmentMethod ||
                        item.enrollmentState !== this.currentEnrollmentObj.enrollmentStateAbbreviation),
            );
    }
    /**
     * dispatches SetProductPlanData action to update data
     */
    setProductPlanData(): void {
        this.store.dispatch(
            new SetProductPlanData({
                mpGroup: this.mpGroup,
                selectedMethod: this.currentEnrollmentObj.enrollmentMethod,
                selectedState: this.currentEnrollmentObj.enrollmentStateAbbreviation,
                memberId: this.memberId,
            }),
        );
    }
    /**
     * Function used to return the product plan list based on various conditions
     * @param productOfferings : products that are being offered
     * @param planOfferings : plans that are being offered
     * @param shoppingCart : shopping cart data
     * @param cartItems : items that are in the cart
     * @param enrollments : enrollments
     * @param singleCoverageDate : same coverage date that applies to all products
     * @param multipleCoverageDate : various dates that have been applied for the various products
     * @param qualifyingEvents : member qualifying events
     * @param planYears : Plan years
     * @param groupAttributes: Group attributes to get the earliest coverage date
     * @param stateOrMethodChange: Boolean value to check whether the state or method has been changed
     * @param mpGroup: mp group
     * @returns productPlanList
     */
    getProductPlanModelData(
        productOfferings: ProductOffering[],
        planOfferings: PlanOffering[],
        shoppingCart: GetShoppingCart,
        cartItems: GetCartItems[],
        enrollments: Enrollments[],
        singleCoverageDate: { date: string; oldPlans: ProductOfferingPanel[]; oldCoverageData: ProductOfferingPanel[] },
        multipleCoverageDate: ProductOfferingPanel[],
        qualifyingEvents: MemberQualifyingEvent[],
        planYears: PlanYear[],
        groupAttributes: GroupAttribute[],
        stateOrMethodChange: boolean = false,
        mpGroup: number,
        memberDataId: number,
    ): ProductOfferingPanel[] {
        const allEnrollments = [...enrollments];
        let callCenter8x8TransmittalDisabilityMinEmployees;
        this.staticUtilService
            .cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((minimumEmployeeCount: string) => (callCenter8x8TransmittalDisabilityMinEmployees = +minimumEmployeeCount));
        enrollments = enrollments
            .filter((enrollment) => enrollment.coverageLevel.id !== DECLINED_COVERAGE_ID)
            .filter((enrollment) => enrollment.status !== EnrollmentStatusType.DENIED);
        cartItems = cartItems.filter((cartItem) => cartItem.applicationType !== StepType.REINSTATEMENT);
        this.currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        const mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentMethodState.getUniqueMemberId) || memberDataId;
        if (mpGroupObj && this.router.url.indexOf("payroll") >= 0) {
            this.mpGroup = mpGroupObj.id;
        } else if (this.currentEnrollmentObj) {
            this.mpGroup = this.currentEnrollmentObj.mpGroup;
        } else {
            this.mpGroup = this.route.snapshot.params.mpGroupId;
        }
        if (!this.mpGroup) {
            this.mpGroup = mpGroup;
        }
        this.store.dispatch(new SetIsOpenEnrollment(this.mpGroup, false, true));
        this.store.dispatch(new SetQLE(this.memberId, this.mpGroup));
        if (!this.store.selectSnapshot(DualPlanYearState).isDualPlanYear && !qualifyingEvents) {
            this.removeEnrollEndedCartItems(cartItems, planOfferings, planYears);
        }
        const filteredCartItems: GetCartItems[] = cartItems
            .filter((cartItem) => cartItem.coverageLevelId !== DECLINED_COVERAGE_ID)
            .filter((item) => {
                const companyPlanInCart = planOfferings.find(
                    (planOffering) =>
                        planOffering.id === item.planOfferingId &&
                        !planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED),
                );
                if (companyPlanInCart) {
                    return companyPlanInCart.id === item.planOfferingId;
                }
                return undefined;
            });

        if (stateOrMethodChange) {
            const companyProvidedCartItems: GetCartItems[] = cartItems
                .filter((cartItem) => cartItem.coverageLevelId !== DECLINED_COVERAGE_ID)
                .filter((item) => {
                    const companyPlanInCart = planOfferings.find((planOffering) => this.isCompanyProvidedPlan(planOffering, item));
                    return companyPlanInCart && companyPlanInCart.id === item.planOfferingId;
                });
            this.userService.credential$
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((credential: ProducerCredential) => {
                        const observableList: Observable<HttpResponse<unknown>>[] = [];
                        companyProvidedCartItems.forEach((plan) => {
                            const cartObject: AddCartItem = {
                                ...plan,
                                acknowledged: true,
                                enrollmentMethod: this.currentEnrollmentObj.enrollmentMethod as EnrollmentMethod,
                                assistingAdminId:
                                    this.currentEnrollmentObj.enrollmentMethod !== EnrollmentMethod.SELF_SERVICE
                                        ? credential.producerId || credential.adminId || null
                                        : null,
                            };
                            if (cartObject.enrollmentMethod === EnrollmentMethod.FACE_TO_FACE) {
                                cartObject.enrollmentState = this.currentEnrollmentObj.enrollmentStateAbbreviation;
                                cartObject.enrollmentCity = this.currentEnrollmentObj?.enrollmentCity;
                            }
                            observableList.push(this.shoppingService.updateCartItem(this.memberId, this.mpGroup, plan.id, cartObject));
                        });
                        return forkJoin(observableList);
                    }),
                )
                .subscribe();
        }
        // There is scenario where stateOrMethodChange comes as undefined in this case setting value as default "true"
        stateOrMethodChange = stateOrMethodChange ? stateOrMethodChange : true;
        const deleteCartItems: Observable<HttpResponse<void>>[] = this.getDeleteCartItems(
            enrollments,
            planOfferings,
            cartItems,
            this.memberId,
            this.mpGroup,
        );
        const isDualPlanYear: boolean = this.store.selectSnapshot(DualPlanYearState).isDualPlanYear;
        const pyId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        if (this.clearShoppingCartCheck(filteredCartItems, planOfferings) && !shoppingCart.locked) {
            this.shopCartService.displaySpinner({ isLoading: true });
            this.shoppingService
                .clearShoppingCart(this.memberId, this.mpGroup, stateOrMethodChange)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(() => {
                        this.setProductPlanData();
                        return this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, pyId).pipe(
                            catchError((error) => {
                                if (error.error) {
                                    this.dispatchApiError(error.error);
                                }
                                return of(null);
                            }),
                        );
                    }),
                )
                .subscribe((res) => {
                    this.shoppingCartService.setShoppingCart(res);
                });
        } else if (deleteCartItems && deleteCartItems.length) {
            forkJoin(deleteCartItems)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((resp) => {
                        this.setProductPlanData();
                        return this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, pyId).pipe(
                            catchError((error) => {
                                if (error.error) {
                                    this.dispatchApiError(error.error);
                                }
                                return of(null);
                            }),
                        );
                    }),
                )
                .subscribe((res) => {
                    this.shoppingCartService.setShoppingCart(res);
                });
        } else {
            let productPlanList: ProductOfferingPanel[] = [];
            productOfferings.forEach((product) => {
                const qualifyEvents = qualifyingEvents;
                const inCartProductStatus = Boolean(
                    shoppingCart.productOfferingsInCart.find((productOfferingId) => productOfferingId === product.id),
                );
                const declinedEnrollment = allEnrollments.find(
                    (plan) =>
                        plan.plan.productId === product.product.id &&
                        plan.coverageLevel.id === DECLINED_COVERAGE_ID &&
                        plan.plan.characteristics.includes(Characteristics.DECLINE),
                );
                const declineProductStatus =
                    Boolean(shoppingCart.productOfferingsDeclined.find((productOfferingId) => productOfferingId === product.id)) ||
                    (declinedEnrollment ? declinedEnrollment.plan.productId === product.product.id : false);

                productPlanList.push({
                    ...product,
                    planOfferings: [],
                    inCart: inCartProductStatus,
                    declined: declineProductStatus,
                    locked: shoppingCart.locked,
                    lockedBy: shoppingCart.lockedBy,
                    qualifyingEvents: qualifyEvents,
                });
            });

            const planOfferingList: PlanOfferingPanel[] = [...planOfferings];
            enrollments.forEach((enrollment) => {
                enrollment.status = this.languageStrings[this.applicationStatusService.convert(enrollment)];
                if (
                    enrollment.status === ApplicationStatusTypes.Approved ||
                    enrollment.status === ApplicationStatusTypes.Lapsed ||
                    enrollment.status.startsWith(ApplicationStatusTypes.Pending)
                ) {
                    if (
                        enrollment.status === ApplicationStatusTypes.Approved ||
                        enrollment.status.startsWith(ApplicationStatusTypes.Pending)
                    ) {
                        enrollment.status =
                            this.dateService.toDate(enrollment.validity.effectiveStarting) > new Date() ||
                            enrollment.status.startsWith(ApplicationStatusTypes.Pending)
                                ? ApplicationStatusTypes.Enrolled
                                : ApplicationStatusTypes.Active;
                    }
                    if (
                        enrollment.coverageLevel.name === CoverageLevelNames.ENROLLED_COVERAGE ||
                        enrollment.coverageLevel.id === INDIVIDUAL_COVERAGE_ID
                    ) {
                        enrollment.coverageLevel.name = CoverageLevelNames.INDIVIDUAL_COVERAGE;
                    }
                    const enrolledPlanIndex: number = planOfferingList.findIndex(
                        (planOffering) =>
                            (((planOffering.plan.carrierId === CarrierId.AFLAC ||
                                (this.coverageEndDateCarriers.includes(planOffering.plan.carrierId.toString()) &&
                                    (!planOffering.plan.vasFunding || planOffering.plan.vasFunding === VasFunding.EMPLOYER))) &&
                                planOffering.plan.id === enrollment.plan.id) ||
                                planOffering.id === enrollment.planOfferingId) &&
                            !planOffering.enrollment,
                    );
                    if (enrolledPlanIndex > -1) {
                        if (planOfferingList[enrolledPlanIndex].plan.characteristics.includes(Characteristics.STACKABLE)) {
                            const newStackedPlan: PlanOfferingPanel = this.util.copy(planOfferingList[enrolledPlanIndex]);
                            planOfferingList.splice(enrolledPlanIndex + 1, 0, newStackedPlan);
                        }
                        if (
                            enrollment.reinstatement === ReinstatementType.OPTIONAL &&
                            this.dateService.isBefore(this.dateService.toDate(enrollment.reinstatementPeriodEndDate))
                        ) {
                            const optionalReinstatePlan: PlanOfferingPanel = this.util.copy(planOfferingList[enrolledPlanIndex]);
                            planOfferingList[enrolledPlanIndex].hasDuplicatePlan = true;
                            optionalReinstatePlan.enrollment = undefined;
                            optionalReinstatePlan.reistateEndedPlan = false;
                            planOfferingList.splice(enrolledPlanIndex + 1, 0, optionalReinstatePlan);
                        }
                        planOfferingList[enrolledPlanIndex].reistateEndedPlan = true;
                        planOfferingList[enrolledPlanIndex].enrollment = enrollment;
                    }
                }
            });
            cartItems.forEach((cartItem) => {
                const inCartPlanIndex = planOfferingList.findIndex(
                    (planOffering) =>
                        planOffering.id === cartItem.planOfferingId &&
                        (planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                            (!planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) && !planOffering.cartItem)) &&
                        !planOffering.hasDuplicatePlan &&
                        cartItem.coverageLevelId !== DECLINED_COVERAGE_ID,
                );
                if (inCartPlanIndex > -1) {
                    if (planOfferingList[inCartPlanIndex].plan.characteristics.includes(Characteristics.STACKABLE)) {
                        const newStackedPlan = this.util.copy(planOfferingList[inCartPlanIndex]);
                        planOfferingList.splice(inCartPlanIndex + 1, 0, newStackedPlan);
                    }
                    planOfferingList[inCartPlanIndex].cartItem = cartItem;
                    planOfferingList[inCartPlanIndex].inCart = true;
                }
            });
            const hasSTDPlansWithMissingSalary = planOfferingList
                .filter((x) => x.plan.product.id === ProductId.SHORT_TERM_DISABILITY)
                .some((y) => y.missingInformation === MissingInfoType.SALARY);

            planOfferingList.forEach((planDetail) => {
                const productOffering = productPlanList.find((product) => product.product.id === planDetail.plan.product.id);
                const isSTDPlanWithMissingSalary =
                    hasSTDPlansWithMissingSalary && planDetail.plan.product.id === ProductId.SHORT_TERM_DISABILITY;
                if (planDetail.missingInformation || isSTDPlanWithMissingSalary) {
                    planDetail.disable = {
                        planDisable: true,
                        spouseDisable: false,
                        type: DisableType.MISSING_INFO,
                        message: isSTDPlanWithMissingSalary ? MissingInfoType.SALARY : planDetail.missingInformation,
                    };
                } else if (
                    // STD conditions
                    productOffering &&
                    productOffering.disableSTDProductForVCC
                ) {
                    planDetail.disable = {
                        planDisable: true,
                        type: DisableType.VCC_DISABILITY_DEPENDENCY,
                    };
                } else {
                    planDetail.disable = { planDisable: false, spouseDisable: false };
                }

                planDetail.stackable = planDetail.plan.characteristics.includes(Characteristics.STACKABLE);
                planDetail.companyProvided = planDetail.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED);
                planDetail.vasPlan = planDetail.plan.vasFunding !== undefined;
                planDetail.autoEnroll = planDetail.plan.characteristics.includes(Characteristics.AUTOENROLLABLE);
                planDetail.reinstateEnded =
                    planDetail.enrollment &&
                    this.dateService.isBefore(this.dateService.toDate(planDetail.enrollment.reinstatementPeriodEndDate), new Date());
                planDetail.editCoverage = !planDetail.reinstateEnded && planDetail.enrollment && planDetail.inCart;
                planOfferingList.forEach((newPlan) => {
                    if (newPlan.plan.dependentPlanIds.includes(planDetail.plan.id)) {
                        newPlan.buyUp = { show: true, childPlanId: planDetail.id };
                    } else {
                        newPlan.buyUp = newPlan.buyUp && newPlan.buyUp.show ? newPlan.buyUp : { show: false, childPlanId: null };
                    }
                });
            });
            let filteredArray = [...planOfferingList];
            planOfferingList.forEach((plan) => {
                if (plan.buyUp.show && !(plan.enrollment && plan.enrollment.policyNumber)) {
                    const childBuyUp = filteredArray.findIndex((x) => x.id === plan.buyUp.childPlanId);
                    if (childBuyUp > -1) {
                        filteredArray.splice(childBuyUp, 1);
                    }
                }
            });

            // Code to filter out Buy Up Plans when no Parent Plans / Enrollments are present
            if (!allEnrollments.length) {
                filteredArray = filteredArray.filter(
                    (planOffering) =>
                        planOffering.plan.characteristics.length === 0 ||
                        planOffering.plan.characteristics.some((characteristics) => characteristics !== Characteristics.SUPPLEMENTARY),
                );
            }

            productPlanList.forEach((productPlan) => {
                const productPlanOfferings = filteredArray.filter((planOffering) => planOffering.productOfferingId === productPlan.id);
                productPlan.planOfferings = this.sortPlanOfferings(productPlanOfferings);
                if (productPlan.planOfferings.some((plan) => plan.companyProvided)) {
                    productPlan.companyProvided = true;
                }
                if (
                    productPlan.planOfferings.some(
                        (plan) => plan.plan.carrierId === this.aflacCarrierId || plan.plan.carrierId === CarrierId.AFLAC_GROUP,
                    )
                ) {
                    productPlan.isAflac = true;
                }
            });
            productPlanList = productPlanList.filter((productPlan) => productPlan.planOfferings.length);
            productPlanList.forEach((productPlan) => {
                productPlan.disable = {};
                productPlan.genericDisable = productPlan.planOfferings.every(
                    (plan) =>
                        plan.disable.planDisable &&
                        plan.disable.type === DisableType.MISSING_INFO &&
                        plan.missingInformation === MissingInfoType.CARRIER_APPOINTMENT,
                );
                productPlan.disable.status = productPlan.planOfferings.every(
                    (plan) => plan.disable.planDisable && plan.disable.type === DisableType.MISSING_INFO,
                );
                productPlan.disable.message =
                    productPlan.disable && productPlan.disable.status ? productPlan.planOfferings[0].disable.message : null;
            });
            const grandFatheredEnrollments = enrollments.filter(
                (enrollment) =>
                    enrollment.carrierStatus !== EnrollmentStatusType.TERMINATED &&
                    (enrollment.plan.sunsetDate ||
                        (!(
                            this.coverageEndDateCarriers.includes(enrollment.plan.carrierId.toString()) &&
                            enrollment.plan.enrollable &&
                            (!enrollment.plan.vasFunding || enrollment.plan.vasFunding === VasFunding.EMPLOYER)
                        ) &&
                            !planOfferings.find(
                                (plan) =>
                                    (plan.plan.carrierId === CarrierId.AFLAC && plan.plan.id === enrollment.plan.id) ||
                                    plan.id === enrollment.planOfferingId,
                            ))),
            );
            productPlanList.forEach((productPlan, index) => {
                const py2 = this.store.selectSnapshot(DualPlanYearState).oeYear;
                const oeShop: boolean = this.store.selectSnapshot(DualPlanYearState).isOEShop;
                const qleShop: boolean = this.store.selectSnapshot(DualPlanYearState).isQLEShop;
                const productIndex = grandFatheredEnrollments.findIndex(
                    (enrollment) => enrollment.plan.productId === productPlan.product.id,
                );
                grandFatheredEnrollments.forEach((enrollment) => {
                    productPlan.newPlan = productPlan.planOfferings.some(
                        (plan) =>
                            enrollment.plan.id === plan.plan.id &&
                            plan.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL &&
                            plan.taxStatus === TaxStatus.POSTTAX,
                    );
                });
                let grandfatheredPlans: PlanOfferingPanel;
                // To check if the enrollment id is same for grandfather enrollment and the enrollment intact with plan offerings
                const isSameEnrollmentId =
                    productIndex > -1 &&
                    productPlan.planOfferings?.some(
                        (planOffering) =>
                            planOffering.id === grandFatheredEnrollments[productIndex]?.planOfferingId &&
                            planOffering.enrollment?.id === grandFatheredEnrollments[productIndex].id,
                    );
                if (productIndex > -1 && isDualPlanYear && !productPlan.newPlan) {
                    if (
                        productIndex > -1 &&
                        ((grandFatheredEnrollments.length &&
                            py2 &&
                            qleShop &&
                            grandFatheredEnrollments[0].validity.effectiveStarting < py2.coveragePeriod.effectiveStarting) ||
                            oeShop)
                    ) {
                        const grandFatheredPlan: PlanOfferingPanel = {
                            agentAssistanceRequired: null,
                            id: grandFatheredEnrollments[productIndex].planOfferingId,
                            plan: grandFatheredEnrollments[productIndex].plan,
                            taxStatus: grandFatheredEnrollments[productIndex].taxStatus,
                            enrollment: grandFatheredEnrollments[productIndex],
                            disable: {
                                planDisable: false,
                            },
                            buyUp: { show: false, childPlanId: null },
                            genericPlan: true,
                        };
                        grandfatheredPlans = grandFatheredPlan;
                        productPlanList[index].planOfferings.push(grandfatheredPlans);
                    }
                } else if (productIndex > -1 && !productPlan.newPlan && !isSameEnrollmentId) {
                    const grandFatheredPlan: PlanOfferingPanel = {
                        agentAssistanceRequired: null,
                        id: grandFatheredEnrollments[productIndex].planOfferingId,
                        plan: grandFatheredEnrollments[productIndex].plan,
                        taxStatus: grandFatheredEnrollments[productIndex].taxStatus,
                        enrollment: grandFatheredEnrollments[productIndex],
                        disable: {
                            planDisable: false,
                        },
                        buyUp: { show: false, childPlanId: null },
                        genericPlan: true,
                    };
                    grandfatheredPlans = grandFatheredPlan;
                    productPlanList[index].planOfferings.push(grandfatheredPlans);
                } else if (productPlan.newPlan) {
                    productPlanList[index].planOfferings.forEach((plan) => {
                        const enrolledPlan = enrollments.find((enrollment) => enrollment.plan.id === plan.plan.id);
                        plan.enrollment = enrolledPlan;
                    });
                }
                productPlan.planOfferings.sort((planOfferingWithCartAndEnrollmentA, planOfferingWithCartAndEnrollmentB) => {
                    const enrollmentA = planOfferingWithCartAndEnrollmentA.enrollment;
                    const enrollmentB = planOfferingWithCartAndEnrollmentB.enrollment;
                    const activeA = enrollmentA?.carrierStatus === STATUS.ACTIVE;
                    const activeB = enrollmentB?.carrierStatus === STATUS.ACTIVE;
                    // If both PlanOfferings have Enrollments, active plan should be displayed on top or ignore moving them in the list
                    if (enrollmentA && enrollmentB) {
                        if (activeA) {
                            return -1;
                        }
                        if (activeB) {
                            return 1;
                        }
                        return 0;
                    }
                    // If neither PlanOfferings have Enrollments, ignore moving them in the list
                    if (!enrollmentA && !enrollmentB) {
                        return 0;
                    }
                    // If the first PlanOffering has Enrollment, move it up
                    if (enrollmentA) {
                        return -1;
                    }
                    // second PlanOffering must have Enrollment, move it up
                    return 1;
                });

                const enroll = productPlan.planOfferings.filter((plan) => plan.enrollment);
                if (enroll.length) {
                    const Pending = "Pending";
                    productPlan.enrollStatus = enroll.find(
                        (enrollment) =>
                            enrollment.enrollment.status === ApplicationStatusTypes.Lapsed ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Active ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Enrolled ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Declined ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Ended ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Void ||
                            enrollment.enrollment.status === ApplicationStatusTypes.Application_denied ||
                            enrollment.enrollment.status.startsWith(Pending),
                    ).enrollment.status;
                }
            });

            productPlanList.forEach((productPlan) => {
                productPlan.planOfferings.forEach((planOffering, i) => {
                    let childPlanIndex;
                    if (planOffering.enrollment && planOffering.enrollment.policyNumber && planOffering.buyUp.show) {
                        childPlanIndex = productPlan.planOfferings.findIndex((plan) => plan.id === planOffering.buyUp.childPlanId);
                    }
                    if (childPlanIndex && childPlanIndex > -1) {
                        productPlan.planOfferings.splice(i + 1, 0, productPlan.planOfferings[childPlanIndex]);
                        productPlan.planOfferings.splice(childPlanIndex + 1, 1);
                    }
                });
            });
            this.checkPlanDependency(productPlanList, cartItems, planOfferings, enrollments, false);

            this.store.dispatch(new SetAllPlanOfferings([...planOfferings]));
            productPlanList.forEach((productPlan) => {
                productPlan["planYearExist"] = productPlan.planOfferings.some((plan) => Boolean(plan.planYearId));
            });
            productPlanList.forEach((productPlan) => {
                const pretaxPlan = productPlan.planOfferings.findIndex((plan) => !!plan.planYearId);
                productPlan.planYearId = productPlan.planYearExist
                    ? productPlan.planOfferings[pretaxPlan].planYearId
                    : productPlan.planOfferings[0].planYearId;
            });
            if (singleCoverageDate) {
                const planYear: boolean = productPlanList.some((product) => product.planYearExist);
                this.planYearEffectiveStartDate(productPlanList, planYears, groupAttributes);
                const earliestCoverageDate: ConstrainBoolean = Boolean(
                    groupAttributes &&
                        groupAttributes.length &&
                        this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY) >
                            this.datePipe.transform(this.today, DateFormats.YEAR_MONTH_DAY),
                );
                productPlanList
                    .filter((productPlan) => productPlan.isAflac)
                    .forEach((productPlan) => {
                        const multipleCoverageDateOldPlan = singleCoverageDate?.oldCoverageData?.find(
                            (product) => product.id === productPlan.id,
                        );
                        if (!productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                            if (!planYear && !earliestCoverageDate) {
                                const coverageStart: PlanOffering = planOfferings.find(
                                    (plan) => plan.plan.product.id === productPlan.product.id && plan.coverageStartFunction !== undefined,
                                );
                                productPlan.defaultCoverageDate = this.dateTransform(this.currentDate);
                                if (coverageStart) {
                                    const date: Date | string = this.calculateCoverageDateFunction(coverageStart.coverageStartFunction);
                                    productPlan.initialCoverageDate = this.datePipe.transform(date, DateFormats.YEAR_MONTH_DAY);
                                }
                                productPlan.coverageDate = singleCoverageDate.date;
                                productPlan.multipleCoverageDateNew =
                                    multipleCoverageDateOldPlan && multipleCoverageDateOldPlan.multipleCoverageDateNew;
                            } else {
                                productPlan.defaultCoverageDate = productPlan.defaultCoverageDate || this.initialCoverage;
                                productPlan.coverageDate = singleCoverageDate.date;
                                productPlan.multipleCoverageDateNew =
                                    multipleCoverageDateOldPlan && multipleCoverageDateOldPlan.multipleCoverageDateNew;
                                productPlan.initialCoverageDate = productPlan.initialCoverageDate || this.initialCoverage;
                            }
                        } else {
                            productPlan.coverageDate = singleCoverageDate.oldPlans.find(
                                (product) => product.id === productPlan.id,
                            ).coverageDate;
                            productPlan.initialCoverageDate = singleCoverageDate.oldPlans.find(
                                (product) => product.id === productPlan.id,
                            ).initialCoverageDate;
                            productPlan.multipleCoverageDateNew =
                                multipleCoverageDateOldPlan && multipleCoverageDateOldPlan.multipleCoverageDateNew;
                        }
                        this.appliedCoverageDate(productPlan);
                        this.updateCartItemDate(cartItems, productPlan);
                    });
            }
            if (multipleCoverageDate && multipleCoverageDate.length) {
                this.planYearEffectiveStartDate(productPlanList, planYears, groupAttributes);
                productPlanList.forEach((productPlan) => {
                    productPlan.defaultCoverageDate = this.dateTransform(this.currentDate);
                    productPlan.coverageDate =
                        multipleCoverageDate.find((product) => product.id === productPlan.id)?.coverageDate ||
                        productPlan.defaultCoverageDate;
                    productPlan.initialCoverageDate =
                        multipleCoverageDate.find((product) => product.id === productPlan.id)?.initialCoverageDate ||
                        productPlan.defaultCoverageDate;
                    productPlan.multipleCoverageDateNew =
                        multipleCoverageDate.find((product) => product.id === productPlan.id)?.coverageDate ||
                        productPlan.defaultCoverageDate;
                    this.updateCartItemDate(cartItems, productPlan);
                    this.appliedCoverageDate(productPlan);
                });
            }

            return productPlanList;
        }
        return [];
    }

    /**
     * Function that returns true if it is a company provided plan
     * @param planOffering : plans that are being offered
     * @param item : items that are in the cart
     * @returns boolean
     */
    isCompanyProvidedPlan(planOffering: PlanOffering, item: GetCartItems): boolean {
        return planOffering.id === item.planOfferingId && planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED);
    }

    /**
     * This function is used to dispatch api errors
     * @param error api error
     */
    dispatchApiError(error: ApiError): void {
        this.store.dispatch(new SetErrorForShop(error));
        this.shopCartService.displaySpinner({
            isLoading: false,
        });
    }
    /**
     * Check for rider enrollment requirements
     *
     * @param plan : plan choosen
     * @param cartItems : list of items in cart
     * @param enrollments : list of enrollments
     * @param planOfferings : list of all the plan offerings
     * @param checkRiderDependency : rider dependency flag value
     * @param productPlanList : list of products offered
     */
    checkRiderEnrollmentRequirementStatus(
        plan: PlanOfferingPanel,
        cartItems: GetCartItems[],
        enrollments: Enrollments[],
        planOfferings: PlanOfferingPanel[],
        checkRiderDependency: boolean,
        productPlanList?: ProductOfferingPanel[],
    ): void {
        const riders = this.util.copy(plan.ridersData);
        if (plan.selectedCoverage) {
            riders.forEach((rider) => {
                this.enrollmentRequirements(rider, cartItems, enrollments, planOfferings, checkRiderDependency, productPlanList, plan);
            });
        }
        plan.ridersData = riders;
    }

    /**
     * Checks for plan dependency of a plan
     *
     * @param productPlanList
     * @param cartItems
     * @param planOfferings
     * @param enrollments
     * @param checkRiderDependency
     */
    checkPlanDependency(
        productPlanList: ProductOfferingPanel[],
        cartItems: GetCartItems[],
        planOfferings: PlanOfferingPanel[],
        enrollments: Enrollments[],
        checkRiderDependency: boolean,
    ): void {
        productPlanList.forEach((productPlan) => {
            productPlan.planOfferings.forEach((planOffering) => {
                this.enrollmentRequirements(planOffering, cartItems, enrollments, planOfferings, checkRiderDependency, productPlanList);
            });
        });
    }

    /**
     * Compares enrollment requirements and disables plan/rider
     *
     * @param planOffering
     * @param cartItems
     * @param enrollments
     * @param planOfferings
     * @param checkRiderDependency
     * @param productPlanList
     * @param parentPlan
     */
    enrollmentRequirements(
        planOffering: PlanOfferingPanel,
        cartItems: GetCartItems[],
        enrollments: Enrollments[],
        planOfferings: PlanOfferingPanel[],
        checkRiderDependency: boolean,
        productPlanList: ProductOfferingPanel[],
        parentPlan?: PlanOfferingPanel,
    ): void {
        if (cartItems && planOffering.enrollmentRequirements && planOffering.enrollmentRequirements.length) {
            const riderCartItems = []
                .concat(...cartItems.map((cartItem) => cartItem.riders))
                .filter((rider) => rider.coverageLevelId !== DECLINED_COVERAGE_ID);
            const enrolledRiders = [].concat(...enrollments.map((enrollment) => enrollment.riders));
            planOffering.disable = {
                status: false,
                planDisable: false,
                spouseDisable: false,
            };
            planOffering.enrollmentRequirements.forEach((enrollmentRequirement) => {
                if (enrollmentRequirement.relatedPlanType === DependencyTypes.RIDER) {
                    this.checkForEnrollmentStatus(
                        enrollmentRequirement,
                        planOffering,
                        riderCartItems,
                        enrolledRiders,
                        checkRiderDependency,
                        productPlanList,
                    );
                }
                if (enrollmentRequirement.relatedPlanType === DependencyTypes.BASE) {
                    const cartItemIds: RiderCart[] = planOfferings
                        .filter((plan) => !!cartItems.find((cartItem) => plan.id === cartItem.planOfferingId))
                        .map((cartPlanOffering) => ({
                            planId: cartPlanOffering.plan.id,
                        }));
                    this.checkForEnrollmentStatus(
                        enrollmentRequirement,
                        planOffering,
                        cartItemIds,
                        enrollments,
                        checkRiderDependency,
                        productPlanList,
                        parentPlan,
                    );
                }
            });
        }
    }

    /**
     * Used to get policy toggle using configuration
     * @return void
     */
    getPolicyConfigToggle(): void {
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.POLICY_CANCELLATION_TOGGLE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.isPlanDisableConfig = resp;
            });
    }

    /**
     * Checks for enrollment status
     *
     * @param enrollmentRequirement
     * @param planOffering
     * @param cartItems
     * @param enrollments
     * @param isRiderDependent
     * @param productPlanList
     * @param parentPlan
     */
    checkForEnrollmentStatus(
        enrollmentRequirement: EnrollmentRequirement,
        planOffering: PlanOfferingPanel,
        cartItems: RiderCart[],
        enrollments: Enrollments[],
        isRiderDependent: boolean,
        productPlanList?: ProductOfferingPanel[],
        parentPlan?: PlanOfferingPanel,
    ): void {
        this.getPolicyConfigToggle();
        if (
            enrollmentRequirement.dependencyType === DependencyTypes.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN &&
            !(
                parentPlan &&
                parentPlan.plan.id === enrollmentRequirement.relatedPlanId &&
                (enrollmentRequirement.coverageLevels.find((coverage) => parentPlan.selectedCoverage.id === coverage.id) ||
                    !enrollmentRequirement.coverageLevels.length)
            ) &&
            (!cartItems.find((cartItem) => cartItem.planId === enrollmentRequirement.relatedPlanId) ||
                !enrollments.find((enrollment) => enrollment.plan.id === enrollmentRequirement.relatedPlanId))
        ) {
            let updatedEnrollmentRequirement: EnrollmentRequirement;
            if (parentPlan && parentPlan.plan.id === enrollmentRequirement.relatedPlanId) {
                updatedEnrollmentRequirement = this.util.copy(enrollmentRequirement);
                updatedEnrollmentRequirement.dependencyType = DependencyTypes.REQUIRES_ELIGIBLE_SPOUSE;
            }
            planOffering.disable = {
                status: true,
                planDisable: true,
                spouseDisable: false,
                type: DisableType.PLAN_DEPENDENCY,
                enrollmentRequirement: updatedEnrollmentRequirement ? updatedEnrollmentRequirement : enrollmentRequirement,
            };
            if (isRiderDependent) {
                this.checkForRiders(enrollmentRequirement, planOffering, productPlanList);
            }
        }
        if (
            enrollmentRequirement.dependencyType === DependencyTypes.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN &&
            (cartItems.find((cartItem) => cartItem.planId === enrollmentRequirement.relatedPlanId) ||
                enrollments.find(
                    (enrollment) =>
                        enrollment.plan.id === enrollmentRequirement.relatedPlanId &&
                        enrollment.carrierStatus !== EnrollmentStatusType.TERMINATED &&
                        enrollment.carrierStatus !== EnrollmentStatusType.WITHDRAWN,
                ))
        ) {
            const isPlanDisable = enrollments && enrollments.length > 0 && enrollments.every((enrollment) => !enrollment.qualifyingEventId);
            planOffering.disable = {
                status: this.isPlanDisableConfig ? isPlanDisable : true,
                planDisable: this.isPlanDisableConfig ? isPlanDisable : true,
                spouseDisable: false,
                type: DisableType.PLAN_DEPENDENCY,
                enrollmentRequirement: enrollmentRequirement,
            };
            if (isRiderDependent) {
                this.checkForRiders(enrollmentRequirement, planOffering, productPlanList);
            }
        }
    }

    /**
     * Checks for Riders Dependency globally
     *
     * @param enrollmentRequirement
     * @param riderPlan
     * @param [productPlanList]
     */
    checkForRiders(
        enrollmentRequirement: EnrollmentRequirement,
        riderPlan: PlanOfferingPanel,
        productPlanList?: ProductOfferingPanel[],
    ): void {
        if (enrollmentRequirement.relatedPlanType === DependencyTypes.RIDER) {
            productPlanList.forEach((productPlan) =>
                productPlan.planOfferings
                    .filter((planOffering) => planOffering.ridersData)
                    .forEach((planOffering) => {
                        const riderFound = planOffering.ridersData.find((rider) => rider.id === riderPlan.id);
                        if (riderFound) {
                            planOffering.coverageLevel = null;
                            planOffering.planPricing = null;
                            planOffering.dataSource = null;
                            planOffering.ridersData = null;
                            planOffering.isBenefitAmountSection = false;
                            planOffering.isEliminationPeriodSection = false;
                            planOffering.riderTableData = null;
                        }
                    }),
            );
        }
    }
    dateTransform(dateValue: Date): string {
        return this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_YYYY_MM_DD);
    }
    /**
     * Function used to remove the OE ended plans in the cart
     * @param cartItems : cart Items
     * @param planOfferings : All the selected plans
     * @param planYears : Plan Years
     */
    removeEnrollEndedCartItems(cartItems: GetCartItems[], planOfferings: PlanOffering[], planYears: PlanYear[]): void {
        const removeEnrollEnded = cartItems.filter((cartItem) =>
            Boolean(
                planOfferings.find((plan) =>
                    Boolean(
                        planYears.find(
                            (planYear) =>
                                cartItem.planOfferingId === plan.id &&
                                plan.planYearId === planYear.id &&
                                planYear.enrollmentPeriod.expiresAfter < this.dateTransform(this.today),
                        ),
                    ),
                ),
            ),
        );
        if (removeEnrollEnded.length) {
            const pyId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
            this.shopCartService.displaySpinner({ isLoading: true });
            removeEnrollEnded.forEach((item) => {
                this.shoppingService
                    .deleteCartItem(this.memberId, item.id, this.mpGroup)
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        mergeMap((res) =>
                            this.shoppingService
                                .getShoppingCart(this.memberId, this.mpGroup, pyId)
                                .pipe(takeUntil(this.unsubscribe$))
                                .pipe(
                                    catchError((error) => {
                                        if (error.error) {
                                            this.store.dispatch(new SetErrorForShop(error.error));
                                            this.shopCartService.displaySpinner({ isLoading: false });
                                        }
                                        return of(null);
                                    }),
                                ),
                        ),
                        mergeMap((resp) =>
                            this.store.dispatch(
                                new SetProductPlanData({
                                    mpGroup: this.mpGroup,
                                    selectedMethod: this.currentEnrollmentObj.enrollmentMethod,
                                    selectedState: this.currentEnrollmentObj.enrollmentStateAbbreviation,
                                    memberId: this.memberId,
                                }),
                            ),
                        ),
                    )
                    .subscribe();
            });
        }
    }
    /**
     * Function used to update cart items coverage date
     * @param cartItems : Items added to the cart
     * @param productPlan : products offered
     */
    updateCartItemDate(cartItems: GetCartItems[], productPlan: ProductOfferingPanel): void {
        this.userService.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((credential: ProducerCredential) => {
                    const observableList: Observable<HttpResponse<unknown>>[] = [];
                    cartItems.forEach((cartItem) => {
                        productPlan.planOfferings.forEach((plan) => {
                            if (plan.id === cartItem.planOfferingId) {
                                const updateCartApi = {
                                    ...cartItem,
                                    coverageEffectiveDate: productPlan.coverageDate,
                                    assistingAdminId: cartItem.assistingAdminId
                                        ? cartItem.assistingAdminId
                                        : credential.producerId || credential.adminId,
                                };
                                observableList.push(
                                    this.shoppingService.updateCartItem(this.memberId, this.mpGroup, cartItem.id, updateCartApi),
                                );
                            }
                        });
                    });
                    return forkJoin(observableList);
                }),
            )
            .subscribe();
    }
    /**
     * Function used to determine whether the date is applied
     * @param productPlan : products offered
     */
    appliedCoverageDate(productPlan: ProductOfferingPanel): void {
        if (productPlan.coverageDate !== productPlan.initialCoverageDate) {
            productPlan["appliedDate"] = true;
        }
    }

    /**
     * Checks for benefit dollar discount and applies to the table
     *
     * @param plan plan chosen
     * @param coverageLevels All applicable coverage levels
     * @param combinedData Dynamic table data
     * @param isBenefitDollarConfigEnabled flag to enable benefit dollars
     * @param memberFlexDollar member flex dollars
     */
    calculateBenefitDollars(
        plan: PlanOfferingPanel,
        coverageLevels: CoverageLevel[],
        combinedData: TableModel[],
        isBenefitDollarConfigEnabled: boolean,
        memberFlexDollar: MemberFlexDollar,
    ): void {
        plan.benefitDollarData = [];
        if (isBenefitDollarConfigEnabled && memberFlexDollar) {
            const benefitDollarRow: TableModel = {};
            benefitDollarRow[TableTags.TAG] = memberFlexDollar.name;
            coverageLevels.forEach((coverageLevel, index) => {
                const coveragePricing = plan.filteredPlanPricing.find((pricing) => pricing.coverageLevelId === coverageLevel.id);
                if (
                    !(plan.disable.spouseDisable && plan.disable.coverageLevel.find((coverage) => coverage.id === coverageLevel.id)) &&
                    coveragePricing
                ) {
                    const benefitDollarDiscount: number = memberFlexDollar.currentAmount
                        ? memberFlexDollar.currentAmount
                        : memberFlexDollar.amount;
                    let percentagePrice;
                    const totalPrice = combinedData.reduce((accumulator, pricing) => {
                        const price = pricing[coverageLevel.id.toString()];
                        return accumulator + (price ? +price.toFixed(DECIMAL_POINTS) : 0);
                    }, 0);
                    if (memberFlexDollar.contributionType === "PERCENTAGE") {
                        percentagePrice = (totalPrice / PERCENTAGE) * benefitDollarDiscount;
                    }
                    benefitDollarRow[coverageLevel.id.toString()] = percentagePrice ? -percentagePrice : -benefitDollarDiscount;
                    benefitDollarRow[coverageLevel.id.toString()] =
                        -benefitDollarRow[coverageLevel.id] > totalPrice ? -totalPrice : benefitDollarRow[coverageLevel.id];
                    plan.tooltipMessage[coverageLevel.id] = "";
                } else {
                    benefitDollarRow[coverageLevel.id] = "";
                }
            });
            plan.benefitDollarData.push(benefitDollarRow);
        }
    }
    /**
     * Method to calculate coverage date based on coverageStartFunction selected in BO
     * @param coverageStartFunction - compare coverageStartFunction selected in BO to calculate coverage date
     * @return date - returns coverage date based on coverageStartFunction
     */
    calculateCoverageDateFunction(coverageStartFunction: string): Date | string {
        let date: Date | string;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (coverageStartFunction === this.DAY_AFTER) {
            const dayAfterDate = this.dateService.addDays(new Date(), 1);
            const notAllowedDate = this.dateService.toDate(dayAfterDate).getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDate)) {
                date = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            } else {
                date = dayAfterDate;
            }
        } else if (coverageStartFunction === this.NEXT_FIRST_OF_MONTH) {
            date = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        } else if (coverageStartFunction === this.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH) {
            date =
                new Date(today) < new Date(today.getFullYear(), today.getMonth(), this.NEXT_FIFTEENTH_OF_MONTH_DATE)
                    ? new Date(today.getFullYear(), today.getMonth(), this.NEXT_FIFTEENTH_OF_MONTH_DATE)
                    : new Date(today.getFullYear(), today.getMonth() + 1, 1);
        }
        return date;
    }
    /**
     * Function used to get the plan year effective starting date and to get the earliest coverage start date from the group attributes
     * @param productPlanList: List of products offered
     * @param planYears: Plan Years
     * @param groupAttributes: Group Attributes
     */
    planYearEffectiveStartDate(productPlanList: ProductOfferingPanel[], planYears: PlanYear[], groupAttributes: GroupAttribute[]): void {
        productPlanList
            .filter((productPlan) => productPlan.isAflac && !productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP))
            .forEach((product) => {
                planYears.forEach((planYearChosen) => {
                    product.planOfferings.forEach((plan) => {
                        if (plan.planYearId === planYearChosen.id) {
                            this.initialCoverage = planYearChosen.coveragePeriod.effectiveStarting;
                        }
                    });
                });
                if (
                    groupAttributes &&
                    groupAttributes.length &&
                    this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY) >
                        this.datePipe.transform(this.today, DateFormats.YEAR_MONTH_DAY)
                ) {
                    product["planYearExist"] = true;
                    this.initialCoverage = this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY);
                } else if (product.qualifyingEvents && product.qualifyingEvents.length && !planYears.length) {
                    this.assignCoverageDateForQLE(product);
                }
            });
    }

    /**
     * Function to assign coverage date of product with QLE events
     * @param product product offering object
     */
    assignCoverageDateForQLE(product: ProductOfferingPanel): void {
        product.qualifyingEvents
            .filter((qualifyingEvent) => qualifyingEvent.status === StatusType.INPROGRESS)
            .forEach((qualifyingEvent) => {
                const qleProduct = qualifyingEvent.coverageStartDates.find((qleEvent) => qleEvent.productId === product.product.id);
                if (qleProduct) {
                    product.initialCoverageDate = product.defaultCoverageDate = this.dateService.isBefore(
                        this.dateService.toDate(qleProduct.date),
                    )
                        ? this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY_UPPERCASE)
                        : qleProduct.date.toString();
                }
            });
    }

    /**
     * get delete cart item observables
     * @param enrollments list of enrollments
     * @param planOfferings list of plan offerings
     * @param cartItems list of cart items
     * @param memberId member id
     * @param mpGroup mpGroup id of the account
     * @returns list of deleteCartItem observables
     */
    getDeleteCartItems(
        enrollments: Enrollments[],
        planOfferings: PlanOffering[],
        cartItems: GetCartItems[],
        memberId: number,
        mpGroup: number,
    ): Observable<HttpResponse<void>>[] {
        let deleteCartItems: number[] = [];
        let expiredCartItems: number[] = [];
        if (cartItems.length) {
            enrollments
                .filter(
                    (enrollment) =>
                        enrollment.status === EnrollmentStatusType.TERMINATED && enrollment.reinstatement === ReinstatementType.MANDATORY,
                )
                .forEach((enrollment) => {
                    const planOfferingIds: number[] = planOfferings
                        .filter(
                            (offering) =>
                                offering.plan.productId === enrollment.plan.productId ||
                                (offering.plan.product && offering.plan.product.id === enrollment.plan.productId),
                        )
                        .map((offering) => offering.id);
                    deleteCartItems = cartItems
                        .filter((cartItem) =>
                            planOfferingIds.some(
                                (id) => id === cartItem.planOfferingId || (cartItem.planOffering && id === cartItem.planOffering.id),
                            ),
                        )
                        .map((cartItem) => cartItem.id);
                });
            if (planOfferings && planOfferings.length) {
                const offeringIds = planOfferings.map((planOffering) => planOffering.id);
                expiredCartItems = cartItems
                    .filter(
                        (item) =>
                            !offeringIds.includes(item.planOfferingId) &&
                            !deleteCartItems.includes(item.id) &&
                            (!item.planOffering.plan?.characteristics ||
                                !item.planOffering.plan?.characteristics.includes(Characteristics.AUTOENROLLABLE)),
                    )
                    .map((expiredCartItem) => expiredCartItem.id);
                if (expiredCartItems.length) {
                    deleteCartItems.push(...expiredCartItems);
                }
            }
        }
        return deleteCartItems.map((removedItems) => this.shoppingService.deleteCartItem(memberId, removedItems, mpGroup));
    }
    /**
     * gets risk class id based on input parameter values
     * @param plan plan data
     * @param accountInfo account info
     * @param selectedStdCarrierClass selected STD risk class
     * @param selectedAccidentCarrierClass selected Accident riskClass
     * @param selectedRiskClassId selected risk class for non-Dual accounts
     * @returns risk class Id
     */
    getRiskClassId(
        plan: PlanOfferingPanel,
        accountInfo: AccountDetails,
        selectedStdCarrierClass: RiskClass,
        selectedAccidentCarrierClass: RiskClass,
        selectedRiskClassId: number,
    ): number {
        let riskClassId = null;
        if (plan.plan && plan.plan.carrierId === CarrierId.AFLAC) {
            if (accountInfo && accountInfo.ratingCode === RatingCode.DUAL) {
                const productId = plan.plan.product ? plan.plan.product.id : plan.plan.productId;
                if (productId === ProductId.SHORT_TERM_DISABILITY && selectedStdCarrierClass) {
                    riskClassId = selectedStdCarrierClass.id;
                } else if (productId === ProductId.ACCIDENT && selectedAccidentCarrierClass) {
                    riskClassId = selectedAccidentCarrierClass.id;
                }
            } else if (selectedRiskClassId) {
                riskClassId = selectedRiskClassId;
            }
        }
        return riskClassId;
    }
    /**
     * Update max number of days value
     * @param days number of days between enrollment and coverage period
     */
    updateMaxDayDiffValue(days: number): void {
        this.maxDayDiff$.next(days);
    }

    /**
     * Sort plan offerings by plan display order and name
     * @param productPlanData unsorted product plan data
     * @returns product plan data with sorted plan offerings
     */
    sortPlanOfferings(planOfferings: PlanOfferingPanel[]): PlanOfferingPanel[] {
        return [...planOfferings].sort(
            (planOffering1, planOffering2) =>
                (planOffering1.plan.displayOrder ?? -1) - (planOffering2.plan.displayOrder ?? -1) ||
                planOffering1.plan.name.toLowerCase().localeCompare(planOffering2.plan.name.toLowerCase()),
        );
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
