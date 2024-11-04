import {
    DateFormats,
    CarrierId,
    ConfigName,
    PayFrequency,
    PayFrequencyObject,
    AppSettings,
    Characteristics,
    TaxStatus,
    CoverageLevel,
    PlanOffering,
    GetCartItems,
    FlexDollarModel,
    PlanFlexDollarOrIncentives,
} from "@empowered/constants";
import { Component, OnInit, Input, OnChanges, OnDestroy } from "@angular/core";
import {
    ShoppingService,
    ShoppingCartDisplayService,
    CartItem,
    CoreService,
    MemberService,
    AccountService,
    ViewPlanInfoModel,
    Carrier,
} from "@empowered/api";
import { EnrollmentState, AppFlowService, StaticUtilService, MemberWizardState, TPIState } from "@empowered/ngxs-store";

import { Select, Store } from "@ngxs/store";
import { PlanDetailsComponent } from "@empowered/ui";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { combineLatest, forkJoin, iif, Observable, of, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil, filter, map, tap, switchMap, catchError } from "rxjs/operators";
import { RemoveCartItemComponent } from "../../shopping-cart/remove-cart-item/remove-cart-item.component";
import { Router } from "@angular/router";
import { ViewPlanInfoComponent } from "../view-plan-info/view-plan-info.component";
import { TpiServices, EmpoweredModalService } from "@empowered/common-services";
import { UserService } from "@empowered/user";

const MEMBER_PORTAL = "member";

