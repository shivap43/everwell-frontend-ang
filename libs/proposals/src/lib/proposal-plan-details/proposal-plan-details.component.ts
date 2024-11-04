import { Component, OnInit, ViewChild, Input, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, AbstractControl, ValidationErrors } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatSelect } from "@angular/material/select";
import { DataFilter, SortStatesPipe, PlanDetailsComponent } from "@empowered/ui";
import { Store } from "@ngxs/store";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { PlansColumns, Eligibility, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { SelectionModel } from "@angular/cdk/collections";
import { EmpStepperService } from "@empowered/emp-stepper";
import { BenefitsOfferingState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { Observable, Subject, combineLatest } from "rxjs";
import { takeUntil, switchMap, tap } from "rxjs/operators";
import { ProposalNoPlansSelectedComponent } from "../proposal-no-plans-selected/proposal-no-plans-selected.component";
import { Router } from "@angular/router";
import {
    CarrierType,
    ArgusConfig,
    CarrierId,
    ConfigName,
    AbstractComponentStep,
    PlanPanelModel,
    AppSettings,
    Characteristics,
    PolicyOwnershipType,
    CountryState,
    PlanStates,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";

const GROUP_PLAN = "g";
const PROSPECT = "prospect";
const VISION_PLAN = "Vision";
const DENTAL_PLAN = "Dental";
const ER_SELECTED = "erSelected";
const BOTH_SELECTED = "bothSelected";
const MIN_AFLAC_PRODUCTS_FOR_VAS = 0;
const RADIX_TEN = 10;

@Component({
    selector: "empowered-proposal-plan-details",
    templateUrl: "./proposal-plan-details.component.html",
    styleUrls: ["./proposal-plan-details.component.scss"],
    providers: [DataFilter],
})
export class ProposalPlanDetailsComponent extends AbstractComponentStep implements OnInit, OnDestroy {
    form: FormGroup;
    allPlans = new MatTableDataSource<any>();
    plans = [];
    plansToCompare = [];
    productList = [];
    plansList = [];
    displayedPlansColumns = [];
    // Variables declared  for checkboxes to implement Select all functionality
    fromPlans = "selected";
    fromCarriers = "carrier";
    fromRiders = "riders";
    fromStates = "states";
    numRows = [];
    selection = [];
    presentProductIndex = 1;
    isError = false;
    isReceivingHQ = true;

    filtersData = [];
    isDisplayFilter = [];
    filterValue = [];
    filter;
    errorFlag: boolean;
    filterClassNames = {
        carriers: ["list-grid-filter", "filter-carriers", "filter-checkbox"],
        riders: ["list-grid-filter", "filter-riders", "filter-checkbox"],
        state: ["list-grid-filter", "filter-planstate", "filter-checkbox"],
    };
    @ViewChild("carriersFilterDropdown") carriersFilterDropdown: MatSelect;
    @ViewChild("ridersFilterDropdown") ridersFilterDropdown: MatSelect;
    @ViewChild("statesFilterDropdown") statesFilterDropdown: MatSelect;

    isHQFunded: boolean;
    isEmpFunded: boolean;
    skipHQFunded = false;
    hasAflacPlanSelectedForVAS: boolean;
    minAflacProductsSelected: number[] = [];
    isLoading: boolean;
    mpGroup: number;
    minimumAflacProductsRequired: number;
    filterOpen = false;
    SortPipe = new SortStatesPipe();
    benefitOfferingStates = [];
    sameProductPlansCount = 0;
    argusEmployeesInRange = true;
    isADVEROption = false;
    isERSelected: boolean;
    isBothSelected: boolean;
    @Input() proposalId;
    @Input() productId: number;
    @Input() individualOrGroup: "individual" | "group";
    @Input() cachedPlans;
    @Input() cachedPlansForVAS: Map<number, number[]>;
    @Input() selectedHQFundedProductPlan;
    @Input() isLastPlanStep = false;
    @Input() proposalPlanChoices: Map<number, number[]>;
    @Input() selectedPlanChoices: Map<number, number[]>;
    productName: string;

    private unsubscribe$ = new Subject<void>();

    numPlansSelectedMessage: string;
    maxCarriers: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.benefitsOffering.details",
        "primary.portal.benefitsOffering.availableRiders",
        "primary.portal.benefitsOffering.filterCarrier",
        "primary.portal.benefitsOffering.filterRiders",
        "primary.portal.benefitsOffering.filterStates",
        "primary.portal.benefitsOffering.altRiders",
        "primary.portal.benefitsOffering.altStates",
        "primary.portal.proposals.create.proposalPlans.plansSelected",
        "primary.portal.proposals.create.proposalPlans.planSelected",
        "primary.portal.common.close",
        "primary.portal.benefitsOffering.plansNotSelectedTitle",
        "primary.portal.proposals.plansNotSelectedSubTitle",
        "primary.portal.benefitsOffering.setting.licensedModal.gotIt",
        "primary.portal.benefitsOffering.employerFlyerUnavailable",
    ]);
    isPlanExistsinOldProducts = false;
    maxPlanLimit: number;
    totalPlans = 0;
    sortedStates: PlanStates[];
    missingFlyerFeatureEnable$: Observable<boolean>;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        public dialog: MatDialog,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly router: Router,
        private readonly benefitOffering: BenefitsOfferingService,
        private readonly stepperService: EmpStepperService,
    ) {
        super();
        this.form = this.formBuilder.group({
            carriersFilter: [""],
            ridersFilter: [""],
            statesFilter: [""],
            planType: [""],
        });
        this.getMinAflacProductsToSelect();
        if (!this.mpGroup) {
            this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        }
        this.benefitOfferingStates = this.store.selectSnapshot(BenefitsOfferingState.getdefaultStates);
    }

    /**
     * Get the plans based on selected products and load screen
     * @returns void
     */
    ngOnInit(): void {
        this.missingFlyerFeatureEnable$ = this.staticUtilService.cacheConfigEnabled(ConfigName.MISSING_FLYER_FEATURE_ENABLE);

        combineLatest([
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
        ])
            .pipe(
                switchMap(([argusMinValue, argusMaxValue]) => {
                    const eligibleADVMinEmployeeCount = +argusMinValue;
                    const eligibleADVMaxEmployeeCount = +argusMaxValue;

                    return this.benefitOffering.benefitOfferingSettingsData.pipe(
                        tap((censusEstimate) => {
                            const argusTotalEligibleEmployees = +censusEstimate.argusTotalEligibleEmployees;
                            this.argusEmployeesInRange =
                                argusTotalEligibleEmployees >= eligibleADVMinEmployeeCount &&
                                argusTotalEligibleEmployees <= eligibleADVMaxEmployeeCount;
                        }),
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.getMaxCarriers();
        if (this.cachedPlans && this.cachedPlans.planIds) {
            this.cachedPlans = this.cachedPlans.planIds;
        }
        if (this.productId) {
            this.resetValues();
            if (this.productId.toString() === AppSettings.VAS_EMP) {
                this.isEmpFunded = true;
            }
            if (this.productId.toString() === AppSettings.HQ) {
                this.isHQFunded = true;
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
            if (this.isLastPlanStep && this.proposalPlanChoices) {
                if (this.proposalPlanChoices.get(this.productId) && this.individualOrGroup === AppSettings.GROUP.toLowerCase()) {
                    // To get group planIds for selected product
                    const groupPlanIds: number[] = this.plansList
                        .filter((plan) => plan.productId === this.productId + GROUP_PLAN)
                        .map((planList) => planList.planId);
                    const planIdArray: number[] = this.proposalPlanChoices
                        .get(this.productId)
                        .filter((plan) => !groupPlanIds.find((planId) => planId === plan));
                    this.proposalPlanChoices.set(this.productId, planIdArray);
                }
                this.checkForPreviouslySelectedAflacPlans();
            }
            this.loadPlansScreen();
        }
    }
    /**
     * Method to get the limit for max carriers and max plans
     */
    getMaxCarriers(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue("group.proposal.plan.configs.max_carriers"),
            this.staticUtilService.cacheConfigValue("general.core.proposal.plan.max_plan_limit"),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([maxCarriers, maxPlanLimit]) => {
                this.maxCarriers = +maxCarriers;
                this.maxPlanLimit = +maxPlanLimit;
            });
    }
    /**
     * Method to get the minimum aflac products required for vas plans
     */
    getMinAflacProductsToSelect(): void {
        this.staticUtilService
            .cacheConfigValue(ConfigName.MINIMUM_AFLAC_PLANS_REQUIRED_FOR_VAS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.minimumAflacProductsRequired = parseInt(value[MIN_AFLAC_PRODUCTS_FOR_VAS], RADIX_TEN);
            });
    }
    // reset values on init
    resetValues(): void {
        if (!(this.isHQFunded || this.isEmpFunded)) {
            this.skipHQFunded = false;
        }
        this.isERSelected = undefined;
        this.form.controls.planType.setValue("");
        this.isBothSelected = undefined;
        this.isEmpFunded = false;
        this.isHQFunded = false;
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

        this.isError = false;
    }

    // open filter
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }

    /**
     * Method to get plan data
     * @returns void
     */
    getPlansData(): void {
        this.productList = [];
        this.plansList = [];
        const planIds = [];
        let showVasLinks = false;
        const panelModel = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts));
        if (panelModel.length > 0) {
            if (!this.argusEmployeesInRange && !this.router.url.includes(PROSPECT)) {
                panelModel.forEach((panelModelProduct) => {
                    if (panelModelProduct.product.name === VISION_PLAN || panelModelProduct.product.name === DENTAL_PLAN) {
                        panelModelProduct.plans = panelModelProduct.plans.filter(
                            (plans) => plans.plan.carrierId !== CarrierId.ADV && plans.plan.carrierId !== CarrierId.ARGUS,
                        );
                    }
                });
            }
            panelModel.forEach((productData) => {
                if ((this.isEmpFunded || this.isHQFunded) && productData.product.valueAddedService && productData.productChoice === null) {
                    productData = {
                        carrier: productData.carrier,
                        groupEligibility: productData.groupEligibility,
                        individualEligibility: productData.individualEligibility,
                        plans: productData.plans,
                        product: productData.product,
                        productChoice: {
                            id: productData.product.id,
                            individual: false,
                            group: true,
                        },
                    };
                }
                if (productData.productChoice && productData.product) {
                    if (productData.product.valueAddedService) {
                        showVasLinks = true;
                    } else {
                        if (productData.productChoice.individual && productData.productChoice.group) {
                            this.addIndividualAndGroupLinks(productData);
                        } else {
                            this.productList.push({
                                id: productData.product.id,
                                name: productData.product.name,
                            });
                        }
                    }
                    // eslint-disable-next-line complexity
                    productData.plans.forEach((planData) => {
                        if (
                            this.cachedPlansForVAS &&
                            (planData.plan.carrierId === 1 || planData.plan.carrierId === 65 || planData.plan.carrierId === CarrierId.ADV)
                        ) {
                            this.cachedPlansForVAS.forEach((value: number[]) => {
                                for (const planId of value) {
                                    if (planId === planData.plan.id) {
                                        this.minAflacProductsSelected.push(planId);
                                    }
                                    break;
                                }
                            });
                            if (this.minAflacProductsSelected.length >= this.minimumAflacProductsRequired) {
                                this.hasAflacPlanSelectedForVAS = true;
                            }
                        }
                        // eslint-disable-next-line complexity
                        if (
                            ((productData.productChoice.individual &&
                                planData.plan.policyOwnershipType.includes(PolicyOwnershipType.INDIVIDUAL)) ||
                                (productData.productChoice.group &&
                                    planData.plan.policyOwnershipType.includes(PolicyOwnershipType.GROUP))) &&
                            (planData.planEligibilty
                                ? planData.planEligibilty.eligibility === Eligibility.ELIGIBLE
                                : planData.plan.planEligibility.eligibility === Eligibility.ELIGIBLE)
                        ) {
                            planIds.push(planData.plan.id);
                            const states = this.filterBenefitOfferingStates(planData);
                            const savedPlanIds = this.cachedPlans;
                            this.plansList.push({
                                selected: savedPlanIds !== undefined && savedPlanIds.includes(planData.plan.id) ? true : false,
                                productId:
                                    productData.productChoice.individual && productData.productChoice.group
                                        ? planData.plan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0
                                            ? planData.plan.productId + "i"
                                            : planData.plan.productId + "g"
                                        : planData.plan.productId,
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
                                carrier: productData.carrier.filter((carrier) => carrier.id === planData.plan.carrierId).pop().name,
                                riders: [...planData.plan.riders],
                                states: states,
                                vasFunding: planData.plan.vasFunding,
                                disable: false,
                                isAutoEnrollable: planData.plan.characteristics.some((res) => res.includes(Characteristics.AUTOENROLLABLE)),
                                displayOrder: planData.plan.displayOrder,
                                missingEmployerFlyer: planData.plan.missingEmployerFlyer,
                            });
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
        this.productName = this.productList.filter((product) => {
            if (this.individualOrGroup) {
                return product.id === this.productId + (this.individualOrGroup === "individual" ? "i" : "g");
            } else {
                return product.id === this.productId;
            }
        })[0].name;
    }
    /**
     * Method to filter benefit offering state
     * @param planData plan object
     * @returns array of CountryState
     */
    filterBenefitOfferingStates(planData: PlanPanelModel): CountryState[] {
        return Array.from(
            new Set(
                planData.states.filter((state) =>
                    this.benefitOfferingStates.filter((offeringState) => offeringState.name === state.name).pop(),
                ),
            ),
        ).sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
    }

    // show individual and group links
    addIndividualAndGroupLinks(productData: any): void {
        this.productList.push({
            id: productData.product.id + "i",
            name: productData.product.name + " " + AppSettings.DISPLAY_INDIVIDUAL,
        });
        this.productList.push({
            id: productData.product.id + "g",
            name: productData.product.name + " " + AppSettings.DISPLAY_GROUP,
        });
    }
    /**
     * gets plans for current product
     */
    getPlansForProduct(): void {
        this.plans = JSON.parse(
            JSON.stringify(
                this.plansList.filter((plan) => {
                    if (this.isEmpFunded) {
                        return plan.vasFunding === undefined ? false : plan.vasFunding !== AppSettings.HQ ? true : false;
                    }
                    if (this.isHQFunded) {
                        return plan.vasFunding === undefined ? false : plan.vasFunding === AppSettings.HQ ? true : false;
                    }
                    return this.individualOrGroup
                        ? plan.productId === this.productId + (this.individualOrGroup === "individual" ? "i" : "g")
                        : plan.productId === this.productId;
                }),
            ),
        );
    }
    /**
     * populate the actual plans that should be displayed on the Plans list
     */
    loadPlansScreen(): void {
        this.getPlansForProduct();
        if ((this.isHQFunded || this.isEmpFunded) && this.plans.length === 0) {
            if (this.isHQFunded) {
                this.skipHQFunded = true;
                this.presentProductIndex = this.productList.length - 2;
            } else {
                this.skipHQFunded = false;
                this.presentProductIndex = this.productList.length - 1;
            }
        }
        if (this.skipHQFunded) {
            this.stepperService.next();
        }
        this.allPlans.data = this.plans;
        this.plansToCompare = this.utilService.copy(this.plans);
        this.presentProductIndex = this.productList.indexOf(
            this.productList.filter((product) => product.id.toString() === this.productId)[0],
        );
        this.configureFilters();
        if ((this.isHQFunded || this.isEmpFunded) && !this.hasAflacPlanSelectedForVAS) {
            this.isError = true;
            this.isReceivingHQ = false;
            this.plans.forEach((plan) => {
                if (plan.selected) {
                    plan.selected = false;
                }
            });
        }
        this.getSameProductPlansCount();
        this.initializeSelection(this.fromPlans);
    }
    /**
     * gets same product other plans count
     */
    getSameProductPlansCount(): void {
        this.sameProductPlansCount = 0;
        const sameProductPlans: number[] = this.selectedPlanChoices && this.selectedPlanChoices.get(this.productId);
        if (this.individualOrGroup && sameProductPlans && sameProductPlans.length) {
            const similarProductId: string = this.productId + (this.individualOrGroup === "individual" ? "g" : "i");
            this.sameProductPlansCount = this.plansList.filter(
                (plan) => plan.productId === similarProductId && sameProductPlans.find((cachedPlan) => cachedPlan === plan.planId),
            ).length;
        }
    }
    /**
     * disable plan selection when total count exceeds max selection limit
     * @param currentPlansCount indicates current screen plans count
     */
    disablePlanSelection(currentPlansCount: number): void {
        this.totalPlans = currentPlansCount + this.sameProductPlansCount;
        this.numPlansSelectedMessage =
            this.totalPlans +
            (this.totalPlans > 1
                ? this.languageStrings["primary.portal.proposals.create.proposalPlans.plansSelected"]
                : this.languageStrings["primary.portal.proposals.create.proposalPlans.planSelected"]);
        this.allPlans.data.forEach((plan) => {
            plan.disable = this.totalPlans >= this.maxPlanLimit && !this.selection[this.fromPlans].isSelected(plan);
        });
    }

    /**
     * initializes selected records based on option
     * @param option indicates option which is to be initialized
     */
    initializeSelection(option: string): void {
        let count = 0;
        let preselectedRows = [];
        preselectedRows = this.allPlans.data.filter((plan) => {
            let cachedPlanId = 0;
            if (this.cachedPlans) {
                cachedPlanId = this.cachedPlans.find((cachedPlan) => cachedPlan === plan.planId);
            }
            if (
                this.cachedPlans &&
                cachedPlanId > 0 &&
                (option !== this.fromPlans ||
                    !this.selectedHQFundedProductPlan ||
                    plan.productId !== this.selectedHQFundedProductPlan.productId)
            ) {
                plan.selected = true;
                count++;
            }
            if (this.cachedPlansForVAS && !this.isHQFunded) {
                this.cachedPlansForVAS.forEach((cachedPlanForVAS) => {
                    if (cachedPlanForVAS.includes(plan.planId)) {
                        cachedPlanId = plan.planId;
                        plan.selected = true;
                        count++;
                    }
                });
            } else if (this.cachedPlansForVAS && this.isHQFunded) {
                this.cachedPlansForVAS.forEach((value, key) => {
                    if (key === plan.productId && value.includes(plan.planId)) {
                        this.stepperService.saveSelectedVasHQPlanId(plan.productId);
                        cachedPlanId = plan.planId;
                        plan.selected = true;
                        count++;
                    }
                });
            }
            return (
                (this.cachedPlans &&
                    cachedPlanId > 0 &&
                    (option !== this.fromPlans ||
                        !this.selectedHQFundedProductPlan ||
                        plan.productId !== this.selectedHQFundedProductPlan.productId)) ||
                (this.cachedPlansForVAS && cachedPlanId > 0)
            );
        });

        if (this.form.contains("plans")) {
            this.form.removeControl("plans");
        }
        this.form.addControl("plans", this.formBuilder.control(preselectedRows, this.validatePlans.bind(this)));

        if (!preselectedRows.length && this.isHQFunded) {
            this.isReceivingHQ = false;
        }
        this.isADVEROption =
            this.plansToCompare.some((plan) => plan.isAutoEnrollable) && this.plansToCompare.some((plan) => !plan.isAutoEnrollable);
        if (count > 0 && this.isADVEROption) {
            this.isBothSelected =
                preselectedRows.some((plan) => plan.isAutoEnrollable) && preselectedRows.some((plan) => !plan.isAutoEnrollable);
            if (!this.isBothSelected) {
                this.isBothSelected = undefined;
                this.isERSelected = preselectedRows.some((plan) => plan.isAutoEnrollable);
                this.plans = this.utilService.copy(this.allPlans.data);
                this.allPlans.data = this.plans.filter((plan) => plan.isAutoEnrollable === this.isERSelected);
            }
        } else {
            this.isERSelected = undefined;
            this.isBothSelected = true;
        }
        this.selection[option] = new SelectionModel(true, []);
        if (preselectedRows.length) {
            // Iterate through the table data and individually set selected plans in the SelectionModel
            // SelectionModel and table data should refer to the same object for it to work correctly
            this.allPlans.data.forEach((plan) => {
                if (preselectedRows.some((row) => row.planId === plan.planId)) {
                    this.selection[option].select(plan);
                }
            });
        }
        this.numRows[option] = count;
        this.disablePlanSelection(count);
    }

    /* Show plan details in a dialog box*/
    showPlanDetails(planData: any): void {
        this.sortedStates = this.SortPipe.transform(planData.states);
        const planDetails = {
            planId: planData.planId,
            planName: planData.planName,
            states: this.sortedStates,
            mpGroup: this.mpGroup,
        };
        const dialogRef = this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }

    // updating Receiving HQ flag
    updateReceivingHQ(): void {
        this.isReceivingHQ = false;
        this.plans.forEach((plan) => {
            plan.selected = false;
        });
        if (this.form.contains("plans")) {
            this.form.removeControl("plans");
        }
        this.form.addControl("plans", this.formBuilder.control([], this.validatePlans.bind(this)));
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

    // update all plans based on select all checkbox changes
    updatePlans(option: string): void {
        this.allPlans.data.forEach((plan) => {
            if (
                plan[option] !== undefined &&
                plan.selected &&
                (option !== this.fromPlans ||
                    !this.selectedHQFundedProductPlan ||
                    plan.productId !== this.selectedHQFundedProductPlan.productId)
            ) {
                plan[option] = true;
                this.selection[option].select(plan);
            }
        });
    }

    /**
     * update plans data based on checkbox changes
     * @params event: checked/unchecked event
     * @params row: selected plan details
     * @params option: selected/unselected checkbox option
     * returns void
     */
    updateCheckedPlans(event: any, row: any, option: string): void {
        this.plans.forEach((plan) => {
            if (plan.planId === row.planId || (plan.carrier === row.name && plan.selected)) {
                plan[option] = event.checked;
            }
            plan.disable = false;
        });
        this.selection[option].toggle(row);
        if (this.form.contains("plans")) {
            this.form.removeControl("plans");
        }
        this.form.addControl(
            "plans",
            this.formBuilder.control(
                this.plans.filter((plan) => plan.selected),
                this.validatePlans.bind(this),
            ),
        );
        const count = this.plans.filter((plan) => plan.selected).length;
        this.disablePlanSelection(count);
        this.isTouched.emit(true);
    }

    // configure filters initially
    configureFilters(): void {
        const valuesList = { carriers: [], riders: [], states: [] };
        this.plansToCompare.forEach((item) => {
            valuesList.carriers.push({ name: item.carrier });
            for (const rider of item.riders) {
                valuesList.riders.push(rider);
            }
            for (const state of item.states) {
                valuesList.states.push(state);
            }
        });
        this.filtersData[this.fromCarriers] = [];
        this.distinctArrayValues(valuesList.carriers).forEach((carrier) => {
            this.filtersData[this.fromCarriers].push(carrier);
        });
        this.filtersData[this.fromRiders] = this.distinctArrayValues(valuesList.riders);
        this.filtersData[this.fromStates] = this.distinctArrayValues(valuesList.states);
    }
    // return distinct array values from duplicate array values
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
    /**
     * filter data based on selected filter data
     * @param val
     */
    filterApply(val: string): any {
        switch (val) {
            case this.fromCarriers:
                this.filterValue[val] = this.form.controls.carriersFilter.value;
                this.isBothSelected = true;
                this.isERSelected = undefined;
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

    /**
     * Method to reset the filters
     * @param val
     */
    resetVal(val: string): void {
        this.isDisplayFilter[val] = "";
        this.filterValue[val] = [];

        switch (val) {
            case this.fromCarriers:
                this.form.controls.carriersFilter.reset();
                this.filter.query.carrier = [];
                this.carriersFilterDropdown.close();
                this.isBothSelected = true;
                this.isERSelected = undefined;
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
    /**
     * pass data to DataFilter pipe
     */
    filterDataObject(): void {
        this.filter = this.utilService.copy(this.filter);
        this.allPlans.data = this.dataFilter.transform(this.plans, this.filter);
        this.isADVEROption =
            this.allPlans.data.some((plan) => plan.isAutoEnrollable) && this.allPlans.data.some((plan) => !plan.isAutoEnrollable);
    }

    /**
     * Method to get the plans based on the plan type
     */
    loadCarrierPlans(): void {
        if (this.form.controls.planType && this.form.controls.planType.value !== "") {
            this.isERSelected = this.form.controls.planType.value === ER_SELECTED;
            if (this.form.controls.planType.value === BOTH_SELECTED) {
                this.isBothSelected = true;
                this.isERSelected = undefined;
            } else {
                this.isBothSelected = undefined;
            }
        }
        let plans = this.utilService.copy(this.plans);
        const filter = this.utilService.copy(this.filter);
        plans = this.dataFilter.transform(plans, filter);
        if (this.isBothSelected) {
            this.allPlans.data = plans;
        } else {
            this.allPlans.data = plans.filter((plan) => plan.isAutoEnrollable === this.isERSelected);
        }
        this.selection[this.fromPlans].clear();
        this.allPlans.data.forEach((plan) => {
            if (plan.selected) {
                this.selection[this.fromPlans].select(plan);
            }
        });
        this.disablePlanSelection(this.plans.filter((plan) => plan.selected).length);
    }

    // display the selected data in filters based on the item length condition and concatination
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
    // implement Indeterminate state
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
    // check whether select all in states filter is checked
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
    // select all and Unselect all based on checkbox click
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
     * update vasSelection model with currently selected HQ plan
     * @param row selected plan details
     */
    updateHQPlan(row: any): void {
        this.isReceivingHQ = true;
        this.allPlans.data.forEach((plan) => {
            if (plan.planId === row.planId) {
                plan[PlansColumns.SELECTED] = true;
            } else {
                plan[PlansColumns.SELECTED] = false;
            }
        });

        if (this.form.contains("plans")) {
            this.form.removeControl("plans");
        }
        this.form.addControl(
            "plans",
            this.formBuilder.control(
                this.allPlans.data.filter((plan) => plan[PlansColumns.SELECTED]),
                this.validatePlans.bind(this),
            ),
        );
    }

    /**
     * This method used to check whether user selects at least 1 plan out of all plan steps
     * @param control it provides shared behavior of form control
     * @returns ValidationErrors or null
     */
    validatePlans(control: AbstractControl): ValidationErrors | null {
        let isPlanExist = false;
        if (this.isLastPlanStep) {
            if (this.proposalPlanChoices) {
                this.checkForPreviouslySelectedAflacPlans();
            }
            if (
                this.isPlanExistsinOldProducts ||
                (control.value.length &&
                    control.value.find(
                        (plan) =>
                            plan.carrier === CarrierType.AFLAC_CARRIER ||
                            plan.carrier === CarrierType.AFLAC_ADV_CARRIER ||
                            plan.carrier === CarrierType.AFLAC_ARGUS_CARRIER,
                    ))
            ) {
                isPlanExist = true;
            }
        }
        return this.isLastPlanStep && !isPlanExist ? { requirement: true } : null;
    }
    /**
     * Method to check if any previously selected aflac plan exists
     */
    checkForPreviouslySelectedAflacPlans(): void {
        this.proposalPlanChoices.forEach((planChoice) => {
            if (planChoice.length && !this.isPlanExistsinOldProducts) {
                this.isPlanExistsinOldProducts = this.plansList.find(
                    (plan) =>
                        (planChoice.includes(plan.planId) && plan.carrier === CarrierType.AFLAC_CARRIER) ||
                        plan.carrier === CarrierType.AFLAC_ADV_CARRIER ||
                        plan.carrier === CarrierType.AFLAC_ARGUS_CARRIER,
                );
            }
        });
    }
    onInvalidTraversal(): void {
        this.empoweredModalService.openDialog(ProposalNoPlansSelectedComponent);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
