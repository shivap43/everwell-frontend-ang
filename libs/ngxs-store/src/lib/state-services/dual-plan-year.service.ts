import { Injectable, OnDestroy } from "@angular/core";
import { MemberService, BenefitsOfferingService, ShoppingService } from "@empowered/api";
import { forkJoin, Observable, Subscription } from "rxjs";
import { Store } from "@ngxs/store";
import { StaticUtilService } from "./static-util.service";
import { switchMap } from "rxjs/operators";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import {
    DateFormats,
    GroupedCartItems,
    DualPlanYearSettings,
    Characteristics,
    PlanYearType,
    GetCartItems,
    Enrollments,
    PlanOfferingPanel,
    MemberQualifyingEvent,
    PlanYear,
    PlanYearModel,
} from "@empowered/constants";
// TODO: Refactor import paths
import { DualPlanYearState } from "../dual-plan-year/dual-plan-year.state";
import { IsQleShop, SelectedShop } from "../dual-plan-year/dual-plan-year.action";
import { QleOeShopModel, ActiveEnrollment } from "../dual-plan-year/dual-plan-year.model";
import { DateService } from "@empowered/date";

const EMPTY = "";
const QLE_CODE = "By Request";
const QLE_STATUS = "IN_PROGRESS";
const DUAL_PLAN_YEAR_CONFIG = "general.feature.enable.dual.plan.year";
const DIRECT = "direct";
const TPI = "tpi";
const PLAN_YEAR_FIRST = 0;

