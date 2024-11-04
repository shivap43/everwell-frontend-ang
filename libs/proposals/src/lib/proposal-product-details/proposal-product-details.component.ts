import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { ProposalsService, ProposalProductChoiceState } from "@empowered/ngxs-store";
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { ProductsColumn, BenefitsOfferingService, AflacService, AccountDetails, AccountService } from "@empowered/api";
import { takeUntil, switchMap, tap } from "rxjs/operators";
import { Subject, Observable, of, Subscription, combineLatest } from "rxjs";
import { SelectionModel } from "@angular/cdk/collections";
import { FormGroup, FormBuilder, AbstractControl } from "@angular/forms";
import { BenefitsOfferingState, AccountInfoState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import {
    ArgusConfig,
    CarrierId,
    CarrierType,
    AbstractComponentStep,
    AppSettings,
    PolicyOwnershipType,
    ProductId,
    ConfigName,
    SYMBOLS,
} from "@empowered/constants";
import { Router } from "@angular/router";

const CONFIG_AFLAC_LIMIT = "broker.plan_year_setup.plan_choices.min_aflac_products_vas";
const AFLAC_CARRIER = AppSettings.AFLAC_CARRIER;
const SIC_CODE_ATTRIBUTE = "sic_code";
const INDUSTRY_CODE_ATTRIBUTE = "IndustryCode";
const VISION_PLAN = "Vision";
const DENTAL_PLAN = "Dental";
const PROSPECT = "prospect";
const Tax_ID_ATTRIBUTE = "TAX_ID";

@Component({
    selector: "empowered-proposal-product-details",
    templateUrl: "./proposal-product-details.component.html",
    styleUrls: ["./proposal-product-details.component.scss"],
})
export class ProposalProductDetailsComponent extends AbstractComponentStep implements OnInit, OnDestroy {
    selectedProducts = [];
    preselectedRows = [];
    products = [];
    productsView = [];
    productChoice = [];
    vasProducts = [];
    productsColumn = Object.values(ProductsColumn);
    numRows = [{ individual: "", group: "" }];
    selection = [{ individual: "", group: "" }];
    groupEligible = false;
    fromIndividual = ProductsColumn.INDIVIDUAL;
    fromGroup = ProductsColumn.GROUP;
    aflacGroupCarrier = AppSettings.AFLAC_GROUP_CARRIER;
    disabled = true;
    isError = false;
    private readonly refreshSICError$ = new Subject<boolean>();
    errorMessage: string;
    initialProductsView = [];
    mpGroup: number;
    vasGroupEligible = false;
    VAS = AppSettings.VALUE_ADDED_SERVICES;
    minimumAflacToSelect: number;
    private unsubscribe$ = new Subject<void>();
    unavailableProductsError = false;
    argusTotalEligibleEmployees: number;
    eligibleADVMinEmployeeCount: number;
    eligibleADVMaxEmployeeCount: number;
    argusEmployeesInRange = true;
    isProspect = false;
    isTaxIdAvailable = false;
    isTaxIdFeatureEnabled = false;
    form: FormGroup = this.fb.group({
        products: this.fb.control([], this.validateProducts.bind(this, AFLAC_CARRIER)),
    });
    @Input() proposalId;
    @Input() cachedProducts;
    productsView$: Observable<any[]>;
    group: AccountDetails;
    subscriptions: Subscription[] = [];
    productSubscription: Subscription;
    sicErrorObservable$ = this.refreshSICError$.asObservable();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.product.title",
        "primary.portal.benefitsOffering.product.requirementError",
        "primary.portal.benefitOffering.productsVas",
        "primary.portal.proposal.refreshAccountSICNumber.updateFailed",
        "primary.portal.createProposal.sicCodeMissingMessage",
    ]);

    constructor(
        private readonly benefitOffering: BenefitsOfferingService,
        private readonly proposalFacade: ProposalsService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly aflacService: AflacService,
        private readonly accountService: AccountService,
        private readonly route: Router,
    ) {
        super();
    }
    /**
     * Life cycle hook of angular.
     * Includes call to refresh account SIC number and get products.
     */
    ngOnInit(): void {
        if (this.route.url.includes(PROSPECT)) {
            this.isProspect = true;
        }
        this.group = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.mpGroup = this.group.id;
        this.checkTaxIdAvailable();
        this.subscriptions.push(
            combineLatest([
                this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
                this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
                this.staticUtilService.cacheConfigValue(ConfigName.PROPOSALS_A68_LIFE_PLAN_STATES),
            ])
                .pipe(
                    tap(([, , a68StatesValue]) => {
                        const a68PlanSeriesStates = a68StatesValue?.length ? a68StatesValue.split(SYMBOLS.COMMA) : [];
                        this.getProductsPanel(a68PlanSeriesStates);
                    }),
                    switchMap(([argusMinValue, argusMaxValue]) => {
                        this.eligibleADVMinEmployeeCount = Number(argusMinValue);
                        this.eligibleADVMaxEmployeeCount = Number(argusMaxValue);
                        return this.benefitOffering.benefitOfferingSettingsData.pipe(
                            tap((censusEstimate) => {
                                this.argusTotalEligibleEmployees = censusEstimate.argusTotalEligibleEmployees;
                                this.argusEmployeesInRange =
                                    this.argusTotalEligibleEmployees >= this.eligibleADVMinEmployeeCount &&
                                    this.argusTotalEligibleEmployees <= this.eligibleADVMaxEmployeeCount;
                            }),
                        );
                    }),
                )
                .subscribe(),
        );
        this.refreshAccountSICCode();
        this.checkSICNumberAndIndustryCode();
        if (this.proposalId) {
            this.proposalFacade.getProposalProductChoices(this.proposalId);
        }
        this.staticUtilService
            .cacheConfigValue(CONFIG_AFLAC_LIMIT)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.minimumAflacToSelect = parseInt(response, 10);
            });
    }
    /**
     * check if group consists of SIC number and industry code
     */
    checkSICNumberAndIndustryCode(): void {
        combineLatest([
            this.accountService.getGroupAttributesByName([SIC_CODE_ATTRIBUTE]),
            this.accountService.getGroupAttributesByName([INDUSTRY_CODE_ATTRIBUTE]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([sicNumberDetails, industryCodeDetails]) => {
                if (
                    !sicNumberDetails.length ||
                    !sicNumberDetails[0].value ||
                    !industryCodeDetails.length ||
                    !industryCodeDetails[0].value
                ) {
                    this.unavailableProductsError = true;
                }
            });
    }
    /**
     * Method to call aflac service refreshAccountSICCode.
     * @returns void
     */
    refreshAccountSICCode(): void {
        this.subscriptions.push(
            this.aflacService.refreshAccountSICCode(this.mpGroup).subscribe(
                (response) => {},
                (error) => {
                    if (error.status === AppSettings.API_RESP_503) {
                        const isRefreshError = true;
                        this.refreshSICError$.next(isRefreshError);
                        this.refreshSICError$.complete();
                    }
                },
            ),
        );
    }

    /**
     * Function to get all the required data for product from store
     * @param a68PlanSeriesStates - List of states in which A68 series plans are allowed
     */
    getProductsPanel(a68PlanSeriesStates: string[]): void {
        this.products = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts));
        this.filterLifeProductEligibility(a68PlanSeriesStates);
        if (this.products.length && !this.argusEmployeesInRange && !this.isProspect) {
            this.products = this.products.map((product) => {
                if (product.product.name === VISION_PLAN || product.product.name === DENTAL_PLAN) {
                    product.carrier = product.carrier.filter(
                        (carriers) => carriers.id !== CarrierId.ADV && carriers.id !== CarrierId.ARGUS,
                    );
                    return product;
                }
                return product;
            });
        }
        this.fetchProductChoice();
    }

    /**
     * Function to filter life product - group or Individual eligibility based on config
     * @param A68PlanSeriesStates - List of states in which A68 series plans are allowed
     */
    filterLifeProductEligibility(a68PlanSeriesStates: string[]): void {
        // this logic updates the value of individualEligibility or group eligibility of life products
        // based on the states configured in a68PlanSeriesStates
        // filters the products which have either individual eligibility or group eligibility or both
        this.products = this.products
            .map((data) => {
                if (a68PlanSeriesStates?.length && (data.product.id === ProductId.WHOLE_LIFE || data.product.id === ProductId.TERM_LIFE)) {
                    if (a68PlanSeriesStates.includes(this.group.situs.state.abbreviation)) {
                        return { ...data, groupEligibility: false };
                    } else {
                        return { ...data, individualEligibility: false };
                    }
                }
                return data;
            })
            .filter((product) => product.groupEligibility || product.individualEligibility);
    }

    /**
     * fetching the product choices from database
     */
    fetchProductChoice(): void {
        this.productSubscription = this.benefitOffering
            .getProductChoices(0, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.productChoice = [...resp];
                const choices = this.store.selectSnapshot(ProposalProductChoiceState.proposalProductChoices);
                if (choices !== null && choices.length) {
                    for (const choice of choices) {
                        let chosenProductChoice = this.productChoice.find((productChoice) => productChoice.id === choice.productId);
                        if (chosenProductChoice === undefined) {
                            chosenProductChoice = {
                                id: choice.productId,
                            };
                        }
                        chosenProductChoice.group = choice.group;
                        chosenProductChoice.individual = choice.individual;
                    }
                }
                this.fetchProductsView();
                this.updateDisable();
                this.proposalFacade.productsLoaded(true);
            });
    }

    // creating a view required for products panel
    fetchProductsView(): void {
        this.productsView = this.products
            .filter((product) => {
                if (product.product) {
                    if (product.groupEligibility) {
                        this.groupEligible = true;
                    }
                    if (product.product.valueAddedService) {
                        this.vasProducts.push(product);
                    } else {
                        return product;
                    }
                }
            })
            .map((product) => ({
                id: product.product.id,
                displayOrder: product.product.displayOrder,
                valueAddedService: product.product.valueAddedService,
                name: product.product.name,
                individualEligibility: product.individualEligibility,
                groupEligibility: product.groupEligibility,
                individual: product.individualEligibility ? this.checkEligibility(product.product.id, this.fromIndividual) : undefined,
                group: product.groupEligibility ? this.checkEligibility(product.product.id, this.fromGroup) : undefined,
                carrier: product.carrier.map((data) => data.name),
            }));
        this.aloneVasGroup();
        if (this.vasProducts.length) {
            this.addVasProduct();
        }
        this.initializeSelection(this.fromIndividual);
        if (this.groupEligible) {
            this.initializeSelection(this.fromGroup);
        }
        this.initialProductsView = this.utilService.copy(this.productsView);

        this.productsView$ = of(this.productsView);
    }

    // updating VAS group eligible products
    aloneVasGroup(): void {
        this.productsView.forEach((prod) => {
            if (!this.vasGroupEligible) {
                this.vasGroupEligible = prod.groupEligibility ? true : false;
            }
        });
    }

    // adding VAS poduct to separate row
    addVasProduct(): void {
        let individualEligibility = false,
            groupEligibility = false;
        const id = [],
            carrier = [];
        this.vasProducts.forEach((product) => {
            id.push(product.product.id);
            carrier.push(product.carrier.map((carriers) => carriers.name));
            if (!individualEligibility) {
                individualEligibility = product.individualEligibility ? true : false;
            }
            if (!groupEligibility) {
                groupEligibility = product.groupEligibility ? true : false;
            }
        });
        let individual, group;
        if (individualEligibility) {
            individual = this.vasProductChoice(this.fromIndividual);
        } else {
            individual = undefined;
        }
        if (groupEligibility) {
            group = this.vasProductChoice(this.fromGroup);
        } else {
            group = undefined;
        }
        const uniqueCarrier = Array.from(new Set([...carrier]));
        this.productsView.push({
            id: id,
            valueAddedService: true,
            name: AppSettings.VALUE_ADDED_SERVICES,
            carrier: uniqueCarrier,
            individualEligibility: individualEligibility,
            groupEligibility: groupEligibility,
            individual: individual,
            group: group,
        });
    }

    // updating the product choice of VAS products
    vasProductChoice(option: string): boolean {
        let isTruthy = false;
        this.vasProducts.forEach((product) => {
            if (!isTruthy) {
                const id = product.product.id;
                isTruthy = this.checkEligibility(id, option);
            }
        });
        return isTruthy;
    }

    // returning the product choices related to that product
    checkEligibility(id: any, option: string): boolean {
        const choice = this.productChoice.filter((product) => product.id === id);
        if (choice.length) {
            return choice[0][option];
        }
        return false;
    }

    /**
     * get and check if the TaxId is available for account
     **/
    checkTaxIdAvailable(): void {
        combineLatest([
            this.accountService.getGroupAttributesByName([Tax_ID_ATTRIBUTE]),
            this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_TAX_ID_FOR_ABS),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([taxDetails, taxIdFeatureEnabled]) => {
                this.isTaxIdFeatureEnabled = taxIdFeatureEnabled;
                this.isTaxIdAvailable = taxDetails.some(
                    (item) => item.attribute === Tax_ID_ATTRIBUTE.toLowerCase() && (item.value ?? "") === "",
                );
            });
    }
    /**
     * initializes selection of product choices
     * @param option indicates whether individual or group option
     */
    initializeSelection(option: string): void {
        let count = 0;
        const selectedProducts = this.store.selectSnapshot(ProposalProductChoiceState.proposalProductChoices);
        const selectedProductIds =
            selectedProducts !== null ? selectedProducts.map((proposalProductChoice) => proposalProductChoice.productId) : [];
        const cachedProductIds = this.cachedProducts ? this.cachedProducts.map((product) => product.productId) : undefined;
        this.productsView.forEach((product) => {
            let isVasProductSelected = false;
            if (product.id.length > 1) {
                isVasProductSelected =
                    product.id.find((id) => selectedProductIds.includes(id) || (cachedProductIds && cachedProductIds.includes(id))) !==
                    undefined;
            }
            if (
                !(cachedProductIds && cachedProductIds.includes(product.id)) &&
                !(this.cachedProducts === undefined && selectedProductIds.includes(product.id)) &&
                !isVasProductSelected
            ) {
                product.group = false;
                product.individual = false;
            } else if (this.cachedProducts && this.cachedProducts.length > 0) {
                const cachedProduct = this.cachedProducts.find(
                    (cp) => cp.productId === product.id || (product.id.length && product.id.includes(cp.productId)),
                );
                if (cachedProduct) {
                    product.group = cachedProduct.group;
                    product.individual = cachedProduct.individual;
                }
            } else if (selectedProducts && selectedProducts.length > 0) {
                const selectedProduct = selectedProducts.find((sp) => {
                    if (product.valueAddedService) {
                        return product.id.includes(sp.productId);
                    }
                    return sp.productId === product.id;
                });
                if (selectedProduct) {
                    if (product.valueAddedService) {
                        product.group = true;
                    } else {
                        product.group = selectedProduct.group;
                        product.individual = selectedProduct.individual;
                    }
                }
            } else if (isVasProductSelected) {
                product.group = true;
            }
        });

        const preselectedRow = this.productsView.filter((product) => {
            const isCheckboxPresent = option === this.fromIndividual ? product.individualEligibility : product.groupEligibility;
            if (product[option] !== undefined && isCheckboxPresent) {
                count++;
            }
            // for VAS products
            if (product.id.length > 1) {
                if (
                    product.id.find((id) => {
                        if (this.cachedProducts) {
                            return this.cachedProducts.map((cachedProduct) => cachedProduct.productId).includes(id);
                        } else {
                            return selectedProductIds.includes(id);
                        }
                    }) !== undefined
                ) {
                    return true;
                } else {
                    return false;
                }
            }
            if (this.cachedProducts) {
                if (cachedProductIds.includes(product.id) && product[option]) {
                    return product[option] === true;
                }
            } else if (selectedProductIds.includes(product.id) && product[option]) {
                return product[option] === true;
            }
            return false;
        });

        this.selection[option] = new SelectionModel(true, [...preselectedRow]);
        this.numRows[option] = count;
        preselectedRow.forEach((row) => {
            if (!this.preselectedRows.map((pr) => pr.id).includes(row.id)) {
                this.preselectedRows.push({ ...row });
            }
        });
        const prod = this.preselectedRows?.[this.preselectedRows.length - 1];
        // creating plan choice object for every VAS plan ID
        if (prod && prod.id && prod.id.length) {
            // Check if last product is VAS and then pop the last row.
            this.preselectedRows.pop();
            const preselectedVASPlans = prod.id
                .filter((id) => this.preselectedRows.every((product) => product.id !== id))
                .map((id) => ({
                    id: id,
                    individual: prod.individual,
                    group: prod.group,
                    carrier: prod.carrier,
                    valueAddedService: true,
                }));
            this.preselectedRows = [...this.preselectedRows, ...preselectedVASPlans];
        }
        this.form = this.fb.group({
            products: this.fb.control(
                this.preselectedRows.map((row) => ({
                    productId: row.id.length > 1 ? row.id[0] : row.id,
                    group: row.group,
                    individual: row.individual,
                    carrier: row.carrier,
                    valueAddedService: row.valueAddedService,
                })),
                this.validateProducts.bind(this, AFLAC_CARRIER),
            ),
        });
    }

    // (un)checking all the checkboxes
    masterToggle(option: string): void {
        if (
            option === this.fromGroup &&
            this.disabled &&
            this.vasProducts.length &&
            this.numRows[this.fromGroup] - this.selection[this.fromGroup].selected.length === 1
        ) {
            this.clearSelection(option);
        } else {
            if (this.isAllSelected(option)) {
                this.clearSelection(option);
            } else {
                this.updateProducts(option);
            }
            this.updateDisable();
            this.isError = false;
        }
    }

    /**
     * This method will enable/disable checkbox for VAS product.
     */
    updateDisable(): void {
        this.disabled =
            this.checkAflacCarrier(this.fromIndividual) + (this.groupEligible ? this.checkAflacCarrier(this.fromGroup) : 0) <
            this.minimumAflacToSelect;
        if (this.vasProducts.length && this.disabled) {
            const prod = this.productsView[this.productsView.length - 1];
            if (prod.individualEligibility) {
                prod.individual = false;
                this.selection[this.fromIndividual].deselect(prod);
            }
            if (prod.groupEligibility) {
                prod.group = false;
                this.selection[this.fromGroup].deselect(prod);
            }
        }
    }

    /**
     * This method will check if aflac product is selected or not.
     * @param option specifies whether to check group or individual products
     * @returns number of selected products that are carried by Aflac
     */

    checkAflacCarrier(option: string): number {
        return this.selection[option]
            ? this.selection[option].selected.filter(
                  (product) =>
                      this.checkAflacCarrierPlans(product.id, option) &&
                      (option === this.fromGroup ? !(product.individual && product.group) : true),
              ).length
            : 0;
    }

    /**
     * Check whether the individual or group plans of the product have Aflac/ Aflac Group carrier
     * @param productId product id of the product to check for Aflac carrier
     * @param option specifies to check carriers of individual or group plan types
     * @returns boolean, true if the carrier of plans in the specified option are of Aflac/ Aflac Group
     */
    checkAflacCarrierPlans(productId: number, option: string): boolean {
        const productData = this.products.find((product) => product.product.id === productId);
        return (
            productData &&
            productData.plans &&
            productData.plans.some(
                (plan) =>
                    (plan.plan.carrierNameOverride === AFLAC_CARRIER ||
                        plan.plan.carrierNameOverride === this.aflacGroupCarrier ||
                        plan.plan.carrierId === CarrierId.ADV) &&
                    plan.plan.policyOwnershipType ===
                        (option === this.fromGroup ? PolicyOwnershipType.GROUP : PolicyOwnershipType.INDIVIDUAL),
            )
        );
    }
    // returning whether disabled is true or false
    isDisabled(row: any): boolean {
        if (row.valueAddedService && this.disabled) {
            return true;
        }
        return false;
    }
    // returning whether all checkbox is checked or not
    isAllSelected(option: string): boolean {
        const numSelected = this.selection[option].selected.length;
        const numRows = this.numRows[option];
        return numSelected === numRows;
    }

    // clearing all the selected checkboxes
    clearSelection(option: string): void {
        this.productsView.forEach((product) => {
            const isCheckboxPresent = option === this.fromIndividual ? product.individualEligibility : product.groupEligibility;
            if (product[option] !== undefined && isCheckboxPresent) {
                product[option] = false;
                this.selection[option].deselect(product);
            }
        });
        this.selectedProducts = [];
        this.form = this.fb.group({
            products: this.fb.control(this.selectedProducts, this.validateProducts.bind(this, AFLAC_CARRIER)),
        });
        this.isTouched.emit(true);
    }
    // selecting all the checkboxes
    updateProducts(option: string): void {
        this.productsView.forEach((product) => {
            const isCheckboxPresent = option === this.fromIndividual ? product.individualEligibility : product.groupEligibility;
            if (product[option] !== undefined && isCheckboxPresent) {
                product[option] = true;
                this.selection[option].select(product);
            }
        });
        this.getCheckedProducts();
        this.form = this.fb.group({
            products: this.fb.control(this.selectedProducts, this.validateProducts.bind(this, AFLAC_CARRIER)),
        });
        this.isTouched.emit(true);
    }

    // toggling the check of selected products
    updateCheckedProducts(event: any, row: any, option: string): void {
        this.isError = false;
        this.productsView.forEach((product) => {
            if (product.id === row.id) {
                product[option] = event.checked;
                this.selection[option].toggle(row);
            }
        });
        this.getCheckedProducts();
        this.form = this.fb.group({
            products: this.fb.control(this.selectedProducts, this.validateProducts.bind(this, AFLAC_CARRIER)),
        });
        this.isTouched.emit(true);
        this.updateDisable();
    }

    // returning all the checked products
    getCheckedProducts(): void {
        let vasProduct = false;
        this.selectedProducts = [];
        this.selectedProducts = this.productsView
            .filter((product) => {
                if (product.name === AppSettings.VALUE_ADDED_SERVICES && !this.disabled && (product.group || product.individual)) {
                    vasProduct = true;
                }
                return this.disabled && product.valueAddedService ? null : product.group === true || product.individual === true;
            })
            .map((product) => ({
                productId: product.id,
                individual: product.individual,
                group: product.group,
                carrier: product.carrier,
            }));
        if (vasProduct) {
            const prod = this.selectedProducts.pop();
            prod.productId.forEach((id) => {
                this.selectedProducts.push({
                    productId: id,
                    individual: prod.individual,
                    group: prod.group,
                    carrier: prod.carrier,
                    valueAddedService: true,
                });
            });
        }
    }

    // checking to make sure we have to select at least 1 product
    validateProducts(aflacCarrier: string, control: AbstractControl): any {
        return control.value.length === 0 ||
            !control.value.find(
                (products) => products.carrier.includes(aflacCarrier) || products.carrier.includes(CarrierType.AFLAC_ADV_CARRIER),
            )
            ? { requirement: true }
            : null;
    }

    // controlling whether an error message should show up
    onInvalidTraversal(): void {
        this.isError = true;
    }

    // unsubscribing all the api subscriptions
    ngOnDestroy(): void {
        this.subscriptions.push(this.productSubscription);
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
