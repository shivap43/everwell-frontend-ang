import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { select } from "@ngrx/store";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { filter, map, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { ShoppingCartDisplayService } from "@empowered/api";
import { AccountsActions, AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ProductsActions, ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersActions, MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { SharedActions, SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsActions, PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";

import {
    Account,
    AsyncData,
    AsyncStatus,
    Channel,
    ClientErrorResponseCode,
    CombinedOfferingWithCartAndEnrollment,
    ConfigName,
    CoverageLevelId,
    CURRENCY_CODE,
    DateFormat,
    DependentRelationsId,
    Flow,
    GroupAttributeName,
    PlanOfferingWithCartAndEnrollment,
    RewriteConfigName,
    ShopPageType,
    TobaccoInformation,
    UpdateCartItem,
    Characteristics,
    ExceptionType,
    EnrollmentMethod,
    RatingCode,
    PlanOffering,
    GetCartItems,
    EnrollmentRider,
    TobaccoStatus,
    Gender,
    MemberProfile,
    PlanYear,
    StepType,
    PolicyOwnershipType,
} from "@empowered/constants";
import { ProductOfferingsActions, ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { DualPlanYearService, StaticUtilService } from "@empowered/ngxs-store";
import { combineAsyncDatas, mapAsyncData } from "@empowered/ngrx-store/ngrx.store.helpers";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { ShoppingCartsActions, ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { ProducerShopComponentStoreService } from "./services/producer-shop-component-store/producer-shop-component-store.service";
import { AgeService } from "./services/age/age.service";
import {
    AnsweredKnockoutQuestion,
    ApplicantDetails,
    EnrollmentDetailsState,
    MoreSettings,
    PanelIdentifiers,
    ProductCoverageDate,
    SpouseDetails,
} from "./services/producer-shop-component-store/producer-shop-component-store.model";
import { NumberOrdinalService } from "./services/number-ordinal/number-ordinal.service";
import { ManageCartItemsHelperService } from "./services/manage-cart-items/manage-cart-items-helper.service";
import { DatesService } from "@empowered/ngrx-store/services/dates/dates.service";
// eslint-disable-next-line max-len
import { CompanyProvidedProductsDialogComponent } from "../shop-experience/shop-overview/company-provided-products-dialog/company-provided-products-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ProducerShopHelperService } from "./services/producer-shop-helper/producer-shop-helper.service";
import { CartLockDialogComponent } from "../cart-lock-dialog/cart-lock-dialog.component";
import { DualPlanYearHelperService } from "./services/dual-plan-year-helper/dual-plan-year-helper.service";
import { EnrollmentPeriodData, ShopPeriodType } from "./services/dual-plan-year-helper/dual-plan-year-helper.model";
import { NGXSLanguageService } from "./services/ngxs-language/ngxs-language.service";
import { RiderComponentStoreService } from "./services/rider-component-store/rider-component-store.service";
import { ZeroStateButton, ZeroStateButtonType } from "./plans-container/plans-container.model";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import { NGXSSyncService } from "./services/ngxs-sync/ngxs-sync.service";
import { PlanPanelService } from "./services/plan-panel/plan-panel.service";
import { RiderStateValidationOptions } from "./services/rider-state/rider-state.model";
import { AsyncStateService } from "./services/async-state/async-state.service";
import { UrlFlow } from "./producer-shop.model";
import { NGXSExpandedCartHelperService } from "./services/ngxs-expanded-cart-helper/ngxs-expanded-cart-helper.service";
import { NGXSEnrollmentStateService } from "./services/ngxs-sync/ngxs-enrollment-state/ngxs-enrollment-state.service";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-producer-shop",
    templateUrl: "./producer-shop.component.html",
    styleUrls: ["./producer-shop.component.scss"],
    providers: [
        ProducerShopComponentStoreService,
        ManageCartItemsHelperService,
        RiderComponentStoreService,
        SettingsDropdownComponentStore,
        NGXSSyncService,
    ],
})
export class ProducerShopComponent implements OnInit, OnDestroy {
    private readonly account$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedAccount));
    private readonly stateAbbreviation$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation),
    );
    private readonly enrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));
    private readonly navigationOnZeroState$ = new Subject<ZeroStateButtonType>();
    private readonly planOfferingsData$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferings));
    private readonly planOfferings$ = this.planOfferingsData$.pipe(this.ngrxStore.filterForAsyncValue());
    private readonly isDirectFlow$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedFlow)).pipe(map((flow) => flow === Flow.DIRECT));
    // current date without time
    private readonly currentDate = this.dateService.toDate(new Date().setHours(0, 0, 0, 0));
    readonly languageStrings = this.getLanguageStrings();

    // Gets plan years needed for zero state
    private readonly planYears$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedPlanYearSet));

    // Gets valid coverageDatesEnrollmentType based on dual plan year service logic
    private readonly coverageDatesEnrollmentType$ = this.ngrxStore.pipe(
        select(PlanOfferingsSelectors.getSelectedCoverageDatesEnrollmentType),
    );

    // Gets valid referenceDate based on dual plan year service logic
    private readonly referenceDate$ = this.ngrxStore.pipe(select(ProductOfferingsSelectors.getSelectedReferenceDate));
    private readonly declineProductOffering$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getDeclineProductOfferingSets));
    display = true;

    // #region used for zero state shop page
    // filter Function to check whether group is in open enrollment to display OE in future or past error message
    readonly isOE$ = this.producerShopHelperService.inOpenEnrollment();

    // gets selected shop page
    private readonly selectedShopPageType$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedShopPageType));

    // Gets shop label text based on shop page type
    readonly shopLabelText$ = this.selectedShopPageType$.pipe(
        map((shopPageType) => {
            if (!shopPageType) {
                return "";
            }
            switch (shopPageType) {
                case ShopPageType.SINGLE_OE_SHOP:
                case ShopPageType.DUAL_OE_SHOP:
                    return this.languageStrings["primary.portal.shop.dualPlanYear.openEnrollmentsShop"];
                case ShopPageType.SINGLE_QLE_SHOP:
                case ShopPageType.DUAL_QLE_SHOP:
                    return this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventEnrollmentShop"];
                case ShopPageType.CONTINUOUS_SHOP:
                    return this.languageStrings["primary.portal.shoppingCart.quoteLevelSettings.header.shop"];
                case ShopPageType.DUAL_CURRENT_QLE:
                    return this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollmentShop"];
                case ShopPageType.DUAL_FUTURE_QLE:
                    return this.languageStrings["primary.portal.shop.dualPlanYear.lifeEventFutureEnrollmentShop"];
            }
        }),
    );

    // if plan years are associated with group, then check for group is not in open enrollment and no plan offered with non direct flow
    readonly zeroState$: Observable<ZeroStateButton> = combineLatest([
        this.planOfferingsData$,
        this.planYears$,
        this.isDirectFlow$,
        this.isOE$,
        this.shopLabelText$,
        this.referenceDate$,
    ]).pipe(
        map(([planOfferingsData, planYears, isDirectFlow, isOE, shopLabelText, referenceDate]) => {
            const planOfferingAsyncStatus = planOfferingsData.status;
            // Get plan year which have coverage starting date same as reference date to check if OE in Future or Past
            const activePlanYears = planYears.filter((resp) => resp.coveragePeriod.effectiveStarting === referenceDate);
            // Pass all plan years when trying to generate zero state error message.
            // This is done because there are specific error messages depending on plan years that are upcoming in the future
            const errorMessage = this.getZeroStateErrorMessage(planOfferingsData, planYears, isDirectFlow);

            // Determines QLE conditions with latest values
            const isQLEButton =
                // Plan offering api should not be failed
                planOfferingAsyncStatus !== AsyncStatus.FAILED &&
                // plan offerings should not exist
                !this.isPlanOfferingsExistAsync(planOfferingsData) &&
                // Should not be direct flow
                !isDirectFlow &&
                // Should have plan years
                !!activePlanYears.length &&
                // Should not be in OE
                !isOE;

            // Determines BenefitsNotOffered conditions
            const isBenefitsNotOfferedButton =
                // Should not be QLE button
                // Should have failed plan offering response
                // error status should be 409
                !isQLEButton &&
                planOfferingAsyncStatus === AsyncStatus.FAILED &&
                +planOfferingsData.error.status === ClientErrorResponseCode.RESP_409;

            // "QLE" button
            if (isQLEButton) {
                return this.getZeroStateButton(
                    errorMessage,
                    planOfferingAsyncStatus,
                    shopLabelText,
                    ZeroStateButtonType.QLE,
                    this.languageStrings["primary.portal.shopQuote.specificPayroll.addLifeEvent"],
                );
            }

            // "BenefitOfferings" button
            if (isBenefitsNotOfferedButton) {
                return this.getZeroStateButton(
                    errorMessage,
                    planOfferingAsyncStatus,
                    shopLabelText,
                    ZeroStateButtonType.BENEFITS_OFFERING,
                    this.languageStrings["primary.portal.shopQuote.specificPayroll.buildBenefitsOffering"],
                );
            }

            // "Employee" buttons (2)
            if (!isBenefitsNotOfferedButton) {
                // Navigation updated using button type is "Employee" for both "customer" and "employee" language strings
                return this.getZeroStateButton(
                    errorMessage,
                    planOfferingAsyncStatus,
                    shopLabelText,
                    ZeroStateButtonType.EMPLOYEE,
                    isDirectFlow
                        ? this.languageStrings["primary.portal.shopQuote.specificPayroll.returnToListing"].replace(
                            "##employeeOrCustomer##",
                            this.languageStrings["primary.portal.shopQuote.specificPayroll.customer"],
                        )
                        : this.languageStrings["primary.portal.shopQuote.specificPayroll.returnToListing"].replace(
                            "##employeeOrCustomer##",
                            this.languageStrings["primary.portal.shopQuote.specificPayroll.employee"],
                        ),
                );
            }

            // If no conditions are met, return object
            return {
                errorMessage,
                planOfferingAsyncStatus,
                shopLabelText,
                buttonType: null,
                buttonText: null,
            };
        }),
    );
    // #endregion

    private readonly selectedEnrollments$ = this.ngrxStore.pipe(select(EnrollmentsSelectors.getSelectedEnrollments));

    // Gets cartItemAdded data
    private readonly cartItemAdded$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getAddedCartItem));

    // Gets cartItemUpdated data
    private readonly cartItemUpdated$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getUpdatedCartItem));

    // Gets cartItemDeleted data
    private readonly cartItemDeleted$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.deletedCartItem));

    // used for Occupation Class dropdown
    private readonly riskClassesData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedRiskClasses));

    // #region Used for More Settings dropdown
    private readonly selectedPayFrequencyData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedPayFrequency));
    private readonly memberData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberProfile));
    private readonly memberDataOnAsyncValue$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));
    private readonly salarySummaryData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedSalarySummary));
    private readonly dependentsData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberDependents));
    private readonly spouseData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedSpouseDependent));
    // #endregion

    // Get Items in Cart
    private readonly cartItems$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.getCartItemsSet));
    // Get Clear Cart items response
    private readonly cartItemsCleared$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.clearCartItems));
    // Used for coverage dates
    private readonly combinedOfferingsOnAsyncValue$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getSelectedCombinedOfferings),
    );
    // Used for Auto enrolled plans
    private readonly combinedOfferingsWithCartAndEnrollmentOnAsyncValue$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getCombinedOfferingsWithCartAndEnrollment),
    );

    // Gets the list of members auto enrolled in current session
    private readonly autoEnrolledMembers$ = this.ngrxStore.pipe(select(SharedSelectors.getAutoEnrolledMembers));

    // For triggering autoEnrollPlans update
    private readonly updateAutoEnrolledPlans$ = new Subject<PlanOfferingWithCartAndEnrollment[]>();

    // Used to render producer shop instead of zero state
    readonly hasLoaded$ = this.planOfferingsData$.pipe(map(({ status }) => status === AsyncStatus.SUCCEEDED));
    // Universal spinner + backdrop for producer shop
    readonly showSpinner$ = this.asyncStateService.isLoading();
    // get the imported aflac policies
    readonly importedAflacPolicies$ = this.ngrxStore.pipe(select(EnrollmentsSelectors.getImportPolicy));

    // Cast to Numbers since some Services require Number instead of String
    // and it's more reliable to cast Number to String than it is to cast String to Number
    readonly mpGroup$: Observable<number> = this.route.params.pipe(map(({ mpGroupId }) => Number(mpGroupId)));
    readonly memberId$: Observable<number> = this.route.params.pipe(map(({ memberId }) => Number(memberId)));

    // get the plan offering ids of all plans cleared from cart
    readonly clearedCartItemPlanOfferingIds$ = this.cartItemsCleared$.pipe(
        withLatestFrom(this.cartItems$),
        map(([, cartItems]) => cartItems.map((cartItem) => cartItem.planOffering.id)),
    );

    // Gets previous knockout responses for existing cart items
    private readonly previousKnockoutResponses$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedKnockoutResponses));

    // Gets selected Plan panel identifiers
    private readonly selectedPanelIdentifiers$ = this.ngrxStore
        .onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData))
        .pipe(map((planPanel) => (planPanel ? this.planPanelService.getPanelIdentifiers(planPanel) : null)));

    // gets removed cart item panel Identifier
    private readonly removedCartItemPanelIdentifier$ = this.cartItemDeleted$.pipe(
        switchMap((cartItemId) =>
            this.ngrxStore
                .onAsyncValue(select(PlanOfferingsSelectors.getPlanOfferingDataWithCartItemId(cartItemId)))
                .pipe(map((planPanel) => (planPanel ? this.planPanelService.getPanelIdentifiers(planPanel) : null))),
        ),
    );

    // Check if item added to cart is stackable
    private readonly isCartItemAddedStackable$ = this.ngrxStore
        .onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData))
        .pipe(
            map((planPanel) => {
                // Return false if there is no plan panel and skip fetching the plan offering object
                if (!planPanel) {
                    return false;
                }

                return this.planPanelService.planOfferingHasStackablePlan(planPanel);
            }),
        );

    // Gets selected Plan panel identifiers
    private readonly selectedPanelEnrollmentRiders$ = this.selectedPanelIdentifiers$.pipe(
        switchMap((panelIdentifiers) => {
            // Return no Riders if there is no selected PlanOffering with PanelIdentifiers
            // This can happen when loading selected Enrollment.id or CartItem.id
            // Or when a PlanOffering has been added or removed from cart
            if (!panelIdentifiers) {
                return of([]);
            }

            return this.ngrxStore
                .onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(panelIdentifiers.enrollmentId)))
                .pipe(startWith([]));
        }),
    );

    private readonly productOfferings$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedProductOfferingSet));

    private readonly unsubscriber$ = new Subject<void>();

    readonly asyncStatus = AsyncStatus;

    // When enabled displays the latest coverage effective date content for shop page parameters and cart item overview.
    coverageDateBoldConfigEnabled: boolean;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly ngrxStore: NGRXStore,
        private readonly router: Router,
        private readonly languageService: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly userService: UserService,
        private readonly numberOrdinalService: NumberOrdinalService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly ageService: AgeService,
        private readonly currencyPipe: CurrencyPipe,
        private readonly dateService: DateService,
        private readonly dialog: MatDialog,
        private readonly manageCartItemsHelperService: ManageCartItemsHelperService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly dualPlanYearHelperService: DualPlanYearHelperService,
        private readonly ngxsLanguageService: NGXSLanguageService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly ngxsSyncService: NGXSSyncService,
        private readonly asyncStateService: AsyncStateService,
        private readonly nGXSExpandedCartHelperService: NGXSExpandedCartHelperService,
        private readonly ngxsEnrollmentStateService: NGXSEnrollmentStateService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.languageStrings = this.getLanguageStrings();

        // Cast to Numbers since some Services require Number instead of String
        // and it's more reliable to cast Number to String than it is to cast String to Number
        this.mpGroup$ = route.params.pipe(map(({ mpGroupId }) => Number(mpGroupId)));
        this.memberId$ = route.params.pipe(map(({ memberId }) => Number(memberId)));
    }

    /**
     * Set mpGroup and memberId in NGRX store based on router.
     *
     * Also dispatches actions to populate data in NGRX store.
     */
    ngOnInit(): void {
        // Sync NGXS and NGRX state
        // This will default all of NGRX state based on NGXS state
        // This will set EnrollmentMethod, CountryState, Headset CountryState, City for NGRX based on NGXS
        // Now whenever NGRX or NGXS updates, they will update the other for those properties
        this.ngxsSyncService.syncEnrollmentStates().pipe(takeUntil(this.unsubscriber$)).subscribe();

        // To stop all selectors from dispatching previous values. Setting memberId and mpGroup as null
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: null }));
        this.ngrxStore.dispatch(MembersActions.setSelectedMemberId({ memberId: null }));

        // Clear any Members related NGRX state
        // Even though we clear Member related NGRX state on `ngOnDestroy`,
        // clearing on `ngOnInit` will help prevent any state from loading after Component is destroyed
        this.ngrxStore.dispatch(GlobalActions.clearMemberRelatedState());

        // Load secondary languages using NGXS
        this.ngxsLanguageService.loadSecondaryLanguages();

        combineLatest([this.selectedEnrollments$, this.producerShopComponentStoreService.selectProductCoverageDatesOnAsyncValue()])
            .pipe(
                tap(([enrollmentsDetailsData]) => {
                    const details = mapAsyncData(enrollmentsDetailsData, ({ value: enrollments }) =>
                        enrollments.reduce<Record<number, EnrollmentDetailsState>>(
                            (enrollmentDetails: Record<number, EnrollmentDetailsState>, enrollment) => {
                                enrollmentDetails[enrollment.id] = {
                                    edit: false,
                                };

                                return enrollmentDetails;
                            },
                            {},
                        ),
                    );
                    this.producerShopComponentStoreService.setEnrollmentDetailsStates(details);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.producerShopComponentStoreService
            .selectProductCoverageDatesOnAsyncValue()
            .pipe(
                switchMap((productCoverageDates) => this.updateCartItemsCoverageDates(productCoverageDates)),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.dualPlanYearHelperService
            .getDualPlanYearData()
            .pipe(
                map((dualPlanYearData) => {
                    if (dualPlanYearData.isDualPlanYear) {
                        // group has dual plan year
                        return this.getDualPlanYearShopPageType(dualPlanYearData);
                    }

                    // group does not have dual plan year
                    return this.getSinglePlanYearShopPageType(dualPlanYearData);
                }),
                tap((shopPageType) => {
                    // sets shop page type
                    this.ngrxStore.dispatch(PlanOfferingsActions.setSelectedShopPageType({ shopPageType }));
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Initialize Coverage Dates dropdown state
        combineLatest([this.combinedOfferingsOnAsyncValue$, this.cartItems$])
            .pipe(
                // Coverage dates are to be initialized on page load
                // should not be overwritten again from combined offering data
                take(1),
                tap(([combinedOfferings, cartItems]) => {
                    const productCoverageDates = combinedOfferings.map((combinedOffering) => {
                        const productCartItem = cartItems.find(
                            (cartItem) =>
                                cartItem.coverageEffectiveDate &&
                                combinedOffering.planOfferingsWithCoverageDates.some(
                                    (planOfferingData) => planOfferingData.planOffering.id === cartItem.planOffering.id,
                                ) &&
                                cartItem.planOffering.plan.productId === combinedOffering.productOffering.product.id &&
                                !this.dateService.isBefore(
                                    this.dateService.toDate(cartItem.coverageEffectiveDate),
                                    this.dateService.toDate(new Date().setHours(0, 0, 0, 0)),
                                ),
                        );
                        // set coverage dates for non aflac plans
                        const defaultCoverageStartDate =
                            combinedOffering.defaultCoverageStartDate ||
                            combinedOffering.planOfferingsWithCoverageDates[0].defaultCoverageStartDate;
                        return {
                            productId: combinedOffering.productOffering.product.id,
                            productName: combinedOffering.productOffering.product.name,
                            date: productCartItem ? productCartItem.coverageEffectiveDate : defaultCoverageStartDate,
                        };
                    });
                    this.producerShopComponentStoreService.setProductCoverageDates({
                        status: AsyncStatus.SUCCEEDED,
                        value: productCoverageDates,
                        error: null,
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Initialize auto enrolled plans dialog
        this.combinedOfferingsWithCartAndEnrollmentOnAsyncValue$
            .pipe(
                filter((combinedOfferingsWithCartAndEnrollment) => !!combinedOfferingsWithCartAndEnrollment.length),
                withLatestFrom(this.memberDataOnAsyncValue$, this.autoEnrolledMembers$.pipe(startWith([]))),
                take(1),
                switchMap(([combinedOfferingsWithCartAndEnrollment, memberData, autoEnrolledMemberIds]) => {
                    // If member is already auto enrolled, we should not display auto enrollment plans pop up again
                    if (autoEnrolledMemberIds?.includes(memberData.id)) {
                        return of(null);
                    }
                    return this.checkAndDisplayAutoEnrolledPlanOfferings(combinedOfferingsWithCartAndEnrollment, memberData);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Initialize Occupation Class dropdown state
        this.riskClassesData$
            .pipe(
                tap((riskClassesData) => this.producerShopComponentStoreService.setRiskClasses(riskClassesData)),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Initialize More Settings dropdown state
        combineLatest([this.memberData$, this.selectedPayFrequencyData$, this.salarySummaryData$, this.dependentsData$, this.spouseData$])
            .pipe(
                tap(([memberData, payFrequencyData, salarySummaryData, dependentsData, spouseData]) => {
                    const moreSettingsAsyncDatas = combineAsyncDatas([
                        memberData,
                        payFrequencyData,
                        salarySummaryData,
                        dependentsData,
                        spouseData,
                    ]);

                    const moreSettingsData: AsyncData<MoreSettings> = mapAsyncData(moreSettingsAsyncDatas, ({ value }) => {
                        const [member, payFrequency, salarySummary, dependents, spouse] = value;

                        const memberGender = member.gender;
                        const memberAge = this.ageService.getAge(member.birthDate);

                        const spouseGender = spouse?.gender as Gender;
                        const spouseAge = spouse?.birthDate ? this.ageService.getAge(spouse.birthDate) : null;
                        const numberOfDependentsExcludingSpouse = dependents.filter(
                            (dependent) => dependent.dependentRelationId !== DependentRelationsId.SPOUSE_ID,
                        ).length;

                        return {
                            memberGender,
                            memberAge,
                            payFrequency,
                            spouseGender,
                            spouseAge,
                            numberOfDependentsExcludingSpouse,
                            ...salarySummary,
                            annualTotal: this.currencyPipe.transform(salarySummary.annualTotal ?? "", CURRENCY_CODE),
                            hourlyTotal: this.currencyPipe.transform(salarySummary.hourlyTotal ?? "", CURRENCY_CODE),
                            hourlyWage: this.currencyPipe.transform(salarySummary.hourlyWage ?? "", CURRENCY_CODE),
                        };
                    });

                    const tobaccoInformationAsyncDatas = combineAsyncDatas([memberData, spouseData]);

                    const tobaccoInformationData: AsyncData<TobaccoInformation> = mapAsyncData(
                        tobaccoInformationAsyncDatas,
                        ({ value: [member, spouse] }) => ({
                            memberIsTobaccoUser: member.profile?.tobaccoStatus === TobaccoStatus.TOBACCO,
                            spouseIsTobaccoUser: spouse?.profile?.tobaccoStatus === TobaccoStatus.TOBACCO,
                        }),
                    );

                    // Setting Applicant and spouse details for the new modal data in the shop page banner

                    const applicantDetailsAsyncData = combineAsyncDatas([memberData]);

                    const applicantDetails: AsyncData<ApplicantDetails> = mapAsyncData(
                        applicantDetailsAsyncData,
                        ({ value: [member] }) => ({
                            memberAge: this.ageService.getAge(member?.birthDate),
                            memberGender: member?.gender,
                        }),
                    );

                    const spouseDetailsAsyncData = combineAsyncDatas([spouseData]);

                    const spouseDetails: AsyncData<SpouseDetails> = mapAsyncData(spouseDetailsAsyncData, ({ value: [spouse] }) => ({
                        spouseAge: this.ageService.getAge(spouse?.birthDate),
                        spouseGender: spouse?.gender as Gender,
                    }));

                    this.producerShopComponentStoreService.setApplicantDetails(applicantDetails);
                    this.producerShopComponentStoreService.setSpouseDetails(spouseDetails);
                    this.producerShopComponentStoreService.setMoreSettings(moreSettingsData);
                    this.producerShopComponentStoreService.setTobaccoInformation(tobaccoInformationData);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Preform static API calls that don't rely on current Account (mpGroup) or MemberProfile (memberId)
        // Used to check if its direct or payroll flow, it will be used in multiple components
        this.ngrxStore.dispatch(
            SharedActions.setSelectedFlow({
                flow: this.router.url.indexOf(UrlFlow.DIRECT) >= 0 ? Flow.DIRECT : Flow.PAYROLL,
            }),
        );

        this.dispatchCachableSharedActions();

        this.ngrxStore.dispatchIfIdle(ProductsActions.loadProducts(), ProductsSelectors.getProducts);

        // TODO [NGRX Router]: Move logic for checking url for isDirect, params for mpGroup / memberId to use NGRX Router
        if (this.router.url.includes(Channel.DIRECT)) {
            this.ngrxStore.dispatch(AccountsActions.setDirect({ direct: true }));
        } else {
            this.ngrxStore.dispatch(AccountsActions.setDirect({ direct: false }));
        }

        // Dispatch any NGRX Actions that rely on mpGroup and/or memberId
        combineLatest([this.mpGroup$, this.memberId$])
            .pipe(
                tap(([mpGroup, memberId]) => {
                    this.dispatchMemberIdActions(mpGroup, memberId);
                    this.nGXSExpandedCartHelperService.setQLEAndOpenEnrollment(mpGroup, memberId);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([
            /*
                Any value works for 'startWith()' in this case, we would ideally pass null since that's the expected type we'd get,
            but rxjs6 has a bug where if the project doesn't have nullish checks,
            it thinks startWith(null) is of type startWith(never)
            */
            this.declineProductOffering$.pipe(startWith(true)),
            this.mpGroup$,
            this.memberId$,
            // import policies sets the existing coverage of an employee on first load at the back end
            this.importedAflacPolicies$,
        ])
            .pipe(
                // enrollments set must be fetched only after policies are imported
                filter(
                    ([_, , , importedPolicies]) =>
                        importedPolicies.status === AsyncStatus.SUCCEEDED || importedPolicies.status === AsyncStatus.FAILED,
                ),
                tap(([_, mpGroup, memberId]) => {
                    this.ngrxStore.dispatch(EnrollmentsActions.loadEnrollments({ mpGroup, memberId }));
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Sets reference date
        // Needed for loading pre-tax OE plans
        this.isDirectFlow$
            .pipe(
                tap((isDirectFlow) => {
                    this.ngrxStore.dispatch(
                        ProductOfferingsActions.setSelectedReferenceDate({
                            // If its direct shop, reference date will be today
                            // else we have to get reference date from dual plan year service logic
                            referenceDate: isDirectFlow
                                ? this.dateService.format(new Date(), DateFormat.YEAR_MONTH_DAY)
                                : this.dualPlanYearService.getReferenceDate(),
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([this.mpGroup$, this.memberId$, this.referenceDate$, this.coverageDatesEnrollmentType$])
            .pipe(
                tap(([mpGroup, memberId, referenceDate, coverageDatesEnrollmentType]) => {
                    this.ngrxStore.dispatch(
                        PlanOfferingsActions.loadCoverageDateRecord({
                            coverageDatesEnrollmentType,
                            mpGroup,
                            memberId,
                            referenceDate,
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.fetchRiskClasses().pipe(takeUntil(this.unsubscriber$)).subscribe();

        combineLatest([this.mpGroup$, this.referenceDate$])
            .pipe(
                tap(([mpGroup, referenceDate]) => {
                    this.ngrxStore.dispatch(
                        ProductOfferingsActions.loadProductOfferingSet({
                            mpGroup,
                            referenceDate,
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([
            this.enrollmentMethod$,
            this.mpGroup$,
            this.memberId$,
            this.stateAbbreviation$,
            this.referenceDate$,
            this.productOfferings$,
        ])
            .pipe(
                tap(([enrollmentMethod, mpGroup, memberId, stateAbbreviation, referenceDate, productOfferings]) => {
                    this.ngrxStore.dispatch(
                        PlanOfferingsActions.loadPlanOfferings({
                            enrollmentMethod,
                            mpGroup,
                            memberId,
                            stateAbbreviation,
                            referenceDate,
                            productOfferingIds: productOfferings.map((offering) => offering.id),
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Dispatch action to delete cart items which are not in OE
        this.planOfferings$
            .pipe(
                withLatestFrom(this.cartItems$, this.mpGroup$, this.memberId$),
                tap(([planOfferings, cartItems, mpGroup, memberId]) => {
                    if (!planOfferings.length) {
                        return;
                    }

                    const offeringIds = planOfferings.map((planOffering) => planOffering.id);

                    const expiredCartItemIds = cartItems
                        .filter(
                            (item) =>
                                !offeringIds.includes(item.planOffering.id) &&
                                (!item.planOffering.plan.characteristics ||
                                    !item.planOffering.plan.characteristics.includes(Characteristics.AUTOENROLLABLE)),
                        )
                        .map((expiredCartItem) => expiredCartItem.id);

                    const existingCartItemIds = cartItems
                        .filter((cartItem) => !expiredCartItemIds.some((expiredCartItemId) => expiredCartItemId === cartItem.id))
                        .map((existingCartItem) => existingCartItem.id);

                    // loads knockout responses for existing cart items
                    if (existingCartItemIds.length) {
                        this.ngrxStore.dispatch(
                            PlanOfferingsActions.loadKnockoutResponses({
                                mpGroup,
                                memberId,
                                cartItemIds: existingCartItemIds,
                            }),
                        );
                    }

                    if (expiredCartItemIds.length) {
                        this.ngrxStore.dispatch(
                            ShoppingCartsActions.deleteCartItemsSets({
                                memberId,
                                mpGroup,
                                cartItemIds: expiredCartItemIds,
                            }),
                        );
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.stateAbbreviation$
            .pipe(
                // this.ngrxStore.filterForNonNullish(),
                tap((stateAbbreviation) => {
                    // Get cities based on selected state
                    this.ngrxStore.dispatch(SharedActions.loadCities({ stateAbbreviation }), true);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([this.isDirectFlow$, this.userService.portal$, this.memberId$, this.mpGroup$, this.navigationOnZeroState$])
            .pipe(
                tap(([isDirectFlow, type, memberId, mpGroup, navigationKey]) => {
                    if (navigationKey === ZeroStateButtonType.QLE) {
                        return this.navigateToQle(type.toLowerCase(), mpGroup, memberId);
                    }
                    if (navigationKey === ZeroStateButtonType.BENEFITS_OFFERING) {
                        return this.navigateToBO(type.toLowerCase(), mpGroup);
                    }
                    return this.navigateToEmployeeOrCustomer(type.toLowerCase(), mpGroup, isDirectFlow);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Loads cart items when new item is added
        this.cartItemAdded$
            .pipe(
                filter((cartItemAdded) => cartItemAdded.status === AsyncStatus.SUCCEEDED),
                withLatestFrom(
                    this.mpGroup$,
                    this.memberId$,
                    this.selectedPanelIdentifiers$,
                    this.riderComponentStoreService.getRiderStateValidationOptions(),
                    this.selectedPanelEnrollmentRiders$,
                    this.isCartItemAddedStackable$,
                    this.dualPlanYearHelperService.getDualPlanYearData(),
                ),
                tap(
                    ([
                        cartItemAddedResponse,
                        mpGroup,
                        memberId,
                        panelIdentifiers,
                        riderStateValidationOptions,
                        selectedPanelEnrollmentRiders,
                        isCartItemAddedStackable,
                        dualPlanYearData,
                    ]) => {
                        // Exit early if there is no selected PlanOffering with PanelIdentifiers
                        // This can happen when loading selected Enrollment.id or CartItem.id
                        // Or when a PlanOffering has been added or removed from cart
                        if (!panelIdentifiers) {
                            return;
                        }

                        // Have to remove previous panel state data with out cart item id
                        this.removePanelState(
                            panelIdentifiers,
                            isCartItemAddedStackable,
                            riderStateValidationOptions,
                            selectedPanelEnrollmentRiders,
                        );

                        this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
                        const planYearIds = this.getPlanYearIds(dualPlanYearData);
                        this.ngrxStore.dispatch(ShoppingCartsActions.loadShoppingCart({ memberId, mpGroup, planYearIds }));
                        this.ngrxStore.dispatch(ShoppingCartsActions.setSelectedCartItemId({ cartItemId: cartItemAddedResponse.value }));
                    },
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Loads cart items when new item is updated
        this.cartItemUpdated$
            .pipe(
                filter((cartItemUpdated) => cartItemUpdated.status === AsyncStatus.SUCCEEDED),
                withLatestFrom(this.mpGroup$, this.memberId$, this.dualPlanYearHelperService.getDualPlanYearData()),
                tap(([_, mpGroup, memberId, dualPlanYearData]) => {
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
                    const planYearIds = this.getPlanYearIds(dualPlanYearData);
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadShoppingCart({ memberId, mpGroup, planYearIds }));
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.cartItemDeleted$
            .pipe(
                withLatestFrom(
                    this.mpGroup$,
                    this.memberId$,
                    this.selectedPanelIdentifiers$,
                    this.removedCartItemPanelIdentifier$,
                    this.dualPlanYearHelperService.getDualPlanYearData(),
                ),
                tap(([deletedCartItemId, mpGroup, memberId, panelIdentifiers, removedPanelIdentifier, dualPlanYearData]) => {
                    if (removedPanelIdentifier) {
                        // Have to remove previous panel state data with cart item id
                        this.removePanelState(removedPanelIdentifier);
                    }

                    this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
                    const planYearIds = this.getPlanYearIds(dualPlanYearData);
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadShoppingCart({ memberId, mpGroup, planYearIds }));
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadAppliedFlexDollars({ memberId, mpGroup }));

                    if (panelIdentifiers && deletedCartItemId === panelIdentifiers.cartId) {
                        this.ngrxStore.dispatch(ShoppingCartsActions.setSelectedCartItemId({ cartItemId: null }));
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // uncheck the riders once plan is removed from cart
        this.clearedCartItemPlanOfferingIds$
            .pipe(
                map((planOfferingIds) =>
                    planOfferingIds.map((planOfferingId) => ({
                        planOfferingId,
                        // TODO: add cartId
                    })),
                ),
                withLatestFrom(this.riderComponentStoreService.getRiderStateValidationOptions(), this.selectedPanelEnrollmentRiders$),
                tap(([panelIdentifiers, riderStateValidationOptions, selectedPanelEnrollmentRiders]) => {
                    this.riderComponentStoreService.uncheckRiderStates({
                        ...riderStateValidationOptions,
                        panelIdentifiers,
                        selectedPanelEnrollmentRiders,
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Clear cart items whenever there is change in enrollment method or state
        // Do not use cartItems$ in combinedLatest, because that will cause infinite loop
        // this is used to clear the cart items upon page load if there is a change in the enrollment method
        // this gets called when the shop page is opened in one browser and again if we try to open the shop page from a different
        // browser with a different enrollment method, then this code is used to clear the cart and update auto enrolled plans
        this.combinedOfferingsWithCartAndEnrollmentOnAsyncValue$
            .pipe(
                take(1),
                switchMap(() => this.clearCartItemsAndUpdateAutoEnrolledPlans()),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Updates the cart items once cart is cleared
        this.cartItemsCleared$
            .pipe(
                withLatestFrom(this.mpGroup$, this.memberId$),
                tap(([_, mpGroup, memberId]) => {
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
                    this.ngrxStore.dispatch(ShoppingCartsActions.loadShoppingCart({ memberId, mpGroup }));
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // updates auto enrolled plans
        this.updateAutoEnrolledPlans$
            .pipe(
                switchMap((planOfferingsWithCartAndEnrollment) =>
                    this.manageCartItemsHelperService.updateAutoEnrolledCartData(planOfferingsWithCartAndEnrollment),
                ),
                filter((cartItems) => !!cartItems.length),
                withLatestFrom(this.memberId$, this.mpGroup$),
                tap(([cartItems, memberId, mpGroup]) => {
                    this.ngrxStore.dispatch(
                        ShoppingCartsActions.updateCartItemsSets({
                            memberId,
                            mpGroup,
                            updateCartObjects: cartItems,
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.ngrxStore
            .onAsyncValue(select(ShoppingCartsSelectors.getShoppingCart))
            .pipe(
                tap((shoppingCart) => {
                    this.shoppingCartDisplayService.setShoppingCart(shoppingCart);

                    if (shoppingCart.locked) {
                        this.dialog.open(CartLockDialogComponent, {
                            backdropClass: "backdrop-blur",
                            maxWidth: "600px", // 600px max-width based on the definition in abstract.
                            panelClass: "popup-close",
                            data: { lockedBy: shoppingCart.lockedBy },
                        });
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Gets previous knockout responses and loads the producer component store on page load
        this.previousKnockoutResponses$
            .pipe(
                tap((responsesArray) => {
                    // Flatten array of arrays to a single array:
                    // ApplicationResponse[][] -> ApplicationResponse[]
                    const answeredKnockoutQuestions: AnsweredKnockoutQuestion[] = responsesArray.flat().map((response) => ({
                        id: response.planQuestionId,
                        answer: response.value[0],
                        key: response.key,
                    }));

                    // Sometimes KnockoutQuestions can not have key property
                    // We have to filter these out since we use the key property for storing the KnockoutQuestions entities
                    this.producerShopComponentStoreService.setAnsweredKnockoutQuestions(answeredKnockoutQuestions.filter((q) => !!q.key));
                }),
                take(1),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.staticUtilService
            .cacheConfigEnabled(ConfigName.COVERAGE_DATE_BOLD_VISIBILITY_ENABLED)
            .pipe(
                // When this config is enabled displays the latest coverage effective date content
                // for shop page parameters and cart item overview.
                tap((coverageDateBoldConfig) => (this.coverageDateBoldConfigEnabled = coverageDateBoldConfig)),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * @param {string} errorMessage string derived from getZeroStateErrorMessage method
     * @param {AsyncStatus} PlanOfferingAsyncStatus Used to check for SUCCESS status of async value to display template code
     * @param {string} shopLabelText label for shop given type of shop derived from NgRx selector
     * @param {ButtonType | null} buttonType enum value corresponding to particular buttons possible to be in template
     * @param {string} buttonText languageString value that corresponds to a particular ButtonType
     * @returns {ZeroStateButton} Object describing all necessary data to render a particular button in producer-shop template
     */
    getZeroStateButton(
        errorMessage: string,
        planOfferingAsyncStatus: AsyncStatus,
        shopLabelText: string,
        buttonType: ZeroStateButtonType | null,
        buttonText: string,
    ): ZeroStateButton {
        return {
            errorMessage,
            planOfferingAsyncStatus,
            shopLabelText,
            buttonType,
            buttonText,
        };
    }

    /**
     * Set zero state error message
     * @param combinedOfferings is async data of planOffering
     * @param planYearsInCoverage plan years for the selected group
     * @param isDirectFlow check if payroll or direct account
     * @returns error message
     */
    getZeroStateErrorMessage(planOfferingsData: AsyncData<PlanOffering[]>, planYears: PlanYear[], isDirectFlow: boolean): string {
        const member = isDirectFlow
            ? this.languageStrings["primary.portal.shopQuote.specificPayroll.customer"]
            : this.languageStrings["primary.portal.shopQuote.specificPayroll.employee"];

        const genericError = this.languageStrings["primary.portal.shopQuote.specificPayroll.noProductsAvailable"].replace(
            "##employeeOrCustomer##",
            member,
        );

        if (planOfferingsData.status === AsyncStatus.FAILED && planOfferingsData.error) {
            const apiError =
                +planOfferingsData.error.status === ClientErrorResponseCode.RESP_409
                    ? this.languageStrings["primary.portal.shopQuote.specificPayroll.noSetUpBenefitOffering"]
                    : planOfferingsData.error.language?.displayText.replace("##employeeOrCustomer##", member);
            return apiError || genericError;
        }
        if (planOfferingsData.status !== AsyncStatus.SUCCEEDED) {
            return "";
        }

        if (planOfferingsData.status === AsyncStatus.SUCCEEDED && !planOfferingsData.value.length) {
            return this.languageStrings["primary.portal.shopQuote.specificPayroll.productsNotAvailable"];
        }

        if (planOfferingsData.value.length) {
            return "";
        }

        if (planYears.length) {
            if (
                this.dateService.checkIsAfter(
                    this.dateService.toDate(planYears[planYears.length - 1].enrollmentPeriod.effectiveStarting),
                    this.currentDate,
                )
            ) {
                const partOne =
                    this.languageStrings["primary.portal.shopQuote.specificPayroll.openEnrollmentBegins"]
                        .replace(
                            "##month##",
                            this.datePipe.transform(
                                planYears[planYears.length - 1].enrollmentPeriod.effectiveStarting,
                                DateFormat.LONG_MONTH,
                            ),
                        )
                        .replace(
                            "##date##",
                            this.numberOrdinalService.getNumberWithOrdinal(
                                +this.datePipe.transform(
                                    planYears[planYears.length - 1].enrollmentPeriod.effectiveStarting,
                                    DateFormat.DAY,
                                ),
                            ),
                        ) + ". ";

                return partOne + this.languageStrings["primary.portal.shopQuote.specificPayroll.qleSpecialEnrollment"];
            }

            if (
                this.dateService.getIsAfterOrIsEqual(
                    this.currentDate,
                    this.dateService.toDate(planYears[planYears.length - 1].enrollmentPeriod.expiresAfter),
                )
            ) {
                return this.languageStrings["primary.portal.shopQuote.specificPayroll.openEnrollmentEnded"];
            }
        }

        return genericError;
    }

    /**
     * Check and displays auto enrolled plans dialog on load
     * @param combinedOfferingsWithCartAndEnrollment combined offering list with cart item and enrollment
     * @param memberName member name
     * @returns observable of dialog afterClosed
     */
    checkAndDisplayAutoEnrolledPlanOfferings(
        combinedOfferingsWithCartAndEnrollment: CombinedOfferingWithCartAndEnrollment[],
        memberData: MemberProfile,
    ): Observable<void> {
        const autoEnrolledPlanOfferings = this.getAutoEnrolledPlanOfferings(combinedOfferingsWithCartAndEnrollment);
        if (!autoEnrolledPlanOfferings.length) {
            return of(null);
        }

        const dialogRef = this.dialog.open(CompanyProvidedProductsDialogComponent, {
            data: {
                products: autoEnrolledPlanOfferings.map((aePlanData) => aePlanData.planOffering.plan.product.name),
                firstName: memberData.name.firstName,
            },
            width: "600px",
        });

        return dialogRef.afterClosed().pipe(
            tap((resp) => {
                // TODO [Types]: "save" should be a const or enum
                if (resp !== "save") {
                    return;
                }

                this.ngrxStore.dispatch(SharedActions.setMemberAsAutoEnrolled({ memberId: memberData.id }));
                this.updateAutoEnrolledPlans$.next(autoEnrolledPlanOfferings);
            }),
        );
    }

    /**
     * Gets the list of auto enrolled plans
     * @param combinedOfferingsWithCartAndEnrollment list of combined offerings.
     * A combination of PlanOffering, cart item, enrollment and ProductOffering instances
     *
     * @returns list of auto enrolled plan offering with cart item and enrollment
     */
    getAutoEnrolledPlanOfferings(
        combinedOfferingsWithCartAndEnrollment: CombinedOfferingWithCartAndEnrollment[],
    ): PlanOfferingWithCartAndEnrollment[] {
        // TODO [Imperative]: This array is imperative and should be refactored
        let autoEnrolledPlanOfferings: PlanOfferingWithCartAndEnrollment[] = [];

        if (
            combinedOfferingsWithCartAndEnrollment.some((combinedOfferingWithCartAndEnrollment) =>
                combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.some(
                    (planOfferingWithCartAndEnrollment) =>
                        // At least one company provided plans with cart data or without enrollment
                        // should be present to consider no cost coverage pop up scenario
                        planOfferingWithCartAndEnrollment.planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) &&
                        (planOfferingWithCartAndEnrollment.cartItemInfo || !planOfferingWithCartAndEnrollment.enrollment),
                ),
            )
        ) {
            // TODO [Imperative]: Mutating the array this way should refactored to be more declarative
            // We should avoid forEach solutions when we can (if this requires reducing multi dimensional arrays, let's use flat/flatMap)
            combinedOfferingsWithCartAndEnrollment.forEach((combinedOfferingWithCartAndEnrollment) => {
                autoEnrolledPlanOfferings = [
                    ...autoEnrolledPlanOfferings,
                    ...combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.filter((planOfferingData) =>
                        planOfferingData.planOffering.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED),
                    ),
                ];
            });
        }

        // TODO [Imperative]: It should be more clear that we are trying to return an empty array here
        // Please leave a comment explaining why we expect an empty array
        return autoEnrolledPlanOfferings;
    }

    /**
     * Method called on click for navigation in zero state
     *
     * @param navigationKey {ZeroStateButtonType} key that specifies which screen to navigate
     */
    updateNavigation(navigationKey: ZeroStateButtonType): void {
        this.navigationOnZeroState$.next(navigationKey);
        this.ngxsEnrollmentStateService.resetState();
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns Record<string,string> Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.shopQuote.specificPayroll.employee",
            "primary.portal.shopQuote.specificPayroll.customer",
            "primary.portal.shopQuote.specificPayroll.openEnrollmentBegins",
            "primary.portal.shopQuote.specificPayroll.qleSpecialEnrollment",
            "primary.portal.shopQuote.specificPayroll.openEnrollmentEnded",
            "primary.portal.shopQuote.specificPayroll.addLifeEvent",
            "primary.portal.shopQuote.specificPayroll.returnToListing",
            "primary.portal.shopQuote.specificPayroll.noProductsAvailable",
            "primary.portal.shopQuote.specificPayroll.buildBenefitsOffering",
            "primary.portal.shopQuote.specificPayroll.noSetUpBenefitOffering",
            "primary.portal.shoppingCart.quoteLevelSettings.header.shop",
            "primary.portal.shop.dualPlanYear.lifeEventEnrollmentShop",
            "primary.portal.shop.dualPlanYear.openEnrollmentsShop",
            "primary.portal.shop.dualPlanYear.lifeEventFutureEnrollmentShop",
            "primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollmentShop",
            "primary.portal.shopQuote.specificPayroll.productsNotAvailable",
        ]);
    }

    /**
     * Get RiskClasses based on ratingCode (from Account) and current mpGroup/memberId
     *
     * @returns {Observable<[Account, number, number]>} values used to get RiskClasses
     */
    fetchRiskClasses(): Observable<[Account, number, number]> {
        return this.account$.pipe(
            withLatestFrom(this.mpGroup$, this.memberId$),
            tap(([{ ratingCode }, mpGroup, memberId]) => this.loadRiskClasses(mpGroup, memberId, ratingCode)),
        );
    }

    /**
     * Dispatch NGRX actions to load RiskClasses based on ratingCode (from Account) and current mpGroup/memberId
     *
     * @param mpGroup {number} expected mpGroup for all RiskClasses
     * @param memberId {number} expected memberId for RiskClasses for RatingCode.PEO
     * @param ratingCode {RatingCode} expected RatingCode on current Account
     */
    loadRiskClasses(mpGroup: number, memberId: number, ratingCode?: RatingCode | null): void {
        if (ratingCode === RatingCode.STANDARD) {
            this.ngrxStore.dispatchIfIdle(
                AccountsActions.loadRiskClasses({ mpGroup }),
                AccountsSelectors.getSelectedPossibleStandardRiskClasses,
            );
            return;
        }

        if (ratingCode === RatingCode.PEO) {
            this.ngrxStore.dispatchIfIdle(
                MembersActions.loadRiskClasses({ memberId, mpGroup }),
                MembersSelectors.getSelectedMemberRiskClasses,
            );
            return;
        }

        if (ratingCode === RatingCode.DUAL) {
            this.ngrxStore.dispatchIfIdle(
                AccountsActions.loadDualPeoRiskClassIdsSet({ mpGroup }),
                AccountsSelectors.getSelectedPossibleDualRiskClassSets,
            );
        }
    }

    /**
     * Navigate to add life events page
     *
     * @param portal type of portal
     * @param mpGroup group id
     * @param memberId member id
     */
    navigateToQle(portal: string, mpGroup: number, memberId: number): Promise<boolean> {
        return this.router.navigate([`/${portal}/payroll/${mpGroup}/member/${memberId}/qle/life-events`]);
    }

    /**
     * Navigates to employee or customer listing based on account type
     *
     * @param portal type of portal
     * @param mpGroup group id
     * @param isDirectFlow check for direct or payroll
     */
    navigateToEmployeeOrCustomer(portal: string, mpGroup: number, isDirectFlow: boolean): Promise<boolean> {
        if (isDirectFlow) {
            const directUrl = `/${portal}/direct/customers/${mpGroup}`;
            return this.router.navigate([directUrl], { relativeTo: this.route, queryParamsHandling: "preserve" });
        }
        const url =
            this.router.url.indexOf("prospect") !== -1
                ? `/${portal}/payroll/prospect/${mpGroup}/employees`
                : `/${portal}/payroll/${mpGroup}/dashboard/employees`;
        return this.router.navigate([url], {
            relativeTo: this.route,
        });
    }

    /**
     * Navigates to benefit offering page
     *
     * @param portal type of portal
     * @param mpGroup group ID
     */
    navigateToBO(portal: string, mpGroup: number): Promise<boolean> {
        return this.router.navigate([`/${portal}/payroll/${mpGroup}/dashboard/benefits/offering`]);
    }

    /**
     * updates cart items with newly applied coverage dates
     * @param productCoverageDates product coverage dates
     * @returns Observable of UpdateCartItem[], memberId, mpGroup id
     */
    updateCartItemsCoverageDates(productCoverageDates: ProductCoverageDate[]): Observable<[UpdateCartItem[], number, number]> {
        return this.cartItems$.pipe(
            // Since updateCartItems action will update cartItems,
            // We have to take(1) to avoid an infinite loop
            take(1),
            switchMap((cartItems) => this.manageCartItemsHelperService.getCartItemsWithUpdatedDate(cartItems, productCoverageDates)),
            filter((cartItems) => !!cartItems.length),
            withLatestFrom(this.memberId$, this.mpGroup$),
            tap(([cartItems, memberId, mpGroup]) => {
                this.ngrxStore.dispatch(
                    ShoppingCartsActions.updateCartItemsSets({
                        memberId,
                        mpGroup,
                        updateCartObjects: cartItems,
                    }),
                );
            }),
        );
    }

    /**
     * gets shop page type during OE period and dual plan year scenario
     * @param dualPlanYearData dual plan year data
     * @returns shop page type
     */
    getShopPageTypeDuringOE(dualPlanYearData: EnrollmentPeriodData): ShopPageType {
        if (dualPlanYearData.selectedShop === ShopPeriodType.QLE_SHOP) {
            // group is dual plan year & Qle shop is selected during OeEnrollment
            return ShopPageType.DUAL_QLE_SHOP;
        }
        // group is dual plan year & OE shop is selected during OeEnrollment
        return ShopPageType.DUAL_OE_SHOP;
    }

    /**
     * gets shop page type after OE period and dual plan year scenario
     * @param dualPlanYearData dual plan year data
     * @returns shop page type
     */
    getShopPageTypeAfterOE(dualPlanYearData: EnrollmentPeriodData): ShopPageType {
        if (dualPlanYearData.selectedShop === ShopPeriodType.OE_SHOP) {
            // group is dual plan year & OE shop(future plan year) is selected after OeEnrollment
            return ShopPageType.DUAL_FUTURE_QLE;
        }
        // group is dual plan year & QLE shop(current plan year) is selected after OeEnrollment
        return ShopPageType.DUAL_CURRENT_QLE;
    }

    /**
     * gets shop page type in dual plan year scenario
     * @param dualPlanYearData dual plan year data
     * @returns shop page type
     */
    getDualPlanYearShopPageType(dualPlanYearData: EnrollmentPeriodData): ShopPageType {
        if (dualPlanYearData.isQleDuringOeEnrollment) {
            // group is dual plan year and during OeEnrollment
            return this.getShopPageTypeDuringOE(dualPlanYearData);
        }
        // group is dual plan year & after OeEnrollment
        return this.getShopPageTypeAfterOE(dualPlanYearData);
    }

    /**
     * gets plan year ids for fetching cart info in dual plan year scenario
     * @param dualPlanYearData dual plan year data
     * @returns array of plan year ids
     */
    getPlanYearIds(dualPlanYearData: EnrollmentPeriodData): number[] {
        const shopType = this.getDualPlanYearShopPageType(dualPlanYearData);
        let planYearIds = null;
        if (shopType === ShopPageType.DUAL_QLE_SHOP) {
            planYearIds = dualPlanYearData.qleDualPlanYear.map((planYear) => planYear.id);
        } else if (shopType === ShopPageType.DUAL_OE_SHOP) {
            planYearIds = dualPlanYearData.oeDualPlanYear.map((planYear) => planYear.id);
        }
        return planYearIds;
    }

    /**
     * gets shop page type in standard plan year scenario
     * @param dualPlanYearData dual plan year data
     * @returns shop page type
     */
    getSinglePlanYearShopPageType(dualPlanYearData: EnrollmentPeriodData): ShopPageType {
        const shopPeriodType = this.dualPlanYearHelperService.getStandardShopPeriod(
            dualPlanYearData.qleEventData,
            dualPlanYearData.planYearsData,
        );
        switch (shopPeriodType) {
            case ShopPeriodType.OE_SHOP:
                return ShopPageType.SINGLE_OE_SHOP;
            case ShopPeriodType.QLE_SHOP:
                return ShopPageType.SINGLE_QLE_SHOP;
            case ShopPeriodType.CONTINUOUS_SHOP:
                return ShopPageType.CONTINUOUS_SHOP;
        }
    }

    /**
     * Return if PlanOfferings array exits from AsyncData. If AsyncData has failed, should return false
     *
     * @param planOfferingData {AsyncData<PlanOffering[]>}
     * @returns {boolean} Length and status of PlanOfferings data array represented as boolean, false if AsyncStatus isn't SUCCEEDED
     */
    isPlanOfferingsExistAsync(planOfferingData: AsyncData<PlanOffering[]>): boolean {
        // Check if AsyncStatus is SUCCEEDED, this is the only time that value will be an array
        if (planOfferingData.status === AsyncStatus.SUCCEEDED) {
            return !!planOfferingData.value.length;
        }

        // All other cases return false
        return false;
    }

    /**
     * Meant to dispatch simple SharedActions that do not require arguments
     *
     * To perform the cache, we need to set `checkIfSharedActionIsCached` to `true` when calling dispatch
     */
    dispatchCachableSharedActions(): void {
        this.ngrxStore.dispatch(SharedActions.loadGenders(), true);
        this.ngrxStore.dispatch(SharedActions.loadCountryStates(), true);
        this.ngrxStore.dispatch(SharedActions.loadCarrierRiskClasses(), true);
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({ configurationNameRegex: ConfigName.ENROLLMENT_MANDATORY_RIDER_ID }),
            true,
        );
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.HIDE_PLAN_OPTIONS_FOR_ADD_ON_RIDERS,
            }),
            true,
        );
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.MATCH_BASE_PLAN_READONLY_RIDER_IDS,
            }),
            true,
        );
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: RewriteConfigName.EMPLOYER_CONTRIBUTION_EXCLUDED_STATES,
            }),
            true,
        );

        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: RewriteConfigName.CHILD_MAX_AGE_IN_YEARS,
            }),
            true,
        );

        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: RewriteConfigName.CHILD_MIN_AGE_IN_DAYS,
            }),
            true,
        );

        // Config to get the product ids applicable for additional units
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.SHOP_ADDITIONAL_UNIT_PRODUCT_IDS,
            }),
            true,
        );
        // Config to get the product id applicable for buy up plans
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.SHOP_BUY_UP_PRODUCT_ID,
            }),
            true,
        );
        // Config to enable the tobacco status in more settings
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.SHOPPING_PRICING_UPDATE_TOBACCO_STATUS,
            }),
            true,
        );
        // Config to get the rider ids for ag spouse exceptions
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.SPOUSE_RIDER_CRITICAL_ILLNESS,
            }),
            true,
        );
        // Config to get the rider plan ids for off the job of additional units plans
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.ADDITIONAL_UNIT_OFFTHEJOB_RIDER_PLAN_IDS,
            }),
            true,
        );
        // Config to get the rider coverage level ids for off the job of additional units plans
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.ADDITIONAL_UNIT_OFFTHEJOB_RIDER_COVERAGE_LEVEL_IDS,
            }),
            true,
        );
    }

    /**
     * Dispatch Actions related to mpGroup and memberId
     *
     * @param mpGroup {number} selected mpGroup for Producer Shop
     * @param memberId {number} selected mpGroup for Producer Shop
     */
    dispatchMemberIdActions(mpGroup: number, memberId: number): void {
        this.ngrxStore.dispatch(
            EnrollmentsActions.loadImportPolicy({
                memberId: memberId,
                mpGroup: mpGroup,
            }),
        );
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup }));
        this.ngrxStore.dispatchIfIdle(AccountsActions.loadPayFrequencies({ mpGroup }), AccountsSelectors.getSelectedPayFrequencies);
        this.ngrxStore.dispatchIfIdle(AccountsActions.loadAccount({ mpGroup }), AccountsSelectors.getSelectedAccount);

        this.ngrxStore.dispatch(EnrollmentsActions.loadEnrollmentMethodDetails({ mpGroup }));

        this.ngrxStore.dispatch(MembersActions.setSelectedMemberId({ memberId }));
        this.ngrxStore.dispatchIfIdle(AccountsActions.loadAccountAdmins({ mpGroup }), AccountsSelectors.getSelectedAccountAdmins);

        this.ngrxStore.dispatch(
            AccountsActions.loadExceptions({
                mpGroup,
                exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE,
            }),
        );

        this.ngrxStore.dispatch(
            ProductOfferingsActions.loadPlanYearSet({
                mpGroup,
            }),
        );

        this.ngrxStore.dispatch(MembersActions.loadMemberContacts({ memberId, mpGroup }));
        this.ngrxStore.dispatch(ShoppingCartsActions.loadShoppingCart({ memberId, mpGroup }));

        this.ngrxStore.dispatch(
            MembersActions.loadMemberProfile({
                memberId,
                mpGroup,
            }),
        );

        this.ngrxStore.dispatchIfIdle(
            MembersActions.loadSalaries({
                memberId,
                mpGroup,
            }),
            MembersSelectors.getSelectedSalaries,
        );

        this.ngrxStore.dispatchIfIdle(
            MembersActions.loadMemberDependents({
                memberId,
                mpGroup,
            }),
            MembersSelectors.getSelectedMemberDependents,
        );

        this.ngrxStore.dispatch(
            AccountsActions.loadGroupAttributeRecord({
                groupAttributeNames: [GroupAttributeName.INDUSTRY_CODE],
                mpGroup,
            }),
        );

        this.ngrxStore.dispatch(MembersActions.loadCrossBorderRules({ mpGroup, memberId }));

        this.ngrxStore.dispatch(MembersActions.loadQualifyingEvents({ mpGroup, memberId }));

        this.ngrxStore.dispatch(MembersActions.loadMemberFlexDollars({ mpGroup, memberId }));
        this.ngrxStore.dispatch(ShoppingCartsActions.loadCartItemsSet({ memberId, mpGroup, expand: "planOfferingId" }));
    }

    /**
     * Removes previous PlanPanel local state based on PanelIdentifiers.
     * This is commonly done whenever a PlanOffering has been added/removed to cart.
     *
     * It's safe to completely remove all local state since the shopping cart api will
     * default all of the local state again.
     *
     * @param panelIdentifiers current panel identifiers
     * @param isPlanStackable if plan is stackable or not
     * @param riderStateValidationOptions rider state validation options
     * @param selectedPanelEnrollmentRiders selected panel enrollment riders
     */
    removePanelState(
        panelIdentifiers: PanelIdentifiers,
        isPlanStackable?: boolean,
        riderStateValidationOptions?: RiderStateValidationOptions,
        selectedPanelEnrollmentRiders?: EnrollmentRider[],
    ): void {
        this.producerShopComponentStoreService.removeLocalState(panelIdentifiers);
        if (isPlanStackable) {
            this.riderComponentStoreService.uncheckRiderStates({
                ...riderStateValidationOptions,
                panelIdentifiers: [panelIdentifiers],
                selectedPanelEnrollmentRiders,
            });
        } else {
            this.riderComponentStoreService.removeRidersStatesByPanelIdentifier(panelIdentifiers);
        }
    }

    /**
     * clear the cart items and update the auto enrolled plans when there is a change in the
     * enrollment method or state
     */

    clearCartItemsAndUpdateAutoEnrolledPlans(): Observable<
    [[EnrollmentMethod, string], GetCartItems[], number, number, CombinedOfferingWithCartAndEnrollment[]]
    > {
        return combineLatest([this.enrollmentMethod$, this.stateAbbreviation$]).pipe(
            withLatestFrom(this.cartItems$, this.mpGroup$, this.memberId$, this.combinedOfferingsWithCartAndEnrollmentOnAsyncValue$),
            filter(([[enrollmentMethod, stateAbbreviation], cartItems, ,]) =>
                cartItems
                    .filter(
                        (cartItem) =>
                            cartItem.coverageLevelId !== CoverageLevelId.DECLINED && cartItem.applicationType !== StepType.REINSTATEMENT,
                    )
                    .some((item) => item.enrollmentMethod !== enrollmentMethod || item.enrollmentState !== stateAbbreviation),
            ),
            tap(([[,], , mpGroup, memberId, combinedOfferingsWithCartAndEnrollment]) => {
                this.ngrxStore.dispatch(ShoppingCartsActions.clearCartItems({ memberId, mpGroup, ignoreGroupPlans: false }));
                // Update auto enrolled plans in cart when there is change in enrollment state or method
                const autoEnrolledPlanOfferings = this.getAutoEnrolledPlanOfferings(combinedOfferingsWithCartAndEnrollment);
                if (autoEnrolledPlanOfferings.length) {
                    this.updateAutoEnrolledPlans$.next(autoEnrolledPlanOfferings);
                }
            }),
        );
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
        // Clear any Member related NGRX state
        // Even though we clear Member related NGRX state on `ngOnInit`,
        // clearing on `ngOnDestroy` will help garbage collection clear up memory sooner
        this.ngrxStore.dispatch(GlobalActions.clearMemberRelatedState());
    }
}
