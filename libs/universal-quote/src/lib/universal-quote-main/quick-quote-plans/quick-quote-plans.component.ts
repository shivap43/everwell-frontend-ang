/* eslint-disable complexity */
import { Component, OnInit, Input, AfterViewInit, OnDestroy, ViewChild } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { UniversalService, MoreSettingsEnum } from "../universal.service";
import { Store } from "@ngxs/store";
import { CoreService, StaticService, ProductDetail } from "@empowered/api";

import {
    SaveRateSheetSelection,
    UniversalQuoteState,
    SetPlanPricing,
    SetPlanCoverageLevels,
    SavePlansPriceSelection,
    BenefitCoverageSelectionModel,
    Plan,
    QuoteSettingsSchema,
    CoverageLevelModel,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { Subject, forkJoin, Observable, combineLatest } from "rxjs";
import { map, takeUntil, withLatestFrom } from "rxjs/operators";
import { MatAccordion } from "@angular/material/expansion";
import { MatSelect } from "@angular/material/select";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { FormControl } from "@angular/forms";
import {
    CarrierId,
    ConfigName,
    ProductId,
    RESIDENT_STATE,
    EnrollmentConstants,
    AppSettings,
    MissingInfoType,
    CoverageLevel,
    CountryState,
    BenefitAmountInfo,
    CoverageLevelPricing,
} from "@empowered/constants";
import { CurrencyPipe } from "@angular/common";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { PlanDetailsComponent, DropDownPortalComponent } from "@empowered/ui";

const INDIVIDUAL_COVERAGE_ID = 1;
const ELIMINATION_VALUE_LENGTH = 4;
const TAG = "tag";
const MAX_BENEFIT_AMOUNTS_ALLOWED = 4;
const TABLE_HEADER_NAME = "tableHeaderName";
const TABLE_ID = "tableId";
const CIRIDER = "CIRIDER";
const RIDER_COVERAGE_LENGTH = 1;
const HUNDRED = 100;

export interface RiderDataObject {
    showRadio: boolean;
    showMultiplePrice: boolean;
    selectedBenefitAmount: number[];
    temporarySelectedBenefitAmount: number[];
    combinedBenefitAmount: number;
    isCustomSelected: boolean;
    optionSelected: OptionSelected;
    temporaryOptionSelected: OptionSelected;
}

export interface TotalCost {
    [coverageLevelId: number]: number;
}

export enum OptionSelected {
    CUSTOM = "CUSTOM",
    COMBINED = "COMBINED",
}
@Component({
    selector: "empowered-quick-quote-plans",
    templateUrl: "./quick-quote-plans.component.html",
    styleUrls: ["./quick-quote-plans.component.scss"],
})
export class QuickQuotePlansComponent implements OnInit, AfterViewInit, OnDestroy {
    dataSource = [];
    @Input() quickQuotePlans: ProductDetail[];
    languageStrings: Record<string, string>;
    productIndex = 0;
    isSpinnerLoading: boolean;
    riderCoverageMapping = {};
    riderTable = {};
    planInfo: any;
    dataLoaded: boolean;
    coverageLevelsData: CoverageLevel[];
    BASE_PRICE_DATA = {};
    tags = ["Base price"];
    columns = {};
    coverageLevelObject = {};
    pricingTableArray = [];
    selectedCoverageRadio = {};
    hideRider = {};
    riderSelectValue = {};
    displayedColumns = {};
    riderInfoObject = {};
    riderCheckStatus = {};
    disableRider: { [id: number]: boolean } = {};
    ridersPricingObject = {};
    planPricingObject = {};
    riderTempCheckStatus = {};
    productStatus: ProductDetail[];
    benefitAmountObject = {
        benefitAmountValue: new Map<number, string>(),
        planBenAmtRadio: new Map<number, string>(),
    };
    riderBenefitAmountObject = {
        benefitAmountValue: {},
        planBenAmtRadio: {},
    };
    eliminationPeriodObject = {
        eliminationPeriodList: {},
        eliminationPeriodValue: {},
        eliminationPeriodRadio: {},
    };
    riderEliminationPeriodObject = {
        eliminationPeriodList: {},
        eliminationPeriodValue: {},
        eliminationPeriodRadio: {},
    };
    isRiderUpdate = {};
    private unsubscribe$ = new Subject<void>();
    error = {};
    errorMessage: string[] = [];
    iconValMsg = {};
    planDetailsDialogRef: MatDialogRef<PlanDetailsComponent>;
    @ViewChild("expansion") expansion: MatAccordion;
    tempRiderBenefitAmountObject = new Map<number, number>();
    payFrequency: string;
    ridersBenefitAmtRadio = {};
    riderEliminationPeriod = {};
    dependentAgeOptions = AppSettings.DEPENDENTAGEOPTIONS;
    dependentAge: FormControl = new FormControl("");
    selectedDependentAgeRadio = new Map<string, number>();
    policyFeeRiderIds = [];
    currentPlan: any;
    defaultChildAge: number;
    APPLY_ACTION = "apply";
    RESET_ACTION = "reset";
    quoteLevelData: QuoteSettingsSchema;
    expandPlan = false;
    selectedEliminationPeriod = new Map<number, number>();
    selectedEliminationPeriodList: Array<{ riderId: number; coverageId: number }> = [];
    totalCost: { [planId: number]: { [coverageLevelId: number]: number } } = {};
    configName = ConfigName;
    showAddToRateSheet: boolean;
    rateSheetMissingInfoTooltips: Record<number, string> = {};

    isSTDProduct: boolean;
    multipleElimination: FormControl = new FormControl([]);
    disableElimination: boolean[];
    plansWithMultipleSelectedEliminations = new Map<string, number[]>();
    multipleCovRows = [];
    totalCostMultiSelectCov = new Map<string, number[]>();
    selectedEliminationName: string[] = [];
    showRiderReset = false;
    stdPricingAvailable = true;

    // Saves plan selections (rate sheet and quote).
    planSelections: {
        [planId: string]: { includedInRateSheet: boolean; includedInQuote: boolean; planSelectionText: string };
    } = {};

    // If true, user can download the rate sheet without specifying age/gender/salary.
    bypassRequirementsForRateSheet: boolean;
    // indicates if different dependent age is selected and applied
    isDependentAgeApplied = false;

    multipleBenefitAmount: FormControl = new FormControl([]);
    disableBenefitAmount: boolean[];
    disabledSelectionToolTip = "";
    // contains the multiple benefit amounts selected for particular plans
    plansWithMultipleSelectedBenefitAmounts = new Map<string, number[]>();
    uniqueBenefitAmountsOfPlan: number[] = [];
    readonly SINGLE_ELIMINATION = 1;
    multipleSelectionsConfig = false;
    isJuvenileProduct = false;
    multipleSelectedDependentAges: FormControl = new FormControl([]);
    disableDependentAge: boolean[];
    plansWithMultipleSelectedDependentAges = new Map<string, number[]>();
    selectedDependentAgesList: string[];
    riderLength = new Map<string, string>();
    readonly ZERO_DEPENDENT_AGE = "14-364 days";
    readonly MAX_MULTIPLE_BENEFIT_AMOUNTS_SELECTION = 4;
    skipMultipleSelectionRiderIds = [];
    disableCDR: { [id: number]: boolean } = {};
    // boolean to handle reset button of benefit amount dropdown
    showBenefitAmountReset = false;
    lifePlanMultipleSelectionsEnabled = false;
    isLifePlan = false;
    showMultipleBaseBenefitAmountsForRider = false;
    ridersObjectOfPlan = new Map<number, RiderDataObject>();
    optionSelected = OptionSelected;
    showFootnote = false;
    showLimitedBenefitAmountFootnote = false;
    maxBenefitAmountForFootnote: number;
    isRiderResetRequired: boolean;
    riderMaxBenefitAmountLimits: Map<number, number>;
    riderApplyClicked = false;
    selectedBenefitAmounts = new Map<string, number[]>();
    fromPlanPricing = false;
    fromRiderClose = false;
    showRiderNotAvailableFootnote = false;
    showInEligibleRiderAmount = false;
    showPartialInEligibleRiderAmount = false;
    disableInsuranceRider: { [id: number]: boolean } = {};
    riderInEligibleAmount: number;
    riderInEligibleAmountName: string;
    inEligibleRiderId: number;
    multiplePlanPriceSelection: Record<number, number> = {};
    premiumSelected = false;

    constructor(
        private readonly language: LanguageService,
        private readonly universalService: UniversalService,
        private readonly store: Store,
        private readonly coreService: CoreService,
        private readonly utilService: UtilService,
        private readonly matDialog: MatDialog,
        private readonly staticService: StaticService,
        private readonly staticUtilService: StaticUtilService,
        private readonly currencyPipeObject: CurrencyPipe,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * loads data required for component
     */
    ngOnInit(): void {
        this.staticUtilService
            .fetchConfigs([
                ConfigName.QQ_DEFAULT_CHILD_AGE,
                ConfigName.QQ_LIFE_RIDERS_MAX_BENEFIT_AMOUNT_LIMIT,
                ConfigName.DIRECT_WHOLE_LIFE_RIDER_NOT_AVAILABLE,
            ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([childAges, lifeRidersBenefitLimits, riderNotAvailableLimit]) => {
                this.defaultChildAge = +childAges.value;
                this.selectedDependentAgesList = [this.defaultChildAge === 0 ? this.ZERO_DEPENDENT_AGE : this.defaultChildAge.toString()];
                this.riderMaxBenefitAmountLimits = new Map<number, number>();
                lifeRidersBenefitLimits.value.split(",")?.forEach((riderLimit) => {
                    const limitData = riderLimit.split("=");
                    this.riderMaxBenefitAmountLimits[limitData[0]] = +limitData[1];
                });
                const riderAvailableLimit = riderNotAvailableLimit.value.split("=");
                this.inEligibleRiderId = +riderAvailableLimit[0];
                this.riderInEligibleAmount = +riderAvailableLimit[1];
                this.riderInEligibleAmountName = this.currencyPipeObject.transform(+riderAvailableLimit[1], "USD", "symbol", "1.0");
            });
        this.staticUtilService
            .cacheConfigValue(ConfigName.ENROLLMENT_MANDATORY_RIDER_ID)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((policyFeeRiders) => {
                this.policyFeeRiderIds = policyFeeRiders ? policyFeeRiders.split(",") : [];
            });
        this.getLanguageString();
        this.productStatus = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        this.universalService.cdkSelectionUpdate$.pipe(takeUntil(this.unsubscribe$)).subscribe((payload) => {
            if (payload) {
                this.updateExpansion();
                this.resetAll();
            }
        });
        this.universalService.selectionUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((payload) => {
            this.updateExpansion();
            this.resetAll();
        });
        this.universalService.resetButtonTapped$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.updateExpansion();
            this.resetAll();
        });
        combineLatest([
            this.universalService.currentProductId$,
            this.staticUtilService.cacheConfigEnabled(ConfigName.RATE_SHEET_PROPERTY_BYPASS_ENABLED),
            this.staticUtilService.cacheConfigEnabled(ConfigName.MULTIPLE_SELECTIONS_QUICK_QUOTE),
            this.staticUtilService.cacheConfigValue(ConfigName.QQ_SKIP_MULTIPLE_SELECTION_FOR_RIDER),
            this.universalService.planSelectionUpdated$,
            this.staticUtilService.cacheConfigEnabled(ConfigName.QQ_LIFE_PLAN_MULTIPLE_SELECTIONS),
        ])
            .pipe(withLatestFrom(this.store.select(UniversalQuoteState.GetQuickQuotePlans)), takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    [
                        productIndex,
                        bypassPropertyRequirements,
                        multipleBenefitAmountsSelection,
                        skipMultipleSelectionRiderIds,
                        ,
                        lifePlanMultipleSelectionsEnabled,
                    ],
                    products,
                ]) => {
                    this.bypassRequirementsForRateSheet = bypassPropertyRequirements;
                    this.multipleSelectionsConfig = multipleBenefitAmountsSelection;
                    this.skipMultipleSelectionRiderIds = skipMultipleSelectionRiderIds ? skipMultipleSelectionRiderIds.split(",") : [];
                    this.lifePlanMultipleSelectionsEnabled = lifePlanMultipleSelectionsEnabled;
                    this.planSelections = products[productIndex]?.plans.reduce(
                        (planSelections, plan) => ({
                            ...planSelections,
                            [plan.id.toString()]: {
                                includedInQuote:
                                    plan.planPriceSelection?.length > 0 ||
                                    (plan.multiplePlanPriceSelections && Object.keys(plan.multiplePlanPriceSelections).length > 0),
                                includedInRateSheet: bypassPropertyRequirements
                                    ? plan.rateSheetSelection
                                    : plan.planPriceSelection?.length > 0,
                                planSelectionText: this.getPlanSelectionText(
                                    plan.planPriceSelection?.length > 0 ||
                                        (plan.multiplePlanPriceSelections && Object.keys(plan.multiplePlanPriceSelections).length > 0),
                                    plan.rateSheetSelection,
                                ),
                            },
                        }),
                        {},
                    );
                    this.productIndex = productIndex;
                    if (this.lifePlanMultipleSelectionsEnabled) {
                        this.isLifePlanSelected();
                    }
                },
            );
        this.disabledSelectionToolTip =
            this.languageStrings["primary.portal.quickQuote.multipleSelections.disabled.checkbox.toolTipMessage"];
    }
    updateExpansion(): void {
        if (this.expansion) {
            this.expansion.multi = true;
            this.expansion.closeAll();
            this.expansion.multi = false;
        }
    }

    /**
     * indicates if row is of multiple price rider
     * @param index index of the rider
     * @param rowData row data
     * @returns boolean
     */
    isMultiplePrice(index: number, rowData: Map<string, string>): boolean {
        return rowData["riderTableData"];
    }

    /**
     * after view init the product index of the selected product to be displayed is retrieved
     */
    ngAfterViewInit(): void {
        this.universalService.currentProductId$.pipe(takeUntil(this.unsubscribe$)).subscribe((index) => {
            this.productIndex = index;
            if (this.multipleSelectionsConfig) {
                this.isSTDSelected();
            }
            if (this.lifePlanMultipleSelectionsEnabled) {
                this.isLifePlanSelected();
            }
            this.isJuvenileProduct = this.isJuvenile();
        });
    }
    // Function to fetch the language string from DB
    getLanguageString(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.resetnote",
            "primary.portal.quickQuote.planName",
            "primary.portal.quickQuote.title",
            "primary.portal.quickQuote.settings",
            "primary.portal.quickQuote.Channel",
            "primary.portal.quickQuote.payroll",
            "primary.portal.quickQuote.benefit",
            "primary.portal.quickQuote.rider",
            "primary.portal.quickQuote.method",
            "primary.portal.quickQuote.facetoface",
            "primary.portal.quickQuote.state",
            "primary.portal.quickQuote.georgia",
            "primary.portal.quickQuote.jobClass",
            "primary.portal.quickQuote.more",
            "primary.portal.quickQuote.annual",
            "primary.portal.quickQuote.reset",
            "primary.portal.quickQuote.accident",
            "primary.portal.quickQuote.includedInQuote",
            "primary.portal.quickQuote.details",
            "primary.portal.quickQuote.invidualsp",
            "primary.portal.quickQuote.invidual",
            "primary.portal.quickQuote.oneParent",
            "primary.portal.quickQuote.twoParent",
            "primary.portal.quickQuote.total",
            "primary.portal.quickQuote.perMonth",
            "primary.portal.quickQuote.rateSheets",
            "primary.portal.quickQuote.showRates",
            "primary.portal.quickQuote.missingInfo",
            "primary.portal.quickQuote.spouseAgeRequired",
            "primary.portal.quickQuote.dependantAge",
            "primary.portal.coverage.declined",
            "primary.portal.quickQuote.pricing",
            "primary.portal.thirdParty.add",
            "primary.portal.quickQuote.missingInfo.forQuote",
            "primary.portal.quickQuote.missingInfo.forRateSheet",
            "primary.portal.quickQuote.multipleSelections.disabled.checkbox.toolTipMessage",
            "primary.portal.setPrices.dollar",
            "primary.portal.quickQuote.riderBenefitAmount.custom.label",
            "primary.portal.quickQuote.riderBenefitAmount.base.label",
            "primary.portal.quickQuote.riderBenefitAmount",
            "primary.portal.quickQuote.multipleSelections.riderApplicant.ineligible",
            "primary.portal.quickQuote.multipleSelections.rider.notAvailable",
            "primary.portal.quickQuote.multipleSelections.riderNotAvailable.note",
        ]);
    }

    /**
     * method gets called on expand of plan
     * @param plan selected plan details
     */
    fetchPlanInfo(plan: Plan): void {
        this.multipleCovRows = [];
        this.riderLength[plan.id] = {};
        // pre populating multipleBenefitAmount with benefit amounts applied for a particular plan
        if (
            (this.isSTDProduct || this.isLifePlan || (this.multipleSelectionsConfig && this.isJuvenileProduct)) &&
            this.plansWithMultipleSelectedBenefitAmounts.get(plan.id.toString())
        ) {
            this.multipleBenefitAmount.setValue(this.plansWithMultipleSelectedBenefitAmounts.get(plan.id.toString()));
        }
        if (this.isSTDProduct && this.plansWithMultipleSelectedEliminations[plan.id.toString()]) {
            this.multipleElimination.setValue(this.plansWithMultipleSelectedEliminations[plan.id.toString()]);
        }
        this.multipleElimination.valueChanges.subscribe((selectedAmounts) => {
            this.disableElimination =
                selectedAmounts?.length === ELIMINATION_VALUE_LENGTH &&
                this.eliminationPeriodObject?.eliminationPeriodList[plan.id]?.map(
                    (eliminationPeriod) => !selectedAmounts.includes(eliminationPeriod.id.toString()),
                );
            this.getEliminationName(selectedAmounts);
        });
        // initializes form control with default child age if any juvenile plan is expanded first time else with previous value selected
        if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
            if (this.plansWithMultipleSelectedDependentAges.get(plan.id.toString())) {
                this.multipleSelectedDependentAges.setValue(this.plansWithMultipleSelectedDependentAges.get(plan.id.toString()));
            } else {
                this.multipleSelectedDependentAges.setValue([this.defaultChildAge]);
                this.plansWithMultipleSelectedDependentAges.set(plan.id.toString(), [this.defaultChildAge]);
            }
        }
        this.multipleSelectedDependentAges.valueChanges.subscribe((selectedDependentAges) => {
            // array of boolean to disable remaining unchecked dependent ages when any four are checked
            this.disableDependentAge =
                selectedDependentAges?.length === MAX_BENEFIT_AMOUNTS_ALLOWED &&
                this.dependentAgeOptions.map((dependentAge) => !selectedDependentAges.includes(dependentAge));
            this.selectedDependentAgesList = selectedDependentAges?.map((dependentAge) =>
                dependentAge === 0 ? " " + this.ZERO_DEPENDENT_AGE : " " + dependentAge.toString(),
            );
        });
        this.expandPlan = true;
        this.currentPlan = plan;
        this.isSpinnerLoading = true;
        this.error[plan.id] = false;
        this.errorMessage = [];
        this.getCoverageLevels(plan);
        const settings = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        // User needs to enter SIC/ABI code, employee count and zip code
        // to view the rate sheet for Argus plans.
        this.showAddToRateSheet =
            ![CarrierId.ARGUS, CarrierId.AFLAC_DENTAL_AND_VISION].includes(plan.carrierId) ||
            !!(settings.sicCode && settings.zipCode && settings.eligibleSubscribers);
        // assigns the dependent age for a plan to default value if plan is expanded first time else to existing selected value
        if (!this.multipleSelectionsConfig && this.isJuvenileProduct) {
            this.dependentAge.setValue(this.selectedDependentAgeRadio.get(plan.id.toString()) || this.defaultChildAge);
        }
    }

    /**
     * function which gets called on clicking outside of rider filter
     * @param plan contains selected plan info
     */
    onRiderClose(plan: Plan): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.riderCheckStatus[key] = { ...this.riderTempCheckStatus[key] };
        this.dispatchRiderSelection(plan.id, true);
        if (this.riderApplyClicked) {
            this.fromRiderClose = true;
            this.setEliminationPeriodData(plan);
        }
        this.riderInfoObject[key].forEach((rider) => {
            if (this.isLifePlan) {
                this.ridersObjectOfPlan[rider.id].temporaryOptionSelected = this.ridersObjectOfPlan[rider.id].optionSelected;
                this.ridersObjectOfPlan[rider.id].temporarySelectedBenefitAmount = [
                    ...this.ridersObjectOfPlan[rider.id].selectedBenefitAmount,
                ];
            }
            this.riderLength[planId][rider.id] = this.displayDisableRider(rider.id, +planId);
            // resets the rider benefit amount to previous value when benefit amount is changed and clicked outside dropdown
            if (
                this.tempRiderBenefitAmountObject.get(rider.id) &&
                this.tempRiderBenefitAmountObject.get(rider.id) !== this.riderBenefitAmountObject[key][rider.id]
            ) {
                this.riderBenefitAmountObject[key][rider.id] = this.tempRiderBenefitAmountObject.get(rider.id);
            }
            // resets the rider coverage level to previous value when coverage level is changed and clicked outside dropdown
            if (this.selectedEliminationPeriod.get(rider.id) && this.riderEliminationPeriodObject.eliminationPeriodList[key][rider.id]) {
                this.objectKeys(this.riderEliminationPeriodObject.eliminationPeriodList[key][rider.id]).forEach((index) => {
                    if (
                        this.riderEliminationPeriodObject.eliminationPeriodList[key][rider.id][index].coverageLevel.id ===
                            this.selectedEliminationPeriod.get(rider.id) &&
                        this.riderEliminationPeriodObject.eliminationPeriodList[key][rider.id][index].coverageLevel.name !==
                            this.riderEliminationPeriod[rider.id]
                    ) {
                        this.riderEliminationPeriod[rider.id] =
                            this.riderEliminationPeriodObject.eliminationPeriodList[key][rider.id][index].coverageLevel.name;
                    }
                });
            }
        });
        this.showRiderReset = Boolean(Object.values(this.riderCheckStatus[planId]).find(Boolean));
        this.riderApplyClicked = false;
    }

    /**
     * function to fetch coverage levels from store/API
     * @param plan contains selected plan info
     */
    getCoverageLevels(plan: Plan): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        if (!this.coverageLevelObject[key]) {
            this.coverageLevelObject[key] = {};
        }
        this.coverageLevelsData = this.utilService.copy(this.getCurrentPlanCoverageLevel(plan.product.id, plan.id));
        if (this.coverageLevelsData && this.coverageLevelsData.length) {
            this.coverageLevelsData.forEach((x) => {
                this.coverageLevelObject[key][x.id] = x;
            });
            this.objectKeys(this.coverageLevelObject[plan.id]).forEach((x) => {
                if (this.coverageLevelObject[plan.id][x].name === AppSettings.ENROLLED) {
                    this.coverageLevelObject[plan.id][x].name = AppSettings.DISPLAY_INDIVIDUAL;
                }
            });
            this.arrangePlanTable(plan);
        } else {
            this.store
                .dispatch(new SetPlanCoverageLevels(plan.id, plan.product.id))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.coverageLevelsData = this.utilService.copy(this.getCurrentPlanCoverageLevel(plan.product.id, plan.id));
                        if (this.coverageLevelsData && this.coverageLevelsData.length) {
                            this.coverageLevelsData.forEach((x) => {
                                this.coverageLevelObject[key][x.id] = x;
                            });
                            this.objectKeys(this.coverageLevelObject[plan.id]).forEach((x) => {
                                if (this.coverageLevelObject[plan.id][x].name === AppSettings.ENROLLED) {
                                    this.coverageLevelObject[plan.id][x].name = AppSettings.DISPLAY_INDIVIDUAL;
                                }
                            });
                            if (this.isJuvenileProduct) {
                                this.universalService.updateChildAge({
                                    planId: plan.id,
                                    childAge: this.multipleSelectionsConfig
                                        ? this.multipleSelectedDependentAges.value[0]
                                        : this.dependentAge.value,
                                });
                            }
                            this.arrangePlanTable(plan);
                        }
                    },
                    () => {
                        this.isSpinnerLoading = false;
                    },
                );
        }
    }

    /**
     * Set elimination period
     * @param plan selected plan
     * @param riderSelect selected rider details
     * @returns void
     */
    setEliminationPeriodData(plan: any, riderSelect?: DropDownPortalComponent): void {
        if (this.coverageLevelsData[0].eliminationPeriod && !this.eliminationPeriodObject.eliminationPeriodValue[plan.id]) {
            this.eliminationPeriodObject.eliminationPeriodList[plan.id] = {};
            this.eliminationPeriodObject.eliminationPeriodValue[plan.id] = [];
            this.eliminationPeriodObject.eliminationPeriodList[plan.id] = this.coverageLevelsData;
            this.eliminationPeriodObject.eliminationPeriodValue[plan.id].push(
                this.coverageLevelsData[0].eliminationPeriod.substring(0, this.coverageLevelsData[0].eliminationPeriod.length - 4),
            );
            this.objectKeys(this.coverageLevelObject[plan.id]).forEach((x) => {
                this.coverageLevelObject[plan.id][x].name = AppSettings.DISPLAY_INDIVIDUAL;
            });
            if (this.eliminationPeriodObject.eliminationPeriodList[plan.id]) {
                this.eliminationPeriodObject.eliminationPeriodRadio[plan.id] = [];
                this.eliminationPeriodObject.eliminationPeriodRadio[plan.id].push(this.objectKeys(this.coverageLevelObject[plan.id])[0]);
                this.multipleElimination.setValue(this.eliminationPeriodObject.eliminationPeriodRadio[plan.id]);
                this.plansWithMultipleSelectedEliminations[plan.id] = this.multipleElimination.value;
            }
        }
        if (this.planInfo && this.planInfo.riders && this.planInfo.riders.length) {
            this.riderEliminationPeriodObject.eliminationPeriodList[plan.id] = {};
            let riderEliminationPeriodIndex = 0;
            this.planInfo.riders.forEach((rider) => {
                if (this.checkRiderCoverage(rider)) {
                    this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id] = {};
                    this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id] = [
                        ...new Map(rider.coverageLevelPricing.map((item) => [item.coverageLevel.name, item])).values(),
                    ];
                    if (!this.riderEliminationPeriod[rider.plan.id]) {
                        this.riderEliminationPeriod[rider.plan.id] =
                            this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id][
                                riderEliminationPeriodIndex
                            ]?.coverageLevel.name;
                    }
                    this.objectKeys(this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id]).forEach((index) => {
                        if (
                            this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id][index].coverageLevel.name ===
                            this.riderEliminationPeriod[rider.plan.id]
                        ) {
                            riderEliminationPeriodIndex = index;
                            this.setRiderEliminationPeriod(
                                this.riderEliminationPeriodObject.eliminationPeriodList[plan.id][rider.plan.id][
                                    riderEliminationPeriodIndex
                                ],
                                rider.plan,
                                plan,
                            );
                        }
                    });
                }
            });
        }
        if (!this.fromRiderClose) {
            this.setRiderData(plan);
        }
        this.fromRiderClose = false;
        riderSelect?.hide();
    }

    /**
     * Check if the rider has coverage level or elimination period
     * @param rider: Rider plan
     * @returns boolean if the rider has coverage levels or elimination period
     */
    checkRiderCoverage(rider: any): boolean {
        // If the rider coverages matches with the base plan, then the rider coverages are not displayed
        const coverageMatch =
            this.planInfo?.coverageLevelPricing?.length &&
            rider.coverageLevelPricing?.length &&
            rider.coverageLevelPricing.some((riderCoveragePricing) =>
                this.planInfo?.coverageLevelPricing?.some(
                    (baseCoveragePricing) =>
                        // Return true if there is no coverage level object for base or rider plan
                        !baseCoveragePricing.coverageLevel ||
                        !riderCoveragePricing.coverageLevel ||
                        baseCoveragePricing.coverageLevel.id === riderCoveragePricing?.coverageLevel.id,
                ),
            );
        return !coverageMatch && rider.coverageLevelPricing[0]?.coverageLevel;
    }

    /**
     * set plan table on selection of rider
     * @param plan Plan details
     * @param benefitAmount selected benefit amount
     * @param riderSelect selected rider details
     * @returns void
     */
    arrangePlanTable(plan: Plan, benefitAmount?: BenefitCoverageSelectionModel[], riderSelect?: DropDownPortalComponent): void {
        if (!this.riderBenefitAmountObject[plan.id.toString()]) {
            this.riderBenefitAmountObject[plan.id.toString()] = {};
        }
        // Added this call to set benefit amount selection for base plan
        if (!this.isJuvenileProduct && benefitAmount && benefitAmount.length) {
            benefitAmount = this.checkPlanBenefitAmount(plan, benefitAmount);
        }
        const data = this.getQuoteLevelSettings();
        this.quoteLevelData = data;
        this.dataLoaded = false;
        this.getPlanPricing(plan, data, benefitAmount, riderSelect);
    }
    /**
     * @description This method is used to check whether benefit amount selection is made or not
     * @param plan {plan} The plan for which benefit amount is taken into consideration
     * @param benefitAmount {BenefitCoverageSelectionModel[]} The benefit amount object
     * @returns {BenefitCoverageSelectionModel[]} the selected benefit amount
     */
    checkPlanBenefitAmount(plan: Plan, benefitAmount?: BenefitCoverageSelectionModel[]): BenefitCoverageSelectionModel[] {
        // this condition avoids storing the duplicate benefit amount of the base plan into benefitAmount array
        if (benefitAmount?.some((amount) => amount.planId !== plan.id.toString())) {
            const key = plan.id.toString();
            const selectedBenefitAmount: number[] =
                this.isSTDProduct || this.isLifePlan
                    ? this.multipleBenefitAmount.value
                    : [parseInt(this.benefitAmountObject.planBenAmtRadio[key], 10)];
            let plans = this.getPlansOfCurrentProduct();
            plans = plans.filter((currentPlan) => currentPlan.id === +key);
            let isSingleCoverage = false;
            if (
                plans[0].coverageLevels &&
                plans[0].coverageLevels.length === 1 &&
                plans[0].coverageLevels[0].id === INDIVIDUAL_COVERAGE_ID
            ) {
                isSingleCoverage = true;
            }
            if (selectedBenefitAmount.length) {
                let coverageLevelIds = [];
                if (isSingleCoverage) {
                    coverageLevelIds = [INDIVIDUAL_COVERAGE_ID];
                } else if (plans[0].planPriceSelection) {
                    coverageLevelIds = plans[0].planPriceSelection;
                }
                if (this.isSTDProduct || this.isLifePlan) {
                    benefitAmount.unshift({
                        planId: key,
                        benefitAmounts: selectedBenefitAmount,
                        coverageLevelIds: coverageLevelIds,
                    });
                } else {
                    benefitAmount.push({
                        planId: key,
                        benefitAmounts: selectedBenefitAmount,
                        coverageLevelIds: coverageLevelIds,
                    });
                }
            }
        }
        return benefitAmount;
    }

    /**
     * Get quote-level settings from store.
     * @returns QuoteSettingsSchema object that holds settings for quote request
     */
    getQuoteLevelSettings(): QuoteSettingsSchema {
        const data = {};
        const levelSettingValues = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings);
        const quoteLevelSettings = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        this.payFrequency = quoteLevelSettings.payFrequency;
        const residenceStateIndex = levelSettingValues.states.findIndex((states) => states.name === quoteLevelSettings.state);
        const riskClassIndex = levelSettingValues.riskClasses.findIndex((jobClass) => jobClass.name === quoteLevelSettings.riskClass);
        const frequencyIndex = levelSettingValues.payFrequency.findIndex((freq) => freq.name === quoteLevelSettings.payFrequency);
        const moreSettingsEnumValues = Object.values(MoreSettingsEnum) as string[];
        Object.entries(quoteLevelSettings).forEach(([settingKey, settingValue]) => {
            if (settingValue && moreSettingsEnumValues.includes(settingKey)) {
                data[settingKey] = settingValue;
            }
        });
        data[MoreSettingsEnum.RESIDENCESTATE] = levelSettingValues.states[residenceStateIndex].abbreviation;
        data[MoreSettingsEnum.PARTNERACCOUNTTYPE] = quoteLevelSettings.channel;
        data[MoreSettingsEnum.RISKCLASSID] = levelSettingValues.riskClasses[riskClassIndex].id.toString();
        data[MoreSettingsEnum.PAYROLLFREQUENCYID] = levelSettingValues.payFrequency[frequencyIndex].id.toString();
        if (quoteLevelSettings.salarySelection) {
            data[MoreSettingsEnum.ANNUALSALARY] = quoteLevelSettings.annualSalary
                ? quoteLevelSettings.annualSalary
                : quoteLevelSettings.hourlyAnnually;
        }
        if (this.isJuvenileProduct) {
            data["childAge"] = this.multipleSelectionsConfig ? this.multipleSelectedDependentAges.value[0] : this.dependentAge.value;
        }
        return data;
    }

    // funtion to know whether rider has any missing info
    getRiderMissingInfoStatus(planInfo: any): boolean {
        let returnValue = false;
        if (planInfo && this.planInfo && this.planInfo.riders && this.planInfo.riders.length) {
            this.planInfo.riders.forEach((eachRider) => {
                if (planInfo.tag === eachRider.plan.name) {
                    returnValue = true;
                }
            });
        }
        return returnValue;
    }

    // funtion to set string for riders which has missing info
    getRiderMissingInfo(rowInfo: any): string {
        let returnValue = "";
        if (rowInfo && this.planInfo && this.planInfo.riders && this.planInfo.riders.length) {
            this.planInfo.riders.forEach((eachRider) => {
                if (
                    rowInfo.tag === eachRider.plan.name &&
                    eachRider.coverageLevelPricing &&
                    eachRider.coverageLevelPricing.length &&
                    eachRider.coverageLevelPricing[0].missingInfo &&
                    eachRider.coverageLevelPricing[0].missingInfo.length
                ) {
                    returnValue = this.getMissingInfoPlanTooltip(eachRider.coverageLevelPricing[0].missingInfo, true);
                }
            });
        }
        return returnValue;
    }

    /**
     * Refreshes multiple benefit amount selection when we switch between plans
     * @param plan selected plan
     */
    refreshMultipleBenefitAmountSelection(plan: Plan): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        if (this.plansWithMultipleSelectedBenefitAmounts.get(key)?.length) {
            this.multipleBenefitAmount.setValue(this.plansWithMultipleSelectedBenefitAmounts.get(key));
        }
    }

    /**
     *
     * @description fetches pricing detail for the current expanded plan
     * @param plan current plan details of the opened accordion
     * @param data information from quote level settings
     * @param benefitAmount optional field to store all benefit amounts returned
     * @param riderSelect selected rider details
     * @memberof QuickQuotePlansComponent
     */
    getPlanPricing(
        plan: Plan,
        data: QuoteSettingsSchema,
        benefitAmount?: BenefitCoverageSelectionModel[],
        riderSelect?: DropDownPortalComponent,
    ): void {
        this.planInfo = this.utilService.copy(this.getCurrentPlanPricing(plan.product.id, plan.id));
        this.multipleBenefitAmount.valueChanges.subscribe((selectedAmounts) => {
            // array of boolean to disable remaining unchecked benefit amounts when any four are checked
            this.planInfo = this.utilService.copy(this.getCurrentPlanPricing(plan.product.id, plan.id));
            this.disableBenefitAmount =
                selectedAmounts?.length === MAX_BENEFIT_AMOUNTS_ALLOWED &&
                this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing).map(
                    (benefitAmounts) => !selectedAmounts.includes(benefitAmounts),
                );
        });
        // this condition stops multiple calls of pricing api in case of juvenile whenever plan is expanded
        if (this.planInfo && (this.isJuvenileProduct ? !this.isDependentAgeApplied : !benefitAmount)) {
            this.pricingTableArray = [...this.planInfo.coverageLevelPricing];
            this.setDefaultBenefitAmount(plan, benefitAmount);
            this.setEliminationPeriodData(plan, riderSelect);
        } else {
            this.iconValMsg[
                plan.id
                // eslint-disable-next-line max-len
            ] = `${this.languageStrings["primary.portal.quickQuote.missingInfo"]} ${this.languageStrings["primary.portal.quickQuote.pricing"]}`;
            this.store
                .dispatch(new SetPlanPricing(plan.id, data, plan.product.id, benefitAmount))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.isDependentAgeApplied = false;
                        this.planInfo = this.utilService.copy(this.getCurrentPlanPricing(plan.product.id, plan.id));
                        // checks if benefitAmount has basePlan benefit amount and riderBenefitAmountObject has rider benefit amount
                        if (
                            benefitAmount?.length === 1 &&
                            benefitAmount[0].planId === plan.id.toString() &&
                            this.objectKeys(this.riderBenefitAmountObject[plan.id.toString()]).length
                        ) {
                            this.fromPlanPricing = true;
                            this.setRiderData(plan);
                            benefitAmount = [...benefitAmount, ...this.setBenefitAmountArray(plan)];
                            // benefitAmount length greater than 1 indicates rider was selected from dropdown
                            if (benefitAmount.length > 1) {
                                this.isSpinnerLoading = true;
                                // getPlanPricing is called again to get price of the selected rider benefit amount
                                this.getPlanPricing(plan, data, benefitAmount);
                            } else {
                                this.setBenefitAmounts(plan, benefitAmount, riderSelect);
                            }
                        } else {
                            this.setBenefitAmounts(plan, benefitAmount, riderSelect);
                        }
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                        if (error.status === AppSettings.API_RESP_400 && error.error.details && error.error.details.length) {
                            error.error.details.forEach((detail) => {
                                this.errorMessage.push(detail.message);
                            });
                            this.planPricingObject[plan.id] = this.errorMessage;
                            this.iconValMsg[plan.id] =
                                this.languageStrings["primary.portal.quickQuote.missingInfo"] + " " + this.errorMessage[0];
                            this.error[plan.id] = true;
                        } else if (error.status !== AppSettings.API_RESP_400) {
                            this.errorMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code),
                            );
                        } else if (
                            error.status === AppSettings.API_RESP_400 &&
                            error.error.message &&
                            (!error.error.details || !error.error.details.length)
                        ) {
                            this.iconValMsg[plan.id] =
                                this.languageStrings["primary.portal.quickQuote.missingInfo"] + " " + error.error.message;
                        }
                        this.pricingTableArray = [];
                        this.setDefaultBenefitAmount(plan, benefitAmount);
                        this.setEliminationPeriodData(plan, riderSelect);
                    },
                );
        }
    }
    /**
     * @description checks if benefitAmount has basePlan benefit amount and riderBenefitAmountObject has rider benefit amount
     *  and valid rider benefit amount for specified basePlan benefit amount is added to benefitAmount array
     * @param plan {plan} The plan for which benefit amount is taken into consideration
     * @returns {BenefitCoverageSelectionModel[]} the selected benefit amount array
     */
    setBenefitAmountArray(plan: Plan): BenefitCoverageSelectionModel[] {
        const updateBenefitAmount: BenefitCoverageSelectionModel[] = [];
        this.objectKeys(this.riderBenefitAmountObject[plan.id.toString()]).forEach((riderPlanId) => {
            this.planInfo.riders.forEach((rider) => {
                // checks whether rider was selected from rider dropdown
                if (
                    rider.plan.id.toString() === riderPlanId &&
                    this.riderBenefitAmountObject[plan.id.toString()][riderPlanId] &&
                    this.riderCheckStatus[plan.id.toString()][rider.plan.id.toString()]
                ) {
                    // benefitAmounts contains list of all valid rider benefit amount
                    // for specified base plan benefit amount
                    const riderCoverageLevelPricing = rider.coverageLevelPricing;
                    const selectedBenefitAmounts: number[] = [];
                    rider.benefitAmountInfos.forEach((riderBenefitAmountInfo, benefitIndex) => {
                        const benefitAmounts = this.uniqueBenefitAmt(riderBenefitAmountInfo, riderCoverageLevelPricing);
                        let amountIndex = benefitAmounts.findIndex(
                            (amount) =>
                                amount ===
                                (this.isLifePlan
                                    ? this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount[benefitIndex]
                                    : this.riderBenefitAmountObject[plan.id.toString()][riderPlanId]),
                        );
                        amountIndex = amountIndex === -1 ? 0 : amountIndex;
                        this.setRiderBenefitAmount(benefitAmounts[amountIndex], rider.plan.id, plan.id);
                        // valid rider benefit amount for specified basePlan benefit amount is added to benefitAmount array
                        selectedBenefitAmounts.push(benefitAmounts[amountIndex]);
                    });
                    // valid rider benefit amount for specified basePlan benefit amount is added to benefitAmount array
                    updateBenefitAmount.push({
                        planId: riderPlanId.toString(),
                        benefitAmounts: selectedBenefitAmounts,
                    });
                }
            });
        });
        return updateBenefitAmount;
    }
    /**
     * Sets benefit amounts initially and when different benefit amount is selected for basePlan/rider
     * @param plan
     * @param benefitAmount
     * @param riderSelect selected rider details
     */
    setBenefitAmounts(plan: Plan, benefitAmount: BenefitCoverageSelectionModel[], riderSelect?: DropDownPortalComponent): void {
        this.pricingTableArray = [...this.planInfo.coverageLevelPricing];
        this.iconValMsg[plan.id] = this.setSpouseInfoMissingError() || this.iconValMsg[plan.id];
        this.setDefaultBenefitAmount(plan, benefitAmount);
        this.setEliminationPeriodData(plan, riderSelect);
    }
    /**
     * set error message for tooltip when spouse age is missing
     * @returns error message when spouse info is missing
     */
    setSpouseInfoMissingError(): string {
        const setting = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
        if (
            !setting.spouseAge &&
            this.coverageLevelsData &&
            this.planInfo.coverageLevelPricing &&
            !this.planInfo.coverageLevelPricing.some((pricing) => pricing.missingInfo?.length > 0) &&
            this.planInfo.coverageLevelPricing.length !== this.coverageLevelsData.length
        ) {
            return this.getMissingInfoPlanTooltip([MissingInfoType.SPOUSE_AGE], true);
        }
        return "";
    }
    // function which returns pricing by taking planId and productid as inputs
    getCurrentPlanPricing(productId: number, planId: number): any {
        const plans = this.getPlansOfCurrentProduct();
        const planIndex = this.getPlanIndexById(planId);
        return plans[planIndex]?.pricing;
    }

    // function which returns coverageLevels by taking planId and productid as inputs
    getCurrentPlanCoverageLevel(productId: number, planId: number): any {
        const plans = this.getPlansOfCurrentProduct();
        const planIndex = this.getPlanIndexById(planId);
        return plans[planIndex].coverageLevels;
    }

    /**
     * gets total cost
     * @param planId indicates plan id for which total cost is calculated
     */
    getTotalCost(planId: string): void {
        const totalCost: { [coverageLevelId: number]: number } = {};
        if (this.dataSource[planId] && this.dataSource[planId][0]) {
            this.dataSource[planId].forEach((planCost) => {
                Object.keys(planCost)
                    .filter((coverageLevel) => coverageLevel !== TAG)
                    .forEach((coverageLevel, i) => {
                        const planCostCoverageLevel = Number(this.currencyPipeObject.transform(planCost[coverageLevel], "", "", "1.2-2"));
                        totalCost[coverageLevel] = (totalCost[coverageLevel] ? totalCost[coverageLevel] : 0) + planCostCoverageLevel;
                    });
            });
        }
        this.totalCost[planId] = totalCost;
    }

    /**
     * gets total cost for multiple coverage levels
     * @param planId indicates plan id for which total cost is calculated
     */
    getTotalCostMultipleCovLevel(planId: string): void {
        if (this.dataSource[planId]) {
            this.totalCostMultiSelectCov[planId] = {};
            // TODO: change logic while selecting multiple benefit amounts
            let tableDataId: number;
            if (this.isLifePlan) {
                let totalCost: { [coverageLevelId: number]: number } = {};
                if (this.dataSource[planId]) {
                    this.dataSource[planId].forEach((planCost, i) => {
                        tableDataId = i;
                        if (planCost && planCost.length > 0) {
                            planCost.forEach((data) => {
                                if (data.riderTableData && this.isLifePlan) {
                                    data.riderTableData.forEach((riderData) => {
                                        totalCost = this.addCurrentRowToTotal(totalCost, riderData);
                                    });
                                } else {
                                    totalCost = this.addCurrentRowToTotal(totalCost, data);
                                }
                            });
                        }
                    });
                }
                this.totalCostMultiSelectCov[planId][tableDataId] = { ...totalCost };
            } else {
                this.multipleElimination.value.forEach((covPrice) => {
                    const totalCost: { [coverageLevelId: number]: number } = {};
                    if (this.dataSource[planId][covPrice].length) {
                        this.dataSource[planId][covPrice].forEach((planCost) => {
                            Object.keys(planCost)
                                .filter(
                                    (coverageLevel) =>
                                        coverageLevel !== TAG && coverageLevel !== TABLE_HEADER_NAME && coverageLevel !== TABLE_ID,
                                )
                                .forEach((coverageLevel) => {
                                    totalCost[coverageLevel] =
                                        (totalCost[coverageLevel] ? totalCost[coverageLevel] : 0) + +planCost[coverageLevel];
                                });
                        });
                    }
                    this.totalCostMultiSelectCov[planId][+covPrice] = { ...totalCost };
                });
            }
        }
    }

    /**
     * add current row cost to Total cost
     * @param totalCost existing totalCost data
     * @param rowData current row data
     * @returns total cost after adding current row data
     */
    addCurrentRowToTotal(totalCost: TotalCost, rowData: Map<string, string>): TotalCost {
        Object.keys(rowData)
            .filter((coverageLevel) => coverageLevel !== TAG && coverageLevel !== TABLE_HEADER_NAME && coverageLevel !== TABLE_ID)
            .forEach((coverageLevel) => {
                totalCost[coverageLevel] =
                    (totalCost[coverageLevel] ? Number(this.currencyPipeObject.transform(+totalCost[coverageLevel], "", "", "1.2-2")) : 0) +
                    Number(this.currencyPipeObject.transform(+rowData[coverageLevel], "", "", "1.2-2"));
            });
        return totalCost;
    }

    /**
     * Gets total cost for multiple benefit amounts that are selected for each dependent age
     * @param planId indicates plan id for which total costs are calculated
     */
    getTotalCostForDependentAges(planId: string): void {
        if (this.dataSource[planId]) {
            this.totalCostMultiSelectCov[planId] = {};
            this.multipleSelectedDependentAges.value.forEach((dependantAge) => {
                const totalCost: { [coverageLevelId: number]: number } = {};
                if (this.dataSource[planId][dependantAge].length) {
                    this.dataSource[planId][dependantAge].forEach((planCosts) => {
                        Object.keys(planCosts)
                            .filter((planCost) => planCost !== TAG && planCost !== TABLE_HEADER_NAME && planCost !== TABLE_ID)
                            .forEach((planCost) => {
                                const planCostsPlanCost = Number(this.currencyPipeObject.transform(planCosts[planCost], "", "", "1.2-2"));
                                totalCost[planCost] = (totalCost[planCost] || 0) + planCostsPlanCost;
                            });
                    });
                }
                this.totalCostMultiSelectCov[planId][dependantAge] = { ...totalCost };
            });
        }
    }

    /**
     * Sets the selected option
     * @param optionSelected option selected
     * @param riderId rider Id
     */
    onChangeRiderRadioButton(optionSelected: OptionSelected, riderId: number): void {
        this.ridersObjectOfPlan[riderId].temporaryOptionSelected = optionSelected;
    }

    /**
     * set rider data.
     * @param plan Plan details
     * @returns void
     */
    setRiderData(plan: Plan): void {
        const riders = [];
        if (this.planInfo && this.planInfo.riders && this.planInfo.riders.length) {
            this.planInfo.riders.filter((rider) => {
                riders.push(rider.plan);
                if (this.isLifePlan && this.multipleBenefitAmount?.value?.length > 1 && rider.benefitAmountInfos.length === 1) {
                    rider.benefitAmountInfos = this.multipleBenefitAmount.value.map(() => rider.benefitAmountInfos[0]);
                }
                this.ridersPricingObject[rider.plan.id] = {};
                this.ridersPricingObject[rider.plan.id] = rider;
                const selectedPlanBenefit = this.riderBenefitAmountObject[plan.id];
                if (
                    this.ridersPricingObject[rider.plan.id].benefitAmountInfos[0]?.matchBasePlan ||
                    this.ridersPricingObject[rider.plan.id].benefitAmountInfos[0]?.readOnly
                ) {
                    if (!this.ridersBenefitAmtRadio[plan.id]) {
                        this.ridersBenefitAmtRadio[plan.id] = {};
                    }
                    this.ridersBenefitAmtRadio[plan.id][rider.plan.id.toString()] =
                        this.ridersPricingObject[rider.plan.id].benefitAmountInfos[0].defaultBenefitAmount;
                    this.setRiderBenefitAmount(
                        this.ridersBenefitAmtRadio[plan.id][rider.plan.id.toString()],
                        +rider.plan.id.toString(),
                        +plan.id.toString(),
                    );
                } else if (selectedPlanBenefit) {
                    if (selectedPlanBenefit[rider.plan.id]) {
                        // updating the rider benefit amount to the latest benefit amount that is selected and clicked on apply
                        this.tempRiderBenefitAmountObject.set(rider.plan.id, selectedPlanBenefit[rider.plan.id]);
                    } else {
                        this.setRiderBenefitAmount(
                            this.uniqueBenefitAmt(
                                this.ridersPricingObject[rider.plan.id]?.benefitAmountInfos[0],
                                this.ridersPricingObject[rider.plan.id]?.coverageLevelPricing,
                            )[0],
                            rider.plan.id,
                            plan.id,
                        );
                    }
                }
                if (this.isLifePlan) {
                    if (rider.coverageLevelPricing[0]?.errorInfo?.length) {
                        this.disableRider[rider.plan.id] = true;
                    } else {
                        this.disableRider[rider.plan.id] = false;
                    }
                    if (!this.ridersObjectOfPlan[rider.plan.id]) {
                        this.ridersObjectOfPlan[rider.plan.id] = {
                            selectedBenefitAmount: rider.benefitAmountInfos.map(
                                (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount,
                            ),
                            temporarySelectedBenefitAmount: rider.benefitAmountInfos.map(
                                (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount,
                            ),
                            showRadio: false,
                            showMultiplePrice: false,
                            combinedBenefitAmount: 0,
                            optionSelected: OptionSelected.COMBINED,
                            temporaryOptionSelected: OptionSelected.COMBINED,
                        };
                    }

                    if (
                        this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount?.length !==
                            this.multipleBenefitAmount.value?.length ||
                        (this.selectedBenefitAmounts.get(plan.id.toString()) &&
                            this.selectedBenefitAmounts.get(plan.id.toString()) !== this.multipleBenefitAmount.value)
                    ) {
                        if (this.isRiderResetRequired) {
                            this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount = rider.benefitAmountInfos.map(
                                (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount,
                            );
                            this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount = rider.benefitAmountInfos.map(
                                (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount,
                            );
                            this.ridersObjectOfPlan[rider.plan.id].showRadio = false;
                            this.ridersObjectOfPlan[rider.plan.id].optionSelected = OptionSelected.COMBINED;
                            this.ridersObjectOfPlan[rider.plan.id].temporaryOptionSelected = OptionSelected.COMBINED;
                        } else {
                            // preserve the rider benefit amount selection on change of plan benefit amounts
                            const sameAsBaseBenefitAmount = rider.benefitAmountInfos.every(
                                (amount, index) =>
                                    amount.maxBenefitAmount === this.planInfo.coverageLevelPricing[index]?.benefitAmount &&
                                    amount.minBenefitAmount === this.planInfo.coverageLevelPricing[index]?.benefitAmount,
                            );
                            this.selectedBenefitAmounts.get(plan.id.toString())?.map((amount, index) => {
                                if (!this.multipleBenefitAmount.value.includes(amount)) {
                                    let i = index;
                                    if (
                                        this.selectedBenefitAmounts.get(plan.id.toString()).length ===
                                        this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.length
                                    ) {
                                        this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.splice(i, 1);
                                        this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount.splice(i, 1);
                                    } else {
                                        i =
                                            index -
                                            (this.selectedBenefitAmounts.get(plan.id.toString()).length -
                                                this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.length);
                                        this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.splice(i, 1);
                                        this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount.splice(i, 1);
                                    }
                                }
                            });
                            this.multipleBenefitAmount.value.forEach((amount, index) => {
                                if (!this.selectedBenefitAmounts.get(plan.id.toString()).includes(amount)) {
                                    if (!sameAsBaseBenefitAmount) {
                                        this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.splice(
                                            index,
                                            0,
                                            rider.benefitAmountInfos[index]?.defaultBenefitAmount,
                                        );
                                        this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount.splice(
                                            index,
                                            0,
                                            rider.benefitAmountInfos[index]?.defaultBenefitAmount,
                                        );
                                    } else {
                                        this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.splice(
                                            index,
                                            0,
                                            this.planInfo.coverageLevelPricing[index].benefitAmount,
                                        );
                                        this.ridersObjectOfPlan[rider.plan.id].temporarySelectedBenefitAmount.splice(
                                            index,
                                            0,
                                            this.planInfo.coverageLevelPricing[index].benefitAmount,
                                        );
                                    }
                                }
                            });
                            if (this.multipleBenefitAmount.value.length === 1) {
                                this.ridersObjectOfPlan[rider.plan.id].showRadio = false;
                            }
                        }
                    }
                    if (this.multipleBenefitAmount?.value?.length > 1) {
                        this.ridersObjectOfPlan[rider.plan.id].showRadio = rider.benefitAmountInfos.some(
                            (benefitAmountData) => this.uniqueBenefitAmt(benefitAmountData, rider.coverageLevelPricing).length > 1,
                        );
                        this.ridersObjectOfPlan[rider.plan.id].showMultiplePrice = rider.benefitAmountInfos.some(
                            (benefitAmountData, i) =>
                                benefitAmountData.defaultBenefitAmount &&
                                benefitAmountData.defaultBenefitAmount !== this.multipleBenefitAmount.value[i],
                        );
                        const similarBenefitAmounts = this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount.every(
                            (amount) => amount === this.ridersObjectOfPlan[rider.plan.id].selectedBenefitAmount[0],
                        );
                        if (!similarBenefitAmounts) {
                            this.ridersObjectOfPlan[rider.plan.id].optionSelected = OptionSelected.CUSTOM;
                            this.ridersObjectOfPlan[rider.plan.id].temporaryOptionSelected = OptionSelected.CUSTOM;
                        }
                        const defaultBenefitAmount = rider.benefitAmountInfos[0].defaultBenefitAmount;
                        this.ridersObjectOfPlan[rider.plan.id].combinedBenefitAmount = rider.benefitAmountInfos.every(
                            (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount === defaultBenefitAmount,
                        )
                            ? defaultBenefitAmount
                            : 0;
                    }
                }
            });
            this.isRiderResetRequired = false;
            this.selectedBenefitAmounts.set(plan.id.toString(), this.multipleBenefitAmount.value);
        }
        if (!this.riderCheckStatus[plan.id]) {
            this.riderCheckStatus[plan.id] = {};
        }
        if (riders && riders.length) {
            riders.forEach((rider) => {
                this.riderCheckStatus[plan.id][rider.id.toString()] = this.riderCheckStatus[plan.id][rider.id.toString()] ? true : false;
                this.policyFeeRiderIds.forEach((id) => {
                    if (rider.id === Number(id)) {
                        this.riderCheckStatus[plan.id][rider.id.toString()] = true;
                        this.disableRider[rider.id] = true;
                    }
                });
                this.riderLength[plan.id][rider.id] = this.displayDisableRider(rider.id, plan.id);
            });
            if (riders.length === 0) {
                this.hideRider[plan.id] = false;
            } else {
                this.hideRider[plan.id] = true;
            }
            this.riderInfoObject[plan.id] = riders;
        }
        const coverageIds = this.coverageLevelsData.map((i) => i.id);
        const apiArray = [];
        coverageIds.forEach((c) => {
            const apiCall = this.coreService.getCoverageLevelRules(c.toString());
            apiArray.push(apiCall);
        });
        if (this.fromPlanPricing) {
            this.isSpinnerLoading = false;
        } else {
            this.generateElementData(plan);
        }
        this.fromPlanPricing = false;
    }

    /**
     * Checks whether selectionChange needs to be called based on multiple selections are allowed
     * @param plan contains the info of selected plan
     * @param key contains the plan id of the selected plan
     */
    checkForSelectionChange(plan: Plan, key: string) {
        if (!(this.multipleSelectionsConfig && this.isJuvenileProduct) && !this.isSTDProduct && !this.isLifePlan) {
            const elPeriodValue = this.expandPlan ? undefined : +this.eliminationPeriodObject.eliminationPeriodRadio[key][0];
            this.selectionChange({ checked: false }, null, +plan.id, {
                id: elPeriodValue,
            });
        }
    }

    /**
     *
     * @description generates pricing along with table data needed for display of plans
     * @param plan particular plan details of accordion opened
     * @memberof QuickQuotePlansComponent
     */
    generateElementData(plan: Plan): void {
        // uniqueBenefitAmountsOfPlan contains list of benefit amounts of a selected plan
        this.uniqueBenefitAmountsOfPlan = this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing);
        // Manipulate BASE_PRICE_DATA
        this.multipleCovRows = [];
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.checkForSelectionChange(plan, key);
        this.BASE_PRICE_DATA[key] = [];
        let covIds;
        if (this.eliminationPeriodObject.eliminationPeriodRadio[key]) {
            covIds = this.eliminationPeriodObject.eliminationPeriodRadio[key].map(Number);
        } else {
            covIds = this.coverageLevelsData.map((coverage) => coverage.id);
        }
        const row = new Map<string, string>();
        row["tag"] = this.tags.length ? this.tags[0] : null;
        this.stdPricingAvailable = true;
        if (
            this.planInfo &&
            this.planInfo.coverageLevelPricing &&
            this.planInfo.coverageLevelPricing.length &&
            this.planInfo.coverageLevelPricing[0].missingInfo &&
            this.planInfo.coverageLevelPricing[0].missingInfo.length
        ) {
            this.iconValMsg[plan.id] = this.getMissingInfoPlanTooltip(this.planInfo.coverageLevelPricing[0].missingInfo, true);
            this.rateSheetMissingInfoTooltips[plan.id] = this.getMissingInfoPlanTooltip(
                this.planInfo.coverageLevelPricing[0].missingInfo,
                false,
            );
            this.error[plan.id] = true;
        } else if (this.checkStdPriceAvailable()) {
            this.stdPricingAvailable = false;
        }
        if (
            this.planInfo &&
            this.planInfo.coverageLevelPricing &&
            this.planInfo.coverageLevelPricing.length &&
            this.planInfo.coverageLevelPricing[0].errorInfo &&
            this.planInfo.coverageLevelPricing[0].errorInfo.length
        ) {
            let infoValue = "";
            this.planInfo.coverageLevelPricing[0].errorInfo.forEach((info) => {
                if (infoValue === "") {
                    infoValue = this.languageStrings["primary.portal.quickQuote.missingInfo"] + " " + info;
                } else {
                    infoValue = infoValue + "\n" + this.languageStrings["primary.portal.quickQuote.missingInfo"] + " " + info;
                }
            });
            this.iconValMsg[plan.id] = infoValue;
            this.error[plan.id] = true;
        }
        covIds.forEach((coverageId, index) => {
            const covIndex = this.pricingTableArray.findIndex((x) => x.coverageLevel && x.coverageLevel.id === covIds[index]);
            if (covIndex !== -1 && this.pricingTableArray[covIndex].price) {
                if (this.isSTDProduct || this.isLifePlan || (this.multipleSelectionsConfig && this.isJuvenileProduct)) {
                    // coverageLevelObject is assigned with the selected benefit amount headers to be displayed
                    this.coverageLevelObject[key] = {};
                    this.planInfo.coverageLevelPricing.forEach((coveragePricing) => {
                        if (
                            coveragePricing.benefitAmount &&
                            coveragePricing.coverageLevel &&
                            this.multipleBenefitAmount.value.includes(coveragePricing.benefitAmount)
                        ) {
                            this.coverageLevelObject[key][coveragePricing.benefitAmount] = coveragePricing.coverageLevel;
                            this.coverageLevelObject[key][coveragePricing.benefitAmount].name = this.currencyPipeObject.transform(
                                coveragePricing.benefitAmount,
                                "USD",
                                "symbol",
                                "1.0",
                            );
                        }
                    });
                    this.getRowDataForMultipleSelections(coverageId, plan, row);
                } else if (parseInt(this.benefitAmountObject.planBenAmtRadio[key], 10) && this.pricingTableArray[0].benefitAmount) {
                    const i = this.pricingTableArray.findIndex(
                        (x) =>
                            x.benefitAmount === parseInt(this.benefitAmountObject.planBenAmtRadio[key], 10) &&
                            x.coverageLevel &&
                            x.coverageLevel.id === covIds[index],
                    );
                    if (i !== -1 && this.pricingTableArray[i].price) {
                        row[covIds[index]] = this.pricingTableArray[i].price;
                    }
                } else {
                    row[covIds[index]] = this.pricingTableArray[covIndex].price;
                }
            } else {
                row[covIds[index]] = "";
                if (this.isSTDProduct || this.isLifePlan) {
                    this.createInfoTable(row, key, covIds[index], coverageId);
                } else if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
                    this.multipleSelectedDependentAges.value.forEach((dependentAge) => {
                        this.defaultTableForJuvenileProducts(row, key, dependentAge);
                    });
                }
            }
        });
        this.setDataSource(key, row);
        this.populateColumnArray(key, covIds);
        this.displayedColumns[key] = this.columns[key].map((c) => c.columnDef);
        if (this.riderCheckStatus[key] && plan && this.planInfo && this.planInfo.plan) {
            this.onRiderApply(plan.id.toString(), plan, true);
        } else {
            this.isSpinnerLoading = false;
            this.dataLoaded = true;
        }
    }

    /**
     * Checking price is available for std plans or not
     * @returns boolean indicates if price is available or not
     */
    checkStdPriceAvailable(): boolean {
        return (
            this.quickQuotePlans[this.productIndex].productId === ProductId.SHORT_TERM_DISABILITY &&
            !this.planInfo.coverageLevelPricing[0].missingInfo.length &&
            !this.planInfo.coverageLevelPricing[0].errorInfo?.length &&
            !this.planInfo.coverageLevelPricing.some((coverageLevel) => coverageLevel?.price)
        );
    }
    /**
     * Gets row data for multiple selections
     * @param coverageId contains coverage id of a selected plan
     * @param plan contains selected plan info
     * @param row indicates the data to be displayed in a row
     */
    getRowDataForMultipleSelections(coverageId: number, plan: Plan, row: Map<string, string>): void {
        if (this.isSTDProduct || this.isLifePlan) {
            // row contains the prices of selected benefit amounts to be displayed
            this.pricingTableArray.forEach((pricing) => {
                if (pricing.eliminationPeriod) {
                    if (pricing.coverageLevel.id === coverageId) {
                        row[pricing.benefitAmount] = pricing.price;
                    }
                } else if (pricing.benefitAmount && pricing.price) {
                    row[pricing.benefitAmount] = pricing.price;
                }
            });
        }
        if (this.isSTDProduct || this.isLifePlan) {
            if (this.isLifePlan) {
                row[TABLE_ID] = coverageId;
            }
            const eliminationData = this.eliminationPeriodObject.eliminationPeriodList[plan.id]?.find(
                (covLevel) => covLevel.id === coverageId,
            );
            if (eliminationData) {
                row[TABLE_HEADER_NAME] = `${this.language.fetchPrimaryLanguageValue(
                    "primary.portal.shoppingCart.planOfferings.expansion.eliminationPeriod",
                )} ${eliminationData.eliminationPeriod}`;
                row[TABLE_ID] = coverageId;
            }
            this.multipleCovRows[coverageId] = [{ ...row }];
        }
        if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
            this.multipleSelectedDependentAges.value.forEach((dependentAge) => {
                this.pricingTableArray
                    .filter(
                        (pricing) => pricing.childAge === dependentAge && this.multipleBenefitAmount.value.includes(pricing.benefitAmount),
                    )
                    .map((pricing) => (row[pricing.benefitAmount] = pricing.price));
                row[TABLE_HEADER_NAME] =
                    this.languageStrings["primary.portal.quickQuote.dependantAge"] +
                    " " +
                    (dependentAge === 0 ? this.ZERO_DEPENDENT_AGE : dependentAge);
                row[TABLE_ID] = dependentAge;
                this.multipleCovRows[dependentAge] = [{ ...row }];
            });
        }
    }
    /**
     * set data source value depending upon selected product
     * @param key selected plan
     * @param row plan details for tabular view
     * @returns void
     */
    setDataSource(key: string, row: Map<string, string>): void {
        if (this.isSTDProduct || this.isLifePlan) {
            this.setBasePriceData(key);
            this.dataSource[key] = this.multipleCovRows;
            this.getTotalCostMultipleCovLevel(key);
        } else if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
            this.BASE_PRICE_DATA[key] = this.multipleCovRows;
            this.dataSource[key] = this.multipleCovRows;
            this.getTotalCostForDependentAges(key);
        } else {
            this.BASE_PRICE_DATA[key][0] = row;

            let MANIPULATED_DATA = [];
            if (this.dataSource[key]) {
                MANIPULATED_DATA = [...this.dataSource[key]];
            }
            MANIPULATED_DATA = this.BASE_PRICE_DATA[key];
            this.dataSource[key] = [...MANIPULATED_DATA];
            this.getTotalCost(key);
        }
    }

    /**
     * Populates column array
     * @param key contains the product Id
     * @param covIds contains coverage level ids of a plan
     */
    populateColumnArray(key: string, covIds: number[]): void {
        this.columns[key] = [{ columnDef: "tags", header: "", cell: (element: any) => `${element["tag"]}` }];
        if (this.isSTDProduct || this.isLifePlan || (this.multipleSelectionsConfig && this.isJuvenileProduct)) {
            const coverageObj: number[] =
                this.error[key] && !this.plansWithMultipleSelectedBenefitAmounts.get(key)
                    ? [covIds[0]]
                    : this.objectKeys(this.coverageLevelObject[key]);
            coverageObj.forEach((coverageObject) => {
                const colObj = {
                    columnDef: coverageObject.toString(),
                    header: coverageObject.toString(),
                    cell: (element: any) => element[+coverageObject],
                };
                this.columns[key].push(colObj);
            });
            return;
        }
        covIds.forEach((id) => {
            const colObj = {
                columnDef: id.toString(),
                header: id.toString(),
                cell: (element: any) => element[id],
            };
            this.columns[key].push(colObj);
        });
    }

    /**
     * returns array of benefit amounts to be displayed in benefits-amount filter
     * @param benefitAmountInfo benefit amount Info for rider/plan
     * @param coverageLevelPricing coverage level pricing data for rider/plan
     * @returns array of benefitAmounts
     */
    uniqueBenefitAmt(benefitAmountInfo: BenefitAmountInfo, coverageLevelPricing: CoverageLevelPricing[]): number[] {
        let benefitAmounts: number[] = [];
        if (benefitAmountInfo) {
            if (benefitAmountInfo.benefitIncrement) {
                for (
                    let i = benefitAmountInfo.minBenefitAmount;
                    i <= benefitAmountInfo.maxBenefitAmount;
                    i = i + benefitAmountInfo.benefitIncrement
                ) {
                    benefitAmounts.push(i);
                }
            } else {
                const planCoverageLevelPricing = coverageLevelPricing;
                if (planCoverageLevelPricing.length) {
                    planCoverageLevelPricing.forEach((level) => {
                        if (level && level.benefitAmount && benefitAmounts.findIndex((i) => i === level.benefitAmount) === -1) {
                            benefitAmounts.push(level.benefitAmount);
                        }
                    });
                }
            }
            // removing restricted benefit amounts from the benefitAmounts list if they are present in the list
            if (benefitAmountInfo.restrictedBenefitAmounts?.length) {
                benefitAmounts = benefitAmounts.filter(
                    (benefitAmount) => !benefitAmountInfo.restrictedBenefitAmounts.includes(benefitAmount),
                );
            }
        }
        return benefitAmounts;
    }

    // function which executes on selection toggle of checkboxes in plan
    selectionChange(event: any, data: any, planId: number, element: any): void {
        const coverageLevels = this.coverageLevelsData
            .filter((level) => {
                if (level.id === element.id) {
                    return level.id;
                }
                return undefined;
            })
            .map((i) => i.id);
        this.store.dispatch(
            new SavePlansPriceSelection(
                planId,
                this.quickQuotePlans[this.productIndex].productId,
                coverageLevels.pop(),
                event.checked,
                this.utilService.copy(this.riderCheckStatus[planId]),
                this.selectedEliminationPeriodList,
            ),
        );
        // If the feature config is off, rate sheet selections are the same as quote selections.
        // Update rate sheet selections.
        if (!this.bypassRequirementsForRateSheet && element?.id) {
            this.addToRateSheet(planId, event.checked, false);
        }
        this.universalService.planSelectionUpdated$.next(true);
    }

    /**
     * stores the multiple premiums selected
     * @param event indicates mat checkbox event of check/uncheck
     * @param planId contains plan id of the selected plan
     * @param tableId indicates table of the selected premium
     * @param element gives the info of selected premium
     */
    onMultipleSelectionChange(event: MatCheckboxChange, planId: number, tableId: number, element: CoverageLevel): void {
        this.multiplePlanPriceSelection = {};
        this.premiumSelected = event.checked;
        // populating multiplePlanPriceSelection with selected premiums for juvenile plans
        if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
            this.plansWithMultipleSelectedDependentAges.get(planId.toString())?.forEach((dependentAge) => {
                const selectedBenefitAmount = this.getSelectedBenefitAmount(planId, element);
                if (dependentAge === tableId && selectedBenefitAmount) {
                    this.multiplePlanPriceSelection[dependentAge] = selectedBenefitAmount[0];
                }
            });
        }
        // populating multiplePlanPriceSelection with selected premiums for std plans
        if (this.isSTDProduct) {
            this.plansWithMultipleSelectedEliminations[planId.toString()]?.forEach((eliminationPeriodId) => {
                const selectedBenefitAmount = this.getSelectedBenefitAmount(planId, element);
                if (eliminationPeriodId === tableId.toString() && selectedBenefitAmount) {
                    this.multiplePlanPriceSelection[tableId] = selectedBenefitAmount[0];
                }
            });
        }
        // populating multiplePlanPriceSelection with selected premiums for life plans
        if (this.isLifePlan) {
            const selectedBenefitAmount = this.getSelectedBenefitAmount(planId, element);
            if (selectedBenefitAmount) {
                this.multiplePlanPriceSelection[tableId] = selectedBenefitAmount[0];
            }
        }
        this.store.dispatch(
            new SavePlansPriceSelection(
                planId,
                this.quickQuotePlans[this.productIndex].productId,
                null,
                event.checked,
                this.utilService.copy(this.riderCheckStatus[planId]),
                this.selectedEliminationPeriodList,
                this.multiplePlanPriceSelection,
                this.multipleBenefitAmount.value,
            ),
        );
        // If the feature config is off, rate sheet selections are the same as quote selections.
        // Update rate sheet selections.
        if (!this.bypassRequirementsForRateSheet && element?.id) {
            this.addToRateSheet(planId, event.checked, false);
        }
        this.universalService.planSelectionUpdated$.next(true);
    }

    /**
     * function which executes on selection toggle of checkboxes in rider filter
     * @param planId of the selected plan
     * @param riderId of the rider that is either checked or unchecked
     * @param event is the mat checkbox event
     */
    riderCheckedStatus(planId: number, riderId: number, event: any): void {
        // change in rider dropdown is detected when checked/unchecked a rider hence show the reset button on rider dropdown
        this.showRiderReset = true;
        this.objectKeys(this.riderCheckStatus[planId.toString()]).forEach((rider, i) => {
            if (rider === riderId.toString()) {
                this.riderCheckStatus[planId.toString()][riderId.toString()] = event.checked;
                this.dispatchRiderSelection(planId, true);
                this.riderLength[planId][riderId] = this.displayDisableRider(riderId, planId);
            }
        });
    }

    dispatchRiderSelection(planId: number, riderChecked = false): void {
        this.store.dispatch(
            new SavePlansPriceSelection(
                planId,
                this.quickQuotePlans[this.productIndex].productId,
                null,
                this.riderApplyClicked || (!this.premiumSelected && riderChecked) ? null : true,
                this.utilService.copy(this.riderCheckStatus[planId]),
                this.selectedEliminationPeriodList,
                this.multiplePlanPriceSelection,
                null,
                this.riderApplyClicked,
            ),
        );
        this.universalService.planSelectionUpdated$.next(true);
    }
    /**
     * Set the rider object on apply or reset of riders
     * @param planId Plan Id
     * @param plan Plan details
     * @param applyMode check for apply or reset
     * @param riderSelect selected rider details
     * @returns void
     */
    onRiderApply(planId: string, plan: Plan, applyMode?: boolean, riderSelect?: DropDownPortalComponent): void {
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.riderCoverageMapping[planId] = {};
        this.riderTable[key] = {};
        this.isRiderUpdate[key] = false;
        if (this.isSTDProduct || this.isLifePlan) {
            this.setBasePriceData(key);
        }
        if (riderSelect) {
            this.riderApplyClicked = true;
        }
        if (this.BASE_PRICE_DATA[key]) {
            let covIds = [];
            covIds = Object.keys(this.coverageLevelObject[key]).map((id) => +id);
            if (!applyMode) {
                this.objectKeys(this.riderCheckStatus[key]).forEach((riderId, i) => {
                    if (!this.policyFeeRiderIds.includes(riderId.toString())) {
                        this.riderCheckStatus[key][riderId] = false;
                    }
                    if (this.isLifePlan && this.ridersObjectOfPlan[riderId]) {
                        this.ridersObjectOfPlan[riderId].temporaryOptionSelected = this.ridersObjectOfPlan[riderId]?.optionSelected;
                        this.ridersObjectOfPlan[riderId].temporarySelectedBenefitAmount = [
                            ...this.ridersObjectOfPlan[riderId].selectedBenefitAmount,
                        ];
                    }
                });
                // resetting rider benefit amount and coverage level on click of reset in rider dropdown
                this.riderBenefitAmountObject[planId] = {};
                this.riderEliminationPeriod = {};
                this.setEliminationPeriodData(plan, riderSelect);
            }
            const riderCoverageLevels = new Map<number, Array<Map<number, CoverageLevelModel>>>(),
                riderCoverageApiCalls: Observable<CoverageLevel[]>[] = [];
            this.riderTempCheckStatus[key] = this.utilService.copy(this.riderCheckStatus[key]);
            this.objectKeys(this.riderCheckStatus[key]).forEach((riderId) => {});
            const riderBenefitAmount: BenefitCoverageSelectionModel[] = [];
            this.objectKeys(this.riderCheckStatus[key]).forEach((riderPlanId) => {
                if (this.riderCheckStatus[key][riderPlanId]) {
                    if (this.isLifePlan) {
                        if (this.ridersObjectOfPlan[riderPlanId]) {
                            this.ridersObjectOfPlan[riderPlanId].optionSelected =
                                this.ridersObjectOfPlan[riderPlanId]?.temporaryOptionSelected;
                            this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount = [
                                ...this.ridersObjectOfPlan[riderPlanId].temporarySelectedBenefitAmount,
                            ];
                        }

                        if (
                            this.ridersObjectOfPlan[riderPlanId]?.showRadio &&
                            this.ridersObjectOfPlan[riderPlanId]?.optionSelected === OptionSelected.COMBINED
                        ) {
                            this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount = this.multipleBenefitAmount.value.map(
                                () => this.ridersObjectOfPlan[riderPlanId].combinedBenefitAmount,
                            );
                        }
                        this.ridersPricingObject[riderPlanId].benefitAmountInfos.forEach((benefitAmount, i) => {
                            const options = this.uniqueBenefitAmt(
                                benefitAmount,
                                this.ridersPricingObject[riderPlanId].coverageLevelPricing,
                            );
                            if (
                                options.length === 0 &&
                                riderPlanId === this.inEligibleRiderId.toString() &&
                                this.ridersObjectOfPlan[riderPlanId]?.optionSelected !== OptionSelected.COMBINED
                            ) {
                                this.ridersObjectOfPlan[riderPlanId].temporarySelectedBenefitAmount[i] = null;
                                this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount = [
                                    ...this.ridersObjectOfPlan[riderPlanId].temporarySelectedBenefitAmount,
                                ];
                            }
                        });
                    }

                    if (this.riderBenefitAmountObject[key][riderPlanId]) {
                        riderBenefitAmount.push({
                            planId: riderPlanId,
                            benefitAmounts:
                                this.isLifePlan &&
                                this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount.length &&
                                (!this.ridersObjectOfPlan[riderPlanId].showRadio ||
                                    (this.ridersObjectOfPlan[riderPlanId].optionSelected === OptionSelected.COMBINED &&
                                        this.ridersObjectOfPlan[riderPlanId].showRadio) ||
                                    this.ridersObjectOfPlan[riderPlanId].optionSelected === OptionSelected.CUSTOM)
                                    ? this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount
                                    : [this.riderBenefitAmountObject[key][riderPlanId]],
                        });
                        if (this.isLifePlan) {
                            this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount[0] =
                                !this.ridersObjectOfPlan[riderPlanId].showRadio &&
                                this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount.length === 1
                                    ? this.riderBenefitAmountObject[key][riderPlanId]
                                    : this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount[0];
                        }
                    }
                    covIds.forEach((id) => {
                        riderCoverageApiCalls.push(this.coreService.getCoverageLevels(riderPlanId, id));
                    });
                } else {
                    // resetting rider benefit amount to default value when rider is unchecked and clicked on apply in rider dropdown
                    this.setRiderBenefitAmount(
                        this.uniqueBenefitAmt(
                            this.ridersPricingObject[riderPlanId]?.benefitAmountInfos[0],
                            this.ridersPricingObject[riderPlanId]?.coverageLevelPricing,
                        )[0],
                        +riderPlanId,
                        +key,
                    );
                    this.resetLifePlanRiderData(+riderPlanId);
                }
            });
            this.isSpinnerLoading = true;
            if (riderCoverageApiCalls.length) {
                forkJoin(riderCoverageApiCalls)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((data) => {
                        let index = 0;
                        data.forEach((d) => {
                            if (
                                d.findIndex((eachLevel) => eachLevel.name === this.languageStrings["primary.portal.coverage.declined"]) !==
                                -1
                            ) {
                                d.pop();
                            }
                        });
                        this.objectKeys(this.riderCheckStatus[key])
                            .filter((riderId) => this.riderCheckStatus[key][riderId])
                            .forEach((riderPlanId) => {
                                riderCoverageLevels[riderPlanId] = [];
                                covIds.forEach((i) => {
                                    riderCoverageLevels[riderPlanId][i] = [...data[index]];
                                    index++;
                                });
                            });
                        if (riderBenefitAmount.length && riderSelect) {
                            this.arrangePlanTable(plan, riderBenefitAmount, riderSelect);
                        } else {
                            this.getRiderStatus(planId, covIds, riderCoverageLevels, applyMode, riderSelect);
                        }
                    });
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (riderBenefitAmount.length && riderSelect) {
                    this.arrangePlanTable(plan, riderBenefitAmount, riderSelect);
                } else {
                    this.getRiderStatus(planId, covIds, riderCoverageLevels, applyMode, riderSelect);
                }
            }
            this.premiumSelected = false;
        }
    }

    /**
     *Resets radio button option and benefit amounts for Life plans
     * @param riderPlanId rider plan Id
     */
    resetLifePlanRiderData(riderPlanId: number): void {
        if (this.isLifePlan && this.ridersObjectOfPlan[riderPlanId]?.showRadio) {
            this.ridersObjectOfPlan[riderPlanId].optionSelected = OptionSelected.COMBINED;
            this.ridersObjectOfPlan[riderPlanId].temporaryOptionSelected = OptionSelected.COMBINED;
            this.ridersObjectOfPlan[riderPlanId].selectedBenefitAmount = this.ridersPricingObject[riderPlanId]?.benefitAmountInfos.map(
                (benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount,
            );
            this.ridersObjectOfPlan[riderPlanId].temporarySelectedBenefitAmount = this.ridersPricingObject[
                riderPlanId
            ]?.benefitAmountInfos.map((benefitAmountInfo) => benefitAmountInfo.defaultBenefitAmount);
        }
    }
    /**
     * Set the benefit amount object for riders
     * @param event selected benefit amount
     * @param riderPlanId rider ID
     * @param basePlanId plan ID
     * @returns void
     */
    setRiderBenefitAmount(event: number, riderPlanId: number, basePlanId: number): void {
        if (!this.riderBenefitAmountObject[basePlanId.toString()]) {
            this.riderBenefitAmountObject[basePlanId.toString()] = {};
        }
        this.riderBenefitAmountObject[basePlanId.toString()][riderPlanId.toString()] = event;
        this.tempRiderBenefitAmountObject.set(riderPlanId, event);
        this.universalService.updateSelectedRiderBenefitAmount(this.tempRiderBenefitAmountObject);
    }

    /**
     * Set the elimination period object for riders
     * @param eliminationPeriodValue selected elimination period value
     * @param riderPlan selected rider plan
     * @param basePlan selected base plan
     * @returns void
     */
    setRiderEliminationPeriod(eliminationPeriodValue: any, riderPlan: any, basePlan: any): void {
        this.riderEliminationPeriodObject.eliminationPeriodRadio[basePlan.id] = {};
        this.riderEliminationPeriodObject.eliminationPeriodValue[basePlan.id] = {};
        this.riderEliminationPeriodObject.eliminationPeriodRadio[basePlan.id][riderPlan.id] = {};
        this.riderEliminationPeriodObject.eliminationPeriodValue[basePlan.id][riderPlan.id] = {};
        this.riderEliminationPeriodObject.eliminationPeriodRadio[basePlan.id][riderPlan.id] = eliminationPeriodValue;
        const selectedEliminationPeriodValue: string =
            this.riderEliminationPeriodObject.eliminationPeriodRadio[basePlan.id][riderPlan.id].coverageLevel.name;
        this.riderEliminationPeriodObject.eliminationPeriodValue[basePlan.id][riderPlan.id] = selectedEliminationPeriodValue;
        const eliminationPeriod = this.riderEliminationPeriodObject.eliminationPeriodRadio[basePlan.id][riderPlan.id].coverageLevel.id;
        const selectedRider: number = riderPlan.id;
        this.selectedEliminationPeriod.set(selectedRider, eliminationPeriod);
        const eliminationPeriodList = [];
        this.selectedEliminationPeriod.forEach((value, key) => {
            eliminationPeriodList.push({
                riderId: key,
                coverageId: value,
            });
        });
        this.selectedEliminationPeriodList = [...eliminationPeriodList];
    }
    /**
     * fetch details of selected rider
     * @param planId plan ID
     * @param covIds coverage level details
     * @param riderCoverageLevels
     * @param applyMode check if rider apply or reset
     * @param riderSelect selected rider details
     */
    getRiderStatus(
        planId: string,
        covIds: number[],
        riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>,
        applyMode?: boolean,
        riderSelect?: DropDownPortalComponent,
    ): void {
        const plan = this.planInfo.plan;
        const key = plan.itemId ? plan.itemId.toString() : planId.toString();
        const newData =
            this.isSTDProduct || this.isLifePlan || (this.multipleSelectionsConfig && this.isJuvenileProduct)
                ? this.BASE_PRICE_DATA[key]
                : [...this.BASE_PRICE_DATA[key]];
        let riderCount = 0;
        this.showFootnote = false;
        this.showLimitedBenefitAmountFootnote = false;
        this.showRiderNotAvailableFootnote = false;
        this.objectKeys(this.riderCheckStatus[key])
            .filter((riderId) => this.riderCheckStatus[key][riderId])
            .forEach((riderPlanId, i) => {
                const rider = this.riderInfoObject[key].find((riderObj) => riderObj.id === +riderPlanId);
                if (
                    rider &&
                    this.ridersPricingObject[rider.id] &&
                    this.ridersPricingObject[rider.id].coverageLevelPricing &&
                    this.ridersPricingObject[rider.id].coverageLevelPricing.length &&
                    this.riderCheckStatus[key][riderPlanId]
                ) {
                    this.riderTable[key][rider.id] = this.ridersPricingObject[rider.id].coverageLevelPricing.filter(
                        (x, index) => x.price === this.ridersPricingObject[rider.id].coverageLevelPricing[index].price,
                    );
                    const row = new Map<string, string>();
                    const multipleRiderRowData = [];
                    let uniqueRiderBenefitAmounts = [];
                    this.riderCoverageMapping[planId][riderPlanId] = {};
                    const isSameBenefitAmountAsBase = this.multipleBenefitAmount?.value?.every(
                        (benefitAmount, index) => this.ridersObjectOfPlan[rider.id]?.selectedBenefitAmount[index] === benefitAmount,
                    );
                    if (
                        this.isLifePlan &&
                        this.riderBenefitAmountObject[key][riderPlanId] &&
                        isSameBenefitAmountAsBase &&
                        Object.keys(this.riderMaxBenefitAmountLimits)?.indexOf(rider.id.toString()) === -1
                    ) {
                        // Tool tip for  100% base benefit amount
                        row["tag"] = rider.name + "* ";
                        this.showFootnote = true;
                    } else if (Object.keys(this.riderMaxBenefitAmountLimits)?.indexOf(rider.id.toString()) >= 0) {
                        // Tool tip for  100% base benefit amount with max limits
                        row["tag"] = rider.name + "** ";
                        this.maxBenefitAmountForFootnote = this.riderMaxBenefitAmountLimits[rider.id];
                        this.showLimitedBenefitAmountFootnote = true;
                    } else if (
                        this.riderBenefitAmountObject[plan.id.toString()] &&
                        this.riderBenefitAmountObject[plan.id.toString()][riderPlanId] &&
                        !this.ridersObjectOfPlan[rider.id]?.showMultiplePrice
                    ) {
                        row["tag"] =
                            (rider.name.includes("Spouse") ? this.riderEliminationPeriod[rider.id] : rider.name) +
                            " : " +
                            this.currencyPipeObject.transform(+this.riderBenefitAmountObject[key][riderPlanId], "USD", "symbol", "1.0");
                    } else if (this.ridersObjectOfPlan[rider.id]?.showMultiplePrice && this.riderBenefitAmountObject[key][riderPlanId]) {
                        uniqueRiderBenefitAmounts = [
                            ...new Set(
                                this.ridersObjectOfPlan[rider.id]?.selectedBenefitAmount
                                    .filter((riderData) => riderData !== null)
                                    .map((riderData) => riderData),
                            ),
                        ];
                        if (uniqueRiderBenefitAmounts.length > 1) {
                            uniqueRiderBenefitAmounts.forEach((benefitAmount, index) => {
                                if (index === 0) {
                                    row["tag"] =
                                        this.languageStrings["primary.portal.quickQuote.riderBenefitAmount"] +
                                        this.currencyPipeObject.transform(+benefitAmount, "USD", "symbol", "1.0");
                                } else {
                                    row["tag"] = this.currencyPipeObject.transform(+benefitAmount, "USD", "symbol", "1.0");
                                }
                                multipleRiderRowData.push({ ...row });
                            });
                        } else {
                            if (
                                this.isLifePlan &&
                                (this.showInEligibleRiderAmount || this.showPartialInEligibleRiderAmount) &&
                                rider.id === this.inEligibleRiderId
                            ) {
                                this.showRiderNotAvailableFootnote = true;
                                row["tag"] =
                                    (rider.name.includes("Spouse") ? this.riderEliminationPeriod[rider.id] : rider.name) +
                                    " : " +
                                    this.currencyPipeObject.transform(+uniqueRiderBenefitAmounts[0], "USD", "symbol", "1.0") +
                                    "*** ";
                                multipleRiderRowData.push({ ...row });
                            } else {
                                row["tag"] =
                                    (rider.name.includes("Spouse") ? this.riderEliminationPeriod[rider.id] : rider.name) +
                                    " : " +
                                    this.currencyPipeObject.transform(+uniqueRiderBenefitAmounts[0], "USD", "symbol", "1.0");
                                multipleRiderRowData.push({ ...row });
                            }
                        }
                    } else {
                        row["tag"] =
                            this.isSTDProduct &&
                            this.riderEliminationPeriod[rider.id] &&
                            this.ridersPricingObject[rider.id].plan.policySeries === CIRIDER // display series name for Cirider
                                ? this.riderEliminationPeriod[rider.id]
                                : rider.name;
                    }
                    if (multipleRiderRowData?.length) {
                        this.objectKeys(this.coverageLevelObject[key]).forEach((x, index) => {
                            row[covIds[index]] = "";
                        });
                    }
                    if (this.isSTDProduct || this.isLifePlan) {
                        if (this.isLifePlan && multipleRiderRowData?.length) {
                            newData.forEach((covPricing, covIndex) => {
                                const riderTableData = [];
                                multipleRiderRowData.forEach((rowData, rowIndex) => {
                                    const indexes = [];
                                    this.ridersObjectOfPlan[rider.id]?.selectedBenefitAmount.forEach((riderData, index) => {
                                        if (uniqueRiderBenefitAmounts[rowIndex] === riderData) {
                                            indexes.push(index);
                                        }
                                    });

                                    this.getRiderPricingRow(
                                        key,
                                        riderPlanId,
                                        riderCoverageLevels,
                                        rowData,
                                        covPricing,
                                        covIds,
                                        covIndex,
                                        indexes,
                                    );
                                    riderTableData.push({ ...rowData });
                                });
                                if (multipleRiderRowData.length > 1) {
                                    if (
                                        this.isLifePlan &&
                                        (this.showInEligibleRiderAmount || this.showPartialInEligibleRiderAmount) &&
                                        rider.id === this.inEligibleRiderId
                                    ) {
                                        this.showRiderNotAvailableFootnote = true;
                                        row["tag"] = rider.name + "*** ";
                                        row["riderTableData"] = riderTableData;
                                    } else {
                                        row["tag"] = rider.name.includes("Spouse") ? this.riderEliminationPeriod[rider.id] : rider.name;
                                        row["riderTableData"] = riderTableData;
                                    }
                                    newData[covIndex].push({ ...row });
                                } else {
                                    newData[covIndex].push(riderTableData[0]);
                                }
                            });
                        } else {
                            newData.forEach((covPricing, covIndex) => {
                                this.getRiderPricingRow(
                                    key,
                                    riderPlanId,
                                    riderCoverageLevels,
                                    row,
                                    covPricing,
                                    covIds,
                                    covIndex,
                                    null,
                                    isSameBenefitAmountAsBase,
                                );
                                newData[covIndex].push({ ...row });
                            });
                        }

                        // ignore the count of Policy fee rider for life plans
                        if (!(this.policyFeeRiderIds.includes(rider.id.toString()) && this.isLifePlan)) {
                            riderCount++;
                        }
                    } else {
                        this.riderTable[key][rider.id.toString()].forEach((riderPricing) => {
                            this.objectKeys(this.coverageLevelObject[key]).forEach((planCoverageLevelId, index) => {
                                if (
                                    riderCoverageLevels[riderPlanId][planCoverageLevelId] &&
                                    !(
                                        this.riderEliminationPeriodObject.eliminationPeriodRadio[+key] &&
                                        this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][rider.id]
                                    )
                                ) {
                                    riderCoverageLevels[riderPlanId][planCoverageLevelId].forEach((level) => {
                                        if (
                                            newData[0] &&
                                            newData[0][planCoverageLevelId] &&
                                            riderPricing?.coverageLevel &&
                                            level &&
                                            (riderPricing.coverageLevel.id === +planCoverageLevelId ||
                                                riderPricing.coverageLevel.id === +level.id) &&
                                            ((riderPricing.benefitAmount &&
                                                riderPricing.benefitAmount === this.tempRiderBenefitAmountObject.get(+riderPlanId)) ||
                                                !riderPricing.benefitAmount)
                                        ) {
                                            row[covIds[index]] = riderPricing?.price;
                                            this.riderCoverageMapping[planId][riderPlanId][planCoverageLevelId] =
                                                riderPricing.coverageLevel.id;
                                        }
                                    });
                                } else if (
                                    riderCoverageLevels[riderPlanId][planCoverageLevelId] &&
                                    this.riderEliminationPeriodObject.eliminationPeriodRadio[+key] &&
                                    this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][rider.id]
                                ) {
                                    riderCoverageLevels[riderPlanId][planCoverageLevelId]
                                        .filter((covlvl) => covlvl.name === this.riderEliminationPeriod[rider.id])
                                        .forEach((level) => {
                                            if (
                                                newData[0] &&
                                                newData[0][planCoverageLevelId] &&
                                                riderPricing?.coverageLevel &&
                                                level &&
                                                (riderPricing.coverageLevel.id === +planCoverageLevelId ||
                                                    riderPricing.coverageLevel.id === +level.id)
                                            ) {
                                                row[covIds[index]] = riderPricing.price;
                                                this.riderCoverageMapping[planId][riderPlanId][planCoverageLevelId] =
                                                    this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][
                                                        rider.id
                                                    ].coverageLevel.id;
                                            }
                                        });
                                }
                            });
                        });
                        newData.push(row);
                        riderCount++;
                    }
                } else {
                    this.riderCheckStatus[key][riderPlanId] = false;
                }
            });
        this.riderTempCheckStatus[key] = this.utilService.copy(this.riderCheckStatus[key]);
        this.dataSource[key] = [...newData];
        if (this.isSTDProduct || this.isLifePlan) {
            this.getTotalCostMultipleCovLevel(key);
        } else if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
            this.getTotalCostForDependentAges(key);
        } else {
            this.getTotalCost(key);
        }
        this.riderSelectValue[key] = riderCount;
        this.isSpinnerLoading = false;
        this.dataLoaded = true;
        if (riderSelect) {
            riderSelect.hide();
        }
    }

    objectKeys(object: unknown): any[] {
        return Object.keys(object);
    }

    /**
     * Method called when elimination period changes for selected plan
     * @param plan selected plan details
     * @param elPeriodSelect selected elimination period value
     */
    onEliminationPeriodChange(plan: Plan, elPeriodSelect: MatSelect): void {
        if (this.isSTDProduct && !this.multipleElimination.value.length) {
            this.multipleElimination.setErrors({ required: true });
        } else {
            this.expandPlan = false;
            const planId = plan.id.toString();
            const key = plan.itemId ? plan.itemId.toString() : planId;
            this.eliminationPeriodObject.eliminationPeriodValue[key] = [];
            this.multipleElimination.value.forEach((selectedElimination) => {
                const selectedElPeriodValue = this.coverageLevelsData.find((covData) => covData.id.toString() === selectedElimination);
                const eliminationValue = selectedElPeriodValue ? selectedElPeriodValue.eliminationPeriod : "";
                this.eliminationPeriodObject.eliminationPeriodValue[key].push(
                    eliminationValue.substring(0, eliminationValue.length - ELIMINATION_VALUE_LENGTH),
                );
            });
            this.plansWithMultipleSelectedEliminations[key] = this.multipleElimination.value;
            this.selectedCoverageRadio[key] = this.eliminationPeriodObject.eliminationPeriodRadio[key] = this.multipleElimination.value;
            if (this.isSTDProduct) {
                // removes all premium selections on apply
                this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
                this.universalService.planSelectionUpdated$.next(true);
            }
            this.generateElementData(plan);
            this.universalService.updateEliminationPeriod(this.selectedCoverageRadio); // update selected elimination period
            elPeriodSelect.close();
        }
    }

    /**
     * Resets benefit amount to previous state when changes are made in benefit amount dropdown and clicked outside
     * @param plan {plan} that is expanded
     */
    resetBenAmt(plan: Plan): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.benefitAmountObject.planBenAmtRadio[key] = this.benefitAmountObject.benefitAmountValue[key];
        // if default values and selected values are same then reset button is hidden
        if (this.benefitAmountObject.benefitAmountValue[key] === this.planInfo?.benefitAmountInfo?.defaultBenefitAmount?.toString()) {
            this.showBenefitAmountReset = false;
        }
    }

    /**
     * Called when radio button change is detected from the template
     */
    onChangingBenefitAmountRadio(): void {
        // if reset button is not visible then on radio button change it is made visible
        if (!this.showBenefitAmountReset) {
            this.showBenefitAmountReset = !this.showBenefitAmountReset;
        }
    }

    /**
     * Resets multiple benefit amount to least amount
     * @param plan contains selected plan's info
     */
    resetMultipleBenefitAmount(plan: any): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        /**
         * multipleBenefitAmount form-control is reset so that it is not dirty when default and current values are same,
         * and reset button is hidden
         */
        if (
            (this.isSTDProduct &&
                this.plansWithMultipleSelectedBenefitAmounts.get(key).length === 1 &&
                this.planInfo.benefitAmountInfo.defaultBenefitAmount === this.plansWithMultipleSelectedBenefitAmounts.get(key)[0]) ||
            (this.isJuvenileProduct &&
                this.plansWithMultipleSelectedBenefitAmounts.get(key).length ===
                    this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing).length &&
                this.plansWithMultipleSelectedBenefitAmounts
                    .get(key)
                    .every((benefitAmount) =>
                        this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing).includes(
                            benefitAmount,
                        ),
                    ))
        ) {
            this.multipleBenefitAmount.reset();
        }
        this.multipleBenefitAmount.setValue(this.plansWithMultipleSelectedBenefitAmounts.get(key));
    }
    /**
     * Resets multiple benefit amount to least amount
     * @param plan contains selected plan's info
     */
    resetMultipleEliminationPeriod(plan: any): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        /**
         * multipleElimination form-control is reset so that it is not dirty when default and current values are same,
         * and reset button is hidden
         */
        if (
            this.plansWithMultipleSelectedEliminations[key].length === 1 &&
            this.eliminationPeriodObject.eliminationPeriodList[plan.id][0].id.toString() ===
                this.plansWithMultipleSelectedEliminations[key][0]
        ) {
            this.multipleElimination.reset();
        }
        this.multipleElimination.setValue(this.plansWithMultipleSelectedEliminations[key]);
    }
    /**
     * @description on change function for benefit amounts dropdown
     * @param plan {plan} the plan that is expanded
     * @param benefitAmtSelect {MatSelect} the matselect reference
     */
    onBenefitAmountChange(plan: Plan, benefitAmtSelect?: MatSelect): void {
        // re-initializing rider benefit amounts on change of benefit amount from benefit amount dropdown
        this.riderBenefitAmountObject[plan.id.toString()] = {};
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        const benefitAmount = [
            {
                planId: planId,
                benefitAmounts: [+this.benefitAmountObject.planBenAmtRadio[key]],
            },
        ];
        this.isSpinnerLoading = true;
        this.arrangePlanTable(plan, benefitAmount);
        this.benefitAmountObject.benefitAmountValue[key] = this.benefitAmountObject.planBenAmtRadio[key];
        this.universalService.updateBenefitAmount(this.benefitAmountObject);

        if (benefitAmtSelect) {
            benefitAmtSelect.close();
        }
    }

    /**
     * method is called on click of apply and multiple benefit amounts selected are applied to plan
     * @param plan contains selected plan's info
     * @param benefitAmtSelect {MatSelect} the mat select reference
     */
    onMultipleBenefitAmountChange(plan: Plan, benefitAmtSelect?: MatSelect): void {
        this.showInEligibleRiderAmount = false;
        this.disableInsuranceRider[this.inEligibleRiderId] = false;
        this.showPartialInEligibleRiderAmount = false;
        if (this.multipleBenefitAmount.value.every((amount) => amount > this.riderInEligibleAmount)) {
            this.showInEligibleRiderAmount = true;
            this.disableInsuranceRider[this.inEligibleRiderId] = true;
            this.riderCheckStatus[plan.id][this.inEligibleRiderId] = false;
        } else if (this.multipleBenefitAmount.value.some((amount) => amount > this.riderInEligibleAmount)) {
            this.showPartialInEligibleRiderAmount = true;
        }
        if (!this.multipleBenefitAmount.value.length) {
            this.multipleBenefitAmount.setErrors({ required: true });
        } else {
            const planId = plan.id.toString();
            const key = plan.itemId ? plan.itemId.toString() : planId;
            if (!this.selectedBenefitAmounts.get(plan.id.toString())) {
                this.selectedBenefitAmounts.set(key, this.multipleBenefitAmount.value);
            }
            const benefitAmount = [
                {
                    planId: planId,
                    benefitAmounts: this.multipleBenefitAmount.value,
                },
            ];
            this.plansWithMultipleSelectedBenefitAmounts.set(key, this.multipleBenefitAmount.value);
            // removes all premium selections on apply
            this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
            this.universalService.planSelectionUpdated$.next(true);
            this.isSpinnerLoading = true;
            this.arrangePlanTable(plan, benefitAmount);
            if (benefitAmtSelect) {
                benefitAmtSelect.close();
            }
        }
    }

    /**
     * Sets default benefit amount
     * @param plan {Plan} contains selected plan's info
     * @param benefitAmount {BenefitCoverageSelectionModel[]} the mat select reference
     */
    setDefaultBenefitAmount(plan: Plan, benefitAmount?: BenefitCoverageSelectionModel[]): void {
        if (this.planInfo && this.planInfo.benefitAmountInfo && this.planInfo.benefitAmountInfo.defaultBenefitAmount && !benefitAmount) {
            // multipleBenefitAmount form control is assigned with default least benefit amount
            if ((this.isSTDProduct || this.isLifePlan) && !this.plansWithMultipleSelectedBenefitAmounts.get(plan.id.toString())) {
                this.multipleBenefitAmount.setValue([this.planInfo.benefitAmountInfo.defaultBenefitAmount]);
                this.plansWithMultipleSelectedBenefitAmounts.set(plan.id.toString(), [
                    this.planInfo.benefitAmountInfo.defaultBenefitAmount,
                ]);
            } else if (
                this.multipleSelectionsConfig &&
                this.isJuvenileProduct &&
                !this.plansWithMultipleSelectedBenefitAmounts.get(plan.id.toString())
            ) {
                const benefitAmounts = this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing);
                this.multipleBenefitAmount.setValue(benefitAmounts);
                this.plansWithMultipleSelectedBenefitAmounts.set(plan.id.toString(), benefitAmounts);
            } else if (!parseInt(this.benefitAmountObject.planBenAmtRadio[plan.id.toString()], 10)) {
                this.benefitAmountObject.planBenAmtRadio[plan.id.toString()] =
                    this.planInfo.benefitAmountInfo.defaultBenefitAmount.toString();
                this.benefitAmountObject.benefitAmountValue[plan.id.toString()] =
                    this.benefitAmountObject.planBenAmtRadio[plan.id.toString()];
            }
        }
    }

    /**
     * method is called on click of reset and it resets the benefit amount to least benefit amount
     * @param plan contains selected plan's info
     * @param benefitAmtSelect {MatSelect} the mat select reference
     */
    onBenefitAmountReset(plan: any, benefitAmtSelect: MatSelect): void {
        // re-initializing rider benefit amounts on click of reset from benefit amount dropdown
        this.riderBenefitAmountObject[plan.id.toString()] = {};
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        if (this.planInfo && this.planInfo.benefitAmountInfo && this.planInfo.benefitAmountInfo.defaultBenefitAmount) {
            this.benefitAmountObject.planBenAmtRadio[key] = this.planInfo.benefitAmountInfo.defaultBenefitAmount.toString();
            this.benefitAmountObject.benefitAmountValue[key] = this.benefitAmountObject.planBenAmtRadio[key];
        }
        const benefitAmount = [
            {
                planId: planId,
                benefitAmounts: [+this.benefitAmountObject.planBenAmtRadio[key]],
            },
        ];
        this.isSpinnerLoading = true;
        this.arrangePlanTable(plan, benefitAmount);
        this.universalService.updateBenefitAmount(this.benefitAmountObject);
        if (benefitAmtSelect) {
            benefitAmtSelect.close();
        }
    }

    /**
     * method is called on click of reset and it resets the benefit amounts to least benefit amount
     * @param plan contains selected plan's info
     * @param benefitAmtSelect {MatSelect} the mat select reference
     */
    onMultipleBenefitAmountReset(plan: Plan, benefitAmtSelect: MatSelect): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.showInEligibleRiderAmount = false;
        this.disableInsuranceRider[this.inEligibleRiderId] = false;
        this.showPartialInEligibleRiderAmount = false;
        if (this.planInfo && this.planInfo.benefitAmountInfo && this.planInfo.benefitAmountInfo.defaultBenefitAmount) {
            // resetting the benefit amounts dropdown to all the benefit amounts for juvenile plans
            if (this.multipleSelectionsConfig && this.isJuvenileProduct) {
                const benefitAmounts = this.uniqueBenefitAmt(this.planInfo?.benefitAmountInfo, this.planInfo?.coverageLevelPricing);
                this.plansWithMultipleSelectedBenefitAmounts.set(key, benefitAmounts);
                this.multipleBenefitAmount.setValue(benefitAmounts);
            } else {
                this.plansWithMultipleSelectedBenefitAmounts.set(key, [this.planInfo.benefitAmountInfo.defaultBenefitAmount]);
            }
        }
        this.isRiderResetRequired = true;
        // removes all premium selections on reset
        this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
        this.universalService.planSelectionUpdated$.next(true);

        const benefitAmount = [
            {
                planId: planId,
                benefitAmounts: [this.plansWithMultipleSelectedBenefitAmounts.get(key)[0]],
            },
        ];
        this.isSpinnerLoading = true;
        this.arrangePlanTable(plan, benefitAmount);
        if (benefitAmtSelect) {
            benefitAmtSelect.close();
        }
    }

    onEliminationPeriodReset(plan: any, elimPeriodSelect: MatSelect): void {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.eliminationPeriodObject.eliminationPeriodRadio[plan.id] = this.objectKeys(this.coverageLevelObject[plan.id])[0];
        const selectedElimPeriodValue: string =
            this.coverageLevelObject[key][this.eliminationPeriodObject.eliminationPeriodRadio[key]].eliminationPeriod;
        this.eliminationPeriodObject.eliminationPeriodValue[key] = selectedElimPeriodValue.substring(0, selectedElimPeriodValue.length - 4);
        this.multipleElimination.setValue([this.eliminationPeriodObject.eliminationPeriodRadio[plan.id]]);
        this.plansWithMultipleSelectedEliminations[key] = this.multipleElimination.value;
        this.generateElementData(plan);
        elimPeriodSelect.close();
    }

    /**
     * reset multiple elimination period value for STD
     * @param plan selected plan details
     * @param eliminationSelected selected elimination period
     */
    onMultipleEliminationReset(plan: Plan, eliminationSelected: MatSelect): void {
        const key = plan.itemId ? plan.itemId.toString() : plan.id.toString();
        // removes all premium selections on reset
        this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
        this.universalService.planSelectionUpdated$.next(true);
        this.eliminationPeriodObject.eliminationPeriodRadio[plan.id] = [
            this.eliminationPeriodObject.eliminationPeriodList[plan.id][0].id.toString(),
        ];
        const selectedEliminationPeriodVal: string = this.eliminationPeriodObject.eliminationPeriodList[plan.id][0].eliminationPeriod;
        this.eliminationPeriodObject.eliminationPeriodValue[key] = [
            selectedEliminationPeriodVal.substring(0, selectedEliminationPeriodVal.length - ELIMINATION_VALUE_LENGTH),
        ];
        this.multipleElimination.setValue(this.eliminationPeriodObject.eliminationPeriodRadio[plan.id]);
        this.plansWithMultipleSelectedEliminations[key] = this.multipleElimination.value;
        this.generateElementData(plan);
        eliminationSelected.close();
    }

    getPlanCheckedStatus(data: any, planId: number, element: any): boolean {
        let coverageLevels,
            returnValue = false;
        if (this.coverageLevelsData) {
            coverageLevels = this.coverageLevelsData.filter((level) => level.id === element.id).map((i) => i.id);
            const plans = this.getPlansOfCurrentProduct();
            const planIndex = this.getPlanIndexById(planId);
            if (
                plans[planIndex].planPriceSelection &&
                plans[planIndex].planPriceSelection.length &&
                plans[planIndex].planPriceSelection.indexOf(coverageLevels.pop()) !== -1
            ) {
                returnValue = true;
            }
        }
        return returnValue;
    }

    /**
     * checks for the premiums whether they are selected or not
     * @param planId contains plan id of the selected plan
     * @param tableId indicates table of the selected premium
     * @param element gives the info of selected premium
     * @returns true if premium is being checked
     */
    getMultipleSelectionCheckedStatus(planId: number, tableId: number, element: CoverageLevel): boolean {
        if (!this.plansWithMultipleSelectedBenefitAmounts.get(planId.toString())) {
            return false;
        }
        const selectedBenefitAmount = this.getSelectedBenefitAmount(planId, element);
        const plans = this.getPlansOfCurrentProduct();
        const planIndex = this.getPlanIndexById(planId);
        return (
            plans[planIndex].multiplePlanPriceSelections &&
            plans[planIndex].multiplePlanPriceSelections[tableId]?.length &&
            plans[planIndex].multiplePlanPriceSelections[tableId].indexOf(selectedBenefitAmount.pop()) !== -1
        );
    }

    /**
     * Gets selected benefit amount for a particular plan
     * @param planId contains id of selected plan
     * @param element gives the info of selected premium
     * @returns selected benefit amount for a particular plan
     */
    getSelectedBenefitAmount(planId: number, element: CoverageLevel): number[] {
        return this.plansWithMultipleSelectedBenefitAmounts
            .get(planId.toString())
            .filter((benefitAmount) => this.currencyPipeObject.transform(benefitAmount, "USD", "symbol", "1.0") === element.name);
    }

    getPlansOfCurrentProduct(): any[] {
        const productId = this.quickQuotePlans[this.productIndex].productId;
        const products = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        const prodIndex = products.findIndex((prod) => prod.productId === productId);
        return products[prodIndex].plans;
    }

    getPlanIndexById(planId: number): number {
        const plans = this.getPlansOfCurrentProduct();
        return plans.findIndex((plan) => plan.id === planId);
    }

    /**
     * Opens plan details component modal
     * @param plan plan object
     */
    openPlanDetails(plan: Plan): void {
        const allStates = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings).states;
        const adminState = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings).state;
        const stateIndex = allStates.findIndex((state) => state.name === adminState);
        const selectedState: CountryState[] = [];
        let situsState: string;
        if (stateIndex > -1) {
            situsState = allStates[stateIndex].abbreviation;
            selectedState.push({ name: allStates[stateIndex].name, abbreviation: allStates[stateIndex].abbreviation });
        }
        const planDetails = {
            planId: plan.id,
            states: selectedState,
            planName: plan.name,
            channel: this.quoteLevelData[MoreSettingsEnum.PARTNERACCOUNTTYPE],
            productId: plan?.product.id,
            isCarrierOfADV: plan.carrierId === CarrierId.ADV,
            situsState,
        };
        this.planDetailsDialogRef = this.matDialog.open(PlanDetailsComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            data: planDetails,
        });
    }
    /**
     * reset the table values on updating
     */
    resetAll(): void {
        this.riderSelectValue = {};
        this.tempRiderBenefitAmountObject.clear();
        this.selectedEliminationPeriod.clear();
        this.benefitAmountObject = {
            benefitAmountValue: new Map<number, string>(),
            planBenAmtRadio: new Map<number, string>(),
        };
        this.eliminationPeriodObject = {
            eliminationPeriodList: {},
            eliminationPeriodValue: {},
            eliminationPeriodRadio: {},
        };
        this.riderBenefitAmountObject = {
            benefitAmountValue: {},
            planBenAmtRadio: {},
        };
        this.riderEliminationPeriodObject = {
            eliminationPeriodList: {},
            eliminationPeriodValue: {},
            eliminationPeriodRadio: {},
        };
        this.pricingTableArray = [];
        this.riderTable = {};
        this.ridersPricingObject = {};
        this.riderInfoObject = {};
        this.planPricingObject = {};
        this.riderTempCheckStatus = {};
        this.coverageLevelObject = {};
        this.selectedCoverageRadio = {};
        this.tags = ["Base price"];
        this.columns = {};
        this.displayedColumns = {};
        this.riderCheckStatus = {};
        this.dataSource = [];
        this.riderCoverageMapping = {};
        this.riderTable = {};
        this.coverageLevelsData = [];
        this.BASE_PRICE_DATA = {};
        this.coverageLevelObject = {};
        this.hideRider = {};
        this.riderSelectValue = {};
        this.isRiderUpdate = {};
        this.error = {};
        this.errorMessage = [];
        this.iconValMsg = {};
        this.ridersBenefitAmtRadio = {};
        this.riderEliminationPeriod = {};
        this.plansWithMultipleSelectedBenefitAmounts.clear();
        this.selectedDependentAgeRadio.clear();
        this.plansWithMultipleSelectedDependentAges.clear();
        if ((this.isLifePlan || this.isSTDProduct) && this.planInfo?.plan?.id) {
            this.store.dispatch(
                new SavePlansPriceSelection(
                    this.planInfo?.plan?.id,
                    this.quickQuotePlans[this.productIndex].productId,
                    null,
                    false,
                    this.utilService.copy(this.riderCheckStatus[this.planInfo?.plan?.id]),
                    this.selectedEliminationPeriodList,
                    null,
                ),
            );
            this.universalService.planSelectionUpdated$.next(true);
        }
    }

    /**
     * gets the pricing of benefit amounts for a dependent age based on reset or apply action
     * @param type determines whether action is reset or apply
     * @param plan contains the selected plan info
     * @param dependentAgeSelect {MatSelect} the mat select reference
     */
    onDependentAgeClick(type: string, plan: Plan, dependentAgeSelect?: MatSelect): void {
        if (type === this.RESET_ACTION) {
            this.dependentAge.setValue(this.defaultChildAge);
            this.selectedDependentAgeRadio.set(plan.id.toString(), this.defaultChildAge);
        }
        if (type === this.APPLY_ACTION) {
            this.selectedDependentAgeRadio.set(plan.id.toString(), this.dependentAge.value);
        }
        this.isDependentAgeApplied = true;
        this.isSpinnerLoading = true;
        this.arrangePlanTable(this.currentPlan);
        if (dependentAgeSelect) {
            dependentAgeSelect.close();
        }
        this.universalService.updateChildAge({
            planId: this.currentPlan.id,
            childAge: this.selectedDependentAgeRadio.get(plan.id.toString()),
        });
    }

    /**
     * gets the pricing of benefit amounts for multiple dependent ages based on reset or apply action
     * @param type determines whether action is reset or apply
     * @param plan contains the selected plan info
     * @param dependentAgeSelect {MatSelect} the mat select reference
     */
    onMultipleDependentAgeClick(type: string, plan: Plan, dependentAgeSelect?: MatSelect): void {
        if (type === this.RESET_ACTION) {
            this.multipleSelectedDependentAges.setValue([this.defaultChildAge]);
            this.plansWithMultipleSelectedDependentAges.set(plan.id.toString(), [this.defaultChildAge]);
            // removes all premium selections on reset
            this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
            this.universalService.planSelectionUpdated$.next(true);
        }
        if (type === this.APPLY_ACTION) {
            if (this.multipleSelectedDependentAges.value.length) {
                this.plansWithMultipleSelectedDependentAges.set(plan.id.toString(), this.multipleSelectedDependentAges.value);
                // removes all premium selections on apply
                this.store.dispatch(new SavePlansPriceSelection(plan.id, this.quickQuotePlans[this.productIndex].productId, null, false));
                this.universalService.planSelectionUpdated$.next(true);
            } else {
                this.multipleSelectedDependentAges.setErrors({ required: true });
                return;
            }
        }
        const benefitAmount: BenefitCoverageSelectionModel[] = [
            {
                childAges: this.multipleSelectedDependentAges.value,
            },
        ];
        this.isDependentAgeApplied = true;
        this.isSpinnerLoading = true;
        this.arrangePlanTable(this.currentPlan, benefitAmount);
        if (dependentAgeSelect) {
            dependentAgeSelect.close();
        }
    }

    /**
     * resets the dependent ages selections to previous selections that were there before opening  dropdown
     * @param plan contains selected plan's info
     */
    onMultipleDependentAgeReset(plan: Plan) {
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        /**
         * multipleSelectedDependentAges form-control is reset so that it is not dirty when default and current values are same,
         * and reset button is hidden
         */
        if (
            this.plansWithMultipleSelectedDependentAges.get(key).length === 1 &&
            this.plansWithMultipleSelectedDependentAges.get(key)[0] === this.defaultChildAge
        ) {
            this.multipleSelectedDependentAges.reset();
        }
        this.multipleSelectedDependentAges.setValue(this.plansWithMultipleSelectedDependentAges.get(key));
    }

    isJuvenile(): boolean {
        return EnrollmentConstants.productIds.Juvenile.includes(this.quickQuotePlans[this.productIndex].productId);
    }

    /**
     * Adds/removes selected plan to/from the rate sheet.
     *
     * @param planId id of the selected plan
     * @param add true if the plan is to be included in the rate sheet, false if it should be removed
     * @param planSelectionUpdated notify observers about the plan update
     */
    addToRateSheet(planId: number, add: boolean, planSelectionUpdated: boolean): void {
        this.store.dispatch(new SaveRateSheetSelection(planId, this.quickQuotePlans[this.productIndex].productId, add));
        if (planSelectionUpdated) {
            this.universalService.planSelectionUpdated$.next(true);
        }
    }

    /**
     * Gets text to be shown when a plan is selected to be included in quote/rate sheet/both.
     *
     * @param includedInQuote whether plan is to be included in quote
     * @param includedInRateSheet whether plan is to be included in the rate sheet
     * @param removeRequirements whether the config to remove age/gender/salary requirements is enabled
     * @returns text to be displayed
     */
    getPlanSelectionText(includedInQuote: boolean, includedInRateSheet: boolean): string {
        if (includedInQuote) {
            if (includedInRateSheet && this.bypassRequirementsForRateSheet) {
                return this.language.fetchPrimaryLanguageValue("primary.portal.quickQuote.includedInQuoteAndRateSheet");
            }
            return this.language.fetchPrimaryLanguageValue("primary.portal.quickQuote.includedInQuote");
        }
        if (includedInRateSheet) {
            return this.language.fetchPrimaryLanguageValue("primary.portal.quickQuote.includedInRateSheet");
        }
        return "";
    }

    /**
     * Returns content for the tooltip shown if some info is required to generate a quote or rate sheet.
     *
     * @param missingInfo list of sentences to be shown to the user about each missing param
     * @param forQuote true if the missing info is required for quote, false if it is required for rate sheet
     * @returns tooltip content
     */
    getMissingInfoPlanTooltip(missingInfo: string[], forQuote: boolean): string {
        const languagePrefix = "primary.portal.quickQuote.missingInfo";
        const missingInfoLanguageList = missingInfo
            // Age is required for quote but not for rate sheets.
            .filter((info) => forQuote || info !== MissingInfoType.AGE)
            // Convert list of enums to a list of human-readable language strings.
            // Example: MissingInfoType.AGE => 'Applicant age'
            .map((info) => this.language.fetchPrimaryLanguageValue(`${languagePrefix}.${info}`));

        if (this.bypassRequirementsForRateSheet) {
            return (
                // Missing info required <for quote> (go to Settings > More to add):
                this.languageStrings[forQuote ? `${languagePrefix}.forQuote` : `${languagePrefix}.forRateSheet`] +
                // Unordered list of missing info elements.
                missingInfoLanguageList.reduce((list, element) => `${list}<li>${element}</li>`, "")
            );
        }
        // Example:
        // Missing info: Applicant age
        // Missing info: Zip code
        return missingInfoLanguageList.map((element) => `${this.languageStrings[languagePrefix]} ${element}`).join("\n");
    }

    /**
     * method to check STD product has been selected or not
     */
    isSTDSelected(): void {
        this.isSTDProduct = this.quickQuotePlans[this.productIndex].productId === ProductId.SHORT_TERM_DISABILITY;
    }

    /**
     * method to check Term Life/ Whole Life product has been selected or not
     */
    isLifePlanSelected(): void {
        this.isLifePlan =
            this.quickQuotePlans[this.productIndex].productId === ProductId.TERM_LIFE ||
            this.quickQuotePlans[this.productIndex].productId === ProductId.WHOLE_LIFE;
    }

    /**
     * create info table when valid data not provided
     * @param row row data to be displayed
     * @param key plan info with planId
     * @param covIdsIndex coverage index value
     * @param coverageId selected coverageId
     * @returns void
     */
    createInfoTable(row: Map<string, string>, key: string, covIdsIndex: string, coverageId: string): void {
        row.clear();
        const eliminationObject = this.eliminationPeriodObject.eliminationPeriodList[key]?.filter(
            (elimination) => elimination.id === covIdsIndex,
        );
        const eliminationName = eliminationObject?.length ? eliminationObject[0].eliminationPeriod : null;
        row.set(TAG, this.tags.length ? this.tags[0] : null);
        if (this.plansWithMultipleSelectedBenefitAmounts.get(key)) {
            this.coverageLevelObject[key] = {};
            this.plansWithMultipleSelectedBenefitAmounts.get(key).forEach((benefitAmount) => {
                this.coverageLevelObject[key][benefitAmount] = {};
                this.coverageLevelObject[key][benefitAmount].name = this.currencyPipeObject.transform(
                    benefitAmount,
                    "USD",
                    "symbol",
                    "1.0",
                );
                row.set(benefitAmount.toString(), "");
            });
        } else {
            row.set(coverageId, "");
        }
        row.set(TABLE_ID, covIdsIndex);
        if (!this.isLifePlan) {
            row.set(
                TABLE_HEADER_NAME,
                `${this.language.fetchPrimaryLanguageValue(
                    "primary.portal.shoppingCart.planOfferings.expansion.eliminationPeriod",
                )} ${eliminationName}`,
            );
        }
        if (covIdsIndex === coverageId) {
            this.multipleCovRows[coverageId] = [Object.fromEntries(row)];
        }
    }

    /**
     * creates default table content to be displayed on not providing pre-requisite data for a juvenile plan
     * @param row contains row data of a table
     * @param key contains the plan id
     */
    defaultTableForJuvenileProducts(row: Map<string, string>, key: string, dependentAge: number): void {
        row.set(TAG, this.tags.length ? this.tags[0] : null);
        if (this.plansWithMultipleSelectedBenefitAmounts.get(key)) {
            this.coverageLevelObject[key] = {};
            this.plansWithMultipleSelectedBenefitAmounts.get(key).forEach((benefitAmount) => {
                this.coverageLevelObject[key][benefitAmount] = {};
                this.coverageLevelObject[key][benefitAmount].name = this.currencyPipeObject.transform(
                    benefitAmount,
                    "USD",
                    "symbol",
                    "1.0",
                );
                row.set(benefitAmount.toString(), "");
            });
        } else {
            row.set(this.dependentAge.toString(), "");
        }
        row.set(TABLE_ID, dependentAge.toString());
        row.set(
            TABLE_HEADER_NAME,
            this.languageStrings["primary.portal.quickQuote.dependantAge"] +
                " " +
                (dependentAge === 0 ? this.ZERO_DEPENDENT_AGE : dependentAge),
        );
        this.multipleCovRows[dependentAge] = [Object.fromEntries(row)];
    }

    /**
     * get selected elimination names
     * @param selectedAmounts selected elimination values
     */
    getEliminationName(selectedAmounts: string[]): void {
        this.selectedEliminationName = [];
        selectedAmounts?.forEach((data) => {
            const eliminationData = this.coverageLevelsData.find((coverage) => coverage.id === +data);
            if (eliminationData) {
                const eliminationName = eliminationData.eliminationPeriod;
                this.selectedEliminationName.push(eliminationName.substring(0, eliminationName.length - ELIMINATION_VALUE_LENGTH));
            }
        });
    }
    /**
     * set base price for multiple quote
     * @param key selected plan id
     * @returns void
     */
    setBasePriceData(key: string): void {
        this.multipleCovRows.forEach((covRows, covIndex) => {
            this.BASE_PRICE_DATA[key][covIndex] = [];
            this.BASE_PRICE_DATA[key][covIndex].push(covRows[0]);
        });
    }

    /**
     * method to get the rider pricing for selected plan
     * @param key selected plan id
     * @param riderPlanId rider plan id
     * @param riderCoverageLevels rider coverage details
     * @param row data table row
     * @param covPricing selected coverage pricing
     * @param covIds selected eliminations
     * @param covIndex current coverage index value
     * @param rowIndexes row indexes for which pricing to be determined
     */
    getRiderPricingRow(
        key: string,
        riderPlanId: string,
        riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>,
        row: Map<string, string>,
        covPricing: Map<string, string>[],
        covIds: number[],
        covIndex: number,
        rowIndexes?: number[],
        isSameBenefitAmountAsBase?: boolean,
    ): void {
        const riderSelectedCoverageLevels = this.riderTable[key][riderPlanId].filter(
            (riderData) =>
                !this.riderEliminationPeriod[riderPlanId] || riderData.coverageLevel?.name === this.riderEliminationPeriod[riderPlanId],
        );

        riderSelectedCoverageLevels.forEach((riderPricing) => {
            this.objectKeys(this.coverageLevelObject[key]).forEach((planCoverageLevelId, index) => {
                if (
                    riderCoverageLevels[riderPlanId][planCoverageLevelId] &&
                    !(
                        this.riderEliminationPeriodObject.eliminationPeriodRadio[+key] &&
                        this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][+riderPlanId] &&
                        riderPricing.eliminationPeriod
                    )
                ) {
                    riderCoverageLevels[riderPlanId][planCoverageLevelId].forEach((level) => {
                        if (
                            covPricing[0] &&
                            covPricing[0][planCoverageLevelId] &&
                            riderPricing?.coverageLevel &&
                            level &&
                            ((riderPricing.benefitAmount &&
                                (this.isLifePlan || riderPricing.benefitAmount === this.tempRiderBenefitAmountObject.get(+riderPlanId)) &&
                                (covIndex === riderPricing.coverageLevel.id ||
                                    (riderPricing.coverageLevel.id === +level.id && this.isLifePlan))) ||
                                (!riderPricing.benefitAmount &&
                                    (riderPricing.coverageLevel.id === +planCoverageLevelId ||
                                        riderPricing.coverageLevel.id === +level.id)))
                        ) {
                            if (this.riderTable[key][riderPlanId]?.length > 1 && this.isLifePlan && rowIndexes?.length) {
                                if (rowIndexes?.indexOf(index) >= 0 || isSameBenefitAmountAsBase) {
                                    row[covIds[index]] = riderSelectedCoverageLevels[index]?.price;
                                }
                            } else if (this.isSTDProduct) {
                                const selectedElimination = riderSelectedCoverageLevels.filter(
                                    (levels) => levels.coverageLevel.id === covPricing[0]["tableId"],
                                );
                                row[covIds[index]] = selectedElimination.length
                                    ? selectedElimination[0].price
                                    : riderSelectedCoverageLevels[0].price;
                            } else {
                                row[covIds[index]] =
                                    riderSelectedCoverageLevels[this.isLifePlan && riderSelectedCoverageLevels[index] ? index : 0].price;
                            }
                            this.riderCoverageMapping[key][riderPlanId][planCoverageLevelId] = riderPricing.coverageLevel.id;
                        }
                    });
                } else if (
                    riderCoverageLevels[riderPlanId][planCoverageLevelId] &&
                    this.riderEliminationPeriodObject.eliminationPeriodRadio[+key] &&
                    this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][+riderPlanId]
                ) {
                    riderCoverageLevels[riderPlanId][planCoverageLevelId].forEach((level) => {
                        if (
                            covPricing[0] &&
                            covPricing[0][planCoverageLevelId] &&
                            riderPricing?.coverageLevel &&
                            level &&
                            (riderPricing.coverageLevel.id === +planCoverageLevelId || riderPricing.coverageLevel.id === +level.id)
                        ) {
                            row[covIds[index]] = +this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][+riderPlanId].price;
                            this.riderCoverageMapping[key][riderPlanId][planCoverageLevelId] =
                                this.riderEliminationPeriodObject.eliminationPeriodRadio[+key][+riderPlanId].coverageLevel.id;
                        }
                    });
                }
            });
        });
    }

    /**
     * check rider pricing length/current state for std to display/disable dropdown value
     * @param riderId selected rider id
     * @param planId selected plan id
     * @return boolean as per rider pricing length
     */
    displayDisableRider(riderId: number, planId: number): boolean {
        const SINGLE_BENEFIT_AMOUNT = 1;
        this.disableCDR[riderId] =
            this.isSTDProduct &&
            this.plansWithMultipleSelectedBenefitAmounts.get(planId.toString())?.length > SINGLE_BENEFIT_AMOUNT &&
            (this.quoteLevelData.state === RESIDENT_STATE.PUERTO_RICO || this.quoteLevelData.state === RESIDENT_STATE.RHODE_ISLAND) &&
            this.skipMultipleSelectionRiderIds.indexOf(riderId.toString()) > -1;
        if (this.disableCDR[riderId]) {
            this.riderCheckStatus[planId.toString()][riderId.toString()] = false;
        }
        return this.isSTDProduct
            ? this.ridersPricingObject[riderId]?.coverageLevelPricing?.length > RIDER_COVERAGE_LENGTH &&
                  this.riderCheckStatus[planId][riderId]
            : true;
    }

    // ng life cycle hook
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
