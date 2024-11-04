import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { UniversalQuoteState, QuoteSettingsSchema, Plan, CoverageLevelModel, UtilService, StaticUtilService } from "@empowered/ngxs-store";
import { UniversalService } from "../universal.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { EditPlanDetailsComponent } from "../edit-plan-details/edit-plan-details.component";
import { UserService } from "@empowered/user";
import { takeUntil, tap, filter } from "rxjs/operators";
import { Subject, forkJoin, Observable } from "rxjs";

import { EmpoweredModalService } from "@empowered/common-services";
import { EnrollmentConstants, AppSettings, CoverageLevel, Product, CoverageLevelNames, ConfigName } from "@empowered/constants";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { CoreService, AflacService, QuoteSettings, PlanSelections, QuoteForm, RiderInfo, ProductDetail } from "@empowered/api";
import { ProductId, RiderSelection } from "@empowered/constants";

const EDIT = "edit";
const EMAIL = "email";
const HOURLY = "hourly";
const BASE_VALUE = 10;
const TAG = "tag";
const TABLE_HEADER_NAME = "tableHeaderName";
const TABLE_ID = "tableId";
const DAYS = "Days";
enum BenefitAmountsCount {
    COUNT_ONE = 1,
    COUNT_TWO = 2,
    COUNT_THREE = 3,
}
const HUNDRED = 100;
export interface TotalCost {
    [coverageLevelId: number]: number;
}

