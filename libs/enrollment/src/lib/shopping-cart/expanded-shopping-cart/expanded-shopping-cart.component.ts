import { Component, OnInit, EventEmitter, Output, Inject, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import {
    ShoppingCartDisplayService,
    ShoppingService,
    CoreService,
    CartItemView,
    AccountService,
    BenefitsOfferingService,
    MemberService,
    DeclinedProducts,
    ApprovalRequestStatus,
    EnrollmentService,
    EnrollmentStatusType,
    SystemFlowCode,
    AccountDetails,
    FormType,
    StaticService,
    CommonService,
    MemberIdentifier,
    DependentContact,
} from "@empowered/api";
import { Subscription, Observable, forkJoin, iif, combineLatest, Subject, of, EMPTY } from "rxjs";
import { switchMap, filter, tap, mergeMap, map, takeUntil, catchError, finalize, first, take } from "rxjs/operators";
import { Router } from "@angular/router";
import { Store, Select } from "@ngxs/store";
import {
    CensusManualEntryComponent,
    PayrollFrequencyCalculatorPipe,
    AddressMatchingPromptComponent,
    DependentAddressUpdateModalComponent,
} from "@empowered/ui";
import { OverlayRef } from "@angular/cdk/overlay";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DatePipe } from "@angular/common";

import {
    ShopCartService,
    EnrollmentState,
    SetNewProduct,
    RemoveStackablePlan,
    SetProductPlanOfferings,
    SetProductOfferingsOfId,
    CopyCartData,
    QuoteShopHelperService,
    AccountListState,
    AccountInfoState,
    DualPlanYearState,
    EnrollmentMethodState,
    SetPlanLevelFlexIncetives,
    EnrollmentMethodModel,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
    SetEnrollments,
} from "@empowered/ngxs-store";

import { UserService, UserState } from "@empowered/user";
import { RemoveCartItemComponent } from "../remove-cart-item/remove-cart-item.component";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { CONTAINER_DATA } from "../injector";
import { EmployeeRequiredInfoComponent } from "../employee-required-info/employee-required-info.component";
import { LanguageService } from "@empowered/language";
import { TotalCostDialogComponent } from "./total-cost-dialog/total-cost-dialog.component";
import { CreateShoppingCartQuoteComponent } from "../create-shopping-cart-quote/create-shopping-cart-quote.component";
import "../../../../../ui/src/lib/assets/js/prefs_aflac_eic.js";