@Injectable({
    providedIn: "root",
})
export class DualPlanYearService implements OnDestroy {
    planYearsData: PlanYear[] = [];
    qleYear: string;
    oeYear: string;
    qleCoverageStartDate: string;
    oeCoverageStartDate: string;
    subscriptions: Subscription[] = [];
    buttonSource = false;
    isQleEnrollmentWindow: boolean;
    isOpenEnrollmentWindow: boolean;
    isDualPlanYear: boolean;
    isQleDuringOeEnrollment: boolean;
    isQleAfterOeEnrollment: boolean;
    isDirect: boolean;
    dualPlanYearConfigFlag: boolean;
    qleEventData: MemberQualifyingEvent[];
    currentDate = new Date();
    oePlanYear: PlanYear;
    qlePlanYear: PlanYear;
    oeDualPlanYear: PlanYear[] = [];
    qleDualPlanYear: PlanYear[] = [];
    oePlanYearData: PlanYear[] = [];
    constructor(
        private readonly memberService: MemberService,
        private readonly benefitService: BenefitsOfferingService,
        private readonly shoppingService: ShoppingService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly router: Router,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * The method is used to determine the dual plan year scenario.
     * @param memberId memberId of the employee created
     * @param mpGroup mpGroup Id
     * @returns Observable containing isQleShop and isOeShop flag.
     */
    dualPlanYear(memberId: number, mpGroup: number): Observable<QleOeShopModel> {
        return new Observable((observer) => {
            this.staticUtilService
                .cacheConfigEnabled(DUAL_PLAN_YEAR_CONFIG)
                .pipe(
                    switchMap((dualPlanYearConfigFlag) => {
                        this.dualPlanYearConfigFlag = dualPlanYearConfigFlag;
                        return forkJoin([
                            this.benefitService.getPlanYears(mpGroup, false),
                            this.memberService.getMemberQualifyingEvents(memberId, mpGroup),
                            this.benefitService.getPlanYears(mpGroup, true),
                        ]);
                    }),
                )
                .subscribe(([planYearsData, qleEventData, unApprovedPlanYear]) => {
                    this.planYearsData = [...planYearsData, ...unApprovedPlanYear];
                    this.qleEventData = qleEventData;
                    this.resetDualPlanYearData();
                    this.qleEventData = this.filterQleEventData();
                    if (this.dualPlanYearConfigFlag) {
                        this.getDualPlanYearDetails();
                    }
                    const dualPlanYearData: QleOeShopModel = {
                        isQleEnrollmentWindow: this.isQleEnrollmentWindow,
                        isOpenEnrollmentWindow: this.isOpenEnrollmentWindow,
                        isDualPlanYear: this.isDualPlanYear,
                        isQleDuringOeEnrollment: this.isQleDuringOeEnrollment,
                        isQleAfterOeEnrollment: this.isQleAfterOeEnrollment,
                        planYearsData: this.planYearsData,
                        qleEventData: this.qleEventData,
                        qleYear: this.qleYear,
                        oeYear: this.oeYear,
                        qleCoverageStartDate: this.qleCoverageStartDate,
                        oeCoverageStartDate: this.oeCoverageStartDate,
                        oePlanYear: this.oePlanYear,
                        qlePlanYear: this.qlePlanYear,
                        isSameYearForPYs: this.isQleAfterOeEnrollment && this.qleYear === this.oeYear,
                        oeDualPlanYear: this.oeDualPlanYear,
                        qleDualPlanYear: this.qleDualPlanYear,
                        oePlanYearData: this.oePlanYearData,
                    };
                    this.store.dispatch(new IsQleShop(dualPlanYearData));
                    observer.next(dualPlanYearData);
                    observer.complete();
                });
        });
    }

    /**
     *This method identifies a dual plan year scenario and sets appropriate flags.
     */
    getDualPlanYearDetails(): void {
        if (this.qleEventData && this.qleEventData.length && this.planYearsData && this.planYearsData.length > 1) {
            let isQLEInCurrentPlanYear: boolean;
            const effectiveStarting = this.dateService.toDate(
                this.qleEventData[PLAN_YEAR_FIRST]?.enrollmentValidity?.effectiveStarting.toString(),
            );
            const expiresAfter = this.dateService.toDate(this.qleEventData[PLAN_YEAR_FIRST]?.enrollmentValidity?.expiresAfter.toString());
            this.isQleEnrollmentWindow =
                this.dateService.isBeforeOrIsEqual(this.qleEventData[PLAN_YEAR_FIRST].enrollmentValidity?.effectiveStarting) &&
                this.dateService.getIsAfterOrIsEqual(this.qleEventData[PLAN_YEAR_FIRST].enrollmentValidity?.expiresAfter);
            if (this.isQleEnrollmentWindow) {
                this.qleDualPlanYear = [];
                this.oeDualPlanYear = [];
                // QLE during Open enrollment scenario
                this.planYearsData.forEach((plan) => {
                    const planCoverageStartingDate = this.dateService.toDate(plan.coveragePeriod?.effectiveStarting);
                    const planCoverageExpiryDate = this.dateService.toDate(plan.coveragePeriod?.expiresAfter);
                    const planEnrollmentStartDate = this.dateService.toDate(plan.enrollmentPeriod?.effectiveStarting);
                    const planEnrollmentExpiryDate = this.dateService.toDate(plan.enrollmentPeriod?.expiresAfter);
                    if (
                        this.dateService.isBeforeOrIsEqual(planEnrollmentStartDate) &&
                        this.dateService.getIsAfterOrIsEqual(planEnrollmentExpiryDate)
                    ) {
                        this.isOpenEnrollmentWindow = true;
                        this.oeCoverageStartDate = plan.coveragePeriod.effectiveStarting;
                        this.oePlanYear = plan;
                        this.oeDualPlanYear.push(plan);
                    } else if (
                        this.dateService.isBeforeOrIsEqual(planCoverageStartingDate) &&
                        this.dateService.getIsAfterOrIsEqual(planCoverageExpiryDate)
                    ) {
                        const eventDate = this.dateService.toDate(this.qleEventData[PLAN_YEAR_FIRST].eventDate.toString());
                        isQLEInCurrentPlanYear =
                            this.dateService.getIsAfterOrIsEqual(eventDate, planCoverageStartingDate) &&
                            this.dateService.isBeforeOrIsEqual(eventDate, planCoverageExpiryDate);
                        const qleCoverageStartingDate = this.dateService.toDate(this.qleCoverageStartDate);
                        if (!this.qleCoverageStartDate || this.dateService.isBefore(qleCoverageStartingDate, planCoverageStartingDate)) {
                            this.qleCoverageStartDate = plan.coveragePeriod.effectiveStarting;
                        }

                        this.qlePlanYear = plan;
                        this.qleDualPlanYear.push(plan);
                    } else if (
                        this.dateService.isBeforeOrIsEqual(planEnrollmentStartDate) &&
                        (this.dateService.getIsAfterOrIsEqual(planEnrollmentExpiryDate) ||
                            this.dateService.getIsAfterOrIsEqual(planCoverageStartingDate))
                    ) {
                        this.oeDualPlanYear.push(plan);
                    }
                });
                this.isQleDuringOeEnrollment = this.isOpenEnrollmentWindow && this.isQleEnrollmentWindow && isQLEInCurrentPlanYear;

                if (!this.isQleDuringOeEnrollment && !this.isOpenEnrollmentWindow) {
                    this.checkForQleAfterOpenEnrollment();
                }
                this.isDualPlanYear = this.isQleDuringOeEnrollment || this.isQleAfterOeEnrollment;
                if (this.isDualPlanYear) {
                    this.getPlanYears();
                }
            }
        }
    }
    /**
     *Method to check if QLE enrollment window spans between two plan years coverage windows.
     *Mainly for scenario-2 of dual plan year of QLE after OE has ended.
     * @memberof DualPlanYearService
     */
    checkForQleAfterOpenEnrollment(): void {
        const qlePlanYearData = this.planYearsData.filter(
            (data) =>
                this.dateService.isBeforeOrIsEqual(
                    data.coveragePeriod?.effectiveStarting,
                    this.qleEventData[PLAN_YEAR_FIRST]?.enrollmentValidity?.effectiveStarting,
                ) &&
                this.dateService.isBeforeOrIsEqual(data.coveragePeriod.effectiveStarting) &&
                this.dateService.getIsAfterOrIsEqual(data.coveragePeriod.expiresAfter),
        );
        this.oePlanYearData = this.planYearsData.filter(
            (data) =>
                this.dateService.checkIsAfter(
                    data.coveragePeriod.effectiveStarting,
                    this.qleEventData[PLAN_YEAR_FIRST]?.enrollmentValidity?.effectiveStarting,
                ) &&
                this.dateService.checkIsAfter(data.coveragePeriod.effectiveStarting) &&
                this.dateService.isBefore(data.enrollmentPeriod.expiresAfter),
        );
        if (qlePlanYearData.length && this.oePlanYearData.length) {
            this.oeCoverageStartDate = this.oePlanYearData[PLAN_YEAR_FIRST].coveragePeriod.effectiveStarting;
            this.qleCoverageStartDate = qlePlanYearData[PLAN_YEAR_FIRST].coveragePeriod.effectiveStarting;
            this.qlePlanYear = qlePlanYearData[PLAN_YEAR_FIRST];
            this.oePlanYear = this.oePlanYearData[PLAN_YEAR_FIRST];
            this.isQleAfterOeEnrollment = true;
        }
    }
    /**
     *Reset all flags for non dual plan year scenario.
     * @memberof DualPlanYearService
     */
    resetDualPlanYearData(): void {
        this.isQleEnrollmentWindow = false;
        this.isOpenEnrollmentWindow = false;
        this.isDualPlanYear = false;
        this.isQleDuringOeEnrollment = false;
        this.isQleAfterOeEnrollment = false;
        this.oeCoverageStartDate = null;
        this.qleCoverageStartDate = null;
        this.oePlanYear = null;
        this.qlePlanYear = null;
        this.oePlanYearData = null;
    }

    /**
     *Get the Plan years for current coverage year and next open enrollment year.
     * @memberof DualPlanYearService
     */
    getPlanYears(): void {
        const yearStartIndex = 0;
        const yearEndIndex = 4;
        const yearMidIndex = 2;
        const qleStartYear = this.qlePlanYear.coveragePeriod.effectiveStarting.substring(yearStartIndex, yearEndIndex);
        const qleEndYear = this.qlePlanYear.coveragePeriod.expiresAfter.substring(yearStartIndex, yearEndIndex);
        if (qleStartYear === qleEndYear) {
            this.qleYear = qleStartYear;
        } else {
            this.qleYear = qleStartYear.concat("-").concat(qleEndYear.substring(yearMidIndex, yearEndIndex));
        }

        const oeStartYear = this.oePlanYear.coveragePeriod.effectiveStarting.substring(yearStartIndex, yearEndIndex);
        const oeEndYear = this.oePlanYear.coveragePeriod.expiresAfter.substring(yearStartIndex, yearEndIndex);
        if (oeStartYear === oeEndYear) {
            this.oeYear = oeStartYear;
        } else {
            this.oeYear = oeStartYear.concat("-").concat(oeEndYear.substring(yearMidIndex, yearEndIndex));
        }
    }

    /**
     * The method will route to QLE or OE shop for generic shop button. If there is no item in cart, it will redirect to QLE shop.
     * @param memberId memberId of the employee created
     * @param mpGroup mpGroup Id
     */
    genericShopOeQLeNavigate(memberId: number, mpGroup: number): void {
        this.staticUtilService
            .cacheConfigEnabled(DUAL_PLAN_YEAR_CONFIG)
            .pipe(
                switchMap((dualPlanYearConfigFlag) => {
                    if (dualPlanYearConfigFlag) {
                        return forkJoin([
                            this.dualPlanYear(memberId, mpGroup),
                            this.shoppingService.getCartItems(memberId, mpGroup, "planOfferingId"),
                        ]);
                    }
                    return undefined;
                }),
            )
            .subscribe(([dualPlanYearData, cartItems]) => {
                let selectedShop = EMPTY;
                if (dualPlanYearData.isDualPlanYear) {
                    if (cartItems.length) {
                        selectedShop = this.checkForCartItems(cartItems);
                    }
                    if (selectedShop === EMPTY) {
                        selectedShop = DualPlanYearSettings.QLE_SHOP;
                    }
                }
                this.store.dispatch(
                    new IsQleShop({
                        selectedShop,
                    }),
                );
            });
    }

    /**
     * Navigate to shop page based on cart item
     * @param cartItems cart data
     * @return string flag to determine shop page
     */
    checkForCartItems(cartItems: GetCartItems[]): string {
        const latestPlanYearIndex = this.planYearsData.length - 1;
        const groupedCartItems: GroupedCartItems = this.groupCartItems(cartItems);
        if (groupedCartItems.preTaxPlans.length) {
            return groupedCartItems.preTaxPlans[PLAN_YEAR_FIRST].planOffering.planYearId === this.planYearsData[latestPlanYearIndex].id
                ? DualPlanYearSettings.OE_SHOP
                : DualPlanYearSettings.QLE_SHOP;
        }
        if (groupedCartItems.vasPlans.length) {
            if (groupedCartItems.vasPlans.length > 1) {
                const vasPlanYearId = groupedCartItems.vasPlans[PLAN_YEAR_FIRST].planOffering.planYearId;
                const sameYearVasPlans = groupedCartItems.vasPlans.every((vasPlan) => vasPlan.planOffering.planYearId === vasPlanYearId);
                if (!sameYearVasPlans) {
                    return EMPTY;
                }
            }
            return groupedCartItems.vasPlans[PLAN_YEAR_FIRST].planOffering.planYearId === this.planYearsData[latestPlanYearIndex].id
                ? DualPlanYearSettings.OE_SHOP
                : DualPlanYearSettings.QLE_SHOP;
        }
        return EMPTY;
    }

    /**
     * Method to filter the filter out the VAS plans from cart items.
     * @param cartItems plans in cart
     * @return filtered out cart items
     */
    groupCartItems(cartItems: GetCartItems[]): GroupedCartItems {
        const preTaxPlans: GetCartItems[] = [];
        const postTaxPlans: GetCartItems[] = [];
        const vasPlans: GetCartItems[] = [];
        cartItems.forEach((cartItem) => {
            if (
                cartItem.planOffering.planYearId >= PLAN_YEAR_FIRST &&
                !cartItem.planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED)
            ) {
                preTaxPlans.push(cartItem);
            } else if (!cartItem.planOffering.planYearId) {
                postTaxPlans.push(cartItem);
            } else if (cartItem.planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED)) {
                vasPlans.push(cartItem);
            }
        });

