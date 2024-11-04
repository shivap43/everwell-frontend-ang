import { Component, OnDestroy, OnInit, HostListener } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { Location, DatePipe } from "@angular/common";
import {
    GetShoppingCart,
    AflacService,
    ShoppingService,
    EnrollmentService,
    EnrollmentStatus,
    AccountService,
    MemberService,
    BenefitsOfferingService,
    AccountProfileService,
    EnrollmentStateRelation,
    CrossBorderRule,
    RouteStateModel,
} from "@empowered/api";
import { UserService } from "@empowered/user";
import { Select, Store } from "@ngxs/store";
import { forkJoin, Observable, Subject, of, Subscription, iif, EMPTY } from "rxjs";

import {
    SetMemberId,
    SetMPGroup,
    SetNavBarType,
    SetPayFrequency,
    SetProductOfferings,
    SetEnrollmentMethod,
    SetEnrollmentState,
    SetEnrollments,
    SetAllPlanOfferings,
    SetExitPopupStatus,
    SetMemberName,
    SetMemberDependents,
    SetMemberBeneficiaries,
    SetCompanyProductsDisplayed,
    SetIsOpenEnrollment,
    SetQLE,
    SetMemberFlexDollars,
    SetEnrollmentInformation,
    SetSalaryAndRelatedConfigs,
    SetProductPlanData,
    SetRiskClassId,
    SetErrorForShop,
    ResetProductPlanData,
    EnrollmentState,
    QuoteShopHelperService,
    DualPlanYearState,
    QleOeShopModel,
    AppFlowService,
    ApplicationStatusService,
    StaticUtilService,
    DualPlanYearService,
    AccountInfoState,
    TPIState,
} from "@empowered/ngxs-store";
import { Router, NavigationStart, ActivatedRoute } from "@angular/router";
import { LanguageService, LanguageState, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MonDialogComponent, MonDialogData, OfferingListPopupComponent, ExitPopupModalComponent } from "@empowered/ui";
import { CompanyProvidedProductsDialogComponent } from "./company-provided-products-dialog/company-provided-products-dialog.component";
import { map, finalize, mergeMap, tap, catchError, filter, switchMap, first, takeUntil } from "rxjs/operators";
import { TpiServices, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { FormControl } from "@angular/forms";
import {
    ProductId,
    DateFormats,
    CarrierId,
    ConfigName,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    TpiSSOModel,
    PayFrequency,
    ApiError,
    RiskClass,
    ProducerDetails,
    EnrollmentConstants,
    AppSettings,
    DualPlanYearSettings,
    EnrollmentMethod,
    Characteristics,
    RatingCode,
    AddCartItem,
    ProductType,
    TaxStatus,
    PolicyOwnershipType,
    GetCartItems,
    MemberCredential,
    Enrollments,
    MemberFlexDollar,
    PlanOfferingPanel,
    Accounts,
    ProductOfferingPanel,
    DependentRelationsId,
} from "@empowered/constants";
import { DateService } from "@empowered/date";

const RIDERS_INDEX = 0;
const DEPENDENTS_INDEX = 1;
const BENEFICIARIES_INDEX = 2;
const MAX_DAYS = 120;
const DAYS = "days";
const BENEFIT_DOLLAR_CONFIG = "general.feature.enable.benefitDollars";
const NEXT_DAY_INDEX = 1;
const PLAN_OFFERING_INDEX = 1;
const ENROLLMENT_INDEX = 2;
const DUAL_PLANYEAR_INDEX = 5;
const DECLINED_ID = 2;
const INDUSTRY_CODE = "IndustryCode";
const SHOP_LABEL = "Shop";
const INVALID_ENROLLMENT_STATE_PRODUCER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.producer.state";
const INVALID_ENROLLMENT_STATE_MEMBER_ERROR_KEY = "error.detail.displayText.getPlanOfferings.400.member.state";
const BENEFIT_OFFERING_ERROR = "error.detail.displayText.getPlanOfferings.409.producer.benefitOffering";
interface ContinuousCoverageDate {
    coverageStart: Date | string;
    productId: number;
}

@Component({
    selector: "empowered-shop-overview",
    templateUrl: "./shop-overview.component.html",
    styleUrls: ["./shop-overview.component.scss"],
})
export class ShopOverviewComponent implements OnInit, OnDestroy {
    productId = 0;
    isShoppingOverview = true;
    showSpinner = true;
    showErrorMessage: boolean;
    errorMessage: any;
    productsOfferings: ProductOfferingPanel[];
    loadComponents = false;
    mpGroup: number;
    names = "portal.member.shop.requireEnrollmentForAllProducts";
    memberId: number;
    method = EnrollmentMethod.SELF_SERVICE;
    enrollmentState: string;
    payFrequency: PayFrequency;
    payFrequncyId: number;
    private allowNavigation$ = new Subject<boolean>();
    contactType = "HOME";
    ERROR = "error";
    DETAILS = "details";
    exitPopupStatus = false;
    cartItems: GetCartItems[];
    isWizard: boolean;
    applicableCrossBorderRule: CrossBorderRule;
    memberResidentState: string;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.exitTitle",
        "primary.portal.shoppingExperience.exitContent",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.brandingModalExit.buttonCancel",
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
        "primary.portal.shoppingExperience.selectPlans",
        "primary.portal.shoppingExperience.benefitDollars",
        "primary.portal.shoppingExperience.employerCouponsOffer",
        "primary.portal.shoppingExperience.learnMore",
        "primary.portal.shopQuote.specificPayroll.employee",
        "primary.portal.tpi.optionLabel",
        "primary.portal.tpi.optionDescription",
        "primary.portal.tpi.beginShopping",
        "primary.portal.shoppingExperience.backToShop",
        "primary.portal.tpi.reviewApply",
        "primary.portal.tpi.nextProduct",
        "primary.portal.tpi.exitTitle",
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.shopQuote.specificPayroll.existingCoverageNotDisplayed",
        "primary.portal.assist.enrollment",
    ]);

    prevTab: any;
    subscriptions: Subscription[] = [];
    LAND_ON_PLAN_LIST = "landOnPlanList";
    exitStatus = false;
    isBenefitDollarConfigEnabled = false;
    tpiLnlMode = false;

    @Select(EnrollmentState.GetProductOfferings) productOfferings$: Observable<ProductOfferingPanel[]>;
    @Select(EnrollmentState.GetExitPopupStatus) exitPopupStatus$: Observable<boolean>;
    @Select(EnrollmentState.GetIsPlanListPage) isPlanListPage$: Observable<boolean>;
    @Select(EnrollmentState.GetProductPlanData) productPlanData$: Observable<void>;
    routeState$: Observable<RouteStateModel> = this.route.paramMap.pipe(map(() => window.history.state));
    isTpi = false;
    isSsoToPlan = false;
    isSsoToProduct = false;
    isSsoToShop = false;
    isAgentAssisted = false;
    tpiSsoDetail: TpiSSOModel;
    selectedProductControl = new FormControl();
    isReviewPage = false;
    tpiProducerId: number;
    isSelfEnrollmentFlag = false;
    flexDollars: MemberFlexDollar[] = [];
    readonly NEW_YORK_ABBR = "NY";
    readonly OHIO_ABBR = "OH";
    minSalaryRequiredProducts: string[] = [];
    productSpecificMinSalary: number;
    isIncomeLowerThanThreshold: boolean;
    planYearId = undefined;
    accountInfo: Accounts;
    importFailed = false;
    @Select(LanguageState.getApiErrorLanguage) errorMessage$: Observable<ApiError>;
    disableApply = false;
    errorInfo = "";
    maxDays = MAX_DAYS;
    loadTPI = false;
    primaryProducerInfo: ProducerDetails;
    ssoAuthData: TpiSSOModel;
    invalidEnrollmentStateErrorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly enrollmentService: EnrollmentService,
        private readonly user: UserService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly memberService: MemberService,
        private readonly aflacService: AflacService,
        private readonly languageService: LanguageService,
        private readonly sharedService: SharedService,
        private readonly benefitOffService: BenefitsOfferingService,
        private readonly location: Location,
        private readonly appFlowService: AppFlowService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly route: ActivatedRoute,
        private readonly tpiService: TpiServices,
        private readonly datePipe: DatePipe,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly accountProfileService: AccountProfileService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly applicationStatusService: ApplicationStatusService,
        private readonly dateService: DateService,
    ) {
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.sharedService.changeTpi(true);
            this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.tpiProducerId = this.tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId);
            if (this.tpiProducerId) {
                this.mpGroup = this.tpiSsoDetail.user.groupId;
                this.memberId = this.tpiSsoDetail.user.memberId;
                this.configureCrossBorderRules();
                this.isAgentAssisted = true;
                this.method = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
                this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
                this.staticUtilService
                    .cacheConfigEnabled(ConfigName.ALLOW_USER_TO_SHOP_MORE_THAN_120_DAYS)
                    .pipe(
                        filter((configValue) => configValue),
                        switchMap(() =>
                            forkJoin(
                                this.benefitOffService.getPlanYears(this.mpGroup, false),
                                this.benefitOffService.getPlanYears(this.mpGroup, true),
                            ),
                        ),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe(
                        ([approvedPlanYears, unapprovedPlanYears]) =>
                            (this.maxDays = Math.max(
                                this.maxDays,
                                this.dualPlanYearService.calculateMaxDayDifference([...approvedPlanYears, ...unapprovedPlanYears]),
                            )),
                    );
            }
            if (this.tpiSsoDetail.planId) {
                this.isSsoToPlan = true;
            } else if (this.tpiSsoDetail.productId) {
                this.isSsoToProduct = true;
            } else {
                this.isSsoToShop = true;
            }
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.productOfferings$.pipe(takeUntil(this.unsubscribe$)).subscribe((products) => {
            this.productsOfferings = this.isSsoToShop ? products.filter((product) => product.planOfferings?.length) : products;
            if (this.productsOfferings.length && (this.isSsoToPlan || this.isSsoToProduct)) {
                this.productId = this.productsOfferings.find((product) => product.product.id === this.tpiSsoDetail.productId).id;
                this.isShoppingOverview = false;
            }
        });
        this.exitPopupStatus$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.exitPopupStatus = x));
        if (!this.isTpi) {
            const tabs = this.memberService.getMemberWizardTabMenu();
            this.prevTab = tabs[tabs.findIndex((x) => x.label.toLowerCase() === "shop") - 1];
        }
    }

    /**
     * Angular life-cycle hook ngOnInit
     * Called on component initialization
     * Fetch configs to determine flow type and all apis required for displaying in shop page
     */
    ngOnInit(): void {
        if (this.isTpi) {
            this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.sharedService
                .getPrimaryProducer(this.ssoAuthData.user.groupId.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((producerInfo) => {
                    this.primaryProducerInfo = producerInfo;
                });
        }
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.routeState$.pipe(takeUntil(this.unsubscribe$)).subscribe((params: RouteStateModel) => {
            if (this.LAND_ON_PLAN_LIST in params) {
                this.isShoppingOverview = false;
            }
            if (params.productId) {
                this.getProductId(params.productId);
            }
        });
        if (!this.isTpi) {
            this.memberService.wizardCurrentTab$.next(this.memberService.wizardTabMenu.findIndex((resp) => resp.label === SHOP_LABEL));
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                this.memberId = credential.memberId;
            });
        }
        this.showErrorMessage = false;
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(
                filter((response) => response === true),
                tap(() => {
                    this.method = EnrollmentMethod.FACE_TO_FACE;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.staticUtilService
            .cacheConfigEnabled(BENEFIT_DOLLAR_CONFIG)
            .pipe(
                tap((benefitDollarEnabled) => (this.isBenefitDollarConfigEnabled = benefitDollarEnabled)),
                filter((benefitDollarEnabled) => benefitDollarEnabled),
                switchMap((benefitDollarEnabled) => this.getMemberFlexDollars()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        if (!this.isTpi) {
            this.subscriptions.push(this.store.subscribe((data) => (this.isWizard = !!data.MemberWizardState)));
        }
        this.appFlowService.getExitStatus.pipe(takeUntil(this.unsubscribe$)).subscribe((exitStatus) => {
            this.exitStatus = exitStatus;
            if (!this.exitStatus && this.exitStatus !== null) {
                this.exitPopupStatus = false;
            }
        });
        if (this.isTpi) {
            const tpiSsoStoreValue: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            this.memberId = tpiSsoStoreValue.user.memberId;
            this.mpGroup = tpiSsoStoreValue.user.groupId;
            this.getMemberPayFrequency(this.memberId, this.mpGroup);
            this.getConfigurations();
            this.getMemberDependents();
            this.getMemberBeneficiaries();
            this.loadTPI = true;
            this.store.dispatch(
                new SetProductPlanData({
                    mpGroup: this.mpGroup,
                    selectedMethod: this.method,
                    selectedState: this.enrollmentState,
                    memberId: this.memberId,
                }),
            );
            this.productPlanData$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
                this.loadTPI = false;
                this.importAflacPolicies(this.memberId, this.mpGroup);
            });
            this.checkForApiError();
            this.store.dispatch(new SetSalaryAndRelatedConfigs(this.memberId, this.mpGroup));
            this.store.dispatch(new SetMPGroup(this.mpGroup));
            this.store.dispatch(new SetMemberId(this.memberId));
            this.store.dispatch(new SetIsOpenEnrollment(this.mpGroup, false, true));
            this.store.dispatch(new SetQLE(this.memberId, this.mpGroup));
        } else {
            this.user.credential$
                .pipe(
                    switchMap((credential: MemberCredential) => {
                        if (credential.memberId && credential.groupId) {
                            this.memberId = credential.memberId;
                            this.mpGroup = credential.groupId;
                            this.getMemberPayFrequency(this.memberId, this.mpGroup);
                            this.getConfigurations();
                            this.getMemberDependents();
                            this.getMemberBeneficiaries();
                            this.store.dispatch(new SetMPGroup(this.mpGroup));
                            this.store.dispatch(new SetMemberId(this.memberId));
                            this.store.dispatch(new SetEnrollmentMethod(this.method));
                            this.store.dispatch(new SetIsOpenEnrollment(this.mpGroup, false, true));
                            this.store.dispatch(new SetQLE(this.memberId, this.mpGroup));
                            return this.aflacService.importAflacPolicies(this.memberId, this.mpGroup);
                        }
                        return of(EMPTY);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (response) => {
                        this.importFailed = false;
                        this.getMemberContact(this.memberId, this.contactType, this.mpGroup);
                    },
                    (error) => {
                        this.importFailed = true;
                        this.getMemberContact(this.memberId, this.contactType, this.mpGroup);
                    },
                );
        }
        this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
        if (!this.isAgentAssisted) {
            this.shoppingService.acquireShoppingCartLock(this.memberId, this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {
            if (val instanceof NavigationStart && val["url"].indexOf("app-flow") === -1) {
                this.store.dispatch(new SetExitPopupStatus(true));
            }
        });
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params.review) {
                this.isReviewPage = true;
                this.productId = 0;
                this.isShoppingOverview = false;
            }
        });
        this.fetchJobClass();
        this.shoppingService.withdrawApplicationValue$
            .pipe(
                filter((productId) => !!productId),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((productId) => this.getProductId(productId));
    }
    /**
     * Check api error and set error info message
     */
    checkForApiError(): void {
        this.errorMessage$.pipe(takeUntil(this.unsubscribe$)).subscribe((errorMessage) => {
            const apiErrorObject = this.store.selectSnapshot(EnrollmentState.GetApiError);
            if (apiErrorObject?.errorKey === BENEFIT_OFFERING_ERROR) {
                return;
            } else if (
                errorMessage &&
                apiErrorObject &&
                errorMessage.errorKey &&
                apiErrorObject.errorKey &&
                errorMessage.errorKey === apiErrorObject.errorKey
            ) {
                this.errorInfo = errorMessage.value;
            }
        });
    }
    /**
     * Method to get member flex dollars
     * @return observable of member flex dollars
     */
    getMemberFlexDollars(): Observable<MemberFlexDollar[]> {
        return this.accountService.getFlexDollarsOfMember(this.memberId, null).pipe(
            tap((response) => {
                this.flexDollars = response.map((flexDollar) => ({ ...flexDollar, isApproved: true }));
            }),
        );
    }
    /**
     * Method to get member flex dollars
     * @param {number} memberId member id to get aflac policies
     * @param {number} mpGroup mpGroup id of the account
     */
    importAflacPolicies(memberId: number, mpGroup: number): void {
        this.aflacService
            .importAflacPolicies(memberId, mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.importFailed = false;
                    this.getMemberContact(this.memberId, this.contactType, this.mpGroup);
                },
                (error) => {
                    this.importFailed = true;
                    this.getMemberContact(this.memberId, this.contactType, this.mpGroup);
                },
            );
    }

    /**
     * Function to retrieve the cross border rules from API
     * @returns void
     */
    configureCrossBorderRules(): void {
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.CROSS_BORDER_RULE_ENABLED)
            .pipe(
                first(),
                filter((isCrossBorderRulesEnabled) => isCrossBorderRulesEnabled),
                switchMap(() => this.aflacService.getCrossBorderRules(this.mpGroup, this.memberId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((crossBorderRules) => {
                this.applicableCrossBorderRule = crossBorderRules.find((rule) => !rule.allowEnrollment || !rule.releaseBusiness);
            });
    }
    /**
     * get member contact details
     * @param memberId : current member id
     * @param contactType : current member contact type
     * @param mpGroup : current member group
     */
    getMemberContact(memberId: number, contactType: string, mpGroup: number): void {
        this.memberService
            .getMemberContact(memberId, contactType, mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    if (
                        data &&
                        data.body &&
                        data.body.address &&
                        (!this.isAgentAssisted || (this.isTpi && this.method !== EnrollmentMethod.FACE_TO_FACE))
                    ) {
                        this.enrollmentState = data.body.address.state;
                        this.store.dispatch(new SetEnrollmentState(this.enrollmentState));
                    } else {
                        this.showSpinner = false;
                    }
                    this.memberResidentState = data.body.address.state;
                    if (this.enrollmentState) {
                        this.getAllRequiredData()
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                ([productOfferingRes, planOffering, enrollmentRes, shoppingCartRes, flexDollarsRes]) => {
                                    this.showSpinner = false;
                                    let productOfferings: ProductOfferingPanel[] = productOfferingRes;
                                    const planOfferings: PlanOfferingPanel[] = planOffering;
                                    const enrollments: Enrollments[] = this.filterCurrentCoverageEnrollments(enrollmentRes);
                                    const shoppingCart = shoppingCartRes;
                                    const flexDollars: MemberFlexDollar[] = flexDollarsRes;
                                    this.flexDollars = flexDollarsRes.map((flexDollar) => ({
                                        ...flexDollar,
                                        isApproved: true,
                                    }));
                                    this.formatResult(productOfferings, planOfferings, enrollments, shoppingCart);
                                    productOfferings = this.mapPlanToProducts(productOfferings, planOfferings);
                                    if (this.isBenefitDollarConfigEnabled && flexDollars.length) {
                                        productOfferings = productOfferings.map((productOffering) => ({
                                            ...productOffering,
                                            flexDollars: flexDollars.filter(
                                                (flex) => flex.applicableProductId === productOffering.product.id,
                                            ),
                                        }));
                                        this.store.dispatch(new SetMemberFlexDollars(flexDollars));
                                    }
                                    if (this.isTpi) {
                                        this.getMinSalaryProducts(productOfferings);
                                    } else {
                                        this.store.dispatch(new SetProductOfferings(productOfferings));
                                    }
                                    this.store.dispatch(new SetAllPlanOfferings(planOfferings));
                                    this.store.dispatch(new SetEnrollments(enrollments));
                                    this.loadComponents = true;
                                    if (!this.store.selectSnapshot(EnrollmentState.GetCompanyProductsDisplayed)) {
                                        this.displayCompanyProvidedProductsDetails(productOfferings);
                                    }
                                },
                                (error) => {
                                    this.showErrorMessage = true;
                                    this.store.dispatch(new SetErrorForShop(error.error));
                                    this.showErrorAlertMessage(error);
                                    this.showSpinner = false;
                                },
                            );
                    }
                },
                (error) => {
                    this.showErrorMessage = true;
                    if (error.error) {
                        this.store.dispatch(new SetErrorForShop(error.error));
                    }
                    this.showErrorAlertMessage(error);
                    this.showSpinner = false;
                },
            );
    }
    /**
     * Filter enrollments which expire before the coverage start date
     * @param enrollments: All member enrollments
     * @returns filtered Enrollments array
     */
    filterCurrentCoverageEnrollments(enrollments: Enrollments[]): Enrollments[] {
        if (enrollments && enrollments.length) {
            const dualPlanState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
            let coverageStartDate: string;
            if (
                dualPlanState &&
                (dualPlanState.selectedShop === DualPlanYearSettings.OE_SHOP ||
                    dualPlanState.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP)
            ) {
                coverageStartDate = dualPlanState.oeCoverageStartDate;
            }
            if (coverageStartDate) {
                return enrollments.filter(
                    (enrollment) =>
                        !enrollment.validity.expiresAfter ||
                        this.dateService.checkIsAfter(
                            enrollment.validity.expiresAfter ? this.dateService.toDate(enrollment.validity.expiresAfter) : new Date(),
                            this.dateService.toDate(coverageStartDate),
                        ),
                );
            }
        }
        return enrollments;
    }

    /**
     * Method to get the products for employees with less than threshold salary
     * @param productOfferings - products list
     */
    getMinSalaryProducts(productOfferings: ProductOfferingPanel[]): void {
        const memberSalaryData = this.store.selectSnapshot(EnrollmentState.GetMemberSalaryDetails);
        if (memberSalaryData && memberSalaryData.memberSalary < memberSalaryData.minSalaryThreshold) {
            productOfferings = productOfferings.filter(
                (eachOffering) => memberSalaryData.minSalaryProducts.indexOf(eachOffering.product.adminName) === -1,
            );
        }
        this.store.dispatch(new SetProductOfferings(productOfferings));
    }
    /**
     * get product, plan enrollments, shop cart and flex dollar details
     * @returns Observable array of all the api calls
     */
    getAllRequiredData(): Observable<any[]> {
        this.showSpinner = true;
        const referenceDate = this.dualPlanYearService.getReferenceDate();
        return this.staticUtilService.cacheConfigEnabled(BENEFIT_DOLLAR_CONFIG).pipe(
            switchMap((benefitDollarEnabled) =>
                forkJoin([
                    this.shoppingService.getProductOfferingsSorted(this.mpGroup),
                    this.shoppingService.getAllPlanOfferings(
                        this.method,
                        this.mpGroup,
                        this.enrollmentState,
                        this.memberId,
                        {},
                        "plan.carrierId",
                        referenceDate,
                    ),
                    this.enrollmentService
                        .getEnrollments(this.memberId, this.mpGroup, "planId,coverageLevelId")
                        .pipe(
                            mergeMap((enrollments) =>
                                iif(() => enrollments && enrollments.length > 0, this.getEnrollmentDetails(enrollments), of([])),
                            ),
                        ),
                    this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : this.planYearId),
                    benefitDollarEnabled ? this.accountService.getFlexDollarsOfMember(this.memberId, this.mpGroup.toString()) : of([]),
                    this.dualPlanYearService.dualPlanYear(this.memberId, this.mpGroup),
                ]),
            ),
            switchMap((data) => {
                if (data[ENROLLMENT_INDEX].length && data[PLAN_OFFERING_INDEX].length) {
                    const enrollArr: Observable<PlanOfferingPanel>[] = data[ENROLLMENT_INDEX].filter(
                        (enroll) =>
                            // filtering enrollments which are auto enrollable to be displayed on mmp shop page
                            (!enroll.plan.enrollable || data[PLAN_OFFERING_INDEX].every((plan) => plan.id !== enroll.planOfferingId)) &&
                            enroll.coverageLevel.id !== DECLINED_ID &&
                            data[PLAN_OFFERING_INDEX].every((plan) => plan.plan.id !== enroll.plan.id) &&
                            // adding check for COMPANY_PROVIDED plans (i.e BL, LTD),
                            // if PY is in OE and the plans should be shown based on taxstatus
                            (!enroll.plan.characteristics.some((charac) => charac === Characteristics.COMPANY_PROVIDED) ||
                                (enroll.taxStatus === TaxStatus.PRETAX && data[DUAL_PLANYEAR_INDEX].isOpenEnrollmentWindow)),
                    ).map((arg) => this.shoppingService.getPlanOffering(arg.planOfferingId.toString(), this.mpGroup, "plan.carrierId"));
                    if (enrollArr.length > 0) {
                        return forkJoin(enrollArr).pipe(
                            map((res) => {
                                data[PLAN_OFFERING_INDEX] = data[PLAN_OFFERING_INDEX].concat(
                                    res.map((plan) => {
                                        plan.expired = true;
                                        plan.hideEditButton = true;
                                        return plan;
                                    }),
                                );
                                return data;
                            }),
                        );
                    }
                }
                return of(data);
            }),
        );
    }

    /**
     * Api call to fetch enrollment details such as dependents, riders and beneficiaries
     * @param enrollments : enrollments for which the details are fetched
     * @returns Observable of Enrollments array: returns the updated enrollment array with riders, dependent and beneficiaries data appended
     */
    getEnrollmentDetails(enrollments: Enrollments[]): Observable<Enrollments[]> {
        return forkJoin(
            enrollments.map((enrollment) =>
                forkJoin([
                    this.enrollmentService.getEnrollmentRiders(this.memberId, enrollment.id, this.mpGroup),
                    this.enrollmentService.getEnrollmentDependents(this.memberId, enrollment.id, this.mpGroup),
                    this.enrollmentService.getEnrollmentBeneficiaries(this.memberId, enrollment.id, this.mpGroup),
                ]).pipe(
                    map((data) => ({
                        ...enrollment,
                        riders: data[RIDERS_INDEX],
                        enrolledDependents: data[DEPENDENTS_INDEX],
                        beneficiaries: data[BENEFICIARIES_INDEX],
                    })),
                ),
            ),
        );
    }

    formatResult(
        productOfferings: ProductOfferingPanel[],
        planOfferings: PlanOfferingPanel[],
        enrollments: Enrollments[],
        shoppingCart: GetShoppingCart,
    ): void {
        if (shoppingCart.productOfferingsInCart.length > 0) {
            shoppingCart.productOfferingsInCart.forEach((element) => {
                const idx = productOfferings.findIndex((prd) => prd.id === element);
                if (idx > -1) {
                    productOfferings[idx].inCart = true;
                }
            });
        }
        if (shoppingCart.productOfferingsDeclined.length > 0) {
            shoppingCart.productOfferingsDeclined.forEach((element) => {
                const idx = productOfferings.findIndex((prd) => prd.id === element);
                if (idx > -1) {
                    productOfferings[idx].declined = true;
                }
            });
        }
        if (planOfferings.length > 0) {
            planOfferings.forEach((planOffering) => {
                if (this.isCompanyProvidedPlan(planOffering)) {
                    const idx = productOfferings.findIndex((prd) => prd.product.id === planOffering.plan.productId);
                    if (idx > -1) {
                        productOfferings[idx].companyProvided = true;
                    }
                }
            });
        }
        if (enrollments.length > 0) {
            enrollments.forEach((enrollment) => {
                const applicationStatus = this.languageStrings[this.applicationStatusService.convert(enrollment)];
                const index = productOfferings.findIndex((prd) => prd.product.id === enrollment.plan.productId);
                if (index > -1 && productOfferings[index].enrollStatus !== EnrollmentStatus.approved) {
                    productOfferings[index].enrollStatus = applicationStatus;
                    if (applicationStatus === EnrollmentStatus.declined) {
                        productOfferings[index].declined = true;
                    }
                }
            });
        }
    }

    /**
     * Function to map plans to products and property related to cross border implementation
     * @param productOfferings {ProductOfferingPanel[]}
     * @param planOfferings {PlanOfferingPanel[]}
     * @returns {ProductOfferingPanel[]}
     */
    mapPlanToProducts(productOfferings: ProductOfferingPanel[], planOfferings: PlanOfferingPanel[]): ProductOfferingPanel[] {
        productOfferings.forEach((productOffering: ProductOfferingPanel) => {
            let plans = planOfferings.filter(
                (offeredPlan: PlanOfferingPanel) =>
                    offeredPlan.plan.productId === productOffering.product.id && offeredPlan.productOfferingId === productOffering.id,
            );
            if (this.isAgentAssisted) {
                const state = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
                const aflacIndividualPlans = plans.filter(
                    (planOffering) =>
                        planOffering.plan.carrier.id === CarrierId.AFLAC &&
                        planOffering.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
                );
                const hasApplicableCrossBorderRule = Boolean(this.applicableCrossBorderRule) && aflacIndividualPlans.length > 0;
                plans = plans.map((plan) => {
                    if (
                        plan.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL &&
                        this.method === EnrollmentMethod.FACE_TO_FACE &&
                        hasApplicableCrossBorderRule &&
                        ((this.applicableCrossBorderRule.enrollmentStateRelation === EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT &&
                            state !== this.memberResidentState) ||
                            (this.applicableCrossBorderRule.enrollmentStateRelation === EnrollmentStateRelation.SAME_AS_RESIDENT &&
                                state === this.memberResidentState))
                    ) {
                        plan.crossBorderRestrict = true;
                    }
                    return plan;
                });
            }
            productOffering.planOfferings = plans;
            if (plans && plans.length) {
                productOffering.product.carrierName = plans
                    .map((plan) => (plan.plan.carrier ? plan.plan.carrier.name : ""))
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .toString();
                productOffering.productType = this.getProductType(productOffering);
            }
            if (
                productOffering.product.id === ProductId.JUVENILE_TERM_LIFE ||
                productOffering.product.id === ProductId.JUVENILE_WHOLE_LIFE
            ) {
                const dateOfBirth = this.getYoungestChildDateOfBirth();
                // extract child age if DOB is available else set default to zero
                const childAge = dateOfBirth ? this.getChildDependentAge(dateOfBirth) : 0;
                productOffering.planOfferings.forEach((plan) => {
                    plan.childAge = childAge;
                });
            }
        });
        if (this.isTpi && this.tpiSsoDetail) {
            const productPlanData = this.store.selectSnapshot(EnrollmentState.GetProductPlanData);

            productOfferings.forEach((productPlan) => {
                productPlan["planYearExist"] = productPlan.planOfferings.some((plan) => Boolean(plan.planYearId));
            });
            const isPlanYearExist: boolean = productOfferings.some((prod) => prod.planYearExist);
            let finalCoverageDate: Date | string;
            const continuousPlansCoverageDateArray: ContinuousCoverageDate[] = [];
            if (isPlanYearExist) {
                productOfferings.forEach((productPlan) => {
                    const planLatestStartDate = productPlan.planOfferings
                        .map((plans) => plans.validity.effectiveStarting)
                        .sort()
                        .pop();

                    if (!finalCoverageDate || finalCoverageDate < planLatestStartDate) {
                        finalCoverageDate = planLatestStartDate;
                    }

                    continuousPlansCoverageDateArray.push(this.setCoverageStartFunction(planOfferings, productPlan));
                });
            } else {
                productOfferings.forEach((productPlan) => {
                    continuousPlansCoverageDateArray.push(this.setCoverageStartFunction(planOfferings, productPlan));
                });
            }
            // eslint-disable-next-line complexity
            productOfferings.forEach((product) => {
                if (product.planOfferings.length) {
                    let newTPIStartDate: string;
                    let effectiveStartingDate: string;
                    let coverageStartDate: Date | string;
                    let finalCoverageDateObj: ContinuousCoverageDate;
                    const nextDate = this.dateTransform(this.dateService.addDays(new Date(), NEXT_DAY_INDEX));
                    product.tppSentCoverageDateAvailable = Boolean(this.tpiSsoDetail.coverageStartDate);
                    if (isPlanYearExist) {
                        if (continuousPlansCoverageDateArray.length) {
                            finalCoverageDateObj = continuousPlansCoverageDateArray.find(
                                (coverageDate) => coverageDate && coverageDate.productId === product.product.id,
                            );
                            effectiveStartingDate = this.dateTransform(
                                finalCoverageDateObj &&
                                    finalCoverageDateObj.coverageStart &&
                                    this.dateService.isBefore(
                                        this.dateService.toDate(finalCoverageDateObj.coverageStart),
                                        this.dateService.toDate(finalCoverageDate),
                                    )
                                    ? finalCoverageDateObj.coverageStart
                                    : finalCoverageDate,
                            );
                        }
                    } else {
                        if (continuousPlansCoverageDateArray.length) {
                            coverageStartDate = continuousPlansCoverageDateArray.find(
                                (coverageDate) => coverageDate && coverageDate.productId === product.product.id,
                            ).coverageStart;
                        }
                        effectiveStartingDate = this.dateTransform(coverageStartDate);
                    }

                    const singleProductPlanData: ProductOfferingPanel = productPlanData.find(
                        (planProduct) => planProduct.product.id === product.product.id,
                    );

                    if (
                        singleProductPlanData &&
                        singleProductPlanData.coverageDate &&
                        effectiveStartingDate &&
                        singleProductPlanData.coverageDate > effectiveStartingDate
                    ) {
                        effectiveStartingDate = singleProductPlanData.coverageDate;
                    }

                    const minTPICalendarStartDate: string = effectiveStartingDate > nextDate ? effectiveStartingDate : nextDate;

                    if (product.tppSentCoverageDateAvailable) {
                        const tppStartingMinDate = this.dateTransform(this.tpiSsoDetail.coverageStartDate);
                        newTPIStartDate = tppStartingMinDate < effectiveStartingDate ? effectiveStartingDate : tppStartingMinDate;
                    } else {
                        newTPIStartDate = minTPICalendarStartDate;
                    }
                    const minTPIDate: string = newTPIStartDate > nextDate ? newTPIStartDate : nextDate;
                    if (this.isAgentAssisted) {
                        product.coverageDate = minTPIDate;
                        product.minCoverageDate = minTPICalendarStartDate;
                        product.maxCoverageDate = this.dateTransform(this.dateService.addDays(new Date(), this.maxDays));
                        product.maxDays = this.maxDays;
                    }
                    product.tppSelfServiceCoverageStartDate = minTPIDate;
                    if (singleProductPlanData && singleProductPlanData.inCart) {
                        const planOfferingPanel = singleProductPlanData.planOfferings.find(
                            (planOffering) => planOffering.autoEnroll && planOffering.inCart,
                        );
                        if (planOfferingPanel && planOfferingPanel.cartItem && planOfferingPanel.cartItem.coverageEffectiveDate) {
                            product.tppSelfServiceCoverageStartDate = planOfferingPanel.cartItem.coverageEffectiveDate;
                        }
                    }
                }
            });
        } else if (!this.isTpi && this.isAgentAssisted) {
            productOfferings.forEach((product) => {
                if (product.planOfferings.length) {
                    let minDate: string;
                    let maxDate: string;
                    const nextDate = this.dateTransform(this.dateService.addDays(new Date(), NEXT_DAY_INDEX));
                    const nextMaxDate = this.dateTransform(this.dateService.addDays(new Date(), this.maxDays));
                    const effectiveStartingDate = this.dateTransform(product.planOfferings[0].validity.effectiveStarting);
                    if (effectiveStartingDate > nextDate) {
                        minDate = effectiveStartingDate;
                        maxDate = this.dateTransform(this.dateService.addDays(this.getCoverageDate(product), this.maxDays));
                    } else {
                        minDate = nextDate;
                        maxDate = nextMaxDate;
                    }
                    product.coverageDate = minDate;
                    product.minCoverageDate = minDate;
                    product.maxCoverageDate = maxDate;
                }
            });
        }
        return this.isTpi ? productOfferings : productOfferings.filter((data) => data.planOfferings.length);
    }

    /**
     * Get child dependent's age as of today
     * @param { Date } birthDate dependent birth date
     * @returns dependent age in years
     */
    getChildDependentAge(birthDate: Date): number {
        return this.dateService.getDifferenceInYears(birthDate, new Date());
    }

    /**
     * Function to return date of birth of youngest child from member dependent
     * @returns { Date } date of birth of youngest one
     */
    getYoungestChildDateOfBirth(): Date {
        // retrieve the children dependent data from store
        const childDependentsData = this.store
            .selectSnapshot(EnrollmentState.GetMemberDependents)
            ?.filter((dependent) => dependent.dependentRelationId === DependentRelationsId.CHILD_ID);
        if (!childDependentsData?.length) {
            return null;
        }
        // sort the dates to return the latest birth date if there are multiple child exists
        return this.dateService.toDate(
            this.dateService.max(childDependentsData.map((childDependentData) => this.dateService.toDate(childDependentData.birthDate))),
        );
    }

    /**
     * Function to return the date object in "yyyy-mm-dd" format
     * @param {ProductOfferingPanel} productOffering
     * @returns Date
     */
    getCoverageDate(productOffering: ProductOfferingPanel): Date {
        return this.dateService.toDate(productOffering.planOfferings[0].validity.effectiveStarting);
    }

    getProductType(productOffering: ProductOfferingPanel): ProductType | undefined {
        if (EnrollmentConstants.productIds.HSA.some((x) => productOffering.product.id === x)) {
            return ProductType.HSA;
        }
        if (EnrollmentConstants.productIds.FSA.some((x) => productOffering.product.id === x)) {
            return ProductType.FSA;
        }
        if (EnrollmentConstants.productIds.MEDICAL.some((x) => productOffering.product.id === x)) {
            return ProductType.MEDICAL;
        }
        if (productOffering.planOfferings[0].plan.characteristics.findIndex((x) => x === Characteristics.STACKABLE) > -1) {
            return ProductType.STACKABLE;
        }
        if (EnrollmentConstants.productIds.AFLAC_PASS.some((x) => productOffering.product.id === x)) {
            return ProductType.AFLAC_PASS;
        }
        return undefined;
    }

    getProductId(id: any): void {
        this.productId = id;
        this.isShoppingOverview = false;
    }

    goToProductNav(): void {
        this.isShoppingOverview = false;
    }

    showShopOverview(val: boolean): void {
        this.showSpinner = false;
        this.isShoppingOverview = val;
        this.productId = 0;
    }

    /**
     * Get configuration for navbar type
     */
    getConfigurations(): void {
        this.staticUtilService
            .cacheConfigEnabled(this.names)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((enabled) => {
                this.store.dispatch(new SetNavBarType(enabled ? "wizard" : "al-la-carte"));
            });
    }
    /**
     * destroy life cycle hook of angular.
     */
    ngOnDestroy(): void {
        if (this.isTpi) {
            this.sharedService.changeTpi(false);
        }
        if (!this.isAgentAssisted && this.memberId && this.mpGroup) {
            this.shoppingService.releaseShoppingCartLock(this.memberId, this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.store.dispatch(new ResetProductPlanData());
        this.subscriptions.forEach((x) => x.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    openAlert(): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.shoppingExperience.exitTitle"],
            content: this.languageStrings["primary.portal.shoppingExperience.exitContent"],
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.brandingModalExit.buttonExit"],
                buttonAction: this.onAlertConfirm.bind(this, true),
                buttonClass: "mon-btn-primary",
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.brandingModalExit.buttonCancel"],
                buttonAction: this.onAlertConfirm.bind(this, false),
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }

    @HostListener("window:beforeunload")
    /* FIX ME: This always send false flag, because of that not able to exit shopping using exit button in header. */
    canDeactivate(): Observable<boolean> | boolean {
        this.allowNavigation$ = new Subject<boolean>();
        if (this.exitPopupStatus && !this.isTpi) {
            this.location.replaceState(this.router.url);
            this.openAlert();
            return this.allowNavigation$.asObservable();
        }
        this.allowNavigation$.next(true);
        this.allowNavigation$.complete();
        return true;
    }

    onAlertConfirm(flag: boolean): void {
        this.allowNavigation$.next(flag);
        this.allowNavigation$.complete();
        if (flag) {
            this.store.dispatch(new SetExitPopupStatus(false));
        }
    }

    goToPrevTab(): void {
        this.memberService.wizardCurrentTab$.next(
            this.memberService.getMemberWizardTabMenu().findIndex((x) => x.label === this.prevTab.label),
        );
        this.router.navigate(["./member/" + this.prevTab.link]);
    }
    /**
     * Get member data and member's pay frequency
     * @param memberId member id to get pay frequency
     * @param mpGroup mpGroup id
     */
    getMemberPayFrequency(memberId: number, mpGroup: any): void {
        this.memberService
            .getMember(memberId, true, mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (result) => {
                    if (result.body.name) {
                        this.store.dispatch(new SetMemberName(`${result.body.name.firstName} ${result.body.name.lastName}`));
                    }
                    if (result.body.workInformation.payrollFrequencyId) {
                        this.payFrequncyId = result.body.workInformation.payrollFrequencyId;
                        if (this.payFrequncyId) {
                            this.accountService
                                .getPayFrequencies()
                                .pipe(takeUntil(this.unsubscribe$))
                                .subscribe((data) => {
                                    this.payFrequency = data.find((payfrequncy) => payfrequncy.id === this.payFrequncyId);
                                    this.store.dispatch(new SetPayFrequency(this.payFrequency));
                                });
                        }
                    }
                },
                (error) => {
                    this.showErrorMessage = true;
                    this.store.dispatch(new SetErrorForShop(error.error));
                    this.showErrorAlertMessage(error);
                    this.showSpinner = false;
                },
            );
    }

    /**
     * Get member dependents and their contact information
     */
    getMemberDependents(): void {
        this.memberService
            .getMemberDependents(this.memberId, false, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    if (response) {
                        this.store.dispatch(new SetMemberDependents(response));
                    }
                },
                (error) => {
                    this.store.dispatch(new SetErrorForShop(error.error));
                    this.showErrorAlertMessage(error);
                    this.showErrorMessage = true;
                },
            );
    }

    getMemberBeneficiaries(): void {
        this.memberService
            .getMemberBeneficiaries(this.memberId, this.mpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response) {
                    this.store.dispatch(new SetMemberBeneficiaries(response));
                }
            });
    }

    exitShop(): void {
        this.exitPopupStatus = true;
        this.store.dispatch(new SetExitPopupStatus(true));
        this.router.navigate(["member/home"]);
    }

    /**
     * Open Offer listing popup
     */
    openOfferingListPopup(): void {
        this.dialog.open(OfferingListPopupComponent, {
            data: {
                mpGroup: this.mpGroup,
                memberId: this.memberId,
                filter: false,
                product: null,
                flexDollars: this.flexDollars,
            },
            width: "800px",
        });
    }

    displayCompanyProvidedProductsDetails(productOfferings: ProductOfferingPanel[]): void {
        const companyProductNames = [];
        const companyPlanIds = [];
        productOfferings.forEach((productOfr) => {
            if (
                productOfr.planOfferings &&
                productOfr.planOfferings.length &&
                productOfr.planOfferings.some((planOfr) => {
                    if (this.isCompanyProvidedPlan(planOfr)) {
                        companyPlanIds.push(planOfr.id);
                        return true;
                    }
                    return undefined;
                })
            ) {
                companyProductNames.push(productOfr.product.name);
            }
        });
        this.store.dispatch(new SetCompanyProductsDisplayed(true));
        if (companyProductNames.length && !this.ssoAuthData.productId) {
            const dialogRef = this.dialog.open(CompanyProvidedProductsDialogComponent, {
                data: {
                    products: companyProductNames,
                },
                width: "600px",
            });
            dialogRef
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp) => {
                    if (resp === "save") {
                        this.updateCompanyProvidedCartItems(companyPlanIds);
                    }
                });
        }
    }
    /**
     * Method to update cart items for company provided plans
     * @param companyPlanIds : Company provided plan ids
     */
    updateCompanyProvidedCartItems(companyPlanIds: number[]): void {
        this.showSpinner = true;
        this.shoppingService
            .getCartItems(this.memberId, this.mpGroup, "", this.isTpi ? [] : this.planYearId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.cartItems = response;
                    const cartList = [];
                    if (this.cartItems && this.cartItems.length) {
                        this.cartItems.forEach((item) => {
                            if (companyPlanIds.indexOf(item.planOfferingId) > -1) {
                                cartList.push(item);
                            }
                        });
                    }
                    if (cartList.length) {
                        of(cartList)
                            .pipe(
                                mergeMap((cartItem) => cartItem),
                                map((item) => this.updateCartItem(item)),
                                finalize(() => {
                                    this.showSpinner = false;
                                }),
                                takeUntil(this.unsubscribe$),
                            )
                            .subscribe();
                    } else {
                        this.showSpinner = false;
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            );
    }

    /**
     * Function to update the plan in cart
     * @param {GetCartItems} cartItem
     */
    updateCartItem(cartItem: GetCartItems): void {
        let cartObject: AddCartItem = { ...cartItem, acknowledged: true, enrollmentMethod: this.method };
        if (this.isAgentAssisted) {
            cartObject = { ...cartObject, assistingAdminId: this.tpiProducerId };
        }
        delete cartObject["id"];
        this.shoppingService
            .updateCartItem(this.memberId, this.mpGroup, cartItem.id, cartObject)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    isCompanyProvidedPlan(planOfr: PlanOfferingPanel): boolean {
        return planOfr.plan.characteristics.indexOf(Characteristics.COMPANY_PROVIDED) > -1;
    }
    /**
     * showErrorAlertMessage : Function to display error messages based on the error object.
     * @param err : Error
     */
    showErrorAlertMessage(err: Error): void {
        this.showSpinner = false;
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS]) {
            if (error[this.DETAILS].length > 0) {
                this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                    `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
                );
            }
        } else if (error.code === ClientErrorResponseType.DUPLICATE) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}`,
            );
        } else if (error.status && error.code) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue("secondary.api.400.invalid");
        }
        this.errorMessage$.pipe(takeUntil(this.unsubscribe$)).subscribe((errorMessage) => {
            const apiErrorObject = this.store.selectSnapshot(EnrollmentState.GetApiError);
            if (
                apiErrorObject.errorKey === INVALID_ENROLLMENT_STATE_PRODUCER_ERROR_KEY ||
                apiErrorObject.errorKey === INVALID_ENROLLMENT_STATE_MEMBER_ERROR_KEY
            ) {
                this.invalidEnrollmentStateErrorMessage = this.languageStrings["primary.portal.assist.enrollment"]
                    .replace("##producerFName##", this.primaryProducerInfo.name.firstName)
                    .replace("##producerLName##", this.primaryProducerInfo.name.lastName)
                    .replace("##phoneNumber##", this.primaryProducerInfo.phoneNumber)
                    .replace("##emailAddress##", this.primaryProducerInfo.emailAddress);
            } else if (apiErrorObject?.errorKey === BENEFIT_OFFERING_ERROR) {
                this.errorMessage = "";
                this.showErrorMessage = false;
            } else {
                if (errorMessage?.errorKey && apiErrorObject?.errorKey && errorMessage.errorKey === apiErrorObject.errorKey) {
                    this.errorMessage = errorMessage.value;
                }
            }
        });
    }

    /**
     * Function triggered on click of 'Exit' button
     */
    onExit(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            memberId: this.memberId,
            groupId: this.mpGroup,
            ssoToShop: this.isSsoToShop,
        };
        dialogConfig.data = modalData;
        this.empoweredModalService.openDialog(ExitPopupModalComponent, dialogConfig);
    }

    /**
     * Function triggered when the user changes product from the dropdown
     */
    onSelectionChange(): void {
        this.productId = this.selectedProductControl.value.id;
        this.isShoppingOverview = false;
    }

    /**
     * Function to navigate user to Shop Review Screen
     */
    navigateToReviewPage(): void {
        this.isReviewPage = true;
    }

    /**
     * Function to navigate user back to product page from Shop Review screen
     */
    onBack(): void {
        this.isReviewPage = false;
    }

    /**
     * Function to return date in "yyyy/mm/dd" format
     * @param {(Date | string)} dateValue
     * @returns {string}
     */
    dateTransform(dateValue: Date | string): string {
        return this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_YYYY_MM_DD);
    }

    /**
     * Function to return the date object in "yyyy-mm-dd" format
     * @param date Coverage Date sent by TPP in URL
     * @returns the date object in "yyyy-mm-dd" format
     */
    getTppCoverageDate(date: string): Date {
        return this.dateService.toDate(date);
    }

    /**
     * Function to fetch job class
     */
    fetchJobClass(): void {
        this.showSpinner = true;
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        iif(
            () => this.mpGroup.toString() === this.store.selectSnapshot(AccountInfoState.getMpGroupId),
            this.store.select(AccountInfoState.getAccountInfo),
            this.accountService.getAccount(this.mpGroup.toString()),
        )
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((account) => (this.accountInfo = account)),
                filter((account) => account && (account.ratingCode === RatingCode.STANDARD || account.ratingCode === RatingCode.PEO)),
                switchMap((account) => {
                    if (account.ratingCode === RatingCode.STANDARD) {
                        return forkJoin([
                            this.accountProfileService.getAccountCarrierRiskClasses(CarrierId.AFLAC, this.mpGroup),
                            this.accountService.getGroupAttributesByName([INDUSTRY_CODE], this.mpGroup),
                        ]).pipe(
                            filter(([riskClasses, groupAttributes]) => riskClasses && groupAttributes && !!groupAttributes[0]),
                            tap(([resp, res]) => {
                                this.setRiskClassId(resp, res[0].value);
                            }),
                        );
                    }
                    if (account.ratingCode === RatingCode.PEO) {
                        return forkJoin([
                            this.memberService.getMemberCarrierRiskClasses(this.memberId, CarrierId.AFLAC, this.mpGroup.toString()),
                            this.memberService.getMemberCarrierRiskClasses(this.memberId, null, this.mpGroup.toString()),
                        ]).pipe(
                            filter(([resp, res]) => resp && res && !!res[0]),
                            tap(([resp, res]) => {
                                this.setRiskClassId(resp, res[0].name);
                            }),
                        );
                    }
                    return of(EMPTY);
                }),
                finalize(() => {
                    this.showSpinner = false;
                }),
            )
            .subscribe();
    }

    /**
     * Function to set covergae Start Date for Post Tax plans
     * @param planOfferings {PlanOfferingPanel[]}
     * @param productPlan {ProductOfferingPanel}
     * @returns {ContinuousCoverageDate[]}
     */
    setCoverageStartFunction(planOfferings: PlanOfferingPanel[], productPlan: ProductOfferingPanel): ContinuousCoverageDate {
        const coverageStart: PlanOfferingPanel = planOfferings.find((plan) =>
            // eslint-disable-next-line no-prototype-builtins
            !plan.hasOwnProperty("coverageStartFunction")
                ? plan.plan.productId === productPlan.product.id
                : // eslint-disable-next-line no-prototype-builtins
                plan.plan.productId === productPlan.product.id && plan.hasOwnProperty("coverageStartFunction"),
        );

        if (coverageStart) {
            return {
                coverageStart:
                    coverageStart.coverageStartFunction && coverageStart.taxStatus !== TaxStatus.VARIABLE
                        ? this.quoteShopHelperService.calculateCoverageDateFunction(coverageStart.coverageStartFunction)
                        : coverageStart.validity.effectiveStarting,
                productId: productPlan.product.id,
            };
        }
        return {
            coverageStart: "",
            productId: -1,
        };
    }

    /**
     * Function to set Risk Class Id
     * @param riskClasses {RiskClass[]}
     * @param riskClassName {string}
     */
    setRiskClassId(riskClasses: RiskClass[], riskClassName: string): void {
        const defaultJobClass = riskClasses.find((jobClass) => jobClass.name === riskClassName);
        if (defaultJobClass) {
            this.store.dispatch(new SetRiskClassId(defaultJobClass.id));
        }
    }
}
