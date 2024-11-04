import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { ProductsColumn, BenefitsOfferingService, AccountService, AccessedFrom, PartyType } from "@empowered/api";
import { Store } from "@ngxs/store";

import {
    BenefitsOfferingState,
    MapProductChoiceToPanelProduct,
    SideNavService,
    SharedState,
    ExceptionBusinessService,
    StaticUtilService,
    UtilService,
    SetAllProducts,
} from "@empowered/ngxs-store";
import { takeUntil, switchMap, tap, map, filter, withLatestFrom, catchError } from "rxjs/operators";
import { Subject, forkJoin, Observable, of } from "rxjs";
import { WellthiePopupComponent } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { UserState } from "@empowered/user";
import { ConfigName, UserPermissionList, AppSettings, Exceptions, ExceptionType, AgentInfo, PanelModel } from "@empowered/constants";

import { NY_CODE, INDEX_ZERO, PRODUCTS_GROUP_ATTRIBUTE_VALUE, VALUE_ADDED_SERVICES, IS_DEFAULT_SIC_CODE } from "./products.constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { combineLatest } from "rxjs";
const Tax_ID_ATTRIBUTE = "TAX_ID";

@Component({
    selector: "empowered-products",
    templateUrl: "./products.component.html",
    styleUrls: ["./products.component.scss"],
})
export class ProductsComponent implements OnInit, OnDestroy {
    selectedProducts = [];
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
    aflacCarrier = AppSettings.AFLAC_CARRIER;
    aflacGroupCarrier = AppSettings.AFLAC_GROUP_CARRIER;
    disabled = true;
    isError = false;
    errorMessage: string;
    initialProductsView = [];
    showSpinner = true;
    mpGroup: number;
    vasGroupEligible = false;
    isVASPermission = true;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isSitusNY = false;
    agentLevel: number;
    readonly AGENT_LEVEL_TWO = 2;
    readonly AGENT_LEVEL_THREE = 3;
    showWellthieLink$: Observable<boolean> = this.utilService.showWellthieLink();
    readonly MEDICAL = "Medical";
    readonly GROUP = "group";
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.benefitsOffering.product.title",
        "primary.portal.maintenanceBenefitsOffering.products.rsliProducts",
        "primary.portal.benefitsOffering.productVas",
        "primary.portal.benefitOffering.productsVas",
        "primary.portal.totalcost.launchWellthie",
        "primary.portal.benefitsOffering.product.contactSingleAgent",
        "primary.portal.benefitsOffering.product.contactAgent",
        "primary.portal.benefitsOffering.product.contactEverwell",
        "primary.portal.benefitsOffering.product.clientManager",
        "primary.portal.benefitsOffering.product.brokerSalesProfessional",
        "primary.portal.maintenanceBenefitsOffering.products.vasExceptionActive",
        "primary.portal.benefitsOffering.product.group",
        "primary.portal.benefitsOffering.product.selectAll",
        "primary.portal.benefitsOffering.product.individual",
    ]);
    isAccountDeactivated: boolean;
    showRLSIWarning = false;
    basicLifeId = 33;
    ltdId = 32;
    minimumAflacToSelect: number;
    selectedRsliProducts = [];
    hasIndividualProducts: boolean;
    contactBroker: string;
    brokerList: AgentInfo[];
    clientManagerList: AgentInfo[];
    vasExceptions: Exceptions[] = [];
    isVasException = false;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    isTaxIdAvailable = false;
    isTaxIdFeatureEnabled = false;
    private disabledTaxIdRows = new Set();
    // to make alert warning visible for products if sic code is not available
    showUnavailProdsWarning$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_PEO_RULES).pipe(
        filter((peoFeatureEnable) => !!peoFeatureEnable),
        withLatestFrom(this.store.select(BenefitsOfferingState.getMPGroup)),
        switchMap(([peoFeatureEnable, mpGroup]) => this.accountService.getGroupAttributesByName([IS_DEFAULT_SIC_CODE], mpGroup)),
        // default sic code will return either "true" or "false" or will be false also for an empty array
        map((isDefaultSicCode) => isDefaultSicCode.some((defaultSic) => defaultSic.value === "true")),
    );

    constructor(
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly language: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
    ) {}

    /**
     * Function to execute logic on initialization
     */
    ngOnInit(): void {
        // To get agent level from user state
        this.agentLevel = this.store.selectSnapshot(UserState).agentLevel;
        this.sideNavService.stepClicked$.next(1);
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.checkTaxIdAvailable();
        this.getVasPermission();
        this.sideNavService.updateGroupBenefitOfferingStep(PRODUCTS_GROUP_ATTRIBUTE_VALUE).pipe(takeUntil(this.unsubscribe$)).subscribe();
        // Made changes to check if situs state is NY to disable VAS selection
        if (this.mpGroup) {
            this.showSpinner = true;
            const configForAflacLimit = "broker.plan_year_setup.plan_choices.min_aflac_products_vas";
            this.accountService
                .getAccount(this.mpGroup.toString())
                .pipe(
                    switchMap((acc) => {
                        this.showSpinner = false;
                        if (acc && acc.situs && acc.situs.state && acc.situs.state.abbreviation === NY_CODE) {
                            this.isSitusNY = true;
                        }
                        return this.staticUtilService.cacheConfigValue(configForAflacLimit).pipe(
                            switchMap((data) => {
                                this.minimumAflacToSelect = +data;
                                return this.getProductsPanel();
                            }),
                            catchError(() => {
                                this.showSpinner = false;
                                this.isError = true;
                                this.errorMessage = "secondary.portal.benefitsOffering.product.responseError";
                                return of(null);
                            }),
                        );
                    }),
                )
                .subscribe();
        }
        this.fetchAccountStatus();
        this.checkVasException();
    }

    /**
     * function to get VAS Exception
     */
    checkVasException(): void {
        this.exceptionBusinessService
            .getVasExceptions(this.mpGroup.toString())
            .pipe(
                map((exceptions) =>
                    exceptions.map((exception) => ({
                        ...exception,
                        name: this.language.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exception.type}`),
                    })),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((res) => {
                this.isVasException = res.some((obj) => obj.type === ExceptionType.VAS_YEAR_ONE_PRODUCT_ADD);
                this.vasExceptions = res;
                this.updateDisable();
            });
    }
    /**
     * check if the TaxId is available for account
     **/
    checkTaxIdAvailable(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_TAX_ID_FOR_ABS),
            this.accountService.getGroupAttributesByName([Tax_ID_ATTRIBUTE]),
        ])
            .pipe(
                tap(([taxIdFeatureEnabled, taxDetails]) => {
                    this.isTaxIdFeatureEnabled = taxIdFeatureEnabled;
                    this.isTaxIdAvailable = taxDetails.some(
                        (item) => item.attribute === Tax_ID_ATTRIBUTE.toLowerCase() && (item.value ?? "") === "",
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * This method will get all the required data from store
     * If store is empty then it will fetch data from API (EVE-6317)
     */
    getProductsPanel(): Observable<PanelModel[]> {
        this.sideNavService.stepClicked$.next(1);
        return this.store.select(BenefitsOfferingState.getpanelProducts).pipe(
            switchMap((products) => (products ? of(products) : this.store.dispatch(new SetAllProducts()))),
            tap((products) => {
                this.products = products;
                if (!this.isVASPermission) {
                    this.products = this.products.filter((product) => !product.product.valueAddedService);
                }
                this.fetchProductChoice();
            }),
        );
    }
    // This method will fetch the product choices from database.
    fetchProductChoice(): void {
        const choice = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter((panel) => panel.productChoice != null)
            .map((product) => product.productChoice);
        if (choice.length) {
            this.productChoice = choice;
            this.fetchProductsView();
            this.updateDisable();
        } else {
            forkJoin(
                this.benefitOfferingService.getProductChoices(this.mpGroup, true),
                this.benefitOfferingService.getProductChoices(this.mpGroup, false),
            )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp) => {
                    this.productChoice.push(...resp[0]);
                    this.productChoice.push(...resp[1]);
                    this.fetchProductsView();
                    this.updateDisable();
                });
        }
    }
    // This method will create a view required for products panel.
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
                groupFieldError: false,
                disabled: product.plans.map((plan) => plan.plan.disabled),
                carrierId: product.plans.map((plan) => plan.plan.carrierId),
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
        this.checkIndividualPlans();
        this.selectGroupProducts();
        this.showSpinner = false;
    }
    aloneVasGroup(): void {
        this.productsView.forEach((prod) => {
            if (!this.vasGroupEligible) {
                this.vasGroupEligible = prod.groupEligibility ? true : false;
            }
        });
    }

    /**
     * gets the VAS permission for the role based users
     */
    getVasPermission(): void {
        this.store
            .select(SharedState.hasPermission(UserPermissionList.VAS_PRODUCT_VIEW_PERMISSION))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isVASPermission = response;
            });
    }
    /**
     * This method will add VAS product to separate row.
     */
    addVasProduct(): void {
        let individualEligibility = false,
            groupEligibility = false;
        const id: number[] = [];
        const carrier: string[] = [];
        this.vasProducts.forEach((product) => {
            id.push(product.product.id);
            carrier.push(...product.carrier.map((carriers) => carriers.name));
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
            name: VALUE_ADDED_SERVICES,
            carrier: uniqueCarrier,
            individualEligibility: individualEligibility,
            groupEligibility: groupEligibility,
            individual: individual,
            group: group,
        });
    }
    // This method will update the product choice of VAS products.
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
    // This method will return the product choices related to that product.
    checkEligibility(id: any, option: string): boolean {
        const choice = this.productChoice.filter((product) => product.id === id);
        if (choice.length) {
            return choice[0][option];
        }
        return false;
    }
    // This method will preselect the checkboxes.
    initializeSelection(option: string): void {
        let count = 0;
        const preselectedRow = this.productsView.filter((product) => {
            if (product[option] !== undefined) {
                count++;
            }
            return product[option] === true;
        });
        this.selection[option] = new SelectionModel(true, [...preselectedRow]);
        if (
            this.selection[option].selected.filter((products) => products.id === this.basicLifeId || products.id === this.ltdId).length > 0
        ) {
            this.showRLSIWarning = true;
        }
        this.numRows[option] = count;
    }
    // This method will check or uncheck all the checkboxes.
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
        const initialGroupCount = 0;
        // disabled property will be true if selected aflac carrier product for individual and group
        // sum count will be less than config requirement
        if (!this.isVasException) {
            this.disabled =
                this.checkAflacCarrier(this.fromIndividual) +
                    (this.groupEligible ? this.checkAflacCarrier(this.fromGroup) : initialGroupCount) <
                this.minimumAflacToSelect;
        } else {
            this.disabled =
                this.checkAflacCarrier(this.fromIndividual) +
                    (this.groupEligible ? this.checkAflacCarrier(this.fromGroup) : initialGroupCount) <
                this.minimumAflacToSelect - 1;
        }
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
                      (product.carrier.indexOf(this.aflacCarrier) >= 0 || product.carrier.indexOf(this.aflacGroupCarrier) >= 0) &&
                      (option === this.fromGroup ? !(product.individual && product.group) : true),
              ).length
            : 0;
    }

    // This will return boolean whether disabled is true or false.
    isDisabled(row: any, option?: string): boolean {
        if ((row.valueAddedService && this.disabled) || this.handleMissingTaxId(row, option)) {
            return true;
        }
        return false;
    }
    // Checks if ABS, tax id is missing and is a group product
    handleMissingTaxId(row: any, option: string): boolean {
        // checks if feature config is on
        if (this.isTaxIdFeatureEnabled && !row.valueAddedService) {
            const isABS = row.carrierId?.some((id) => id === 70);
            const isTaxIdMissing = row.disabled?.some((disable) => disable === true);
            if (option === this.GROUP && isABS && isTaxIdMissing) {
                this.disabledTaxIdRows.add(row);
                return true;
            }
            return false;
        }
        return false;
    }
    /**
     * This method will return boolean value whether all checkbox is checked or not.
     * @param option specifies whether to select group or individual products
     * @returns boolean indicating whether all products in specified product category are selected
     */
    isAllSelected(option: string): boolean {
        const numSelected = this.selection[option].selected.length;
        const disableRows = this.disabledTaxIdRows ? this.disabledTaxIdRows.size : 0;
        const numRows = this.numRows[option];
        const rsliProducts = this.products.filter(
            (products) => products.product && (products.product.id === this.basicLifeId || products.product.id === this.ltdId),
        );
        if (
            rsliProducts.length > 0 &&
            numSelected === numRows &&
            ((option === "individual" && rsliProducts.every((result) => result.individualEligibility)) ||
                (option === this.GROUP && rsliProducts.every((result) => result.groupEligibility)))
        ) {
            this.showRLSIWarning = true;
        }
        if (option === this.GROUP && this.disabledTaxIdRows.size && this.vasGroupEligible) {
            const totalRows = numRows - disableRows;
            return numSelected === totalRows;
        } else if (option === this.GROUP && this.disabledTaxIdRows.size && !this.vasGroupEligible) {
            const totalRows = numRows - (disableRows + 1);
            return numSelected === totalRows;
        }
        return numSelected === numRows;
    }
    // This method will clear all the selected checkbox.
    clearSelection(option: string): void {
        this.productsView.forEach((product) => {
            if (product[option] !== undefined) {
                product[option] = false;
                this.selection[option].deselect(product);
                product.groupFieldError = false;
            }
        });
        this.showRLSIWarning = false;
    }
    // This method will select all the checkbox.
    updateProducts(option: string): void {
        this.productsView.forEach((product) => {
            if (product[option] !== undefined && !this.handleMissingTaxId(product, option)) {
                product[option] = true;
                product.groupFieldError = false;
                this.selection[option].select(product);
            }
        });
    }
    // This method will toggle the check of selected product.
    updateCheckedProducts(event: any, row: any, option: string): void {
        this.isError = false;
        this.productsView.forEach((product) => {
            if (product.id === row.id) {
                product[option] = event.checked;
                this.selection[option].toggle(row);
                product.groupFieldError = false;
            }
        });
        this.updateDisable();
        if (this.selection[option].selected.filter((result) => result.id === this.basicLifeId || result.id === this.ltdId).length > 0) {
            this.showRLSIWarning = true;
        } else if ((row.id === this.basicLifeId || row.id === this.ltdId) && event.checked) {
            this.selectedRsliProducts.push(row);
            if (this.selectedRsliProducts.length > 0) {
                this.showRLSIWarning = true;
            }
        } else if ((row.id === this.basicLifeId || row.id === this.ltdId) && !event.checked) {
            this.selectedRsliProducts.splice(
                this.selectedRsliProducts.indexOf(this.selectedRsliProducts.filter((result) => result.id === row.id)),
                1,
            );
            if (this.selectedRsliProducts.length <= 0) {
                this.showRLSIWarning = false;
            }
        }
    }
    // This method will return all the checked products.
    getCheckedProducts(): void {
        let vasProduct = false;
        this.selectedProducts = [];
        this.selectedProducts = this.productsView
            .filter((product) => {
                if (product.name === VALUE_ADDED_SERVICES && !this.disabled && (product.group || product.individual)) {
                    vasProduct = true;
                }
                return this.disabled && product.valueAddedService ? null : product.group === true || product.individual === true;
            })
            .map((product) => ({
                id: product.id,
                individual: product.individual,
                group: product.group,
            }));
        if (vasProduct) {
            const prod = this.selectedProducts.pop();
            prod.id.forEach((id) => {
                this.selectedProducts.push({
                    id: id,
                    individual: prod.individual,
                    group: prod.group,
                });
            });
        }
    }
    // This method will hit on clicking back.
    onBack(): void {
        this.sideNavService.stepClicked$.next(0);
    }
    /**
     * This method will hit on clicking next and save the selected products
     */
    onNext(): void {
        this.showSpinner = true;
        this.isError = false;
        this.contactBroker = undefined;
        this.getCheckedProducts();
        if (this.selectedProducts.length) {
            if (
                JSON.stringify(this.initialProductsView) === JSON.stringify(this.productsView) &&
                !this.productsView.some((product) => product.name === VALUE_ADDED_SERVICES && product.group)
            ) {
                this.store.dispatch(new MapProductChoiceToPanelProduct(this.selectedProducts));
                this.sideNavService.defaultStepPositionChanged$.next(3);
            } else {
                this.showSpinner = true;
                this.benefitOfferingService
                    .saveProductSelection(this.selectedProducts, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (resp) => {
                            this.showSpinner = false;
                            this.store.dispatch(new MapProductChoiceToPanelProduct(this.selectedProducts));
                            this.sideNavService.stepClicked$.next(2);
                            this.sideNavService.defaultStepPositionChanged$.next(3);
                        },
                        (erroresp) => {
                            this.showSpinner = false;
                            if (erroresp.status === AppSettings.API_RESP_403) {
                                this.isError = true;
                                this.errorMessage = "secondary.portal.benefitsOffering.product.responseError";
                            } else if (erroresp.status === AppSettings.API_RESP_409 && erroresp.error.code === AppSettings.INVALIDSTATE) {
                                this.getAflacGroupPartyInfo();
                                this.productsView.forEach((product) => {
                                    if (product.group) {
                                        product.groupFieldError = true;
                                    }
                                });
                                this.isError = true;
                                // eslint-disable-next-line max-len
                                this.errorMessage = `secondary.portal.benefitsOffering.product.responseError.409.${erroresp.error.details[0].code}`;
                            } else if (erroresp.status === AppSettings.API_RESP_503) {
                                this.isError = true;
                                this.errorMessage = `secondary.portal.benefitsOffering.product.responseError.503.${erroresp.error.code}`;
                            } else if (erroresp.status === AppSettings.API_RESP_400) {
                                this.isError = true;
                                this.errorMessage = "secondary.portal.benefitsOffering.product.responseError.400.badParameter";
                            }
                        },
                    );
            }
        } else {
            this.showSpinner = false;
            this.isError = true;
            this.errorMessage = "secondary.portal.benefitsOffering.product.requirementError";
        }
    }
    /**
     * This method will open wellthie pop up
     */
    openWellthiePopup(): void {
        this.empoweredModalService.openDialog(WellthiePopupComponent, {
            data: { accessedFrom: AccessedFrom.BENEFIT_SELECTION },
        });
    }

    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }

    /**
     * Method to check if any individual products are offered
     */
    checkIndividualPlans(): void {
        this.hasIndividualProducts = this.productsView.some((product) => product.individualEligibility);
    }

    /**
     * Method to get Agent information to contact
     */
    getAflacGroupPartyInfo(): void {
        this.showSpinner = true;
        this.benefitOfferingService
            .getAflacGroupPartyInformation(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.showSpinner = false;
                    if (resp.length === INDEX_ZERO) {
                        this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactEverwell"];
                    } else if (resp.length === AppSettings.ONE) {
                        if (resp[INDEX_ZERO].fullName !== "" && resp[INDEX_ZERO].email && resp[INDEX_ZERO].email !== "") {
                            this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactSingleAgent"]
                                .replace("#fullName", resp[INDEX_ZERO].fullName)
                                .replace("#email", resp[INDEX_ZERO].email);
                        } else {
                            this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactEverwell"];
                        }
                    } else if (resp.length > AppSettings.ONE) {
                        this.contactBroker = this.languageStrings["primary.portal.benefitsOffering.product.contactAgent"];
                        this.brokerList = resp.filter((agent) => this.filterResponse(agent) && agent.partyKey === PartyType.BROKER_SALES);
                        this.clientManagerList = resp.filter(
                            (agent) => this.filterResponse(agent) && agent.partyKey === PartyType.CLIENT_SPECIALIST,
                        );
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            );
    }

    /**
     * Method to check if name and email are present
     * @param {AgentInfo} agent
     * @returns {boolean} true if fullName and email fields are present else false
     */
    filterResponse(agent: AgentInfo): boolean {
        return agent.fullName && agent.fullName !== "" && agent.email && agent.email !== "";
    }

    /**
     * Method to check config value and select all AG products
     */
    selectGroupProducts(): void {
        this.staticUtilService
            .cacheConfigValue("general.aflac_groups.benefit_offering.products.pre_selection.enable")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp && resp.toLowerCase() === AppSettings.TRUE) {
                    this.productsView.forEach((product) => {
                        const isAGCarrier = product.carrier.some((carrierName) => carrierName === AppSettings.AFLAC_GROUP_CARRIER);
                        if (product[this.fromGroup] !== undefined && isAGCarrier) {
                            product[this.fromGroup] = true;
                            this.selection[this.fromGroup].select(product);
                        }
                    });
                }
            });
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
