import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ApplicationStatusTypes, CarrierStatus, QLEEndPlanRequestStatus, ReinstatementType } from "@empowered/api";
import {
    CarrierId,
    CrossBorderAlertType,
    DateFormat,
    EnrollmentEnums,
    PlanOfferingWithCartAndEnrollment,
    KnockoutType,
    Characteristics,
    PlanType,
    MissingInfoType,
    TaxStatus,
    EnrollmentRequirement,
    Enrollments,
    StatusType,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { getEnrollmentStatus } from "@empowered/ngrx-store/services/enrollment-helper/enrollment-helper.service";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { EnrollmentRequirementsService } from "../../services/enrollment-requirements/enrollment-requirements.service";
import { PlanOfferingService } from "../../services/plan-offering/plan-offering.service";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { PlanKnockoutEligibility } from "./../../services/producer-shop-component-store/producer-shop-component-store.model";
import { EndCoverageStatus } from "./../plans-container.model";
import {
    EndCoverageIconClass,
    EndCoverageIconData,
    EndCoverageIconName,
    EndCoverageQleEventData,
    EnrollmentStatusIconClass,
    EnrollmentStatusIconData,
    EnrollmentStatusIconName,
    PlanContainerData,
} from "./plan-container.model";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import { PlanService } from "../../services/plan/plan.service";
import { TpiRestrictionsHelperService } from "../../services/tpi-restriction-helper/tpi-restrictions-helper.service";
import { ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-plan-container",
    templateUrl: "./plan-container.component.html",
    styleUrls: ["./plan-container.component.scss"],
})
export class PlanContainerComponent implements OnInit, OnDestroy {
    @Input() planPanel: PlanOfferingWithCartAndEnrollment;
    @Input() productHasMissingInfo: boolean;

    // Used for unsubscribing
    private readonly unsubscriber$ = new Subject<void>();