import {
    PortalType,
    ConfigName,
    AddressConfig,
    CarrierId,
    EnrollmentStateModel,
    ApiError,
    PayFrequency,
    AccountProducer,
    UserPermissionList,
    AppSettings,
    AddressMatchModel,
    DualPlanYearSettings,
    EnrollmentMethod,
    Characteristics,
    RatingCode,
    ContactType,
    TaxStatus,
    CoverageLevel,
    PolicyOwnershipType,
    PlanOffering,
    ProductOffering,
    GetCartItems,
    MemberCredential,
    EnrollmentRider,
    Enrollments,
    PlanOfferingPricing,
    CorrespondenceType,
    MemberProfile,
    FlexDollarModel,
    PlanOfferingPanel,
    Accounts,
    MemberContact,
    MemberQualifyingEvent,
    PlanYear,
    ProductOfferingPanel,
    SYMBOLS,
    GroupAttributeEnum,
    StepType,
    ClientErrorResponseType,
    GroupAttribute,
    IndustryCodes,
    AsyncStatus,
    MemberDependent,
} from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { ShoppingCartsActions, ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { select } from "@ngrx/store";
import { MatSelectChange } from "@angular/material/select";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import { AddressMatchingService, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
// eslint-disable-next-line max-len
import { ProducerShopComponentStoreService } from "../../producer-shop/services/producer-shop-component-store/producer-shop-component-store.service";
/**
 * aflac_eic is referring to third party service reference so I marked it as any.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let aflac_eic: any;

const IS_IDV = "general.feature.identity_verification.enable";
const IS_PAYROLL_HEADSET_IDV = "portal.producer.identity_verification.payroll_headset_enrollment.enable";
const IS_PAYROLL_CALL_CENTER_IDV = "portal.producer.identity_verification.payroll_callcenter_enrollment.enable";
const IS_DIRECT_HEADSET_IDV = "portal.producer.identity_verification.direct.headset.enable";
const IS_DIRECT_CALL_CENTER_IDV = "portal.producer.identity_verification.direct.callcenter.enable";
const IS_COST_CURRENT_COVERAGE = "general.feature.enable.costAndCurrentCoverage";
const ALERT = "alert";
const MONTHLY = "MONTHLY";
const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";
const TRUE = "true";
const COMMA_KEYWORD = ",";
const TAG_NAME = "primary.portal.shoppingCart.enroll";
const TEN = 10;
const EMPLOYEE_ID = "EMPLOYEE_ID";
const POSTTAX_LANG = "primary.portal.quoteShop.postTax";
const PRETAX_LANG = "primary.portal.quoteShop.preTax";
const OCCUPATION_CLASS_A_ID = 2;

@Component({
    selector: "empowered-expanded-shopping-cart",
    templateUrl: "./expanded-shopping-cart.component.html",
    styleUrls: ["./expanded-shopping-cart.component.scss"],
})
export class ExpandedShoppingCartComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    private readonly allPlanNamesLoadedSubject$ = new Subject<void>();
    @ViewChild("userPrefs", { static: true }) userPrefs2: ElementRef;
    @ViewChild("aflac_eic_prefs", { static: true }) aflacEicPrefs: ElementRef;
    userPreference: string;
    aflacEicPreference: string;
    @Output() products = new EventEmitter<number>();
    @Select(EnrollmentState) enrollmentState$: Observable<EnrollmentStateModel>;
    memberId: number;
    mpGroup: number;
    cartItem = [];
    itemIdArray = [];
    coverageIdArray = [];
    eachItem;
    anually = false;
    payFrequencyForm: FormGroup;
    declinedProducts: DeclinedProducts[] = [];
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    totalCost;
    cartLoop: CartItemView[];

    planOfferingIdArray = [];
    payFrequencies: PayFrequency[];
    payFrequencyStore: PayFrequency;
    annualFlag = false;
    daysLeft: number;
    daysFlag = false;
    day: string;
    dateToday = new Date();
    productOfferingsInCart = [];
    productOfferingsDeclined = [];
    inCartProductStatus = {};
    inCartPlanStatus = {};
    declinedPlans = [{}];
    productOfferings = [];
    productOfferingsName = [];
    declinedProductName: DeclinedProducts[] = [];
    locked = false;
    isMember = false;
    portal = "";
    priceChanged = false;
    modified = false;
    cartFlag = false;
    pfType = "";
    removeDialogRef: MatDialogRef<RemoveCartItemComponent>;
    createQuoteDialog: MatDialogRef<CreateShoppingCartQuoteComponent>;

    emptyCartCost = 0;
    pfPipeObj = {
        payFrequencies: [],
        pfType: "",
        payrollsPerYear: 0,
    };
    shoppingCartResponse;
    cartCount = 0;
    enrollmentObj: EnrollmentMethodModel;
    sum = 0;
    enrollmentDaysStart;
    isCartOpen = false;
    overlayRef: OverlayRef;
    payFrequencyId: number;
    payFrequencyLoaded = false;
    multipleEnrollmentPeriod = [];
    isSpinnerLoading = false;
    memberStore: EnrollmentStateModel;
    memberInfo: MemberProfile;
    memberContactInfo: MemberContact;
    isGenericUser: boolean;
    canOnlyCreateTestMember: boolean;
    canCreateTestMember: boolean;
    canCreateMember: boolean;
    loggedInUserId: string;
    isProducer = true;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingCart.cart",
        "primary.portal.shoppingCart.email",
        "primary.portal.shoppingCart.printer",
        "primary.portal.shoppingCart.emptyCart",
        "primary.portal.common.remove",
        "primary.portal.shoppingCart.cartTotal",
        "primary.portal.shoppingCart.emailQuote",
        "primary.portal.shoppingCart.enroll",
        "primary.portal.shoppingCart.viewTotalCost",
        "primary.portal.shoppingCart.showCostCoverage",
        "primary.portal.quickQuote.generate",
        "primary.portal.shoppingCart.quoteSent",
        "primary.portal.shoppingCart.flexDiscountAmount",
        "primary.portal.expandedShoppingCart.employerContribution",
        "primary.portal.shoppingExperience.agentAssistanceInCart",
        "primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart",
        "primary.portal.shoppingExperience.benefitDollars",
        "primary.portal.census.manualEntry.addNewDepartmentId",
        "primary.portal.members.workLabel.select",
        "primary.portal.members.shoppingCart.coveragePeriod",
        "primary.portal.members.shoppingCart.coverageStarts",
        PRETAX_LANG,
        POSTTAX_LANG,
    ]);
    agentFirstName: string;
    agentEmail: string;
    agentNumber: string;
    agentDetails: string;
    agentLastName: string;
    isApproved = false;
    oldPlan: PlanOfferingPanel;
    oldProduct;
    oldProductCopy;
    productPlanOffering;
    allProducts: ProductOffering[];
    declinedCoverageLevelId = 2;
    memberConsent: boolean;
    isNotCompanyProvided = false;
    enrollments: Enrollments[] = [];
    isOpenEnrollment: boolean;
    isQLEPeriod: boolean;
    productOfferingsList: ProductOffering[];
    systemFlowCode: string;
    isIDV: boolean;
    isPayrollHeadsetIDV: boolean;
    isPayrollVirtualF2FIDV: boolean;
    isPayrollCallCenterIDV: boolean;
    isDirectHeadsetIDV: boolean;
    isDirectCallCenterIDV: boolean;
    isPayroll: boolean;
    isDirect: boolean;
    isCostAndCurrentCoverage: boolean;
    emailSent = false;
    monthlyPayrollsPeryear: number;
    existingCoverageAmount: number;
    accountInfo: AccountDetails | Accounts;
    AFLAC_PARTNER_ID = +AppSettings.PARTNER_ID;
    flexDollars: FlexDollarModel;
    totalFlexCost = 0;
    isBenefitDollarsConfigEnabled = false;
    memberWorkContact: MemberContact;
    isAgentSelfEnrollment$: Observable<boolean> = this.sharedService.checkAgentSelfEnrolled();
    carrierEligibility: boolean;
    carrierCreateQuoteResponse: (number | string)[] = [];
    cartItemsToUpdate: GetCartItems[];
    cartItemPlanIds: string[] = [];
    workStateAndZipRequired = false;
    aflacGroupId = CarrierId.AFLAC_GROUP;
    planYearId = undefined;
    isOrganizationFieldRequired = false;
    isEmployeeIdFieldRequired = false;
    customID: number;
    employeeId: string;
    currentQleId: number;
    apiErrorMessage = "";
    activeEmployee = true;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    @Select(EnrollmentState.GetIsOpenEnrollment) isOpenEnrollment$: Observable<boolean>;
    @Select(EnrollmentState.GetIsQLEPeriod) isQLEPeriod$: Observable<boolean>;
    private readonly accountRetrievedSubject$ = new Subject<void>();
    memberEnrollmentMethod: EnrollmentMethod;
    memberState: string;
    addressMatchConfig: boolean;
    isSSNMandatoryConfigEnabled: boolean;
    planOfferingsInCart: PlanOffering[] = [];
    planYearsData: PlanYear[];
    ssnConfirmationEnabled: boolean;
    isEBSPaymentConfigEnabled = false;
    isEBSIndicator = false;
    isCoverageBoldConfigEnabled = false;
    dependentAddressUpdateConfig: boolean;
    dependentList: MemberDependent[];
    private readonly riskClassesData$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedRiskClasses));
    private readonly accountRatingCode$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedRatingCode));
    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));
    isEmployerNameFieldEnabled = false;
    isEmployerNameFieldReadOnly = true;

    constructor(
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly accountService: AccountService,
        private readonly coreService: CoreService,
        private readonly shoppingService: ShoppingService,
        private readonly memberService: MemberService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly shopCartService: ShopCartService,
        private readonly dialog: MatDialog,
        private readonly user: UserService,
        private readonly route: Router,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        @Inject(CONTAINER_DATA) private readonly componentData: any,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly enrollmentService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
        private readonly appFlowService: AppFlowService,
        private readonly commonService: CommonService,
        private readonly addressMatchingService: AddressMatchingService,
        private readonly ngrxStore: NGRXStore,
        private readonly dateService: DateService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
    ) {
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.BENEFIT_DOLLARS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((enabled) => (this.isBenefitDollarsConfigEnabled = enabled));

        this.staticUtilService
            .cacheConfigEnabled(ConfigName.EBS_PAYMENT_FEATURE_ENABLE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((enabled) => (this.isEBSPaymentConfigEnabled = enabled));

        this.isOpenEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isOpenEnrollment = x));
        this.isQLEPeriod$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.isQLEPeriod = x));
        aflac_eic.initiate(null);
        this.staticUtilService
            .cacheConfigEnabled(AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependentAddressUpdateConfig) => (this.dependentAddressUpdateConfig = dependentAddressUpdateConfig));
    }
    /**
     * Angular life-cycle hook ngOnInit
     * Called on component initialization
     * Logged user id based on producer id
     * initialize canCreateMember based on permissions
     * initialize portal, enrollmentObj, isPayroll, isDirect, accountInfo
     * initialize systemFlowCode if isPayroll or isDirect is true
     * initialize memberId and mpGroup
     * initialize agent info details
     * Calling getLanguages api service for fetching content from language table
     * getting account producers, approval request and member work contact
     * initialize isGenericUser
     * getting member info
     * initialize daysFlag, multipleEnrollmentPeriod and daysLeft based on calling getPlanYears api service
     * initialize shopping cart, display Cart items, dependents and member enrollments
     * initialize employerContributionPlans
     */
    ngOnInit(): void {
        // logic to set default occupation class
        this.setDefaultOccupationClassA();
        this.staticService
            .getConfigurations(ConfigName.BENEFIT_DOLLARS + SYMBOLS.COMMA + ConfigName.EBS_PAYMENT_FEATURE_ENABLE)
            .pipe(
                tap((configs) => {
                    this.isBenefitDollarsConfigEnabled = Boolean(configs[0].value);
                    this.isEBSPaymentConfigEnabled = Boolean(configs[1].value);
                }),
                switchMap(() => this.getGroupAttributesByName()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.loggedInUserId = this.store.selectSnapshot(UserState).producerId;
        this.getPermissions();
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        this.isPayroll = this.route.url.includes(AppSettings.PAYROLL.toLocaleLowerCase());
        this.isDirect = this.route.url.includes(AppSettings.DIRECT.toLocaleLowerCase());
        this.accountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.SSN_CONFIRMATION_ENABLED)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((ssnConfirmationEnabled) => (this.ssnConfirmationEnabled = ssnConfirmationEnabled));
        if (!this.accountInfo) {
            this.getAccountInformation();
        }
        if (this.isPayroll || this.isDirect) {
            this.getConfig();
            this.getEnrollmentFlow();
        }
        this.getGroupDetail();
        this.getLanguage();
        if (this.portal === PortalType.PRODUCER) {
            this.getAccountProducers();
        }
        this.getApprovalRequest();
        this.getMemberWorkContact();
        this.isGenericUser = !this.memberId;
        this.getMemberInfo();
        this.cartLoop = [];
        this.getPlanYears();
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.shoppingCartDisplay();
        this.displayCartItems();
        this.getDependents();
        this.getMemberEnrollments();
        this.setEmployerContributionPlans();
        this.sharedService
            .isSSNRequiredForPartialCensus(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isSSNMandatoryConfigEnabled: boolean) => (this.isSSNMandatoryConfigEnabled = isSSNMandatoryConfigEnabled));
        this.sharedService
            .isEmployerNameFieldEnabled(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([isEmployerNameFieldEnabled, isEmployerNameFieldReadOnly]) => {
                this.isEmployerNameFieldEnabled = isEmployerNameFieldEnabled;
                this.isEmployerNameFieldReadOnly = isEmployerNameFieldReadOnly;
            });
    }

    /**
     * This method is used to set default occupation class as A when default rating is A
     * @returns void
     */
    setDefaultOccupationClassA(): void {
        combineLatest([this.riskClassesData$, this.accountRatingCode$])
            .pipe(
                tap(([riskClassesData, accountRatingCode]) => {
                    if (accountRatingCode?.status === AsyncStatus.SUCCEEDED) {
                        // Determine default occupation class for STANDARD and PEO class
                        if (accountRatingCode?.value === RatingCode.STANDARD || accountRatingCode?.value === RatingCode.PEO) {
                            if (riskClassesData?.status === AsyncStatus.SUCCEEDED) {
                                this.sharedService.setIsDefaultOccupationClassA(
                                    riskClassesData?.value[0]?.name === IndustryCodes.INDUSTRY_CODE_A,
                                );
                            }
                        } else if (accountRatingCode?.value === RatingCode.DUAL && riskClassesData?.status === AsyncStatus.SUCCEEDED) {
                            // Determine if default occupation class selected is A or not for DUAL account
                            // if both the Accident and STD has occupation class A then set default occupation class to A
                            // first set of data is for accident product and second set of data is for STD product
                            this.sharedService.setIsDefaultOccupationClassA(
                                riskClassesData?.value[0]?.name === IndustryCodes.INDUSTRY_CODE_A &&
                                    riskClassesData?.value[1]?.name === IndustryCodes.INDUSTRY_CODE_A,
                            );
                        }
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * to decide enrollment flow for the system per enrollment method in case of payroll and direct
     */
    getEnrollmentFlow(): void {
        if (this.isPayroll) {
            if (this.enrollmentObj) {
                switch (this.enrollmentObj.enrollmentMethod.toLocaleUpperCase()) {
                    case EnrollmentMethod.CALL_CENTER:
                        this.systemFlowCode = SystemFlowCode.CALL_CENTER_PAYROLL;
                        break;
                    case EnrollmentMethod.HEADSET:
                        this.systemFlowCode = SystemFlowCode.HEADSET_PAYROLL;
                        break;
                    case EnrollmentMethod.VIRTUAL_FACE_TO_FACE:
                        this.systemFlowCode = SystemFlowCode.VIRTUALF2F_PAYROLL;
                        break;
                    default:
                        this.systemFlowCode = "";
                        break;
                }
            }
        } else if (this.isDirect) {
            this.systemFlowCode =
                this.enrollmentObj && this.enrollmentObj.enrollmentMethod === AppSettings.CALL_CENTER.toLocaleUpperCase()
                    ? SystemFlowCode.CALL_CENTER_DIRECT
                    : SystemFlowCode.HEADSET_DIRECT;
        }
    }

    /**
     * get group id and member id per member portal or payroll account
     */
    getGroupDetail(): void {
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                this.memberId = credential.memberId;
                this.mpGroup = credential.groupId;
            });
        } else {
            // SPR:param name is change to memberId
            this.memberId =
                this.componentData.activatedRoute.snapshot.params.id || this.componentData.activatedRoute.snapshot.params.memberId;
            const mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
            if (mpGroupObj && this.route.url.indexOf("payroll") >= 0) {
                this.mpGroup = mpGroupObj.id;
            } else {
                this.mpGroup = this.componentData.mpGroup;
            }
        }
    }

    /**
     * to get language on group basis
     */
    getLanguage(): void {
        this.commonService
            .getLanguages(TAG_NAME, undefined, undefined, undefined, undefined, this.mpGroup?.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                const languageContent = response.find((lang) => lang.tagName === TAG_NAME);
                if (languageContent) {
                    this.languageStrings[languageContent.tagName] = languageContent.value;
                }
            });
    }

    /**
     * to get plan years
     */
    getPlanYears(): void {
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYearResponse: PlanYear[]) => {
                this.planYearsData = planYearResponse;
                if (planYearResponse.length) {
                    this.daysFlag = true;
                    if (planYearResponse.length > 1) {
                        planYearResponse.forEach((eachPlanYear) => {
                            this.multipleEnrollmentPeriod.push(eachPlanYear.enrollmentPeriod.expiresAfter);
                        });
                        const max = this.getMaximumDate(this.multipleEnrollmentPeriod);
                        this.daysLeft = this.datediff(
                            this.parseDate(this.datePipe.transform(this.dateToday, "yyyy-MM-dd")),
                            this.parseDate(max),
                        );
                    } else {
                        this.daysLeft = this.datediff(
                            this.parseDate(this.datePipe.transform(this.dateToday, "yyyy-MM-dd")),
                            this.parseDate(planYearResponse[0].enrollmentPeriod.expiresAfter),
                        );
                    }
                }
                if (this.daysLeft === 1) {
                    this.day = "day";
                } else {
                    this.day = "days";
                }
            });
    }

    /**
     * set Employer contribution plans
     */
    setEmployerContributionPlans(): void {
        this.staticUtilService
            .cacheConfigValue(ConfigName.EMPLOYER_CONTRIBUTION_PLANS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planIds) => {
                this.appFlowService.setEmployerContributionPlans([planIds]);
            });
    }

    /**
     * to get group attribute by name
     */
    getGroupAttributesByName(): Observable<boolean | GroupAttribute[] | MemberIdentifier[]> {
        const attributeNames = this.isEBSPaymentConfigEnabled
            ? [AppSettings.IS_DEPARTMENT_ID_REQUIRED, AppSettings.IS_EMPLOYEE_ID_REQUIRED, GroupAttributeEnum.EBS_INDICATOR]
            : [AppSettings.IS_DEPARTMENT_ID_REQUIRED, AppSettings.IS_EMPLOYEE_ID_REQUIRED];
        return this.accountService.getGroupAttributesByName(attributeNames, +this.mpGroup).pipe(
            tap((result) => {
                this.isOrganizationFieldRequired =
                    AppSettings.TRUE === result.find((x) => x.attribute === AppSettings.IS_DEPARTMENT_ID_REQUIRED)?.value;
                this.isEmployeeIdFieldRequired =
                    AppSettings.TRUE === result.find((x) => x.attribute === AppSettings.IS_EMPLOYEE_ID_REQUIRED)?.value;
                if (this.isEBSPaymentConfigEnabled) {
                    const ebsBoolIndicator = result.find((isEBS) => isEBS.attribute === GroupAttributeEnum.EBS_INDICATOR)?.value;
                    if (ebsBoolIndicator === "true") {
                        this.isEBSIndicator = true;
                    } else {
                        this.isEBSIndicator = false;
                    }
                } else {
                    this.isEBSIndicator = false;
                }
            }),
            switchMap(() => iif(() => this.isEmployeeIdFieldRequired, this.getMemberIdentifier(), of(false))),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Get account details and notify any listeners.
     */
    getAccountInformation(): void {
        this.accountService
            .getAccount()
            .pipe(
                tap((accountInfo) => {
                    this.accountInfo = accountInfo;
                    this.accountRetrievedSubject$.next();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to retrieve member identifier information
     * @returns observable of member identifier
     */
    getMemberIdentifier(): Observable<MemberIdentifier[]> {
        return this.memberService.getMemberIdentifierTypes().pipe(
            tap((data) => {
                const identifier = data.find((x) => x.type === EMPLOYEE_ID);
                if (identifier) {
                    this.customID = identifier.id;
                }
            }),
            switchMap(() =>
                this.memberService.getMemberIdentifier(this.memberId, this.customID, false, parseInt(this.mpGroup?.toString(), TEN)),
            ),
            filter(([memberIdentifier]) => !!memberIdentifier),
            tap(([memberIdentifier]) => (this.employeeId = memberIdentifier.value)),
        );
    }
    /**
     * Get member work contact information and check if it includes state and zip given at least
     * one plan in the cart requires them.
     */
    getMemberWorkContact(): void {
        this.memberService
            .getMemberContact(this.memberId, ContactType.WORK, this.mpGroup.toString())
            .pipe(
                tap((memberWorkContactResponse) => {
                    this.memberWorkContact = memberWorkContactResponse.body;
                }),
                // handle error (almost always 404) and still check the IDs of the plans in the cart
                catchError(() => of(null)),
                switchMap(() =>
                    combineLatest([
                        this.staticService.getConfigurations(AddressConfig.PLAN_IDS_REQUIRING_WORK_STATE_AND_ZIP, this.mpGroup),
                        // wait until all plans have been processed before checking
                        this.allPlanNamesLoadedSubject$.asObservable(),
                    ]).pipe(
                        // if there are items in the cart and no previous errors occur, loading spinner stops here
                        tap(([requiringPlanIdsResponse]) => {
                            this.workStateAndZipRequired = this.checkMemberWorkStateAndZipAndRequirements(
                                requiringPlanIdsResponse[0].value,
                            );
                        }),
                    ),
                ),
                first(),
                finalize(() => (this.isSpinnerLoading = false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * This method will fetch the config values to verify IDV.
     * @returns void
     */
    getConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(IS_IDV),
            this.staticUtilService.cacheConfigValue(IS_PAYROLL_HEADSET_IDV),
            this.staticUtilService.cacheConfigValue(IS_PAYROLL_CALL_CENTER_IDV),
            this.staticUtilService.cacheConfigValue(IS_DIRECT_HEADSET_IDV),
            this.staticUtilService.cacheConfigValue(IS_DIRECT_CALL_CENTER_IDV),
            this.staticUtilService.cacheConfigEnabled(IS_COST_CURRENT_COVERAGE),
            this.staticUtilService.cacheConfigValue(ConfigName.CARRIER_CREATE_QUOTE),
            this.staticUtilService.cacheConfigValue(ConfigName.PAYROLL_VIRTUAL_F2F_IDV),
        ])
            .pipe(takeUntil(this.unsubscribe$.asObservable()))
            .subscribe(
                ([
                    isIdentityVerification,
                    isPayrollHeadsetIDV,
                    isPayrollCallCenterIDV,
                    isDirectHeadsetIDV,
                    isDirectCallCenterIDV,
                    isCostAndCurrentCoverage,
                    carrierCreateQuote,
                    isPayrollVirtualF2FIDV,
                ]: [string, string, string, string, string, boolean, string, string]) => {
                    this.isIDV = isIdentityVerification && isIdentityVerification.toLowerCase() === AppSettings.TRUE.toLowerCase();
                    this.isPayrollHeadsetIDV = isPayrollHeadsetIDV && isPayrollHeadsetIDV.toLowerCase() === AppSettings.TRUE.toLowerCase();
                    this.isPayrollCallCenterIDV =
                        isPayrollCallCenterIDV && isPayrollCallCenterIDV.toLowerCase() === AppSettings.TRUE.toLowerCase();
                    this.isDirectHeadsetIDV = isDirectHeadsetIDV && isDirectHeadsetIDV.toLowerCase() === AppSettings.TRUE.toLowerCase();
                    this.isDirectCallCenterIDV =
                        isDirectCallCenterIDV && isDirectCallCenterIDV.toLowerCase() === AppSettings.TRUE.toLowerCase();
                    this.isCostAndCurrentCoverage = isCostAndCurrentCoverage;
                    this.carrierCreateQuoteResponse = carrierCreateQuote ? carrierCreateQuote.split(COMMA_KEYWORD) : [];
                    this.isPayrollVirtualF2FIDV = isPayrollVirtualF2FIDV && isPayrollVirtualF2FIDV.toLowerCase() === TRUE.toLowerCase();
                    if (
                        this.isIDV &&
                        ((this.isPayroll &&
                            this.sharedService.checkPayrollMethodAndIdv(
                                this.enrollmentObj.enrollmentMethod,
                                this.isPayrollHeadsetIDV,
                                this.isPayrollCallCenterIDV,
                                this.isPayrollVirtualF2FIDV,
                            )) ||
                            (this.isDirect &&
                                ((this.enrollmentObj.enrollmentMethod === AppSettings.HEADSET && this.isDirectHeadsetIDV) ||
                                    (this.enrollmentObj.enrollmentMethod === AppSettings.CALL_CENTER && this.isDirectCallCenterIDV))))
                    ) {
                        aflac_eic.initiate(null);
                    }
                },
            );
    }

    /**
     * To get member details and member contact data
     */
    getMemberInfo(): void {
        forkJoin([
            this.memberService.getMember(this.memberId, true, this.mpGroup?.toString()),
            this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup?.toString()),
        ])
            .pipe(
                switchMap(([info, contact]) => {
                    this.memberInfo = info.body;
                    this.memberContactInfo = contact.body;
                    const workInfo = this.memberInfo.workInformation;
                    if (workInfo && Object.keys(workInfo.termination).length) {
                        this.activeEmployee = !this.dateService.getIsAfterOrIsEqual(
                            this.dateService.toDate(workInfo.termination.terminationDate),
                        );
                    }
                    return this.accountService.getPayFrequencies(this.mpGroup.toString());
                }),
                tap((response) => {
                    if (response) {
                        this.getPayFrequency(response);
                    }
                }),
                catchError((error) => {
                    if (error.error) {
                        this.setErrorForShoppingCart(error.error);
                    }
                    this.isSpinnerLoading = false;
                    return of(null);
                }),
                filter(() => this.portal === PortalType.MEMBER),
                switchMap(() => this.getEnrollmentStoreData()),
                switchMap(() => this.appFlowService.isSelfServiceEnrollmentBanned(this.mpGroup)),
                filter((enrollmentBanned) => enrollmentBanned),
                switchMap(() => this.getAgentDetails()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * to get the permission for the user
     */
    getPermissions(): void {
        combineLatest([
            this.staticUtilService.hasPermission(UserPermissionList.CREATE_MEMBER),
            this.staticUtilService.hasPermission(UserPermissionList.CREATE_TEST_MEMBER),
            this.staticUtilService.cacheConfigEnabled(AddressConfig.VALIDATE_ADDRESS_MATCH),
            this.staticUtilService.cacheConfigEnabled(ConfigName.COVERAGE_DATE_BOLD_VISIBILITY_ENABLED),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([canCreateMember, createTestMember, matchAddress, coverageDateBoldConfig]) => {
                this.isCoverageBoldConfigEnabled = coverageDateBoldConfig;
                this.addressMatchConfig = matchAddress;
                if (canCreateMember) {
                    this.canCreateMember = true;
                    this.canCreateTestMember = createTestMember;
                    this.canOnlyCreateTestMember = false;
                } else {
                    this.canCreateMember = createTestMember;
                    this.canCreateTestMember = createTestMember;
                    this.canOnlyCreateTestMember = createTestMember;
                }
            });
    }

    /**
     * get shopping cart and flex dollar details
     * @returns void
     */
    shoppingCartDisplay(): void {
        forkJoin([
            this.isBenefitDollarsConfigEnabled
                ? this.shoppingCartDisplayService.getAppliedFlexDollarOrIncentivesForCart(this.memberId, this.mpGroup?.toString())
                : of(null as FlexDollarModel),
            this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.planYearId),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([flexDollars, shopCart]) => {
                    this.shoppingCartResponse = shopCart;
                    this.shoppingCartDisplayService.setShoppingCart(this.shoppingCartResponse);
                    this.productOfferingsInCart = shopCart.productOfferingsInCart;
                    this.cartCount = shopCart.productOfferingsInCart.length;
                    this.productOfferingsDeclined = shopCart.productOfferingsDeclined;
                    this.totalCost = shopCart.totalCost;
                    this.locked = shopCart.locked;
                    if (flexDollars && flexDollars.planFlexDollarOrIncentives && flexDollars.planFlexDollarOrIncentives.length) {
                        this.flexDollars = flexDollars;
                        this.store.dispatch(new SetPlanLevelFlexIncetives(flexDollars.planFlexDollarOrIncentives));
                        this.totalFlexCost = flexDollars.planFlexDollarOrIncentives
                            .map((x) => x.flexDollarOrIncentiveAmount)
                            .reduce((total, current) => total + current);
                    }
                },
                (error) => {
                    this.setErrorForShoppingCart(error.error);
                    this.cartCount = 0;
                },
            );
    }

    /**
     * Pay frequencies for the shopping cart dropdown
     * @param payFrequencyResponse Response from getPayFrequencies API call
     */
    getPayFrequency(payFrequencyResponse: PayFrequency[]): void {
        this.payFrequencyId = this.memberInfo.workInformation.payrollFrequencyId;
        this.payFrequencies = payFrequencyResponse.filter((item) => item.id === this.payFrequencyId || item.name === AppSettings.ANNUAL);
        this.pfPipeObj.payFrequencies = this.payFrequencies;
        const idx =
            this.payFrequencies.length === 1
                ? this.payFrequencies.length - 1
                : this.payFrequencies.findIndex((pf) => pf.name !== AppSettings.ANNUAL);
        if (idx > -1) {
            this.pfPipeObj.pfType = this.payFrequencies[idx].name;
            this.payFrequencyForm = this.fb.group({
                payFrequencyControl: [this.payFrequencies[idx].name.toString(), Validators.required],
            });
            this.pfPipeObj.pfType = this.payFrequencies[idx].name;
            this.pfPipeObj.payrollsPerYear = this.payFrequencies[idx].payrollsPerYear;
            this.pfPipeObj = this.utilService.copy(this.pfPipeObj);
            this.payFrequencyLoaded = true;
        }
        this.monthlyPayrollsPeryear = payFrequencyResponse.find((payFrq) => payFrq.frequencyType === MONTHLY).payrollsPerYear;
    }
    /**
     * Function used to get the cart items that is used to display in the shopping cart
     */
    displayCartItems(): void {
        this.isSpinnerLoading = true;
        this.cartLoop = [];
        this.cartItem = [];
        this.declinedProductName = [];
        this.shoppingService
            .getCartItems(this.memberId, this.mpGroup, "", this.planYearId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (cartItems) => {
                    this.cartItemsToUpdate = cartItems.filter((item) => item.applicationType !== StepType.REINSTATEMENT);
                    cartItems
                        .filter((item) => item.applicationType !== StepType.REINSTATEMENT)
                        .forEach((x) => {
                            if (x.coverageLevelId !== 2) {
                                this.cartItem.push(x);
                            }
                        });
                    this.getDeclinedProductOffering();
                    if (!this.cartItem.length) {
                        this.cartFlag = true;
                        this.isSpinnerLoading = false;
                    }
                    this.setCartDetails();
                    this.getDetailsForCart();
                },
                (error) => {
                    this.setErrorForShoppingCart(error.error);
                    this.cartCount = 0;
                    this.cartFlag = true;
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * Get declined products details.
     */
    getDeclinedProductOffering(): void {
        this.productOfferingsDeclined.forEach((declineId) => {
            this.shoppingService
                .getProductOffering(declineId, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((productOffering) => {
                    const productObject = {
                        productName: productOffering.product.name,
                        productOfferingId: declineId,
                    };
                    if (this.isMember) {
                        this.declinedProducts.push(productObject);
                    } else {
                        this.declinedProductName.push(productObject);
                    }
                });
        });
    }
    /**
     * set the cart items details by iterating through all items
     */
    setCartDetails(): void {
        this.cartItem.forEach((item) => {
            if (item.applicationType !== StepType.REINSTATEMENT) {
                this.coverageIdArray.push(item.coverageLevelId);
                this.planOfferingIdArray.push(item.planOfferingId);
                let cartLoopObject: CartItemView = {
                    id: item.id,
                    memberCost: item.memberCost,
                    totalCost: item.totalCost,
                    benefitAmount: item.benefitAmount,
                    coverageDateStarts: item.coverageEffectiveDate ? item.coverageEffectiveDate : item.coverageValidity.effectiveStarting,
                    coverageDateEnds: item.coverageValidity.expiresAfter,
                    planOfferingId: item.planOfferingId,
                    coverageLevelId: item.coverageLevelId,
                    baseCost: item.memberCost,
                };
                if (item.riders) {
                    cartLoopObject = {
                        ...cartLoopObject,
                        riders: item.riders.filter((rider) => rider.coverageLevelId !== this.declinedCoverageLevelId),
                    };
                }
                this.cartLoop.push({
                    ...cartLoopObject,
                });
            }
        });
    }
    /**
     * get details for cart items by making service calls and sort them.
     */
    getDetailsForCart(): void {
        const apiCalls = [];
        this.cartItem.forEach((item, i) => {
            if (item.applicationType !== StepType.REINSTATEMENT) {
                apiCalls.push(
                    this.getCoverageName(i).pipe(
                        switchMap(() => this.getPlanName(i)),
                        switchMap(() => this.getEmployerContribution(i)),
                        tap(() => {
                            if (this.cartItem[i].recentChange) {
                                this.priceChanged = true;
                                this.recentChangesCart(i);
                            }
                        }),
                        filter(() => Boolean(this.cartLoop[i].riders)),
                        switchMap(() => this.getRiderPlan(i)),
                    ),
                );
            }
        });
        if (apiCalls && apiCalls.length) {
            forkJoin(apiCalls)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    finalize(() => (this.isSpinnerLoading = false)),
                )
                .subscribe(() => {
                    if (this.cartLoop && this.cartLoop.length) {
                        this.cartLoop.sort((a, b) => a.productOfferingId - b.productOfferingId);
                    }
                });
        }
    }
    /**
     * to map the coverage level name to the cart loop elements
     * @param i cart item index
     * @returns Observable<CoverageLevel>
     */
    getCoverageName(i: number): Observable<CoverageLevel> {
        return this.coreService.getCoverageLevel(this.coverageIdArray[i]).pipe(
            tap((coverageLevel) => {
                this.cartLoop[i] = { ...this.cartLoop[i], coverageLevelName: coverageLevel.name };
            }),
        );
    }
    recentChangesCart(i: number): void {
        if (this.cartItem[i].recentChange) {
            this.cartLoop[i] = { ...this.cartLoop[i], recentChange: this.cartItem[i].recentChange };
        }
    }
    getDependents(): void {
        this.memberService
            .getMemberDependents(this.memberId, true, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependents) => (this.dependentList = dependents));
    }

    calculateCostOnFrequency(event: MatSelectChange): void {
        this.pfPipeObj.pfType = event.value;
        this.pfPipeObj = this.utilService.copy(this.pfPipeObj);
    }

    /**
     * get plan details for the cart item
     * @param i index of cart item
     * @return Observable<PlanOffering | ProductOffering>
     */
    getPlanName(i: number): Observable<PlanOffering | ProductOffering> {
        return this.shoppingService.getPlanOffering(this.planOfferingIdArray[i], this.mpGroup).pipe(
            tap((plan) => this.cartItemPlanIds.push(`${plan.plan.id}`)),
            switchMap((plan) =>
                this.shoppingService.getProductOffering(plan.productOfferingId, this.mpGroup).pipe(
                    tap((product) => {
                        this.planOfferingsInCart.push(plan);
                        this.updateCartLoopObject(i, plan, product);
                        if (plan.taxStatus === TaxStatus.POSTTAX) {
                            this.cartLoop[i] = {
                                ...this.cartLoop[i],
                                taxStatus: this.languageStrings[POSTTAX_LANG],
                            };
                        }
                        if (plan.taxStatus === TaxStatus.PRETAX) {
                            this.cartLoop[i] = {
                                ...this.cartLoop[i],
                                taxStatus: this.languageStrings[PRETAX_LANG],
                            };
                        }
                        if (plan.taxStatus === TaxStatus.VARIABLE) {
                            this.productInOpenEnrollment(plan);
                            if ((this.isOpenEnrollment && plan.planYearInOpenEnrollmentForVariableTax) || this.isQLEPeriod) {
                                this.cartLoop[i] = {
                                    ...this.cartLoop[i],
                                    taxStatus: this.languageStrings[PRETAX_LANG],
                                };
                            } else {
                                this.cartLoop[i] = {
                                    ...this.cartLoop[i],
                                    taxStatus: this.languageStrings[POSTTAX_LANG],
                                };
                            }
                        }
                        this.updateCartLoopPerCharacteristics(plan, i);
                        this.manageInCartPlans(i);
                    }),
                ),
            ),
            catchError((error) => {
                this.isSpinnerLoading = false;
                return of(error);
            }),
        );
    }

    /**
     * added function to set the variable tax plan tax status based on plans plan year is in open enrollment plan year
     */
    productInOpenEnrollment(plan: PlanOffering): void {
        if (
            plan.taxStatus === TaxStatus.VARIABLE &&
            plan.planYearId &&
            this.planYearsData.some((planYear) => planYear.id === plan.planYearId)
        ) {
            plan.planYearInOpenEnrollmentForVariableTax = true;
        } else {
            plan.planYearInOpenEnrollmentForVariableTax = false;
        }
    }
    /**
     * update cart loop object as per plan and product offering details
     * @param i: number
     * @param plan: PlanOffering
     * @param productOffering: ProductOffering
     */
    updateCartLoopObject(i: number, plan: PlanOffering, productOffering: ProductOffering): void {
        this.cartLoop[i] = {
            ...this.cartLoop[i],
            planName: plan.plan.name,
            productId: productOffering.product.id,
            productOfferingId: plan.productOfferingId,
            planOfferingId: plan.id,
            productName: productOffering.product.name,
            planId: plan.plan.id,
            displayOrder: productOffering.product.displayOrder,
            productImagePath: productOffering.product.iconSelectedLocation,
            carrierId: plan.plan.carrierId,
        };
    }

    /**
     * update cart loop items as per characteristics
     * @param plan plan details
     * @param i index of plan
     */
    updateCartLoopPerCharacteristics(plan: PlanOffering, i: number): void {
        if (!plan.plan.characteristics.length && !plan.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED)) {
            this.cartLoop[i] = { ...this.cartLoop[i], companyProvidedPlan: false };
        }
        if (plan.plan.characteristics.length && plan.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED)) {
            this.cartLoop[i] = { ...this.cartLoop[i], companyProvidedPlan: true };
        }
    }
    /**
     * manage plan details for cart items
     * @param i index of cart items
     */
    manageInCartPlans(i: number): void {
        if (this.flexDollars) {
            const planFlexDollars = this.flexDollars.planFlexDollarOrIncentives.filter(
                (flex) =>
                    flex.cartItemId === this.cartLoop[i].id &&
                    (this.cartLoop[i].memberCost === 0 || flex.flexDollarOrIncentiveAmount !== 0),
            );
            if (planFlexDollars.length) {
                const flexDollars = planFlexDollars.map((obj) => {
                    const flexDollar = { ...obj };
                    flexDollar.flexDollarOrIncentiveName = flexDollar.flexDollarOrIncentiveName
                        .toLowerCase()
                        .includes(this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"].toLowerCase())
                        ? this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"]
                        : flexDollar.flexDollarOrIncentiveName;
                    return flexDollar;
                });
                const flexCost = flexDollars.map((flex) => flex.flexDollarOrIncentiveAmount).reduce((a, b) => a + b);
                this.cartLoop[i] = {
                    ...this.cartLoop[i],
                    flexDollars: flexDollars,
                    memberCost: this.cartLoop[i].memberCost + flexCost,
                    totalCost: this.cartLoop[i].totalCost + flexCost,
                };
            }
        }
        this.carrierEligibility = this.cartLoop.some((item) => !!this.carrierCreateQuoteResponse.find((id) => +id === item.carrierId));
        if (i === this.cartItem.length - 1) {
            this.allPlanNamesLoadedSubject$.next();
        }
        this.isNotCompanyProvided = this.cartLoop.some((planInCart) => !planInCart.companyProvidedPlan);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    distinct(items: any, mapper: any): any {
        if (!mapper) {
            mapper = (item) => item;
        }
        return items.map(mapper).reduce((acc, item) => {
            if (acc.indexOf(item) === -1) {
                acc.push(item);
            }
            return acc;
        }, []);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseDate(dateParse: any): any {
        dateParse = dateParse + "";
        const dateParsed = dateParse.split("-");
        return new Date(dateParsed[0], dateParsed[1] - 1, dateParsed[2]);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datediff(dateToday: any, expiresOn: any): number {
        const daysRemaining = Math.round((expiresOn - dateToday) / (1000 * 60 * 60 * 24));
        return daysRemaining + 1;
    }
    /**
     *
     * @description opens quasi modal with quote of the items present in cart
     * @memberof ExpandedShoppingCartComponent
     */
    onEmailQuote(): void {
        this.emailSent = false;
        this.createQuoteDialog = this.dialog.open(CreateShoppingCartQuoteComponent, {
            backdropClass: "backdrop-blur",
            minWidth: "100%",
            height: "100%",
            panelClass: "create-quote",
            data: {
                planSelection: this.cartLoop.filter((item) => this.carrierCreateQuoteResponse.find((id) => +id === item.carrierId)),
                memberId: this.memberId,
                mpGroup: this.mpGroup,
                state: this.enrollmentObj.enrollmentStateAbbreviation,
                payFrequency: this.componentData.payFrequency,
                stateName: this.enrollmentObj.enrollmentState,
            },
        });

        this.createQuoteDialog
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((afterClose) => {
                if (afterClose.type === ALERT) {
                    this.emailSent = true;
                }
            });
    }
    emptyCart(): boolean {
        if (this.productOfferingsInCart.length === 0) {
            return true;
        }
        return false;
    }

    /**
     * @function editPlanAsProducer
     * @description Handles specific logic for when on producer shop (as not a member)
     * @param {CartItemView} cartLoopItem
     * @memberof ExpandedShoppingCartComponent
     */
    editPlanAsProducer(cartLoopItem: CartItemView): void {
        // Handle old producer shop page

        // Get ProductOfferingPanel index based on selected CartItemView
        const productIndex = this.store
            .selectSnapshot(EnrollmentState.GetProductPlanData)
            .findIndex((product) => product.id === cartLoopItem.productOfferingId);

        // ProductOfferingPanels / NGXS state will not exist for NGRX / new producer shop
        // So only try updating old producer shop page state if NGXS state exists
        if (productIndex !== -1) {
            // Get Plan Offerings from NGXS state
            const productOfferingPanel = this.store.selectSnapshot(EnrollmentState.GetProductPlanData)[productIndex];

            const planIndex = productOfferingPanel.planOfferings.findIndex((plan) => plan.cartItem && plan.cartItem.id === cartLoopItem.id);

            this.quoteShopHelperService.changeSelectedProductOfferingIndex(productIndex);
            this.quoteShopHelperService.changeSelectedPlanIndex(planIndex);
        }

        // Handle new producer shop page
        this.setSelectedCartDataToNgrxStore(cartLoopItem);
    }

    /**
     * @function editPlan
     * @description To edit the plan in cart
     * @param {CartItemView} cartLoopItem
     * @memberof ExpandedShoppingCartComponent
     */
    editPlan(cartLoopItem: CartItemView): void {
        if (this.isMember) {
            const editPlan = {
                editProductId: cartLoopItem.productOfferingId,
                editPlanId: cartLoopItem.planOfferingId,
                cartItemId: cartLoopItem.id,
                isCloseOverlay: true,
            };
            this.shopCartService.changeEditPlan(JSON.parse(JSON.stringify(editPlan)));
        } else if (!this.isMember) {
            this.editPlanAsProducer(cartLoopItem);
        }
        this.shopCartService.closeExpandedOverlayCart({
            isCloseOverlay: true,
        });
        this.shopCartService.changeHighlightedOverlay({
            isCartOpen: false,
        });
    }

    /**
     * sets selected cart, plan and product id's to store
     * @param cartLoopItem CartItemView data
     */
    setSelectedCartDataToNgrxStore(cartLoopItem: CartItemView): void {
        this.ngrxStore.dispatch(
            GlobalActions.setSelectedCartItemIdentifiers({
                cartItemId: cartLoopItem.id,
                planOfferingId: cartLoopItem.planOfferingId,
                planId: cartLoopItem.planId,
                productId: cartLoopItem.productId,
            }),
        );
    }
    declinedOrNot(): boolean {
        if (this.productOfferingsDeclined.length === 0) {
            return false;
        }
        return true;
    }

    /**
     * Updates shopping cart data on delete cart item success
     *
     * @param deletedCartItemId number - deleted cart item id
     * @returns {Observable<number>} - Observable emits when CartItem has been deleted successfully
     */
    updateProducerShoppingCart(deletedCartItemId: number): Observable<number> {
        if (this.portal !== AppSettings.PORTAL_PRODUCER) {
            return of(null);
        }
        return this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.deletedCartItem)).pipe(
            tap(() => {
                const index = this.cartLoop.findIndex((x) => x.id === deletedCartItemId);
                this.updateShoppingCartDisplay(index);
            }),
        );
    }

    /**
     * Updates shopping cart display
     * @param index Index of cart item to be removed in cartLoop array
     */
    updateShoppingCartDisplay(index: number): void {
        if (index !== -1) {
            this.cartLoop.splice(index, 1);
            this.shoppingCartDisplay();
            this.productOfferingsDeclined = [];
            this.shopCartService.changeHighlightedOverlay({
                isCartOpen: false,
            });
        }
        if (!this.cartLoop.length) {
            this.cartFlag = true;
        }
        this.carrierEligibility = this.cartLoop.some((item) => !!this.carrierCreateQuoteResponse.find((id) => +id === item.carrierId));
    }

    /**
     * Updates cart details for ngxs store
     * @param itemId Cart item id of removed item from cart
     * @param planId Plan Id of the plan to be removed
     * @param productId Product Id of the plan to be removed
     * @returns {Observable<GetCartItems[]>} Observable containing rest of the cart items after removal
     */
    updateCartDetailsForNGXSStore(itemId: number, planId: number, productId: number): Observable<GetCartItems[]> {
        return this.shoppingService.deleteCartItem(this.memberId, itemId, this.mpGroup).pipe(
            switchMap((_) =>
                this.shoppingService.getCartItems(this.memberId, this.mpGroup, "", this.planYearId).pipe(
                    tap((cartItems) => {
                        const index = this.cartLoop.findIndex((x) => x.id === itemId);
                        if (index !== -1) {
                            this.setPlanProductData(planId, productId, itemId);
                            this.setIfStackable(itemId, cartItems);
                        }
                        this.updateShoppingCartDisplay(index);
                    }),
                ),
            ),
        );
    }

    /**
     * Updates cart details in ngrx store
     * @param itemId cart item id for removed item
     * @returns {Observable<number>} observable containing item Id after successful removal of cart item
     */
    updateCartDetailsForNGRXStore(itemId: number): Observable<number> {
        this.ngrxStore.dispatch(
            ShoppingCartsActions.deleteCartItem({
                // We must cast to Number since memberId can be a string when it comes from query params
                memberId: Number(this.memberId),
                mpGroup: Number(this.mpGroup),
                cartItemId: itemId,
            }),
        );

        return this.updateProducerShoppingCart(itemId);
    }

    /**
     * Function to open remove cart dialog and remove the plan from cart
     * @param itemId Item Id of the plan to be removed
     * @param plan Name of the plan to be removed
     * @param planId Plan Id of the plan to be removed
     * @param productId Product Id of the plan to be removed
     */
    removePlan(itemId: number, plan: string, planId: number, productId: number): void {
        this.removeDialogRef = this.empoweredModalService.openDialog(RemoveCartItemComponent, {
            data: { planName: plan },
        });
        this.removeDialogRef
            .afterClosed()
            .pipe(
                filter((afterCloseResult) => afterCloseResult.type === "Remove"),
                switchMap(() => {
                    if (this.portal === AppSettings.PORTAL_PRODUCER) {
                        // to update ngrx store only when we are on new shop page
                        if (this.ngrxStore.ngrxStateHasSelectedMemberId()) {
                            return this.updateCartDetailsForNGRXStore(itemId);
                        } else {
                            return this.updateCartDetailsForNGXSStore(itemId, planId, productId);
                        }
                    }

                    return this.shoppingService.deleteCartItem(this.memberId, itemId, this.mpGroup).pipe(
                        tap(() => {
                            const index = this.cartLoop.findIndex((x) => x.id === itemId);
                            if (index !== -1) {
                                const oldProduct = this.store
                                    .selectSnapshot(EnrollmentState.GetProductOfferings)
                                    .find((product) => product.id === productId);
                                const oldProductCopy: ProductOfferingPanel = this.utilService.copy(oldProduct);
                                const productPlanOffering = oldProductCopy.planOfferings;
                                oldProductCopy.inCart = false;
                                productPlanOffering.find((planOffering) => planOffering.id === planId).inCart = false;
                                this.cartLoop.splice(index, 1);
                                this.shoppingCartDisplay();
                                this.productOfferingsDeclined = [];
                                this.store.dispatch(new SetProductOfferingsOfId(oldProductCopy));
                                this.store.dispatch(new SetProductPlanOfferings(oldProduct.id, productPlanOffering));
                                this.shopCartService.closeExpandedOverlayCart({
                                    isCloseOverlay: true,
                                });
                                this.shopCartService.changeHighlightedOverlay({
                                    isCartOpen: false,
                                });
                            }
                            if (!this.cartLoop.length) {
                                this.cartFlag = true;
                            }
                        }),
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * @description sets the product and plan data.
     * @param planId {number} the id of the plan
     * @param productId {number} the id of the product
     * @param itemId {number} the id of item in cart
     */
    setPlanProductData(planId?: number, productId?: number, itemId?: number): void {
        if (this.portal === AppSettings.PORTAL_PRODUCER) {
            this.oldProduct = this.store.selectSnapshot(EnrollmentState.GetProductPlanData).find((product) => product.id === productId);
            this.oldProductCopy = this.utilService.copy(this.oldProduct);
            if (this.oldProductCopy.planOfferings.some((planOffering) => planOffering.stackable)) {
                this.oldPlan = this.oldProductCopy.planOfferings.find(
                    (planOffering) => planOffering.id === planId && planOffering.cartItem && planOffering.cartItem.id === itemId,
                );
            } else {
                this.oldPlan = this.oldProductCopy.planOfferings.find(
                    (planOffering) =>
                        planOffering.id === planId &&
                        (!planOffering.reinstateEnded || !(planOffering.reistateEndedPlan && planOffering.enrollment)),
                );
            }
        } else if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.oldProduct = this.store.selectSnapshot(EnrollmentState.GetProductOfferings).find((product) => product.id === productId);
            this.oldProductCopy = this.utilService.copy(this.oldProduct);
            this.productPlanOffering = this.oldProductCopy.planOfferings;
        }
    }
    /**
     * Checks if the plan is stackable or not and updates the store with removed cart item
     *
     * @param itemId
     * @param cartItems
     */
    setIfStackable(itemId: number, cartItems: GetCartItems[]): void {
        const isEnrolledPlanInCart = this.oldPlan.stackable && this.oldPlan.inCart && this.oldPlan.enrollment;
        if (this.oldPlan.stackable && !isEnrolledPlanInCart) {
            this.store.dispatch(new RemoveStackablePlan(this.oldProduct.id, itemId, cartItems));
            this.quoteShopHelperService.changeSelectedPlanIndex(0);
        } else {
            this.oldPlan.inCart = false;
            this.oldPlan.cartItem = null;
            this.oldPlan.coverageLevel = null;
            this.oldPlan.planPricing = null;
            this.oldPlan.dataSource = null;
            this.oldPlan.ridersData = null;
            this.oldPlan.isBenefitAmountSection = false;
            this.oldPlan.isEliminationPeriodSection = false;
            this.oldPlan.riderTableData = null;
            this.oldProductCopy.inCart = false;
            this.oldPlan.editCoverage = false;
            this.store.dispatch(new SetNewProduct(this.oldProduct.id, this.oldProductCopy, this.oldPlan, cartItems));
        }
    }

    showPlans(): void {
        this.products.emit(2);
    }

    /**
     * to get data from enrollment store if member portal
     * @return Observable<EnrollmentStateModel>
     */
    getEnrollmentStoreData(): Observable<EnrollmentStateModel> {
        return this.enrollmentState$.pipe(
            tap((enrollmentDetail) => {
                if (enrollmentDetail) {
                    this.memberStore = enrollmentDetail;
                    this.memberEnrollmentMethod = enrollmentDetail.enrollmentMethod;
                    this.memberState = enrollmentDetail.enrollmentState;
                } else {
                    this.memberEnrollmentMethod = EnrollmentMethod.SELF_SERVICE;
                    this.memberState = this.memberContactInfo.address.state;
                }
            }),
        );
    }

    /**
     * Method to the plan data of the rider in the cart item
     * @param i index of the rider in cart item
     * @return Observable<PlanOffering[]>
     */
    getRiderPlan(i: number): Observable<PlanOffering[]> {
        let coverageEffectiveDate: string;
        this.coverageEffectiveDate$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => {
            coverageEffectiveDate = x?.toString();
        });
        this.isSpinnerLoading = true;
        const memberState: string = this.memberState || this.enrollmentObj.enrollmentStateAbbreviation;
        const enrollmentMethod: string = this.memberEnrollmentMethod || this.enrollmentObj.enrollmentMethod;
        return this.shoppingService
            .getPlanOfferingRiders(
                this.planOfferingIdArray[i],
                this.mpGroup,
                enrollmentMethod,
                memberState,
                this.memberId,
                coverageEffectiveDate,
            )
            .pipe(
                tap((planOfferingRiders) => {
                    const riderNameArray = [];
                    this.cartLoop[i].riders.forEach((rider) => {
                        if (rider.coverageLevelId !== this.declinedCoverageLevelId) {
                            const riderCost = rider.totalCost;
                            riderNameArray.push(planOfferingRiders.find((riderPlan) => riderPlan.id === rider.planOfferingId).plan.name);
                            if (this.cartLoop[i].riders.length) {
                                this.cartLoop[i] = {
                                    ...this.cartLoop[i],
                                    riderName: riderNameArray,
                                };
                                this.cartLoop[i] = {
                                    ...this.cartLoop[i],
                                    memberCost: this.cartLoop[i].memberCost + riderCost,
                                    totalCost: this.cartLoop[i].totalCost + riderCost,
                                };
                            }
                        }
                    });
                }),
            );
    }

    navigateDeclineProduct(productOffId: number): void {
        const productIndex = this.store
            .selectSnapshot(EnrollmentState.GetProductPlanData)
            .findIndex((product) => product.id === productOffId);
        this.quoteShopHelperService.changeSelectedProductOfferingIndex(productIndex);
        this.shopCartService.closeExpandedOverlayCart({
            isCloseOverlay: true,
        });
        this.shopCartService.changeHighlightedOverlay({
            isCartOpen: false,
        });
    }

    /**
     *
     *@description Returns employer contribution for a plan if present
     * @param i is the number of iteration for each cart item
     * @memberof ExpandedShoppingCartComponent
     * @return Observable<PlanOfferingPricing[]>
     */
    getEmployerContribution(i: number): Observable<PlanOfferingPricing[]> {
        return this.shoppingService
            .getPlanOfferingPricing(
                this.planOfferingIdArray[i],
                this.cartItem[i].enrollmentState,
                undefined,
                this.memberId,
                this.mpGroup,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                this.cartItem[i].id,
            )
            .pipe(
                tap((planOfferingPricing) => {
                    const employerContribution = planOfferingPricing.find(
                        (plan) => plan.coverageLevelId === this.cartLoop[i].coverageLevelId,
                    );
                    this.sum = this.sum + employerContribution.totalCost - employerContribution.memberCost;
                }),
                catchError((error) => {
                    if (error.error) {
                        this.isSpinnerLoading = false;
                    }
                    return of(null);
                }),
            );
    }

    /**
     * function called to apply for benefits, route to app flow and check if the consent is accepted or not
     * @returns void
     */
    openAppFlow(): void {
        /**
         * Angular version 4 and above will not deduct hidden input fields and we cannot use reactive forms.
         */

        // to make sure enrollment state has cart item data before entering application flow
        this.store.dispatch(new CopyCartData(this.cartItem));

        // Patch for the case when normal payroll account members don't have the employer name
        // But there is a requirement to update it without displaying the field in partial census
        if (this.isEmployerNameFieldEnabled && this.isEmployerNameFieldReadOnly && !this.memberInfo.workInformation?.employerName) {
            this.memberInfo.workInformation = {
                ...this.memberInfo.workInformation,
                employerName: this.accountInfo?.name,
            };
            this.memberService
                .updateMember(this.memberInfo, String(this.mpGroup))
                .pipe(
                    catchError(() => EMPTY),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }

        this.userPreference = this.userPrefs2 ? this.userPrefs2.nativeElement.value : "";
        this.aflacEicPreference = this.aflacEicPrefs ? this.aflacEicPrefs.nativeElement.value : "";
        const isRiskClassIdA = this.cartItem[0].riskClassOverrideId === OCCUPATION_CLASS_A_ID;
        const isOccupationClassChangedToA = this.sharedService.getIsOccupationClassA() || null;
        let isAgentSelfEnrolled = false;
        // restricted address match check for agent self enrollment
        this.isAgentSelfEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((selfEnrolled) => (isAgentSelfEnrolled = selfEnrolled));
        if (this.isGenericUser) {
            this.openAddEmployee();
        } else if (
            !this.isGenericUser &&
            (!this.isCompletedRequiredInfo() ||
                (!this.isMember && !this.memberConsent) ||
                (!this.isMember && isRiskClassIdA && isOccupationClassChangedToA))
        ) {
            this.openCompleteRequiredInfoDialog();
        } else if (this.addressMatchConfig && this.checkAIPlansInCart(this.planOfferingsInCart) && !isAgentSelfEnrolled) {
            this.openAddressMatchingPrompt();
        } else {
            if (this.checkPayrollMethodAndIdv()) {
                this.memberService
                    .verifyMemberIdentity(
                        this.memberId,
                        this.aflacEicPreference,
                        this.userPreference,
                        this.systemFlowCode,
                        this.mpGroup?.toString(),
                    )
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe();
            }
            this.checkDependentAddress();
            this.routeToAppFlow();
        }
        this.isSpinnerLoading = false;
    }

    /**
     * Checks for aflac individual plans in cart
     * @param planOfferingsInCart
     * @returns true if aflac individual plans are present in cart
     */
    checkAIPlansInCart(planOfferingsInCart: PlanOffering[]): boolean {
        return planOfferingsInCart.some(
            (item) => item.plan.carrierId === CarrierId.AFLAC && item.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
        );
    }

    /**
     * Checks payroll method and idv
     * @returns true if payroll method and idv
     */
    checkPayrollMethodAndIdv(): boolean {
        // payrollFlag is true when payroll enrollment method is headset, call center or virtual f2f
        const payrollFlag =
            this.isPayroll &&
            this.sharedService.checkPayrollMethodAndIdv(
                this.enrollmentObj.enrollmentMethod,
                this.isPayrollHeadsetIDV,
                this.isPayrollCallCenterIDV,
                this.isPayrollVirtualF2FIDV,
            );
        // directFlag is true when direct enrollment method is headset or call center
        const directFlag =
            this.isDirect &&
            ((this.enrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET && this.isDirectHeadsetIDV) ||
                (this.enrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER && this.isDirectCallCenterIDV));
        return this.isIDV && (payrollFlag || directFlag);
    }

    /**
     * Opens address matching prompt
     */
    openAddressMatchingPrompt(): void {
        const addressMatchPromptData: AddressMatchModel = {
            isDirect: this.isDirect,
            isTPILnlAgentAssisted: false,
            isTPILnlSelfService: false,
            mpGroupId: this.mpGroup,
            memberId: this.memberId,
            address: this.memberContactInfo.address,
        };
        this.addressMatchingService
            .validateAccountContactOrAccountProducerMatch(this.mpGroup, this.memberId, this.memberContactInfo.address)
            .pipe(
                switchMap((isAddressMatched) => {
                    if (!isAddressMatched) {
                        return of(true);
                    }
                    return this.empoweredModalService
                        .openDialog(AddressMatchingPromptComponent, {
                            data: addressMatchPromptData,
                        })
                        .afterClosed();
                }),
                filter((isRouteToAppFlow) => !!isRouteToAppFlow),
                switchMap((data) => {
                    if (this.dependentAddressUpdateConfig && this.dependentList.length && data.updatedAddress) {
                        this.empoweredModalService.openDialog(DependentAddressUpdateModalComponent, {
                            data: {
                                memberId: this.memberInfo.id,
                                memberAddress: data.updatedAddress,
                            },
                        });
                    }
                    return of(null);
                }),
                switchMap(() => {
                    this.checkDependentAddress();
                    if (this.checkPayrollMethodAndIdv()) {
                        return this.memberService
                            .verifyMemberIdentity(
                                this.memberId,
                                this.aflacEicPreference,
                                this.userPreference,
                                this.systemFlowCode,
                                this.mpGroup?.toString(),
                            )
                            .pipe(
                                tap(() => this.routeToAppFlow()),
                                catchError((error) => {
                                    if (error.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                                        this.routeToAppFlow();
                                    }
                                    return of(null);
                                }),
                            );
                    }
                    this.routeToAppFlow();
                    return of(null);
                }),
                catchError(() => of(null)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    openAddEmployee(): void {
        const dialogRef = this.dialog.open(CensusManualEntryComponent, {
            width: "100%",
            data: {
                isQuoteShopPage: true,
                mpGroupId: this.mpGroup,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((action) => {
                if (action === AppSettings.APPFLOW_ACTION) {
                    this.isSpinnerLoading = true;
                    this.routeToAppFlow();
                }
            });
    }
    /**
     * Method to check all required info is available for member or not
     * @returns boolean - true if all info is available else false
     */
    isCompletedRequiredInfo(): boolean {
        return (
            this.checkMemberPersonalDetails() &&
            this.memberInfo.workInformation.occupation &&
            this.memberInfo.workInformation.occupationDescription &&
            this.memberContactInfo.address.state &&
            this.memberContactInfo.address.city &&
            this.memberContactInfo.address.zip &&
            this.memberContactInfo.address.address1 &&
            (this.memberContactInfo.phoneNumbers.length || (this.memberWorkContact && this.memberWorkContact.phoneNumbers.length)) &&
            !this.checkEBSEmail() &&
            // If plan information delivery preference is electronic check if memberContactInfo.emailAddresses is non-empty
            this.checkCorrespondenceTypeAndEmail() &&
            !this.workStateAndZipRequired &&
            this.isEmpIDAndDeptNoRequired() &&
            this.isSSNMandatoryField() &&
            this.ssnConfirmationEnabled &&
            this.memberInfo.ssnConfirmed &&
            !this.isEmployerNameFieldRequired()
        );
    }

    /**
     * Returns true if member's personal details are present
     */
    checkMemberPersonalDetails(): boolean {
        return Boolean(
            this.memberInfo.name.firstName && this.memberInfo.name.lastName && this.memberInfo.birthDate && this.memberInfo.gender,
        );
    }

    /**
     * Returns true if employerName is required and is missing from member
     */
    isEmployerNameFieldRequired(): boolean {
        return Boolean(
            this.isEmployerNameFieldEnabled && !this.isEmployerNameFieldReadOnly && !this.memberInfo.workInformation?.employerName,
        );
    }

    /**
     * Function to check If config is enable then only look for SSN field required info
     * @returns boolean
     */
    isSSNMandatoryField(): boolean {
        return !(this.isSSNMandatoryConfigEnabled && !this.memberInfo.ssn);
    }

    /**
     * Function to check If plan information delivery preference is electronic check if memberContactInfo.emailAddresses is non-empty
     * @returns boolean
     */
    checkCorrespondenceTypeAndEmail(): boolean {
        return (
            this.memberInfo.profile.correspondenceType !== CorrespondenceType.ELECTRONIC ||
            (this.memberInfo.profile.correspondenceType === CorrespondenceType.ELECTRONIC &&
                (this.memberContactInfo.emailAddresses.length > 0 ||
                    (this.memberWorkContact && this.memberWorkContact.emailAddresses.length > 0)))
        );
    }

    /**
     * Function to check If config for EBS config is enabled, ebs group attribute is true,
     *   and emailAddresses is non-empty, since email is required if config is enabled
     * @returns boolean
     */
    checkEBSEmail(): boolean {
        // eslint-disable-next-line no-extra-boolean-cast
        if (!!this.memberWorkContact) {
            return (
                this.isEBSPaymentConfigEnabled &&
                this.isEBSIndicator &&
                this.memberContactInfo.emailAddresses?.length <= 0 &&
                this.memberWorkContact.emailAddresses?.length <= 0
            );
        }
        return this.isEBSPaymentConfigEnabled && this.isEBSIndicator && this.memberContactInfo.emailAddresses?.length <= 0;
    }
    /**
     * Method to check required info is available for Employee ID and Department Number
     * @returns boolean - true if all info is available else false
     */
    isEmpIDAndDeptNoRequired(): boolean {
        const isPeoAccount: boolean = this.accountInfo && this.accountInfo.ratingCode === RatingCode.PEO;
        const isOrganizationRequired: boolean | string =
            isPeoAccount || this.isOrganizationFieldRequired
                ? (isPeoAccount && this.memberInfo.workInformation.departmentNumber) ||
                  (this.isOrganizationFieldRequired && this.memberInfo.workInformation.organizationId !== 1)
                : true;
        const isEmployeeIdRequired: boolean | string = this.isEmployeeIdFieldRequired ? this.employeeId : true;
        return !!isOrganizationRequired && !!isEmployeeIdRequired;
    }

    /**
     * Check if any plans in the cart require work state and zip. If so, also check if that information
     * already exists in member's profile.
     *
     * @param requiringPlans value of config containing all plans that require work state and zip
     * @returns boolean indicating whether any of the plans that are currently in the cart are
     *  part of the requiring plans
     */
    checkMemberWorkStateAndZipAndRequirements(requiringPlans: string): boolean {
        return (
            this.cartItemPlanIds.some((planId) => requiringPlans.split(",").includes(planId)) &&
            (!this.memberWorkContact ||
                !this.memberWorkContact.address ||
                !this.memberWorkContact.address.state ||
                !this.memberWorkContact.address.zip)
        );
    }

    /**
     * Open required info dialog and provide the necessary data to correctly present the form.
     * Navigate to Application Flow if dialog returns this action upon closing.
     */
    openCompleteRequiredInfoDialog(): void {
        const dialogRef = this.dialog.open(EmployeeRequiredInfoComponent, {
            width: "100%",
            data: {
                memberInfo: this.memberInfo,
                memberContactInfo: this.memberContactInfo,
                workContactInfo: this.memberWorkContact,
                mpGroupId: this.mpGroup,
                showRequiredInfo: !this.isGenericUser && (!this.isCompletedRequiredInfo() || !this.memberConsent),
                portal: this.isMember ? AppSettings.PORTAL_MEMBER : AppSettings.PORTAL_PRODUCER,
                aflacEicPreference: this.aflacEicPreference,
                userPreference: this.userPreference,
                memberId: this.memberId,
                systemFlowCode: this.systemFlowCode,
                isIDV: this.isIDV,
                isPayrollHeadsetIDV: this.isPayrollHeadsetIDV,
                isPayrollCallCenterIDV: this.isPayrollCallCenterIDV,
                isPayrollVirtualF2FIDV: this.isPayrollVirtualF2FIDV,
                isDirectHeadsetIDV: this.isDirectHeadsetIDV,
                isDirectCallCenterIDV: this.isDirectCallCenterIDV,
                isPayroll: this.isPayroll,
                isDirect: this.isDirect,
                enrollmentMethod: this.isMember ? EnrollmentMethod.SELF_SERVICE : this.enrollmentObj.enrollmentMethod,
                workStateAndZipRequired: this.workStateAndZipRequired,
                isEmployeeIdFieldRequired: this.isEmployeeIdFieldRequired,
                isOrganizationFieldRequired: this.isOrganizationFieldRequired,
                employeeId: this.employeeId,
                customID: this.customID,
                showEmployeeRequiredInfoHeader: !this.isGenericUser && !this.isCompletedRequiredInfo(),
                ssnRequiredForEnrollment: this.isSSNMandatoryConfigEnabled,
                ssnConfirmationEnabled: this.ssnConfirmationEnabled,
                isAIPlanInCart: this.checkAIPlansInCart(this.planOfferingsInCart),
                checkEBSEmail: this.checkEBSEmail(),
                showEmployerNameField: this.isEmployerNameFieldRequired(),
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((action) => {
                if (action === AppSettings.APPFLOW_ACTION) {
                    this.isSpinnerLoading = true;
                    this.routeToAppFlow();
                }
            });
    }
    /**
     * Navigate to Application Flow
     */
    routeToAppFlow(): void {
        this.utilService.updateFormSubmission(FormType.PDA, false);
        if (this.isMember) {
            this.route.navigate([`/member/wizard/enrollment/app-flow/${this.mpGroup}/${this.memberId}`], {
                relativeTo: this.componentData.activatedRoute,
            });
        } else {
            this.route.navigate([`../../../../app-flow/${this.mpGroup}/${this.memberId}`], {
                relativeTo: this.componentData.activatedRoute,
            });
        }
        const overlayClose = {
            isCloseOverlay: true,
        };
        this.shopCartService.closeExpandedOverlayCart(this.utilService.copy(overlayClose));
        this.shopCartService.changeHighlightedOverlay({
            isCartOpen: false,
        });
    }

    /**
     * @description Method to check if dependent address is empty and to update if it is empty
     * @returns void
     */
    checkDependentAddress(): void {
        this.dependentList?.forEach((dependent) => {
            this.memberService
                .getDependentContact(this.memberInfo.id, dependent.id.toString(), this.mpGroup)
                .pipe(
                    mergeMap((dependentAddress) => {
                        if (!dependentAddress.address.address1 || !dependentAddress.address.city) {
                            const dependentContact: DependentContact = { ...dependentAddress };
                            dependentContact.address.address1 = dependentAddress.address.address1
                                ? dependentAddress.address.address1
                                : this.memberContactInfo.address.address1;
                            dependentContact.address.address2 = this.memberContactInfo.address.address2 || "";
                            dependentContact.address.city = dependentAddress.address.city
                                ? dependentAddress.address.city
                                : this.memberContactInfo.address.city;
                            return this.memberService.saveDependentContact(
                                dependentContact,
                                this.memberInfo.id,
                                dependent.id.toString(),
                                this.mpGroup,
                            );
                        }
                        return of(null);
                    }),
                    catchError(() => of(null)),
                )
                .pipe(take(1))
                .subscribe();
        });
    }

    /**
     * Method to get maximum date
     * @param multipleEnrollmentPeriod : List of multiple enrollment periods
     * @returns Maximum date in enrollment periods
     */
    getMaximumDate(multipleEnrollmentPeriod: string[]): Date | string {
        let max = multipleEnrollmentPeriod[0];
        multipleEnrollmentPeriod.forEach((eachEnrollmentPeriod) => {
            if (eachEnrollmentPeriod > max) {
                max = eachEnrollmentPeriod;
            }
        });
        return max;
    }
    /**
     * Method to get account producer list and check access permissions for agent
     */
    getAccountProducers(): void {
        combineLatest([
            this.store.select(SharedState.hasPermission(UserPermissionList.ACCOUNT_HQ_SUPPORT)),
            this.store.select(SharedState.hasPermission(UserPermissionList.GET_ACCOUNT_PRODUCER)),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([hasHQSupport, hasPermission]) => {
                if (hasPermission) {
                    if (hasHQSupport) {
                        this.isProducer = false;
                    } else {
                        const producersData = this.store.selectSnapshot(EnrollmentState.GetAccountProducerList);
                        if (producersData && producersData.producerList && producersData.producerList.length) {
                            this.isProducer = producersData.producerList.every((data) => +data.producer.id !== +this.loggedInUserId);
                        }
                    }
                }
            });
    }
    getApprovalRequest(): void {
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response.length && response[response.length - 1].status === ApprovalRequestStatus.APPROVED) {
                    this.isApproved = true;
                }
            });
    }

    /**
     * Uses getMemberConsent API to get consent
     */
    checkMemberConsent(): void {
        this.isSpinnerLoading = true;
        if (this.portal === PortalType.MEMBER) {
            this.updateCartItemsForMember();
        }
        if (
            this.isIDV &&
            ((this.isPayroll &&
                this.sharedService.checkPayrollMethodAndIdv(
                    this.enrollmentObj.enrollmentMethod,
                    this.isPayrollHeadsetIDV,
                    this.isPayrollCallCenterIDV,
                    this.isPayrollVirtualF2FIDV,
                )) ||
                (this.isDirect &&
                    ((this.enrollmentObj.enrollmentMethod === AppSettings.HEADSET && this.isDirectHeadsetIDV) ||
                        (this.enrollmentObj.enrollmentMethod === AppSettings.CALL_CENTER && this.isDirectCallCenterIDV))))
        ) {
            aflac_eic.aflac_eic_form("aflac_eic_prefs");
        }
        this.memberService
            .getMemberConsent(this.memberId, this.mpGroup)
            .pipe(
                tap((res: boolean) => {
                    this.memberConsent = res;
                    this.openAppFlow();
                }),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    /**
     * Service call to get product offerings and enrollments
     * @returns void
     */
    getMemberEnrollments(): void {
        combineLatest([
            this.shoppingService.getProductOfferings(this.mpGroup),
            this.enrollmentService
                .getEnrollments(this.memberId, this.mpGroup, "planId,coverageLevelId")
                .pipe(mergeMap((enrollments) => this.getEnrollmentRiders(enrollments))),
        ])
            .pipe(takeUntil(this.unsubscribe$.asObservable()))
            .subscribe((response) => {
                this.productOfferingsList = response[0];
                this.enrollments = response[1];
                this.existingCoverageAmount = this.enrollments
                    .map((enrollment) =>
                        this.isValidExistingCoverage(enrollment) ? enrollment.memberCost + this.getRiderCost(enrollment.riders) : 0,
                    )
                    .reduce((prev, current) => prev + current, 0);
                // Set Enrollment Data in store
                this.store.dispatch(new SetEnrollments(this.enrollments));
            });
    }
    /**
     * For the provided enrollments, get riders for each enrollment, append the riders to each enrollment
     * @param enrollments: List of enrollments
     * @returns Observable of Enrollments with the rider details appended to them
     */
    getEnrollmentRiders(enrollments: Enrollments[]): Observable<Enrollments[]> {
        return forkJoin(
            enrollments.map((enrollment) =>
                this.enrollmentService
                    .getEnrollmentRiders(this.memberId, enrollment.id, this.mpGroup)
                    .pipe(map((riders) => ({ ...enrollment, riders }))),
            ),
        );
    }

    /**
     * Method called to open total cost modal which displays the current cart cost and the existing coverage cost.
     * @returns void
     */
    viewTotalCost(): void {
        const totalCost = PayrollFrequencyCalculatorPipe.prototype.transform(this.totalCost + this.totalFlexCost, this.pfPipeObj);
        const existingCoverageAmount = PayrollFrequencyCalculatorPipe.prototype.transform(this.existingCoverageAmount, {
            ...this.pfPipeObj,
            payrollsPerYear: this.monthlyPayrollsPeryear,
        });
        this.empoweredModalService.openDialog(TotalCostDialogComponent, {
            data: {
                isMember: this.isMember,
                cartCost: totalCost,
                existingCost: existingCoverageAmount,
                payFrequency: this.pfPipeObj.pfType,
            },
        });
    }

    isValidExistingCoverage(enrollment: Enrollments): boolean {
        return (
            this.cartLoop.every((item) => item.productOfferingId !== this.getEnrollmentProductOfferingId(enrollment.plan.productId)) &&
            (enrollment.status === EnrollmentStatusType.APPROVED || enrollment.status.startsWith(EnrollmentStatusType.PENDING))
        );
    }

    /**
     * Method to calculate the total member cost of enrollment riders
     * @param riders: Array of enrollmentRiders
     * @returns number: Sum of the memberCost of all riders. If no riders, then 0 is returned
     */
    getRiderCost(riders: EnrollmentRider[]): number {
        return riders && riders.length ? riders.map((rider) => rider.memberCost).reduce((a, b) => a + b) : 0;
    }

    getEnrollmentProductOfferingId(productId: number): number {
        const product = this.productOfferingsList.find((productOffering) => productOffering.product.id === productId);
        return product ? product.id : null;
    }

    /**
     * To get the details of agent
     */
    getAgentDetails(): Observable<AccountProducer[]> {
        return this.accountService.getAccountProducers(this.mpGroup?.toString()).pipe(
            tap((producers) => {
                const primaryProducer = producers.find((primary) => primary.role === PRIMARY_PRODUCER);
                this.agentFirstName = primaryProducer.producer.name.firstName;
                this.agentLastName = primaryProducer.producer.name.lastName;
                this.agentEmail = primaryProducer.producer.emailAddress;
                this.agentNumber = primaryProducer.producer.phoneNumber;
                // eslint-disable-next-line max-len
                this.agentDetails = `${this.agentFirstName} ${this.agentLastName} ${this.languageStrings["primary.portal.tpiEnrollment.at"]} ${this.agentNumber} ${this.languageStrings["primary.portal.tpiEnrollment.or"]} ${this.agentEmail}.`;
            }),
        );
    }
    /**
     * this method is used to update cart items if it is member portal, enrollment method is other than self service and assisting admin id
     * will update assistingAdminId to null, enrollment method to SELF_SERVICE and state to member's home state
     * this is implemented to solve app flow issue to skip agent information screen for AG plans
     */
    updateCartItemsForMember(): void {
        this.cartItemsToUpdate.forEach((cartItems) => {
            if (cartItems.enrollmentMethod !== EnrollmentMethod.SELF_SERVICE || cartItems.assistingAdminId) {
                this.shoppingService
                    .updateCartItem(this.memberId, this.mpGroup, cartItems.id, {
                        assistingAdminId: null,
                        benefitAmount: cartItems.benefitAmount,
                        enrollmentMethod: EnrollmentMethod.SELF_SERVICE,
                        dependentAge: cartItems.dependentAge ? cartItems.dependentAge : null,
                        planOfferingId: cartItems.planOfferingId,
                        memberCost: cartItems.memberCost,
                        totalCost: cartItems.totalCost,
                        enrollmentState: this.memberContactInfo.address.state,
                        coverageLevelId: cartItems.coverageLevelId,
                        subscriberQualifyingEventId:
                            cartItems.planOffering && cartItems.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
                    })
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe();
            }
        });
    }
    /**
     * Set error for shopping cart if api fails
     * @param error error object received in api response
     */
    setErrorForShoppingCart(error: ApiError): void {
        const errorObject = error;
        if (errorObject) {
            if (errorObject.language && errorObject.language.displayText) {
                this.apiErrorMessage = errorObject.language.displayText;
            } else {
                const errorTag =
                    errorObject.language && errorObject.language.languageTag ? error.language.languageTag : "secondary.api.400.invalid";
                this.commonService
                    .getLanguages(errorTag)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((errorMessage) => {
                        this.apiErrorMessage = errorMessage[0].value;
                    });
            }
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
