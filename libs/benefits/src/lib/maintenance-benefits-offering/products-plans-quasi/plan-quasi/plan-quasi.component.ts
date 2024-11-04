import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { MatRadioChange } from "@angular/material/radio";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import {
    PlansColumns,
    BenefitsOfferingService,
    DeletePlanChoice,
    PlanIneligibleReasons,
    ProductSelection,
    RSLIEligibility,
    Eligibility,
    AccountContacts,
    AccountService,
    ApprovalRequestStatus,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";

import {
    BenefitsOfferingState,
    GetRSLIEligibility,
    MapPlanChoicesToNewPlanYearPanel,
    MapPlanChoicesToPlans,
    MapProductChoiceToNewPlanYearPanel,
    SetPlanChoices,
    SetUnapprovedPlanChoicesWithPayload,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { MonDialogComponent, DataFilter, SortStatesPipe, PlanDetailsComponent, AddUpdateContactInfoComponent } from "@empowered/ui";
import { takeUntil, filter, tap, mergeMap, catchError, map, switchMap } from "rxjs/operators";
import { Subject, forkJoin, of, combineLatest, Observable } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import { BenefitOfferingHelperService } from "../../../benefit-offering-helper.service";
import {
    CarrierId,
    ClientErrorResponseCode,
    Permission,
    CarrierIdType,
    ArgusConfig,
    MIN_PLHSO_NON_PLHSO_PLAN_SELECT_FOR_FL_STATE,
    StateAbbreviations,
    ArgusPlanId,
    ArgusLanguage,
    CarrierType,
    PanelModel,
    ProductId,
    UserPermissionList,
    AppSettings,
    Exceptions,
    PlanChoice,
    Characteristics,
    ExceptionType,
    CompanyCode,
    TaxStatus,
    PlanYearType,
    PolicyOwnershipType,
    PlanYear,
    AddUpdateContactDialogData,
    ArgusCarrier,
    PlanPanel,
    VasFunding,
    ConfigName,
    PrimaryLanguage,
    PlansProductData,
    ArgusADVTiers,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const PLANS = "plans";
const NEW_PLANYEAR = "new_plan";
const VISION_PLAN = "Vision";
const DENTAL_PLAN = "Dental";
const LTD_PLAN = "Long-Term Disability";
const BASIC_LIFE = "Basic Life";
const RESTRICTED_STATES_LIST = 0;
const MIN_AFLAC_FOR_VAS = 1;
const NEXT_DEFAULT_PLAN_POSITION = 4;
const RADIX_TEN = 10;
const SINGLE_CARRIER_RESTRICTED_PLANS_COUNT = 1;
const ACCOUNT = "ACCOUNT";
const BILLING = 2;
const BENEFIT_ELIGIBLE_EMPLOYEE_COUNT = "benefit_eligible_emp_count";
const GROUP_EMPLOYEE_COUNT = "group_emp_count";
interface CarrierMap {
    carrier: string;
    ids: string[];
}

const SELECTED = "selected";

@Component({
    selector: "empowered-plan-quasi",
    templateUrl: "./plan-quasi.component.html",
    styleUrls: ["./plan-quasi.component.scss"],
    providers: [DataFilter],
})
export class PlanQuasiComponent implements OnInit, OnDestroy {
    form: FormGroup;
    allPlans = new MatTableDataSource<any>();
    plans = [];
    plansToCompare = [];
    productList: PlansProductData[] = [];
    plansList: PlanPanel[] = [];
    displayedPlansColumns: string[] = ["selected", "carrier", "planName", "riders", "states", "preTax"];
    // Variables declared  for checkboxes to implement Select all functionality
    fromPlans = "selected";
    fromPretax = "preTax";
    fromCarriers = "carrier";
    fromRiders = "riders";
    fromStates = "states";
    readonly erSelected = "erSelected";
    readonly eeSelected = "eeSelected";
    fromAssistanceRequired = "agentAssisted";
    numRows = [];
    selection = [];
    selectedPlan: PlanPanel;

    alertDialogRef: MatDialogRef<MonDialogComponent>;
    productId: string;
    productIdNumber: string;
    presentProductIndex = 1;
    isNoneSelected = false;
    isSelected: boolean;
    preTaxSetPerPlan = false;
    assitancePerCarrier = false;
    isError = false;
    isSingleAflacError = false;
    isReceivingHQ = true;
    isADVEROption = false;
    isERSelected: boolean;
    errorMessage: string;
    minEligibleCountMsg: string;
    eligibleEmployeeCount: number;
    minimumAflacToSelect: number;
    filtersData = [];
    isDisplayFilter = [];
    filterValue = [];
    filter;
    isPreTax = false;
    isPostTax = false;
    isVariable = false;
    errorFlag: boolean;
    isOEEnded = false;
    isExceptionProduct: boolean;
    plansSelected: PlanPanel[] = [];
    filterClassNames = {
        carriers: ["list-grid-filter", "filter-carriers", "filter-checkbox"],
        riders: ["list-grid-filter", "filter-riders", "filter-checkbox"],
        state: ["list-grid-filter", "filter-planstate", "filter-checkbox"],
    };
    planChoiceIdToUpdate: number[] = [];
    @ViewChild("carriersFilterDropdown") carriersFilterDropdown: MatSelect;
    @ViewChild("ridersFilterDropdown") ridersFilterDropdown: MatSelect;
    @ViewChild("statesFilterDropdown") statesFilterDropdown: MatSelect;
    @ViewChild("preTaxCheckbox") preTaxCheckbox;
    backButtonClicked = true;
    isHQFunded: boolean;
    isEmpFunded: boolean;
    disablePlanOption = false;
    skipHQFunded = false;
    selectedHQFundedProductIds: number[] = [];
    isPreTaxEligible: boolean;
    isLoading = true;
    mpGroup: number;
    filterOpen = false;
    private unsubscribe$ = new Subject<void>();
    SortPipe = new SortStatesPipe();
    benefitOfferingStates = [];
    planYearChoice: boolean;
    managePlanYearChoice: boolean;
    planYearId: number;
    isAllowChange = false;
    isCarrierSelected = false;
    hasCarrierRestriction = false;
    restrictedCarriers: { text: string; carrierIds: number[]; disabled: boolean }[] = [];
    isRestrictedToSinglePlan = false;
    carrierChoice: { carrierId: number; productId: string; carrierName: string; productName: string };
    restrictedStatesrow: {
        name: string;
        agentAssisted: boolean;
        agentAssistedDisabled: boolean;
        policyOwnershipType: string;
    };
    selectedCarriers: number[] = [];
    singleCarrierError = false;
    carrierMaps: { carrier: string; ids: string[] }[] = [];
    products = "products";
    copyNewPlanYear = "copyNewPlanYear";
    vasExceptions: Exceptions[] = [];
    isVasMaxEmployeeEligible = false;
    currentPlanYearDetails: PlanYear;
    allPlanYears: PlanYear[];
    overlappingPlanError = false;
    overlappingErrorMessage: string;
    companyCode = {
        NY: CompanyCode.NY,
    };
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.filterCarrier",
        "primary.portal.benefitsOffering.filterRiders",
        "primary.portal.benefitsOffering.filterStates",
        "primary.portal.benefitsOffering.altRiders",
        "primary.portal.benefitsOffering.altStates",
        "primary.portal.benefitsOffering.setPlan",
        "primary.portal.benefitsOffering.preTax",
        "primary.portal.benefitsOffering.agentRequired",
        "primary.portal.benefitsOffering.setPerCarrier",
        "primary.portal.benefitsOffering.agentAssistance",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.benefitsOffering.noneOfAbove",
        "primary.portal.benefitsOffering.none",
        "primary.portal.benefitsOffering.aflacVSP",
        "primary.portal.benefitsOffering.reliance",
        "primary.portal.benefitsOffering.aflac",
        "primary.portal.benefitsOffering.deltaDentegra",
        "primary.portal.benefitsOffering.carrieroptionlabel",
        "primary.portal.benefitsOffering.productVas",
        "primary.portal.benefitOffering.productsVasError",
        "primary.portal.benefitsOffering.selfEnrollTxt",
        "primary.portal.benefitsOffering.selfServiceEnrollment",
        "primary.portal.benefitsOffering.postTax",
        "primary.portal.benefitsOffering.taxStatus",
        "primary.portal.benefitsOffering.both",
        "primary.portal.benefitsOffering.taxStatus.setAtPlanLevel",
        "primary.portal.benefitsOffering.aflacDentalVision",
        "primary.portal.benefitsOffering.aflacDentalVisionAdv",
        "primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment",
        "primary.portal.benefitOffering.plans.maxValueExceeded",
    ]);
    secondaryLanguages: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.1AflacError",
        "secondary.portal.benefitsOffering.singleCarrier",
        "secondary.portal.benefitsOffering.1AflacPlan",
        "secondary.portal.benefitsOffering.reliancePlansDisclaimer",
        "secondary.portal.benefitsOffering.reliancePlansDentalDisclaimer",
        "secondary.portal.benefitsOffering.reliancePlansVisionDisclaimer",
        "secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer",
        "secondary.portal.benefitsOffering.coveragePeriod.overlapping.plans",
        ArgusLanguage.SELECT_ONE_NON_PLHSO_PRODUCT,
        "secondary.portal.benefitsOffering.onePlanForProduct",
    ]);
    sideNavTrigger = false;
    planIndex: number;
    planLength: number;
    isplanChoiceCreated: boolean;
    planChoicesToUpdate = [];
    restrictedPlanLength = 2;
    showDisclaimerForRSLICarrier = false;
    disclaimerMessage = "";
    productsSelected = [];
    eligibleEmployees: number;
    minEmployees = true;
    restrictedStateAlertCarrier: string;
    enrollmentRestrictedStates: string;
    restrictedStateAlert: string;
    restrictedStatesCarrierSpecific = false;
    restrictedStates = false;
    isAccountRSLIEligible: RSLIEligibility;
    isSideNavSelected = false;
    ProductId = ProductId; // Used in the template
    @Select(BenefitsOfferingState.getErrorMessageKey) errorMessageKey$: Observable<string>;
    isAgentAssistance = false;
    isRestrictedPlanSelected = false;
    restrictedStatesList: string[] = [];
    TaxStatus = TaxStatus;
    globalTaxStatusDisable = false;
    postTaxDisable = false;
    isRSLIEligibility: boolean;
    isPlansCompleted = false;
    isHcfsaPlan: boolean;
    isVasHQFunded$: Observable<boolean>;
    isVasEmployeeFunded$: Observable<boolean>;
    isVasHQFund: boolean;
    isVasEmployeeFund: boolean;
    unapprovedNewPlanYearChoices: PlanChoice[] = [];
    unapprovedPlanChoices: PlanChoice[] = [];
    approvedPlanChoices: PlanChoice[] = [];
    disableArgusTierPlans: { planId: { disableStatus: boolean } } = {} as { planId: { disableStatus: boolean } };
    exceptionProductSelectedPlan: { planId: number; selected: boolean } = { planId: 0, selected: false };
    argusDentalPlansTier1All: number[] = [];
    argusDentalPlansTier2All: number[] = [];
    argusDentalPlansTier1Fl: number[] = [];
    argusDentalPlansTier2Fl: number[] = [];
    argusDentalPlansTier1PPO: number[] = [];
    argusDentalPlansTier1MAC: number[] = [];
    argusDentalTiers: ArgusADVTiers;
    argusVisionCarrierMaps: ArgusCarrier[] = [];
    argusDentalCarrierMaps: ArgusCarrier[] = [];
    carrierExceptions: CarrierMap[];
    isVasException = false;
    isVasExceptionRequired = false;
    // true if the vas exception 'New Aflac products not required for renewal year' is selected
    isNewAflacProductNotRequiredVasException = false;
    situsState: string;
    isArgusPlans = false;
    contactInfoBilling: AccountContacts[];
    billingAdded = false;
    isRole20User = false;
    isTPPAccount = false;
    maxPlansValue: number;
    isVasMaxValid = false;
    employeesFromGroupAttribute: number;
    hideTaxStatusForProducts: number[] = [];
    hideBothTaxStatus = false;
    disableNextButon = true;
    multiplePlansSelected: boolean;
    MIN_PLHSO_PRODUCT_SELECT: number;
    isPLHSOProductSelectedError = false;
    PPOMACPlanIds = [];
    argusTotalEligibleEmployees: number;
    selectedProductId: string;
    totalProductsSelected: number;
    productPlansNotSelected = false;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly quasiService: ProductsPlansQuasiService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly dateService: DateService,
    ) {
        this.form = this.formBuilder.group({
            carriersFilter: [""],
            ridersFilter: [""],
            statesFilter: [""],
            carrier: [""],
            planType: [""],
        });
        this.getEligibleEmployeeCount();
        this.getArgusEligibleEmployeeCount();
        this.getUserPermission();
        this.vasExceptions = this.store.selectSnapshot(BenefitsOfferingState.getVasExceptions);
        this.getArgusConfig();
        this.benefitsOfferingHelperService
            .getTaxStatusConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productIds) => (this.hideTaxStatusForProducts = productIds));
        this.fetchAccountTPPStatus();
    }

    /**
     * Method to get the eligible no of employees for argus products
     */
    getArgusEligibleEmployeeCount(): void {
        combineLatest([
            this.accountService.getGroupAttributesByName([BENEFIT_ELIGIBLE_EMPLOYEE_COUNT]),
            this.accountService.getGroupAttributesByName([GROUP_EMPLOYEE_COUNT]),
            this.benefitsOfferingService.benefitOfferingSettingsData,
        ])
            .pipe(
                tap(([eligibleEmpCount, groupEmpCount, censusEstimate]) => {
                    this.argusTotalEligibleEmployees = censusEstimate.argusTotalEligibleEmployees;
                    if (eligibleEmpCount[0] && +eligibleEmpCount[0].value > 0) {
                        this.employeesFromGroupAttribute = +eligibleEmpCount[0].value;
                    } else {
                        this.employeesFromGroupAttribute = groupEmpCount[0].value ? +groupEmpCount[0].value : 0;
                    }
                    this.checkArgusSelectedPlans();
                }),
                switchMap(() => this.initializeCarrierMaps()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (resp) => {
                    resp.map((carrier, index) => {
                        const carriers = carrier.replace(/\s/g, "").split(";");
                        if (index === 0) {
                            this.carrierExceptions = this.generateCarrierMaps(carriers, "=");
                        } else {
                            this.carrierMaps = this.generateCarrierMaps(carriers, ":");
                        }
                    });
                    this.initializePlansList(this.selectedProductId);
                },
                (error) => {
                    this.isLoading = false;
                    this.isError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                },
            );
    }
    /**
     * @description function to initialize the carrier maps and exceptions and to initialize form
     */
    initializeCarrierMaps(): Observable<[string, string]> | undefined {
        this.planYearChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        const managePlanYear = this.store.selectSnapshot(BenefitsOfferingState.GetManagePlanYearChoice);
        if (managePlanYear !== NEW_PLANYEAR && managePlanYear) {
            this.managePlanYearChoice = true;
        } else {
            this.managePlanYearChoice = false;
        }
        this.isExceptionProduct = false;
        this.isHcfsaPlan = false;
        if (!this.mpGroup) {
            this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        }
        if (this.mpGroup) {
            if (this.benefitOfferingStates.length === 0) {
                this.benefitOfferingStates = this.store.selectSnapshot(BenefitsOfferingState.getBenefitOfferingStates);
            }
            this.situsState = this.store.selectSnapshot(AccountInfoState.getAccountInfo).situs.state.abbreviation;
            if (this.situsState === StateAbbreviations.FLORIDA) {
                this.getDHMOPlans();
            }
            this.isLoading = true;
            const exceptionCarrier$ = this.staticUtilService.cacheConfigValue(
                "broker.plan_year_setup.plan_choices.exclude_plans_from_max_plans_per_carrier",
            );

            const carrierIdsMap$ = this.quasiService.selectedProductId.pipe(
                tap((productId) => {
                    this.selectedProductId = productId;
                    if (this.carrierMaps.length) {
                        this.backButtonClicked = true;
                        this.disableNextButon = true;
                        this.isLoading = true;
                        this.initializePlansList(productId);
                    }
                }),
                filter((productId) => this.carrierMaps.length <= 0 && productId !== null && productId !== undefined),
                mergeMap(() =>
                    this.staticUtilService
                        .cacheConfigValue("group_benefit_offering_carrier_specific_restriction_carrier_ids_map")
                        .pipe(filter((resp) => resp !== undefined || resp !== null)),
                ),
                takeUntil(this.unsubscribe$),
            );
            return combineLatest([exceptionCarrier$, carrierIdsMap$]);
        }
        return undefined;
    }
    /**
     * @description generates the carriers based on the given splitString
     * @param carrierResp {string[]} response containing carrier data
     * @param splitString {string} string that is used to split the carrierResp
     * @returns CarrierMap[] the generated carrierMap
     */
    generateCarrierMaps(carrierResp: string[], splitString: string): CarrierMap[] {
        return carrierResp.map((carrier) => {
            const carrierData = carrier.split(splitString);
            const carrierIds = carrierData[1].substring(1, carrierData[1].length - 1).split(",");
            return { carrier: carrierData[0], ids: carrierIds };
        });
    }
    /**
     * This method is used to fetch config values related to argus carrier and stores them in variables
     */
    getArgusConfig(): void {
        this.quasiService
            .getArgusConfigObservableValue()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.argusDentalTiers = {
                        dentalPlansTier1All: response.dentalPlansTier1All,
                        dentalPlansTier2All: response.dentalPlansTier2All,
                        dentalPlansTier1Fl: response.dentalPlansTier1Fl,
                        dentalPlansTier2Fl: response.dentalPlansTier2Fl,
                        dentalPlansTier1PPO: response.dentalPlansTier1PPO,
                        dentalPlansTier1MAC: response.dentalPlansTier1MAC,
                        dentalPlansTier2PPO: response.dentalPlansTier2PPO,
                        dentalPlansTier2MAC: response.dentalPlansTier2MAC,
                        dentalPlansTier1PPOER: response.dentalPlansTier1PPOER,
                        dentalPlansTier1MACER: response.dentalPlansTier1MACER,
                        dentalPlansTier2PPOER: response.dentalPlansTier2PPOER,
                        dentalPlansTier2MACER: response.dentalPlansTier2MACER,
                        dentalPlansTier1FLPPO: response.dentalPlansTier1FLPPO,
                        dentalPlansTier1FLMAC: response.dentalPlansTier1FLMAC,
                        dentalPlansTier2FLPPO: response.dentalPlansTier2FLPPO,
                        dentalPlansTier2FLMAC: response.dentalPlansTier2FLMAC,
                        dentalPlansTier1FLPPOER: response.dentalPlansTier1FLPPOER,
                        dentalPlansTier1FLMACER: response.dentalPlansTier1FLMACER,
                        dentalPlansTier2FLPPOER: response.dentalPlansTier2FLPPOER,
                        dentalPlansTier2FLMACER: response.dentalPlansTier2FLMACER,
                        dentalPlansFLDHMO: response.dentalPlansFLDHMO,
                        visionPlansTier1EP: response.visionPlansTier1EP,
                        visionPlansTier2EP: response.visionPlansTier2EP,
                        visionPlansTier1ER: response.visionPlansTier1ER,
                        visionPlansTier2ER: response.visionPlansTier2ER,
                    };
                    this.argusVisionCarrierMaps = response.visionCarrierMaps;
                    this.argusDentalCarrierMaps = response.dentalCarrierMaps;
                },
                (error) => {
                    this.isLoading = false;
                    this.isError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        `secondary.api.${error.error.status}.${error.error.code}`,
                    );
                },
            );
    }
    /**
     * Gets the plans data for a particular product based on the productId and loads data for table.
     * @param productId productId of current selected product
     */
    initializePlansList(productId: string): void {
        this.isAllowChange = false;
        this.allPlans.data = [];
        this.productId = productId;
        if (this.productId) {
            this.resetValues();
            if (this.productId.toString() === AppSettings.VAS_EMP) {
                this.isEmpFunded = true;
            } else if (this.productId.toString() === AppSettings.HQ) {
                this.isHQFunded = true;
            } else if (isNaN(+this.productId)) {
                this.productIdNumber = this.productId.toString().substring(0, this.productId.toString().length - 1);
            } else {
                this.productIdNumber = this.productId.toString();
            }
            this.displayedPlansColumns = [
                PlansColumns.SELECTED,
                PlansColumns.CARRIER,
                PlansColumns.PLANNAME,
                PlansColumns.RIDERS,
                PlansColumns.STATES,
            ];

            if (this.plansList.length <= 0) {
                this.getPlansData();
                if (this.data.opensFrom === this.copyNewPlanYear && !this.unapprovedNewPlanYearChoices.length) {
                    this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel([]));
                }
            }
            this.checkVasException();
            this.preTaxSetPerPlan = this.quasiService.defaultSetPerPlan(this.allPlans);
            if (this.preTaxSetPerPlan) {
                this.displayedPlansColumns = Object.values(PlansColumns);
            }
        } else {
            this.backButtonClicked = false;
            this.disableNextButon = false;
            this.isLoading = false;
        }
    }
    /**
     * function to check vas Enable or disable
     */
    checkVasException(): void {
        if (this.vasExceptions && this.vasExceptions.length) {
            this.isVasException = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_MULTIPLE_AFLAC_FUNDED);
            this.isVasExceptionRequired = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_YEAR_ONE_PRODUCT_ADD);
            // checks whether vas exception 'New Aflac products not required for renewal year' is selected or not
            this.isNewAflacProductNotRequiredVasException = this.vasExceptions.some(
                (obj) => obj.type === ExceptionType.VAS_RENEWAL_YEAR_PRODUCT_ADD,
            );
            this.isVasMaxEmployeeEligible = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_MAX_EMPLOYEE);
            const exceptionArray: Exceptions[] = this.vasExceptions.filter((obj) => obj.type === ExceptionType.VAS_MULTIPLE_AFLAC_FUNDED);
            if (exceptionArray.length > 1) {
                exceptionArray.sort(
                    (val1, val2) =>
                        new Date(val1.validity.effectiveStarting).getTime() - new Date(val2.validity.effectiveStarting).getTime(),
                );
            }
            this.maxPlansValue = exceptionArray[0] ? exceptionArray[0].maxPlans : 0;
        }
        this.checkVasProduct();
        this.loadPlansScreen();
    }
    /**
     * checks for VAS plans agent assisted config value
     */
    checkVasProduct(): void {
        this.isVasHQFunded$ = this.staticUtilService
            .cacheConfigEnabled("general.benefit_offering.products.vas.HQ_funded.agent_assisted_Enable")
            .pipe(
                takeUntil(this.unsubscribe$),
                map((response) => {
                    this.isVasHQFund = response;
                    return !this.isHQFunded || response;
                }),
            );
        this.isVasEmployeeFunded$ = this.staticUtilService
            .cacheConfigEnabled("general.benefit_offering.products.vas.employer_funded.agent_assisted_Enable")
            .pipe(
                takeUntil(this.unsubscribe$),
                map((response) => {
                    this.isVasEmployeeFund = response;
                    return !this.isEmpFunded || response;
                }),
            );
    }

    /**
     * Checks for carrier restriction conditions and disable/enable carrier based on choices
     */
    checkCarrierRestriction(): void {
        this.restrictedCarriers = [];
        this.hasCarrierRestriction = true;
        this.isCarrierSelected = false;
        const langAflacDentalVision = this.languageStrings["primary.portal.benefitsOffering.aflacDentalVision"];
        if (this.productIdNumber === AppSettings.VISION) {
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.aflacDentalVisionAdv"],
                this.getCarrierIds(CarrierIdType.ADV),
            );
            this.checkForCarrierPlans(langAflacDentalVision, this.getCarrierIds(CarrierIdType.ARGUS));
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.aflacVSP"],
                this.getCarrierIds(CarrierIdType.AFLAC_VSP),
            );
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.reliance"],
                this.getCarrierIds(CarrierIdType.RELIANCE),
            );
        } else if (this.productIdNumber === AppSettings.DENTAL) {
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.aflacDentalVisionAdv"],
                this.getCarrierIds(CarrierIdType.ADV),
            );
            this.checkForCarrierPlans(langAflacDentalVision, this.getCarrierIds(CarrierIdType.ARGUS));
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.aflac"],
                this.getCarrierIds(CarrierIdType.AFLAC),
            );
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.deltaDentegra"],
                this.getCarrierIds(CarrierIdType.DELTA_DENTEGRA),
            );
            this.checkForCarrierPlans(
                this.languageStrings["primary.portal.benefitsOffering.reliance"],
                this.getCarrierIds(CarrierIdType.RELIANCE),
            );
        } else {
            this.hasCarrierRestriction = false;
            this.isCarrierSelected = true;
        }
        const planCarriers = this.plans
            .map((plan) => {
                this.carrierExceptions.forEach((exceptionCarrier) => {
                    if (+exceptionCarrier.carrier === plan.carrierId) {
                        exceptionCarrier.ids.forEach((carrierId) => {
                            if (+carrierId === plan.planId) {
                                this.isExceptionProduct = true;
                            }
                        });
                    }
                });
                return plan.carrierId;
            })
            .filter((carrier) => this.getCarrierIds(CarrierIdType.SINGLE_PLAN_CARRIERS).indexOf(carrier) >= 0);
        if (planCarriers.length && !this.isExceptionProduct) {
            this.isRestrictedToSinglePlan = true;
        }
        if (
            this.restrictedCarriers.length &&
            this.restrictedCarriers.length === this.restrictedCarriers.filter((carrier) => carrier.disabled).length
        ) {
            this.singleCarrierError = true;
            this.errorMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.singleCarrier"]
                .replace("#productName", this.carrierChoice.productName)
                .replace("#carrierName", this.carrierChoice.carrierName);
        } else if (this.restrictedCarriers.length <= SINGLE_CARRIER_RESTRICTED_PLANS_COUNT) {
            this.isCarrierSelected = true;
        }
    }
    /**
     * This method is used to get the carrier ids mapped in config based on the carrierName passed
     * @param carrierName carrier name from config to get carrier id's
     * @returns carrier ids based on carrier name inputted
     */
    getCarrierIds(carrierName: string): number[] {
        return this.carrierMaps
            .filter((carrierData) => carrierData.carrier === carrierName)
            .map((carrier) => carrier.ids.map((id) => +id))[0];
    }
    /**
     * logic to get distinct set of carriers and carrier choice previously made
     * @param carrier - carrier name to display, carrierIds: ids for the carrier from config
     * @param carrierIds - contains list of carrierIds
     */
    checkForCarrierPlans(carrier: string, carrierIds: number[]): void {
        let disableCarrier = true;
        if (
            this.carrierChoice &&
            !this.selectedCarriers.length &&
            carrierIds &&
            this.carrierChoice.productId === this.productIdNumber &&
            carrierIds.length &&
            carrierIds.indexOf(this.carrierChoice.carrierId) >= 0
        ) {
            this.selectedCarriers = carrierIds;
            disableCarrier = false;
        }
        if (carrierIds && this.plansToCompare.filter((plan) => carrierIds.indexOf(plan.carrierId) >= 0).length) {
            this.restrictedCarriers.push({
                text: carrier,
                carrierIds: carrierIds,
                disabled: false,
            });
            this.checkForDisabledCarrierPlanChoices(disableCarrier, carrierIds);
        }
    }
    /**
     * set the plan choices based on the carrier selections
     * @param disableCarrier to disable carrier options
     * @param carrierIds list of carrierIds
     */
    checkForDisabledCarrierPlanChoices(disableCarrier: boolean, carrierIds: number[]): void {
        // this will execute only if at least one carrier is selected in previous selections
        // or if all plans are argus or adv
        if (
            (!this.carrierChoice || (this.carrierChoice && this.carrierChoice.carrierId !== CarrierId.AFLAC)) &&
            (!disableCarrier ||
                this.plansToCompare.every((eachPlan) => eachPlan.carrierId === CarrierId.ARGUS) ||
                this.plansToCompare.every((eachPlan) => eachPlan.carrierId === CarrierId.ADV))
        ) {
            if (this.managePlanYearChoice && this.isOEEnded) {
                this.disablePlanOption = true;
            }
            this.form.controls.carrier.setValue(carrierIds);
            this.loadCarrierPlans();
        }
    }

    /**
     * This method is used to check if carrier offers single or multiple plans and gets plans based on carrier selection
     */
    loadCarrierPlans(): void {
        this.selectedCarriers = this.form.controls.carrier.value;
        if (this.form.controls.planType && this.form.controls.planType.value !== "") {
            this.isERSelected = this.form.controls.planType.value === this.erSelected;
        }
        const carrierRestrictionData: {
            isNoneSelected: boolean;
            isADVEROption: boolean;
            isERSelection: boolean;
            showDisclaimerForRSLICarrier: boolean;
            isRestrictedToSinglePlan: boolean;
            plans: PlanPanel[];
            allPlans: MatTableDataSource<PlanPanel>;
        } = this.quasiService.loadCarrierRestrictedPlans(
            this.selectedCarriers,
            this.carrierMaps,
            this.isRestrictedToSinglePlan,
            this.productIdNumber,
            this.argusVisionCarrierMaps,
            this.argusDentalCarrierMaps,
            this.situsState,
            this.employeesFromGroupAttribute,
            this.plans,
            this.getSelectedPlansData(),
            this.allPlans,
            this.isERSelected,
        );
        this.isNoneSelected = carrierRestrictionData.isNoneSelected;
        this.showDisclaimerForRSLICarrier = carrierRestrictionData.showDisclaimerForRSLICarrier;
        this.isRestrictedToSinglePlan = carrierRestrictionData.isRestrictedToSinglePlan;
        this.plans = carrierRestrictionData.plans;
        this.allPlans.data = carrierRestrictionData.allPlans.data;
        this.updateFilters();
        this.isCarrierSelected = true;
        this.isADVEROption = carrierRestrictionData.isADVEROption;
        this.isERSelected = carrierRestrictionData.isERSelection;
        this.postTaxDisable = this.getPostTaxFlagToDisable();
    }
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.unapprovedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        this.staticUtilService
            .cacheConfigValue(ArgusConfig.MIN_PLHSO_PRODUCT_SELECT)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.MIN_PLHSO_PRODUCT_SELECT = Number(result);
            });
        // The below function is added to check whether the logged in user has permission to override agent assisted
        this.quasiService.executePlanOnNext$
            .pipe(
                filter((productIdToBeNavigated) => !!productIdToBeNavigated),
                tap((productIdToBeNavigated) => {
                    this.sideNavTrigger = true;
                    this.onNext(true, productIdToBeNavigated);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.accountService
            .getAccountContacts("typeId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.backButtonClicked = false;
                this.disableNextButon = false;
                this.isLoading = false;
                this.multiplePlansSelected = true;
                // For Billing contacts as they will always have id 2
                this.contactInfoBilling = resp.filter((contact) => contact.type && contact.type.id === BILLING);
            });
    }
    /**
     * @description resets the values on load of next product
     * @returns {void}
     */
    resetValues(): void {
        if (!(this.isHQFunded || this.isEmpFunded)) {
            this.skipHQFunded = false;
        }
        this.isEmpFunded = false;
        this.isHQFunded = false;
        this.isNoneSelected = false;
        this.isReceivingHQ = true;
        this.displayedPlansColumns = [];
        this.filter = {
            query: {
                carrier: [],
                riders: [],
                sates: [],
            },
        };
        this.filterValue[this.fromCarriers] = [];
        this.filterValue[this.fromRiders] = [];
        this.filterValue[this.fromStates] = [];
        this.restrictedCarriers = [];
        this.form.controls.carrier.setValue("");
        this.form.controls.planType.setValue("");
        this.isRestrictedToSinglePlan = false;
        this.carrierChoice = null;
        this.selectedCarriers = [];
        this.singleCarrierError = false;
        this.minEmployees = true;
        this.isERSelected = undefined;
        this.preTaxSetPerPlan = false;
        this.assitancePerCarrier = false;
        this.isError = false;
        this.isSingleAflacError = false;
        this.isPreTaxEligible = false;
        this.isExceptionProduct = false;
        this.isHcfsaPlan = false;
        this.planChoicesToUpdate = [];
        this.productPlansNotSelected = false;
    }

    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    /**
     * gets plan choices from store based on plan year Id
     * @param planYearId plan year id selected
     */
    getPlanChoices(planYearId: number): void {
        this.unapprovedNewPlanYearChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        let planYearPlans: PlanChoice[] = [];
        if (this.unapprovedNewPlanYearChoices.length) {
            this.isPlansCompleted = true;
            planYearPlans = this.unapprovedNewPlanYearChoices;
        } else if (planYearId) {
            const approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
            planYearPlans = approvedPlanChoices.filter(
                (eachPlanChoice) => eachPlanChoice.continuous === false && eachPlanChoice.planYearId === planYearId,
            );
        }
        this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(planYearPlans));
    }
    /**
     * gets plans data from store and loads plans list
     */
    getPlansData(): void {
        this.productList = [];
        this.plansList = [];
        const planIds: number[] = [];
        let showVasLinks = false;
        let panelModel: PanelModel[] = [];
        if (this.planYearChoice === null && this.data.opensFrom !== PLANS) {
            panelModel = this.store.selectSnapshot(BenefitsOfferingState.GetUnapprovedPanel);
        } else {
            const planYearId = this.store.selectSnapshot(BenefitsOfferingState.GetPlanYearId);
            if (this.data.opensFrom === this.copyNewPlanYear) {
                this.getPlanChoices(planYearId);
            }
            panelModel = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel);
            if (this.data.opensFrom === PLANS && (this.isHQFunded || this.isEmpFunded)) {
                const panel = panelModel.filter((eachPanel) => eachPanel.product.valueAddedService);
                const productChoices: ProductSelection[] = [];
                panel.forEach((productPanel) => {
                    const choice: ProductSelection = {
                        id: productPanel.product.id,
                        individual: productPanel.individualEligibility,
                        group: productPanel.groupEligibility,
                    };
                    productChoices.push(choice);
                });
                this.store.dispatch(new MapProductChoiceToNewPlanYearPanel(productChoices));
                panelModel = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel);
            } else if (this.data.opensFrom === PLANS) {
                const productId = this.data.productInformation.plans[0].plan.plan.productId;
                const selection: ProductSelection = {
                    id: productId,
                    individual: this.data.productInformation.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
                    group: this.data.productInformation.policyOwnershipType === PolicyOwnershipType.GROUP,
                };
                this.store.dispatch(new MapProductChoiceToNewPlanYearPanel([selection]));
                panelModel = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearPanel);
            }
        }
        panelModel = this.utilService.copy(panelModel);
        panelModel.forEach((panel) => {
            if (panel.product.name === VISION_PLAN) {
                panel.plans = panel.plans.map((plan) => {
                    if (plan.plan.carrierId === CarrierId.ADV) {
                        const [low, high] = plan.plan.adminName
                            .substring(plan.plan.adminName.lastIndexOf("(") + 1, plan.plan.adminName.length - 1)
                            .trim()
                            .split("-");
                        if (this.argusTotalEligibleEmployees < +low || this.argusTotalEligibleEmployees > +high) {
                            plan.plan.planEligibility.eligibility = Eligibility.NOT_ELIGIBLE;
                            plan.planEligibilty.eligibility = Eligibility.NOT_ELIGIBLE;
                        } else {
                            plan.plan.planEligibility.eligibility = Eligibility.ELIGIBLE;
                            plan.planEligibilty.eligibility = Eligibility.ELIGIBLE;
                        }
                    }
                    return plan;
                });
            }
        });
        if (panelModel.length > 0) {
            panelModel.forEach((productData) => {
                if (productData.productChoice && productData.product) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
                    productData.product.valueAddedService
                        ? (showVasLinks = true)
                        : productData.productChoice.individual && productData.productChoice.group
                        ? this.addIndividualAndGroupLinks(productData)
                        : this.productList.push({
                              id: productData.product.id.toString(),
                              name: productData.product.name,
                              individual: productData.productChoice.individual,
                              group: productData.productChoice.group,
                              productId: productData.product.id,
                          });
                    // eslint-disable-next-line complexity
                    productData.plans.forEach((planData) => {
                        // eslint-disable-next-line complexity
                        if (
                            ((productData.productChoice.individual &&
                                planData.plan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0) ||
                                (productData.productChoice.group && planData.plan.policyOwnershipType.indexOf(AppSettings.GROUP) >= 0)) &&
                            (planData.planEligibilty
                                ? planData.planEligibilty.eligibility === Eligibility.ELIGIBLE
                                : planData.plan.planEligibility.eligibility === Eligibility.ELIGIBLE)
                        ) {
                            planIds.push(planData.plan.id);
                            const states = Array.from(
                                new Set(
                                    planData.states.filter((state) =>
                                        this.benefitOfferingStates.filter((offeringState) => offeringState.name === state.name).pop(),
                                    ),
                                ),
                            ).sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
                            if (planData.planChoice) {
                                this.planYearId = planData.planChoice.planYearId;
                                this.getPlanYearDetails();
                            }
                            this.plansList.push({
                                selected: Boolean(planData.planChoice && planData.planChoice.id),
                                isPlanDisabled: planData.planEligibilty
                                    ? !(planData.planChoice && planData.planChoice.id) &&
                                      (planData.planEligibilty.inEligibleReason === PlanIneligibleReasons.MINIMUM_EMPLOYEES_NOT_MET ||
                                          planData.planEligibilty.inEligibleReason === PlanIneligibleReasons.MAXIMUM_EMPLOYEE_EXCEEDED)
                                    : false,
                                managePlanYear: planData.planChoice && this.managePlanYearChoice ? true : false,
                                productId:
                                    productData.productChoice.individual && productData.productChoice.group
                                        ? planData.plan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0
                                            ? planData.plan.productId + "i"
                                            : planData.plan.productId + "g"
                                        : planData.plan.productId,
                                productIdNumber: planData.plan.productId.toString(),
                                productName: productData.product.name,
                                planId: planData.plan.id,
                                planName: planData.plan.adminName,
                                planChoiceId:
                                    planData.planChoice && (this.planYearChoice === null || this.isPlansCompleted)
                                        ? planData.planChoice.id
                                        : null,
                                planYearId: planData.planChoice ? planData.planChoice.planYearId : null,
                                continous: planData.planChoice ? planData.planChoice.continuous : null,
                                enrollmentEndDate: planData.planChoice
                                    ? planData.planChoice.enrollmentPeriod
                                        ? this.datepipe.transform(
                                              planData.planChoice.enrollmentPeriod.expiresAfter
                                                  ? planData.planChoice.enrollmentPeriod.expiresAfter
                                                  : new Date().setDate(new Date().getDate() - 1),
                                              AppSettings.DATE_FORMAT,
                                          )
                                        : null
                                    : null,
                                carrierId: planData.plan.carrierId,
                                carrier: productData.carrier.filter((carrier) => carrier.id === planData.plan.carrierId).pop().name,
                                riders: [...planData.plan.riders].sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0)),
                                states: states,
                                cafeteria: planData.planChoice === null ? false : planData.planChoice.cafeteria,
                                cafeteriaEligible: planData.plan.cafeteriaEligible,
                                preTaxEligible: planData.plan.taxStatus === TaxStatus.PRETAX ? true : false,
                                taxStatus: planData.planChoice === null ? planData.plan.taxStatus : planData.planChoice.taxStatus,
                                defaultTaxStatus: planData.plan.taxStatus,
                                taxStatusReadOnly: planData.plan.taxStatusReadOnly,
                                agentAssisted:
                                    planData.planChoice === null
                                        ? planData.plan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) > -1
                                            ? true
                                            : planData.plan.agentAssisted
                                        : planData.planChoice.agentAssisted,
                                agentAssistedDisabled: planData.plan.agentAssistedDisabled,
                                vasFunding: planData.plan.vasFunding,
                                policyOwnershipType: planData.plan.policyOwnershipType,
                                eligibility: planData.plan.planEligibility.eligibility === Eligibility.ELIGIBLE,
                                isRelianceStdPlan:
                                    planData.plan.carrierId === CarrierId.RELIANCE_STANDARD && planData.plan.productId === ProductId.LTD,
                                isAutoEnrollable: planData.plan.characteristics.includes(Characteristics.AUTOENROLLABLE),
                            });
                        }
                    });
                    this.plansList = this.plansList
                        .filter((plan) => plan.states.length > 0)
                        .sort((a, b) => (a.planId > b.planId ? 1 : b.planId > a.planId ? -1 : 0));
                    // check if any plan(s) were selected and disable others accordingly
                    this.checkboxActionsForExceptions();
                }
            });
            if (showVasLinks) {
                this.productList.push({
                    id: AppSettings.HQ,
                    name: AppSettings.VAS_HQ_FUNDED,
                });
                this.productList.push({
                    id: AppSettings.VAS_EMP,
                    name: AppSettings.VAS_EMP_FUNDED,
                });
            }
        }
        this.postTaxDisable = this.getPostTaxFlagToDisable();
    }

    /**
     * adds both individual and group links for product list
     * @param productData product data to be added
     */
    addIndividualAndGroupLinks(productData: PanelModel): void {
        this.productList.push({
            id: productData.product.id + "i",
            name: productData.product.name + " " + AppSettings.DISPLAY_INDIVIDUAL,
            individual: true,
            group: false,
            productId: productData.product.id,
        });
        this.productList.push({
            id: productData.product.id + "g",
            name: productData.product.name + " " + AppSettings.DISPLAY_GROUP,
            individual: false,
            group: true,
            productId: productData.product.id,
        });
    }

    /**
     * check for HQ Funded and Employee Funded plans
     */
    checkHQorEmpFundedPlans(): void {
        if ((this.isHQFunded || this.isEmpFunded) && this.plans.length === 0) {
            if (this.isHQFunded) {
                this.skipHQFunded = true;
                this.presentProductIndex = this.productList.length - this.restrictedPlanLength;
            } else {
                this.skipHQFunded = false;
                this.presentProductIndex = this.productList.length - 1;
            }
            this.checkProductSelections(false);
        }
    }
    /**
     * function to load plans for selected products
     * @returns void
     */
    loadPlansScreen(): void {
        this.initializePlanScreen();
        let hasPermission;
        this.store
            .select(SharedState.hasPermission(UserPermissionList.OVERRIDE_AGENT_ASSISTED))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                hasPermission = response ? true : false;
            });
        const presentProduct = this.productList.filter((product) => product.id.toString() === this.productId.toString())[0];
        this.hideBothTaxStatus = this.hideTaxStatusForProducts.includes(presentProduct.productId);
        this.restrictedStateAlert = this.languageStrings["primary.portal.benefitsOffering.selfEnrollTxt"]
            .replace("#restrictedStates", this.enrollmentRestrictedStates)
            .replace("#planName", `${presentProduct.name} ${AppSettings.PLANS}`);
        this.checkboxActionsForExceptions();
        const checkIfEmployeesEligible: boolean = +this.eligibleEmployees < this.eligibleEmployeeCount;
        if (presentProduct.individual && !presentProduct.group && checkIfEmployeesEligible && !hasPermission) {
            this.minEligibleCountMsg = this.languageStrings["primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment"].replace(
                "##empCount##",
                String(this.eligibleEmployeeCount),
            );
            this.minEmployees = false;
        }
        this.presentProductIndex = this.productList.indexOf(presentProduct);
        this.quasiService.planChanged$.next(this.presentProductIndex);
        // get the products that are previously selected and find the number of aflac products
        const preSelectedProducts = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter(
                (product) =>
                    product.product &&
                    product.productChoice &&
                    product.carrier.findIndex(
                        (carrier) => carrier.name === CarrierType.AFLAC_CARRIER || carrier.name === CarrierType.AFLAC_ADV_CARRIER,
                    ) > -1 &&
                    product.plans.some((plan) => plan.planChoice !== null),
            )
            .map((product) => product.product.id.toString());
        // check if the number of aflac products selected meets min aflac products to be selected requirement
        this.productsSelected = this.plansList
            .filter((plan) => plan.selected && [CarrierId.AFLAC, CarrierId.ADV].includes(plan.carrierId))
            .map((plan) => plan.productIdNumber);
        this.productsSelected = [...new Set(this.productsSelected)];
        const isNewProduct =
            // Incase of Add products only check for products selected
            this.data.opensFrom === this.products
                ? this.productsSelected.length
                : // condition is true if all pre selected products during IBO are even selected during MBO
                  this.productsSelected.filter((selectedProduct) => preSelectedProducts.includes(selectedProduct)).length ===
                      preSelectedProducts.length &&
                  // condition is true if selected products in MBO are greater than IBO
                  this.productsSelected.length > preSelectedProducts.length;
        // checks the products that were selected other than pre selected products and total products are counted
        this.totalProductsSelected =
            preSelectedProducts.length + this.productsSelected.filter((product) => !preSelectedProducts.includes(product)).length;
        if (
            (!this.isVasExceptionRequired &&
                !this.isNewAflacProductNotRequiredVasException &&
                !this.managePlanYearChoice &&
                this.isHQFunded &&
                ((!isNewProduct && this.data.opensFrom !== this.products) || this.totalProductsSelected < this.minimumAflacToSelect)) ||
            (!this.isVasExceptionRequired &&
                !this.managePlanYearChoice &&
                this.isEmpFunded &&
                this.totalProductsSelected < this.minimumAflacToSelect)
        ) {
            this.checkMinimumAflacSelected();
        }
        this.removeVasPlansIfNoAflacSelected();
        this.updateFilters();
        this.globalTaxStatusDisable = this.getFlagToDisable();
        this.validateDefaultTaxStatus();
        this.postTaxDisable = this.getPostTaxFlagToDisable();
        if (this.multiplePlansSelected) {
            this.backButtonClicked = false;
            this.disableNextButon = false;
            this.isLoading = false;
        }
    }
    /**
     * remove plan selection if required number of aflac products are not selected
     */
    removeVasPlansIfNoAflacSelected(): void {
        if (this.isSingleAflacError && this.plans) {
            this.plans.forEach((plan) => {
                plan.selected = false;
            });
        }
    }
    /**
     * function to initialize plans for selected products
     * @returns void
     */
    initializePlanScreen(): void {
        if (!this.isRSLIEligibility) {
            this.checkRSLIEligibility();
        }
        const plans = this.getSelectedPlansData();
        this.plans = plans.some((plan) => plan.selected) ? this.quasiService.setCommonTaxStatus(plans) : plans;
        this.plansSelected = this.utilService.copy(this.plans);
        this.checkHQorEmpFundedPlans();
        this.isPreTaxEligible = this.plans.some((plan) => plan.preTaxEligible || !plan.taxStatusReadOnly);
        this.getRestrictedStatesPlan();
        this.allPlans.data = this.plans;
        this.allPlans.data.forEach((plan) => {
            if (plan.vasFunding) {
                plan.isEmpFundedPlanDisabled = this.selectedHQFundedProductIds.some((productId) => productId === plan.productId);
            }
        });
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        this.plansToCompare = this.isPlansCompleted
            ? this.utilService.copy(this.plans)
            : this.utilService.copy(this.plans).map((planData) => {
                  if (!planData.planChoiceId) {
                      planData.selected = false;
                  }
                  return planData;
              });
        this.updateCarrierInfo();
    }
    /**
     * function to initialize plans for selected products
     * @returns void
     */
    updateCarrierInfo(): void {
        if (this.isEmpFunded || this.isHQFunded) {
            this.hasCarrierRestriction = false;
            this.isCarrierSelected = true;
        } else {
            const selectedCarriers = this.plansList
                .filter((plan) => plan.selected && plan.productIdNumber === this.productIdNumber)
                .map((plan) => ({
                    carrierId: plan.carrierId,
                    productId: plan.productIdNumber,
                    carrierName: plan.carrier,
                    productName: plan.productName,
                }));
            if (selectedCarriers && selectedCarriers.length) {
                this.carrierChoice = selectedCarriers[0];
            }
            this.checkCarrierRestriction();
        }
    }
    /**
     * @description disables or enables the plans for exception product based on conditions
     */
    checkboxActionsForExceptions(): void {
        if (this.isExceptionProduct) {
            this.plans.forEach((plan) => {
                this.carrierExceptions.forEach((carrier) => {
                    if (plan.carrierId === +carrier.carrier) {
                        carrier.ids.forEach((id) => {
                            if (
                                this.exceptionProductSelectedPlan &&
                                plan.planId === this.exceptionProductSelectedPlan.planId &&
                                !plan.selected === this.exceptionProductSelectedPlan.selected
                            ) {
                                this.enablePlansOnDeselect(+id);
                            } else if (plan.planId !== +id && plan.selected === true) {
                                this.exceptionProductSelectedPlan = {
                                    planId: plan.planId,
                                    selected: plan.selected,
                                };
                            }
                        });
                    }
                });
            });
            if (this.exceptionProductSelectedPlan.planId !== 0) {
                this.disablePlansOnSelect();
            }
        }
    }
    /**
     * @description enables all plans except for the exception plans and already selected plan
     * @param id {number} id of the exception plan
     * @returns {void}
     */
    enablePlansOnDeselect(id: number): void {
        this.plans.forEach((plan) => {
            if (plan.planId !== id && plan.planId !== this.exceptionProductSelectedPlan.planId) {
                plan.isPlanDisabled = false;
                this.exceptionProductSelectedPlan = { planId: 0, selected: false };
            }
        });
    }
    /**
     * @description disables all plans except for the exception plans and selected plan
     * @returns {void}
     */
    disablePlansOnSelect(): void {
        this.plans.forEach((plan) => {
            this.carrierExceptions.forEach((carrier) => {
                if (plan.carrierId === +carrier.carrier) {
                    carrier.ids.forEach((id) => {
                        if (plan.planId !== +id && plan.planId !== this.exceptionProductSelectedPlan.planId) {
                            plan.isPlanDisabled = true;
                        }
                    });
                }
            });
        });
    }
    /**
     * fetch all selected plans
     * @returns  PlanPanel[]
     */
    getSelectedPlansData(): PlanPanel[] {
        this.plansList.forEach((plan) => {
            plan.isEmpFundedPlanDisabled = this.selectedHQFundedProductIds.some((productId) => productId === plan.productId);
        });
        return this.utilService.copy(
            this.plansList.filter((plan) => {
                if (
                    (this.isEmpFunded && plan.vasFunding && plan.vasFunding !== AppSettings.HQ) ||
                    (this.isHQFunded &&
                        plan.vasFunding &&
                        plan.vasFunding === AppSettings.HQ &&
                        (this.isVasMaxEmployeeEligible || plan.eligibility))
                ) {
                    return true;
                }
                return plan.productId.toString() === this.productId.toString();
            }),
        );
    }
    /**
     * function to check minimum Aflac selected
     */
    checkMinimumAflacSelected(): void {
        // three main counts need to be checked at this point for determining whether HQ VAS error message is shown:
        // 1) how many products there are initially
        // 2) the maximum possible amount of products to include in the new plan year
        // 3) the current amount of products offered in the new plan year

        // 1) counting the initial products
        const filteredInitialProducts =
            // get the items that appear in the Benefits Offering Products tab from the store
            this.store
                .selectSnapshot(BenefitsOfferingState.GetProductsTabView)
                // filter out products with a carrierId other than Aflac/ADV and unapproved products
                .filter(
                    (product) =>
                        [CarrierId.AFLAC, CarrierId.ADV].includes(product.carrierId) &&
                        product.approvalStatus === ApprovalRequestStatus.APPROVED,
                );
        const initialProductCount = filteredInitialProducts
            // remove duplicate products from the array
            .reduce((accumulator, currentValue) => {
                if (!accumulator.some((product) => product.plans[0].plan.plan.productId === currentValue.plans[0].plan.plan.productId)) {
                    accumulator.push(currentValue);
                }
                return accumulator;
            }, []).length;

        // 2) counting the maximum possible products
        const maxPossibleProductCount = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts).filter((panelProduct) =>
            // filter out products with a carrierId other than Aflac/ADV
            panelProduct.plans.some((panelProductPlan) => [CarrierId.AFLAC, CarrierId.ADV].includes(panelProductPlan.plan.carrierId)),
        ).length;

        // 3) counting the current products (check marked products where selected plans are Aflac/ADV + unique continuous products)
        const filteredCheckMarkedProductIds = this.plansList
            // retain only Aflac/ADV check marked plans
            .filter((plan) => plan.selected && [CarrierId.AFLAC, CarrierId.ADV].includes(plan.carrierId))
            // remove duplicate products from the array
            .reduce((accumulator, currentValue) => {
                if (!accumulator.some((plan) => plan.productIdNumber === currentValue.productIdNumber)) {
                    accumulator.push(currentValue);
                }
                return accumulator;
            }, [])
            // get the product ids of the filtered products
            .map((plan) => Number(plan.productIdNumber));
        // filter and save continuous product ids
        const uniqueContinuousProductIds = filteredInitialProducts
            .filter((product) => product.planYear === "false")
            // get the product ids of the filtered products
            .map((product) => product.plans[0].plan.plan.productId)
            // compare the product ids and save only the unique ones to avoid counting continuous plans twice if check marking them
            .filter((product) => !filteredCheckMarkedProductIds.includes(product));
        const currentProductCount = filteredCheckMarkedProductIds.length + uniqueContinuousProductIds.length;

        if (initialProductCount >= currentProductCount && maxPossibleProductCount !== currentProductCount) {
            this.isSingleAflacError = true;
            this.isReceivingHQ = false;
            this.errorMessage =
                this.minimumAflacToSelect > 1
                    ? this.languageStrings["primary.portal.benefitOffering.productsVasError"].replace(
                          "##vascount##",
                          String(this.minimumAflacToSelect),
                      )
                    : this.languageStrings["primary.portal.benefitsOffering.productVas"].replace(
                          "##vascount##",
                          String(this.minimumAflacToSelect),
                      );
        }
    }
    /**
     * This method is used to configure filter, initialize plan selections and to pre-selected, disable argus plans
     * This method is used to call @method configureFilters() which configures filters
     * This method is used to call @method initializeSelection() passing @var fromPlans as argument
     * This method is used to call @method initializeSelection() passing @var fromPretax as argument
     * This method is used to call @method initializeSelection() passing @var fromAssistanceRequired as argument
     * This method is used to call @method checkArgusSelectedPlans()
     * This method is used to call @method toggleAgentAssistedCheckbox() which toggles agent assisted checkbox based on few conditions
     */
    updateFilters(): void {
        this.isArgusPlans = false;
        this.configureFilters();
        this.initializeSelection(this.fromPlans);
        this.initializeSelection(this.fromPretax);
        this.initializeSelection(this.fromAssistanceRequired);
        const selectedPlans = this.selection[this.fromPlans].selected.filter((x) => x.selected === true);
        this.isSelected = false;
        if (selectedPlans.length) {
            this.isSelected = true;
        }
        this.checkArgusSelectedPlans();
        if (
            (+this.selectedCarriers === CarrierId.ARGUS || +this.selectedCarriers === CarrierId.ADV) &&
            !this.isRestrictedToSinglePlan &&
            (this.productIdNumber === AppSettings.VISION || this.productIdNumber === AppSettings.DENTAL)
        ) {
            this.isArgusPlans = true;
        }
        this.allPlans.data.forEach((plan) => {
            if (plan.selected === true) {
                this.isSelected = true;
            }
        });
        this.toggleAgentAssistedCheckbox();
    }
    /**
     * This method is used to toggle agent assisted checkbox based on certain conditions
     */
    toggleAgentAssistedCheckbox(): void {
        if (
            ((this.isTPPAccount && this.isRole20User) || (this.isTPPAccount && this.situsState !== this.companyCode.NY)) &&
            !(!this.isReceivingHQ || !this.isAllowChange || (!this.minEmployees && !this.isTPPAccount) || this.isRestrictedPlanSelected) &&
            this.allPlans.data.every((eachPlan) => !eachPlan.selected) &&
            this.allPlans.data.some((eachPlan) => eachPlan.policyOwnershipType !== PolicyOwnershipType.GROUP)
        ) {
            this.masterToggle(this.fromAssistanceRequired);
        }
    }
    /**
     * Method to pre select the rows as per earlier selections
     * @param option plan options
     */
    initializeSelection(option: string): void {
        let count = 0;
        let preselectedRows = [];
        if (!this.isEmpFunded) {
            this.selectedHQFundedProductIds = [];
        }
        const policyOwnershipType = "policyOwnershipType";
        if (option === this.fromAssistanceRequired) {
            preselectedRows = this.filtersData[this.fromCarriers].filter((carrier) => {
                if (carrier[option] !== undefined) {
                    count++;
                }
                return (
                    this.agentAssistancestatus() &&
                    (carrier[option] === true || carrier[policyOwnershipType].indexOf(AppSettings.INDIVIDUAL) >= 0)
                );
            });
        } else {
            preselectedRows = this.allPlans.data.filter((plan) => {
                if (
                    plan[option] !== undefined &&
                    (option !== this.fromPlans ||
                        !this.selectedHQFundedProductIds.some((selectedProductId) => selectedProductId === plan.productId)) &&
                    (option !== this.fromPretax || plan.preTaxEligible || !plan.taxStatusReadOnly)
                ) {
                    count++;
                }
                return (
                    plan[option] === true &&
                    (option !== this.fromPlans ||
                        !this.selectedHQFundedProductIds.some((selectedProductId) => selectedProductId === plan.productId))
                );
            });
        }
        this.agentAssistanceForRestricted();
        this.selection[option] = new SelectionModel(true, [...preselectedRows]);
        this.numRows[option] = count;
    }

    /* Show plan details in a dialog box */
    showPlanDetails(planData: any): void {
        const sortedStates = this.SortPipe.transform(planData.states);
        const planDetails = {
            planId: planData.planId,
            planName: planData.planName,
            states: sortedStates,
            mpGroup: this.mpGroup,
        };
        const dialogRef = this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }

    updateReceivingHQ(): void {
        this.isReceivingHQ = false;
        this.plans.forEach((plan) => {
            plan.selected = false;
        });
    }
    // To display state column values based on length
    displayValues(values: any, option: string, from: string): any {
        let displayValue = "";
        if (option === "tooltip") {
            for (const value of values) {
                displayValue += `<div>${value.name}</div>`;
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
    // To check if Select all check box is already selected
    isAllSelected(option: string): boolean {
        const numSelected = this.selection[option].selected.length;
        const numRows = this.numRows[option];
        if (option === this.fromPretax && this.preTaxCheckbox && !this.preTaxCheckbox.checked) {
            return true;
        }
        return numSelected === numRows;
    }
    /**
     * To toggle between selections made at product level
     * @param option selected option
     * @param event change event object emitted by radio button
     */
    masterToggle(option: string, event?: MatRadioChange): void {
        if (option === this.fromPretax) {
            this.updateSelectedPlansTaxStatus(event.value);
        } else {
            if (this.isAllSelected(option)) {
                this.clearSelection(option);
            } else {
                this.updatePlans(option);
            }
            if (this.managePlanYearChoice) {
                this.overlappingPlanError = this.checkOverlappingCoverageDates();
            }
            if (option === this.fromPlans) {
                this.productPlansNotSelected = false;
            }
        }
    }
    /**
     * This method is used to clear the selection and update plans data based on un-check of select all
     * @param option is the variable used to define which selections have to clear
     */
    clearSelection(option: string): void {
        if (option === this.fromPretax || option === this.fromPlans) {
            this.selection[this.fromPretax] = new SelectionModel(
                true,
                this.selection[this.fromPretax].selected.filter((plan) => (plan.taxStatusReadOnly && plan.preTax ? true : false)),
            );
        }
        if (option !== this.fromPretax) {
            this.selection[option].clear();
        }
        if (option === this.fromAssistanceRequired || option === this.fromPlans) {
            this.restrictedStates = true;
            this.filtersData[this.fromCarriers].forEach((carrier) => {
                if (carrier[option] !== undefined) {
                    carrier[option] = false;
                }
            });
        }
        this.allPlans.data.forEach((plan) => {
            if (
                plan[option] !== undefined &&
                (option !== this.fromPretax || (!plan.taxStatusReadOnly && plan.preTaxEligible)) &&
                (option !== this.fromAssistanceRequired || plan.selected)
            ) {
                if (plan.managePlanYear && option !== this.fromAssistanceRequired) {
                    this.selection[option].select(plan);
                } else {
                    plan[option] = false;
                }
                if (option === this.fromPlans) {
                    if (!plan.taxStatusReadOnly && plan.preTaxEligible) {
                        plan[this.fromPretax] = false;
                    }
                    plan[this.fromAssistanceRequired] = false;
                }
            }
        });
        // Update Plan Selections
        this.updateSelection();
        this.agentAssistanceForRestricted();
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
    }
    /**
     * This method is used to update all plans based on select all checkbox changes
     * @param option is the variable used to define which plan selections have to update
     */
    updatePlans(option: string): void {
        if (option === this.fromAssistanceRequired) {
            this.restrictedStates = false;
            this.filtersData[this.fromCarriers].forEach((carrier) => {
                if (carrier[option] !== undefined) {
                    carrier[option] = true;
                    this.selection[option].select(carrier);
                }
            });
            this.allPlans.data.forEach((plan) => {
                if (plan[option] !== undefined && plan.selected) {
                    plan[option] = true;
                }
            });
        } else {
            this.allPlans.data.forEach((plan) => {
                if (
                    plan[option] !== undefined &&
                    (option !== this.fromPretax || ((!plan.taxStatusReadOnly || plan.preTaxEligible) && plan.selected)) &&
                    (option !== this.fromPlans ||
                        !this.selectedHQFundedProductIds.some((selectedProductId) => selectedProductId === plan.productId))
                ) {
                    plan[option] = true;
                    this.selection[option].select(plan);
                }
            });
            this.agentAssistanceForRestricted();
            this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        }
        // Update Plan Selections
        this.updateSelection();
    }
    /**
     * @description To update plans data based on checkbox changes
     * This method is used to call @method checkArgusSelectedPlans and @method setAgentAssistance on toggle of plan check-box
     * @param event is the event on click of checkbox
     * @param row the row in the table
     * @param option the option of the plan selected
     */
    updateCheckedPlans(event: { checked: boolean; value: string }, row: { name: string } & PlanPanel, option: string): void {
        if (!row.selected) {
            this.selectedPlan = row;
        }

        this.isRestrictedPlanSelected = false;
        if (option === this.fromAssistanceRequired) {
            this.restrictedStatesrow = row;
            this.restrictedStateAlertCarrier = this.languageStrings["primary.portal.benefitsOffering.selfEnrollTxt"]
                .replace("#restrictedStates", this.enrollmentRestrictedStates)
                .replace("#planName", `${row.name} ${AppSettings.PLANS}`);
            this.restrictedStatesCarrierSpecific = true;
            this.filtersData[this.fromCarriers].forEach((carrier) => {
                if (carrier.name === row.name) {
                    carrier[option] = event.checked;
                    if (event.checked) {
                        this.restrictedStatesCarrierSpecific = false;
                        this.restrictedStatesrow = row;
                    }
                }
            });
        } else if (event || event.value) {
            this.allPlans.data.forEach((plan) => {
                if (
                    (option !== this.fromAssistanceRequired && plan.planId === row.planId) ||
                    (option === this.fromAssistanceRequired && plan.carrier === row.name && plan.selected)
                ) {
                    if (option === this.fromPlans) {
                        plan.selected = event.checked;
                        this.productPlansNotSelected = false;
                    } else if (event.value) {
                        plan.taxStatus = event.value;
                    }
                }
            });
        }
        // Deselecting all the ADV plans in plansList if any of the plans of same product is selected
        if (this.selectedPlan && this.selectedPlan.carrierId === CarrierId.ADV) {
            this.plansList.forEach((plans) => {
                if (plans.productId === this.selectedPlan.productId) {
                    plans.selected = false;
                }
            });
        }
        // Update Plan Selections
        this.updateSelection();
        this.agentAssistanceForRestricted();
        this.selection[option].toggle(row);
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        if (this.isExceptionProduct) {
            this.isHcfsaPlan = true;
        }
        this.checkboxActionsForExceptions();
        this.checkArgusSelectedPlans();
        if (this.managePlanYearChoice) {
            this.overlappingPlanError = this.checkOverlappingCoverageDates();
        }
        this.setAgentAssistance();
    }
    /**
     * This method is used to set Agent assistance flag to true or false per carrier
     */
    setAgentAssistance(): void {
        if (
            ((this.selection[this.fromAssistanceRequired].hasValue() && this.isAllSelected(this.fromAssistanceRequired)) ||
                (!this.minEmployees && !this.isTPPAccount) ||
                this.isRestrictedPlanSelected) &&
            !this.isEmpFunded
        ) {
            this.filtersData[this.fromCarriers].forEach((carrier) => {
                if (carrier[this.fromAssistanceRequired] !== undefined) {
                    carrier[this.fromAssistanceRequired] = true;
                    this.selection[this.fromAssistanceRequired].select(carrier);
                }
            });
            this.allPlans.data.forEach((plan) => {
                if (plan[this.fromAssistanceRequired] !== undefined && plan.selected) {
                    plan[this.fromAssistanceRequired] = true;
                }
            });
        }
    }

    /**
     * This method is used to enable / disable argus plan check-boxes based on planRestriction value and tiered plans
     * This method is used to call @method checkArgusSelectedPlans from quasiService
     */
    checkArgusSelectedPlans(): void {
        this.quasiService.checkArgusSelectedPlans(
            this.argusDentalCarrierMaps,
            this.argusVisionCarrierMaps,
            this.situsState,
            this.employeesFromGroupAttribute,
            this.allPlans.data,
            this.isRestrictedToSinglePlan,
            this.selectedCarriers,
            this.disableArgusTierPlans,
            this.productIdNumber,
            this.argusDentalTiers,
            this.selectedPlan,
        );
    }
    // To toggle columns based on selection of pre tax and cafeteria
    togglePretaxCafeteria(option: string): void {
        if (option === this.fromAssistanceRequired) {
            this.assitancePerCarrier = true;
        } else {
            this.preTaxSetPerPlan = true;
        }
        if (this.preTaxSetPerPlan) {
            this.displayedPlansColumns = Object.values(PlansColumns);
        }
    }

    /**
     * Method to configure filters initially
     */
    configureFilters(): void {
        const valuesList = { carriers: [], riders: [], states: [] };
        this.plansToCompare.forEach((item) => {
            valuesList.carriers.push({
                name: item.carrier,
                agentAssisted: false,
                agentAssistedDisabled: item.agentAssistedDisabled,
                policyOwnershipType: item.policyOwnershipType,
            });
            for (const rider of item.riders) {
                valuesList.riders.push(rider);
            }
            for (const state of item.states) {
                valuesList.states.push(state);
            }
        });
        this.filtersData[this.fromCarriers] = [];
        const planSelected = this.plansToCompare.filter((plan) => plan.selected).pop();
        this.distinctArrayValues(valuesList.carriers).forEach((carrier) => {
            if (
                planSelected &&
                this.plansToCompare.filter((plan) => plan.carrier === carrier.name && plan.agentAssisted && plan.selected).pop()
            ) {
                carrier.agentAssisted = true;
            }
            if (!planSelected && this.plansToCompare.filter((plan) => plan.carrier === carrier.name && plan.agentAssisted).pop()) {
                carrier.agentAssisted = true;
            }
            if (!carrier.agentAssistedDisabled && (this.isRole20User || !this.isRestrictedPlanSelected)) {
                this.isAllowChange = true;
            }
            this.filtersData[this.fromCarriers].push(carrier);
        });
        if (!this.isReceivingHQ || !this.isAllowChange || (!this.minEmployees && !this.isTPPAccount) || this.isRestrictedPlanSelected) {
            this.filtersData[this.fromCarriers].forEach((carrier) => {
                carrier.agentAssisted = true;
            });
        }
        this.filtersData[this.fromRiders] = this.distinctArrayValues(valuesList.riders);
        this.filtersData[this.fromStates] = this.distinctArrayValues(valuesList.states);
    }
    // To return distinct array values from duplicate array values
    distinctArrayValues(valuesList: any): any {
        const enteredFlags = {};
        return valuesList
            .filter((item) => {
                if (enteredFlags[item["name"]]) {
                    return false;
                }
                enteredFlags[item["name"]] = true;
                return true;
            })
            .sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
    }
    // To filter data based on selected filter data
    filterApply(val: string): any {
        switch (val) {
            case this.fromCarriers:
                this.filterValue[val] = this.form.controls.carriersFilter.value;
                this.carriersFilterDropdown.close();
                break;
            case this.fromRiders:
                this.filterValue[val] = this.form.controls.ridersFilter.value;
                this.ridersFilterDropdown.close();
                break;
            case this.fromStates:
                this.filterValue[val] = this.form.controls.statesFilter.value;
                this.statesFilterDropdown.close();
                break;
        }
        this.filter.query[val] = this.filterValue[val].map((item) => item.toLowerCase());
        this.isDisplayFilter[val] = ": " + this.filterDisplayContent(this.filtersData[val], this.filterValue[val], val);
        this.filterDataObject();
    }
    // To reset values of filter on click of reset
    resetVal(val: string): void {
        this.isDisplayFilter[val] = "";
        this.filterValue[val] = [];
        switch (val) {
            case this.fromCarriers:
                this.form.controls.carriersFilter.reset();
                this.filter.query.carrier = [];
                this.carriersFilterDropdown.close();
                break;
            case this.fromRiders:
                this.form.controls.ridersFilter.reset();
                this.filter.query.riders = [];
                this.ridersFilterDropdown.close();
                break;
            case this.fromStates:
                this.form.controls.statesFilter.reset();
                this.filter.query.states = [];
                this.statesFilterDropdown.close();
                break;
        }
        this.filterDataObject();
    }
    // To pass data to DataFilter pipe
    filterDataObject(): void {
        this.filter = this.utilService.copy(this.filter);
        this.allPlans.data = this.dataFilter.transform(this.plans, this.filter);
    }
    // Function to display the selected data in filters based on the item length condition and concatination
    filterDisplayContent(optionsList: any, selectedOptions: any, filterName: string): any {
        let arr = [];
        if (selectedOptions) {
            selectedOptions.forEach((element) => {
                if (element) {
                    arr =
                        filterName === this.fromStates
                            ? arr.concat(" " + optionsList.filter((item) => item.name === element).pop().abbreviation)
                            : arr.concat(element);
                }
            });
        }
        if (optionsList.length === arr.length) {
            return "ALL";
        }
        if (
            (arr.length <= 1 && (filterName === this.fromCarriers || filterName === this.fromRiders)) ||
            (arr.length <= 3 && filterName === this.fromStates)
        ) {
            return arr.toString().trim();
        }
        return arr.length;
    }
    // Function to implement Indeterminate state
    isIndeterminate(val: string): boolean | undefined {
        switch (val) {
            case this.fromCarriers:
                return (
                    this.form.controls.carriersFilter.value &&
                    this.filtersData[this.fromCarriers].length &&
                    this.form.controls.carriersFilter.value.length &&
                    this.form.controls.carriersFilter.value.length < this.filtersData[this.fromCarriers].length
                );
            case this.fromStates:
                return (
                    this.form.controls.statesFilter.value &&
                    this.filtersData[this.fromStates].length &&
                    this.form.controls.statesFilter.value.length &&
                    this.form.controls.statesFilter.value.length < this.filtersData[this.fromStates].length
                );
            case this.fromRiders:
                return (
                    this.form.controls.ridersFilter.value &&
                    this.filtersData[this.fromRiders].length &&
                    this.form.controls.ridersFilter.value.length &&
                    this.form.controls.ridersFilter.value.length < this.filtersData[this.fromRiders].length
                );
        }
        return undefined;
    }
    // To check whether select all in states filter is checked
    isChecked(val: string): boolean | undefined {
        switch (val) {
            case this.fromCarriers:
                return (
                    this.form.controls.carriersFilter.value &&
                    this.filtersData[this.fromCarriers].length &&
                    this.form.controls.carriersFilter.value.length === this.filtersData[this.fromCarriers].length
                );
            case this.fromStates:
                return (
                    this.form.controls.statesFilter.value &&
                    this.filtersData[this.fromStates].length &&
                    this.form.controls.statesFilter.value.length === this.filtersData[this.fromStates].length
                );
            case this.fromRiders:
                return (
                    this.form.controls.ridersFilter.value &&
                    this.filtersData[this.fromRiders].length &&
                    this.form.controls.ridersFilter.value.length === this.filtersData[this.fromRiders].length
                );
        }
        return undefined;
    }
    // To Select all and Unselect all based on checkbox click
    toggleSelection(change: MatCheckboxChange, val: string): any {
        if (change.checked) {
            switch (val) {
                case this.fromStates: {
                    const statesInLowerCase = this.filtersData[this.fromStates].map((element) => element.name);
                    this.isDisplayFilter[this.fromStates] =
                        ": " +
                        this.filterDisplayContent(this.filtersData[this.fromStates], this.filterValue[this.fromStates], this.fromStates);
                    this.form.controls.statesFilter.setValue(statesInLowerCase);
                    break;
                }
                case this.fromRiders: {
                    const ridersInLowerCase = this.filtersData[this.fromRiders].map((element) => element.name);
                    this.isDisplayFilter[this.fromRiders] =
                        ": " +
                        this.filterDisplayContent(this.filtersData[this.fromRiders], this.filterValue[this.fromRiders], this.fromRiders);
                    this.form.controls.ridersFilter.setValue(ridersInLowerCase);
                    break;
                }
                case this.fromCarriers: {
                    const carriersInLowerCase = this.filtersData[this.fromCarriers].map((element) => element.name);
                    this.isDisplayFilter[this.fromCarriers] =
                        ": " +
                        this.filterDisplayContent(
                            this.filtersData[this.fromCarriers],
                            this.filterValue[this.fromCarriers],
                            this.fromCarriers,
                        );
                    this.form.controls.carriersFilter.setValue(carriersInLowerCase);
                    break;
                }
            }
        } else {
            switch (val) {
                case this.fromStates:
                    this.form.controls.statesFilter.setValue([]);
                    break;
                case this.fromRiders:
                    this.form.controls.ridersFilter.setValue([]);
                    break;
                case this.fromCarriers:
                    this.form.controls.carriersFilter.setValue([]);
                    break;
            }
        }
    }
    /**
     * @description To update vasSelection model with currently selected HQ plan
     * @param row {planId: number} the row of the radio button checked
     * @returns {void}
     */
    updateHQPlan(row: { planId: number }): void {
        this.allPlans.data.forEach((plan) => {
            if (plan.planId === row.planId) {
                plan[PlansColumns.SELECTED] = true;
            } else {
                plan[PlansColumns.SELECTED] = false;
            }
        });
        this.plans = this.allPlans.data;
        this.isSelected = true;
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        this.productPlansNotSelected = false;
    }
    /**
     * @description To deselect all the plans selected when none radio button is checked
     * @returns {void}
     */
    deselectPlans(): void {
        this.allPlans.data.forEach((plan) => {
            plan.selected = false;
        });
        this.isSelected = false;
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
    }

    // This method will close the modal.
    closeModal(): void {
        this.dialog.closeAll();
    }
    /**
     * updates plan choices to store
     * @param isplanChoiceCreated indicates if plan choice is created or not
     * @param planChoicesToUpdate plan choices to update
     * @param editedPlanChoices list of edited plan choices
     * @param fromNext indicates whether called form Next click or on load
     */
    updatePlanChoices(
        isplanChoiceCreated: boolean,
        planChoicesToUpdate: PlanChoice[],
        editedPlanChoices: PlanPanel[],
        fromNext?: boolean,
    ): void {
        forkJoin(
            this.benefitsOfferingService.getPlanChoices(true, false, this.mpGroup),
            this.benefitsOfferingService.getPlanChoices(false, false, this.mpGroup),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([response, response2]: [PlanChoice[], PlanChoice[]]) => {
                    let combinedPlans: PlanChoice[];
                    // eslint-disable-next-line prefer-const
                    combinedPlans = this.combinePlanChoices(response, combinedPlans);
                    for (const planChoiceToUpdate of planChoicesToUpdate) {
                        const planChoiceAgent = planChoiceToUpdate.agentAssisted;
                        if (planChoiceToUpdate.id !== 0) {
                            const responseFiltered: PlanChoice = this.getFilteredPlanChoicesToUpdate(
                                planChoiceToUpdate,
                                combinedPlans,
                                response2,
                            );
                            if (responseFiltered) {
                                planChoicesToUpdate[planChoicesToUpdate.indexOf(planChoiceToUpdate)] = {
                                    ...responseFiltered,
                                    agentAssisted: planChoiceAgent,
                                };
                            }
                        }
                    }
                    if (this.data.opensFrom === PLANS && response2 && response2.length) {
                        const filteredPlanChoice = response2.filter((planChoice) =>
                            editedPlanChoices.some(
                                (choice) => choice.planId === planChoice.plan.id && choice.taxStatus === TaxStatus.PRETAX,
                            ),
                        );
                        if (filteredPlanChoice && filteredPlanChoice.length) {
                            this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(filteredPlanChoice));
                        }
                    }
                    this.store.dispatch(new SetUnapprovedPlanChoicesWithPayload(response));
                    if (planChoicesToUpdate.length) {
                        this.updatePlanChoicesValue(planChoicesToUpdate, editedPlanChoices, isplanChoiceCreated);
                    }
                    this.changeProduct(fromNext);
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * get Filtered plan choices to update
     * @param planChoiceToUpdate
     * @param combinedPlans
     * @param planChoiceApproved
     * @returns filtered plan choice
     */
    getFilteredPlanChoicesToUpdate(
        planChoiceToUpdate: PlanChoice,
        combinedPlans: PlanChoice[],
        planChoiceApproved: PlanChoice[],
    ): PlanChoice {
        let responseFiltered: PlanChoice;
        if (combinedPlans && combinedPlans.length && combinedPlans.some((choice) => choice.plan.id === planChoiceToUpdate.planId)) {
            responseFiltered = combinedPlans.find(
                (choice) => choice.plan.id === planChoiceToUpdate.planId && choice.taxStatus === planChoiceToUpdate.taxStatus,
            );
        } else if (
            planChoiceApproved &&
            planChoiceApproved.length &&
            planChoiceApproved.some((choice) => choice.plan.id === planChoiceToUpdate.planId)
        ) {
            responseFiltered = planChoiceApproved.find(
                (choice) => choice.plan.id === planChoiceToUpdate.planId && choice.taxStatus === planChoiceToUpdate.taxStatus,
            );
        }
        return responseFiltered;
    }
    /**
     * Update plan choices value
     * @param planChoicesToUpdate
     * @param editedPlanChoices
     * @param isPlanChoiceCreated
     */
    updatePlanChoicesValue(planChoicesToUpdate: PlanChoice[], editedPlanChoices: PlanPanel[], isPlanChoiceCreated: boolean): void {
        if (this.planYearChoice === null && this.data.opensFrom !== "plans") {
            this.store.dispatch(new MapPlanChoicesToPlans(planChoicesToUpdate));
        } else {
            this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(planChoicesToUpdate));
        }
        this.plansList.forEach((plan) => {
            const planEdited = editedPlanChoices.filter((editedPlan) => editedPlan.planId === plan.planId).pop();
            this.updateEditedPlanChoices(planEdited, isPlanChoiceCreated, planChoicesToUpdate, plan);
        });
    }
    /**
     * Method to updates edited plan choices
     * @param planEdited edited plans
     * @param isplanChoiceCreated indicates if plan choice is created or not
     * @param planChoicesToUpdate plan choices to update
     * @param plan plan details
     */
    updateEditedPlanChoices(planEdited: PlanPanel, isplanChoiceCreated: boolean, planChoicesToUpdate: PlanChoice[], plan: PlanPanel): void {
        if (planEdited) {
            if (isplanChoiceCreated) {
                const planChoice = planChoicesToUpdate
                    .filter((choice) => (choice.id ? choice.plan.id === plan.planId : choice.planId === plan.planId))
                    .pop();
                if (planChoice && planChoice.id !== 0 && !this.planChoiceIdToUpdate.some((id) => id === planChoice.id)) {
                    planEdited.planChoiceId = planChoice.id;
                    planEdited.agentAssisted = planChoice.agentAssisted;
                    this.storeAndArrangeDeletePlanChoice(planChoice);
                }
            }
            this.plansList[this.plansList.indexOf(plan)] = planEdited;
        }
    }
    /**
     * Method to change or go to next product
     * @param fromNext indicates whether called form Next click or on load
     */
    changeProduct(fromNext: boolean): void {
        if (fromNext || fromNext === undefined) {
            // fixes for sidenavigation after plan selection
            if (this.sideNavTrigger || this.isSideNavSelected) {
                this.sideNavTrigger = false;
                this.quasiService.planChoiceMade$.next({
                    productIndex: this.presentProductIndex,
                    completed: this.plans.filter((plan) => plan.selected).length,
                });
                this.quasiService.changeProduct$.next(true);
            } else {
                this.checkProductSelections(true);
            }
        } else {
            this.plansToCompare = this.utilService.copy(this.plans);
        }
    }
    /**
     * check if plans are selected and proceed to load next product or restrict based on selected product
     * @param {boolean} fromNext indicates whether called from next or on load
     */
    checkProductSelections(fromNext: boolean): void {
        if (
            this.allPlans.data.some((plan) => plan.productId === `${plan.productIdNumber}i`) ||
            this.plansList.some((plan) => plan.productIdNumber === this.productIdNumber && plan.selected) ||
            this.checkVASPlanSelection()
        ) {
            this.goToNextProduct(fromNext);
        } else {
            this.alertDialog();
            if (this.isNoneSelected) {
                this.restrictedCarriers.forEach((carrier) => (carrier.disabled = false));
                this.carrierChoice = null;
            }
        }
    }
    /**
     * Method to combine plan choices.
     * @param planChoices plan choices from API
     * @param combinedPlans combine plan choices
     * @returns combinedPlans
     */
    combinePlanChoices(planChoices: PlanChoice[], combinedPlans: PlanChoice[]): PlanChoice[] {
        const userPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.GetUserPlanChoices);
        const currentPlanYearId = this.store.selectSnapshot(BenefitsOfferingState.getCurrentPlanYearId);
        if (planChoices && planChoices.length && this.managePlanYearChoice) {
            const ids = planChoices.map((item) => item.id);
            const filteredPlanYearPlans = userPlanChoices.filter(
                (userPlanChoice) => !ids.includes(userPlanChoice.id) && userPlanChoice.planYearId === currentPlanYearId,
            );
            const filteredPlans = filteredPlanYearPlans.filter(
                (filteredPlan) =>
                    !planChoices.some(
                        (planChoicesPlan) =>
                            planChoicesPlan.plan.id === filteredPlan.plan.id && planChoicesPlan.taxStatus !== filteredPlan.taxStatus,
                    ),
            );
            combinedPlans = planChoices.concat(filteredPlans);
        } else if (planChoices && planChoices.length && !this.managePlanYearChoice) {
            combinedPlans = planChoices;
        } else if (this.managePlanYearChoice) {
            combinedPlans = userPlanChoices.filter((userPlanChoice) => userPlanChoice.planYearId === currentPlanYearId);
        }
        return combinedPlans;
    }
    /**
     * Used to get DHMO plan ids
     */
    getDHMOPlans(): void {
        this.staticUtilService.cacheConfigValue(ArgusConfig.DENTAL_PPO_MAC_PLAN).subscribe((result) => {
            const PPOMACPlans = result.replace("[", "").replace("]", "");
            this.PPOMACPlanIds = PPOMACPlans.split(",").map((eachPlanId) => +eachPlanId.replace(/"/g, ""));
        });
    }

    /**
     * function is used to check to go for next product
     * @param changesMade indicates if changes are made
     */
    /* eslint-disable-next-line complexity */
    goToNextProduct(changesMade: boolean): void {
        this.isPLHSOProductSelectedError = false;
        if (this.isHQFunded) {
            this.selectedHQFundedProductIds = [];
            const selectedHQFundedProduct = this.plans.filter((plan) => plan.selected);
            if (selectedHQFundedProduct && selectedHQFundedProduct.length) {
                this.selectedHQFundedProductIds = selectedHQFundedProduct.map((hqPlan) => hqPlan.productId);
            }
        }
        const nextProduct = this.productList[this.presentProductIndex + 1];
        if (nextProduct) {
            if (changesMade) {
                let completed = false;
                completed = this.isNoneSelected;
                if (this.plans.filter((plan) => plan.selected).length) {
                    completed = true;
                }
                this.quasiService.planChoiceMade$.next({
                    productIndex: this.presentProductIndex,
                    completed: completed,
                });
                this.quasiService.defaultStepPositionChanged$.next(3);
            }
            this.quasiService.updateSelectedProductId(nextProduct.id);
        } else {
            const selectedPlans = this.plansList.filter((plan) => plan.selected);
            const aflacCarrierIds = this.carrierMaps
                .filter((carrierData) => [`${CarrierIdType.AFLAC}`, `${CarrierIdType.ADV}`].includes(carrierData.carrier))
                .reduce((carrierIds, carrier) => [...carrierIds, ...carrier.ids.map((id) => +id)], new Array<number>());
            // Logic to check if at least 1 aflac plan is selected
            const approvedCarriers = this.store
                .selectSnapshot(BenefitsOfferingState.getPlanChoices)
                .map((planData) => planData.plan.carrierId);
            const advCarrier = this.carrierMaps.find((carrierData) => carrierData.carrier === CarrierIdType.ADV);
            const selectedCarriers = approvedCarriers.concat(selectedPlans.map((plan) => plan.carrierId));
            const selectedAflacPlans = selectedCarriers.filter((carrierId) => aflacCarrierIds.indexOf(carrierId) >= 0);
            const selectedAflacPlansForPlanYear = selectedPlans.filter((plan) => aflacCarrierIds.includes(plan.carrierId));
            const selectedADVPlans: PlanPanel[] = advCarrier
                ? selectedPlans.filter((plan) => plan.carrierId === Number(advCarrier.ids))
                : [];
            const PLHSOProduct = selectedPlans.filter((plan) => plan.planId === ArgusPlanId.Aflac_PLHSO_Plan_ID && plan.selected);

            if (this.situsState === StateAbbreviations.FLORIDA && PLHSOProduct.length) {
                const DentalPLHSOProductCount = selectedPlans.filter((plan) => this.PPOMACPlanIds.includes(plan.planId)).length;

                if (
                    DentalPLHSOProductCount < this.MIN_PLHSO_PRODUCT_SELECT ||
                    selectedADVPlans.length < MIN_PLHSO_NON_PLHSO_PLAN_SELECT_FOR_FL_STATE
                ) {
                    this.isPLHSOProductSelectedError = true;
                    this.isError = true;
                }
            }
            if (
                selectedPlans.length &&
                ((!selectedAflacPlansForPlanYear.length && this.data.opensFrom === this.copyNewPlanYear) ||
                    (!selectedAflacPlans.length && this.data.opensFrom === this.products))
            ) {
                this.isError = true;
                this.errorMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.1AflacPlan"];
            } else if (this.isPLHSOProductSelectedError) {
                this.isError = true;
                this.errorMessage = this.secondaryLanguages[ArgusLanguage.SELECT_ONE_NON_PLHSO_PRODUCT];
            } else if (selectedPlans.length && (selectedAflacPlans.length || this.data.opensFrom !== this.products)) {
                this.quasiService.defaultStepPositionChanged$.next(NEXT_DEFAULT_PLAN_POSITION);
            } else if (selectedPlans.length && this.data.opensFrom === this.products && (this.isHQFunded || this.isEmpFunded)) {
                this.showMinAflacErrorMsg();
            } else {
                this.alertDialog();
            }
        }
    }

    /**
     * Used to get error message depends on minimum aflac plan select
     */
    showMinAflacErrorMsg(): void {
        this.isError = true;
        this.errorMessage =
            this.minimumAflacToSelect > 1
                ? this.languageStrings["primary.portal.benefitOffering.productsVasError"].replace(
                      "##vascount##",
                      String(this.minimumAflacToSelect),
                  )
                : this.languageStrings["primary.portal.benefitsOffering.productVas"].replace(
                      "##vascount##",
                      String(this.minimumAflacToSelect),
                  );
    }
    /**
     * Opens alert dialog to select plans
     */
    alertDialog(): void {
        this.disableNextButon = false;
        this.alertDialogRef = this.dialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                title: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.plansNotSelectedTitle"),
                content: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.plansNotSelectedSubTitle"),
                secondaryButton: {
                    buttonTitle: " ",
                },
                primaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.gotIt"),
                    buttonClass: "mon-btn-primary",
                },
            },
        });
    }

    /**
     * function to go back to previous screen on click of back
     */
    onBack(): void {
        this.isLoading = true;
        this.backButtonClicked = true;
        this.restrictedStates = false;
        this.multiplePlansSelected = false;
        this.restrictedStatesCarrierSpecific = false;
        this.isADVEROption = false;
        if (this.isEmpFunded && this.skipHQFunded) {
            this.presentProductIndex -= 1;
        }
        const previousProduct = this.productList[this.presentProductIndex - 1];
        if (previousProduct) {
            this.multiplePlansSelected = true;
            this.quasiService.updateSelectedProductId(previousProduct.id);
        } else {
            this.quasiService.stepClicked$.next(1);
        }
    }

    /**
     * To check billing if wagework plans are selected
     * @param fromNext indicates whether called from next or on load
     */
    onSubmit(fromNext: boolean): void {
        this.isVasMaxValid = false;
        if (this.isWageWorksBillingMissing()) {
            this.addBillingContact();
        } else if (this.isVasException && this.isHQFunded && this.maxPlansValue !== 0) {
            const selectedPlans = this.selection[SELECTED] ? this.selection[SELECTED].selected.length : 0;
            if (this.maxPlansValue >= selectedPlans) {
                this.onNext(fromNext);
            } else {
                this.isVasMaxValid = true;
            }
        } else {
            this.onNext(fromNext);
        }
    }
    /**
     * To check billing when wageworks plans are selected
     * @returns boolean
     */
    isWageWorksBillingMissing(): boolean {
        return (
            this.allPlans.data.some((form) => form.carrierId === CarrierId.WAGEWORKS && form.selected) &&
            !this.contactInfoBilling.length &&
            !this.billingAdded
        );
    }

    /**
     * Function to determine if user can proceed to next product without selecting any VAS plans if the product is:
     * 1. HQ/Aflac funded and Employer funded plans are available for selection
     * 2. Employer funded and a selection is made for any VAS plan
     * @returns boolean value to decide submitting the product selection
     */
    checkVASPlanSelection(): boolean {
        return (
            (this.isHQFunded && this.plansList.some((plan) => plan.vasFunding === VasFunding.EMPLOYER)) ||
            (this.isEmpFunded &&
                this.plansList.some(
                    (plan) =>
                        plan.vasFunding && (plan.vasFunding === VasFunding.HQ || plan.vasFunding === VasFunding.EMPLOYER) && plan.selected,
                ))
        );
    }

    /**
     * indicated if next is restricted or not based on plans selection and product to be loaded next
     * @param productIdToBeNavigated product id to be loaded next
     * @returns boolean indicating if next is restricted or not
     */
    isNextRestricted(productIdToBeNavigated?: string): boolean {
        return this.benefitsOfferingHelperService.isNextRestricted(
            this.isHQFunded,
            this.isEmpFunded,
            this.productList,
            this.plansList,
            this.productId,
            this.plans,
            this.isNoneSelected,
            this.productIdNumber,
            productIdToBeNavigated,
        );
    }

    /**
     * To update plan choices on click of next, after checking multiple conditions and restrictions
     * @param fromNext indicates whether called from next or on load
     * @param productIdToBeNavigated product id to be loaded next
     */
    onNext(fromNext: boolean, productIdToBeNavigated?: string): void {
        if (this.isNextRestricted(productIdToBeNavigated)) {
            this.productPlansNotSelected = true;
            this.errorMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.onePlanForProduct"];
            return;
        }
        this.restrictedStates = false;
        this.restrictedStatesCarrierSpecific = false;
        this.isADVEROption = false;
        let planCount = 1;
        const selectedPlanCount = this.plans.filter((plans) => plans.selected).length;
        this.plans.forEach((editedPlan) => {
            if (
                this.isRestrictedToSinglePlan &&
                editedPlan.carrierId === CarrierId.ADV &&
                editedPlan.productName === DENTAL_PLAN &&
                editedPlan.selected &&
                selectedPlanCount > SINGLE_CARRIER_RESTRICTED_PLANS_COUNT &&
                planCount === SINGLE_CARRIER_RESTRICTED_PLANS_COUNT
            ) {
                editedPlan.selected = false;
                planCount++;
            }
        });
        let editedPlanChoices = this.plans.filter(
            (editedPlan) =>
                !this.plansToCompare.some((plan) => JSON.stringify(editedPlan) === JSON.stringify(plan)) &&
                (editedPlan.selected || editedPlan.planChoiceId) &&
                ((this.isEmpFunded && !editedPlan.isEmpFundedPlanDisabled) || !this.isEmpFunded),
        );
        if (this.isNoneSelected || this.isSingleAflacError) {
            const plans = this.plans.filter((ele) => ele.planChoiceId);
            editedPlanChoices = plans.map((plan) => {
                plan.selected = false;
                return plan;
            });
        }
        if (editedPlanChoices.length && this.isHQFunded) {
            // Employee funded plans with same product id as HQ funded is filtered to delete
            const empFundedplans = this.plansList
                .filter(
                    (plan) =>
                        editedPlanChoices.some((editedplan) => editedplan.productId === plan.productId) &&
                        !editedPlanChoices.some((editedplan) => editedplan.planId === plan.planId) &&
                        plan.selected,
                )
                .map((plan) => {
                    plan.selected = false;
                    return plan;
                })
                .filter((plan) => plan.planChoiceId);
            if (empFundedplans.length) {
                editedPlanChoices.push(...empFundedplans);
            }
            this.plansList = this.quasiService.setDeselectedPlans(this.plansList, this.plansToCompare, editedPlanChoices);
        }
        if (editedPlanChoices.length) {
            const previouslySelectedPlans: PlanPanel[] = this.plansToCompare
                .filter(
                    (previousSelectedPlan) =>
                        previousSelectedPlan.selected &&
                        (!this.plans.some((plan) => previousSelectedPlan.planId === plan.planId) ||
                            this.plans.some((plan) => previousSelectedPlan.planId === plan.planId && !plan.selected)),
                )
                .map((selectedPlan) => ({ ...selectedPlan, selected: false }));

            if (previouslySelectedPlans?.length) {
                previouslySelectedPlans.forEach((plan) => {
                    if (!editedPlanChoices.find((editedPlan) => editedPlan.planId === plan.planId)) {
                        editedPlanChoices.push(plan);
                    }
                });
            }
            this.isSideNavSelected = this.sideNavTrigger;
            this.sideNavTrigger = false;
            this.planIndex = 0;
            this.planLength = editedPlanChoices.length;
            this.isplanChoiceCreated = false;
            this.planChoicesToUpdate = [];
            if ((this.isRestrictedToSinglePlan || this.isHQFunded) && editedPlanChoices.length === this.restrictedPlanLength) {
                const deleteRestriction = true;
                const deleteProductObject = editedPlanChoices.filter((pChoice) => !pChoice.selected).pop();
                this.isLoading = true;
                this.deletePlanChoice(
                    this.getPlanChoiceObject(deleteProductObject),
                    editedPlanChoices,
                    fromNext,
                    deleteProductObject,
                    deleteRestriction,
                );
            } else {
                if (this.managePlanYearChoice && this.checkOverlappingCoverageDates()) {
                    this.overlappingPlanError = true;
                    return;
                }
                editedPlanChoices.forEach((planChoiceMade) => {
                    const planChoice: PlanChoice = {
                        id: planChoiceMade.planChoiceId,
                        planId: planChoiceMade.planId,
                        taxStatus: planChoiceMade.taxStatus,
                        cafeteria: planChoiceMade.cafeteria,
                        agentAssisted: this.filtersData[this.fromCarriers]
                            .filter((carrier) => carrier.agentAssisted && carrier.name === planChoiceMade.carrier)
                            .pop()
                            ? true
                            : false,
                    };
                    if (this.managePlanYearChoice && planChoice.taxStatus !== TaxStatus.POSTTAX) {
                        planChoice.planYearId = this.store.selectSnapshot(BenefitsOfferingState.getCurrentPlanYearId);
                    }
                    this.isLoading = true;
                    if (planChoiceMade.selected) {
                        this.createOrUpdatePlanChoices(planChoice, planChoiceMade, editedPlanChoices);
                    } else {
                        this.deletePlanChoice(planChoice, editedPlanChoices, fromNext, planChoiceMade);
                        this.checkForAssociatedPlans(planChoice, editedPlanChoices, fromNext, planChoiceMade);
                    }
                });
            }
        } else if (this.sideNavTrigger) {
            this.sideNavTrigger = false;
            this.quasiService.changeProduct$.next(true);
        } else if (!this.sideNavTrigger) {
            this.checkProductSelections(false);
        }
    }
    /**
     * Check for associated plan choices
     * @param planChoice plan choice to delete
     * @param editedPlanChoices list of edited plan choices
     * @param fromNext indicates whether called on click of next or from initialization
     * @param planChoiceMade current plan choice
     */
    checkForAssociatedPlans(planChoice: PlanChoice, editedPlanChoices: PlanPanel[], fromNext: boolean, planChoiceMade: PlanPanel): void {
        const planChoicesToCompare = [...this.approvedPlanChoices, ...this.unapprovedPlanChoices];
        const associatedPlanChoices = this.utilService.copy(editedPlanChoices);
        const associatedPlanChoiceMade = this.utilService.copy(planChoiceMade);
        const currentPlanYearId = this.store.selectSnapshot(BenefitsOfferingState.getCurrentPlanYearId);
        associatedPlanChoices.forEach((plan) => {
            planChoicesToCompare.forEach((choice) => {
                if (
                    plan.planId === choice.plan.id &&
                    !plan.selected &&
                    plan.taxStatus !== choice.taxStatus &&
                    this.preTaxSetPerPlan &&
                    (choice.taxStatus === TaxStatus.POSTTAX ||
                        (choice.taxStatus === TaxStatus.PRETAX &&
                            choice.planYearId &&
                            currentPlanYearId &&
                            choice.planYearId === currentPlanYearId))
                ) {
                    associatedPlanChoiceMade.taxStatus = choice.taxStatus;
                    associatedPlanChoiceMade.planChoiceId = choice.id;
                    associatedPlanChoiceMade.continous = choice.continuous;
                    associatedPlanChoiceMade.enrollmentEndDate = choice.enrollmentPeriod
                        ? this.datepipe.transform(
                              choice.enrollmentPeriod.expiresAfter
                                  ? choice.enrollmentPeriod.expiresAfter
                                  : new Date().setDate(new Date().getDate() - 1),
                              AppSettings.DATE_FORMAT,
                          )
                        : null;
                    this.deletePlanChoice(planChoice, editedPlanChoices, fromNext, associatedPlanChoiceMade);
                }
            });
        });
    }
    /**
     * checks for invalid plans based on overlapping coverage dates
     * @returns invalid based on coverage dates
     */
    checkOverlappingCoverageDates(): boolean {
        const plansSelected = this.plans.filter(
            (editedPlan) =>
                ((editedPlan.managePlanYear && !editedPlan.planYearId) || !editedPlan.managePlanYear) &&
                !this.plansToCompare.some((plan) => JSON.stringify(editedPlan) === JSON.stringify(plan)) &&
                (editedPlan.selected || editedPlan.planChoiceId) &&
                editedPlan.taxStatus === TaxStatus.PRETAX,
        );
        let overlappingPlanYears: PlanYear[] =
            this.currentPlanYearDetails &&
            this.currentPlanYearDetails.coveragePeriod &&
            this.allPlanYears.filter(
                (planYear) =>
                    planYear.id !== this.planYearId &&
                    ((this.dateService.isBeforeOrIsEqual(
                        this.dateService.toDate(this.currentPlanYearDetails.coveragePeriod.effectiveStarting),
                        this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                    ) &&
                        this.dateService.getIsAfterOrIsEqual(
                            this.dateService.toDate(this.currentPlanYearDetails.coveragePeriod.expiresAfter),
                            this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                        )) ||
                        (this.dateService.isBeforeOrIsEqual(
                            this.dateService.toDate(planYear.coveragePeriod.effectiveStarting || ""),
                            this.dateService.toDate(this.currentPlanYearDetails.coveragePeriod.effectiveStarting),
                        ) &&
                            this.dateService.isBeforeOrIsEqual(
                                this.dateService.toDate(this.currentPlanYearDetails.coveragePeriod.effectiveStarting || ""),
                                this.dateService.toDate(planYear.coveragePeriod.expiresAfter),
                            ))),
            );
        if (overlappingPlanYears && overlappingPlanYears.length && this.data.opensFrom === PLANS) {
            overlappingPlanYears = overlappingPlanYears.filter((planYear) => this.planYearId && planYear.id !== this.planYearId);
        }
        if (overlappingPlanYears && overlappingPlanYears.length) {
            const overlappingPlansList: PlanChoice[] = [];
            const approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
            overlappingPlansList.push(
                ...approvedPlanChoices.filter((planObject) =>
                    overlappingPlanYears.some((planChoice) => planChoice.id === planObject.planYearId),
                ),
            );
            const isIneligiblePlans = plansSelected.some(
                (currentPlan) => currentPlan.selected && overlappingPlansList.some((plan) => plan.plan.id === currentPlan.planId),
            );
            if (isIneligiblePlans) {
                this.overlappingErrorMessage =
                    this.secondaryLanguages["secondary.portal.benefitsOffering.coveragePeriod.overlapping.plans"];
                return true;
            }
        }
        return false;
    }
    /**
     * Add billing contact
     */
    addBillingContact(): void {
        this.isLoading = true;
        const data: AddUpdateContactDialogData = {
            parentMode: ACCOUNT,
            isAdd: true,
            isPrimary: this.contactInfoBilling.length === 0,
            mpGroupId: this.mpGroup.toString(),
            showType: true,
            allowEditingAddress: false,
            allowEditingContactName: false,
            allowEditingPhoneNumber: false,
            allowEditingEmailAddress: false,
        };
        const dialogConfig: MatDialogConfig = {
            data: data,
        };
        const dialogRef = this.empoweredModalService.openDialog(AddUpdateContactInfoComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp) {
                    this.billingAdded = true;
                    this.onNext(true);
                }
                this.isLoading = false;
            });
    }

    /**
     * Method to check what are the existing plan choices
     * @param planChoice
     *
     */
    checkExistingPlanChoice(planChoice: PlanChoice): PlanChoice {
        let existingPlanChoices: PlanChoice[] = [];
        const approvedPlanChoices: PlanChoice[] = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices));
        const unApprovedPlanChoices: PlanChoice[] = this.utilService.copy(
            this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices),
        );
        approvedPlanChoices.push(...unApprovedPlanChoices);
        existingPlanChoices = approvedPlanChoices.filter((eachPlanChoice) => eachPlanChoice.plan.id === planChoice.planId);
        return existingPlanChoices.pop();
    }

    /**
     * Method to create or update plan choices
     * ANY type: Cannot define particular type for planChoiceMade and editedPlanChoices as this accepts few types other than PlanChoice
     * and had already been defined as ANY before.
     * @param planChoice plan choice to update or create
     * @param planChoiceMade data of current plan choice
     * @param editedPlanChoices list of all plan choices
     */
    createOrUpdatePlanChoices(planChoice: PlanChoice, planChoiceMade: PlanPanel, editedPlanChoices: PlanPanel[]): void {
        if (planChoiceMade.planChoiceId) {
            const previousPlanChoice = this.plansSelected.find((plan) => plan.planChoiceId === planChoiceMade.planChoiceId);
            if (
                previousPlanChoice &&
                previousPlanChoice.taxStatus !== planChoiceMade.taxStatus &&
                ((previousPlanChoice.taxStatus === TaxStatus.POSTTAX && !this.checkUnapprovedPlanChoice(planChoiceMade)) ||
                    planChoiceMade.taxStatus === TaxStatus.POSTTAX)
            ) {
                this.planChoiceIdToUpdate = this.planChoiceIdToUpdate.filter((id) => id !== planChoiceMade.planChoiceId);
                this.createPlanChoice(planChoice, editedPlanChoices);
            } else {
                this.planChoiceIdToUpdate.push(planChoiceMade.planChoiceId);
                this.updatePlanChoice(planChoice, editedPlanChoices);
            }
        } else {
            this.createPlanChoice(planChoice, editedPlanChoices);
        }
    }

    /**
     * @param planChoiceMade plan choice
     * @returns boolean
     */
    checkUnapprovedPlanChoice(planChoiceMade: PlanPanel): boolean {
        let existingPlanChoices: PlanChoice[] = [];
        const unApprovedPlanChoices: PlanChoice[] = this.utilService.copy(
            this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices),
        );
        existingPlanChoices = unApprovedPlanChoices.filter(
            (eachPlanChoice) => eachPlanChoice.plan.id === planChoiceMade.planId && eachPlanChoice.taxStatus === planChoiceMade.taxStatus,
        );
        return existingPlanChoices && existingPlanChoices.length > 0;
    }

    // To create the plan choice after selecting the plans from the list
    createPlanChoice(planChoice: PlanChoice, editedPlanChoices: any): void {
        this.benefitsOfferingService
            .createPlanChoice(planChoice, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.planChoicesToUpdate.push(planChoice);
                    this.isplanChoiceCreated = true;
                    this.planIndex += 1;
                    if (this.planIndex === this.planLength) {
                        this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                    }
                },
                (errorresp) => {
                    this.isplanChoiceCreated = true;
                    this.planIndex += 1;
                    if (this.planIndex === this.planLength) {
                        this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                    }
                },
            );
    }

    // To update the existing plans from selected plan list
    updatePlanChoice(planChoice: PlanChoice, editedPlanChoices: any): void {
        this.benefitsOfferingService
            .updatePlanChoice(planChoice, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    const existingPlanChoice = this.quasiService.checkExistingPlanChoice(planChoice);
                    if (existingPlanChoice) {
                        this.quasiService.setPlansChoices([
                            this.benefitsOfferingService
                                .updatePlanChoice(this.getCreatePlanChoiceObject(existingPlanChoice), this.mpGroup)
                                .pipe(catchError((error) => of(error))),
                        ]);
                    }
                    this.planChoicesToUpdate.push(planChoice);
                    this.planIndex += 1;
                    if (this.planIndex === this.planLength) {
                        this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                    }
                },
                (errorresp) => {
                    this.planIndex += 1;
                    if (this.planIndex === this.planLength) {
                        this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                    }
                },
            );
    }
    /**
     * Deleting plan choices based on restricted condition
     * @param planChoice plan choice to delete
     * @param editedPlanChoices list of edited plan choices
     * @param fromNext indicates whether called on click of next or from initialization
     * @param planChoiceMade current plan choice
     * @param restrictionFlag indicates whether single plan restriction is present or not
     */
    deletePlanChoice(
        planChoice: PlanChoice,
        editedPlanChoices: PlanPanel[],
        fromNext: boolean,
        planChoiceMade: PlanPanel,
        restrictionFlag?: boolean,
    ): void {
        const deletedPlan: DeletePlanChoice = {};
        if (planChoiceMade.planChoiceId) {
            this.benefitsOfferingService
                .deletePlanChoice(
                    deletedPlan,
                    planChoiceMade.planChoiceId,
                    this.mpGroup,
                    planChoiceMade.continous
                        ? planChoiceMade.enrollmentEndDate
                            ? planChoiceMade.enrollmentEndDate
                            : this.datepipe.transform(new Date().setDate(new Date().getDate() - 1), AppSettings.DATE_FORMAT)
                        : null,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        planChoiceMade.planChoiceId = null;
                        planChoice.id = 0;
                        this.planChoicesToUpdate.push(planChoice);
                        this.planIndex += 1;
                        if (this.planIndex === this.planLength) {
                            this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices, fromNext);
                        }
                        if (restrictionFlag && !this.isNoneSelected) {
                            const addProductObject = editedPlanChoices.filter((pChoice) => pChoice.selected).pop();
                            const addPlanChoiceObject = this.getPlanChoiceObject(addProductObject);
                            if (addProductObject.planChoiceId) {
                                this.updatePlanChoice(addPlanChoiceObject, editedPlanChoices);
                            } else {
                                this.createPlanChoice(addPlanChoiceObject, editedPlanChoices);
                            }
                        }
                    },
                    (errorresp) => {
                        this.planIndex += 1;
                        if (errorresp.status === ClientErrorResponseCode.RESP_404) {
                            planChoice.id = 0;
                            this.planChoicesToUpdate.push(planChoice);
                        }
                        if (this.planIndex === this.planLength) {
                            this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                        }
                    },
                );
        } else {
            this.isLoading = false;
            this.checkProductSelections(true);
        }
    }

    /**
     * to create the plan choice object for request parameter
     * @param deleteProd Plan data to be deleted
     * @returns PlanChoice details of the plan choice
     */
    getPlanChoiceObject(deleteProd: PlanPanel): PlanChoice {
        return {
            id: deleteProd.planChoiceId,
            planId: deleteProd.planId,
            taxStatus: deleteProd.taxStatus,
            cafeteria: deleteProd.cafeteria,
            planYearId: this.planYearId,
            agentAssisted: this.filtersData[this.fromCarriers]
                .filter((carrier) => carrier.agentAssisted && carrier.name === deleteProd.carrier)
                .pop()
                ? true
                : false,
        };
    }

    /**
     * To check whether the RSLI products are available to display the respective disclaimer and update the message
     * @returns If RSLI product present then true else false
     */
    checkRSLIPlanExist(): boolean {
        if (this.allPlans.data.find((plan) => AppSettings.RELIANCE_CARRIER.indexOf(plan.carrier) > -1 && plan.selected)) {
            this.updatePlanSpecificDisclaimer();
            return true;
        }
        return false;
    }

    /**
     * To check if pretax checkbox is selected, make seletced plan with pretax true
     * @param isPreTax pretax checkbox value for plan
     * @returns boolean if pretax is checked
     */
    checkPretaxForSelectedPlan(isPreTax: boolean): boolean {
        if (!this.preTaxSetPerPlan && this.preTaxCheckbox.checked) {
            return isPreTax;
        }
        return false;
    }

    /**
     * Update the disclaimer based on product selected
     * @returns disclaimer message based on the product selected
     */
    updatePlanSpecificDisclaimer(): string {
        const product = this.allPlans.data[0];
        if (product.productName === VISION_PLAN) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansVisionDisclaimer"];
        } else if (product.productName === DENTAL_PLAN) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansDentalDisclaimer"];
        } else if (product.productName === LTD_PLAN || product.productName === BASIC_LIFE) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer"];
        }
        return this.disclaimerMessage;
    }

    /**
     * Loading essential configs needed for the MBO flow
     * call to minimum employee check
     */
    getRestricteStatesConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(ConfigName.RESTRICTED_STATE_FOR_SELF_ENROLLMENT),
            this.staticUtilService.cacheConfigValue(ConfigName.MINIMUM_AFLAC_PLANS_REQUIRED_FOR_VAS),
            this.staticUtilService.cacheConfigValue(ConfigName.MINIMUM_EMPLOYEES_FOR_SELF_ENROLLMENT),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                if (value) {
                    this.restrictedStatesList = value[RESTRICTED_STATES_LIST].split(",");
                    this.enrollmentRestrictedStates = this.restrictedStatesList.join(", ");
                    this.minimumAflacToSelect = parseInt(value[MIN_AFLAC_FOR_VAS], RADIX_TEN);
                    this.eligibleEmployeeCount = parseInt(value[BILLING], RADIX_TEN);
                    this.minEmployeeCheck();
                }
            });
    }

    /**
     * To retain the agent assistance field based on previous selection of the user
     */
    agentAssistancestatus(): boolean {
        if (!this.plans.find((plan) => plan.selected)) {
            return true;
        }
        return this.plans.filter((plan) => plan.selected).find((plan) => plan.agentAssisted);
    }

    /**
     * Function to get restricted selected plan and set checkbox value as per that
     */
    agentAssistanceForRestricted(): void {
        this.isRestrictedPlanSelected = false;
        if (!this.allPlans.data.find((plan) => plan.selected)) {
            return;
        }
        this.isRestrictedPlanSelected = this.quasiService.getRestrictedPlans(
            this.allPlans.data.filter((plan) => plan.selected),
            this.restrictedStatesList,
            this.isRole20User,
            true,
        );
    }
    /**
     * Function to check if restricted states plan available or not
     */
    getRestrictedStatesPlan(): void {
        this.isAgentAssistance = this.quasiService.getRestrictedPlans(this.plans, this.restrictedStatesList, this.isRole20User, false);
    }

    /**
     * Method to get eligible employee count
     * Call to get restricted state config and minimum employee check
     */
    getEligibleEmployeeCount(): void {
        this.eligibleEmployees = this.store.selectSnapshot(BenefitsOfferingState.geteligibleEmployees);
        if (this.eligibleEmployees === null) {
            this.benefitsOfferingService
                .getBenefitOfferingSettings(this.mpGroup)
                .pipe(
                    switchMap((value) => {
                        this.eligibleEmployees = value.totalEligibleEmployees;
                        return combineLatest([
                            this.staticUtilService.cacheConfigValue("user.shop.self_service_enrollment.restricted_state_abbr"),
                            this.staticUtilService.cacheConfigValue("broker.plan_year_setup.plan_choices.min_aflac_products_vas"),
                            this.staticUtilService.cacheConfigValue(
                                "broker.plan_year_setup.self_service_enrollment.census_upload_minimum_employee",
                            ),
                        ]);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((response) => {
                    this.restrictedStatesList = response[RESTRICTED_STATES_LIST].split(",");
                    this.enrollmentRestrictedStates = this.restrictedStatesList.join(", ");
                    this.minimumAflacToSelect = parseInt(response[MIN_AFLAC_FOR_VAS], RADIX_TEN);
                    this.eligibleEmployeeCount = parseInt(response[BILLING], RADIX_TEN);
                    this.minEmployeeCheck();
                });
        } else {
            this.getRestricteStatesConfig();
        }
    }
    /**
     * Method to set minimum employee flag
     */
    minEmployeeCheck(): void {
        const presentProduct = this.productList.find((product) => product.id.toString() === this.productId.toString());
        if (
            presentProduct &&
            presentProduct.individual &&
            !presentProduct.group &&
            this.eligibleEmployees &&
            this.eligibleEmployees < this.eligibleEmployeeCount &&
            !this.isRole20User
        ) {
            this.minEligibleCountMsg = this.languageStrings[PrimaryLanguage.PRIMARY_BENEFITS_OFFERING_RESTRICTED_STATE_NON_TPI].replace(
                "##empCount##",
                String(this.eligibleEmployeeCount),
            );
            this.minEmployees = false;
        }
    }
    /**
     * This method is used to create delete plan choice observable and stores in service
     * @param planChoice is current planChoice to delete
     */
    storeAndArrangeDeletePlanChoice(planChoice: PlanChoice): void {
        const deletePlanChoice: DeletePlanChoice = {};
        this.quasiService.setDeletePlansChoices([
            this.benefitsOfferingService
                .deletePlanChoice(
                    deletePlanChoice,
                    planChoice.id,
                    this.mpGroup,
                    planChoice.continuous
                        ? planChoice.enrollmentPeriod.expiresAfter
                            ? planChoice.enrollmentPeriod.expiresAfter
                            : this.datepipe.transform(new Date().setDate(new Date().getDate() - 1), AppSettings.DATE_FORMAT)
                        : null,
                )
                .pipe(catchError((error) => of(error))),
        ]);
    }

    /**
     * This method is used create a planChoice object required for create PlanChoice API call
     * @param existingPlanChoice is current planChoice with which create planChoice object is created
     *
     * @returns planChoice object used to pass it create planChoice observable
     */
    getCreatePlanChoiceObject(existingPlanChoice: PlanChoice): PlanChoice {
        let planChoice: PlanChoice;
        if (!existingPlanChoice.continuous) {
            planChoice = {
                id: existingPlanChoice.id,
                planId: existingPlanChoice.planId ? existingPlanChoice.planId : existingPlanChoice.plan.id,
                continuous: existingPlanChoice.continuous,
                taxStatus: existingPlanChoice.taxStatus,
                agentAssisted: existingPlanChoice.agentAssisted,
                planYearId: existingPlanChoice.planYearId,
            };
        } else {
            planChoice = {
                id: existingPlanChoice.id,
                planId: existingPlanChoice.planId ? existingPlanChoice.planId : existingPlanChoice.plan.id,
                continuous: existingPlanChoice.continuous,
                taxStatus: existingPlanChoice.taxStatus,
                agentAssisted: existingPlanChoice.agentAssisted,
                enrollmentPeriod: existingPlanChoice.enrollmentPeriod,
                coverageStartFunction: existingPlanChoice.coverageStartFunction,
            };
        }
        return planChoice;
    }
    /**
     * will set set tax status to all selected plans
     * @param taxStatus will accept the param tax status to set to all selected plans
     */
    updateSelectedPlansTaxStatus(taxStatus: TaxStatus): void {
        this.allPlans.data.forEach((plan) => {
            if (!plan.taxStatusReadOnly) {
                plan.taxStatus = taxStatus;
            }
        });
        if (!this.validateAllPlansTaxStatus(taxStatus)) {
            this.togglePretaxCafeteria(this.fromPretax);
        }
    }
    /**
     * function to set the disable flag for global tax status options
     * @returns boolean flag
     */
    getFlagToDisable(): boolean {
        const editablePlans = this.allPlans.data.filter((plan) => !plan.taxStatusReadOnly);
        return !(editablePlans && editablePlans.length > 0);
    }
    /**
     * will get the flag to determine if all plans are post tax
     * @return will return flag based on validation
     */
    getPostTaxFlagToDisable(): boolean {
        const postTaxPlans = this.allPlans.data.filter((plan) => plan.defaultTaxStatus === TaxStatus.POSTTAX);
        return postTaxPlans && postTaxPlans.length === this.allPlans.data.length;
    }
    /**
     *function to determine if all the plans have the tax status as input param tax status
     * @param taxStatus this will validate tax status to be same for all plans based on input taxStatus
     * @returns boolean which will determine if all the plans have the tax status as input param tax status
     */
    validateAllPlansTaxStatus(taxStatus: TaxStatus): boolean {
        const taxStatusSpecificPlans = this.allPlans.data.filter((plan) => plan.taxStatus === taxStatus);
        return taxStatusSpecificPlans && taxStatusSpecificPlans.length === this.allPlans.data.length;
    }
    /**
     * Function to check RSLI eligibility as per selected products
     */
    checkRSLIEligibility(): void {
        const isRSLIPlan = this.plansList.find(
            (plan) => plan.carrierId === CarrierId.RELIANCE_STANDARD && plan.productId === ProductId.LTD,
        );
        if (isRSLIPlan) {
            this.isRSLIEligibility = true;
            this.store
                .dispatch(new GetRSLIEligibility())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((state) => {
                    this.isAccountRSLIEligible =
                        state.productOffering.rsliEligibility && state.productOffering.rsliEligibility.rsliEligible;
                });
        }
    }

    /**
     * fetch the details of selected plan year
     */
    getPlanYearDetails(): void {
        if (this.planYearId) {
            this.benefitsOfferingService
                .getPlanYear(this.planYearId, this.mpGroup, false)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp) => {
                    this.currentPlanYearDetails = resp;
                    const enrollmentEndDate = resp.enrollmentPeriod.expiresAfter;
                    if (new Date() > this.dateService.toDate(enrollmentEndDate)) {
                        this.isOEEnded = true;
                    }
                });
        }
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.allPlanYears = this.utilService.copy(response.filter((planYear) => planYear.type === PlanYearType.AFLAC_INDIVIDUAL));
            });
    }
    /**
     * set default tax status for plans
     */
    validateDefaultTaxStatus(): void {
        this.isPreTax = false;
        this.isPostTax = false;
        this.isVariable = false;
        const preTaxPlans = this.allPlans.data.filter((plan) => plan.taxStatus === TaxStatus.PRETAX);
        if (preTaxPlans.length === this.allPlans.data.length) {
            this.isPreTax = true;
        }
        const postTaxPlans = this.allPlans.data.filter((plan) => plan.taxStatus === TaxStatus.POSTTAX);
        if (postTaxPlans.length === this.allPlans.data.length) {
            this.isPostTax = true;
        }
        const variableTaxPlans = this.allPlans.data.filter((plan) => plan.taxStatus === TaxStatus.VARIABLE);
        if (variableTaxPlans.length === this.allPlans.data.length) {
            this.isVariable = true;
        }
    }
    /**
     * This method is used to fetch account TPP status
     */
    fetchAccountTPPStatus(): void {
        combineLatest([
            this.benefitsOfferingHelperService.fetchAccountTPPStatus(),
            this.benefitsOfferingHelperService.getThirdPartyPlatformRequirements(),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(([hasThirdPartyPlatforms, tppRequirement]) => {
                    this.isTPPAccount =
                        tppRequirement && tppRequirement.thirdPartyPlatformRequired
                            ? tppRequirement.thirdPartyPlatformRequired
                            : hasThirdPartyPlatforms;
                }),
            )
            .subscribe();
    }
    /**
     * Method to get the user Permission
     */
    getUserPermission(): void {
        this.staticUtilService
            .hasPermission(Permission.MANAGE_AGENT_ASSISTED)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isRole20User = res;
            });
    }
    /**
     *  Updates the selection from allPlans to plansList. The plansList is checked for plans selected to proceeed to the next screen
     */
    updateSelection(): void {
        this.allPlans.data.forEach((plan) => {
            const selection = this.plansList.find((planData) => plan.planId === planData.planId);
            if (selection) {
                selection.selected = plan.selected;
            }
        });
    }
    // To unsubscribe all the subscription for avoiding memory leaks
    ngOnDestroy(): void {
        if (this.mpGroup) {
            this.store.dispatch(new SetPlanChoices(false));
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
