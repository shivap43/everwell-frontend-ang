import { DatePipe } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
    ApplicationStatusTypes,
    CarrierStatus,
    EnrollmentStatusType,
    MemberQLETypes,
    PayFrequencyObject,
    ReinstatementType,
} from "@empowered/api";
import {
    CarrierId,
    CoverageLevelNames,
    DateFormat,
    EnrollmentEnums,
    Flow,
    PlanOfferingWithCartAndEnrollment,
    Characteristics,
    TaxStatus,
    CoverageLevel,
    EnrollmentBeneficiary,
    Enrollments,
    ContributionType,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { StatusNotAllowedForPlanWithdraw } from "../plan-withdraw-link/plan-withdraw-model";
import { AMOUNT_ZERO } from "../plans-container.constant";
import { ProducerShopHelperService } from "./../../services/producer-shop-helper/producer-shop-helper.service";
import { ADJUSTMENT_SYMBOL, MONTHLY, TWO } from "./enrollment-plan.constant";
import { EnrollmentMessage } from "./enrollment-plan.model";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-enrollment-plan",
    templateUrl: "./enrollment-plan.component.html",
    styleUrls: ["./enrollment-plan.component.scss"],
})
export class EnrollmentPlanComponent implements OnInit, OnDestroy {
    contributionType = ContributionType;

    @Input() editable: boolean;
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // Gets selected enrollment
    // Get Enrollment using PlanOffering input bind
    selectedEnrollment$!: Observable<Enrollments | null>;

    // Get reEnrollable information using PlanOffering input bind
    reEnrollable$!: Observable<boolean>;

    // Get enrollment expiration information using PlanOffering input bind
    nonEditableEnrollmentWithExpirationDate$!: Observable<boolean>;

    // Check if plan is not auto enrolled
    // Get Non-auto enrolled Enrollment using PlanOffering input bind
    notAutoEnrolledEnrollment$!: Observable<Enrollments | null>;

    // Check if plan is company provided
    isNotCompanyProvided$!: Observable<boolean | null>;

    // Get if in edit mode using PlanOffering input bind
    isEdit$!: Observable<boolean>;

    // If the enrollment's coverage level belongs to dependent eligible coverage then set this observable
    // This can be BaseCoverageLevels or lists of Rider Plan names
    dependentCoverageLevel$!: Observable<string>;

    // End coverage link will be applicable, If enrollment is active or approved,
    // carrier id should be among aflac, argus or AG with past coverage date
    // Determine if end coverage link is enabled using PlanOffering input bind
    enableEndCoverageLink$!: Observable<boolean>;

    // Enrollment message scenarios listed in https://confluence.empoweredbenefits.com/pages/viewpage.action?pageId=102531897
    // Enrollment message relies on editable input bind
    enrollmentMessage$!: Observable<string>;

    enrollmentMessageEnum = EnrollmentMessage;

    // Plan withdraw link will be applicable, If enrollment status not void, ended or cancelled,
    // coverage is not yet active and not auto enroll or declined
    // Determine if plan withdraw link is enabled using PlanOffering input bind
    enablePlanWithdrawLink$!: Observable<boolean>;
    // Set coverage date label's description with text and date, based on enrollment starting and expiring date
    // Get coverageDateText using PlanOffering input bind
    coverageDateText$!: Observable<string>;

    // Set Coverage level name
    // Values include CoverageLevelNames and Rider plan names
    coverageLevelName$!: Observable<string>;

    // Enrollment reinstatement information
    // Determine if enrollment is eligible for reinstatement using PlanOffering input bind
    reinstatementInfo$!: Observable<Enrollments>;

    // payroll frequency object to calculate cost per pay period
    payFrequencyObject$: Observable<PayFrequencyObject>;

    readonly Characteristics = Characteristics;

    readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    // get enrollment edit details from component store
    private readonly getEditDetails$ = this.producerShopComponentStoreService.selectEnrollmentDetailsStatesOnAsyncValue();

    private readonly onEdit$ = new Subject<void>();

    // Navigate to PCR page
    private readonly navigateToPCR$ = new Subject<void>();
    readonly adjustment = ADJUSTMENT_SYMBOL;

