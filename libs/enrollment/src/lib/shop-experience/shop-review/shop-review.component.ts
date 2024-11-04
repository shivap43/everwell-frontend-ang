import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import {
    ShoppingService,
    AccountService,
    MemberService,
    CartItemView,
    CoreService,
    ShoppingCartDisplayService,
    PayFrequencyObject,
    CartItem,
} from "@empowered/api";
import { Select, Store } from "@ngxs/store";

import {
    EnrollmentState,
    SetErrorForShop,
    SetProductOfferingsOfId,
    SetProductPlanOfferings,
    DualPlanYearState,
    SetPlanLevelFlexIncetives,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { forkJoin, Subject, Observable, of, defer } from "rxjs";
import { PayrollFrequencyCalculatorPipe, AddressMatchingPromptComponent, ExitPopupModalComponent } from "@empowered/ui";
import { mergeMap, takeUntil, tap, switchMap, filter, catchError } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";
import { MatDialogConfig } from "@angular/material/dialog";
import { TPIState } from "@empowered/ngxs-store";
import {
    TPI,
    ConfigName,
    PolicySeriesType,
    AddressConfig,
    TpiSSOModel,
    PayFrequency,
    BillingMode,
    AddressMatchModel,
    ContactType,
    TaxStatus,
    CoverageLevel,
    PlanOffering,
    FlexDollarModel,
    ProductOfferingPanel,
    StepType,
} from "@empowered/constants";
import { RemovePlanComponent } from "../modals/remove-plan/remove-plan.component";
import { TpiServices, AddressMatchingService, SharedService, EmpoweredModalService } from "@empowered/common-services";

const DECLINEDCOVERAGELEVELID = 2;
const EMPLOYER_CONTRIBUTION = "primary.portal.expandedShoppingCart.employerContribution";

@Component({
    selector: "empowered-shop-review",
    templateUrl: "./shop-review.component.html",
    styleUrls: ["./shop-review.component.scss"],
})
export class ShopReviewComponent implements OnInit, OnDestroy {
    @Output() backEvent = new EventEmitter<void>();
    disableApply = false;
    memberId: number;
    mpGroup: number;
    cartCount = 0;
    totalCost = 0;
    payfrequencyName = "";
    cartLoop: CartItemView[] = [];
    planOfferingIdArray: number[] = [];
    coverageIdArray: number[] = [];
    enrollmentState: string;
    isCartEmpty = false;
    isSpinnerLoading = false;
    isTpi = false;
    tpiLnlMode = false;
    showErrorMessage = false;
    errorMessage: string;
    flexDollars: FlexDollarModel;
    isBenefitDollarsConfigEnabled = false;
    isAddressMatchingConfigEnabled = false;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.tpi.shopReview.cartEmpty",
        "primary.portal.tpi.shopReview.coverageFrom",
        "primary.portal.tpi.shopReview.coverageStarts",
        "primary.portal.tpi.shopReview.benefitAmount",
        "primary.portal.tpi.shopReview.remove",
        "primary.portal.tpi.shopReview.enrollment",
        "primary.portal.tpi.shopReview.total",
        "primary.portal.common.star",
        "primary.portal.tpi.shopReview.exit",
        "primary.portal.tpi.shopReview.back",
        "primary.portal.tpi.shopReview.applyBenefits",
        "primary.portal.tpi.exitTitle",
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.brandingModalExit.buttonCancel",
        "primary.portal.shoppingCart.cartMessage",
        "primary.portal.tpi.reviewEmpty",
        "primary.portal.lnl.reviewYourSelections",
        "primary.portal.shoppingCart.flexDiscountAmount",
        EMPLOYER_CONTRIBUTION,
        "primary.portal.quoteShop.preTax",
        "primary.portal.quoteShop.postTax",
    ]);
    private readonly unsubscribe$ = new Subject<void>();
    isAgentAssisted = false;
    locked = false;
    enrollmentMethod: string;
    tpiSsoDetail: TpiSSOModel;
    planYearId = undefined;
    totalFlexCost = 0;
    pfPipeObj: PayFrequencyObject = {
        payFrequencies: [],
        pfType: "",
        payrollsPerYear: 0,
    };
    payFrequencyId: number;
    isOpenEnrollment: boolean;
    isQLEPeriod: boolean;
    cartItems: CartItem[] = [];
    @Select(EnrollmentState.GetIsOpenEnrollment) isOpenEnrollment$: Observable<boolean>;
    @Select(EnrollmentState.GetIsQLEPeriod) isQLEPeriod$: Observable<boolean>;
    policyFeeWaiverBenefitMinimum: number;
    private readonly getPolicyFeeWaiverBenefitMin$ = defer(() =>
        this.staticUtilService.cacheConfigValue(ConfigName.POLICY_FEE_WAIVER_BENEFIT_MIN).pipe(
            takeUntil(this.unsubscribe$),
            tap((benefitMin) => (this.policyFeeWaiverBenefitMinimum = +benefitMin)),
        ),
    );

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly sharedService: SharedService,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly coreService: CoreService,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly utilService: UtilService,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly tpiService: TpiServices,
        private readonly staticUtilService: StaticUtilService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly addressMatchingService: AddressMatchingService,
    ) {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        if (this.tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId)) {
            this.isAgentAssisted = true;
        }
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.BENEFIT_DOLLARS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((enabled) => (this.isBenefitDollarsConfigEnabled = enabled));
        this.isOpenEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isOpenEnrollment = x));
        this.isQLEPeriod$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isQLEPeriod = x));
    }

    /**
     * Function to implement Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.isTpi = this.router.url.indexOf(TPI.TPI) > 0;
        this.getAddressMatchConfigValue();
        this.fetchReviewPageData();
        if (this.isTpi) {
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        }
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.isSpinnerLoading = true;
        this.shoppingService
            .getCartItems(this.memberId, this.mpGroup, "", this.isTpi ? [] : this.planYearId)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((cartItems) => {
                    cartItems = cartItems.filter(
                        (item) => item.coverageLevelId !== DECLINEDCOVERAGELEVELID && item.applicationType !== StepType.REINSTATEMENT,
                    );
                    this.cartItems = cartItems;
                    const apiCalls = [];
                    cartItems.forEach((item, index) => {
                        this.coverageIdArray.push(item.coverageLevelId);
                        this.planOfferingIdArray.push(item.planOfferingId);

                        const cartItemView: CartItemView = {
                            id: item.id,
                            memberCost: item.memberCost,
                            totalCost: item.totalCost,
                            benefitAmount: item.benefitAmount,
                            coverageDateStarts: item.coverageEffectiveDate
                                ? item.coverageEffectiveDate
                                : item.coverageValidity.effectiveStarting,
                            coverageDateEnds: item.coverageValidity.expiresAfter,
                            planOfferingId: item.planOfferingId,
                            coverageLevelId: item.coverageLevelId,
                            riders:
                                item.riders && item.riders.length
                                    ? item.riders.filter((rider) => rider.coverageLevelId !== DECLINEDCOVERAGELEVELID)
                                    : [],
                        };
                        this.cartLoop.push(cartItemView);
                        apiCalls.push(this.getCoverageName(index));
                        apiCalls.push(this.getPlanName(index));
                        if (this.cartLoop[index].riders.length) {
                            apiCalls.push(this.getRiderPlan(index, item.benefitAmount, cartItemView));
                        }
                    });
                    return forkJoin(apiCalls);
                }),
            )
            .subscribe(
                () => {
                    this.cartLoop.sort((a, b) => a.productOfferingId - b.productOfferingId);
                    this.isSpinnerLoading = false;
                },
                () => (this.isSpinnerLoading = false),
            );
        this.getPolicyFeeWaiverBenefitMin$.pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * Gets address matching config value
     */
    getAddressMatchConfigValue(): void {
        this.staticUtilService
            .cacheConfigEnabled(AddressConfig.VALIDATE_ADDRESS_MATCH)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configValue) => {
                this.isAddressMatchingConfigEnabled = configValue;
            });
    }
    /**
     * Function to fetch data required for review page from multiple API
     */
    fetchReviewPageData(): void {
        forkJoin([
            this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : this.planYearId),
            this.accountService.getPayFrequencies(this.mpGroup.toString()),
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
            this.getAppliedFlexDollar(),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([shoppingCartResponse, payFrequencyResponse, memberResponse, flexDollars]) => {
                    this.cartCount = shoppingCartResponse.productOfferingsInCart.length;
                    this.totalCost = shoppingCartResponse.totalCost;
                    this.payfrequencyName = payFrequencyResponse.find(
                        (item) => item.id === memberResponse.body.workInformation.payrollFrequencyId,
                    ).name;
                    if (this.isAgentAssisted) {
                        this.locked = shoppingCartResponse.locked;
                    }
                    this.payFrequencyId = memberResponse.body.workInformation.payrollFrequencyId;
                    this.getPayFrequency(payFrequencyResponse);
                    this.setFlexDollars(flexDollars);
                    this.setReviewPage();
                },
                (error) => {
                    if (error.error) {
                        this.store.dispatch(new SetErrorForShop(error.error));
                    }
                    this.isSpinnerLoading = false;
                    this.disableApply = true;
                    this.errorMessage = error.error.language.displayText;
                    this.showErrorMessage = true;
                },
            );
    }
    /**
     * Set flex dollars amount
     * @param flexDollars Response from getAppliedFlexDollarOrIncentivesForCart API call
     */
    setFlexDollars(flexDollars: FlexDollarModel): void {
        if (flexDollars && flexDollars.planFlexDollarOrIncentives && flexDollars.planFlexDollarOrIncentives.length) {
            this.flexDollars = flexDollars;
            this.store.dispatch(new SetPlanLevelFlexIncetives(flexDollars.planFlexDollarOrIncentives));
            this.totalFlexCost = flexDollars.planFlexDollarOrIncentives
                .map((x) => x.flexDollarOrIncentiveAmount)
                .reduce((total, current) => total + current);
        }
    }
    /**
     * Pay frequencies for the shopping cart items
     * @param payFrequencyResponse Response from getPayFrequencies API call
     */
    getPayFrequency(payFrequencyResponse: PayFrequency[]): void {
        const payFrequencies = payFrequencyResponse.filter((item) => item.id === this.payFrequencyId || item.name === BillingMode.ANNUAL);
        this.pfPipeObj.payFrequencies = payFrequencies;
        const idx = payFrequencies.length === 1 ? 0 : payFrequencies.findIndex((pf) => pf.name !== BillingMode.ANNUAL);
        if (idx > -1) {
            this.pfPipeObj.pfType = payFrequencies[idx].name;
            this.pfPipeObj.payrollsPerYear = payFrequencies[idx].payrollsPerYear;
            this.pfPipeObj = this.utilService.copy(this.pfPipeObj);
        }
    }

    /**
     * Function to set data needed for review page
     */
    setReviewPage(): void {
        const totalCost = PayrollFrequencyCalculatorPipe.prototype.transform(this.totalCost + this.totalFlexCost, this.pfPipeObj);
        this.sharedService.changeShopReviewPage({
            isReview: true,
            cartCount: this.cartCount,
            totalCost: totalCost > 0 ? totalCost : this.totalCost,
            payfrequencyName: this.payfrequencyName,
        });
    }

    /**
     * Function to reset data of review page
     */
    resetReviewPage(): void {
        this.sharedService.changeShopReviewPage({
            isReview: false,
            cartCount: 0,
            totalCost: 0,
            payfrequencyName: "",
        });
    }

    /**
     * Function to get coverage name for the plan
     * @param index {number}
     * @returns {Observable<CoverageLevel>}
     */
    getCoverageName(index: number): Observable<CoverageLevel> {
        return this.coreService.getCoverageLevel(this.coverageIdArray[index].toString()).pipe(
            tap((coverageLevel) => {
                this.cartLoop[index] = { ...this.cartLoop[index], coverageLevelName: coverageLevel.name };
            }),
        );
    }

    /**
     * Function to get in cart plan name
     * @param index {number}
     * @returns {Observable<PlanOffering>}
     */
    getPlanName(index: number): Observable<PlanOffering> {
        return this.shoppingService.getPlanOffering(this.planOfferingIdArray[index].toString(), this.mpGroup).pipe(
            tap((plan) => {
                this.cartLoop[index] = {
                    ...this.cartLoop[index],
                    planName: plan.plan.name,
                    productOfferingId: plan.productOfferingId,
                    planOfferingId: plan.id,
                };
                if (plan.taxStatus === TaxStatus.POSTTAX) {
                    this.cartLoop[index] = { ...this.cartLoop[index], taxStatus: "Post-tax" };
                }
                if (plan.taxStatus === TaxStatus.PRETAX) {
                    this.cartLoop[index] = { ...this.cartLoop[index], taxStatus: "Pre-tax" };
                }
                if (plan.taxStatus === TaxStatus.VARIABLE) {
                    if (this.isOpenEnrollment || this.isQLEPeriod) {
                        this.cartLoop[index] = {
                            ...this.cartLoop[index],
                            taxStatus: this.languageStrings["primary.portal.quoteShop.preTax"],
                        };
                    } else {
                        this.cartLoop[index] = {
                            ...this.cartLoop[index],
                            taxStatus: this.languageStrings["primary.portal.quoteShop.postTax"],
                        };
                    }
                }
                if (this.flexDollars) {
                    this.setFlexDollarsAmountForCart(index);
                }
            }),
        );
    }
    /**
     * Set benefit dollar amount for cart item
     * @param index cart item index
     */
    setFlexDollarsAmountForCart(index: number): void {
        const planFlexDollars = this.flexDollars.planFlexDollarOrIncentives.filter(
            (flex) =>
                flex.cartItemId === this.cartLoop[index].id &&
                (this.cartLoop[index].memberCost === 0 || flex.flexDollarOrIncentiveAmount !== 0),
        );
        if (planFlexDollars.length) {
            const flexDollars = planFlexDollars.map((obj) => {
                const flexDollar = { ...obj };
                flexDollar.flexDollarOrIncentiveName = flexDollar.flexDollarOrIncentiveName
                    .toLowerCase()
                    .includes(this.languageStrings[EMPLOYER_CONTRIBUTION].toLowerCase())
                    ? this.languageStrings[EMPLOYER_CONTRIBUTION]
                    : flexDollar.flexDollarOrIncentiveName;
                return flexDollar;
            });
            const flexCost = flexDollars
                .map((flex) => flex.flexDollarOrIncentiveAmount)
                .reduce(
                    (flexDollarOrIncentiveAmount1, flexDollarOrIncentiveAmount2) =>
                        flexDollarOrIncentiveAmount1 + flexDollarOrIncentiveAmount2,
                );
            this.cartLoop[index] = {
                ...this.cartLoop[index],
                flexDollars: flexDollars,
                memberCost: this.cartLoop[index].memberCost + flexCost,
                totalCost: this.cartLoop[index].totalCost + flexCost,
            };
        }
    }
    /**
     * Function to get rider name and cost for the plan
     * @param index {number} index of the rider in the cart item
     * @param benefitAmount {number} benefit amount of the chosen plan
     * @param cartLooper {CartItemView} items currently in the shopping cart
     * @returns {Observable<PlanOffering[]>} pricing of the rider plan
     */
    getRiderPlan(index: number, benefitAmount?: number, cartLooper?: CartItemView): Observable<PlanOffering[]> {
        return this.shoppingService
            .getPlanOfferingRiders(
                cartLooper.planOfferingId.toString(),
                this.mpGroup,
                this.enrollmentMethod,
                this.enrollmentState,
                this.memberId,
            )
            .pipe(
                tap((resp) => {
                    const riderNameCostArray = [];
                    cartLooper.riders.forEach((rider) => {
                        const riderCost = rider.totalCost;
                        const planOffering = resp.find((riderPlan) => riderPlan.id === rider.planOfferingId);
                        if (planOffering) {
                            if (
                                benefitAmount &&
                                benefitAmount >= this.policyFeeWaiverBenefitMinimum &&
                                planOffering.plan.policySeries === PolicySeriesType.POLICY_FEE
                            ) {
                                this.totalCost = this.totalCost - riderCost;
                            } else {
                                riderNameCostArray.push({ name: planOffering.plan.name, cost: riderCost });
                                const cartItemIndex: number = this.cartLoop.findIndex((cartItemView) => cartItemView.id === cartLooper.id);
                                if (cartItemIndex >= 0) {
                                    this.cartLoop[cartItemIndex] = {
                                        ...this.cartLoop[cartItemIndex],
                                        riderNameCost: riderNameCostArray,
                                        memberCost: this.cartLoop[cartItemIndex].memberCost + riderCost,
                                        totalCost: this.cartLoop[cartItemIndex].totalCost + riderCost,
                                    };
                                }
                            }
                        }
                    });
                }),
            );
    }

    /**
     * Function to return the plan name for the remove plan popup
     * @param {number} productId product id of the plan to remove
     * @param {number} planOfferingId plan offering id of the plan to remove
     * @returns {string} name of the plan to remove
     */
    getPlanNameToRemove(productId: number, planOfferingId: number): string {
        const productOfferings = this.store.selectSnapshot(EnrollmentState.GetProductOfferings);
        const oldProduct = productOfferings ? productOfferings.find((product) => product.id === productId) : undefined;
        if (oldProduct) {
            const oldProductCopy: ProductOfferingPanel = this.utilService.copy(oldProduct);
            const productPlanOffering = oldProductCopy.planOfferings;
            const matchingPlanOffering = productPlanOffering.find((planOffering) => planOffering.id === planOfferingId);
            return matchingPlanOffering ? matchingPlanOffering.plan.name : "";
        }
        return "";
    }

    /**
     * Function triggered on click of 'Remove'
     * @param {number} itemId
     * @param {number} productId
     * @param {number} planOfferingId
     */
    onRemove(itemId: number, productId: number, planOfferingId: number): void {
        const planName = this.getPlanNameToRemove(productId, planOfferingId);
        this.empoweredModalService
            .openDialog(RemovePlanComponent, { data: planName })
            .afterClosed()
            .pipe(
                filter((userResponse) => Boolean(userResponse)),
                tap(() => (this.isSpinnerLoading = true)),
                switchMap(() => this.shoppingService.deleteCartItem(this.memberId, itemId, this.mpGroup)),
                mergeMap(() => this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : this.planYearId)),
                switchMap((shoppingCartResponse) => {
                    this.isSpinnerLoading = false;
                    const index = this.cartLoop.findIndex((item) => item.id === itemId);
                    if (index !== -1) {
                        this.cartLoop.splice(index, 1);
                        const oldProduct = this.store
                            .selectSnapshot(EnrollmentState.GetProductOfferings)
                            .find((product) => product.id === productId);
                        const oldProductCopy: ProductOfferingPanel = this.utilService.copy(oldProduct);
                        const productPlanOffering = oldProductCopy.planOfferings;
                        oldProductCopy.inCart = this.cartLoop.some((cart) => cart.productOfferingId === productId);
                        productPlanOffering.find((planOffering) => planOffering.id === planOfferingId).inCart = this.cartLoop.some(
                            (cart) => cart.planOfferingId === planOfferingId,
                        );
                        this.store.dispatch(new SetProductOfferingsOfId(oldProductCopy));
                        this.store.dispatch(new SetProductPlanOfferings(oldProduct.id, productPlanOffering));
                        this.cartCount = shoppingCartResponse.productOfferingsInCart.length;
                        this.totalCost = shoppingCartResponse.totalCost;
                        this.isCartEmpty = Boolean(!this.cartLoop.length);
                        if (this.isAgentAssisted) {
                            this.locked = shoppingCartResponse.locked;
                        }
                        return this.getAppliedFlexDollar();
                    }
                    return of(null);
                }),
                tap((flexDollars) => {
                    this.setFlexDollars(flexDollars);
                    this.setReviewPage();
                }),
                catchError(() => {
                    this.isSpinnerLoading = false;
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * get AppliedFlexDollarOrIncentives for cart api
     * @returns observable of getAppliedFlexDollarOrIncentivesForCart api
     */
    getAppliedFlexDollar(): Observable<FlexDollarModel> {
        return this.isBenefitDollarsConfigEnabled
            ? this.shoppingCartDisplayService.getAppliedFlexDollarOrIncentivesForCart(this.memberId, this.mpGroup.toString())
            : of(null as FlexDollarModel);
    }
    /**
     * Function triggered on click of 'Exit' button
     */
    onExit(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            memberId: this.memberId,
            groupId: this.mpGroup,
            ssoToShop: !(this.tpiSsoDetail.planId || this.tpiSsoDetail.productId),
        };
        dialogConfig.data = modalData;
        this.empoweredModalService.openDialog(ExitPopupModalComponent, dialogConfig);
    }

    /**
     * Function to navigate user back to product page
     */
    onBack(): void {
        this.backEvent.emit();
        this.resetReviewPage();
    }

    /**
     * Function to navigate user to TPI Application Flow Screen if user's address doesn't match to that of
     * producer's or group owner's otherwise user is redirected to address matching steps
     */
    navigateToTpiAppFlow(): void {
        const productPlanData = this.store.selectSnapshot(EnrollmentState.GetProductPlanData);
        if (this.isAddressMatchingConfigEnabled && this.addressMatchingService.checkForAiPlansInCart(this.cartItems, productPlanData)) {
            const addressMatchPromptData: AddressMatchModel = {
                isDirect: false,
                isTPILnlAgentAssisted: this.isAgentAssisted,
                isTPILnlSelfService: !this.isAgentAssisted,
                mpGroupId: this.mpGroup,
                memberId: this.memberId,
            };
            this.memberService
                .getMemberContact(this.memberId, ContactType.HOME, this.mpGroup.toString())
                .pipe(
                    switchMap((res) => {
                        addressMatchPromptData.address = res.body.address;
                        return this.addressMatchingService.validateAccountContactOrAccountProducerMatch(
                            this.mpGroup,
                            this.memberId,
                            res.body.address,
                        );
                    }),
                    switchMap((response) => {
                        if (response) {
                            if (this.tpiLnlMode) {
                                return this.empoweredModalService
                                    .openDialog(AddressMatchingPromptComponent, {
                                        data: addressMatchPromptData,
                                    })
                                    .afterClosed();
                            }
                            this.router.navigate([`tpi/address-matched/${this.mpGroup}/${this.memberId}`]);
                            return of(false);
                        }
                        return of(true);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((response) => {
                    if (response) {
                        this.router.navigate([`tpi/app-flow/${this.mpGroup}/${this.memberId}`]);
                    }
                });
        } else {
            this.router.navigate([`tpi/app-flow/${this.mpGroup}/${this.memberId}`]);
        }
    }

    /**
     * Function to implement Angular's OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.resetReviewPage();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