        return {
            postTaxPlans,
            preTaxPlans,
            vasPlans,
        };
    }

    /**
     * Method to filter QLE events based on code and status
     * @param qleEventData member's Qualifying event data
     * @returns filtered qualifying event data
     */
    filterQleEventData(): MemberQualifyingEvent[] {
        if (this.qleEventData && this.qleEventData.length) {
            return this.qleEventData.filter((qleEvent) => qleEvent.type.code !== QLE_CODE && qleEvent.status === QLE_STATUS);
        }
        return this.qleEventData;
    }

    /**
     * The method will return reference date for dual plan year and non dual plan year scenario.
     * @param aflacOpenPlanYears - aflac open enrollment plan years list
     * @return reference date
     */
    getReferenceDate(aflacOpenPlanYears?: PlanYearModel[]): string {
        if (this.router.url.includes(DIRECT)) {
            return null;
        }
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const currentDate = this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
        if (dualPlanYearData.isDualPlanYear) {
            return this.getDualPlanYearCoverageDate(dualPlanYearData);
        }
        if (dualPlanYearData.planYearsData.length) {
            const openEnrollment: PlanYear[] = [];
            const currentEnrollment: PlanYear[] = [];
            dualPlanYearData.planYearsData.forEach((planYear) => {
                if (
                    this.dateService.isBeforeOrIsEqual(planYear.enrollmentPeriod.effectiveStarting) &&
                    this.dateService.getIsAfterOrIsEqual(planYear.enrollmentPeriod.expiresAfter)
                ) {
                    openEnrollment.push(planYear);
                } else if (
                    this.dateService.isBeforeOrIsEqual(planYear.coveragePeriod.effectiveStarting) &&
                    this.dateService.getIsAfterOrIsEqual(planYear.coveragePeriod.expiresAfter)
                ) {
                    currentEnrollment.push(planYear);
                }
            });
            const referenceDate = this.getDualPlanYearReferenceDate(
                openEnrollment,
                currentEnrollment,
                dualPlanYearData,
                currentDate,
                aflacOpenPlanYears,
            );
            if (this.router.url.includes(TPI) && this.dateService.isBefore(referenceDate)) {
                return currentDate;
            }
            return referenceDate;
        }
        return currentDate;
    }
    /**
     * Get reference date for dual plan year depending upon enrollment status
     * @param openEnrollment list of open enrollment plan years
     * @param currentEnrollment list of current enrollment plan years
     * @param dualPlanYearData dual plan year details
     * @param currentDate current date
     * @param aflacOpenPlanYears aflac open enrollment plan years list
     */
    getDualPlanYearReferenceDate(
        openEnrollment: PlanYear[],
        currentEnrollment: PlanYear[],
        dualPlanYearData: QleOeShopModel,
        currentDate: string,
        aflacOpenPlanYears: PlanYearModel[],
    ): string {
        // When not a dual plan year and in open enrollment period, return coverage start date of open enrollment plan year
        if (openEnrollment.length && !dualPlanYearData.isDualPlanYear) {
            return aflacOpenPlanYears && aflacOpenPlanYears.length
                ? this.getEarliestCoverageDate(aflacOpenPlanYears)
                : this.getLatestReferenceDate(openEnrollment);
        }
        /* When not a dual plan year and no open enrollment and currently in QLE enrollment window
         * return coverage start date of greatest plan year whose open enrollment has expired
         */
        const qleCoverageDate = this.getReferenceDateDuringQLE(dualPlanYearData);
        if (qleCoverageDate !== null) {
            return this.dateService.getIsAfterOrIsEqual(qleCoverageDate, currentDate) ? qleCoverageDate : currentDate;
        }

        /* When not a dual plan year and no open enrollment and no active QLE enrollment
         * and currently in coverage period of a plan year
         * return greatest coverage start date among the current plan years
         */
        if (currentEnrollment.length && !dualPlanYearData.isDualPlanYear) {
            return this.getLatestReferenceDate(currentEnrollment);
        }
        if (this.router.url.indexOf(TPI) >= 0 && dualPlanYearData.planYearsData && dualPlanYearData.planYearsData.length) {
            return dualPlanYearData.planYearsData[dualPlanYearData.planYearsData.length - 1].coveragePeriod.effectiveStarting;
        }
        return currentDate;
    }
    /**
     * Get reference date based on the shop selected in dual plan year scenario.
     * @param dualPlanYearData
     * @returns string reference date
     */
    getDualPlanYearCoverageDate(dualPlanYearData: QleOeShopModel): string {
        if (dualPlanYearData.selectedShop === DualPlanYearSettings.QLE_SHOP) {
            return dualPlanYearData.qleCoverageStartDate;
        }
        if (
            dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP ||
            dualPlanYearData.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP
        ) {
            return dualPlanYearData.oeCoverageStartDate;
        }
        return this.datePipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
    }
    /**
     * Get latest reference date during QLE window.
     * @param dualPlanYearData
     * @returns string reference date
     */
    getReferenceDateDuringQLE(dualPlanYearData: QleOeShopModel): string {
        let qlePlanYear: PlanYear[] = [];
        const ENROLLMENT_INDEX = 0;
        const qleEventData = this.filterQleEventData();
        if (qleEventData && qleEventData.length) {
            qleEventData.forEach((element) => {
                if (
                    this.dateService.isBeforeOrIsEqual(element.enrollmentValidity.effectiveStarting.toString()) &&
                    this.dateService.getIsAfterOrIsEqual(element.enrollmentValidity.effectiveStarting.toString())
                ) {
                    qlePlanYear = dualPlanYearData.planYearsData.filter((data) =>
                        this.dateService.isBefore(data.enrollmentPeriod?.expiresAfter),
                    );
                }
            });
        }
        if (qlePlanYear.length && !dualPlanYearData.isDualPlanYear) {
            let latestCurrentEnrollmentDate = this.dateService.toDate(qlePlanYear[ENROLLMENT_INDEX]?.coveragePeriod?.effectiveStarting);
            qlePlanYear.forEach((ceData) => {
                latestCurrentEnrollmentDate = this.dateService.checkIsAfter(
                    ceData.coveragePeriod.effectiveStarting,
                    latestCurrentEnrollmentDate,
                )
                    ? this.dateService.toDate(ceData.coveragePeriod?.effectiveStarting)
                    : latestCurrentEnrollmentDate;
            });
            return this.datePipe.transform(latestCurrentEnrollmentDate, DateFormats.YEAR_MONTH_DAY);
        }
        return null;
    }
    /**
     * Get latest coverage date among all the plan years.
     * @param planYears
     * @returns string reference date
     */
    getLatestReferenceDate(planYears: PlanYear[]): string {
        const ENROLLMENT_INDEX = 0;
        let latestCurrentEnrollmentDate = this.dateService.toDate(planYears[ENROLLMENT_INDEX]?.coveragePeriod?.effectiveStarting);
        planYears.forEach((ceData) => {
            latestCurrentEnrollmentDate = this.dateService.checkIsAfter(
                ceData.coveragePeriod.effectiveStarting,
                latestCurrentEnrollmentDate,
            )
                ? this.dateService.toDate(ceData.coveragePeriod?.effectiveStarting)
                : latestCurrentEnrollmentDate;
        });
        return this.datePipe.transform(latestCurrentEnrollmentDate, DateFormats.YEAR_MONTH_DAY);
    }
    /**
     * Get earliest coverage date among all the plan years.
     * @param planYears: plan years array
     * @returns earliest coverage date
     */
    getEarliestCoverageDate(planYears: PlanYearModel[]): string {
        planYears.sort(
            (planYear1, planYear2) =>
                this.dateService.toDate(planYear1.coveragePeriod.effectiveStarting).getTime() -
                this.dateService.toDate(planYear2.coveragePeriod.effectiveStarting).getTime(),
        );
        return this.datePipe.transform(
            this.dateService.toDate(planYears[0].coveragePeriod.effectiveStarting.toString()),
            DateFormats.YEAR_MONTH_DAY,
        );
    }

    /**
     * Check for cart items based on plan type to navigate to shop page and open cart-warning modal
     * @param cartItems cart data
     * @param memberId
     * @param mpGroupId
     * @param selectedShop
     * @returns string flag to determine shop navigation
     */
    checkCartItems(cartItems: GetCartItems[], memberId?: number, mpGroupId?: number, selectedShop?: string): string {
        const planYearsData = this.store.selectSnapshot(DualPlanYearState).planYearsData;
        const selectedShopInStore = this.store.selectSnapshot(DualPlanYearState).selectedShop;
        const groupedCartItems: GroupedCartItems = this.groupCartItems(cartItems);
        if (!cartItems.length) {
            return EMPTY;
        }
        if (groupedCartItems.preTaxPlans.length && planYearsData && planYearsData.length) {
            if (groupedCartItems.preTaxPlans[0].planOffering.planYearId === this.planYearsData[planYearsData.length - 1].id) {
                return DualPlanYearSettings.OE_SHOP;
            }
            return DualPlanYearSettings.QLE_SHOP;
        }
        if (groupedCartItems.postTaxPlans.length) {
            if (memberId && mpGroupId && selectedShopInStore !== selectedShop) {
                this.subscriptions.push(this.shoppingService.clearShoppingCart(memberId, mpGroupId).subscribe());
                return EMPTY;
            }
            return selectedShopInStore;
        }
        return EMPTY;
    }

    /**
     * Method to check if plan belongs to active enrollment list or same product
     * @param plan plan data
     * @param enrollments all active and enrolled plans
     * @return object containing sameProductActiveEnrollment, replacePlan, planEdit
     */
    checkForActiveEnrollments(plan: PlanOfferingPanel, enrollments: Enrollments[]): ActiveEnrollment {
        if (enrollments.some((enrollment) => enrollment.plan.id === plan.plan.id)) {
            return {
                sameProductActiveEnrollment: true,
                planEdit: true,
            };
        }
        const productId = plan.plan.productId || plan.plan.product.id;
        if (enrollments.some((enrollment) => enrollment.plan.productId === productId)) {
            return {
                sameProductActiveEnrollment: true,
                replacePlan: true,
            };
        }
        return { sameProductActiveEnrollment: false };
    }

    /**
     * Setter function to set generic Shop button flag to true from coverage summary and employee list page.
     * @param source Source of the button
     */
    set genericShopButtonSource(source: boolean) {
        this.buttonSource = source;
    }

    /**
     * Getter method to get generic Shop button source flag
     * @return button source boolean flag
     */
    get genericShopButtonSource(): boolean {
        return this.buttonSource;
    }

    /**
     * Function to calculate number of days difference between enrollment and coverage period
     * @param planYears Active plan years
     * @returns Difference between enrollment and coverage start dates
     */
    calculateMaxDayDifference(planYears: PlanYear[]): number {
        return planYears
            .filter(
                (planYear) =>
                    planYear.type === PlanYearType.AFLAC_INDIVIDUAL &&
                    this.dateService.checkIsAfter(planYear.coveragePeriod.expiresAfter) &&
                    this.dateService.isBeforeOrIsEqual(planYear.enrollmentPeriod.effectiveStarting),
            )
            .reduce(
                (enrollmentCoveragePeriodDiff, planYear) =>
                    Math.max(
                        enrollmentCoveragePeriodDiff,
                        this.dateService.getDifferenceInDays(
                            planYear.coveragePeriod.effectiveStarting,
                            planYear.enrollmentPeriod.effectiveStarting,
                        ),
                    ),
                0,
            );
    }

    /**
     * sets selected shop value to store
     * @param selectedShop selected shop value
     */
    setSelectedShop(selectedShop: DualPlanYearSettings): void {
        this.store.dispatch(new SelectedShop(selectedShop));
    }

    /**
     * Called once, before the instance is destroyed.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
