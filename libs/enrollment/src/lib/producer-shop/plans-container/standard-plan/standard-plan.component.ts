import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { CarrierStatus } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { ShoppingCartsActions, ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { filter, map, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { RiderComponentStoreService } from "../../services/rider-component-store/rider-component-store.service";
import { ApiErrorDetailField } from "./standard-plan.constants";
import { ApiErrorWithDetails } from "./standard-plan.model";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import {
    AsyncData,
    AsyncStatus,
    PlanOfferingWithCartAndEnrollment,
    KnockoutType,
    Characteristics,
    PlanType,
    TaxStatus,
    Enrollments,
    PlanOfferingPricing,
} from "@empowered/constants";

@Component({
    selector: "empowered-standard-plan",
    templateUrl: "./standard-plan.component.html",
    styleUrls: ["./standard-plan.component.scss"],
})
export class StandardPlanComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // Get PlanOfferingPricing AsyncData set using PlanOffering input bind
    // Using AsyncData.error display error message or display list of pricings
    planOfferingPricingsData$!: Observable<AsyncData<PlanOfferingPricing[]>>;
    planOfferingPricingsError$!: Observable<ApiErrorWithDetails | null>;
    noPricingsMessage$!: Observable<string>;
    planOfferingPricings$!: Observable<PlanOfferingPricing[]>;

    // Get Enrollment plan using PlanOffering input bind
    enrollmentPlan!: Enrollments | null;

    // Check if enrollment is re-enrollable using PlanOffering input bind
    isReEnrollmentPlan$!: Observable<boolean>;

    // Carrier staus enum
    readonly carrierStatus = CarrierStatus;

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService
        .getSelectedProductRiskClassOnAsyncValue()
        .pipe(map((riskClass) => riskClass?.id));

    // Get the latest tobacco status based on dropdown
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    private readonly onCancel$ = new Subject<void>();

    // Get tax status to add check in html file
    readonly taxStatus = TaxStatus;

    // Gets MemberProfile
    readonly memberProfile$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));

    // Gets selected enrollment state
    readonly stateAbbreviation$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation));

    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    // setting enum as property of Component to use it in template
    readonly PlanType = PlanType;

    // Triggers delete cart item and hold item id
    private readonly deletedCartItemId$ = new Subject<number>();

    // Get MpGroup ID
    private readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Get member ID
    private readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Delete cart item
    private readonly deletedCartItem$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.deletedCartItem));

    // Gets plan eligibility based on knockouts
    readonly knockoutPlanEligibility$ = this.producerShopComponentStoreService.selectPlanKnockoutEligibility();

    // Check if sponse knockout using PlanOffering input bind
    isSpouseKnockout$: Observable<boolean>;

    private readonly updatePlanResponses$ = new Subject<void>();

    // Observable of boolean type to display spinner element on dom
    displaySpinnerElement$: Observable<boolean>;

    // Gets selected Plan Offering
    private readonly selectedPlanOfferingData$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData));

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly languageService: LanguageService,
        private readonly manageCartItemsHelperService: ManageCartItemsHelperService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
    ) {}

    ngOnInit(): void {
        const planOffering = this.planPanel.planOffering;
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);
        const shoppingCartItemId = this.planPanel.cartItemInfo?.id;

        this.enrollmentPlan = this.planPanelService.getEnrollmentPlan(this.planPanel);

        this.planOfferingPricingsData$ = combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            // Get the latest tobacco status based on dropdown
            this.selectedTobaccoInformation$,
        ]).pipe(
            switchMap(([riskClassId, coverageEffectiveDate, selectedTobaccoInformation]) =>
                this.ngrxStore.pipe(
                    select(
                        PlanOfferingsSelectors.getPlanOfferingPricings(
                            false,
                            selectedTobaccoInformation.memberIsTobaccoUser,
                            selectedTobaccoInformation.spouseIsTobaccoUser,
                            planOffering.id,
                            riskClassId,
                            coverageEffectiveDate,
                            null,
                            null,
                            null,
                            shoppingCartItemId,
                        ),
                    ),
                ),
            ),
        );

        // Get PlanOfferingPricings and fallback to empty array if error
        this.planOfferingPricings$ = this.planOfferingPricingsData$.pipe(
            filter((asyncData) => asyncData.status === AsyncStatus.FAILED || asyncData.status === AsyncStatus.SUCCEEDED),
            map((asyncData) => asyncData.value ?? []),
        );

        // Get ApiError if it happens when getting PlanOfferingPricings
        this.planOfferingPricingsError$ = this.planOfferingPricingsData$.pipe(
            map((asyncData) => {
                if (asyncData.status !== AsyncStatus.FAILED) {
                    return null;
                }

                // TODO [Types]: We have to use type assertion here since
                // ApiError doesn't include the expected details optional property
                return asyncData.error as ApiErrorWithDetails;
            }),
        );

        // Show error message related to enrollment state or general error message
        this.noPricingsMessage$ = this.planOfferingPricingsError$.pipe(
            withLatestFrom(this.stateAbbreviation$, this.memberProfile$),
            map(([apiError, stateAbbreviation, memberProfile]) => {
                if (apiError?.details?.some((detail) => detail.field === ApiErrorDetailField.STATE)) {
                    return this.languageStrings["primary.portal.quoteShop.plansDisplay.pricingNotAvailable"].replace(
                        "##state##",
                        stateAbbreviation,
                    );
                }

                return `${this.languageStrings["primary.portal.quoteShop.planNotCurrentlyAvailable"]} ${memberProfile?.name?.firstName}`;
            }),
        );

        // check if enrollment is eligible for re-enrollment
        this.isReEnrollmentPlan$ = this.producerShopHelperService.inOpenEnrollment().pipe(
            map((inOpenEnrollment) => {
                const enrollment = this.planPanelService.getEnrollmentPlan(this.planPanel);

                return this.producerShopHelperService.isOEAndEnrollmentDueToExpire(enrollment, inOpenEnrollment);
            }),
        );

        this.onCancel$
            .pipe(
                switchMap(() => {
                    const enrollment = this.planPanel.enrollment;
                    const enrollmentId = enrollment?.id;
                    this.producerShopComponentStoreService.setEnrollmentDetailsState({
                        enrollmentId,
                        enrollmentDetailsState: { edit: false },
                    });
                    return this.riderComponentStoreService.selectValidatedRiderStates(panelIdentifiers);
                }),
                tap((riderStates) => {
                    // remove the changes made to riders in edit coverage
                    this.riderComponentStoreService.removeRidersStates(riderStates);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Dispatch any NGRX Actions that rely on mpGroup and/or memberId
        combineLatest([this.mpGroup$, this.memberId$])
            .pipe(
                tap(([mpGroup, memberId]) => {
                    this.ngrxStore.dispatchIfIdle(
                        ShoppingCartsActions.loadAppliedFlexDollars({ memberId, mpGroup }),
                        ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCart,
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Run on trigger of delete cart item and default to edit false
        // Once the enrollment cart item is deleted successfully
        this.deletedCartItemId$
            .pipe(
                withLatestFrom(this.memberId$, this.mpGroup$),
                tap(([cartItemId, memberId, mpGroup]) => {
                    this.ngrxStore.dispatch(
                        ShoppingCartsActions.deleteCartItem({
                            memberId,
                            mpGroup,
                            cartItemId,
                        }),
                    );
                }),
                switchMap(() => this.deletedCartItem$),
                switchMap(() => {
                    const enrollment = this.planPanel.enrollment;
                    const enrollmentId = enrollment?.id;
                    this.producerShopComponentStoreService.setEnrollmentDetailsState({
                        enrollmentId: enrollmentId,
                        enrollmentDetailsState: { edit: false },
                    });
                    return this.riderComponentStoreService.selectValidatedRiderStates(panelIdentifiers);
                }),
                tap((riderStates) => {
                    // remove the changes made to riders in edit coverage
                    this.riderComponentStoreService.removeRidersStates(riderStates);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // gets if spouse knockout is true or not for selected plan
        this.isSpouseKnockout$ = this.knockoutPlanEligibility$.pipe(
            map((knockoutPlanEligibility) => knockoutPlanEligibility[planOffering.id]?.knockoutType === KnockoutType.SPOUSE_KNOCKOUT),
        );

        // triggers add to cart logic on click of update responses link of spouse knockout
        this.updatePlanResponses$
            .pipe(
                switchMap(() => this.manageCartItemsHelperService.openKnockoutDialog(true)),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // spinner element will be available on dom for selected plan alone
        this.displaySpinnerElement$ = this.producerShopHelperService.isSelectedPlanPanel(this.planPanel);
    }

    /**
     * Method on click of cancel.
     * Switches to enrollment view from standard view.
     */
    onCancel(): void {
        this.onCancel$.next();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
    /**
     * When an enrollment card is opened in edit mode
     * And the same plan is added to cart, cancel changes will allow
     * Delete cart item and also switch back to enrollment card view
     */
    deleteAndCancelChanges(cartItemId?: number): void {
        this.deletedCartItemId$.next(cartItemId);
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.quoteShop.plansDisplay.pricingNotAvailable",
            "primary.portal.quoteShop.planNotCurrentlyAvailable",
        ]);
    }

    /**
     * Updates spouse knockout question responses
     */
    updateSpouseResponses(): void {
        this.updatePlanResponses$.next();
    }
}