@Component({
    selector: "empowered-create-quote",
    templateUrl: "./create-quote.component.html",
    styleUrls: ["./create-quote.component.scss"],
})
export class CreateQuoteComponent implements OnInit, OnDestroy {
    editDialogRef: MatDialogRef<EditPlanDetailsComponent>;
    displayedColumns = {};
    dataLoaded: boolean;
    dataSource = [];
    BASE_PRICE_DATA = {};
    tags = ["Base price"];
    columns = {};
    coverageLevelObject = {};
    pricingTableArray = [];
    selectedCoverageRadio = {};
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.quickQuote.generate",
        "primary.portal.quickQuote.quoteTitle",
        "primary.portal.quickQuote.editPlan",
        "primary.portal.quickQuote.viewQuote",
        "primary.portal.quickQuote.sendQuote",
        "primary.portal.common.select",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.dateHint",
        "primary.portal.common.optional",
        "primary.portal.quickQuote.broucher",
        "primary.portal.quickQuote.perMonth",
        "primary.portal.quickQuote.rateQuote",
        "primary.portal.quickQuote.on",
        "primary.portal.quickQuote.at",
        "primary.portal.quickQuote.pleaseNote",
        "primary.portal.quickQuote.premiumRates",
        "primary.portal.quickQuote.industryClass",
        "primary.portal.quickQuote.illustration",
        "primary.portal.common.close",
        "primary.portal.quickQuote.video",
        "primary.portal.coverage.declined",
        "primary.portal.createQuote.yourQuickQuote",
        "primary.portal.tpi.shopReview.benefitAmount",
        "primary.portal.shoppingCart.planOfferings.expansion.eliminationPeriod",
        "primary.portal.quote.separator",
        "primary.portal.quickQuote.dependantAge",
        "primary.portal.quickQuote.riderBenefitAmount",
        "primary.portal.quickQuote.footNote.equalTo.baseBenefitAmount",
        "primary.portal.quickQuote.footNote.limited.baseBenefitAmount",
        "primary.portal.quickQuote.multipleSelections.riderNotAvailable.note",
    ]);
    allBrochureData = [];
    showData: boolean;
    brochureConstant = "BROCHURE";
    videoConstant = "VIDEO";
    quickQuotePlans: ProductDetail[];
    selectedPlans: any[];
    quoteForm: FormGroup;
    currentDate: any;
    currentTime: any;
    private unsubscribe$ = new Subject<void>();
    producerName: string;
    riderCheckStatus = {};
    riderCoverageMapping = {};
    riderTable = {};
    ridersPricingObject = {};
    riderInfoObject = {};
    isSpinnerLoading: boolean;
    enteredRider = 0;
    settings: QuoteSettingsSchema;
    benefitAmountObject = {
        benefitAmountValue: {},
        planBenAmtRadio: {},
    };
    eliminationPeriodObject = {
        eliminationPeriodList: {},
        eliminationPeriodValue: {},
        eliminationPeriodRadio: {},
    };
    selectedRiderAmount = new Map<number, number>();
    quoteTitle = this.languageStrings["primary.portal.createQuote.yourQuickQuote"];
    requiredRiderPricingObject = new Map<string, RiderInfo[]>();
    productObservables$: Observable<Product>[] = [];
    totalCost: { [planId: number]: { [coverageLevelId: number]: number } } = {};
    childAge: number;
    isJuvenileProduct = false;
    plansWithMultipleSelections = new Map<string, number[]>();
    multipleCovRows = [];
    readonly ZERO_DEPENDENT_AGE = "14-364 days";
    totalCostMultiSelectCov = new Map<string, number[]>();
    // contains the styling info for Benefit amount header for each table of each plan
    benefitAmountBorderStyles = {};
    benefitAmountToolTips = {};
    showInEligibleRiderAmount = false;
    showPartialInEligibleRiderAmount = false;
    riderInEligibleAmount: number;
    riderInEligibleAmountName: string;
    inEligibleRiderId: number;

    constructor(
        private readonly dialogRef: MatDialogRef<CreateQuoteComponent>,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly planSelection: any,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
        private readonly datePipe: DatePipe,
        private readonly coreService: CoreService,
        private readonly universalService: UniversalService,
        private readonly aflacService: AflacService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly currencyPipeObject: CurrencyPipe,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * Fetch producer details and set form data
     * @returns void
     */
    ngOnInit(): void {
        this.staticUtilService
            .fetchConfigs([ConfigName.DIRECT_WHOLE_LIFE_RIDER_NOT_AVAILABLE])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([riderNotAvailableLimit]) => {
                const riderAvailableLimit = riderNotAvailableLimit.value.split("=");
                this.inEligibleRiderId = +riderAvailableLimit[0];
                this.riderInEligibleAmount = +riderAvailableLimit[1];
                this.riderInEligibleAmountName = this.currencyPipeObject.transform(+riderAvailableLimit[1], "USD", "symbol", "1.0");
            });
        this.getProducerName();
        this.getSelectedRiderAmount();
        this.getCurrentDate();
        this.getQuoteSettingData();
        this.initializeQuoteForm();
        const quickQuotePlanStore = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        this.quickQuotePlans = this.utilService.copy(quickQuotePlanStore);
        this.setQuoteData();
        this.universalService.planOrderUpdated$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.selectedPlans = data;
        });
        this.mapProductIconPath();
        this.setPlanBrochure();
    }
    /**
     * fetch the selected rider benefit amount
     * @returns void
     */
    getSelectedRiderAmount(): void {
        this.universalService.riderSelectedBenefitAmount$
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((data) => data !== undefined),
                tap((data) => {
                    this.selectedRiderAmount = data;
                }),
            )
            .subscribe();
    }
    initializeQuoteForm(): void {
        this.quoteForm = this.fb.group({
            quoteName: [this.quoteTitle],
        });
    }
    updateTitle(): void {
        this.quoteTitle = this.quoteForm.value.quoteName;
    }
    getQuoteSettingData(): void {
        this.settings = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings);
    }
    /**
     * Function to set the quote data from plan selection data
     * @returns void
     */
    setQuoteData(): void {
        this.isSpinnerLoading = true;
        this.selectedPlans = [];
        this.quickQuotePlans.forEach((product) => {
            product.plans.forEach((plan) => {
                this.riderCheckStatus[plan.id] = {};
                this.planSelection.planSelection.forEach((selectedPlan) => {
                    if (selectedPlan.planId === plan.id) {
                        this.productObservables$.push(this.coreService.getProduct(plan.product.id));
                        this.riderCheckStatus[plan.id] = this.utilService.copy(plan.riders);
                        this.pricingTableArray = [];
                        this.coverageLevelObject[plan.id] = {};
                        // plan.planPriceSelection indicates single selection of the premium and
                        // plan.multiplePlanPriceSelections indicates multiple selections of premiums
                        if (plan.planPriceSelection.length) {
                            plan.planPriceSelection.forEach((coverageLevelId) => {
                                const coveragePricing = this.utilService.copy(
                                    plan.pricing.coverageLevelPricing.filter((level) => level.coverageLevel.id === coverageLevelId),
                                );
                                if (coveragePricing.length) {
                                    this.pricingTableArray.push(...coveragePricing);
                                    this.utilService.copy(plan.coverageLevels).forEach((x) => {
                                        this.coverageLevelObject[plan.id][x.id] = x;
                                    });
                                    this.objectKeys(this.coverageLevelObject[plan.id]).forEach((x) => {
                                        if (this.coverageLevelObject[plan.id][x].name === AppSettings.ENROLLED) {
                                            this.coverageLevelObject[plan.id][x].name = AppSettings.DISPLAY_INDIVIDUAL;
                                        }
                                    });
                                    this.setEliminationPeriodData(plan);
                                    this.setDefaultBenefitAmount(plan);
                                }
                            });
                        } else if (Object.keys(plan.multiplePlanPriceSelections)?.length) {
                            Object.keys(plan.multiplePlanPriceSelections).forEach((coverageLevelId) => {
                                const coveragePricing = this.utilService.copy(
                                    plan.pricing.coverageLevelPricing.filter(
                                        (level) =>
                                            (this.isSTDSelected(plan.product.id) || this.isLifeSelected(plan.product.id)
                                                ? level.coverageLevel.id === +coverageLevelId
                                                : level.childAge === +coverageLevelId) &&
                                            plan.multiplePlanPriceSelections[coverageLevelId].includes(level.benefitAmount),
                                    ),
                                );
                                if (coveragePricing.length) {
                                    this.pricingTableArray.push(...coveragePricing);
                                    this.setEliminationPeriodData(plan);
                                }
                            });
                            // plansWithMultipleSelections contains the premiums selected for each plan while generating quick quote
                            this.plansWithMultipleSelections.set(
                                plan.id.toString(),
                                Object.keys(plan.multiplePlanPriceSelections).map((planPriceSelection) => +planPriceSelection),
                            );
                        }
                        this.selectedPlans.push(plan);
                        this.generateElementData(plan);
                    }
                });
            });
        });
    }

    setDefaultBenefitAmount(plan: any, benefitAmount?: any): void {
        const planId: string = plan.id.toString();
        if (plan.pricing && plan.pricing.benefitAmountInfo && plan.pricing.benefitAmountInfo.defaultBenefitAmount && !benefitAmount) {
            this.benefitAmountObject.planBenAmtRadio[planId] = plan.pricing.benefitAmountInfo.defaultBenefitAmount.toString();
            this.benefitAmountObject.benefitAmountValue[planId] = this.benefitAmountObject.planBenAmtRadio[planId];
        }
        this.universalService.setBenefitAmount.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                const planBenAmtRadio: string | Record<string, unknown> = data.planBenAmtRadio[planId];
                const benefitAmountValue: string | Record<string, unknown> = data.benefitAmountValue[planId];
                if (planBenAmtRadio && planBenAmtRadio !== {}) {
                    this.benefitAmountObject.planBenAmtRadio[planId] = planBenAmtRadio;
                    this.benefitAmountObject.benefitAmountValue[planId] = planBenAmtRadio;
                }
                if (benefitAmountValue && benefitAmountValue !== {}) {
                    this.benefitAmountObject.benefitAmountValue[planId] = benefitAmountValue;
                }
            }
        });
    }

    /**
     * set elimination period details
     * @param plan selected plan details
     */
    setEliminationPeriodData(plan: Plan): void {
        if (plan.coverageLevels[0].eliminationPeriod) {
            this.eliminationPeriodObject.eliminationPeriodList[plan.id] = plan.coverageLevels;
            this.eliminationPeriodObject.eliminationPeriodValue[plan.id] = [];
            this.eliminationPeriodObject.eliminationPeriodValue[plan.id].push(
                plan.coverageLevels[0].eliminationPeriod.substring(0, plan.coverageLevels[0].eliminationPeriod.length - 4),
            );
            this.objectKeys(this.coverageLevelObject[plan.id]).forEach((x) => {
                this.coverageLevelObject[plan.id][x].name = AppSettings.DISPLAY_INDIVIDUAL;
            });
        }

        if (this.eliminationPeriodObject.eliminationPeriodList[plan.id]) {
            this.universalService.eliminationPeriodSelected.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
                if (data[plan.id]) {
                    this.eliminationPeriodObject.eliminationPeriodRadio[plan.id] = data[plan.id];
                } else {
                    this.eliminationPeriodObject.eliminationPeriodRadio[plan.id] = this.objectKeys(this.coverageLevelObject[plan.id])[0];
                }
                const eliminationPeriod: CoverageLevel = this.eliminationPeriodObject.eliminationPeriodList[plan.id].find(
                    (covLevel: CoverageLevel) => covLevel.id === +plan.planPriceSelection[0],
                );
                plan.eliminationPeriodName = eliminationPeriod ? eliminationPeriod.eliminationPeriod.replace(DAYS, "") : undefined;
            });
        }
    }
    /**
     * Generates table element data
     * @param plan plan data
     */
    generateElementData(plan: Plan): void {
        // Manipulate BASE_PRICE_DATA
        const planId = plan.id.toString();
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.BASE_PRICE_DATA[key] = [];
        // re initializing multipleCovRows for every unique plan
        this.multipleCovRows = [];

        let covIds;
        if (this.eliminationPeriodObject.eliminationPeriodRadio[key]) {
            covIds =
                Object.keys(plan.multiplePlanPriceSelections)?.length && this.isSTDSelected(plan.product?.id)
                    ? this.eliminationPeriodObject.eliminationPeriodRadio[key].map(Number)
                    : [+this.eliminationPeriodObject.eliminationPeriodRadio[key]];
        } else if (
            Object.keys(plan.multiplePlanPriceSelections)?.length &&
            (this.isJuvenile(plan.product?.id) || this.isSTDSelected(plan.product?.id) || this.isLifeSelected(plan.product?.id))
        ) {
            covIds = plan.coverageLevels.map((coverageLevel) => coverageLevel.id);
        } else {
            covIds = Object.keys(this.coverageLevelObject[key]).map((id) => +id);
        }
        let row = {};
        row["tag"] = this.tags.length ? this.tags[0] : null;
        this.benefitAmountBorderStyles[plan.id] = {};
        covIds.forEach((y, index) => {
            const covIndex = this.pricingTableArray.findIndex((x) => x.coverageLevel.id === covIds[index]);
            if (covIndex !== -1 && this.pricingTableArray[covIndex].price) {
                // setting the table data for multiple selected premiums
                if (Object.keys(plan.multiplePlanPriceSelections)?.length) {
                    if (
                        this.isJuvenile(plan.product?.id) ||
                        this.isSTDSelected(plan.product?.id) ||
                        this.isLifeSelected(plan.product?.id)
                    ) {
                        let benefitAmountsCount: number;
                        this.plansWithMultipleSelections.get(plan.id.toString()).forEach((dependentAge) => {
                            benefitAmountsCount = 0;
                            let coverageType = "";
                            let eliminationName = "";
                            this.coverageLevelObject[plan.id][dependentAge] = {};
                            this.benefitAmountBorderStyles[plan.id][dependentAge] = {};
                            this.pricingTableArray.forEach((pricing) => {
                                if (
                                    pricing.benefitAmount &&
                                    pricing.coverageLevel &&
                                    (this.isSTDSelected(plan.product?.id) || this.isLifeSelected(plan.product?.id)
                                        ? pricing.coverageLevel.id === dependentAge
                                        : pricing.childAge === dependentAge)
                                ) {
                                    benefitAmountsCount = benefitAmountsCount + 1;
                                    this.coverageLevelObject[plan.id][dependentAge][pricing.benefitAmount] = pricing.coverageLevel;
                                    this.coverageLevelObject[plan.id][dependentAge][pricing.benefitAmount].name =
                                        this.currencyPipeObject.transform(pricing.benefitAmount, "USD", "symbol", "1.0");
                                    coverageType = this.isSTDSelected(plan.product?.id)
                                        ? pricing.coverageLevel.iconLocation
                                        : CoverageLevelNames.INDIVIDUAL_COVERAGE;
                                    eliminationName = pricing.coverageLevel.eliminationPeriod;
                                }
                            });
                            // benefitAmountBorderStyles contains styling info for header Benefit amount
                            // based on number of benefit amounts selected
                            this.benefitAmountBorderStyles[plan.id][dependentAge] = `benefit-amount ${this.setBorderStyle(
                                benefitAmountsCount,
                            )}`;
                            row["tag"] = this.tags.length ? this.tags[0] : null;
                            this.pricingTableArray
                                .filter((pricing) =>
                                    this.isSTDSelected(plan.product?.id) || this.isLifeSelected(plan.product?.id)
                                        ? pricing.coverageLevel.id === dependentAge
                                        : pricing.childAge === dependentAge,
                                )
                                .map((pricing) => (row[pricing.benefitAmount] = pricing.price));
                            row[TABLE_HEADER_NAME] = this.isSTDSelected(plan.product?.id)
                                ? `${coverageType} | ${
                                      this.languageStrings["primary.portal.shoppingCart.planOfferings.expansion.eliminationPeriod"]
                                  } ${eliminationName.replace(DAYS, "")}`
                                : this.isLifeSelected(plan.product?.id)
                                ? `${coverageType}`
                                : this.languageStrings["primary.portal.quickQuote.dependantAge"] +
                                  " " +
                                  (dependentAge === 0 ? this.ZERO_DEPENDENT_AGE : dependentAge);
                            row[TABLE_ID] = dependentAge;
                            this.multipleCovRows[dependentAge] = [{ ...row }];
                            row = {};
                        });
                    }
                } else if (parseInt(this.benefitAmountObject.planBenAmtRadio[key], BASE_VALUE) && this.pricingTableArray[0].benefitAmount) {
                    const i = this.pricingTableArray.findIndex(
                        (x) =>
                            x.benefitAmount === parseInt(this.benefitAmountObject.planBenAmtRadio[key], BASE_VALUE) &&
                            x.coverageLevel &&
                            x.coverageLevel.id === covIds[index],
                    );
                    if (i !== -1 && this.pricingTableArray[i].price) {
                        row[covIds[index]] = this.pricingTableArray[i].price;
                    } else {
                        row[covIds[index]] = this.pricingTableArray[covIndex].price;
                    }
                } else {
                    row[covIds[index]] = this.pricingTableArray[covIndex].price;
                }
            } else {
                row[covIds[index]] = "";
            }
        });
        if (
            Object.keys(plan.multiplePlanPriceSelections)?.length &&
            (this.isJuvenile(plan.product?.id) || this.isSTDSelected(plan.product?.id) || this.isLifeSelected(plan.product?.id))
        ) {
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
        // Populate columns array
        if (Object.keys(plan.multiplePlanPriceSelections)?.length) {
            this.columns[key] = {};
            this.plansWithMultipleSelections.get(plan.id.toString()).forEach((dependentAge) => {
                this.columns[key][dependentAge] = [{ columnDef: "tags", header: "", cell: (element: any) => `${element["tag"]}` }];
            });
            this.setColumnsForMultipleSelections(key);
        } else {
            this.columns[key] = [{ columnDef: "tags", header: "", cell: (element: any) => `${element["tag"]}` }];
            covIds.forEach((id) => {
                const colObj = {
                    columnDef: id.toString(),
                    header: id.toString(),
                    cell: (element: any) => element[id],
                };
                this.columns[key].push(colObj);
            });
            this.displayedColumns[key] = this.columns[key].map((c) => c.columnDef);
        }
        this.setRiderData(plan);
    }

    /**
     * Sets border style for Benefit amount header based on number of benefit amounts in sub-header
     * @param benefitAmountsCount contains the number of benefit amounts selected
     * @returns border style to be applied based on number of benefit amounts in sub-header
     */
    setBorderStyle(benefitAmountsCount: number): string {
        if (benefitAmountsCount === BenefitAmountsCount.COUNT_ONE) {
            return "w-fit-content";
        } else if (benefitAmountsCount === BenefitAmountsCount.COUNT_TWO) {
            return "w35";
        } else if (benefitAmountsCount === BenefitAmountsCount.COUNT_THREE) {
            return "w45";
        } else {
            return "w50";
        }
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
                        totalCost[coverageLevel] = (totalCost[coverageLevel] ? totalCost[coverageLevel] : 0) + +planCost[coverageLevel];
                    });
            });
        }
        this.totalCost[planId] = totalCost;
    }

    /**
     * Gets total cost for multiple benefit amounts that are selected for each dependent age
     * @param planId indicates plan id for which total costs are calculated
     */
    getTotalCostForDependentAges(planId: string): void {
        if (this.dataSource[planId]) {
            this.totalCostMultiSelectCov[planId] = {};
            this.plansWithMultipleSelections.get(planId).forEach((dependantAge) => {
                let totalCost: { [coverageLevelId: number]: number } = {};
                if (this.dataSource[planId][dependantAge]?.length) {
                    this.dataSource[planId][dependantAge].forEach((planCosts) => {
                        if (planCosts?.riderTableData) {
                            planCosts.riderTableData.forEach((riderData) => {
                                totalCost = this.addCurrentRowToTotal(totalCost, riderData);
                            });
                        } else {
                            totalCost = this.addCurrentRowToTotal(totalCost, planCosts);
                        }
                    });
                }
                this.totalCostMultiSelectCov[planId][dependantAge] = { ...totalCost };
            });
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
            .filter((planCost) => planCost !== TAG && planCost !== TABLE_HEADER_NAME && planCost !== TABLE_ID)
            .forEach((planCost) => {
                totalCost[planCost] =
                    (Number(this.currencyPipeObject.transform(+totalCost[planCost], "", "", "1.2-2")) || 0) +
                    Number(this.currencyPipeObject.transform(+rowData[planCost], "", "", "1.2-2"));
            });
        return totalCost;
    }

    /**
     * Sets columns data for multiple selections of the premiums
     * @param key indicates the plan id of the selected plan
     */
    setColumnsForMultipleSelections(key: string): void {
        this.displayedColumns[key] = {};
        this.plansWithMultipleSelections.get(key).forEach((dependentAge) => {
            const coverageObj: number[] = this.objectKeys(this.coverageLevelObject[key][dependentAge]);
            coverageObj.forEach((coverageObject) => {
                const colObj = {
                    columnDef: coverageObject.toString(),
                    header: coverageObject.toString(),
                    cell: (element: any) => element[+coverageObject],
                };
                this.columns[key][dependentAge].push(colObj);
            });
            this.displayedColumns[key][dependentAge] = this.columns[key][dependentAge].map((c) => c.columnDef);
        });
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(EditPlanDetailsComponent, {
            maxWidth: "667px",
            data: {
                type: EDIT,
                planSelection: this.selectedPlans,
            },
        });
    }

    closeForm(): void {
        this.dialogRef.close();
    }
    // Function to get the producer name
    getProducerName(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            if ("producerId" in credential) {
                if (credential.name.middleName) {
                    this.producerName = credential.name.firstName + " " + credential.name.middleName + " " + credential.name.lastName;
                } else {
                    this.producerName = credential.name.firstName + " " + credential.name.lastName;
                }
            }
        });
    }
    // Function to get the current time and date
    getCurrentDate(): void {
        this.currentTime = new Date();
        this.currentDate = this.formatDate(this.currentTime);
    }
    // Function to format the date
    formatDate(date: Date): string {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }
    /**
     * set data for riders
     * @param planInfo Plan details
     */
    setRiderData(planInfo: Plan): void {
        const plan = planInfo;
        const planId = planInfo.id;
        const key = plan.itemId ? plan.itemId.toString() : planId;
        this.riderCoverageMapping[planId] = {};
        this.riderTable[key] = {};

        if (this.BASE_PRICE_DATA[key]) {
            const covIds = this.objectKeys(this.coverageLevelObject[key]).map((id) => +id);
            const riderCoverageLevels = new Map<number, Array<Map<number, CoverageLevelModel>>>(),
                riderCoverageApiCalls: Observable<CoverageLevel[]>[] = [];
            this.objectKeys(this.riderCheckStatus[key])
                .filter((riderId) => this.riderCheckStatus[key][riderId])
                .forEach((riderPlanId, i) => {
                    covIds.forEach((id) => {
                        riderCoverageApiCalls.push(this.coreService.getCoverageLevels(riderPlanId, id));
                    });
                });
            this.riderCoverageApiCalls(riderCoverageApiCalls, covIds, riderCoverageLevels, plan);
        }
    }
    /**
     * fetch rider coverage levels
     * @param riderCoverageApiCalls rider coverage level details api calls
     * @param covIds coverage level ID's
     * @param riderCoverageLevels rider coverage level ID's
     * @param plan Plan details
     */
    riderCoverageApiCalls(
        riderCoverageApiCalls: Observable<CoverageLevel[]>[],
        covIds: number[],
        riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>,
        plan: Plan,
    ): void {
        const key = plan.id.toString();
        this.isSpinnerLoading = true;
        if (riderCoverageApiCalls.length) {
            forkJoin(riderCoverageApiCalls)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    let index = 0;
                    data.forEach((d) => {
                        if (
                            d.findIndex((eachLevel) => eachLevel.name === this.languageStrings["primary.portal.coverage.declined"]) !== -1
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
                    this.setRiderInfoObjects(plan, covIds, riderCoverageLevels);
                });
        } else {
            this.setRiderInfoObjects(plan, covIds, riderCoverageLevels);
        }
    }
    /**
     * set rider object
     * @param plan Plan details
     * @param covIds coverage level ID's
     * @param riderCoverageLevels rider coverage level ID's
     * @returns void
     */
    setRiderInfoObjects(plan: Plan, covIds: number[], riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>): void {
        const riders = [];
        plan.pricing.riders.filter((rider) => {
            riders.push(rider.plan);
            this.ridersPricingObject[rider.plan.id] = {};
            this.ridersPricingObject[rider.plan.id] = rider.coverageLevelPricing;
        });
        riders.forEach((rider) => {
            this.riderCheckStatus[plan.id][rider.id.toString()] = this.riderCheckStatus[plan.id][rider.id.toString()] ? true : false;
        });
        this.riderInfoObject[plan.id] = riders;
        this.arrangeRiderData(plan.id.toString(), covIds, riderCoverageLevels, plan);
    }

    isMultiplePrice(index, item): boolean {
        return item.riderTableData;
    }

    /**
     * fetch rider data
     * @param planId Plan ID
     * @param covIds coverage level ID's
     * @param riderCoverageLevels rider coverage level details
     * @param plan Plan details
     * @returns void
     */
    arrangeRiderData(
        planId: string,
        covIds: number[],
        riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>,
        plan: Plan,
    ): void {
        this.showInEligibleRiderAmount = false;
        this.showPartialInEligibleRiderAmount = false;
        if (
            this.isLifeSelected(plan.product.id) &&
            Object.keys(plan?.riders)?.some((riderId) => +riderId === this.inEligibleRiderId && plan.riders[+riderId]) &&
            plan.multiplePlanPriceSelections[covIds[0]]?.every((amount) => amount > this.riderInEligibleAmount)
        ) {
            this.showInEligibleRiderAmount = true;
        } else if (
            this.isLifeSelected(plan.product.id) &&
            Object.keys(plan?.riders)?.some((riderId) => +riderId === this.inEligibleRiderId && plan.riders[+riderId]) &&
            plan.multiplePlanPriceSelections[covIds[0]]?.some((amount) => amount > this.riderInEligibleAmount)
        ) {
            this.showPartialInEligibleRiderAmount = true;
        }
        this.showData = false;
        const key = plan.itemId ? plan.itemId.toString() : planId;
        const newData = Object.keys(plan.multiplePlanPriceSelections)?.length ? this.BASE_PRICE_DATA[key] : [...this.BASE_PRICE_DATA[key]];
        let riderCount = 0;
        this.requiredRiderPricingObject[planId] = {};
        const toolTipData = { fullAmountToolTip: false, maxLimitToolTip: false, maxLimit: 0, showRiderNotAvailableFootnote: false };
        const selectedPlan = this.planSelection.planSelection.find((planInfo) => planInfo.planId.toString() === key);
        this.objectKeys(this.riderCheckStatus[key])
            .filter((riderId) => this.riderCheckStatus[key][riderId])
            // eslint-disable-next-line complexity
            .forEach((riderPlanId, i) => {
                const rider = this.riderInfoObject[key].find((riderObj) => riderObj.id === +riderPlanId);
                if (
                    rider &&
                    this.ridersPricingObject[rider.id] &&
                    this.ridersPricingObject[rider.id].length &&
                    this.riderCheckStatus[key][riderPlanId] &&
                    !this.showInEligibleRiderAmount
                ) {
                    this.riderTable[key][rider.id] = this.ridersPricingObject[rider.id].filter((riderPrice, index) => {
                        const hasElimination = this.planSelection.planSelection.some(
                            (coverageLevel) =>
                                coverageLevel.selectedEliminationPeriod &&
                                coverageLevel.selectedEliminationPeriod.some(
                                    (eliminationPeriod) =>
                                        eliminationPeriod.coverageId === riderPrice.coverageLevel?.id &&
                                        eliminationPeriod.riderId === rider.id,
                                ),
                        );
                        return selectedPlan.selectedEliminationPeriod &&
                            selectedPlan.selectedEliminationPeriod.some((coverageLevel) => coverageLevel.riderId === rider.id)
                            ? hasElimination
                            : riderPrice.price === this.ridersPricingObject[rider.id][index].price;
                    });
                    const row = new Map<string, string>();
                    this.riderCoverageMapping[planId][riderPlanId] = {};
                    this.requiredRiderPricingObject[planId][riderPlanId] = {};
                    const multipleRiderRowData = [];
                    let uniqueRiderBenefitAmounts = [];
                    if (Object.keys(plan.multiplePlanPriceSelections)?.length) {
                        if (this.isSTDSelected(plan.product?.id)) {
                            newData.forEach((covPricing, covIndex) => {
                                row.clear();
                                if (this.ridersPricingObject[rider.id].length && this.ridersPricingObject[rider.id][0].benefitAmount) {
                                    row.set(TAG, `${rider.name} : $${this.ridersPricingObject[rider.id][0].benefitAmount}`);
                                } else {
                                    row.set(TAG, rider.name);
                                }
                                const benefitAmounts = plan.multiplePlanPriceSelections[covIndex];
                                benefitAmounts.forEach((covBenefitAmt, index) => {
                                    row.set(covBenefitAmt.toString(), "");
                                });
                                this.getRiderPricingRow(key, riderPlanId, riderCoverageLevels, row, covPricing, covIndex, false);
                                newData[covIndex].push(Object.fromEntries(row));
                            });
                        } else if (this.isLifeSelected(plan.product?.id)) {
                            row.clear();
                            plan.multiplePlanPriceSelections[covIds[0]].sort((previousValue, nextValue) => previousValue - nextValue);
                            const planSelection = this.planSelection.planSelection.filter((plans) => plans.planId === +key);
                            const selectedCoverageLvl = planSelection[0]?.selectedEliminationPeriod?.filter(
                                (level) => level.riderId === rider.id,
                            );
                            this.riderTable[key][rider?.id]?.filter((coverage) => coverage?.coverageLevel?.id === selectedCoverageLvl);
                            const riderDataForSelectedBenefitAmount = [];
                            plan.benefitAmountOptions.forEach((selection, index) => {
                                if (
                                    plan.multiplePlanPriceSelections[covIds[0]].includes(selection) &&
                                    this.ridersPricingObject[rider.id][index]?.coverageLevel
                                ) {
                                    riderDataForSelectedBenefitAmount.push(
                                        this.riderTable[key][rider.id][index]
                                            ? this.riderTable[key][rider.id][index]
                                            : this.riderTable[key][rider.id][0],
                                    );
                                }
                            });
                            this.riderTable[key][rider.id] = riderDataForSelectedBenefitAmount;
                            let isSameBenefitAmountAsBase = false;
                            newData.forEach((covPricing, covIndex) => {
                                isSameBenefitAmountAsBase = plan.multiplePlanPriceSelections[covIndex]?.every(
                                    (benefitAmount, index) => this.riderTable[key][rider.id][index]?.benefitAmount === benefitAmount,
                                );
                            });
                            const multipleRiderAmountsSelected = [
                                ...new Set(this.riderTable[key][rider.id].map((riderData) => riderData?.benefitAmount)),
                            ];
                            if (
                                isSameBenefitAmountAsBase &&
                                Object.keys(this.planSelection?.riderMaxBenefitAmountLimits)?.indexOf(rider.id.toString()) === -1
                            ) {
                                // Tool tip for  100% base benefit amount
                                row.set(TAG, rider.name + "* ");
                                toolTipData.fullAmountToolTip = true;
                            } else if (Object.keys(this.planSelection?.riderMaxBenefitAmountLimits)?.indexOf(rider.id.toString()) >= 0) {
                                // Tool tip for  100% base benefit amount with max limits
                                row.set(TAG, rider.name + "** ");
                                toolTipData.maxLimitToolTip = true;
                                toolTipData.maxLimit = this.planSelection?.riderMaxBenefitAmountLimits[rider.id];
                            } else if (multipleRiderAmountsSelected?.length === 1 && this.ridersPricingObject[rider.id][0]?.benefitAmount) {
                                if (
                                    rider.id === this.inEligibleRiderId &&
                                    (this.showInEligibleRiderAmount || this.showPartialInEligibleRiderAmount)
                                ) {
                                    toolTipData.showRiderNotAvailableFootnote = true;
                                    row.set(
                                        TAG,
                                        (rider.name.includes("Spouse")
                                            ? this.riderTable[key][rider.id][0].coverageLevel.name
                                            : rider.name) +
                                            " : " +
                                            this.currencyPipeObject.transform(+multipleRiderAmountsSelected[0], "USD", "symbol", "1.0") +
                                            "*** ",
                                    );
                                } else {
                                    row.set(
                                        TAG,
                                        (rider.name.includes("Spouse")
                                            ? this.riderTable[key][rider.id][0].coverageLevel.name
                                            : rider.name) +
                                            " : " +
                                            this.currencyPipeObject.transform(+multipleRiderAmountsSelected[0], "USD", "symbol", "1.0"),
                                    );
                                }
                            } else if (multipleRiderAmountsSelected?.length > 1) {
                                uniqueRiderBenefitAmounts = [
                                    ...new Set(this.riderTable[key][rider.id].map((riderData) => riderData.benefitAmount)),
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
                                        rider.id === this.inEligibleRiderId &&
                                        (this.showInEligibleRiderAmount || this.showPartialInEligibleRiderAmount)
                                    ) {
                                        toolTipData.showRiderNotAvailableFootnote = true;
                                        row["tag"] =
                                            (rider.name.includes("Spouse")
                                                ? this.riderTable[key][rider.id][0].coverageLevel.name
                                                : rider.name) +
                                            " : " +
                                            this.currencyPipeObject.transform(+uniqueRiderBenefitAmounts[0], "USD", "symbol", "1.0") +
                                            "*** ";
                                        multipleRiderRowData.push({ ...row });
                                    } else {
                                        row["tag"] =
                                            (rider.name.includes("Spouse")
                                                ? this.riderTable[key][rider.id][0].coverageLevel.name
                                                : rider.name) +
                                            " : " +
                                            this.currencyPipeObject.transform(+uniqueRiderBenefitAmounts[0], "USD", "symbol", "1.0");
                                        multipleRiderRowData.push({ ...row });
                                    }
                                }
                            } else {
                                row.set(TAG, rider.name);
                            }
                            if (multipleRiderRowData?.length) {
                                plan.multiplePlanPriceSelections[covIds[0]].forEach((data) => {
                                    row[data] = "";
                                });
                                newData.forEach((covPricing, covIndex) => {
                                    const riderTableData = [];
                                    multipleRiderRowData.forEach((rowData, rowIndex) => {
                                        rowData = new Map(Object.entries(rowData));
                                        const indexes = [];
                                        this.riderTable[key][rider.id].forEach((riderData, index) => {
                                            if (uniqueRiderBenefitAmounts[rowIndex] === riderData.benefitAmount) {
                                                indexes.push(index);
                                            }
                                        });
                                        this.getRiderPricingRow(
                                            key,
                                            riderPlanId,
                                            riderCoverageLevels,
                                            rowData,
                                            covPricing,
                                            covIndex,
                                            true,
                                            indexes,
                                        );
                                        riderTableData.push(Object.fromEntries(rowData));
                                    });
                                    if (multipleRiderRowData.length > 1) {
                                        if (
                                            rider.id === this.inEligibleRiderId &&
                                            (this.showInEligibleRiderAmount || this.showPartialInEligibleRiderAmount)
                                        ) {
                                            toolTipData.showRiderNotAvailableFootnote = true;
                                            row["tag"] = rider.name + "*** ";
                                            row["riderTableData"] = riderTableData;
                                        } else {
                                            row["tag"] = rider.name.includes("Spouse")
                                                ? this.riderTable[key][rider.id][0].coverageLevel.name
                                                : rider.name;
                                            row["riderTableData"] = riderTableData;
                                        }
                                        newData[covIndex].push({ ...row });
                                    } else {
                                        newData[covIndex].push(riderTableData[0]);
                                    }
                                });
                            } else {
                                newData.forEach((covPricing, covIndex) => {
                                    this.getRiderPricingRow(key, riderPlanId, riderCoverageLevels, row, covPricing, covIndex, true);
                                    newData[covIndex].push(Object.fromEntries(row));
                                });
                            }
                        }
                        riderCount++;
                    } else {
                        if (this.ridersPricingObject[rider.id].length && this.ridersPricingObject[rider.id][0].benefitAmount) {
                            row[TAG] = `${rider.name} : $${this.ridersPricingObject[rider.id][0].benefitAmount}`;
                        } else {
                            row[TAG] = rider.name;
                        }
                        this.objectKeys(this.coverageLevelObject[key]).forEach((x, index) => {
                            row[covIds[index]] = "";
                        });
                        this.riderTable[key][rider.id.toString()].forEach((riderPricing) => {
                            this.objectKeys(this.coverageLevelObject[key]).forEach((planCoverageLevelId, index) => {
                                riderCoverageLevels[riderPlanId][planCoverageLevelId].forEach((level) => {
                                    if (
                                        newData[0][planCoverageLevelId] &&
                                        riderPricing.coverageLevel &&
                                        (riderPricing.coverageLevel.id === +planCoverageLevelId ||
                                            riderPricing.coverageLevel.id === +level.id) &&
                                        ((riderPricing.benefitAmount &&
                                            riderPricing.benefitAmount === this.selectedRiderAmount.get(+riderPlanId)) ||
                                            !riderPricing.benefitAmount)
                                    ) {
                                        if (riderPricing.eliminationPeriod) {
                                            row[selectedPlan.coverageLevelIds[0]] = +riderPricing.price;
                                        } else {
                                            row[covIds[index]] = +riderPricing.price;
                                        }
                                        this.riderCoverageMapping[planId][riderPlanId][planCoverageLevelId] = riderPricing.coverageLevel.id;
                                        this.requiredRiderPricingObject[planId][riderPlanId] = riderPricing;
                                    }
                                });
                            });
                        });
                        newData.push(row);
                        riderCount++;
                    }
                } else {
                    this.riderCheckStatus[key][riderPlanId] = false;
                }
                this.showInEligibleRiderAmount = false;
            });
        this.benefitAmountToolTips[planId] = toolTipData;
        this.dataSource[key] = [...newData];
        if (
            Object.keys(plan.multiplePlanPriceSelections)?.length &&
            (this.isJuvenile(plan.product?.id) || this.isSTDSelected(plan.product?.id) || this.isLifeSelected(plan.product?.id))
        ) {
            this.getTotalCostForDependentAges(key);
        } else {
            this.getTotalCost(key);
        }
        this.enteredRider++;
        if (this.planSelection.planSelection.length === this.enteredRider) {
            this.isSpinnerLoading = false;
            this.dataLoaded = true;
        }
        this.changeDetectorRef.detectChanges(); // detect mat table data source change
        this.showData = true;
    }

    objectKeys(object: unknown): any[] {
        return Object.keys(object);
    }
    /**
     * function to set plan brochure
     */
    setPlanBrochure(): void {
        const planIds: number[] = [];
        const allStates = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings).states;
        const selectedState = this.store.selectSnapshot(UniversalQuoteState.GetQuoteLevelSettings).state;
        const index = allStates.findIndex((state) => state.name === selectedState);
        this.selectedPlans.forEach((plan) => {
            planIds.push(plan.id);
        });
        this.isSpinnerLoading = true;
        this.coreService
            .getPlanDocuments(planIds, allStates[index].abbreviation)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((results) => {
                if (results) {
                    this.selectedPlans.forEach((plan) => {
                        const brochure = results.filter(
                            (broch) =>
                                broch.type === this.brochureConstant && !broch.name.includes("Rider") && broch.name.includes("Aflac"),
                        );
                        const video = results.filter((broch) => broch.type === this.videoConstant);
                        const planBrochureData = brochure.filter((broucher) => broucher.planId === plan.id);
                        this.allBrochureData.push({
                            planId: plan.id,
                            brochure: planBrochureData,
                            video: video,
                        });
                    });
                }
                this.showData = true;
                this.isSpinnerLoading = false;
            });
    }
    showLink(planId: number, linkType: string): boolean {
        const index = this.allBrochureData.findIndex((broch) => broch.planId === planId);
        let returnValue = false;
        if (index > -1) {
            if (linkType === this.brochureConstant) {
                const hasLength = this.allBrochureData[index].brochure.length ? true : false;
                returnValue = hasLength;
            } else {
                const hasLength = this.allBrochureData[index].video.length ? true : false;
                returnValue = hasLength;
            }
        }
        return returnValue;
    }
    openLink(planId: number, linkType: string): void {
        const index = this.allBrochureData.findIndex((broch) => broch.planId === planId);
        if (index > -1) {
            let link = "";
            if (linkType === this.brochureConstant && this.allBrochureData[index].brochure.length) {
                link = this.allBrochureData[index].brochure[0].location;
            } else if (linkType === this.videoConstant && this.allBrochureData[index].video.length) {
                link = this.allBrochureData[index].video[0].location;
            }
            window.open(link, "_blank");
        }
    }
    /**
     * Create a quote settings object for download and email quote
     * @returns {QuoteSettings}
     * @memberof CreateQuoteComponent
     */
    getQuoteLevelSettings(): QuoteSettings {
        const levelSettingValues = this.store.selectSnapshot(UniversalQuoteState.GetLevelSettings);
        const residenceStateIndex = levelSettingValues.states.findIndex((states) => states.name === this.settings.state);
        const riskClassIndex = levelSettingValues.riskClasses.findIndex((jobClass) => jobClass.name === this.settings.riskClass);
        const frequencyIndex = levelSettingValues.payFrequency.findIndex((freq) => freq.name === this.settings.payFrequency);
        return {
            age: this.settings.age,
            gender: this.settings.gender,
            tobaccoUser: this.settings.tobaccoUser,
            state: levelSettingValues.states[residenceStateIndex].abbreviation,
            riskClassId: levelSettingValues.riskClasses[riskClassIndex].id,
            annualSalary:
                this.settings.salarySelection === HOURLY
                    ? this.settings.hourlyRate * this.settings.hoursPerWeek * this.settings.weeksPerYear
                    : this.settings.annualSalary,
            spouseAge: this.settings.spouseAge,
            spouseGender: this.settings.spouseGender,
            spouseTobaccoUser: this.settings.spouseTobaccoUser,
            numberDependentsExcludingSpouse: this.settings.numberDependentsExcludingSpouse,
            payrollFrequencyId: levelSettingValues.payFrequency[frequencyIndex].id,
            partnerAccountType: this.settings.channel,
            sicCode: this.settings.sicCode,
            zipCode: this.settings.zipCode,
            eligibleSubscribers: this.settings.eligibleSubscribers,
            childAge: this.childAge,
        };
    }
    /**
     * API call for download quick quote
     * @memberof CreateQuoteComponent
     */
    downloadQuickQuote(): void {
        this.isSpinnerLoading = true;
        const quoteForm: QuoteForm = {
            quoteTitle: this.quoteForm.controls.quoteName.value,
            planSelections: this.getPlanSelection(),
            quoteSettings: this.getQuoteLevelSettings(),
            partnerAccountType: this.settings.channel,
        };
        this.aflacService
            .downloadQuickQuote(quoteForm)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.isSpinnerLoading = false;
                    const unSignedBlob = new Blob([resp], { type: "application/pdf" });
                    const unSignedFileURL = window.URL.createObjectURL(unSignedBlob);
                    window.open(unSignedFileURL);
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * Creates plan selection object for download and email quick quote
     * @returns {PlanSelections[]}
     * @memberof CreateQuoteComponent
     */
    getPlanSelection(): PlanSelections[] {
        const planSelections: PlanSelections[] = [];
        const products = this.store.selectSnapshot(UniversalQuoteState.GetQuickQuotePlans);
        products.forEach((eachProduct) => {
            eachProduct.plans.forEach((eachPlan) => {
                if (Object.keys(eachPlan.multiplePlanPriceSelections)?.length && this.isJuvenile(eachPlan.product.id)) {
                    this.planSelection.planSelection.forEach((selectedPlan) => {
                        if (selectedPlan.planId === eachPlan.id) {
                            Object.keys(eachPlan.multiplePlanPriceSelections).forEach((priceSelection) => {
                                const planSelection: PlanSelections = {
                                    planId: eachPlan.id,
                                    displayOrder: this.selectedPlans.findIndex((plan) => plan.id === eachPlan.id) + 1,
                                    riderSelections: this.getRiderInfoObject(eachPlan.id, eachPlan.planPriceSelection, false),
                                    coverageLevelIds: eachPlan.coverageLevels.map((coverageLevel) => coverageLevel.id),
                                    benefitAmounts: eachPlan.multiplePlanPriceSelections[priceSelection],
                                    childAge: +priceSelection,
                                };
                                planSelections.push(planSelection);
                            });
                        }
                    });
                } else if (
                    Object.keys(eachPlan.multiplePlanPriceSelections)?.length &&
                    (this.isSTDSelected(eachPlan.product?.id) || this.isLifeSelected(eachPlan.product?.id))
                ) {
                    this.planSelection.planSelection.forEach((selectedPlan) => {
                        if (selectedPlan.planId === eachPlan.id) {
                            Object.keys(eachPlan.multiplePlanPriceSelections).forEach((priceSelection) => {
                                const planSelection: PlanSelections = {
                                    planId: eachPlan.id,
                                    displayOrder: this.selectedPlans.findIndex((plan) => plan.id === eachPlan.id) + 1,
                                    riderSelections: this.getRiderInfoObject(
                                        eachPlan.id,
                                        [+priceSelection],
                                        this.isLifeSelected(eachPlan.product?.id),
                                    ),
                                    coverageLevelIds: [+priceSelection],
                                    benefitAmounts: eachPlan.multiplePlanPriceSelections[priceSelection],
                                };
                                planSelections.push(planSelection);
                            });
                        }
                    });
                } else {
                    this.planSelection.planSelection.forEach((selectedPlan) => {
                        if (selectedPlan.planId === eachPlan.id) {
                            const benefitAmount = parseFloat(this.benefitAmountObject.benefitAmountValue[eachPlan.id.toString()]);
                            const planSelection: PlanSelections = {
                                planId: eachPlan.id,
                                displayOrder: this.selectedPlans.findIndex((plan) => plan.id === eachPlan.id) + 1,
                                riderSelections: this.getRiderInfoObject(eachPlan.id, eachPlan.planPriceSelection, false),
                                coverageLevelIds: eachPlan.planPriceSelection,
                                benefitAmounts: !isNaN(benefitAmount)
                                    ? [parseFloat(this.benefitAmountObject.benefitAmountValue[eachPlan.id.toString()])]
                                    : null,
                            };
                            planSelections.push(planSelection);
                        }
                    });
                }
            });
        });
        return planSelections;
    }
    /**
     * Creates a rider object
     * @param plan is planId
     * @param planCoverageLevels are current plan coverage level ids
     * @param isLife checks if life plan is selected and config switch is ON
     * @returns Riders
     * @memberof CreateQuoteComponent
     */
    getRiderInfoObject(plan: number, planCoverageLevels: number[], isLife: boolean): RiderSelection[] {
        this.universalService.setChildAge.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.childAge = data.planId.toString() === plan.toString() ? data.childAge : 0;
            }
        });
        let selectedRiders: string[] = [];
        const riders: RiderSelection[] = [];
        selectedRiders = this.objectKeys(this.riderCheckStatus[plan.toString()]).filter(
            (riderId) => this.riderCheckStatus[plan.toString()][riderId],
        );
        selectedRiders.forEach((eachRider) => {
            const coverageLevels: number[] = [];
            planCoverageLevels.forEach((eachCoverageLevel) => {
                if (this.riderCoverageMapping[plan][eachRider][eachCoverageLevel]) {
                    coverageLevels.push(this.riderCoverageMapping[plan][eachRider][eachCoverageLevel]);
                }
            });
            let riderBenefitAmount = null;
            const multipleRiderBenefitAmount = [];
            if (isLife && this.riderTable[plan][eachRider]?.length > 0) {
                this.planSelection?.planSelection?.forEach((planData) => {
                    if (planData.planId === plan) {
                        const covId = Object.keys(planData.coverageLevelIds);
                        covId?.forEach((coverageId) => {
                            planData.coverageLevelIds[+coverageId].forEach((_data, i) => {
                                if (this.riderTable[plan][eachRider][i]) {
                                    multipleRiderBenefitAmount.push(this.riderTable[plan][eachRider][i]?.benefitAmount);
                                } else {
                                    multipleRiderBenefitAmount.push(null);
                                }
                            });
                        });
                    }
                });
            } else {
                riderBenefitAmount =
                    this.requiredRiderPricingObject[plan][eachRider] && this.requiredRiderPricingObject[plan][eachRider].benefitAmount
                        ? [this.requiredRiderPricingObject[plan][eachRider].benefitAmount]
                        : null;
            }
            const rider: RiderSelection = {
                planId: +eachRider,
                coverageLevelIds: coverageLevels ? coverageLevels : null,
                benefitAmounts: isLife ? multipleRiderBenefitAmount : riderBenefitAmount,
                childAge: this.childAge ? this.childAge : null,
            };
            if (coverageLevels.length) {
                riders.push(rider);
            }
        });
        return riders;
    }
    /**
     * Opens EditPlanDetailsComponent pop-up
     * @memberof CreateQuoteComponent
     */
    emailCartQuote(): void {
        if (this.quoteForm.valid) {
            this.editDialogRef = this.empoweredModalService.openDialog(EditPlanDetailsComponent, {
                data: {
                    type: EMAIL,
                    quoteTitle: this.quoteTitle,
                    planSelections: this.getPlanSelection(),
                    quoteSettings: this.getQuoteLevelSettings(),
                    partnerAccountType: this.settings.channel,
                },
            });
        } else {
            this.quoteForm.controls.quoteName.markAsTouched();
        }

        this.editDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((afterClose) => {
                if (afterClose) {
                    this.empoweredModalService.closeDialog();
                    this.dialogRef.close(true);
                }
            });
    }

    /**
     * Function to map the icon path fetched from API to the selected plan
     * @returns void
     */
    mapProductIconPath(): void {
        forkJoin(this.productObservables$)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.selectedPlans = this.selectedPlans.map((plan, index) => ({ ...plan, iconPath: data[index].iconSelectedLocation }));
            });
    }

    /**
     * Determines whether product is juvenile
     * @param productId contains the id of the product selected
     * @returns true if product is juvenile
     */
    isJuvenile(productId: number): boolean {
        return EnrollmentConstants.productIds.Juvenile.includes(productId);
    }
    /**
     * Determines whether product is STD
     * @param productId contains the id of the product selected
     * @returns true if product is STD
     */
    isSTDSelected(productId: number): boolean {
        return productId === ProductId.SHORT_TERM_DISABILITY;
    }
    /**
     * Determines whether product is Life
     * @param productId contains the id of the product selected
     * @returns true if product is Life
     */
    isLifeSelected(productId: number): boolean {
        return productId === ProductId.TERM_LIFE || productId === ProductId.WHOLE_LIFE;
    }
    /**
     * get rider pricing value for STD products
     * @param key selected plan id
     * @param riderPlanId selected rider plan id
     * @param riderCoverageLevels selected rider coverage level
     * @param row current data source row
     * @param covPricing selected coverage pricing
     * @param covIndex coverage id
     * @returns void
     */
    getRiderPricingRow(
        key: string,
        riderPlanId: string,
        riderCoverageLevels: Map<number, Array<Map<number, CoverageLevelModel>>>,
        row: Map<string, string>,
        covPricing: Map<string, string>[],
        covIndex: number,
        isLife: boolean,
        rowIndexes?: number[],
    ): void {
        const coverageKeys = this.objectKeys(this.coverageLevelObject[key][covIndex]);
        this.riderTable[key][riderPlanId].forEach((riderPricing, priceIndex) => {
            this.objectKeys(this.coverageLevelObject[key]).forEach((planCoverageLevelId) => {
                riderCoverageLevels[riderPlanId][planCoverageLevelId].forEach((level) => {
                    if (
                        (covPricing[0] &&
                            riderPricing?.coverageLevel &&
                            ((riderPricing.benefitAmount &&
                                riderPricing.benefitAmount === this.selectedRiderAmount.get(+riderPlanId) &&
                                covIndex === riderPricing.coverageLevel.id) ||
                                (!riderPricing.benefitAmount &&
                                    (riderPricing.coverageLevel.id === +planCoverageLevelId ||
                                        riderPricing.coverageLevel.id === +level.id)))) ||
                        (isLife &&
                            (riderPricing?.coverageLevel?.id === +planCoverageLevelId || riderPricing?.coverageLevel?.id === +level.id))
                    ) {
                        if (rowIndexes?.length) {
                            // For riders  with multiple rows
                            if (rowIndexes.indexOf(priceIndex) >= 0) {
                                row.set(coverageKeys[priceIndex], riderPricing.price);
                            }
                        } else if (this.riderTable[key][riderPlanId].length === coverageKeys.length) {
                            // For riders with single row having multiple prices based on benefit amount
                            row.set(coverageKeys[priceIndex], riderPricing.price);
                        } else if (
                            this.riderTable[key][riderPlanId].length !== coverageKeys.length &&
                            riderPlanId === this.inEligibleRiderId.toString()
                        ) {
                            // For riders with single row having multiple prices based on benefit amount
                            this.objectKeys(this.coverageLevelObject[key][covIndex]).forEach((covObj, index) => {
                                if (index < this.riderTable[key][riderPlanId].length) {
                                    row.set(covObj, riderPricing.price);
                                }
                            });
                            row.set(coverageKeys[priceIndex], riderPricing.price);
                        } else {
                            // For riders with single row having same price for all benefit amounts
                            this.objectKeys(this.coverageLevelObject[key][covIndex]).forEach((covObj) => {
                                row.set(covObj, riderPricing.price);
                            });
                        }
                        this.riderCoverageMapping[key][riderPlanId][covIndex] = riderPricing.coverageLevel.id;
                        this.requiredRiderPricingObject[key][riderPlanId] = riderPricing;
                    }
                });
            });
        });
    }
    /**
     * Unsubscribe the subscriptions to avoid memory leaks
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