@Component({
    selector: "empowered-planinfo-compact",
    templateUrl: "./planinfo-compact.component.html",
    styleUrls: ["./planinfo-compact.component.scss"],
})
export class PlaninfoCompactComponent implements OnInit, OnChanges, OnDestroy {
    @Input() application;
    enrolledCoLevelName: string;
    portal: string;
    isMemberPortal: boolean;
    planCost: number;
    netCost: number;
    flexDollars: PlanFlexDollarOrIncentives[];
    isBenefitDollarConfigEnabled: boolean;
    isBenefitDollarPresent = false;
    mpGroup;
    memberId;
    cartDetails: CartItem;
    planOfferingDetails: PlanOffering;
    coverageLevels: CoverageLevel[];
    riderPlanDetails: string[] = [];
    showPanel = false;
    showData = false;
    showRiders = false;
    dependentNameToDisplay = "";
    monthlyLitral = "MONTHLY";
    payFrequency: PayFrequency;
    pfObject: PayFrequencyObject;
    isSpinnerLoading: boolean;
    declinedCoverageLevelId = 2;
    riderPlanOfferingdetails: PlanOffering[] = [];
    private unsubscribe$ = new Subject<void>();
    isCompanyProvidedPlan: boolean;
    isEmployerContributionPlan = false;
    isTpi = false;
    tpiLnlMode = false;
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    aflacGroupId = CarrierId.AFLAC_GROUP;
    taxStatus = TaxStatus;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planInfo.coverageLevel",
        "primary.portal.applicationFlow.planInfo.riders",
        "primary.portal.applicationFlow.planInfo.taxStatus",
        "primary.portal.applicationFlow.planInfo.planDetails",
        "primary.portal.applicationFlow.planInfo.yourCost",
        "primary.portal.applicationFlow.planInfo.baseCost",
        "primary.portal.applicationFlow.planInfo.netCost",
        "primary.portal.applicationFlow.planInfo.adjustments",
        "primary.portal.applicationFlow.planInfo.zeroCost",
        "primary.portal.applicationFlow.planInfo.removeFromCart",
        "primary.portal.applicationFlow.planInfo.dependentName",
        "primary.portal.common.view",
        "primary.portal.common.hide",
        "primary.portal.coverage.individual",
        "primary.portal.applicationFlow.viewPlanInfo",
        "primary.portal.applicationFlow.planInfo.currency",
        "primary.portal.shoppingExperience.coverageDate",
        "primary.portal.expandedShoppingCart.employerContribution",
    ]);
    @Select(MemberWizardState.GetAllCarriers) allMemberWizardCarriers$: Observable<Carrier[]>;
    @Select(TPIState.GetAllCarriers) allTPICarriers$: Observable<Carrier[]>;

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly store: Store,
        private readonly appFlowService: AppFlowService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly coreService: CoreService,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly tpiService: TpiServices,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly userService: UserService,
    ) {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
    }

    /**
     * Angular life-cycle hook ngOnInit
     * Fetch all configs and required data on component initialization
     * @returns void
     */
    ngOnInit(): void {
        // Gets all carriers from either the member or TPI flow
        const allCarriers$ = combineLatest([this.allMemberWizardCarriers$, this.allTPICarriers$]).pipe(
            map(([wizardCarriers, tpiCarriers]) => wizardCarriers ?? tpiCarriers),
        );
        // Combines Virginia Connection config plus users state
        const virginiaFeatureEnabled$ = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_VIRGINIA_OBJECTION).pipe(
            map((virginiaConfig) => {
                // if virginia objection config is off, then disable feature
                if (!virginiaConfig) {
                    return false;
                }
                return true;
            }),
        );
        // updates plan data when carrier Aflac exists
        combineLatest([virginiaFeatureEnabled$, allCarriers$])
            .pipe(
                tap(([virginiaEnabled, allCarriers]) => {
                    if (virginiaEnabled) {
                        const aflacCarrierObj = allCarriers.find((carrier) => CarrierId.AFLAC === carrier.id);
                        const applicationData = { ...this.application, legalName: aflacCarrierObj?.legalName };
                        this.application = applicationData;
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isBenefitDollarConfigEnabled = result;
            });
        this.userService.portal$.pipe(takeUntil(this.unsubscribe$)).subscribe((portal) => (this.isMemberPortal = portal === MEMBER_PORTAL));
        this.payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        this.isSpinnerLoading = false;
        this.getPlanCostFromCart().subscribe();
        this.getPlanOfferingDetails();
        this.getPayFrequencyObject();
        this.subscribeToCartData();
        this.isTpi = this.router.url.indexOf(AppSettings.TPI) > 0;
        if (this.isTpi) {
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        }
        this.staticUtilService
            .cacheConfigValue("portal.enrollment.enrolled_coverage_level")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.enrolledCoLevelName = result;
            });
        this.appFlowService.updateCost$
            ?.pipe(
                switchMap((cost) =>
                    this.getBenefitDollars().pipe(
                        tap((benefitDollars) => {
                            this.cartDetails = this.application.cartData;
                            this.planCost = this.netCost = cost;
                            if (benefitDollars !== null) {
                                // null means the benefit dollars config is disabled
                                this.updateBenefitDollars(benefitDollars);
                            }
                        }),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.appFlowService.updateCoveredDependentDetails$?.pipe(takeUntil(this.unsubscribe$)).subscribe((dependentName) => {
            if (dependentName) {
                this.dependentNameToDisplay = dependentName;
            }
        });
        const plans = this.appFlowService?.getEmployerContributionPlans();
        if (plans && plans.length) {
            this.isEmployerContributionPlan = plans.includes(this.application.appData.planId.toString());
        }
    }
    /**
     * Angular life-cycle hook ngOnChanges
     * Update plan cost and cart item if any changes made on Application flow
     * @returns void
     */
    ngOnChanges(): void {
        this.showData = false;
        this.cartDetails = this.application.cartData;
        this.riderPlanOfferingdetails = [];
        this.getPlanCostFromCart().subscribe();
        this.getPlanOfferingDetails();
    }
    /**
     * Method to update cartData on change of data in store
     */
    subscribeToCartData(): void {
        this.store
            .select((store) => store.enrollment.cartItems)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((cartItems) => cartItems && cartItems.length > 0),
                map((cartItems) => cartItems.filter((cartItem) => cartItem.id === this.application.cartData.id).pop()),
                filter((cartData) => cartData),
                tap((cartData: GetCartItems) => {
                    this.cartDetails = cartData;
                }),
                switchMap(() => this.getPlanCostFromCart()),
            )
            .subscribe();
    }
    /**
     * calculate total cost of plan by adding base cost and rider cost
     */
    getPlanCostFromCart(): Observable<unknown[]> {
        let riderCost = 0;
        const apiCalls = [];
        if (this.cartDetails?.riders) {
            this.cartDetails.riders.forEach((riderCart) => {
                riderCost += riderCart.totalCost;
            });
            if (this.riderPlanOfferingdetails && this.riderPlanOfferingdetails.length > 0) {
                this.getRiderPlandetails();
            } else {
                apiCalls.push(this.getRiderPlanOfferingdetails());
            }
        }
        apiCalls.push(
            this.getBenefitDollars().pipe(
                tap((benefitDollars) => {
                    this.planCost = this.cartDetails.totalCost + riderCost;
                    this.netCost = this.cartDetails.memberCost + riderCost;
                    if (benefitDollars !== null) {
                        this.updateBenefitDollars(benefitDollars);
                    }
                }),
            ),
        );
        return combineLatest([...apiCalls]).pipe(takeUntil(this.unsubscribe$));
    }
    getPlanOfferingDetails(): void {
        if (this.memberId && this.mpGroup && this.application?.cartData.id) {
            this.shoppingService
                .getPlanOffering(this.application.cartData.planOffering.id, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.planOfferingDetails = response;
                    this.isCompanyProvidedPlan = this.planOfferingDetails.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED);
                    this.getCoverageLevels();
                });
        }
    }

    /**
     * Updates variables related to benefit dollars
     * @param flexDollars benefit dollars object
     */
    updateBenefitDollars(flexDollars: FlexDollarModel): void {
        if (flexDollars && flexDollars.planFlexDollarOrIncentives && flexDollars.planFlexDollarOrIncentives.length) {
            this.flexDollars = flexDollars.planFlexDollarOrIncentives.filter(
                (dollar) => dollar.cartItemId === this.application.cartData.id,
            );
        }
        if (this.flexDollars && this.flexDollars.length) {
            this.flexDollars = this.flexDollars.map((flexDollar) => ({
                ...flexDollar,
                flexDollarOrIncentiveName: flexDollar.flexDollarOrIncentiveName
                    .toLowerCase()
                    .includes(this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"].toLowerCase())
                    ? this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"]
                    : flexDollar.flexDollarOrIncentiveName,
            }));
            this.isBenefitDollarPresent = true;
            const totalCost = this.planCost + this.flexDollars.reduce((total, current) => total + current.flexDollarOrIncentiveAmount, 0);
            this.netCost = totalCost > 0 ? totalCost : 0;
        } else {
            this.isBenefitDollarPresent = false;
        }
    }

    /**
     * Get benefit dollar details
     * @returns observable of info about about benefit dollars
     */
    getBenefitDollars(): Observable<FlexDollarModel> {
        return this.staticUtilService.cacheConfigEnabled(ConfigName.BENEFIT_DOLLARS).pipe(
            switchMap((benefitDollarsEnabled) =>
                iif(
                    () => benefitDollarsEnabled,
                    this.shoppingCartDisplayService.getAppliedFlexDollarOrIncentivesForCart(this.memberId, this.mpGroup),
                    of(null),
                ).pipe(
                    catchError((error) => of(null)),
                    takeUntil(this.unsubscribe$),
                ),
            ),
        );
    }

    /**
     * Replace coverage level name to INDIVIDUAL if coverage level is ENROLLED, else return the actual coverage level
     *
     * @param coverageLevelId
     * @returns coverageLevelName
     */
    getCoverageLevelName(coverageLevelId: number): string {
        let name: string = this.coverageLevels.filter((coverageLevel) => coverageLevel.id === coverageLevelId).pop().name;
        if (name === this.enrolledCoLevelName) {
            name = this.languageStrings["primary.portal.coverage.individual"];
        }
        return name;
    }

    /**
     * Opens plan details modal
     */
    showPlanDetails(): void {
        const planDetails = {
            planOfferingId: this.application.cartData.planOffering.id,
            planId: this.application.planId,
            planName: this.application.planName,
            states: [{ abbreviation: this.application.cartData.enrollmentState, name: "" }],
            mpGroup: this.mpGroup,
            riderIds: this.cartDetails.riders && this.cartDetails.riders.map((rider) => rider.planId),
        };
        const dialogRef = this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }

    /**
     * Function to open remove cart dialog and remove the plan from cart
     */
    discard(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            planName: this.application.planName,
        };
        dialogConfig.data = modalData;
        this.empoweredModalService
            .openDialog(RemoveCartItemComponent, dialogConfig)
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((afterClosedResult) => afterClosedResult.type === "Remove"),
            )
            .subscribe(() => {
                this.appFlowService.discardApplication(this.application.cartData.id);
            });
    }
    getCoverageLevels(): void {
        this.coreService
            .getCoverageLevels(this.planOfferingDetails.plan.id.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.coverageLevels = response;
                this.showData = true;
            });
    }

    togglePlanInfo(expand: boolean): void {
        this.showPanel = expand;
    }
    getRiderPlandetails(): void {
        if (
            this.cartDetails.riders &&
            this.cartDetails.riders.length > 0 &&
            this.riderPlanOfferingdetails &&
            this.riderPlanOfferingdetails.length > 0
        ) {
            this.riderPlanDetails = [];
            this.cartDetails.riders.forEach((rider) => {
                if (rider.coverageLevelId !== this.declinedCoverageLevelId) {
                    const planOffering = this.riderPlanOfferingdetails.filter((plan) => rider.planOfferingId === plan.id).pop();
                    if (planOffering && planOffering.plan.name) {
                        this.riderPlanDetails.push(
                            `<p>${planOffering.plan.name}${rider.benefitAmount ? ":" + rider.benefitAmount : ""}</p>`,
                        );
                    }
                }
            });
            if (this.riderPlanDetails.length > 0) {
                this.showRiders = true;
            } else {
                this.showRiders = false;
            }
        }
    }

    getPayFrequencyObject(): void {
        this.isSpinnerLoading = true;
        this.memberService
            .getMember(this.memberId, true, this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.accountService.getPayFrequencies(this.mpGroup.toString()).subscribe(
                        (resp) => {
                            this.payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
                            this.pfObject = {
                                payFrequencies: [],
                                pfType: "",
                                payrollsPerYear: 0,
                            };
                            const payFrequencies = resp.find((item) => item.id === res.body.workInformation.payrollFrequencyId);
                            this.pfObject.payFrequencies = [...resp];
                            this.pfObject.pfType = payFrequencies.name;
                            const monthlypayFrequency = resp.find((ele) => ele.frequencyType === this.monthlyLitral);
                            this.pfObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                            this.isSpinnerLoading = false;
                        },
                        (error) => {
                            this.isSpinnerLoading = false;
                        },
                    );
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    getRiderPlanOfferingdetails(): Observable<PlanOffering[]> {
        return this.cartDetails.riders && this.cartDetails.riders.length > 0
            ? forkJoin(
                  this.cartDetails.riders.map((rider) =>
                      this.shoppingService.getPlanOffering(rider.planOfferingId.toString(), this.mpGroup),
                  ),
              ).pipe(
                  tap((response) => {
                      this.riderPlanOfferingdetails = response;
                      this.getRiderPlandetails();
                  }),
                  takeUntil(this.unsubscribe$),
              )
            : of([]);
    }
    /**
     * Function to open dialog when user clicks on view plan info
     */
    tpiViewPlanInfoModal(): void {
        const dialogConfig = new MatDialogConfig();
        const viewPlanInfoDetail: ViewPlanInfoModel = {
            planName: this.application.planName,
            coverageLevel: this.getCoverageLevelName(this.cartDetails.coverageLevelId),
            riders: this.riderPlanDetails,
            taxStatus: this.planOfferingDetails.taxStatus,
            planCost: this.planCost,
            netCost: this.netCost,
            payFrequencyName: this.payFrequency.name,
            isRider: this.showRiders,
            cartId: this.application.cartData.id,
            isCompanyProvided: this.planOfferingDetails.plan.characteristics,
            flexDollars: this.flexDollars,
        };
        dialogConfig.data = viewPlanInfoDetail;
        this.empoweredModalService.openDialog(ViewPlanInfoComponent, dialogConfig);
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
