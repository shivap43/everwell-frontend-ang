import { Component, OnInit, ViewChild, EventEmitter, Output, OnDestroy, Input } from "@angular/core";
import {
    BenefitsOfferingService,
    Carrier,
    DeletePlanChoice,
    ProductSelection,
    AppTakerService,
    PlanIneligibleReasons,
    AccountDetails,
    ThirdPartyPlatforms,
    ProductDetails,
    RequiredSetup,
    AflacService,
    AccountService,
} from "@empowered/api";

import {
    BenefitsOfferingState,
    SetMaintenanceRequiredData,
    GetProductsPanel,
    MapProductChoiceToNewPlanYearPanel,
    MapPlanChoicesToNewPlanYearPanel,
    SetNewPlanYearPanel,
    SetUserPlanChoice,
    SetProductsTabView,
    SetUnapprovedPanel,
    RemovePlansDialogData,
    ProductDetailModel,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { takeUntil, catchError, switchMap, tap, filter } from "rxjs/operators";
import { Subject, forkJoin, of, Observable, combineLatest, EMPTY } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { RemovePlanComponent } from "./remove-plan/remove-plan.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { RemoveAllPlansComponent } from "./remove-all-plans/remove-all-plans.component";
import { ProductsPlansQuasiComponent } from "../products-plans-quasi/products-plans-quasi.component";
import { LanguageService } from "@empowered/language";
import { ManagePlansUpdateAvailabilityComponent } from "./manage-plans-update-availability/manage-plans-update-availability.component";
import { CopyAllPlansComponent } from "./copy-all-plans/copy-all-plans.component";
import { FormBuilder, FormGroup } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { MatSelect } from "@angular/material/select";
import { StopOfferingComponent } from "./stop-offering/stop-offering.component";
import { EditPricingEligibilityQuasiComponent } from "../edit-pricing-eligibility-quasi/edit-pricing-eligibility-quasi.component";
import { StopOfferingProductComponent } from "./stop-offering-product/stop-offering-product.component";
import { DomSanitizer } from "@angular/platform-browser";
import { ProductsPlansQuasiService } from "../products-plans-quasi/services/products-plans-quasi.service";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";

import {
    ProductNames,
    DateFormats,
    CarrierId,
    Permission,
    AFLAC_PARTNER_ID,
    PagePrivacy,
    AccountImportTypes,
    Validity,
    AppSettings,
    PlanChoice,
    TaxStatus,
    PlanYearType,
    PolicyOwnershipType,
    CountryState,
    Product,
    AdminCredential,
    StatusType,
    PlanYear,
    RefreshEligibleInfo,
    Plan,
} from "@empowered/constants";
import { AgViewPricesComponent } from "./ag-view-prices/ag-view-prices.component";
import { HttpErrorResponse } from "@angular/common/http";
import { RemovePlanYearPlansComponent } from "./remove-plan-year-plans/remove-plan-year-plans.component";
import { SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { AgRefreshService } from "@empowered/ui";

const VALUE_ZERO = 0;
const SYMBOLS = {
    EQUAL: "=",
    COMMA: ",",
    OPEN_BRACE: "[",
    CLOSE_BRACE: "]",
    SEMICOLON: ";",
};
const PRODUCT_NAME = {
    JWL: "JWL",
    JTL: "JTL",
    WL: "WL",
    TL: "TL",
};
const TPP_INDEX_ZERO = 0;
const API_RESPONSE_INDEX = {
    UNAPPROVED_PLAN_YEARS: 0,
    APPROVED_PLAN_CHOICES: 1,
    APPROVED_PLAN_YEARS: 2,
    UNAPPROVED_PLAN_CHOICES: 3,
    APPROVAL_REQUESTS: 4,
    UNAPPROVED_PRODUCTS_CHOICES: 5,
    APPROVED_PLAN_CHOICE_DETAILS: 6,
    UNAPPROVED_PLAN_CHOICE_DETAILS: 7,
    APPROVED_PRODUCT_CHOICES: 8,
};
const PRODUCT_STRING = "product";

@Component({
    selector: "empowered-products",
    templateUrl: "./products.component.html",
    styleUrls: ["./products.component.scss"],
})
export class ProductsComponent implements OnInit, OnDestroy {
    @Input() zipStatus: boolean;
    TaxStatus = TaxStatus; // This assignment is to make the enum accessible inside the template
    mpGroup: number;
    private unsubscribe$ = new Subject<void>();
    productChoice = [];
    specificCarrier: Carrier[] = [];
    productsData: Product[] = [];
    productDisplayedColumns: string[];
    isLoading: boolean;
    planChoices: any[] = [];
    planId: any[] = [];
    planChoiceId: any[] = [];
    offeringStates: CountryState[] = [];
    planEligibleStates: any[] = [];
    allProducts: any[] = [];
    approvedPlanChoiceDetail: any[] = [];
    unApprovedPlanChoiceDetail: any[] = [];
    planYearResponse: PlanYear[] = [];
    planChoiceDetail = {
        priceSet: false,
        enrollmentsExist: false,
    };
    unpluggedAccessAllowed = true;
    checkedOut = false;
    maintainanceLock = true;
    removedPlanId: number;
    tppEligibleProducts: Array<{ id: string; eligibleProducts: Array<string>; validity: Validity }> = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.products.title",
        "primary.portal.maintenanceBenefitsOffering.products.filterAvailability",
        "primary.portal.maintenanceBenefitsOffering.products.filterStatus",
        "primary.portal.maintenanceBenefitsOffering.products.addProducts",
        "primary.portal.maintenanceBenefitsOffering.products.zeroState",
        "primary.portal.maintenanceBenefitsOffering.products.continuous",
        "primary.portal.maintenanceBenefitsOffering.products.date",
        "primary.portal.maintenanceBenefitsOffering.products.planCount",
        "primary.portal.maintenanceBenefitsOffering.products.planName",
        "primary.portal.maintenanceBenefitsOffering.products.states",
        "primary.portal.maintenanceBenefitsOffering.products.preTax",
        "primary.portal.maintenanceBenefitsOffering.products.agentAssistance",
        "primary.portal.maintenanceBenefitsOffering.products.planYear",
        "primary.portal.maintenanceBenefitsOffering.products.enrollment",
        "primary.portal.maintenanceBenefitsOffering.products.pricesEligibility",
        "primary.portal.maintenanceBenefitsOffering.products.notSet",
        "primary.portal.maintenanceBenefitsOffering.products.status",
        "primary.portal.maintenanceBenefitsOffering.products.manage",
        "primary.portal.maintenanceBenefitsOffering.products.pricingEditable",
        "primary.portal.maintenanceBenefitsOffering.products.removePlan",
        "primary.portal.maintenanceBenefitsOffering.products.managePlans",
        "primary.portal.maintenanceBenefitsOffering.products.updatePlan",
        "primary.portal.maintenanceBenefitsOffering.products.copyPlan",
        "primary.portal.maintenanceBenefitsOffering.products.movePlans",
        "primary.portal.maintenanceBenefitsOffering.products.removeAllPlans",
        "primary.portal.maintenanceBenefitsOffering.products.approved",
        "primary.portal.maintenanceBenefitsOffering.products.pending",
        "primary.portal.maintenanceBenefitsOffering.products.updateAvailability",
        "primary.portal.maintenanceBenefitsOffering.products.viewPrices",
        "primary.portal.maintenanceBenefitsOffering.products.editPrices",
        "primary.portal.maintenanceBenefitsOffering.products.setPrices",
        "primary.portal.maintenanceBenefitsOffering.products.noProductsWereAvailable",
        "primary.portal.maintenanceBenefitsOffering.products.noProductsAreAvailable",
        "primary.portal.maintenanceBenefitsOffering.products.noPlansPending",
        "primary.portal.maintenanceBenefitsOffering.products.noPlansApproved",
        "primary.portal.maintenanceBenefitsOffering.products.noPlansMatchFilter",
        "primary.portal.common.dateHint",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.accounts.accountList.filter",
        "primary.portal.maintenanceBenefitsOffering.products.incompleteCarrierForm",
        "primary.portal.maintenanceBenefitsOffering.products.notready",
        "primary.portal.maintenanceBenefitsOffering.products.eligliblitiNotSet",
        "primary.portal.maintenanceBenefitsOffering.products.pendingAdminAproval",
        "primary.portal.maintenanceBenefitsOffering.products.submitOfferingsAproval",
        "primary.portal.maintenanceBenefitsOffering.products.noPlanToSelect",
        "primary.portal.benefitOffering.employeeMinimumPopup.mimimumRequirement",
        "primary.portal.maintenanceBenefitsOffering.products.planWasRemoved",
        "primary.portal.maintenanceBenefitsOffering.products.planSetToRemoved",
        "primary.portal.maintenanceBenefitsOffering.products.notAvailableForEnrollment",
        "primary.portal.maintenanceBenefitsOffering.products.tppAvailableDates",
        "primary.portal.maintenanceBenefitsOffering.products.tppPlanNotAvailable",
        "primary.portal.maintenanceBenefitsOffering.products.hqIntegrationAdminApprovalPlan",
        "primary.portal.common.addNonAgPlans",
        "primary.portal.maintenanceBenefitsOffering.refreshAgOffering",
        "primary.portal.common.renewAgPlanYear",
        "primary.portal.maintenanceBenefitsOffering.products.maximumEmployeeRequirement",
        "primary.portal.maintenanceBenefitsOffering.benefitDollar.removed",
    ]);
    planChoicesUnapproved: any[] = [];
    hasApiError: boolean;
    errorMessage: string;
    filters: FormGroup;
    availabilityFilter: string;
    statusFilter: string;
    pastDate: boolean;
    @ViewChild("availabilityFilterRef", { static: true }) availabilityFilterRef: MatSelect;
    @ViewChild("statusFilterRef") statusFilterRef: MatSelect;
    unFilteredProducts = [];
    availabilityLabel: string;
    enrollmentStartDateValue: any;
    today = new Date();
    isEnrollmentStarted = true;
    approvalRequests = [];
    isRequestPending: boolean;
    productTypeContinuous = "Continuous";
    productTypePlanYear = "PlanYearRestricted";
    continuousProduct: boolean;
    productType: string;
    planHighAlert: boolean;
    productLevelHighAlert: boolean;
    approvalRequestStatusArray: any;
    approvalStatusPending = false;
    @Output() emitUnApprovedProducts = new EventEmitter<unknown>();
    @Output() productHighAlert = new EventEmitter<boolean>();
    @Output() planYearEnding = new EventEmitter<number>();
    enrollmentStartDate: any;
    choiceObservable = [];
    isEnrollmentExist = false;
    planLowAlert = false;
    highAlert = 0;
    approvalStatusAlertObject: { tabAlert: number; plan: number };
    plansEffected = 0;
    enrollmentEndDate: any;
    enrollmentEndDateValue: any;
    currentAccount: AccountDetails;
    accountLocked = false;
    continuous = "continuous";
    planYear = "planYear";
    unApprovedProductChoices = [];
    approvedProductChoices = [];
    constantSave = "save";
    ENROLLMENT = "ENROLLMENT";
    disableAddButton: boolean;
    availablePlans = [];
    isAdmin: boolean;
    isProductDisabled = false;
    isPlanDisabled = false;
    approvedPlanYearChoices: PlanChoice[] = [];
    unApprovedPlanYearChoices: PlanChoice[] = [];
    planYearEndingCounts = VALUE_ZERO;
    loggedInDetails: AdminCredential;
    isAflacPartner: boolean;
    unApprovedActivePlanChoices: PlanChoice[] = [];
    carriersForApproval: string[];
    isRemovePlan = false;
    activeTpp: Array<ThirdPartyPlatforms>;
    unApprovedActiveVAS: Plan[] = [];
    isRefreshEligible: RefreshEligibleInfo;
    isAGOnly = false;
    isShared = false;
    accountImportType = AccountImportTypes;
    checkAgRenewal = false;
    carrierIds = CarrierId;
    isRefreshDisabled = true;
    permissionEnum = Permission;
    currentCoverageStartDate: Date;
    canManagePlan = false;
    productString = PRODUCT_STRING;
    validZip: boolean;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;

    constructor(
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly domSanitizer: DomSanitizer,
        private readonly appTakerService: AppTakerService,
        private readonly utilService: UtilService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredSheetService: EmpoweredSheetService,
        private readonly aflacService: AflacService,
        private readonly agRefreshService: AgRefreshService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly sharedService: SharedService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dateService: DateService,
    ) {
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        this.getActiveTPP();
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.BENEFIT_OFFERING_MANAGE_PRODUCT);
        }
    }

    /**
     * @description Angular Life cycle hook
     * initialize component for MBO products list
     * @memberof ProductsComponent
     */
    ngOnInit(): void {
        this.sharedService.currentUnpluggedDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((unpluggedDetails) => {
            this.checkedOut = unpluggedDetails.isCheckedOut;
            this.maintainanceLock = unpluggedDetails.hasMaintenanceLock;
            this.unpluggedAccessAllowed = unpluggedDetails.allowAccess;
        });
        this.staticUtilService
            .hasPermission(Permission.BENEFIT_OFFERING_UPDATE_PLAN_OFFERING)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.canManagePlan = response;
            });
        this.quasiService.setQuasiClosedStatus(false);
        this.quasiService
            .loggedInDetails()
            .pipe(
                filter((res) => !!res),
                tap((credential: AdminCredential) => {
                    this.loggedInDetails = credential;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.isAdmin = Boolean(this.loggedInDetails && this.loggedInDetails.adminId);
        this.isAflacPartner = this.loggedInDetails && this.loggedInDetails.partnerId === AFLAC_PARTNER_ID;
        this.getCredential();
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.isShared = this.currentAccount && this.currentAccount.importType === AccountImportTypes.SHARED_CASE;
        this.filters = this.fb.group({
            availability: [null],
            status: [null],
            date: [new Date()],
        });
        this.quasiService.getConfigurationSpecifications();
        this.quasiService.carriersForApproval.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.carriersForApproval = value;
        });
        this.isAGOnly = this.currentAccount && this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP;
        this.serviceCalls().subscribe();
        if (this.isAGOnly || this.isShared) {
            this.checkRefreshEligibility();
        }
        this.checkForVestedAgents();
        this.benefitOfferingHelperService.resetProductsApproval$
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((isResetProductApproval) => isResetProductApproval),
                switchMap((resp) => {
                    this.isLoading = true;
                    return this.store.dispatch(new SetMaintenanceRequiredData());
                }),
                switchMap((res) => this.store.dispatch(new GetProductsPanel())),
                switchMap((res) => this.getRequiredInfo()),
                switchMap((resp) => this.aflacService.getAflacGroupRefreshStatus(this.currentAccount.id)),
            )
            .subscribe((res) => {
                this.isLoading = false;
                this.checkForRenewal(res);
            });
        this.checkQuasiModalClosedStatus();
        // set spinner when AG refresh api call is pending
        this.benefitsOfferingService
            .getSpinnerStatus()
            .pipe(
                tap((res) => (this.isLoading = res)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.validZip = this.zipStatus;
    }
    /**
     * This method is used to check quasi modal closed status
     */
    checkQuasiModalClosedStatus(): void {
        this.quasiService
            .getQuasiClosedStatus()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((status) => status),
                tap((status) => {
                    this.isLoading = status;
                }),
            )
            .subscribe();
    }
    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        this.staticUtilService
            .hasPermission(Permission.BO_PRODUCT_UPDATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.disableAddButton = this.disableAddButton ? this.disableAddButton : !response;
            });
    }
    /**
     * This method checks if group is refresh eligible or renewal eligible
     */
    checkRefreshEligibility(): void {
        forkJoin(
            this.benefitOfferingService.getPlanYears(this.mpGroup, false),
            this.aflacService.getAflacGroupRefreshStatus(this.currentAccount.id),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([planYears, refreshStatus]) => {
                this.currentCoverageStartDate = this.getAgCoverageStartDate(planYears);
                this.checkForRenewal(refreshStatus);
            });
    }
    /**
     * fetch the latest AG plan year's coverage start date
     * @param planYears all plan year details
     * @returns coverage start date
     */
    getAgCoverageStartDate(planYears: PlanYear[]): Date {
        const agPlanYears = this.utilService.copy(planYears.filter((planYear) => planYear.type === PlanYearType.AFLAC_GROUP));
        if (agPlanYears.length > 1) {
            agPlanYears.sort((planYear1, planYear2) => planYear2.id - planYear1.id);
        }
        if (agPlanYears.length) {
            return this.dateService.toDate(
                this.datepipe.transform(agPlanYears[0].coveragePeriod.effectiveStarting, DateFormats.YEAR_MONTH_DAY),
            );
        }
        return null;
    }
    /**
     * This method will be called when we click on refresh AG offering button
     */
    refreshOffering(): void {
        this.isLoading = true;
        let refreshStatus: RefreshEligibleInfo;
        this.agRefreshService
            .refreshAgOffering(this.currentAccount, this.isRefreshEligible)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => {
                    refreshStatus = resp;
                    return this.benefitOfferingService.getPlanYears(this.mpGroup, false);
                }),
                switchMap((planYears) => {
                    this.isLoading = true;
                    this.currentCoverageStartDate = this.getAgCoverageStartDate(planYears);
                    this.checkForRenewal(refreshStatus);
                    return this.store.dispatch(new SetMaintenanceRequiredData());
                }),
                switchMap((res) => this.store.dispatch(new GetProductsPanel())),
                switchMap((res) => this.getRequiredInfo()),
                switchMap((resp) => this.aflacService.getAflacGroupRefreshStatus(this.currentAccount.id)),
            )
            .subscribe(() => {
                this.isLoading = false;
            });
    }
    /**
     * This method checks if refresh offering button has to be enabled
     * @param refreshEligibleInfo refresh eligibility info
     */
    checkForRenewal(refreshEligibleInfo: RefreshEligibleInfo): void {
        this.isRefreshDisabled = true;
        this.checkAgRenewal = false;
        const today = new Date();
        today.setHours(0, 0, 0);
        this.isRefreshEligible = this.utilService.copy(refreshEligibleInfo);
        if (this.isRefreshEligible.requiresBenefitOfferingRenewal || this.isRefreshEligible.refreshAllowed) {
            this.isRefreshDisabled = false;
        }
        if (this.currentCoverageStartDate) {
            this.currentCoverageStartDate.setHours(0, 0, 0);
        }
        this.checkAgRenewal =
            this.isRefreshEligible.requiresBenefitOfferingRenewal ||
            (this.currentCoverageStartDate && this.currentCoverageStartDate <= today);
    }
    /**
     * Makes service calls to get product and plan details
     * @returns observable of string array or nothing
     */
    serviceCalls(): Observable<void | string[]> {
        return this.getRequiredInfo().pipe(
            takeUntil(this.unsubscribe$),
            catchError((error) => {
                this.isLoading = false;
                this.hasApiError = true;
                this.displayDefaultError(error);
                return of([]);
            }),
        );
    }

    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.isLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * Method to get required Info and arrange data
     * @returns an observable of void from @method getAccountMaintenanceLockStatus
     */
    getRequiredInfo(): Observable<void> {
        this.isLoading = true;
        this.availablePlans = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
        this.quasiService.isApprovalRequired$.next({ status: false });
        this.quasiService.setDeclineAlert({ status: null });
        this.productsData = this.store.selectSnapshot(BenefitsOfferingState.getAllProducts);
        this.productChoice = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter((pannel) => pannel.productChoice != null)
            .map((product) => product.productChoice);
        this.specificCarrier = this.store.selectSnapshot(BenefitsOfferingState.getAllCarriers);
        this.offeringStates = this.store.selectSnapshot(BenefitsOfferingState.getBenefitOfferingStates);
        if (!this.offeringStates.length) {
            this.offeringStates.push(this.currentAccount.situs.state);
        }
        this.planEligibleStates = this.store.selectSnapshot(BenefitsOfferingState.getPlanEligibility);
        const choices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        this.planChoiceId = choices.map((eachChoice) => eachChoice.id);
        this.planId = choices.map((eachChoice) => eachChoice.plan.id);
        return combineLatest([
            this.benefitOfferingService.getPlanYears(this.mpGroup, true),
            this.benefitOfferingService.getPlanChoices(false, true, this.mpGroup),
            this.benefitOfferingService.getPlanYears(this.mpGroup, false),
            this.benefitOfferingService.getPlanChoices(true, true, this.mpGroup),
            this.benefitOfferingService.getApprovalRequests(this.mpGroup),
            this.benefitOfferingService.getProductChoices(this.mpGroup, true),
            this.benefitOfferingService.getPlanChoiceDetails(false, this.mpGroup),
            this.benefitOfferingService.getPlanChoiceDetails(true, this.mpGroup),
            this.benefitOfferingService.getProductChoices(this.mpGroup, false),
        ]).pipe(
            tap((results) => {
                this.planYearResponse = [];
                this.planChoices = [];
                this.planChoicesUnapproved = [];
                this.planYearResponse = [...results[API_RESPONSE_INDEX.UNAPPROVED_PLAN_YEARS]];
                this.planYearResponse.push(...results[API_RESPONSE_INDEX.APPROVED_PLAN_YEARS]);
                this.planChoices = [...results[API_RESPONSE_INDEX.APPROVED_PLAN_CHOICES]];
                this.planChoicesUnapproved = [...results[API_RESPONSE_INDEX.UNAPPROVED_PLAN_CHOICES]];
                this.approvalRequests = [...results[API_RESPONSE_INDEX.APPROVAL_REQUESTS]];
                this.approvalRequestStatusArray = [...results[API_RESPONSE_INDEX.APPROVAL_REQUESTS]];
                this.unApprovedProductChoices = [...results[API_RESPONSE_INDEX.UNAPPROVED_PRODUCTS_CHOICES]];
                this.approvedPlanChoiceDetail = [...results[API_RESPONSE_INDEX.APPROVED_PLAN_CHOICE_DETAILS]];
                this.unApprovedPlanChoiceDetail = [...results[API_RESPONSE_INDEX.UNAPPROVED_PLAN_CHOICE_DETAILS]];
                this.approvedProductChoices = [...results[API_RESPONSE_INDEX.APPROVED_PRODUCT_CHOICES]];
                this.unApprovedActivePlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
            }),
            switchMap((res) => this.getAccountMaintenanceLockStatus()),
            tap((res) => {
                this.getPlanChoiceDetails();
            }),
        );
    }

    getPlanChoiceDetails(): void {
        const approvedPlans = [],
            planChoiceApproved = [];
        this.productsData.forEach((product) => {
            this.specificCarrier.forEach((carrier) => {
                planChoiceApproved.push(
                    ...this.planChoices.filter((plan) => plan.plan.carrierId === carrier.id && plan.plan.productId === product.id),
                );
            });
        });
        if (planChoiceApproved.length) {
            planChoiceApproved.forEach((selection) => {
                const states = [];
                this.planEligibleStates.forEach((planEligible) => {
                    if (selection.plan.id === planEligible.planId) {
                        this.offeringStates.forEach((offeringState) => {
                            planEligible.allowedStates.forEach((eligible) => {
                                if (eligible.state.abbreviation === offeringState.abbreviation) {
                                    states.push(offeringState);
                                }
                            });
                        });
                    }
                    if (states.length && approvedPlans.findIndex((plan) => plan.id === selection.id) === -1) {
                        approvedPlans.push(selection);
                    }
                });
            });
        }
        this.approvedPlanYearChoices = approvedPlans.filter((planChoice) => !planChoice.continuous);
        this.getPlanChoiceUnapproved();
        this.setIsRequestPendingFlag();
        this.checkUnApprovedProducts();
        this.checkPlanYearEnding();
        this.applyFilters();
    }

    getPlanChoiceUnapproved(): void {
        const unapprovedPlans = [],
            planChoiceunApproved = [];
        this.productsData.forEach((product) => {
            this.specificCarrier.forEach((carrier) => {
                planChoiceunApproved.push(
                    ...this.planChoicesUnapproved.filter(
                        (plan) => plan.plan.carrierId === carrier.id && plan.plan.productId === product.id,
                    ),
                );
            });
        });
        if (planChoiceunApproved.length) {
            planChoiceunApproved.forEach((selection) => {
                const states = [];
                this.planEligibleStates.forEach((planEligible) => {
                    if (selection.plan.id === planEligible.planId) {
                        this.offeringStates.forEach((offeringState) => {
                            planEligible.allowedStates.forEach((eligible) => {
                                if (eligible.state.abbreviation === offeringState.abbreviation) {
                                    states.push(offeringState);
                                }
                            });
                        });
                    }
                    if (states.length && unapprovedPlans.findIndex((plan) => plan.id === selection.id) === -1) {
                        unapprovedPlans.push(selection);
                    }
                });
            });
        }
        this.unApprovedPlanYearChoices = unapprovedPlans.filter((planChoice) => !planChoice.continuous);
        this.arrangeData();
    }

    arrangeData(): void {
        this.allProducts = [];
        this.productsData.forEach((product) => {
            this.specificCarrier.forEach((carrier) => {
                // Filtering Individual Plan year plans
                const carrierSpecificPRIndividualPlans = this.planChoices.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === false &&
                        plan.plan.policyOwnershipType === AppSettings.INDIVIDUAL,
                );
                if (carrierSpecificPRIndividualPlans.length > 0) {
                    this.addPlansToProductList(
                        carrierSpecificPRIndividualPlans,
                        product,
                        carrier,
                        AppSettings.INDIVIDUAL,
                        StatusType.APPROVED,
                        this.planYear,
                    );
                }
                const carrierSpecificPRIndividualPlansUnapproved = this.planChoicesUnapproved.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === false &&
                        plan.plan.policyOwnershipType === AppSettings.INDIVIDUAL,
                );
                if (carrierSpecificPRIndividualPlansUnapproved.length > 0 && !this.isAdmin) {
                    this.addPlansToProductList(
                        carrierSpecificPRIndividualPlansUnapproved,
                        product,
                        carrier,
                        AppSettings.INDIVIDUAL,
                        StatusType.PENDING,
                        this.planYear,
                    );
                }
                // Filtering Group Plan year plans
                const carrierSpecificPRGroupPlans = this.planChoices.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === false &&
                        plan.plan.policyOwnershipType === AppSettings.GROUP,
                );
                if (carrierSpecificPRGroupPlans.length > 0) {
                    this.addPlansToProductList(
                        carrierSpecificPRGroupPlans,
                        product,
                        carrier,
                        AppSettings.GROUP,
                        StatusType.APPROVED,
                        this.planYear,
                    );
                }
                const carrierSpecificPRGroupPlansUnapproved = this.planChoicesUnapproved.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === false &&
                        plan.plan.policyOwnershipType === AppSettings.GROUP,
                );
                if (carrierSpecificPRGroupPlansUnapproved.length > 0 && !this.isAdmin) {
                    this.addPlansToProductList(
                        carrierSpecificPRGroupPlansUnapproved,
                        product,
                        carrier,
                        AppSettings.GROUP,
                        StatusType.PENDING,
                        this.planYear,
                    );
                }
                // Filtering Individual continuous plans
                const carrierSpecificIndividualContinuousPlans = this.planChoices.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === true &&
                        plan.plan.policyOwnershipType === AppSettings.INDIVIDUAL,
                );
                if (carrierSpecificIndividualContinuousPlans.length > 0) {
                    this.addPlansToProductList(
                        carrierSpecificIndividualContinuousPlans,
                        product,
                        carrier,
                        AppSettings.INDIVIDUAL,
                        StatusType.APPROVED,
                        this.continuous,
                    );
                }
                const carrierSpecificIndividualContinuousPlansUnapproved = this.planChoicesUnapproved.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === true &&
                        plan.plan.policyOwnershipType === AppSettings.INDIVIDUAL,
                );
                if (carrierSpecificIndividualContinuousPlansUnapproved.length > 0 && !this.isAdmin) {
                    this.addPlansToProductList(
                        carrierSpecificIndividualContinuousPlansUnapproved,
                        product,
                        carrier,
                        AppSettings.INDIVIDUAL,
                        StatusType.PENDING,
                        this.continuous,
                    );
                }
                // Filtering Group continuous plans
                const carrierSpecificGroupContinuousPlans = this.planChoices.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === true &&
                        plan.plan.policyOwnershipType === AppSettings.GROUP,
                );
                if (carrierSpecificGroupContinuousPlans.length > 0) {
                    this.addPlansToProductList(
                        carrierSpecificGroupContinuousPlans,
                        product,
                        carrier,
                        AppSettings.GROUP,
                        StatusType.APPROVED,
                        this.continuous,
                    );
                }
                const carrierSpecificGroupContinuousPlansUnapproved = this.planChoicesUnapproved.filter(
                    (plan) =>
                        plan.plan.carrierId === carrier.id &&
                        plan.plan.productId === product.id &&
                        plan.continuous === true &&
                        plan.plan.policyOwnershipType === AppSettings.GROUP,
                );
                if (carrierSpecificGroupContinuousPlansUnapproved.length > 0 && !this.isAdmin) {
                    this.addPlansToProductList(
                        carrierSpecificGroupContinuousPlansUnapproved,
                        product,
                        carrier,
                        AppSettings.GROUP,
                        StatusType.PENDING,
                        this.continuous,
                    );
                }
            });
        });
        this.allProducts.sort((a, b) => {
            if (a.productName.localeCompare(b.productName) !== 0) {
                return a.productName.localeCompare(b.productName);
            }
            if (a.productName.localeCompare(b.productName) === 0) {
                return a.carrierName.localeCompare(b.carrierName);
            }
        });
        this.unFilteredProducts = this.utilService.copy(this.allProducts);
        this.store.dispatch(new SetProductsTabView(this.unFilteredProducts));
        this.isLoading = false;
        this.setProductStatus();
        const isAllproductsSelected = this.availablePlans.filter(
            (panel) =>
                !panel.productChoice ||
                (panel.groupEligibility && !panel.productChoice.group) ||
                (panel.individualEligibility && !panel.productChoice.individual),
        );
        if (isAllproductsSelected.length === 0) {
            this.disableAddButton = true;
        }
    }
    /**
     * set plans in products list
     * @param allPlans all plan choices
     * @param product product details
     * @param carrier carrier details
     * @param policyOwnershipType type of policy ownership
     * @param approvalStatus status of approval
     * @param planType type of plan
     */
    addPlansToProductList(
        allPlans: PlanChoice[],
        product: Product,
        carrier: Carrier,
        policyOwnershipType: string,
        approvalStatus: string,
        planType: string,
    ): void {
        let productDetails: any = {};
        const planDetails = [];
        let toolTipValue;
        // eslint-disable-next-line complexity
        allPlans.forEach((selection) => {
            const states = [];
            this.planEligibleStates.forEach((planEligible) => {
                if (selection.plan.id === planEligible.planId) {
                    this.offeringStates.forEach((offeringState) => {
                        planEligible.allowedStates.forEach((eligible) => {
                            if (eligible.state.abbreviation === offeringState.abbreviation) {
                                states.push(offeringState);
                            }
                        });
                    });
                    if (
                        planEligible &&
                        planEligible.eligibility &&
                        planEligible.eligibility === AppSettings.NOT_ELIGIBLE &&
                        planEligible.inEligibleReason
                    ) {
                        let employeeEligibilityError = "";
                        if (planEligible.inEligibleReason === PlanIneligibleReasons.MAXIMUM_EMPLOYEE_EXCEEDED) {
                            employeeEligibilityError =
                                this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.maximumEmployeeRequirement"];
                        } else {
                            employeeEligibilityError =
                                this.languageStrings["primary.portal.benefitOffering.employeeMinimumPopup.mimimumRequirement"];
                        }
                        // eslint-disable-next-line max-len
                        toolTipValue = `<b>${this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.notAvailableForEnrollment"]}</b>
                            ${employeeEligibilityError}`;
                    }
                }
            });
            if (!states.length && selection.plan.carrierId === CarrierId.AFLAC_GROUP && selection.requiredSetup) {
                states.push(this.currentAccount.situs.state);
            }
            let displayValue = "";
            let statesTooltip = "";
            let taxStatusTooltip;
            switch (selection.taxStatus) {
                case TaxStatus.PRETAX:
                    taxStatusTooltip = this.language.fetchPrimaryLanguageValue(
                        "primary.portal.maintenanceBenefitsOffering.products.taxStatus.preTaxInfo",
                    );
                    break;
                case TaxStatus.POSTTAX:
                    taxStatusTooltip = this.language.fetchPrimaryLanguageValue(
                        "primary.portal.maintenanceBenefitsOffering.products.taxStatus.postTaxInfo",
                    );
                    break;
                default:
                    taxStatusTooltip = this.language.fetchPrimaryLanguageValue(
                        "primary.portal.maintenanceBenefitsOffering.products.taxStatus.prePostTaxInfo",
                    );
            }

            if (states.length < 5) {
                statesTooltip = "empty";
                states.forEach((value) => {
                    if (displayValue === "") {
                        displayValue = value.abbreviation;
                    } else {
                        displayValue = displayValue + ", " + value.abbreviation;
                    }
                });
            } else {
                states.forEach((value) => {
                    if (statesTooltip === "") {
                        statesTooltip = `<div>${value.name}</div>`;
                    } else {
                        statesTooltip = `${statesTooltip}<div>${value.name}</div>`;
                    }
                });
                displayValue = states.length + " states";
            }
            let planyearselection = null;
            if (planType === this.planYear && this.planYearResponse.length > 0) {
                this.planYearResponse.forEach((PlanYearResponses) => {
                    if (selection.planYearId === PlanYearResponses.id) {
                        planyearselection = PlanYearResponses;
                    }
                });
            }
            let planChoiceDetailValue;
            if (approvalStatus === StatusType.APPROVED) {
                this.approvedPlanChoiceDetail.forEach((planChoiceDetail) => {
                    if (planChoiceDetail.planChoiceId === selection.id) {
                        planChoiceDetailValue = planChoiceDetail;
                    }
                });
            } else if (approvalStatus === StatusType.PENDING) {
                this.unApprovedPlanChoiceDetail.forEach((planChoiceDetail) => {
                    if (planChoiceDetail.planChoiceId === selection.id) {
                        planChoiceDetailValue = planChoiceDetail;
                    }
                });
            }
            let planHighAlert = false;
            if (
                selection.plan.pricingModel === AppSettings.GROUP_RATED &&
                selection.plan.pricingEditable &&
                planChoiceDetailValue &&
                !planChoiceDetailValue.priceSet
            ) {
                planHighAlert = true;
            }
            if (selection.requiredSetup && selection.requiredSetup.length) {
                const index = selection.requiredSetup.findIndex((value) => value === RequiredSetup.ENROLLMENT);
                if (index >= 0) {
                    selection.requiredSetup.splice(index, 1);
                }
                if (selection.requiredSetup.findIndex((value) => value === RequiredSetup.CARRIER_APPROVAL) !== -1) {
                    // Added tooltipValue if carrier-forms are pending
                    toolTipValue =
                        "<b>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.notready"] +
                        "</b>" +
                        "</br>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.incompleteCarrierForm"];
                } else if (
                    selection.requiredSetup.findIndex((value) => value === RequiredSetup.CARRIER_APPROVAL) === -1 &&
                    selection.requiredSetup.findIndex((value) => value === RequiredSetup.PRICING) !== -1
                ) {
                    // Added tooltipValue if prices are not set
                    toolTipValue =
                        "<b>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.notready"] +
                        "</b>" +
                        "</br>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.eligliblitiNotSet"];
                } else if (
                    selection.requiredSetup.findIndex((value) => value === RequiredSetup.CARRIER_APPROVAL) === -1 &&
                    selection.requiredSetup.findIndex((value) => value === RequiredSetup.PRICING) === -1 &&
                    selection.requiredSetup.findIndex((value) => value === RequiredSetup.HR_APPROVAL) !== -1
                ) {
                    // Added tooltipValue if plan is waiting for approval
                    toolTipValue =
                        "<b>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.notready"] +
                        "</b>" +
                        "</br>" +
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.pendingAdminAproval"];
                } else if (selection.requiredSetup.findIndex((value) => value === RequiredSetup.HQ_APPROVAL) !== -1) {
                    // Added tooltipValue if plan is waiting for approval
                    // eslint-disable-next-line max-len
                    toolTipValue = `<b>${this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.notready"]}</b></br>${this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.hqIntegrationAdminApprovalPlan"]}`;
                }
            }
            let isExpirationDate = false;
            let tooltipMessage = "";
            if (planyearselection && selection.expirationDate) {
                isExpirationDate = planyearselection.coveragePeriod.expiresAfter !== selection.expirationDate;
                if (isExpirationDate) {
                    this.today.setHours(0, 0, 0, 0);
                    if (planyearselection.coveragePeriod.expiresAfter >= this.today) {
                        const expiresAfter = this.datepipe.transform(
                            this.dateService.toDate(planyearselection.coveragePeriod.expiresAfter || ""),
                            DateFormats.MONTH_DAY_YEAR,
                        );

                        tooltipMessage = this.languageStrings[
                            "primary.portal.maintenanceBenefitsOffering.products.planSetToRemoved"
                        ].replace("##stopDate##", expiresAfter);
                    } else {
                        const expiresAfter = this.datepipe.transform(
                            this.dateService.toDate(selection.expirationDate || ""),
                            DateFormats.MONTH_DAY_YEAR,
                        );
                        const effectiveStartDate = this.datepipe.transform(
                            this.dateService.toDate(planyearselection.enrollmentPeriod.effectiveStarting || ""),
                            DateFormats.MONTH_DAY_YEAR,
                        );
                        tooltipMessage = this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.planWasRemoved"]
                            .replace("##startDate##", effectiveStartDate)
                            .replace("##endDate##", expiresAfter);
                    }
                }
            } else if (selection.expirationDate) {
                isExpirationDate = true;
                // eslint-disable-next-line max-len
                selection.plan.name = `${selection.plan.name} ${this.languageStrings["primary.portal.maintenanceBenefitsOffering.benefitDollar.removed"]}`;
            }
            const planDetail = {
                plan: selection,
                state: displayValue,
                statesTooltip: statesTooltip,
                planYear: planyearselection,
                planChoice: planChoiceDetailValue,
                planStatus: approvalStatus,
                planTooltipValue: toolTipValue ? this.domSanitizer.bypassSecurityTrustHtml(toolTipValue) : null,
                planHighAlert: planHighAlert,
                planLowAlertTooltip:
                    selection.requiredSetup && selection.requiredSetup.length
                        ? selection.requiredSetup[0]
                        : toolTipValue
                        ? toolTipValue
                        : null,
                taxStatusTooltip,
                isDeactivated: isExpirationDate,
                tooltipValue: tooltipMessage,
                isRemovePlan: this.setRemovePlan(planyearselection),
                canUpdatePlan: (planChoiceDetailValue.enrollmentsExist && this.canManagePlan) || !planChoiceDetailValue.enrollmentsExist,
            };
            if (
                (planyearselection && planType === this.planYear && states.length > 0) ||
                (planType === this.continuous && states.length > 0)
            ) {
                planDetails.push(planDetail);
            }
        });
        let planYearToolTip = "";
        let planYearCount = 0;
        const allPlanYear = [];
        if (planType === this.planYear) {
            planDetails.forEach((eachPlanYear) => {
                if (allPlanYear.findIndex((planyear) => planyear.id === eachPlanYear.planYear.id) === -1) {
                    planYearCount += 1;
                    if (planYearToolTip === "") {
                        planYearToolTip = eachPlanYear.planYear.name;
                    } else {
                        planYearToolTip = planYearToolTip + ", " + eachPlanYear.planYear.name;
                    }
                }
                allPlanYear.push(eachPlanYear.planYear);
            });
        }
        if (planDetails.length > 0) {
            const prodIndex = this.allProducts.findIndex((prod) => prod.productName === product.name && prod.carrierName === carrier.name);
            const planLowAlertTooltip = planDetails.findIndex((plan) => plan.planLowAlertTooltip !== null);
            const pyExist = planType === this.continuous ? "false" : "true";
            let planLowAlert = false,
                productHighAlert = false;
            if (planDetails.findIndex((plan) => plan.planStatus === StatusType.PENDING) !== -1) {
                planLowAlert = true;
            }
            if (planDetails.findIndex((plan) => plan.planHighAlert === true) !== -1) {
                productHighAlert = true;
            }
            if (
                prodIndex > -1 &&
                this.allProducts[prodIndex].carrierName === carrier.name &&
                this.allProducts[prodIndex].planYear === pyExist
            ) {
                const plans = this.allProducts[prodIndex].plans.concat(planDetails);
                const existingStatus = this.allProducts[prodIndex].planLowAlert;
                const newStatus = planLowAlert;
                // ? Doing a copy because here we are filtering some plans based on plan years so it will not affect the main plans array
                const plansCopy = this.utilService.copy(plans);
                this.allProducts[prodIndex].plans = plans;
                this.allProducts[prodIndex].plansCount = plans.length;
                if (existingStatus || newStatus) {
                    this.allProducts[prodIndex].planLowAlert = true;
                }
                if (planType === this.planYear) {
                    const planYearsName = Array.from(new Set(plansCopy.map((py) => py.planYear.name)));
                    this.allProducts[prodIndex].planYears = planYearsName.length;
                    this.allProducts[prodIndex].planYearCount = planYearsName.length + " plan years";
                    this.allProducts[prodIndex].planYearToolTip = planYearsName.join(", ");
                }
            } else {
                productDetails = {
                    productName: product.name,
                    policyOwnershipType: policyOwnershipType,
                    carrierName: planDetails[0].plan.plan.carrierNameOverride ? planDetails[0].plan.plan.carrierNameOverride : carrier.name,
                    carrierId: planDetails[0].plan.plan.carrierId,
                    plansCount: planDetails.length,
                    plans: planDetails,
                    planYear: planType === this.continuous ? "false" : "true",
                    planYearToolTip: planYearToolTip,
                    planYears: planYearCount,
                    planYearCount: planYearCount + " plan years",
                    planLowAlert: planLowAlert,
                    planLowAlertTooltip: planLowAlertTooltip !== -1 ? true : false,
                    productHighAlert: productHighAlert,
                    approvalStatus: approvalStatus,
                    isAllPlansDeactivated: planDetails.filter((eachPlan) => eachPlan.isDeactivated || eachPlan.isDeactivated === "").length,
                    isRemoveAllPlans: this.setRemovePlan(planDetails[0].planYear),
                    canUpdateProduct: planDetails.every((plan) => plan.canUpdatePlan),
                };
                if (this.tppEligibleProducts.length) {
                    productDetails = this.checkPlanTppEligibility(product, productDetails);
                }
                this.allProducts.push(productDetails);
            }
        }
        if (this.allProducts.findIndex((p) => p.productHighAlert === true) !== -1) {
            this.productHighAlert.emit(true);
        }
    }

    /**
     * Method to check for product eligibility and update alert flag in productDetails
     * @param product {Product} contains product related information
     * @param productDetails {ProductDetails} contains details of the plans of respective product
     * @returns productDetails by appending a flag for alert
     */
    checkPlanTppEligibility(product: Product, productDetails: ProductDetails): ProductDetails {
        this.tppEligibleProducts.forEach((tppAccount) => {
            if (tppAccount.id) {
                const isEligible = tppAccount.eligibleProducts.find((prod) => prod.toLowerCase() === product.adminName.toLowerCase());
                if (!isEligible && !productDetails.notEligible) {
                    const toolTipValue = `<strong>${
                        this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.tppPlanNotAvailable"]
                    }</strong>
            ${this.languageStrings["primary.portal.maintenanceBenefitsOffering.products.tppAvailableDates"]
                .replace("#startDate", this.datepipe.transform(tppAccount.validity.effectiveStarting, DateFormats.MONTH_DAY_YEAR))
                .replace("#endDate", this.datepipe.transform(tppAccount.validity.expiresAfter, DateFormats.MONTH_DAY_YEAR))} `;
                    productDetails.plans.forEach((plan) => {
                        const coverageStartDate = plan.planYear
                            ? this.dateService.toDate(plan.planYear.coveragePeriod.effectiveStarting)
                            : this.dateService.toDate(plan.plan.enrollmentStartDate);
                        if (
                            coverageStartDate <= this.dateService.toDate(tppAccount.validity.effectiveStarting) ||
                            coverageStartDate <= this.dateService.toDate(tppAccount.validity.expiresAfter)
                        ) {
                            productDetails.notEligible = true;
                            plan.tppAlert = toolTipValue;
                        }
                    });
                }
            }
        });
        return productDetails;
    }

    /**
     * verify plan choices required admin approval
     */
    checkUnApprovedProducts(): void {
        const approvalRequests = this.utilService.copy(this.approvalRequestStatusArray);
        approvalRequests.forEach((request, index) => {
            if (request.status === StatusType.NOT_SUBMITTED) {
                this.approvalRequestStatusArray.splice(index, 1);
            }
        });
        const recentApprovalRequest = this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1];
        if (
            (recentApprovalRequest &&
                this.unApprovedActivePlanChoices.length &&
                recentApprovalRequest.status !== StatusType.SUBMITTED_TO_HQ &&
                recentApprovalRequest.status !== StatusType.SUBMITTED_TO_HR &&
                recentApprovalRequest.status !== StatusType.DECLINED) ||
            (this.unApprovedActivePlanChoices.length && approvalRequests.length === 0)
        ) {
            this.quasiService.isApprovalRequired$.next({
                status: true,
                plans: this.unApprovedActivePlanChoices.filter((res) => res.requiredSetup).length,
                isAGPlansInvolved: this.unApprovedActivePlanChoices.some(
                    (planChoice) => planChoice.requiredSetup && planChoice.plan.carrierId === CarrierId.AFLAC_GROUP,
                ),
                isNonAGPlansInvolved: this.unApprovedActivePlanChoices.some(
                    (planChoice) => planChoice.requiredSetup && planChoice.plan.carrierId !== CarrierId.AFLAC_GROUP,
                ),
            });
        }
        if (recentApprovalRequest && recentApprovalRequest.status === StatusType.DECLINED && this.unApprovedActivePlanChoices.length) {
            this.quasiService.setDeclineAlert({
                status: StatusType.DECLINED,
                plans: this.unApprovedActivePlanChoices.filter((data) => data.requiredSetup).length,
            });
            this.unApprovedActiveVAS = this.quasiService.getAllVasPlans();
            if (
                this.unApprovedActivePlanChoices.filter(
                    (data) =>
                        this.unApprovedActiveVAS.find((value) => value.id === data.plan.id) ||
                        this.carriersForApproval.find((value) => value === data.plan.carrierId.toString()),
                ).length > VALUE_ZERO
            ) {
                this.quasiService.setUnapprovedCarrierPlans(true);
            } else {
                this.quasiService.setUnapprovedCarrierPlans(false);
            }
        }
    }
    // To display state column values based on length
    displayValues(values: any, option: string, from: string): any {
        let displayValue = "";
        if (option === "tooltip") {
            for (const value of values) {
                displayValue += value.name + "\n";
            }
        } else if (values.length < 5) {
            for (const value of values) {
                displayValue += value.abbreviation + ", ";
            }
        } else {
            displayValue = values.length + " states";
        }
        return displayValue.replace(/,\s*$/, "").replace(/\n*$/, "");
    }
    sendData({ alert, plan }: { alert?: number; plan?: number } = {}): void {
        this.approvalStatusAlertObject = { plan: plan, tabAlert: alert };
        this.emitUnApprovedProducts.emit(this.approvalStatusAlertObject);
    }
    /**
     * This method sets product status
     */
    setProductStatus(): void {
        if (
            this.approvalRequestStatusArray.length &&
            (this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status === StatusType.SUBMITTED_TO_HQ ||
                this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status === StatusType.SUBMITTED_TO_HR)
        ) {
            this.approvalStatusPending = true;
            const plansCount: number = this.benefitOfferingHelperService.getPlansCountToDisplayInPendingAlert(
                this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1],
                this.planChoicesUnapproved,
            );
            this.plansEffected = plansCount;
            this.emitUnApprovedProducts.emit({
                status: this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status,
                plans: plansCount,
            });
        }
        // eslint-disable-next-line sonarjs/no-collapsible-if
        this.allProducts.forEach((product) => {
            this.planHighAlert = false;
            if (product.approvalStatus === StatusType.APPROVED) {
                let plansCounter = 0,
                    subscriptionCounter = 0;
                product.plans.forEach((element) => {
                    if (element.plan.plan.pricingModel === AppSettings.GROUP_RATED && element.plan.plan.pricingEditable) {
                        plansCounter++;
                        const planChoiceDetail = this.approvedPlanChoiceDetail.find(
                            (planChoice) => planChoice.planChoiceId === element.plan.id,
                        );
                        if (planChoiceDetail) {
                            subscriptionCounter++;
                            if (planChoiceDetail.priceSet) {
                                this.planHighAlert = true;
                            }
                            if (this.planHighAlert) {
                                this.highAlert++;
                            }
                            if (subscriptionCounter === plansCounter) {
                                this.sendData({
                                    plan: this.plansEffected,
                                    alert: this.highAlert,
                                });
                            }
                        } else {
                            subscriptionCounter++;
                            if (subscriptionCounter === plansCounter) {
                                this.sendData({ plan: this.plansEffected, alert: this.highAlert });
                            }
                        }
                    }
                });
            } else {
                let plansCounter = 0,
                    subscriptionCounter = 0;
                product.plans.forEach((element) => {
                    if (element.plan.plan.pricingModel === AppSettings.GROUP_RATED && element.plan.plan.pricingEditable) {
                        plansCounter++;
                        const planChoiceDetail = this.unApprovedPlanChoiceDetail.find(
                            (planChoice) => planChoice.planChoiceId === element.plan.id,
                        );
                        if (planChoiceDetail) {
                            subscriptionCounter++;
                            if (planChoiceDetail.priceSet) {
                                this.planHighAlert = true;
                            }
                            if (this.planHighAlert) {
                                this.highAlert++;
                            }
                            if (subscriptionCounter === plansCounter) {
                                this.sendData({
                                    plan: this.plansEffected,
                                    alert: this.highAlert,
                                });
                            }
                        } else {
                            subscriptionCounter++;
                            if (subscriptionCounter === plansCounter) {
                                this.sendData({ plan: this.plansEffected, alert: this.highAlert });
                            }
                        }
                    }
                });
            }
        });
    }
    removePlan(requiredDetails: any, productDetails: any): void {
        this.isEnrollmentExist = false;
        const deletedPlan: DeletePlanChoice = {};
        const choiceId = requiredDetails.plan.id;
        const continuous = requiredDetails.plan.continuous;
        if (continuous) {
            this.enrollmentStartDate = requiredDetails.plan.enrollmentStartDate;
            this.enrollmentStartDateValue = this.dateService.toDate(this.enrollmentStartDate);
        } else {
            this.enrollmentStartDate = requiredDetails.planYear.enrollmentPeriod.effectiveStarting;
            this.enrollmentStartDateValue = this.dateService.toDate(this.enrollmentStartDate);
            this.enrollmentEndDate = requiredDetails.planYear.enrollmentPeriod.expiresAfter;
            this.enrollmentEndDateValue = this.dateService.toDate(this.enrollmentEndDate);
        }
        const isEnrollmentFalse = requiredDetails.planChoice;
        if (isEnrollmentFalse.enrollmentsExist) {
            this.isEnrollmentExist = true;
        }
        const planToRemove: RemovePlansDialogData = {
            route: this.route,
            mpGroup: this.mpGroup,
            deletedPlan: deletedPlan,
            choiceId: choiceId,
            continuous: continuous,
            enrollmentStartDate: this.enrollmentStartDate,
            planDetails: requiredDetails,
            productDetails: productDetails,
        };
        if (this.isEnrollmentExist && !this.isAflacPartner) {
            const stopOfferingDialogRef = this.dialog.open(StopOfferingComponent, {
                backdropClass: "backdrop-blur",
                width: "600px",
                data: planToRemove,
            });
            this.afterDialogClose(stopOfferingDialogRef);
        } else {
            planToRemove.enrollmentEndDate = this.enrollmentEndDate;
            const removeDialogRef = this.dialog.open(RemovePlanComponent, {
                backdropClass: "backdrop-blur",
                width: "600px",
                data: planToRemove,
            });
            this.afterDialogClose(removeDialogRef);
        }
    }
    /**
     * Method to set maintenance required data and retrieve product panel data
     * This will reload and disable the deactivated records
     * @param dialogRef is the reference for MatDialogRef
     */
    afterDialogClose(dialogRef: MatDialogRef<StopOfferingComponent | RemovePlanComponent>): void {
        dialogRef
            .afterClosed()
            .pipe(
                tap((planInfo) => {
                    if (planInfo && planInfo.data) {
                        this.removedPlanId = planInfo.data.planId;
                        this.isPlanDisabled = planInfo.data.disableCondition;
                    }
                    this.isLoading = true;
                    this.hasApiError = false;
                }),
                switchMap(() => this.store.dispatch(new SetMaintenanceRequiredData())),
                switchMap(() => this.store.dispatch(new GetProductsPanel())),
                switchMap(() => this.serviceCalls()),
                catchError((error) => {
                    this.isLoading = false;
                    this.hasApiError = true;
                    this.errorMessage = "primary.portal.common.servertimeout";
                    return EMPTY;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to open remove plan component or stop offering component popup
     * This will also open popup of remove plan year plans component
     * @param productDetails represents product details
     */
    RemoveAllPlan(productDetails: any): void {
        let isPlanYear = false;
        this.choiceObservable = [];
        let count = 0;
        let lengthCount = 0;
        if (productDetails.planYear === "false") {
            this.enrollmentStartDate = productDetails.plans[0].plan.enrollmentStartDate;
        } else {
            isPlanYear = true;
            this.enrollmentStartDate = productDetails.plans[0].planYear.enrollmentPeriod.effectiveStarting;
            this.enrollmentEndDate = productDetails.plans[0].planYear.enrollmentPeriod.expiresAfter;
        }
        productDetails.plans
            .map((element) => element.planChoice)
            .forEach((value) => {
                lengthCount++;
                if (value.enrollmentsExist) {
                    this.isEnrollmentExist = true;
                    count++;
                }
            });
        if (lengthCount === productDetails.plans.length) {
            if (count > 0 && !this.isAflacPartner) {
                const stopOfferingDialog = this.dialog.open(StopOfferingProductComponent, {
                    backdropClass: "backdrop-blur",
                    width: "600px",
                    data: {
                        route: this.route,
                        mpGroup: this.mpGroup,
                        details: productDetails,
                        isPlanYear: productDetails.planYear,
                    },
                });
                this.afterRemoveAllDialogClose(stopOfferingDialog);
            } else if (isPlanYear && productDetails.planYearToolTip.split(SYMBOLS.COMMA).length > 1) {
                this.removePlanYearPlans(productDetails);
            } else {
                // remove all dialog box
                this.removeAllPlans(productDetails).pipe(takeUntil(this.unsubscribe$)).subscribe();
            }
        }
    }
    /**
     * Method to open remove plan component popup and call to handle close operation.
     * @param productDetails represents product details
     * @param planYearId represents plan year id
     * @param planYearTooltip represents plan year tooltip
     * @returns observable of string array
     */
    removeAllPlans(productDetails: ProductDetails, planYearId?: number, planYearTooltip?: string): Observable<void | string[]> {
        const removeAllPlansDialogRef = this.dialog.open(RemoveAllPlansComponent, {
            backdropClass: "backdrop-blur",
            width: "600px",
            data: {
                route: this.route,
                detail: productDetails,
                mpGroup: this.mpGroup,
                enrollmentStartDate: this.enrollmentStartDate,
                enrollmentEndDate: this.enrollmentEndDate,
                selectedPlanYearId: planYearId,
                planYearTooltipMsg: planYearTooltip,
            },
        });
        return this.afterRemoveAllDialogClose(removeAllPlansDialogRef);
    }
    /**
     * Method to handle close operation of Remove All plans component.
     * @param dialogRef represents Material Dialog Reference
     * @returns observable of string array
     */
    afterRemoveAllDialogClose(
        dialogRef: MatDialogRef<StopOfferingProductComponent | RemoveAllPlansComponent>,
    ): Observable<void | string[]> {
        return dialogRef.afterClosed().pipe(
            tap((data) => {
                if (data.data) {
                    this.isProductDisabled = data.data;
                    this.isLoading = true;
                    this.hasApiError = false;
                }
            }),
            switchMap(() => this.store.dispatch(new SetMaintenanceRequiredData())),
            switchMap(() => this.store.dispatch(new GetProductsPanel())),
            switchMap(() => this.serviceCalls()),
            catchError((error) => {
                this.isLoading = false;
                this.hasApiError = true;
                this.errorMessage = "primary.portal.common.servertimeout";
                return of([]);
            }),
        );
    }
    /**
     * Method to open remove plan year plan component popup and call to handle close operation.
     * @param productDetails represents product details
     */
    removePlanYearPlans(productDetails: ProductDetails): void {
        const removeAllPlansDialogRef: MatDialogRef<RemovePlanYearPlansComponent, any> = this.empoweredModalService.openDialog(
            RemovePlanYearPlansComponent,
            {
                data: {
                    route: this.route,
                    detail: productDetails,
                    mpGroup: this.mpGroup,
                    enrollmentStartDate: this.enrollmentStartDate,
                    enrollmentEndDate: this.enrollmentEndDate,
                },
            },
        );
        this.afterRemovePlanYearPlansDialogClose(removeAllPlansDialogRef);
    }
    /**
     * Method to handle close operation of Remove plan year plans component.
     * @param dialogRef represents Material Dialog Reference
     */
    afterRemovePlanYearPlansDialogClose(dialogRef: MatDialogRef<RemovePlanYearPlansComponent>): void {
        dialogRef
            .afterClosed()
            .pipe(
                switchMap((data) => {
                    if (data.data) {
                        return this.removeAllPlans(data.data, data.planYearId, data.planYearTooltipMsg);
                    }
                    return of([]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((data) => {
                this.isLoading = false;
                this.hasApiError = false;
            });
    }

    /**
     * This method will execute on click of add-products button
     */
    addProducts(): void {
        const productDialogRef = this.dialog.open(ProductsPlansQuasiComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-products",
            backdropClass: "backdrop-blur",
            data: {
                route: this.route,
                opensFrom: "products",
                planType: "true",
                planYears: this.planYearResponse.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL),
            },
        });
        this.afterDialogClosed(productDialogRef);
    }
    /**
     * This method is used to map plan choices and product choices to new plan-year panel
     * @param productDetail is current expanded product detail item
     */
    addPlanChoices(productDetail: ProductDetailModel): void {
        this.isLoading = true;
        if (productDetail.plans.length) {
            const productId = productDetail.plans[0].plan.plan.productId;
            const choice: ProductSelection = {
                id: productId,
                individual: productDetail.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
                group: productDetail.policyOwnershipType === PolicyOwnershipType.GROUP,
            };
            this.store.dispatch(new MapProductChoiceToNewPlanYearPanel([choice]));
            const productSpecificPlanChoices: PlanChoice[] = productDetail.plans
                .filter(
                    (planDetail) =>
                        !planDetail.plan.expirationDate ||
                        this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(planDetail.plan.expirationDate || ""), new Date()),
                )
                .map((planDetail) => planDetail.plan);
            this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(productSpecificPlanChoices));
            this.store.dispatch(new SetUserPlanChoice(productSpecificPlanChoices));
        }
        this.isLoading = false;
    }
    /**
     * This method is used to open manage-plans quasi modal
     * @param productDetail is selected product detail
     * @param planOwnershipType is planType while represents whether it is a planYear plan or continuous plan
     */
    managePlansSelection(productDetail: ProductDetailModel, planOwnershipType: string): void {
        this.store.dispatch(new SetNewPlanYearPanel());
        this.addPlanChoices(productDetail);
        const managePlansDialogRef = this.dialog.open(ProductsPlansQuasiComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-products",
            backdropClass: "backdrop-blur",
            data: {
                route: this.route,
                opensFrom: "plans",
                planType: planOwnershipType,
                productInformation: productDetail,
                planYears: this.planYearResponse.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL),
            },
        });
        this.afterDialogClosed(managePlansDialogRef);
    }

    updateAvailability(productDetail: any, opensFrom: any): void {
        const updateAvailabilityRef = this.dialog.open(ManagePlansUpdateAvailabilityComponent, {
            backdropClass: "backdrop-blur",
            width: "600px",
            data: {
                route: this.route,
                mpGroup: this.mpGroup,
                productDetails: productDetail,
                opensFrom: opensFrom,
            },
        });
        updateAvailabilityRef.afterClosed().subscribe((resp) => {
            if (resp === this.constantSave) {
                this.reinitiateServiceCalls();
            }
        });
    }
    copyPlansToNewPlanYear(productDetail: any): void {
        const copyPlansDialogRef = this.dialog.open(CopyAllPlansComponent, {
            width: "700px",
            data: {
                route: this.route,
                mpGroup: this.mpGroup,
                productDetail: productDetail,
            },
        });
        copyPlansDialogRef.afterClosed().subscribe((response) => {
            if (response === this.constantSave) {
                this.reinitiateServiceCalls();
            }
        });
    }
    clearAvailabilityFilter(): void {
        this.filters.controls.availability.reset();
        this.filters.controls.date.reset();
        this.availabilityFilter = "";
        if (this.availabilityFilterRef) {
            this.availabilityFilterRef.close();
        }
        this.filters.controls.date.setValue(new Date());
        this.applyFilters();
    }
    clearStatusFilter(): void {
        this.filters.controls.status.reset();
        this.statusFilter = "";
        if (this.statusFilterRef) {
            this.statusFilterRef.close();
        }
        this.applyFilters();
    }
    applyFilters(): void {
        if (!this.unFilteredProducts.length) {
            this.closeFilters();
            return;
        }
        this.allProducts = this.unFilteredProducts;
        const availability = this.filters.value.availability;
        const status = this.filters.value.status;
        if (availability || status) {
            this.availabilityFilter =
                availability === "date"
                    ? this.datepipe.transform(this.filters.value.date, AppSettings.DATE_FORMAT_MM_DD_YYYY)
                    : availability;
            this.availabilityLabel = availability;
            this.statusFilter = status;
            if (availability && availability === "Continuous") {
                const filteredData = this.allProducts.filter((data) => data.planYear === "false");
                this.allProducts = filteredData;
            } else if (availability && availability !== "Continuous" && availability !== "date") {
                this.availabilityFilter = availability.name;
                const filteredData = [];
                this.allProducts.forEach((data) => {
                    const dataSet = this.utilService.copy(data);
                    const filteredPlans = [];
                    if (data.planYear === "true") {
                        dataSet.plans.forEach((plans) => {
                            if (plans.planYear.id === availability.id) {
                                filteredPlans.push(plans);
                            }
                        });
                        if (filteredPlans.length) {
                            const planCopy = this.utilService.copy(filteredPlans);
                            dataSet.plans = filteredPlans;
                            dataSet.plansCount = filteredPlans.length;
                            const planYears = Array.from(
                                new Set(
                                    // eslint-disable-next-line prefer-spread
                                    [].concat.apply(
                                        [],
                                        planCopy.map((x) => x.planYear.name),
                                    ),
                                ),
                            );
                            dataSet.planYears = planYears.length;
                            dataSet.planYearCount = `${dataSet.planYears} plan years`;
                            dataSet.planYearToolTip = planYears;
                            filteredData.push(dataSet);
                        }
                    }
                });
                this.allProducts = filteredData;
            } else if (availability && availability === "date") {
                const userInputDate = this.datepipe.transform(this.filters.value.date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                const currentDate = this.datepipe.transform(new Date(), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                if (this.dateService.toDate(userInputDate) < this.dateService.toDate(currentDate)) {
                    this.pastDate = true;
                } else {
                    this.pastDate = false;
                }
                const filteredData = [];
                this.allProducts.forEach((data) => {
                    const dataSet = this.utilService.copy(data);
                    const filteredPlans = [];
                    if (data.planYear === "false" && data.plans.length && data.plans[0].plan) {
                        dataSet.plans.forEach((plans) => {
                            const enrollmentStartDate = this.datepipe.transform(
                                plans.plan.enrollmentStartDate,
                                AppSettings.DATE_FORMAT_MM_DD_YYYY,
                            );
                            if (this.dateService.toDate(userInputDate) >= this.dateService.toDate(enrollmentStartDate)) {
                                filteredPlans.push(plans);
                            }
                        });
                        if (filteredPlans.length) {
                            dataSet.plans = filteredPlans;
                            dataSet.plansCount = filteredPlans.length;
                            filteredData.push(dataSet);
                        }
                    } else if (data.planYear === "true" && data.plans.length && data.plans[0].planYear) {
                        dataSet.plans.forEach((plans) => {
                            const enrollmentStartDate = this.datepipe.transform(
                                plans.planYear.enrollmentPeriod.effectiveStarting,
                                AppSettings.DATE_FORMAT_MM_DD_YYYY,
                            );
                            const enrollmentEndDate = this.datepipe.transform(
                                plans.planYear.enrollmentPeriod.expiresAfter,
                                AppSettings.DATE_FORMAT_MM_DD_YYYY,
                            );
                            if (
                                this.dateService.toDate(userInputDate) >= this.dateService.toDate(enrollmentStartDate) &&
                                this.dateService.toDate(userInputDate) <= this.dateService.toDate(enrollmentEndDate)
                            ) {
                                filteredPlans.push(plans);
                            }
                        });
                        if (filteredPlans.length) {
                            const planCopy = this.utilService.copy(filteredPlans);
                            dataSet.plans = filteredPlans;
                            dataSet.plansCount = filteredPlans.length;
                            const planYears = Array.from(
                                new Set(
                                    // eslint-disable-next-line prefer-spread
                                    [].concat.apply(
                                        [],
                                        planCopy.map((x) => x.planYear.name),
                                    ),
                                ),
                            );
                            dataSet.planYears = planYears.length;
                            dataSet.planYearCount = `${dataSet.planYears} plan years`;
                            dataSet.planYearToolTip = planYears;
                            filteredData.push(dataSet);
                        }
                    }
                });
                this.allProducts = filteredData;
            }
            if (status) {
                const plans = this.allProducts.map((data) => data.plans);

                const filteredData = plans.map((mdata) => mdata.filter((fdata) => fdata.planStatus === status.toUpperCase()));
                const productList = this.utilService.copy(this.allProducts);
                productList.forEach((prod, index) => {
                    if (filteredData[index].length) {
                        prod.plans = filteredData[index];
                    } else {
                        prod.plans = [];
                    }
                });
                this.allProducts = productList.filter((data) => data.plans.length > 0);
                this.allProducts.forEach((data, index) => {
                    this.allProducts[index].plansCount = data.plans.length;
                    if (data.planYear === "true") {
                        const plansCopy = this.utilService.copy(data.plans);
                        const planYearsName = Array.from(new Set(plansCopy.map((py) => py.planYear.name)));
                        this.allProducts[index].planYears = planYearsName.length;
                        this.allProducts[index].planYearCount = planYearsName.length + " plan years";
                        this.allProducts[index].planYearToolTip = planYearsName.join(", ");
                    }
                });
            }
        }
        this.closeFilters();
    }
    filtersTapped(): void {
        if (!this.availabilityFilter) {
            this.filters.controls.availability.reset();
            this.filters.controls.date.reset();
            this.filters.controls.date.setValue(new Date());
        } else {
            this.filters.controls.availability.setValue(this.availabilityLabel);
        }
        if (!this.statusFilter) {
            this.filters.controls.status.reset();
        } else {
            this.filters.controls.status.setValue(this.statusFilter);
        }
    }
    viewEditPrice(): void {
        const productDialogRef = this.dialog.open(EditPricingEligibilityQuasiComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "add-products",
            backdropClass: "backdrop-blur",
        });
    }
    /**
     * This method is used to get account maintenance lock status
     */
    getAccountMaintenanceLockStatus(): Observable<void> {
        return this.appTakerService.getMaintananceLock(this.mpGroup.toString()).pipe(
            takeUntil(this.unsubscribe$),
            catchError((error) => of(error)),
            tap((response) => {
                this.accountLocked = !response;
                this.setIsRequestPendingFlag();
            }),
        );
    }
    /**
     * This method is used to set approval request pending alert
     */
    setIsRequestPendingFlag(): void {
        const recentApprovalRequest = this.utilService.copy(this.approvalRequests).pop();
        this.isRequestPending = false;
        if (
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HQ) ||
            (recentApprovalRequest && recentApprovalRequest.status === StatusType.SUBMITTED_TO_HR) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.locked && this.accountLocked) ||
            (this.currentAccount && this.currentAccount.status && this.currentAccount.status === AppSettings.INACTIVE)
        ) {
            this.isRequestPending = true;
        }
    }

    // This method is used to clear store and clear product, plans variables in service
    resetPanelProducts(): void {
        this.quasiService.resetQuasiObservableValues();
        this.quasiService.resetQuasiStoreValues();
        this.reinitiateServiceCalls();
    }

    /**
     * This method is used to recall all service calls and dispatch actions
     */
    reinitiateServiceCalls(): void {
        this.isLoading = true;
        this.store
            .dispatch(new SetMaintenanceRequiredData())
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.store.dispatch(new GetProductsPanel())),
                switchMap((resp) => this.store.dispatch(new SetUnapprovedPanel())),
                switchMap(() => this.serviceCalls()),
            )
            .subscribe();
    }
    /**
     * This method is used to assign display columns in accordion based on logged in user
     *
     * @param this.isAdmin is a boolean which says whether logged in user is admin or not
     * @param this.productDisplayedColumns is columns array of products accordion which vary on logged-in user
     */
    getCredential(): void {
        if (this.isAdmin) {
            this.productDisplayedColumns = ["plan", "states", "preTax", "agentAssistance", "EnrollmentDetails", "pricing"];
        } else {
            this.productDisplayedColumns = [
                "plan",
                "states",
                "preTax",
                "agentAssistance",
                "EnrollmentDetails",
                "pricing",
                "status",
                "manage",
            ];
        }
    }
    /**
     * This method is used to close filter after null check
     * @param this.availabilityFilterRef is reference of availability filter
     * @param this.statusFilterRef is reference of status filter
     */
    closeFilters(): void {
        if (this.availabilityFilterRef) {
            this.availabilityFilterRef.close();
        }
        if (this.statusFilterRef) {
            this.statusFilterRef.close();
        }
    }
    /**
     * This method will execute once after the quasi modal is closed
     * @param dialogRef is current dialogRef of quasi modal
     */
    afterDialogClosed(dialogRef: MatDialogRef<ProductsPlansQuasiComponent>): void {
        let isSaved: string;
        dialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((resp) => {
                    this.isLoading = true;
                    dialogRef.close();
                    isSaved = resp;
                    if (resp === this.constantSave) {
                        this.resetPanelProducts();
                    }
                }),
                switchMap((resp) =>
                    this.aflacService.getAflacGroupRefreshStatus(this.currentAccount.id).pipe(catchError((error) => of(null))),
                ),
                tap((refreshStatus) => {
                    if (refreshStatus) {
                        this.checkForRenewal(refreshStatus);
                    }
                }),
                filter((refreshStatus) => isSaved !== this.constantSave),
                switchMap((resp) => this.accountService.clearPendingElements(this.mpGroup).pipe(takeUntil(this.unsubscribe$))),
                catchError((error) => of(error)),
            )
            .subscribe(
                () => {
                    this.resetPanelProducts();
                },
                (error) => {
                    this.resetPanelProducts();
                },
            );
    }
    /**
     * function to check plan year will be ending within 90 days
     */
    checkPlanYearEnding(): void {
        const approvedPlanChoices: PlanChoice[] = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        const unApprovedPlanChoices: PlanChoice[] = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.planYearEndingCounts = this.quasiService.checkPlanYearEnding(
            approvedPlanChoices,
            unApprovedPlanChoices,
            this.planYearResponse,
        );
        this.planYearEnding.emit(this.planYearEndingCounts);
    }

    /**
     * Function to hide/show remove plan option
     * @param planYear selected plan year details
     * @return true/false depending upon enrollment end date
     */
    setRemovePlan(planYear: PlanYear): boolean {
        if (planYear) {
            const enrollmentEndDate = this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter);
            enrollmentEndDate.setHours(0, 0, 0, 0);
            this.today.setHours(0, 0, 0, 0);
            return enrollmentEndDate <= this.today;
        }
        return false;
    }
    /**
     * Function to get active TPP accounts
     */
    getActiveTPP(): void {
        combineLatest([
            this.benefitOfferingHelperService.getThirdPartyPlatformRequirements(),
            this.staticUtilService.cacheConfigValue("general.tpp.eligible_products_map"),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([tppResponse, configResponse]) => {
                this.activeTpp = tppResponse.applicableThirdPartyPlatforms;
                if (this.activeTpp && this.activeTpp.length) {
                    this.checkConfigTPP(configResponse);
                }
            });
    }

    /**
     * Method to get config Response and map with active TPP accounts to filter eligible products
     * @param configResponse value of config response
     */
    checkConfigTPP(configResponse: string): void {
        const TPPArray = configResponse.split(SYMBOLS.SEMICOLON);
        TPPArray.forEach((obj) => {
            const TPPId = obj.split(SYMBOLS.EQUAL)[TPP_INDEX_ZERO];
            let products = obj.split(SYMBOLS.EQUAL)[1].split(SYMBOLS.COMMA);
            products[TPP_INDEX_ZERO] = products[TPP_INDEX_ZERO].replace(SYMBOLS.OPEN_BRACE, "");
            products[products.length - 1] = products[products.length - 1].replace(SYMBOLS.CLOSE_BRACE, "");
            products = products.map((product) => {
                switch (product) {
                    case PRODUCT_NAME.JWL:
                        return ProductNames.JUVENILE_WHOLE_LIFE;
                    case PRODUCT_NAME.JTL:
                        return ProductNames.JUVENILE_TERM_LIFE;
                    case PRODUCT_NAME.TL:
                        return ProductNames.TERM_LIFE;
                    case PRODUCT_NAME.WL:
                        return ProductNames.WHOLE_LIFE;
                    default:
                        return product;
                }
            });
            const activeTPPProduct = this.activeTpp.filter((tppProduct) => tppProduct.thirdPartyPlatform.id.toString() === TPPId);
            if (activeTPPProduct.length && this.dateService.toDate(activeTPPProduct[TPP_INDEX_ZERO].validity.expiresAfter) >= new Date()) {
                this.tppEligibleProducts.push({
                    id: TPPId,
                    eligibleProducts: products,
                    validity: activeTPPProduct[TPP_INDEX_ZERO].validity,
                });
            }
        });
        this.tppEligibleProducts.sort(
            (plan1, plan2) =>
                this.dateService.toDate(plan1.validity.effectiveStarting).getTime() -
                this.dateService.toDate(plan2.validity.effectiveStarting).getTime(),
        );
    }
    /**
     * This method is used to open view ag prices quasi modal
     * @param planChoice is selected planChoice detail object
     * @param planYear is the planYear of selected planChoice
     */
    viewAGPrices(planChoice: PlanChoice, planYear: PlanYear): void {
        this.empoweredSheetService.openSheet(AgViewPricesComponent, {
            data: {
                planChoiceDetail: planChoice,
                mpGroup: this.mpGroup,
                planYearDetail: planYear,
            },
        });
    }

    /**
     * ng life cycle hook
     * used to unsubscribe all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