    // Get whole enrollment set
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments)).pipe(
        // Avoid redundant emitted values when no enrollments have changed
        this.rxjsService.distinctArrayUntilChanged(),
    );

    // Get whole enrollment riders set
    private readonly allEnrollmentRiders$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getAllSelectedEnrollmentRiders)).pipe(
        // Avoid redundant emitted values when no enrollments have changed
        this.rxjsService.distinctArrayUntilChanged(),
    );

    // Check for open enrollment
    readonly isOE$ = this.producerShopHelperService.inOpenEnrollment();

    // Check for active QLE
    readonly isActiveQLE$ = this.producerShopHelperService.isActiveQLE();

    // Gets member info
    readonly memberInfo$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));

    // qle event data after end coverage is requested
    endCoverageQleEventData$!: Observable<false | EndCoverageQleEventData>;

    // Used for updating plan responses
    private readonly updatePlanResponses$ = new Subject<PlanOfferingWithCartAndEnrollment>();

    // Selected plan offering id
    readonly selectedPlanOfferingId$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferingId));

    // Selected Plan offering data
    readonly selectedPlanOffering$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOffering));

    readonly planType$ = this.getPlanType();
    planType = PlanType;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Tax status translation record
    readonly taxStatusMapping = this.getTaxStatusRecord();

    readonly knockoutType = KnockoutType;
    readonly crossBorderAlertType = CrossBorderAlertType;
    readonly missingInfoType = MissingInfoType;
    readonly applicationStatus = ApplicationStatusTypes;
    readonly endCoverageStatus = EndCoverageStatus;

    private isCrossBorderError$ = new Observable<boolean>();
    private planKnockoutEligibility$ = new Observable<PlanKnockoutEligibility>();
    // Gets plan dependency data
    private invalidEnrollmentRequirement$ = new Observable<EnrollmentRequirement>();

    // Gets data required for plan container conditions
    planContainerData$ = new Observable<PlanContainerData>();

    // Gets enrollments with expiration date
    enrollmentsWithExpirationDate$ = new Observable<boolean>();
    // Get whether supplementary plan is with missing information
    private isSupplementaryPlanHasMissingInformation$ = new Observable<boolean>();

    isExpandedPanel$ = new Observable<boolean>();
    // Gets selected cart item id
    readonly selectedCartItemId$ = this.ngrxStore.pipe(select(ShoppingCartsSelectors.getSelectedCartItemId));

    // Gets selected Plan Offering With CoverageDates
    private readonly selectedPlanOfferingData$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData));

    isOtherPanelMandatoryReinstate$ = new Observable<boolean>();
    // Observable of boolean to check whether enrolled plan is part of plan offerings
    isEnrolledPlanInPlanOfferings$!: Observable<boolean>;

    // indicates if dependent is required for Juvenile plans
    readonly isDependentRequired$ = this.tpiRestrictionsHelper.isDependentRequiredForJuvenile();
    // Observable of string to get tax status language value
    taxStatus$: Observable<string>;

    // Get list of plan years
    private readonly planYears$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedPlanYearSet));

    // active enrollments excluding end coverage requested enrollments
    activeEnrollments$!: Observable<Enrollments[]>;

    // Gets QLE
    private readonly qualifyingEvents$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedQualifyEvents));

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly languageService: LanguageService,
        private readonly rxjsService: RXJSService,
        private readonly planService: PlanService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly manageCartItemsHelperService: ManageCartItemsHelperService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly enrollmentRequirementsService: EnrollmentRequirementsService,
        private readonly tpiRestrictionsHelper: TpiRestrictionsHelperService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        const planOfferingId = this.planPanel.planOffering.id;

        this.endCoverageQleEventData$ = this.ngrxStore
            .onAsyncValue(select(EnrollmentsSelectors.getQLEForEndedCoverage(this.planPanel.enrollment)))
            .pipe(
                map((planOfferingWithQLE) => {
                    if (!planOfferingWithQLE) {
                        return false;
                    }

                    const endCoverageStatus = this.getEndCoverageStatus(
                        planOfferingWithQLE.endPlanRequestStatus,
                        planOfferingWithQLE.requestedCoverageEndDate,
                    );

                    return {
                        endCoverageStatus,
                        requestedCoverageEndDate: this.dateService.format(
                            this.dateService.toDate(planOfferingWithQLE.requestedCoverageEndDate),
                            DateFormat.MONTH_DAY_YEAR,
                        ),
                        iconData: this.getEndCoverageIconData(endCoverageStatus),
                    };
                }),
            );

        // triggers add to cart logic, by opening knockout dialog on click of update responses link
        this.updatePlanResponses$
            .pipe(
                withLatestFrom(this.selectedPlanOfferingId$),
                switchMap(([planOfferingData, selectedPlanOfferingId]) => {
                    if (planOfferingData.planOffering.id !== selectedPlanOfferingId) {
                        this.onPlanSelection(planOfferingData);
                    }
                    return this.manageCartItemsHelperService.openKnockoutDialog();
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Gets if cross border error for this plan offering
        this.isCrossBorderError$ = this.ngrxStore.onAsyncValue(
            select(PlanOfferingsSelectors.isCrossBorderRestrictionError(planOfferingId)),
        );
        const selectedPlanObject = this.planPanel.planOffering.plan;
        this.isSupplementaryPlanHasMissingInformation$ = this.ngrxStore.onAsyncValue(
            select(
                PlanOfferingsSelectors.isSupplementaryPlanHasMissingInformation(
                    selectedPlanObject.id,
                    this.planService.isSupplementaryPlan(selectedPlanObject),
                ),
            ),
        );

        // Gets plan knockout eligibility for this plan offering
        this.planKnockoutEligibility$ = this.producerShopComponentStoreService.getKnockoutEligibilityByPlanOfferingId(planOfferingId);

        // gets active enrollments by filtering out end coverage requested enrollments
        this.activeEnrollments$ = this.enrollments$.pipe(
            withLatestFrom(this.qualifyingEvents$),
            map(([enrollments, qualifyingEvents]) =>
                enrollments.filter(
                    (enrollment) =>
                        !qualifyingEvents?.some(
                            (qualifyingEvent) =>
                                qualifyingEvent.id === enrollment?.qualifyingEventId &&
                                (qualifyingEvent.endPlanRequestStatus || qualifyingEvent.requestedCoverageEndDate) &&
                                (enrollment?.status === CarrierStatus.ACTIVE || enrollment?.status === StatusType.APPROVED),
                        ),
                ),
            ),
        );

        // Gets plan dependency data based on in
        this.invalidEnrollmentRequirement$ = combineLatest([this.activeEnrollments$, this.allEnrollmentRiders$]).pipe(
            map(([enrollments, enrollmentRiders]) =>
                // Gets invalid requirement data based on plan offering
                this.enrollmentRequirementsService.getInvalidPlanEnrollmentRequirementData(
                    this.planPanel.planOffering,
                    enrollments,
                    enrollmentRiders,
                ),
            ),
        );

        // used for disabling and showing mandatory reinstate for panels other than lapsed reinstate policy
        this.isOtherPanelMandatoryReinstate$ = this.enrollments$.pipe(
            map((enrollments) => {
                // If current plan mandatory reinstatement & enrollment status is not Approved then return false
                if (
                    this.planPanel.enrollment?.reinstatement === ReinstatementType.MANDATORY &&
                    this.planPanel.enrollment?.status !== StatusType.APPROVED
                ) {
                    return false;
                }
                // Get product enrollments
                const productEnrollments = enrollments.filter(
                    (enrollment) =>
                        enrollment.plan?.productId ===
                        (this.planPanel.planOffering.plan.product?.id || this.planPanel.planOffering.plan.productId),
                );

                // No product enrollments, then no mandatory reinstatement
                if (!productEnrollments.length) {
                    return false;
                }

                // Get mandatory reinstatement from product enrollments
                const mandatoryReinstateEnrollment = productEnrollments.find(
                    (enrollment) => enrollment.reinstatement === ReinstatementType.MANDATORY,
                );

                // If no mandatory reinstatement enrollment return false
                if (mandatoryReinstateEnrollment && this.planPanel.enrollment?.status === StatusType.APPROVED) {
                    return true;
                }

                return false;
            }),
        );

        // Gets the data needed for plan container loading
        this.planContainerData$ = combineLatest([
            this.isCrossBorderError$,
            this.planKnockoutEligibility$,
            this.invalidEnrollmentRequirement$,
            this.isSupplementaryPlanHasMissingInformation$,
            this.isOtherPanelMandatoryReinstate$,
            this.isDependentRequired$,
        ]).pipe(
            map(
                ([
                    isCrossBorderError,
                    knockoutEligibility,
                    inValidEnrollmentRequirement,
                    isSupplementaryPlanHasMissingInformation,
                    isOtherPanelMandatoryReinstate,
                    isDependentRequired,
                ]) => {
                    const enrollmentStatus = this.planPanel.enrollment ? getEnrollmentStatus(this.planPanel.enrollment) : null;
                    return {
                        knockoutEligibility,
                        inValidEnrollmentRequirement,
                        enrollmentStatus,
                        enrollmentStatusIconData: this.getEnrollmentStatusIconData(enrollmentStatus),
                        enrollmentEditable: this.planPanelService.isEnrollmentEditable(this.planPanel),
                        isOtherPanelMandatoryReinstate,
                        // Have to disable plan panel based on below conditions
                        disablePlanPanel: Boolean(
                            // plan offering has missing information
                            this.planPanel.planOffering.missingInformation ||
                                // cross border restriction error
                                isCrossBorderError ||
                                // knockout type as KNOCKOUT
                                knockoutEligibility?.knockoutType === KnockoutType.KNOCKOUT ||
                                // invalid enrollment requirement
                                inValidEnrollmentRequirement ||
                                // is supplementary plan is with missing information
                                isSupplementaryPlanHasMissingInformation ||
                                // is Mandatory reinstate for product
                                isOtherPanelMandatoryReinstate ||
                                // is Dependent required (for Juvenile products)
                                isDependentRequired,
                        ),
                    };
                },
            ),
        );

        // Gets enrollments with expiration date
        this.enrollmentsWithExpirationDate$ = this.isOE$.pipe(
            map((oe) => this.producerShopHelperService.isOEAndEnrollmentDueToExpire(this.planPanel.enrollment, oe)),
        );

        // gets if this plan panel is expanded or not
        // Expand if panel is selected and dependent is not required
        this.isExpandedPanel$ = combineLatest([
            this.producerShopHelperService.isSelectedPlanPanel(this.planPanel),
            this.isDependentRequired$,
        ]).pipe(map(([isPanelSelected, isDependentRequired]) => isPanelSelected && !isDependentRequired));

        this.isEnrolledPlanInPlanOfferings$ = this.producerShopHelperService.isEnrolledPlanInPlanOfferings(this.planPanel);

        // Gets tax status based on tax status and plan years data
        this.taxStatus$ = this.planYears$.pipe(
            withLatestFrom(this.isOE$, this.isActiveQLE$),
            map(([planYears, isOE, isActiveQLE]) => {
                // If tax status is not variable, display the same tax status
                if (this.planPanel.planOffering.taxStatus !== TaxStatus.VARIABLE) {
                    return this.taxStatusMapping[this.planPanel.planOffering.taxStatus];
                }
                const openEnrollmentPlanYears = this.planOfferingService.getOpenEnrollmentPlanYears(planYears);
                const isVariableInOE = openEnrollmentPlanYears.some((planYear) => planYear.id === this.planPanel.planOffering.planYearId);
                // If open enrollment and variable plan in open enrollment or has active QLE, display as pretax
                // else display as post tax
                return (isOE && isVariableInOE) || isActiveQLE
                    ? this.taxStatusMapping[TaxStatus.PRETAX]
                    : this.taxStatusMapping[TaxStatus.POSTTAX];
            }),
        );
    }

    /**
     * gets enrollment status icon data - name and class to be applied
     * @param enrollmentStatus possible enrollment status
     * @returns {EnrollmentStatusIconData | null} with class and name for respective application status or null
     */
    getEnrollmentStatusIconData(enrollmentStatus: ApplicationStatusTypes): EnrollmentStatusIconData | null {
        if (!enrollmentStatus) {
            return null;
        }
        switch (enrollmentStatus) {
            case ApplicationStatusTypes.Enrolled:
                return { class: EnrollmentStatusIconClass.ENROLLED, name: EnrollmentStatusIconName.ENROLLED };
            case ApplicationStatusTypes.Active:
                return { class: EnrollmentStatusIconClass.ACTIVE, name: EnrollmentStatusIconName.ACTIVE };
            case ApplicationStatusTypes.Lapsed:
                return { class: EnrollmentStatusIconClass.LAPSED, name: EnrollmentStatusIconName.LAPSED };
            case ApplicationStatusTypes.Ended:
                return { class: EnrollmentStatusIconClass.ENDED, name: EnrollmentStatusIconName.ENDED };
            default:
                return null;
        }
    }

    /**
     * gets end coverage status icon data - name class to be applied
     * @param endCoverageStatus possible end coverage status
     * @returns {EndCoverageIconData | null} with class and name for respective end coverage status or null
     */
    getEndCoverageIconData(endCoverageStatus: EndCoverageStatus): EndCoverageIconData | null {
        if (!endCoverageStatus) {
            return null;
        }
        switch (endCoverageStatus) {
            case EndCoverageStatus.ACTIVE:
                return { class: EndCoverageIconClass.ACTIVE, name: EndCoverageIconName.ACTIVE };
            case EndCoverageStatus.ENDED:
                return { class: EndCoverageIconClass.ENDED, name: EndCoverageIconName.ENDED };
            case EndCoverageStatus.END_COVERAGE_REQUESTED:
                return { class: EndCoverageIconClass.END_COVERAGE_REQUESTED, name: EndCoverageIconName.END_COVERAGE_REQUESTED };
            default:
                return null;
        }
    }

    /**
     * Sets selected plan data to store on selection
     * @param planOfferingWithCartAndEnrollment plan offering with coverage date
     */
    onPlanSelection(planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment): void {
        this.producerShopHelperService.setSelectedPlanDataToStore(planOfferingWithCartAndEnrollment);
    }

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.quoteShop.plansDisplay.licensingRequired",
            "primary.portal.shopQuote.planStatusInfo",
            "primary.portal.quoteShop.plansDisplay.memberIneligible",
            "primary.portal.shopPage.knockoutQuestions.qualify",
            "primary.portal.quoteShop.plansDisplay.updateResponses",
            "primary.portal.quoteShop.dependency.planDependency",
            "primary.portal.quoteShop.plansDisplay.pretax",
            "primary.portal.quoteShop.plansDisplay.posttax",
            "primary.portal.quoteShop.plansDisplay.unknown",
            "primary.portal.benefitsOffering.prePostTax",
            "primary.portal.quoteShop.plansDisplay.reinstateMandatory",
        ]);
    }

    /**
     * Gets translated tax status record
     * @returns tax status record
     */
    getTaxStatusRecord(): Record<TaxStatus, string> {
        return {
            [TaxStatus.PRETAX]: this.languageStrings["primary.portal.quoteShop.plansDisplay.pretax"],
            [TaxStatus.POSTTAX]: this.languageStrings["primary.portal.quoteShop.plansDisplay.posttax"],
            [TaxStatus.UNKNOWN]: this.languageStrings["primary.portal.quoteShop.plansDisplay.unknown"],
            [TaxStatus.VARIABLE]: this.languageStrings["primary.portal.benefitsOffering.prePostTax"],
        };
    }

    /**
     * Function to return plan current status based on end coverage status
     * @param endCoverageStatus status for qualifying event
     * @returns {EndCoverageStatus} plan current status based on end coverage status
     */
    getEndCoverageStatus(endCoverageStatus: string, endCoverageDate: string): EndCoverageStatus | undefined {
        switch (endCoverageStatus) {
            // If QLE request status is either submitted or pending for admin HR approval
            case QLEEndPlanRequestStatus.PENDING_HR_APPROVAL:
            case QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED:
                return EndCoverageStatus.END_COVERAGE_REQUESTED;
            // If QLE request status is already cancelled
            case QLEEndPlanRequestStatus.COVERAGE_CANCELLED:
                // If policy ended in past then its Ended else Its active for cancellation
                return this.dateService.isBefore(this.dateService.toDate(endCoverageDate))
                    ? EndCoverageStatus.ENDED
                    : EndCoverageStatus.ACTIVE;
        }
        return undefined;
    }

    /**
     * trigger update plan responses subject and inturn triggers add to cart logic
     * @param planOfferingWithCartAndEnrollment plan offering with cart and enrollment data
     */
    updatePlanResponses(planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment): void {
        this.updatePlanResponses$.next(planOfferingWithCartAndEnrollment);
    }

    /**
     * There are multiple types of plans that have specific ui to display.
     * Commonly standard plans are shown
     * but there are other variations such as redirect plans (also known as carrier specific plans) and bucket plans.
     * @returns {PlanType} Which plan to display
     */
    getPlanType(): Observable<PlanType> {
        return this.selectedPlanOffering$.pipe(
            map((planOffering) => {
                // If there is no PlanOffering found using PanelIdentifiers
                // Assume we want to display error using Standard Plan
                if (!planOffering) {
                    return PlanType.STANDARD;
                }

                if (this.planOfferingService.isRedirectPlanOffering(planOffering)) {
                    return PlanType.REDIRECT;
                }
                if (
                    // carrier id should be among Wageworks
                    planOffering.plan.carrierId === CarrierId.WAGEWORKS ||
                    // product id should be among HSA or FSA
                    EnrollmentEnums.productIds.HSA.includes(planOffering.plan.product.id) ||
                    (EnrollmentEnums.productIds.FSA.includes(planOffering.plan.product.id) &&
                        // Shouldn't be auto enrollable
                        !planOffering.plan?.characteristics?.includes(Characteristics.AUTOENROLLABLE))
                ) {
                    return PlanType.BUCKET;
                }
                return PlanType.STANDARD;
            }),
        );
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