    // Gets mpGroup
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));
    // Gets member id
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Gets beneficiaries
    readonly beneficiaries$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getEnrollmentBeneficiaries));

    readonly isGrandFatherEnrollment$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.checkForGrandfatherEnrollment));

    // Gets products
    private readonly productOfferings$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedProductOfferingSet));

    readonly isDirectFlow$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedFlow)).pipe(map((flow) => flow === Flow.DIRECT));

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Gets member data
    readonly memberData$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));

    // Get Pay Frequency
    readonly payFrequency$ = this.ngrxStore
        .onAsyncValue(select(MembersSelectors.getSelectedMemberPayFrequency))
        .pipe(map(({ name }) => name));

    // Get account Pay Frequency
    readonly accountPayFrequency$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedPayFrequencies));

    // Dependent eligible coverage level array
    readonly dependentCoverageLevels = [
        CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE,
        CoverageLevelNames.TWO_PARENT_FAMILY_COVERAGE,
        CoverageLevelNames.NAME_INSURED_SPOUSE_ONLY_COVERAGE,
    ];

    private readonly unsubscribe$ = new Subject<void>();

    readonly taxStatusMapping = this.getMappedTaxStatus();

    // current date without time
    private readonly currentDate = new Date();

    // Get Plan Years
    private readonly planYears$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedPlanYearSet));

    // Get QLE
    private readonly qualifyingEvents$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedQualifyEvents));

    // Get selected member flex dollars data (Employer contributions)
    private readonly selectedMemberFlexDollars$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberFlexDollars));

    // Adjustment amount based on selectedMemberFlexDollars
    adjustmentAmount$!: Observable<number | null>;

    // Net cost (total cost) after adjustment
    netCost$!: Observable<string>;

    // Base cost of plan and cost of riders
    baseCost$!: Observable<string>;

    ridersTotalCostPerPayPeriod$!: Observable<number>;

    // Get the enrolled riders
    readonly enrolledRiders$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentRiders));

    // Get the sum of MemberCostPerPayPeriod of all riders
    readonly ridersMemberCostPerPayPeriod$ = this.enrolledRiders$.pipe(
        map((enrolledRiders) =>
            enrolledRiders.map((enrolledRider) => enrolledRider.memberCostPerPayPeriod).reduce((acc, cur) => acc + cur, 0),
        ),
    );

    // Get the sum of TotalCost of all riders
    readonly ridersTotalCost$ = this.enrolledRiders$.pipe(
        map((enrolledRiders) => enrolledRiders.map((enrolledRider) => enrolledRider.totalCost).reduce((acc, cur) => acc + cur, 0)),
    );

    // Gets selected Plan Offering With CoverageDates
    private readonly selectedPlanOfferingData$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData));

    isBucketPlan$: Observable<boolean>;

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly language: LanguageService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly dateService: DateService,
        private readonly router: Router,
        private readonly datePipe: DatePipe,
        private readonly payrollFrequencyPipe: PayrollFrequencyCalculatorPipe,
    ) {}

    ngOnInit(): void {
        // NOTE: We should use plan panel
        this.selectedEnrollment$ = this.enrollments$.pipe(
            map((enrollments) => enrollments.find((enrollment) => enrollment.id === this.planPanel.enrollment?.id) ?? null),
        );

        this.reinstatementInfo$ = this.selectedEnrollment$.pipe(
            switchMap((enrollment) =>
                this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.enrollmentEligibilityForReinstatement(enrollment.id))),
            ),
        );
        this.isBucketPlan$ = this.selectedPlanOfferingData$.pipe(
            map(
                (selectedPlanOffering) =>
                    // carrier id should be among Wageworks
                    selectedPlanOffering.planOffering?.plan.carrierId === CarrierId.WAGEWORKS ||
                    // product id should be among HSA or FSA
                    EnrollmentEnums.productIds.HSA.includes(selectedPlanOffering.planOffering?.plan.product.id) ||
                    (EnrollmentEnums.productIds.FSA.includes(selectedPlanOffering.planOffering?.plan.product.id) &&
                        // Shouldn't be auto enrollable
                        !selectedPlanOffering.planOffering?.plan?.characteristics.includes(Characteristics.AUTOENROLLABLE)),
            ),
        );

        this.payFrequencyObject$ = combineLatest([this.payFrequency$, this.accountPayFrequency$]).pipe(
            map(([memberPayFrequency, accountPayFrequency]) => {
                const monthlypayFrequency = accountPayFrequency.find((payFrequency) => payFrequency.frequencyType === MONTHLY);
                const payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                return {
                    payFrequencies: [...accountPayFrequency],
                    pfType: memberPayFrequency,
                    payrollsPerYear,
                };
            }),
        );

        this.ridersTotalCostPerPayPeriod$ = combineLatest([this.payFrequencyObject$, this.enrolledRiders$]).pipe(
            map(([payFrequencyObject, enrolledRiders]) => {
                const ridersTotalCost = enrolledRiders.map((enrolledRider) => enrolledRider.totalCost).reduce((acc, cur) => acc + cur, 0);
                return this.payrollFrequencyPipe.transform(ridersTotalCost, payFrequencyObject);
            }),
        );

        // check for enrollment is eligible for re-enrollment
        this.reEnrollable$ = combineLatest([
            this.selectedEnrollment$,
            this.producerShopHelperService.inOpenEnrollment(),
            this.planYears$,
        ]).pipe(
            map(
                ([enrollment, inOpenEnrollment, planYears]) =>
                    this.editable &&
                    this.producerShopHelperService.isOEAndEnrollmentDueToExpire(enrollment, inOpenEnrollment) &&
                    this.producerShopHelperService.isEligibleForReEnrollForRenewalPlan(enrollment, planYears),
            ),
        );

        // check for enrollment is not editable but has an expiration date set
        this.nonEditableEnrollmentWithExpirationDate$ = combineLatest([
            this.selectedEnrollment$,
            this.producerShopHelperService.inOpenEnrollment(),
        ]).pipe(
            map(
                ([enrollment, inOpenEnrollment]) =>
                    !this.editable && this.producerShopHelperService.isOEAndEnrollmentDueToExpire(enrollment, inOpenEnrollment),
            ),
        );

        // Check if plan is not auto enrolled
        this.notAutoEnrolledEnrollment$ = this.selectedEnrollment$.pipe(
            map((enrollment) => {
                // If no enrollment is selected, return null
                if (!enrollment) {
                    return null;
                }

                // Return null if enrolled plan is Auto enrolled
                return !enrollment.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ? enrollment : null;
            }),
        );

        // Check if plan is company provided
        this.isNotCompanyProvided$ = this.selectedEnrollment$.pipe(
            map((enrollment) => {
                // If no enrollment is selected, return null
                if (!enrollment) {
                    return null;
                }

                return !enrollment.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED);
            }),
        );

        this.isEdit$ = combineLatest([this.selectedEnrollment$, this.getEditDetails$]).pipe(
            map(([selectedEnrollment, editDetails]) => {
                const enrollmentId = selectedEnrollment?.id;
                return enrollmentId ? editDetails[enrollmentId].edit : false;
            }),
        );

        // If the enrollment's coverage level belongs to dependent eligible coverage then set this observable
        this.dependentCoverageLevel$ = this.selectedEnrollment$.pipe(
            map((enrollment) => this.dependentCoverageLevels.find((coverage) => coverage === enrollment?.coverageLevel?.name)),
        );

        // End coverage link will be applicable, If enrollment is active or approved,
        // carrier id should be among aflac, argus or AG with past coverage date
        this.enableEndCoverageLink$ = combineLatest([
            this.selectedEnrollment$,
            this.producerShopHelperService.inOpenEnrollment(),
            this.qualifyingEvents$,
        ]).pipe(
            withLatestFrom(this.isDirectFlow$),
            map(([[enrollment, isOpenEnrollment, qualifyingEvents], isDirectFlow]) => {
                if (!enrollment || isDirectFlow) {
                    return false;
                }

                const coverageStartDateInPast = this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(enrollment.validity.effectiveStarting),
                );

                if (enrollment.plan.carrierId === CarrierId.AFLAC_GROUP) {
                    return !isOpenEnrollment || coverageStartDateInPast;
                }

                const isBYRequestQLE = qualifyingEvents.some(
                    (qle) => qle.id === enrollment.qualifyingEventId && qle.type?.description === MemberQLETypes.BY_REQUEST,
                );

                return (
                    (enrollment.status === EnrollmentStatusType.APPROVED || enrollment.status.toUpperCase() === "ACTIVE") &&
                    (enrollment.plan.carrierId === CarrierId.AFLAC ||
                        enrollment.plan.carrierId === CarrierId.ADV ||
                        enrollment.plan.carrierId === CarrierId.ARGUS) &&
                    enrollment.carrierStatus === CarrierStatus.ACTIVE &&
                    !isBYRequestQLE &&
                    coverageStartDateInPast
                );
            }),
        );

        // Enrollment message scenarios listed in https://confluence.empoweredbenefits.com/pages/viewpage.action?pageId=102531897
        this.enrollmentMessage$ = combineLatest([
            this.planYears$,
            this.qualifyingEvents$,
            this.selectedEnrollment$,
            this.isGrandFatherEnrollment$,
            this.memberData$,
            this.reinstatementInfo$,
        ]).pipe(
            withLatestFrom(this.reEnrollable$, this.nonEditableEnrollmentWithExpirationDate$, this.productOfferings$),
            map(
                ([
                    [planYears, qualifyingEvents, enrollment, grandFatherEnrollment, memberData, reinstateInfo],
                    reEnrollable,
                    nonEditableEnrollmentWithExpiration,
                    productOfferings,
                ]) => {
                    // do not return any message for grandfather enrollments and Auto enrolled plans
                    if (grandFatherEnrollment || enrollment.plan.characteristics.includes(Characteristics.AUTOENROLLABLE)) {
                        return null;
                    }

                    // If no reinstate info and enrollment reinstatement exists, then empty message
                    if (!reinstateInfo && enrollment.reinstatement) {
                        return null;
                    }

                    if (reinstateInfo?.reinstatement === ReinstatementType.MANDATORY) {
                        return this.languageStrings["primary.portal.quoteShop.grandfatherPlanLapsed"].replace(
                            "#planproductname",
                            productOfferings.find((productOffering) => productOffering.product.id === reinstateInfo.plan?.productId)
                                ?.product?.name,
                        );
                    }

                    if (reinstateInfo?.reinstatement === ReinstatementType.OPTIONAL) {
                        return this.languageStrings["primary.portal.quoteShop.grandfatherPlanOptional123"];
                    }

                    if (reEnrollable) {
                        return this.languageStrings["primary.portal.shopPage.changes.autoEnrollment"].replace(
                            "#firstname",
                            memberData.name.firstName,
                        );
                    }

                    if (nonEditableEnrollmentWithExpiration) {
                        return this.languageStrings["primary.portal.shopPage.changes.expiredEnrollment"]
                            .replace("#firstname", memberData.name.firstName)
                            .replace(
                                "#productname",
                                productOfferings.find((productOffering) => productOffering.product.id === enrollment.plan?.productId)
                                    ?.product?.name,
                            );
                    }

                    // Get current date and remove seconds, milliseconds
                    const currentDate = new Date().setHours(0, 0, 0, 0);

                    // check for open enrollment
                    const oePlanYears = planYears.filter((planYear) => {
                        const enrollmentStartDate = planYear.enrollmentPeriod.effectiveStarting;
                        const enrollmentEndDate = planYear.enrollmentPeriod.expiresAfter;

                        // When plan year is in open enrollment as of today
                        return this.dateService.isBetween(
                            this.dateService.toDate(enrollmentStartDate),
                            this.dateService.toDate(enrollmentEndDate),
                            currentDate,
                        );
                    });

                    // check for qle
                    const qleExists = qualifyingEvents.filter((qualifyingEvent) => {
                        const enrollmentStartDate = qualifyingEvent.enrollmentValidity?.effectiveStarting.toString();
                        const enrollmentEndDate = qualifyingEvent.enrollmentValidity?.expiresAfter.toString();
                        // When QLE is in enrollment as of today
                        return this.dateService.isBetween(
                            this.dateService.toDate(enrollmentStartDate),
                            this.dateService.toDate(enrollmentEndDate),
                            currentDate,
                        );
                    });
                    const isVAS = enrollment.plan?.vasFunding;
                    // Message for pending enrollment scenarios (when enrollment is not active yet)
                    if (enrollment.status === ApplicationStatusTypes.Pending.toUpperCase() || (!isVAS && !enrollment.carrierStatus)) {
                        if (!oePlanYears?.length && !qleExists?.length) {
                            // Message for enrollments that are not active yet
                            return this.languageStrings["primary.portal.shopPage.changes.enrollmentNotActive"].replace(
                                "#firstName",
                                memberData.name.firstName,
                            );
                        }
                        if (oePlanYears?.length) {
                            return this.languageStrings["primary.portal.shopPage.changes.openEnrollmentPeriod"].replace(
                                "#firstName",
                                memberData.name.firstName,
                            );
                        }
                        if (qleExists?.length) {
                            return this.languageStrings["primary.portal.shopPage.changes.enrollmentPeriod"].replace(
                                "#firstName",
                                memberData.name.firstName,
                            );
                        }
                    }

                    // Message for active policies which are editable
                    if (this.editable) {
                        return this.languageStrings["primary.portal.shoppingCart.planOfferings.policyRemainActive"];
                    }

                    // Message for active policies
                    if (enrollment.carrierStatus === ApplicationStatusTypes.Active.toUpperCase()) {
                        return this.enrollmentMessageEnum.ACTIVE_NO_EDIT;
                    }

                    // Non editable scenario
                    if (!this.editable && enrollment.status !== ApplicationStatusTypes.Pending.toUpperCase()) {
                        return this.languageStrings["primary.portal.quoteShop.outOfStatePolicy.text"].replace(
                            "##firstname##",
                            memberData.name.firstName,
                        );
                    }
                    return null;
                },
            ),
        );
        // Plan withdraw link will be applicable, based on below conditions of selected enrolled object
        this.enablePlanWithdrawLink$ = this.selectedEnrollment$.pipe(
            withLatestFrom(this.producerShopHelperService.inOpenEnrollment()),
            map(([enrollment, inOpenEnrollment]) => {
                if (!enrollment) {
                    return false;
                }
                const characteristics = this.planPanel.planOffering.plan.characteristics;
                const carrierId = enrollment.plan.carrierId;
                return (
                    // Withdraw application link will be visible for
                    // 1. carrier id 1(Aflac) or
                    // 2. in open enrollment for non-aflac partner carriers
                    (carrierId === CarrierId.AFLAC || inOpenEnrollment) &&
                    // enrollment is not yet sent to business or not active
                    !enrollment.feedSentDate &&
                    !enrollment.carrierStatus &&
                    // enrolled status should not be among Void, Ended or cancelled
                    ![
                        StatusNotAllowedForPlanWithdraw.VOID,
                        StatusNotAllowedForPlanWithdraw.ENDED,
                        StatusNotAllowedForPlanWithdraw.CANCELLED,
                    ].includes(enrollment.status as StatusNotAllowedForPlanWithdraw) &&
                    // enrolled plan should not be auto enrolled,VAS or declined
                    !(
                        characteristics?.includes(Characteristics.AUTOENROLLABLE) ||
                        characteristics?.includes(Characteristics.COMPANY_PROVIDED) ||
                        characteristics?.includes(Characteristics.DECLINE)
                    )
                );
            }),
        );

        // Set coverage date label's description with text and date, based on enrollment starting and expiring date
        this.coverageDateText$ = this.selectedEnrollment$.pipe(
            map((enrollment) => {
                const expireDate = enrollment.validity.expiresAfter;
                const startDate = enrollment.validity.effectiveStarting;
                if (expireDate) {
                    // TODO [Moment]: Format strings only using moment
                    return (
                        this.datePipe.transform(startDate, DateFormat.MONTH_DAY_YEAR) +
                        " - " +
                        this.datePipe.transform(expireDate, DateFormat.MONTH_DAY_YEAR)
                    );
                }
                {
                    const coverageDateText =
                        startDate <= this.currentDate
                            ? this.languageStrings["primary.portal.quoteShop.grandfatheredPlan.Began"]
                            : this.languageStrings["primary.portal.quoteShop.starts"];
                    // TODO [Moment]: Format strings only using moment
                    return coverageDateText + this.datePipe.transform(startDate, DateFormat.MONTH_DAY_YEAR);
                }
            }),
        );

        // Set Coverage level name
        this.coverageLevelName$ = this.selectedEnrollment$.pipe(
            map((enrollment) =>
                enrollment.coverageLevel.name === CoverageLevelNames.ENROLLED_COVERAGE
                    ? CoverageLevelNames.INDIVIDUAL_COVERAGE
                    : enrollment.coverageLevel.name,
            ),
        );

        this.onEdit$
            .pipe(
                withLatestFrom(
                    this.selectedEnrollment$,
                    this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(this.planPanel?.planOffering.plan.id))),
                ),
                tap(([_, enrollment, coverageLevels]) => {
                    const enrollmentId = enrollment.id;
                    this.producerShopComponentStoreService.setEnrollmentDetailsState({
                        enrollmentId: enrollmentId,
                        enrollmentDetailsState: { edit: true },
                    });
                    // update panel state with enrolled plan data
                    this.updatePanelState(enrollment, coverageLevels);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Navigate to policy change request
        this.navigateToPCR$
            .pipe(
                withLatestFrom(this.mpGroup$, this.memberData$),
                tap(([_, mpGroup, memberData]) => {
                    const url = `/producer/payroll/${mpGroup}/member/${memberData.id}/change-requests`;
                    this.router.navigate([url]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Calculate adjustment amount based on enrollment and rider costs
        this.adjustmentAmount$ = combineLatest([this.selectedEnrollment$, this.ridersTotalCostPerPayPeriod$]).pipe(
            withLatestFrom(this.ridersMemberCostPerPayPeriod$),
            map(([[selectedEnrollment, riderTotalCostPerPayPeriod], ridersMemberCostPerPayPeriod]) => {
                const memberCost = selectedEnrollment.memberCostPerPayPeriod + ridersMemberCostPerPayPeriod;
                const totalCost = selectedEnrollment.totalCostPerPayPeriod + riderTotalCostPerPayPeriod;
                const adjustmentAmount = totalCost - memberCost;
                return Number(adjustmentAmount.toFixed(TWO));
            }),
        );

        // Calculate net cost for selected enrolled plan
        this.netCost$ = combineLatest([this.selectedEnrollment$, this.ridersTotalCostPerPayPeriod$, this.adjustmentAmount$]).pipe(
            map(([selectedEnrollment, riderTotalCostPerPayPeriod, amount]) => {
                const totalCost = selectedEnrollment.totalCostPerPayPeriod + riderTotalCostPerPayPeriod;
                // amount after adjustment
                if (amount) {
                    const netCost = totalCost - amount;
                    //  Net cost will display 0 if it is less than or equal to 0 (planOffering price < adjustmentAmount)
                    return netCost <= 0 ? AMOUNT_ZERO.toString() : netCost.toString();
                }
                // no adjustment
                return totalCost.toString();
            }),
        );
        // Calculate base cost for selected enrolled plan
        this.baseCost$ = combineLatest([this.selectedEnrollment$, this.ridersTotalCost$, this.payFrequencyObject$]).pipe(
            map(([selectedEnrollment, ridersTotalCost, payFrequencyObject]) => {
                const baseCostMonthly = selectedEnrollment.totalCost + ridersTotalCost;
                return this.payrollFrequencyPipe.transform(baseCostMonthly, payFrequencyObject).toString();
            }),
        );
    }

    /**
     * Update panel state with enrolled plan details while on edit coverage
     * @param enrollment selected plan enrollment data
     * @param coverageLevels List of CoverageLevels
     */
    updatePanelState(enrollment: Enrollments, coverageLevels: CoverageLevel[]): void {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        this.producerShopComponentStoreService.upsertCoverageLevelState({
            coverageLevel: enrollment.coverageLevel,
            panelIdentifiers,
        });

        // Update store only if enrollment has benefit amount or it will be the default value of plan panel
        if (enrollment.benefitAmount) {
            this.producerShopComponentStoreService.upsertBenefitAmountState({
                benefitAmount: enrollment.benefitAmount,
                panelIdentifiers,
            });
        }

        // Update store only if enrollment has eliminationPeriod in coverage level object
        if (enrollment.coverageLevel?.eliminationPeriod) {
            // We need to find coverage level with Id to match coverage level object.
            const enrollmentCoverageLevel = enrollment?.coverageLevel.id
                ? coverageLevels.find(({ id }) => id === enrollment?.coverageLevel.id)
                : null;
            this.producerShopComponentStoreService.upsertEliminationPeriodState({
                eliminationPeriod: enrollmentCoverageLevel as EliminationPeriod,
                panelIdentifiers,
            });
        }
    }

    /**
     * Gets translated tax status record
     * @returns tax status record
     */
    getMappedTaxStatus(): Record<TaxStatus, string> {
        return {
            [TaxStatus.PRETAX]: this.languageStrings["primary.portal.quoteShop.preTax"],
            [TaxStatus.POSTTAX]: this.languageStrings["primary.portal.shoppingExperience.postTax"],
            [TaxStatus.UNKNOWN]: this.languageStrings["primary.portal.quoteShop.plansDisplay.unknown"],
            [TaxStatus.VARIABLE]: this.languageStrings["primary.portal.shoppingExperience.Variable"],
        };
    }
    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            "primary.portal.quoteShop.coverageLevel",
            "primary.portal.shoppingExperience.eliminationPeriod",
            "primary.portal.quoteShop.taxStatus",
            "primary.portal.quoteShop.coveredIndividuals",
            "primary.portal.shoppingExperience.coverageDate",
            "primary.portal.quoteShop.baseCost",
            "primary.portal.quoteShop.adjustments",
            "primary.portal.coverage.estate",
            "primary.portal.coverage.charity",
            "primary.portal.quoteShop.allEligibleDependents",
            "primary.portal.quoteShop.grandfatheredPlan.Began",
            "primary.portal.shopPage.primaryInsured",
            "primary.portal.shoppingExperience.beneficiaries",
            "primary.portal.coverage.editcoverage",
            "primary.portal.shoppingExperience.benefitAmount",
            "primary.portal.quoteShop.outOfStatePolicy.text",
            "primary.portal.quoteShop.preTax",
            "primary.portal.shoppingExperience.postTax",
            "primary.portal.quoteShop.plansDisplay.unknown",
            "primary.portal.shoppingExperience.Variable",
            "primary.portal.shoppingExperience.yourCost",
            "primary.portal.quoteShop.grandfatheredPlan",
            "primary.portal.shoppingCart.planOfferings.policyRemainActive",
            "primary.portal.shopPage.changes.enrollmentPeriod",
            "primary.portal.shopPage.changes.openEnrollmentPeriod",
            "primary.portal.shopPage.changes.autoEnrollment",
            "primary.portal.shopPage.changes.keepCoverage",
            "primary.portal.applicationFlow.planInfo.netCost",
            "primary.portal.quoteShop.starts",
            "primary.portal.shopPage.changes.enrollmentNotActive",
            "primary.portal.shopPage.changes.expiredEnrollment",
            "primary.portal.quoteShop.grandfatherPlanOptional123",
            "primary.portal.quoteShop.grandfatherPlanLapsed",
        ]);
    }

    /**
     * Method on click of edit coverage
     */
    onEdit(): void {
        this.onEdit$.next();
    }
    /**
     * Method to navigate to PCR page
     */
    navigateToPCR(): void {
        this.navigateToPCR$.next();
    }

    /**
     * Returns unique identifier for EnrollmentBeneficiary.
     * trackBy for *ngFor involving EnrollmentBeneficiary used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param beneficiary {EnrollmentBeneficiary} current EnrollmentBeneficiary in iteration
     * @returns unique identifier for EnrollmentBeneficiary
     */
    trackByEnrollmentBeneficiary(index: number, beneficiary: EnrollmentBeneficiary): string {
        return `${beneficiary?.beneficiary?.id}-${beneficiary.beneficiaryId}`;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
