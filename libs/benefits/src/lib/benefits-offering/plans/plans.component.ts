import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatCheckboxChange, MatCheckbox } from "@angular/material/checkbox";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatRadioChange } from "@angular/material/radio";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { PlansColumns, BenefitsOfferingService, DeletePlanChoice, AccountService, AccountContacts, Eligibility } from "@empowered/api";
import { Store, Select } from "@ngxs/store";

import {
    BenefitsOfferingState,
    SideNavService,
    MapPlanChoicesToPanelProducts,
    SetPlanChoices,
    GetRSLIEligibility,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { DataFilter, SortStatesPipe, PlanDetailsComponent, AddUpdateContactInfoComponent } from "@empowered/ui";
import { takeUntil, tap, filter, map, withLatestFrom, switchMap } from "rxjs/operators";
import { Subject, forkJoin, combineLatest, Observable, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { ProductsPlansQuasiService } from "../../maintenance-benefits-offering/products-plans-quasi";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import {
    CarrierId,
    Permission,
    CarrierIdType,
    ArgusPlanId,
    ArgusConfig,
    ArgusLanguage,
    VasFunding,
    StateAbbreviations,
    MIN_PLHSO_NON_PLHSO_PLAN_SELECT_FOR_FL_STATE,
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
    PolicyOwnershipType,
    AddUpdateContactDialogData,
    ArgusCarrier,
    PlanPanel,
    BenefitFilter,
    Plan,
    PlansProductData,
    ArgusADVTiers,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const RESTRICTED_STATES_LIST = 0;
const MIN_AFLAC_FOR_VAS = 1;
const RADIX_TEN = 10;
const SINGLE_CARRIER_RESTRICTED_PLANS_COUNT = 1;
const ACCOUNT = "ACCOUNT";
const BILLING = 2;
const BENEFIT_ELIGIBLE_EMPLOYEE_COUNT = "benefit_eligible_emp_count";
const GROUP_EMPLOYEE_COUNT = "group_emp_count";
const PLANS_GROUP_ATTRIBUTE_VALUE = "3";
const ER_SELECTED = "erSelected";

const FLORIDA = "FL";
interface CarrierMap {
    carrier: string;
    ids: string[];
}
@Component({
    selector: "empowered-plans",
    templateUrl: "./plans.component.html",
    styleUrls: ["./plans.component.scss"],
    providers: [DataFilter],
})
export class PlansComponent implements OnInit, OnDestroy {
    static NUMBER_OF_RSLI_PLAN = 2;

    form: FormGroup;
    allPlans = new MatTableDataSource<any>();
    plans = [];
    plansToCompare = [];
    editedPlanChoiceSelected = [];
    isNextClicked = false;
    productList: PlansProductData[] = [];
    planIndex: number;
    planLength: number;
    enrollmentRestrictedStates: string;
    restrictedStateAlert: string;
    isplanChoiceCreated: boolean;
    planChoicesToUpdate = [];
    productsSelected = [];
    plansList: PlanPanel[] = [];
    displayedPlansColumns = [];
    isRole20User = false;
    // Variables declared  for checkboxes to implement Select all functionality
    fromPlans = "selected";
    fromPretax = "preTax";
    fromCarriers = "carrier";
    fromRiders = "riders";
    fromStates = "states";
    fromAssistanceRequired = "agentAssisted";
    numRows = [];
    selection = [];
    selectedPlan: PlanPanel;
    isArgusProduct = false;
    productIdNumber: string;
    productId: string;
    presentProductIndex = 1;
    preTaxSetPerPlan = false;
    assitancePerCarrier = false;
    isError = false;
    isReceivingHQ = true;
    errorMessage: string;
    isNoneSelected = false;
    isSingleAflacError = false;
    filtersData = [];
    isDisplayFilter = [];
    filterValue = [];
    filter;
    errorFlag: boolean;
    TaxStatus = TaxStatus;
    globalTaxStatusDisable = false;
    isSideNavSelected = false;
    filterClassNames = {
        carriers: ["list-grid-filter", "filter-carriers", "filter-checkbox"],
        riders: ["list-grid-filter", "filter-riders", "filter-checkbox"],
        state: ["list-grid-filter", "filter-planstate", "filter-checkbox"],
    };
    @ViewChild("carriersFilterDropdown") carriersFilterDropdown: MatSelect;
    @ViewChild("ridersFilterDropdown") ridersFilterDropdown: MatSelect;
    @ViewChild("statesFilterDropdown") statesFilterDropdown: MatSelect;
    @ViewChild("allProductsSelected") allProductsSelected;
    @ViewChild("preTaxCheckbox") preTaxCheckbox;
    @ViewChild("agentAssistance") agentAssistance: MatCheckbox;
    isHQFunded: boolean;
    isEmpFunded: boolean;
    isSelected: boolean;
    skipHQFunded = false;
    selectedHQFundedProductIds: number[] = [];
    isPreTaxEligible: boolean;
    isLoading: boolean;
    mpGroup: number;
    filterOpen = false;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    SortPipe = new SortStatesPipe();
    benefitOfferingStates = [];
    isAgentAssistedDisabled = true;
    isCarrierSelected = false;
    isADVEROption = false;
    isERSelected: boolean;
    hasCarrierRestriction = false;
    restrictedCarriers: any[];
    isRestrictedToSinglePlan = false;
    carrierChoice: { carrierId: number; productId: string; carrierName: string; productName: string };
    selectedCarriers: number[] = [];
    singleCarrierError = false;
    carrierMaps: any[] = [];
    carrierExceptions: CarrierMap[];
    exceptionProductSelectedPlan: { planId: number; selected: boolean } = { planId: 0, selected: false };
    argusDentalTiers: ArgusADVTiers;
    argusVisionCarrierMaps: ArgusCarrier[] = [];
    argusDentalCarrierMaps: ArgusCarrier[] = [];
    filterDetails: BenefitFilter[] = [];
    individual = false;
    restrictedPlanLength = 2;
    @Select(BenefitsOfferingState.getErrorMessageKey) errorMessageKey$: Observable<string>;
    isAccountRSLIEligible: boolean;
    ProductId = ProductId; // Used in the template
    languageStrings = {
        carrier: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.filterCarrier"),
        riders: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.filterRiders"),
        states: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.filterStates"),
        altRiders: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.altRiders"),
        altStates: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.altStates"),
    };
    sideNavTrigger = false;
    langStrings = {};
    secondaryLanguages = {};
    restrictedStates = false;
    employeeCount: any;
    eligibleEmployeeCount: number;
    eligibleEmployees: number;
    minEmployees = true;
    restrictedStatesCarrierSpecific = false;
    restrictedStatesConfig = "user.shop.self_service_enrollment.restricted_state_abbr";
    group = false;
    restrictedStatesrow: any;
    restrictedStateAlertCarrier: string;
    isAccountDeactivated: boolean;
    showDisclaimerForRSLICarrier = false;
    minimumAflacToSelect: number;
    disclaimerMessage = "";
    visionPlan = "Vision";
    dentalPlan = "Dental";
    LTDPlan = "Long-Term Disability";
    basicLife = "Basic Life";
    isAgentAssistance = false;
    isRestrictedPlanSelected = false;
    restrictedStatesList: string[] = [];
    isRSLIEligibility: boolean;
    isExceptionProduct: boolean;
    isHcfsaPlan: boolean;
    postTaxDisable = false;
    situsState: string;
    minEligibleEmpCountMsg: string;
    isVasException = false;
    isVasExceptionRequire = false;
    disableArgusTierPlans: { planId: { disableStatus: boolean } } = {} as { planId: { disableStatus: boolean } };
    isArgusPlans = false;
    vasExceptions: Exceptions[] = [];
    isVasMaxEmployeeEligible = false;
    contactInfoBilling: AccountContacts[];
    isWagesPresent = false;
    billingAdded = false;
    isTPPAccount = false;
    maxPlansValue: number;
    isVasMaxValid = false;
    isVasHQFunded$: Observable<boolean>;
    isVasEmployeeFunded$: Observable<boolean>;
    employeesFromGroupAttribute: number;
    isVasHQFund: boolean;
    isVasEmployeeFund: boolean;
    isNonEligibleStateMsg = false;
    isPLHSOProductSelectedError = false;
    PPOMACPlanIds = [];
    hideBothTaxStatus = false;
    hideTaxStatusForProducts: number[] = [];
    MIN_PLHSO_PRODUCT_SELECT: number;
    productPlansNotSelected = false;
    selectedCarrierArr = [];

    companyCode = {
        NY: CompanyCode.NY,
    };

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly dialog: MatDialog,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly utilService: UtilService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly dateService: DateService,
    ) {
        this.form = this.formBuilder.group({
            carriersFilter: [""],
            ridersFilter: [""],
            statesFilter: [""],
            carrier: [""],
            planType: [""],
        });
        this.vasExceptions = this.store.selectSnapshot(BenefitsOfferingState.getVasExceptions);
        this.situsState = this.store.selectSnapshot(AccountInfoState.getAccountInfo).situs?.state.abbreviation;
        this.getArgusEligibleEmployeeCount();
        this.fetchAccountTPPStatus();
        this.getLanguageStrings();
        this.benefitsOfferingHelperService
            .getTaxStatusConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productIds) => (this.hideTaxStatusForProducts = productIds));
        this.getEligibleEmployeeCount();
        if (this.carrierMaps.length) {
            this.getArgusEligibleEmployeeCount();
        } else {
            this.isLoading = true;
            this.isExceptionProduct = false;
            this.isHcfsaPlan = false;
            const exceptionCarrier = this.staticUtilService.cacheConfigValue(
                "broker.plan_year_setup.plan_choices.exclude_plans_from_max_plans_per_carrier",
            );
            const carrierIdsMap = this.staticUtilService.cacheConfigValue(
                "group_benefit_offering_carrier_specific_restriction_carrier_ids_map",
            );
            combineLatest([exceptionCarrier, carrierIdsMap])
                .pipe(takeUntil(this.unsubscribe$), withLatestFrom(this.staticUtilService.hasPermission(Permission.MANAGE_AGENT_ASSISTED)))
                .subscribe(
                    ([resp, isRole20User]) => {
                        this.isRole20User = isRole20User;
                        resp.map((carrier, index) => {
                            const carriers = carrier.replace(/\s/g, "").split(";");
                            if (index === 0) {
                                this.carrierExceptions = this.generateCarrierMaps(carriers, "=");
                            } else {
                                this.carrierMaps = this.generateCarrierMaps(carriers, ":");
                            }
                        });
                        this.getArgusEligibleEmployeeCount();
                    },
                    (error) => {
                        this.isLoading = false;
                        this.isError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    },
                );
        }
    }
    /**
     * Method to get the eligible no of employees for argus products
     */
    getArgusEligibleEmployeeCount(): void {
        combineLatest([this.accountService.getGroupAttributesByName([BENEFIT_ELIGIBLE_EMPLOYEE_COUNT, GROUP_EMPLOYEE_COUNT], this.mpGroup)])
            .pipe(
                tap(([groupAttributes]) => {
                    const eligibleEmpCount = groupAttributes.find((attr) => attr.attribute === BENEFIT_ELIGIBLE_EMPLOYEE_COUNT);
                    const groupEmpCount = groupAttributes.find((attr) => attr.attribute === GROUP_EMPLOYEE_COUNT);
                    if (eligibleEmpCount && +eligibleEmpCount.value > 0) {
                        this.employeesFromGroupAttribute = +eligibleEmpCount.value;
                    } else {
                        this.employeesFromGroupAttribute = groupEmpCount.value ? +groupEmpCount.value : 0;
                    }
                    this.checkArgusSelectedPlans();
                    this.getRestricteStatesConfig();
                    this.initializePlansList();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * This method is used to fetch account TPP status
     * This method is used to fetch third party platform requirements
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
     * This method is used to fetch and store all Argus-related config values
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
     * Initializes all carrier plans available for the group
     */
    initializePlansList(): void {
        if (!this.mpGroup) {
            this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        }
        if (this.mpGroup) {
            if (this.benefitOfferingStates.length === 0) {
                this.benefitOfferingStates = this.store.selectSnapshot(BenefitsOfferingState.getBenefitOfferingStates);
            }
            this.route.params
                .pipe(
                    tap((val) => {
                        this.isAgentAssistedDisabled = true;
                        if (val["productid"]) {
                            this.resetValues(val["productid"]);
                            this.productId = val["productid"];
                            if (this.productId.toString() === VasFunding.VAS_EMP) {
                                this.isEmpFunded = true;
                            } else if (this.productId.toString() === VasFunding.HQ) {
                                this.isHQFunded = true;
                            } else if (isNaN(+this.productId)) {
                                this.productIdNumber = this.productId.substring(0, this.productId.length - 1);
                            } else {
                                this.productIdNumber = this.productId;
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
                            }
                        }
                    }),
                    switchMap((resp) => {
                        if (!this.isRSLIEligibility) {
                            const isRSLIPlan = this.plansList.find(
                                (plan) => plan.carrierId === CarrierId.RELIANCE_STANDARD && plan.productId === ProductId.LTD,
                            );
                            if (isRSLIPlan) {
                                this.isRSLIEligibility = true;
                                return this.store.dispatch(new GetRSLIEligibility());
                            }
                        }
                        return of(null);
                    }),
                    tap((state) => {
                        if (state && state.productOffering) {
                            this.isAccountRSLIEligible =
                                state.productOffering.rsliEligibility && state.productOffering.rsliEligibility.rsliEligible;
                        }
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((resp) => {
                    this.checkVasException();
                    this.preTaxSetPerPlan = this.quasiService.defaultSetPerPlan(this.allPlans);
                    if (this.preTaxSetPerPlan) {
                        this.displayedPlansColumns = Object.values(PlansColumns);
                    }
                });
            this.isLoading = false;
        }
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
     * Pulls configs needed for benefit offering
     */
    getRestricteStatesConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(this.restrictedStatesConfig),
            this.staticUtilService.cacheConfigValue("broker.plan_year_setup.plan_choices.min_aflac_products_vas"),
            this.staticUtilService.cacheConfigValue("broker.plan_year_setup.self_service_enrollment.census_upload_minimum_employee"),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                if (value) {
                    if (value[RESTRICTED_STATES_LIST]) {
                        this.restrictedStatesList = value[RESTRICTED_STATES_LIST].split(",");
                        this.enrollmentRestrictedStates = this.restrictedStatesList.join(", ");
                    }
                    if (value[MIN_AFLAC_FOR_VAS]) {
                        this.minimumAflacToSelect = parseInt(value[MIN_AFLAC_FOR_VAS], RADIX_TEN);
                    }
                    if (value[BILLING]) {
                        this.eligibleEmployeeCount = Number(value[BILLING]);
                    }
                    if (this.allPlans && this.allPlans.data && this.allPlans.data.length) {
                        this.displayRestrictedStateAlert();
                    }
                }
            });
    }

    /**
     * Checks for carrier restriction conditions and disable/enable carrier based on choices
     */
    checkCarrierRestriction(): void {
        this.hasCarrierRestriction = true;
        this.isCarrierSelected = false;
        const langAflacDentalVision = this.langStrings["primary.portal.benefitsOffering.aflacDentalVision"];
        const enabledCarrier = this.restrictedCarriers.find((car) => !car.disabled);
        if (this.productIdNumber === AppSettings.VISION) {
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.aflacDentalVisionAdv"],
                this.getCarrierIds(CarrierIdType.ADV),
            );
            this.checkForCarrierPlans(langAflacDentalVision, this.getCarrierIds(CarrierIdType.ARGUS));
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.aflacVSP"],
                this.getCarrierIds(CarrierIdType.AFLAC_VSP),
            );
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.reliance"],
                this.getCarrierIds(CarrierIdType.RELIANCE),
            );
            if (this.carrierChoice && enabledCarrier) {
                this.form.controls.carrier.setValue(enabledCarrier.carrierIds);
                this.loadCarrierPlans();
            }
        } else if (this.productIdNumber === AppSettings.DENTAL) {
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.aflacDentalVisionAdv"],
                this.getCarrierIds(CarrierIdType.ADV),
            );
            this.checkForCarrierPlans(langAflacDentalVision, this.getCarrierIds(CarrierIdType.ARGUS));
            this.checkForCarrierPlans(this.langStrings["primary.portal.benefitsOffering.aflac"], this.getCarrierIds(CarrierIdType.AFLAC));
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.deltaDentegra"],
                this.getCarrierIds(CarrierIdType.DELTA_DENTEGRA),
            );
            this.checkForCarrierPlans(
                this.langStrings["primary.portal.benefitsOffering.reliance"],
                this.getCarrierIds(CarrierIdType.RELIANCE),
            );
            if (this.carrierChoice && enabledCarrier) {
                this.form.controls.carrier.setValue(enabledCarrier.carrierIds);
                this.loadCarrierPlans();
            }
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
            this.hasCarrierRestriction = false;
            this.isCarrierSelected = true;
        }
        this.deselectAdvPlans();
    }

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
            this.carrierChoice.productId === this.productIdNumber &&
            carrierIds &&
            carrierIds.indexOf(this.carrierChoice.carrierId) >= 0
        ) {
            this.selectedCarriers = carrierIds;
            disableCarrier = false;
        }
        if (carrierIds && this.plansToCompare.filter((plan) => carrierIds.indexOf(plan.carrierId) >= 0).length) {
            // enable the carrier if the carrier choice is made in the same group so that user can select other carrier
            if (this.carrierChoice && this.plansToCompare.find((plan) => plan.carrierId === this.carrierChoice.carrierId)) {
                disableCarrier = false;
            }
            this.restrictedCarriers.push({
                text: carrier,
                carrierIds: carrierIds,
                disabled: this.carrierChoice ? disableCarrier : false,
                selected: false,
            });
            // select the carrier radio button in which the plan is selected
            if (this.plansToCompare.find((plan) => plan.selected)) {
                this.restrictedCarriers.forEach((carrierData) => {
                    if (carrierData.carrierIds.indexOf(this.plansToCompare.find((plan) => plan.selected).carrierId) >= 0) {
                        carrierData.selected = true;
                    }
                });
            }

            // this will execute only if at least one carrier is selected in previous selections
            // or if all plans are argus or adv
            if (
                (!this.carrierChoice || (this.carrierChoice && this.carrierChoice.carrierId !== CarrierId.AFLAC)) &&
                (!disableCarrier ||
                    this.plansToCompare.every((eachPlan) => eachPlan.carrierId === CarrierId.ARGUS) ||
                    this.plansToCompare.every((eachPlan) => eachPlan.carrierId === CarrierId.ADV))
            ) {
                this.form.controls.carrier.setValue(carrierIds);
                this.loadCarrierPlans();
            }
            // load the selected caarier plans on the application
            const selectedRestrictedCarrier = this.restrictedCarriers.find((carrierData) => carrierData.selected);
            if (selectedRestrictedCarrier?.carrierIds) {
                this.form.controls.carrier.setValue(selectedRestrictedCarrier.carrierIds);
                this.loadCarrierPlans();
            }
        }
    }

    /**
     * This method is used to check if carrier offers single or multiple plans and gets plans based on carrier selection
     */
    loadCarrierPlans(): void {
        this.selectedCarriers = this.form.controls.carrier.value;
        if (this.form.controls.planType && this.form.controls.planType.value !== "") {
            this.isERSelected = this.form.controls.planType.value === ER_SELECTED;
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
        if (this.isERSelected === false) {
            this.form.controls["planType"].setValue("eeSelected");
        } else if (this.isERSelected) {
            this.form.controls["planType"].setValue("erSelected");
        }
        this.postTaxDisable = this.getPostTaxFlagToDisable();
    }

    deselectAdvPlans() {
        // Checking if none is selected
        if (this.isNoneSelected === false) {
            const selectedPlansArr = this.plansList.filter((plan) => plan.selected);
            // If an adv plan is selected but the adv carrier is not then set it to false
            if (this.selectedCarrierArr.length === 0 || (!this.selectedCarrierArr.includes(70) && !this.selectedCarriers.includes(70))) {
                const getADVId = this.getCarrierIds(CarrierIdType.ADV);
                // Checks to see if a carrier is selected && If an adv plan is selected but
                // the adv carrier is not then set that plan to false
                if (
                    this.selectedCarriers.length !== 0 &&
                    !this.selectedCarrierArr.includes(getADVId[0]) &&
                    !this.selectedCarriers.includes(getADVId[0])
                ) {
                    const getIndex = selectedPlansArr.findIndex((index) => index.carrierId === 70);
                    if (getIndex > -1) {
                        selectedPlansArr[getIndex].selected = false;
                    }
                }
            }
        }
    }

    /**
     * fetch all primary languages
     */
    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.clear",
            "primary.portal.benefitsOffering.selfServiceEnrollment",
            "primary.portal.common.apply",
            "primary.portal.benefitsOffering.details",
            "primary.portal.benefitsOffering.setPlan",
            "primary.portal.benefitsOffering.preTax",
            "primary.portal.benefitsOffering.setPerCarrier",
            "primary.portal.benefitsOffering.noneOfAbove",
            "primary.portal.benefitsOffering.none",
            "primary.portal.benefitsOffering.agentAssistance",
            "primary.portal.common.close",
            "primary.portal.benefitsOffering.plansNotSelectedTitle",
            "primary.portal.benefitsOffering.setting.licensedModal.gotIt",
            "primary.portal.common.back",
            "primary.portal.benefitsOffering.availableRiders",
            "primary.portal.benefitsOffering.filterStates",
            "primary.portal.benefitsOffering.aflacVSP",
            "primary.portal.benefitsOffering.reliance",
            "primary.portal.benefitsOffering.aflac",
            "primary.portal.benefitsOffering.deltaDentegra",
            "primary.portal.benefitsOffering.carrieroptionlabel",
            "primary.portal.benefitsOffering.residentOf",
            "primary.portal.benefitsOffering.noSelfEnroll",
            "primary.portal.benefitsOffering.aflacDentalVisionAdv",
            "primary.portal.benefitOffering.productsVasError",
            "primary.portal.benefitsOffering.productVas",
            "primary.portal.benefitsOffering.postTax",
            "primary.portal.benefitsOffering.agentRequired",
            "primary.portal.benefitsOffering.taxStatus",
            "primary.portal.benefitsOffering.bothTax",
            "primary.portal.benefitsOffering.both",
            "primary.portal.benefitsOffering.taxStatus.setAtPlanLevel",
            "primary.portal.benefitsOffering.aflacDentalVision",
            "primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment",
            "primary.portal.benefitOffering.plans.maxValueExceeded",
            "primary.portal.benefitsOffering.planTypelabel",
            "primary.portal.benefitsOffering.planTypeEROption",
            "primary.portal.benefitsOffering.planTypeEEOption",
        ]);
        this.secondaryLanguages = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.benefitsOffering.1AflacError",
            "secondary.portal.benefitsOffering.singleCarrier",
            "secondary.portal.benefitsOffering.1AflacPlan",
            "secondary.portal.benefitsOffering.reliancePlansDisclaimer",
            "secondary.portal.benefitsOffering.reliancePlansDentalDisclaimer",
            "secondary.portal.benefitsOffering.reliancePlansVisionDisclaimer",
            "secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer",
            ArgusLanguage.SELECT_ONE_NON_PLHSO_PRODUCT,
            "secondary.portal.benefitsOffering.onePlanForProduct",
        ]);
    }
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * Checks role of user, assigns situs state, fetches account status, and supplies the class with contact billing info.
     * used to fetch @var eligibleEmployees and @var situsState values
     * used to call @method fetchAccountStatus
     * used to call @method checkArgusSelectedPlans to disable unavailable plans.
     */
    ngOnInit(): void {
        this.staticUtilService
            .cacheConfigValue(ArgusConfig.MIN_PLHSO_PRODUCT_SELECT)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.MIN_PLHSO_PRODUCT_SELECT = Number(result);
            });
        this.staticUtilService
            .hasPermission(Permission.MANAGE_AGENT_ASSISTED)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.isRole20User = res;
            });
        this.sideNavService.executePlanOnNext$
            .pipe(
                filter((productIdToBeNavigated) => !!productIdToBeNavigated),
                tap((productIdToBeNavigated) => {
                    this.sideNavTrigger = true;
                    this.onNext(this.productId !== productIdToBeNavigated.toString(), productIdToBeNavigated);
                }),
                takeUntil(this.unsubscribe$),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        if (this.situsState === FLORIDA) {
            this.getDHMOPlans();
        }
        this.fetchAccountStatus();
        this.accountService
            .getAccountContacts("typeId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                // For Billing contacts as they will always have id 2
                this.contactInfoBilling = resp.filter((contact) => contact.type && contact.type.id === BILLING);
            });
        this.sideNavService.updateGroupBenefitOfferingStep(PLANS_GROUP_ATTRIBUTE_VALUE).pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.checkArgusSelectedPlans();
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
     * function to check vas Enable or disable
     */
    checkVasException(): void {
        const element = document.getElementById("plans");
        if (element) {
            element.scrollIntoView();
        }
        if (this.vasExceptions && this.vasExceptions.length) {
            this.isVasException = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_MULTIPLE_AFLAC_FUNDED);
            const exceptionArray: Exceptions[] = this.vasExceptions.filter((obj) => obj.type === ExceptionType.VAS_MULTIPLE_AFLAC_FUNDED);
            if (exceptionArray.length > 1) {
                exceptionArray.sort(
                    (val1, val2) =>
                        this.dateService.toDate(val1.validity.effectiveStarting).getTime() -
                        this.dateService.toDate(val2.validity.effectiveStarting).getTime(),
                );
            }
            this.maxPlansValue = exceptionArray[0] ? exceptionArray[0].maxPlans : 0;
            this.isVasExceptionRequire = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_YEAR_ONE_PRODUCT_ADD);
            this.isVasMaxEmployeeEligible = this.vasExceptions.some((obj) => obj.type === ExceptionType.VAS_MAX_EMPLOYEE);
        }
        this.checkVasProduct();
        this.loadPlansScreen();
    }
    /**
     * This method is used to get eligible employee count
     */
    getEligibleEmployeeCount(): void {
        this.eligibleEmployees = this.store.selectSnapshot(BenefitsOfferingState.geteligibleEmployees);
        if (this.eligibleEmployees === null) {
            this.benefitsOfferingService
                .getBenefitOfferingSettings(this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.validateEmployeeCount(response.totalEligibleEmployees);
                    this.eligibleEmployees = response.totalEligibleEmployees;
                });
        }
        this.getArgusConfig();
    }

    /**
     * @description This method is used to check whether to show error message for minimum eligible employee count or no.
     * @param totalEligible :number, total eligible employees count for the group
     */

    validateEmployeeCount(totalEligible: number): void {
        let hasPermission;
        this.store
            .select(SharedState.hasPermission(UserPermissionList.OVERRIDE_AGENT_ASSISTED))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                hasPermission = response ? true : false;
            });
        const checkIfEmployeesEligible = +totalEligible < this.eligibleEmployeeCount;
        if ((this.individual || this.group) && totalEligible && !hasPermission && checkIfEmployeesEligible) {
            this.minEligibleEmpCountMsg = this.langStrings["primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment"].replace(
                "##empCount##",
                this.eligibleEmployeeCount,
            );
            this.minEmployees = false;
        }
    }

    /**
     * @description resets the values on load of next product
     * @param productId {string}
     * @returns {void}
     */
    resetValues(productId: string): void {
        if (!(this.isHQFunded || this.isEmpFunded)) {
            this.skipHQFunded = false;
        }
        this.isEmpFunded = false;
        this.isNoneSelected = false;
        this.isHQFunded = false;
        this.isReceivingHQ = true;
        this.isExceptionProduct = false;
        this.isHcfsaPlan = false;
        this.isERSelected = undefined;
        this.displayedPlansColumns = [];
        this.filter = {
            query: {
                carrier: [],
                riders: [],
                sates: [],
            },
        };
        this.getSelectedFilter(productId);
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
        this.individual = false;
        this.minEmployees = true;

        this.preTaxSetPerPlan = false;
        this.assitancePerCarrier = false;
        this.isError = false;
        this.isSingleAflacError = false;
        this.isPreTaxEligible = false;
        this.productPlansNotSelected = false;
    }

    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    /**
     * gets plans data from store and loads plans list
     */
    getPlansData(): void {
        this.productList = [];
        this.plansList = [];
        const planIds = [];
        let showVasLinks = false;
        const panelModel = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
        if (panelModel.length > 0) {
            panelModel.forEach((productData) => {
                if (productData.productChoice && productData.product) {
                    // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
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
                    productData.plans.forEach((planData) => {
                        // eslint-disable-next-line complexity
                        if (
                            ((productData.productChoice.individual &&
                                planData.plan.policyOwnershipType.includes(PolicyOwnershipType.INDIVIDUAL)) ||
                                (productData.productChoice.group &&
                                    planData.plan.policyOwnershipType.includes(PolicyOwnershipType.GROUP))) &&
                            planData.planEligibilty.eligibility === Eligibility.ELIGIBLE
                        ) {
                            planIds.push(planData.plan.id);
                            const states = Array.from(
                                new Set(
                                    planData.states.filter((state) =>
                                        this.benefitOfferingStates.filter((offeringState) => offeringState.name === state.name).pop(),
                                    ),
                                ),
                            ).sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
                            this.plansList = [
                                ...this.plansList,
                                {
                                    selected: planData.planChoice ? true : false,
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
                                    planChoiceId: planData.planChoice ? planData.planChoice.id : null,
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
                                    riders: [...planData.plan.riders],
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
                                    isAutoEnrollable: planData.plan.characteristics.includes(Characteristics.AUTOENROLLABLE),
                                },
                            ];
                        }
                    });
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
     * @description function to load plans for selected products
     * @returns {void}
     */
    loadPlansScreen(): void {
        this.isArgusProduct = false;
        this.isNextClicked = false;
        const eligibleEmployees = this.eligibleEmployees;
        const plans = this.utilService
            .copy(
                this.plansList.filter((plan) => {
                    if (this.isEmpFunded) {
                        return plan.vasFunding === undefined ? false : plan.vasFunding !== AppSettings.HQ ? true : false;
                    }
                    if (this.isHQFunded) {
                        return plan.vasFunding === undefined
                            ? false
                            : plan.vasFunding === AppSettings.HQ && (this.isVasMaxEmployeeEligible || plan.eligibility)
                                ? true
                                : false;
                    }
                    return plan.productId.toString() === this.productId;
                }),
            )
            .map((plan) => ({
                ...plan,
                isPlanDisabled: plan.isPlanDisabled || this.isRSLILTDDisabled(plan),
            }));
        this.plans = plans.some((plan) => plan.selected) ? this.quasiService.setCommonTaxStatus(plans) : plans;
        const argusPlans = this.plans.filter((plan) => [CarrierId.ADV, CarrierId.ARGUS].includes(plan.carrierId));
        if (argusPlans.length) {
            this.isArgusProduct = true;
        }
        if ((this.isHQFunded || this.isEmpFunded) && this.plans.length === 0) {
            if (this.isHQFunded) {
                this.skipHQFunded = true;
                this.presentProductIndex = this.productList.length - 2;
            } else {
                this.skipHQFunded = false;
                this.presentProductIndex = this.productList.length - 1;
            }
            this.goToNextProduct(false);
        }
        if (this.plans.filter((plan) => plan.preTaxEligible || !plan.taxStatusReadOnly).length) {
            this.isPreTaxEligible = true;
        }
        this.getRestrictedStatesPlan();
        this.allPlans.data = this.plans;
        this.allPlans.data.forEach((plan) => {
            plan.isEmpFundedPlanDisabled = this.selectedHQFundedProductIds.some((productId) => productId === plan.productId);
        });
        this.plansToCompare = this.utilService.copy(this.plans);

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
        const presentProduct = this.productList.filter((product) => product.id.toString() === this.productId)[0];
        this.hideBothTaxStatus = this.hideTaxStatusForProducts.includes(presentProduct.productId);
        let hasPermission;
        this.store
            .select(SharedState.hasPermission(UserPermissionList.OVERRIDE_AGENT_ASSISTED))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                hasPermission = response ? true : false;
            });
        this.individual = presentProduct.individual;
        this.restrictedStateAlert =
            this.langStrings["primary.portal.benefitsOffering.residentOf"] +
            " " +
            this.enrollmentRestrictedStates +
            " " +
            this.langStrings["primary.portal.benefitsOffering.noSelfEnroll"] +
            " " +
            presentProduct.name +
            " " +
            AppSettings.PLANS;
        this.group = presentProduct.group;
        if (this.isExceptionProduct) {
            this.checkboxActionsForExceptions();
        }
        const checkIfEmployeesEligible = +eligibleEmployees < this.eligibleEmployeeCount;
        if ((this.individual || this.group) && checkIfEmployeesEligible && eligibleEmployees !== null && !hasPermission) {
            this.minEligibleEmpCountMsg = this.langStrings["primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment"].replace(
                "##empCount##",
                this.eligibleEmployeeCount,
            );
            this.minEmployees = false;
        }

        this.presentProductIndex = this.productList.indexOf(presentProduct);
        this.sideNavService.planChanged$.next(this.presentProductIndex);
        this.productsSelected = this.plansList
            .filter(
                (plan) =>
                    plan.selected && [CarrierId.AFLAC, CarrierId.AFLAC_GROUP, CarrierId.AFLAC_DENTAL_AND_VISION].includes(plan.carrierId),
            )
            .map((plan) => plan.productIdNumber);
        this.productsSelected = [...new Set(this.productsSelected)];
        if (!this.isVasExceptionRequire) {
            this.isMinAflacProductSelection();
        }
        this.updateFilters();
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        this.globalTaxStatusDisable = this.getFlagToDisable();
        this.postTaxDisable = this.getPostTaxFlagToDisable();
    }
    /**
     * function to check Min Aflac Product Selection
     */
    isMinAflacProductSelection(): void {
        if ((this.isHQFunded || this.isEmpFunded) && this.productsSelected.length < this.minimumAflacToSelect) {
            this.isSingleAflacError = true;
            this.isReceivingHQ = false;
            this.errorMessage =
                this.minimumAflacToSelect > 1
                    ? this.langStrings["primary.portal.benefitOffering.productsVasError"].replace("##vascount##", this.minimumAflacToSelect)
                    : this.langStrings["primary.portal.benefitsOffering.productVas"].replace("##vascount##", this.minimumAflacToSelect);
            let hadHQFundedChoice = false;
            this.plans.forEach((plan) => {
                if (plan.selected) {
                    plan.selected = false;
                    hadHQFundedChoice = true;
                }
            });
            if (hadHQFundedChoice) {
                this.onNext(false);
            }
        }
    }
    /**
     * @description disables or enables the plans for exception product based on conditions
     * @returns {void}
     */
    checkboxActionsForExceptions(): void {
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
        return this.utilService.copy(this.plansList.filter((plan) => plan.productId.toString() === this.productId.toString()));
    }

    /**
     * This method is used to configure filter, initialize plan selections, and to preselect and disable argus plans
     * This method is used to call @method configureFilters() which configures filters
     * This method is used to call @method initializeSelection() passing @var fromPlans as argument
     * This method is used to call @method initializeSelection() passing @var fromPretax as argument
     * This method is used to call @method initializeSelection() passing @var fromAssistanceRequired as argument
     * This method is used to call @method checkArgusSelectedPlans()
     * This method is used to call @method displayRestrictedStateAlert() to set the flag for restricted state alert
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
        this.displayRestrictedStateAlert();
    }

    /**
     * This method is used to toggle agent assisted checkbox based on certain conditions
     */
    toggleAgentAssistedCheckbox(): void {
        if (
            ((this.isTPPAccount && this.isRole20User) || (this.isTPPAccount && this.situsState !== this.companyCode.NY)) &&
            !(
                (!this.minEmployees && !this.isTPPAccount) ||
                !this.isReceivingHQ ||
                (this.isAgentAssistedDisabled && !this.isRole20User) ||
                this.isRestrictedPlanSelected
            ) &&
            ((this.allPlans.data.every((eachPlan) => !eachPlan.selected) &&
                this.allPlans.data.some((eachPlan) => eachPlan.policyOwnershipType !== PolicyOwnershipType.GROUP)) ||
                this.isArgusPlans)
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
    /**
     * This method is used to display state column values based on length
     * @param values the value of selected states
     * @param option selected option
     * @returns string value to be displayed on selected option
     */
    displayValues(values: any, option: string): string {
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
    /**
     * This method is used to check if select all check box is already selected
     * @param option value of the option selected
     * @return boolean true if all rows selected else false
     */
    isAllSelected(option: string): boolean {
        const numSelected = this.selection[option].selected.length;
        const numRows = this.numRows[option];
        if (option === this.fromPretax && this.preTaxCheckbox && !this.preTaxCheckbox.checked && !this.preTaxSetPerPlan) {
            return true;
        }
        return numSelected === numRows;
    }
    /**
     * To toggle between selections made at product level
     *  This method is used to call @method displayRestrictedStateAlert() to set the flag for restricted state alert
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
            if (option === this.fromPlans) {
                this.productPlansNotSelected = false;
            }
        }
        this.displayRestrictedStateAlert();
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
                (option !== this.fromPretax || !plan.taxStatusReadOnly || plan.preTaxEligible) &&
                (option !== this.fromAssistanceRequired || plan.selected)
            ) {
                plan[option] = false;
                if (option === this.fromPlans) {
                    if (!plan.taxStatusReadOnly && plan.preTaxEligible) {
                        plan[this.fromPretax] = false;
                    }
                    plan[this.fromAssistanceRequired] = false;
                }
            }
        });
        this.agentAssistanceForRestricted();
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
    }
    /**
     * This method is used to update all plans based on select all checkbox changes
     * @param option is the variable used to define which plan selections has to update
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
                if (option === this.fromPretax && plan.selected) {
                    // check for selected plan pretax checkbox
                    const isPreTaxChecked = this.preTaxCheckbox.checked;
                    plan[option] = isPreTaxChecked;
                    if (isPreTaxChecked) {
                        this.selection[option].select(plan);
                    } else {
                        this.selection[option].deselect(plan);
                    }
                }
            });
            this.agentAssistanceForRestricted();
            this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        }
    }
    /**
     * @description To update plans data based on checkbox changes and also to set the flag for restricted state alert
     * This method is used to call @method checkArgusSelectedPlans on toggle of plan check-box
     * @param event the event on click of checkbox
     * @param row the row in the table
     * @param option the option of the plan selected
     */
    updateCheckedPlans(event: { checked: boolean; value: string }, row: { name: string } & PlanPanel, option: string): void {
        this.selectedPlan = row;
        this.isNextClicked = false;
        const agentAssistanceRequired = this.agentAssistance.checked;
        this.isRestrictedPlanSelected = false;
        if (option === this.fromAssistanceRequired) {
            this.restrictedStatesrow = row;
            this.restrictedStateAlertCarrier =
                this.langStrings["primary.portal.benefitsOffering.residentOf"] +
                " " +
                this.enrollmentRestrictedStates +
                " " +
                this.langStrings["primary.portal.benefitsOffering.noSelfEnroll"] +
                " " +
                row.name +
                " " +
                AppSettings.PLANS;
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
        if (this.selectedPlan.carrierId === CarrierId.ADV) {
            this.plansList.forEach((plans) => {
                if (plans.productId === this.selectedPlan.productId) {
                    plans.selected = false;
                }
            });
        }
        // Update Plan Selections
        this.updateSelection();
        this.displayRestrictedStateAlert();
        this.agentAssistanceForRestricted();
        this.changeDetector.detectChanges();
        if (option === this.fromPlans && this.agentAssistance.checked !== agentAssistanceRequired) {
            this.masterToggle(this.fromAssistanceRequired);
        }
        this.selection[option].toggle(row);
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        if (this.isExceptionProduct) {
            this.isHcfsaPlan = true;
            this.checkboxActionsForExceptions();
        }
        this.checkArgusSelectedPlans();
    }
    /**
     *  Updates the selection from allPlans to plansList. The plansList is checked for plans selected to proceed to the next screen
     */
    updateSelection(): void {
        this.allPlans.data.forEach((plan) => {
            const selection = this.plansList.find((planData) => plan.planId === planData.planId);
            if (selection) {
                selection.selected = plan.selected;
            }
        });
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
     * This method is used to configure filters initially
     * and also based upon the permission change agent assisted flag
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
            if (!carrier.agentAssistedDisabled) {
                this.isAgentAssistedDisabled = false;
            }
            this.filtersData[this.fromCarriers].push(carrier);
        });
        if (
            !this.isReceivingHQ ||
            (this.isAgentAssistedDisabled && !this.isRole20User) ||
            (!this.minEmployees && !this.isTPPAccount) ||
            this.isRestrictedPlanSelected ||
            !this.isVasHQFund ||
            !this.isVasEmployeeFund
        ) {
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
                this.addSelectedFilter(this.fromCarriers, this.form.controls.carriersFilter.value);
                this.carriersFilterDropdown.close();
                break;
            case this.fromRiders:
                this.filterValue[val] = this.form.controls.ridersFilter.value;
                this.addSelectedFilter(this.fromRiders, this.form.controls.ridersFilter.value);
                this.ridersFilterDropdown.close();
                break;
            case this.fromStates:
                this.filterValue[val] = this.form.controls.statesFilter.value;
                this.addSelectedFilter(this.fromStates, this.form.controls.statesFilter.value);
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
        this.isReceivingHQ = true;
        this.allPlans.data.forEach((plan) =>
            plan.planId === row.planId ? (plan[PlansColumns.SELECTED] = true) : (plan[PlansColumns.SELECTED] = false),
        );
        this.isSelected = true;
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
        this.productPlansNotSelected = false;
    }
    /**
     * @description To deselect all the plans selected when none radio button is checked
     * @return {void}
     */
    deselectPlans(): void {
        this.allPlans.data.forEach((plan) => {
            plan.selected = false;
        });
        this.isSelected = false;
        this.showDisclaimerForRSLICarrier = this.checkRSLIPlanExist();
    }

    /**
     * This method will close the modal
     */
    closeModal(): void {
        this.isNextClicked = false;
        this.dialog.closeAll();
    }

    /**
     * updates plan choices to store
     * @param isPlanChoiceCreated indicates if plan choice is created or not
     * @param planChoicesToUpdate plan choices to update
     * @param editedPlanChoices list of edited plan choices
     * @param fromNext indicates whether called form Next click or on load
     */
    updatePlanChoices(
        isPlanChoiceCreated: boolean,
        planChoicesToUpdate: PlanChoice[],
        editedPlanChoices: PlanPanel[],
        fromNext?: boolean,
    ): void {
        // eslint-disable-next-line no-shadow, @typescript-eslint/no-shadow
        forkJoin(
            this.benefitsOfferingService.getPlanChoices(true, false, this.mpGroup),
            this.store.dispatch(new MapPlanChoicesToPanelProducts()),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    if (resp.length >= 0) {
                        this.isLoading = false;
                        planChoicesToUpdate.forEach((planChoiceToUpdate) => {
                            if (planChoiceToUpdate.id !== 0) {
                                planChoicesToUpdate[planChoicesToUpdate.indexOf(planChoiceToUpdate)] = resp[0]
                                    .filter(
                                        (choice) =>
                                            choice.plan.id === planChoiceToUpdate.planId &&
                                            choice.taxStatus === planChoiceToUpdate.taxStatus,
                                    )
                                    .pop();
                            }
                        });
                        if (planChoicesToUpdate.length) {
                            this.plansList.forEach((plan) => {
                                const planEdited = editedPlanChoices.filter((editedPlan) => editedPlan.planId === plan.planId).pop();
                                if (planEdited) {
                                    if (isPlanChoiceCreated) {
                                        const planChoice = planChoicesToUpdate
                                            .filter((choice) =>
                                                choice.id ? choice.plan.id === plan.planId : choice.planId === plan.planId,
                                            )
                                            .pop();
                                        if (planChoice) {
                                            planEdited.planChoiceId = planChoice.id;
                                            planEdited.agentAssisted = planChoice.agentAssisted;
                                        }
                                    }
                                    this.plansList[this.plansList.indexOf(plan)] = planEdited;
                                }
                            });
                        }
                        if (fromNext || fromNext === undefined) {
                            // fixes for sidenavigation after plan selection
                            if (this.sideNavTrigger || this.isSideNavSelected) {
                                this.sideNavTrigger = false;
                                this.sideNavService.planChoiceMade$.next({
                                    productIndex: this.presentProductIndex,
                                    completed: this.plans.filter((plan) => plan.selected).length,
                                });
                                this.sideNavService.changeProduct$.next(true);
                            } else {
                                this.goToNextProduct(true);
                            }
                        } else {
                            this.plansToCompare = this.plansList.filter((plan) => plan.productId === this.productId);
                        }
                    }
                    this.isLoading = false;
                },
                (errorresp) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * check if Alfac, ADV, NGL product is selected and if the changes are made; if so, it will go to the next product
     * @param changesMade indicates if changes are made
     */
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
                this.sideNavService.planChoiceMade$.next({
                    productIndex: this.presentProductIndex,
                    completed: completed,
                });
                this.sideNavService.defaultStepPositionChanged$.next(3);
            }
            this.isADVEROption = false;
            this.sideNavService.changeProduct$.next(true);
            this.router.navigate(["../../3", nextProduct.id], { relativeTo: this.route });
        } else {
            const selectedPlans = this.plansList.filter((plan) => plan.selected);
            const aflacCarrierIds = this.carrierMaps
                .filter((carrierData) => carrierData.carrier === CarrierIdType.AFLAC)
                .map((carrier) => carrier.ids.map((id) => +id))[0];
            const advCarrier = this.carrierMaps.find((carrierData) => carrierData.carrier === CarrierIdType.ADV);
            const selectedAflacPlans: PlanPanel[] = selectedPlans.filter((plan) => aflacCarrierIds.indexOf(plan.carrierId) >= 0);
            const selectedADVPlans: PlanPanel[] = advCarrier
                ? selectedPlans.filter((plan) => plan.carrierId === Number(advCarrier.ids))
                : [];
            const selectedNGLPlans: PlanPanel[] = this.getSelectedNGLPlans(selectedPlans);
            const PLHSOProduct = selectedPlans.filter((plan) => plan.planId === ArgusPlanId.Aflac_PLHSO_Plan_ID && plan.selected);
            const selectedDentalGroupPlans: PlanPanel[] = advCarrier
                ? selectedPlans.filter((plan) => plan.carrierId === Number(advCarrier.ids) && plan.productName === this.dentalPlan)
                : [];
            if (this.situsState === StateAbbreviations.FLORIDA && PLHSOProduct.length) {
                const DentalPLHSOProductCount = selectedPlans.filter((plan) => this.PPOMACPlanIds.includes(plan.planId)).length;
                if (
                    DentalPLHSOProductCount < this.MIN_PLHSO_PRODUCT_SELECT ||
                    selectedDentalGroupPlans.length < MIN_PLHSO_NON_PLHSO_PLAN_SELECT_FOR_FL_STATE
                ) {
                    this.isPLHSOProductSelectedError = true;
                    this.isError = true;
                }
            }
            if (
                selectedPlans.length &&
                // check if the selected plans are of Aflac, ADV, NGL.
                (selectedAflacPlans.length || selectedADVPlans.length || selectedNGLPlans.length) &&
                !this.isPLHSOProductSelectedError
            ) {
                this.sideNavService.defaultStepPositionChanged$.next(4);
            } else if (this.isPLHSOProductSelectedError) {
                this.isError = true;
                this.errorMessage = this.secondaryLanguages[ArgusLanguage.SELECT_ONE_NON_PLHSO_PRODUCT];
            } else if (selectedPlans.length) {
                this.isError = true;
                this.errorMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.1AflacPlan"];
            } else {
                this.dialog.open(this.allProductsSelected);
            }
        }
    }

    /**
     * gets the selected NGL plans
     * @param selectedPlans are the total selected plans in BO
     * @returns selected NGL plans
     */
    getSelectedNGLPlans(selectedPlans: PlanPanel[]): PlanPanel[] {
        const nglCarrier = this.carrierMaps.find((carrierData) => carrierData.carrier === CarrierIdType.ARGUS);
        if (!nglCarrier) {
            return [];
        }
        return selectedPlans.filter((plan) => nglCarrier.ids.includes(plan.carrierId.toString()));
    }

    // To go back to previous screen on click of back
    onBack(): void {
        this.restrictedStates = false;
        this.isADVEROption = false;
        this.restrictedStatesCarrierSpecific = false;
        if (this.isEmpFunded && this.skipHQFunded) {
            this.presentProductIndex -= 1;
        }
        const previousProduct = this.productList[this.presentProductIndex - 1];
        if (previousProduct) {
            this.router.navigate(["../../3", previousProduct.id], { relativeTo: this.route });
        } else {
            this.sideNavService.stepClicked$.next(1);
        }
    }

    /**
     * To check billing if wagework plans are selected
     * @param fromNext indicates whether called from next or on load
     */
    onSubmit(fromNext: boolean): void {
        // pushing previous selection of carrier id to a new array
        for (const id of this.selectedCarriers) {
            this.selectedCarrierArr.push(id);
        }
        this.isVasMaxValid = false;
        this.isPLHSOProductSelectedError = false;
        this.isWagesPresent = Boolean(this.allPlans.data.find((form) => form.carrierId === CarrierId.WAGEWORKS && form.selected));
        if (this.isWagesPresent && !this.contactInfoBilling.length && !this.billingAdded) {
            this.addBillingContact();
        } else if (this.isVasException && this.isHQFunded && this.maxPlansValue !== 0) {
            const selectedPlans = this.selection["selected"].selected.length;
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
     * To check if billing for wages plan choices present and update other plan choices on click of next
     * @param fromNext indicates whether on click of next or form onload
     * @param productIdToBeNavigated product id to be loaded next
     */
    onNext(fromNext: boolean, productIdToBeNavigated?: string): void {
        if (this.isNextRestricted(productIdToBeNavigated)) {
            this.productPlansNotSelected = true;
            this.errorMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.onePlanForProduct"];
            return;
        }
        this.restrictedStates = false;
        this.isNextClicked = fromNext;
        this.restrictedStatesCarrierSpecific = false;
        this.isADVEROption = false;
        if (this.preTaxCheckbox) {
            this.preTaxCheckbox.checked = this.selection[this.fromPretax].hasValue() && this.isAllSelected(this.fromPretax);
        }
        this.editedPlanChoiceSelected = this.plans.filter(
            (editedPlan) =>
                !this.plansToCompare.some((plan) => JSON.stringify(editedPlan) === JSON.stringify(plan)) &&
                (editedPlan.selected || editedPlan.planChoiceId) &&
                (!this.isEmpFunded || !editedPlan.isEmpFundedPlanDisabled),
        );
        // used to push the deselcted plans into an array which will be used to make delete API call
        if (this.editedPlanChoiceSelected.length && !this.isHQFunded && !this.isEmpFunded) {
            // push the previously selected plans into the array
            // use these plans to call delete API so that the data can be updated with new plans removing the deselected plans
            // make the previously selected plans to false if they are not selected so that these can be used in the delete API call
            const previouslySelectedPlans: PlanPanel[] = this.plansToCompare
                .filter(
                    (previousSelectedPlan) =>
                        // it has to be selected previously
                        // Not in current plan list
                        // present in current plan list but is not selected
                        previousSelectedPlan.selected &&
                        (!this.plans.some((plan) => previousSelectedPlan.planId === plan.planId) ||
                            this.plans.some((plan) => previousSelectedPlan.planId === plan.planId && !plan.selected)),
                )
                .map((selectedPlan) => ({ ...selectedPlan, selected: false }));
            // push only the plans that were not in editedPlanChoiceSelected
            if (previouslySelectedPlans?.length) {
                previouslySelectedPlans.forEach((plan) => {
                    if (!this.editedPlanChoiceSelected.find((editedPlan) => editedPlan.planId === plan.planId)) {
                        this.editedPlanChoiceSelected.push(plan);
                    }
                });
            }
        }
        if (this.isNoneSelected) {
            const plans = this.plans.filter((ele) => ele.planChoiceId);
            this.editedPlanChoiceSelected = plans.map((plan) => {
                plan.selected = false;
                return plan;
            });
        }
        if (this.editedPlanChoiceSelected.length && this.isHQFunded) {
            // Employee funded plans with same product id as HQ funded is filtered to delete
            const empFundedplans = this.plansList
                .filter(
                    (plan) =>
                        this.editedPlanChoiceSelected.some((editedplan) => editedplan.productId === plan.productId) &&
                        !this.editedPlanChoiceSelected.some((editedplan) => editedplan.planId === plan.planId) &&
                        plan.selected,
                )
                .map((plan) => {
                    plan.selected = false;
                    return plan;
                })
                .filter((plan) => plan.planChoiceId);
            if (empFundedplans.length) {
                this.editedPlanChoiceSelected.push(...empFundedplans);
            }
            this.plansList = this.quasiService.setDeselectedPlans(this.plansList, this.plansToCompare, this.editedPlanChoiceSelected);
        }
        if (this.editedPlanChoiceSelected.length) {
            this.isSideNavSelected = this.sideNavTrigger;
            this.sideNavTrigger = false;
            this.managePlanChoice(this.editedPlanChoiceSelected, this.isNextClicked);
        } else if (this.sideNavTrigger) {
            this.sideNavTrigger = false;
            this.sideNavService.changeProduct$.next(true);
        } else if (!this.sideNavTrigger) {
            this.goToNextProduct(false);
        }
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
            mpGroupId: this.mpGroup?.toString(),
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
     * Create, Update and Delete operations for Plan Choice
     * @param editedPlanChoices edited plan choices
     * @param fromNext indicates whether the function is called on click of next or from onInit
     */
    managePlanChoice(editedPlanChoices: PlanPanel[], fromNext: boolean): void {
        this.planIndex = 0;
        this.planLength = editedPlanChoices.length;
        this.isplanChoiceCreated = false;
        this.planChoicesToUpdate = [];
        if (this.isRestrictedToSinglePlan && editedPlanChoices.length === this.restrictedPlanLength) {
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
            editedPlanChoices.forEach(async (planChoiceMade) => {
                const planChoice: PlanChoice = {
                    id: planChoiceMade.planChoiceId,
                    planId: planChoiceMade.planId,
                    taxStatus: planChoiceMade.taxStatus,
                    cafeteria: planChoiceMade.cafeteria,
                    agentAssisted:
                        this.filtersData[this.fromCarriers].some(
                            (carrier) => carrier.agentAssisted && carrier.name === planChoiceMade.carrier,
                        ) && !this.isEmpFunded,
                };
                this.isLoading = true;
                if (planChoiceMade.selected) {
                    if (planChoiceMade.planChoiceId) {
                        this.updatePlanChoice(planChoice, editedPlanChoices);
                    } else {
                        this.createPlanChoice(planChoice, editedPlanChoices);
                    }
                } else {
                    this.deletePlanChoice(planChoice, editedPlanChoices, fromNext, planChoiceMade);
                }
            });
        }
    }

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

    updatePlanChoice(planChoice: PlanChoice, editedPlanChoices: any): void {
        this.benefitsOfferingService
            .updatePlanChoice(planChoice, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
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
                    this.datepipe.transform(new Date().setDate(new Date().getDate() - 1), AppSettings.DATE_FORMAT),
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
                        if (this.planIndex === this.planLength) {
                            this.updatePlanChoices(this.isplanChoiceCreated, this.planChoicesToUpdate, editedPlanChoices);
                        }
                    },
                );
        } else {
            this.isLoading = false;
            this.goToNextProduct(true);
        }
    }

    // function to add or update selected benefit filters
    addSelectedFilter(filtername: string, selectedFilter: string[]): void {
        if (this.sideNavService.benefitFilterChanged$.value) {
            const filterData = this.filterDetails.findIndex((index) => this.productId === index.productId);
            if (filterData !== -1) {
                switch (filtername) {
                    case this.fromCarriers:
                        this.filterDetails[filterData].carriers = selectedFilter;
                        break;
                    case this.fromRiders:
                        this.filterDetails[filterData].riders = selectedFilter;
                        break;
                    case this.fromStates:
                        this.filterDetails[filterData].states = selectedFilter;
                        break;
                }
            } else {
                this.addNewFilterDetails(filtername, selectedFilter);
            }
        } else {
            this.addNewFilterDetails(filtername, selectedFilter);
        }
        this.sideNavService.updateFilterData(this.filterDetails);
    }

    // function to get previously selected filter
    getSelectedFilter(productId: string): void {
        const benefitFilterValue = this.sideNavService.benefitFilterChanged$.value;
        if (benefitFilterValue) {
            const filterData: BenefitFilter = benefitFilterValue.find((filterValue) => filterValue.productId === productId);
            if (filterData) {
                this.form.controls.ridersFilter.setValue(filterData.riders);
                this.form.controls.carriersFilter.setValue(filterData.carriers);
                this.form.controls.statesFilter.setValue(filterData.states);
            }
        }
    }

    // add new filter details in benefit offerings
    addNewFilterDetails(filtername: string, selectedFilter: string[]): void {
        const selectedProdFilter: BenefitFilter = {
            productId: this.productId,
        };
        switch (filtername) {
            case this.fromCarriers:
                selectedProdFilter.carriers = selectedFilter;
                break;
            case this.fromRiders:
                selectedProdFilter.riders = selectedFilter;
                break;
            case this.fromStates:
                selectedProdFilter.states = selectedFilter;
                break;
        }
        this.filterDetails.push(selectedProdFilter);
    }
    /**
     * to create the plan choice object for request parameter
     * @param deleteProd Plan data to be deleted
     */
    getPlanChoiceObject(deleteProd: PlanPanel): PlanChoice {
        return {
            id: deleteProd.planChoiceId,
            planId: deleteProd.planId,
            taxStatus: deleteProd.taxStatus,
            cafeteria: deleteProd.cafeteria,
            agentAssisted: this.filtersData[this.fromCarriers]
                .filter((carrier) => carrier.agentAssisted && carrier.name === deleteProd.carrier)
                .pop()
                ? true
                : false,
        };
    }
    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }

    // To check whether the RSLI products are available to display the respective disclaimer
    checkRSLIPlanExist(): boolean {
        return this.allPlans.data.find((plan) => AppSettings.RELIANCE_CARRIER.indexOf(plan.carrier) > -1 && plan.selected) ? true : false;
    }
    /**
     * To check if pretax checkbox is selected, make seletced plan with pretax true
     * @param isPreTax pretax checkbox value for plan
     */
    checkPretaxForSelectedPlan(isPreTax: boolean): boolean {
        if (!this.preTaxSetPerPlan && this.preTaxCheckbox.checked) {
            return isPreTax;
        }
        return false;
    }

    // Update the disclaimer based on product selected
    updatePlanSpecificDisclaimer(): string {
        const product = this.allPlans.data[0];
        if (product.productName === this.visionPlan) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansVisionDisclaimer"];
        } else if (product.productName === this.dentalPlan) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansDentalDisclaimer"];
        } else if (product.productName === this.LTDPlan || product.productName === this.basicLife) {
            this.disclaimerMessage = this.secondaryLanguages["secondary.portal.benefitsOffering.reliancePlansBasicLTDDisclaimer"];
        }
        return this.disclaimerMessage;
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
     * Returns whether a plan should be disabled.
     * A Reliance Standard LTD plan is disabled if the account is ineligible.
     * @param {Plan} plan
     * @returns {boolean} indicates if the plan is disabled
     */
    isRSLILTDDisabled(plan: Plan): boolean {
        return plan.carrierId === CarrierId.RELIANCE_STANDARD && plan.productId === ProductId.LTD && !this.isAccountRSLIEligible;
    }
    /**
     * Function to get restricted selected plan and set checkbox value as per that
     */
    agentAssistanceForRestricted(): void {
        this.isRestrictedPlanSelected = false;
        if (!this.plans.find((plan) => plan.selected)) {
            return;
        }
        this.isRestrictedPlanSelected = this.quasiService.getRestrictedPlans(
            this.plans.filter((plan) => plan.selected),
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
     * Method to set the flag for restricted state alert
     */
    displayRestrictedStateAlert(): void {
        this.isNonEligibleStateMsg = this.allPlans.data.some(
            (plan) =>
                plan.selected &&
                plan.states.length &&
                this.enrollmentRestrictedStates &&
                plan.states.some((state) => this.enrollmentRestrictedStates.includes(state.abbreviation)),
        );
    }
    ngOnDestroy(): void {
        if (this.mpGroup) {
            this.store.dispatch(new SetPlanChoices(true));
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
