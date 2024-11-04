import { SelectionModel } from "@angular/cdk/collections";
import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import {
    ProductsColumn,
    BenefitsOfferingService,
    ProductSelection,
    AccountService,
    AccessedFrom,
    ExceptionsService,
    AccountDetails,
    RequiredSetup,
} from "@empowered/api";
import { Store } from "@ngxs/store";

import {
    MapProductChoiceToUnapprovedPanelProduct,
    MapProductChoiceToPanelProduct,
    MapProductChoiceToNewPlanYearPanel,
    BenefitsOfferingState,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { takeUntil, catchError, take, map, tap, switchMap, filter, withLatestFrom } from "rxjs/operators";
import { Subject, forkJoin, of, Observable, combineLatest } from "rxjs";
import { WellthiePopupComponent } from "@empowered/ui";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UserState } from "@empowered/user";
import {
    CarrierId,
    ArgusConfig,
    CarrierType,
    ConfigName,
    ProductId,
    PanelModel,
    AccountImportTypes,
    UserPermissionList,
    AppSettings,
    Exceptions,
    PlanChoice,
    ExceptionType,
    PolicyOwnershipType,
} from "@empowered/constants";
import { COPY_NEW_PLAN_YEAR_CONSTANT, VISION_PLAN, DENTAL_PLAN, IS_DEFAULT_SIC_CODE } from "./product-quasi.constants";
import { EmpoweredModalService } from "@empowered/common-services";

const TAX_ID = "TAX_ID";
@Component({
    selector: "empowered-product-quasi",
    templateUrl: "./product-quasi.component.html",
    styleUrls: ["./product-quasi.component.scss"],
})
export class ProductQuasiComponent implements OnInit, OnDestroy {
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
    showSpinner = true;
    mpGroup: number;
    vasGroupEligible = false;
    VAS = AppSettings.VALUE_ADDED_SERVICES;
    hasVasPlanChoice: boolean;
    hiddenProducts = [];
    vasAlreadySelected: boolean;
    individualEligible = false;
    unapprovedProductChoice = [];
    unApprovedPlanChoices: PlanChoice[] = [];
    planYearChoice: boolean;
    planYearId: number;
    uniqueProductIds: number[] = [];
    planYearProductChoice = [];
    isSitusNY = false;
    agentLevel: number;
    readonly AGENT_LEVEL_TWO = 2;
    readonly AGENT_LEVEL_THREE = 3;
    readonly GROUP = "group";
    showWellthieLink$: Observable<boolean> = this.utilService.showWellthieLink();
    readonly MEDICAL = "Medical";
    allVasProducts = [];
    isVASPermission = true;
    vasExceptions: Exceptions[] = [];
    isVasException = false;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    enrollmentEndDate: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.product.title",
        "primary.portal.benefitsOffering.product.subtitle",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.benefitsOffering.productVas",
        "primary.portal.benefitOffering.productsVas",
        "primary.portal.totalcost.launchWellthie",
        "primary.portal.maintenanceBenefitsOffering.products.vasExceptionActive",
        "primary.portal.benefitOffering.productsVasError",
        "primary.portal.benefitsOffering.dentalVision.noTaxMsg",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    minimumAflacToSelect: number;
    preSelectedAflacProduct: number;
    uniqueIndividualProductIds: number[] = [];
    uniqueADVProductIds: number[] = [];
    hasVasRenewalAflacPlanException = false;
    argusTotalEligibleEmployees: number;
    eligibleADVMinEmployeeCount: number;
    eligibleADVMaxEmployeeCount: number;
    argusEmployeesInRange = true;
    // to make alert warning visible for products if sic code is not available
    showUnavailProdsWarning$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_PEO_RULES).pipe(
        filter((peoFeatureEnable) => !!peoFeatureEnable),
        withLatestFrom(this.store.select(BenefitsOfferingState.getMPGroup)),
        switchMap(([, mpGroup]) => this.accountService.getGroupAttributesByName([IS_DEFAULT_SIC_CODE], mpGroup)),
        // default sic code will return either "true" or "false" or will be false also for an empty array
        map((isDefaultSicCode) => isDefaultSicCode.some((defaultSic) => defaultSic.value === "true")),
    );
    preSelectedProducts: number[] = [];
    isTaxIdFeatureEnabled: boolean;
    isTaxId = false;
    private disabledRows = new Set();

    constructor(
        private readonly exceptionService: ExceptionsService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly quasiService: ProductsPlansQuasiService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.checkVasException();
    }

    /**
     * Function to execute logic on initialization
     */
    ngOnInit(): void {
        this.getTaxId();
        combineLatest([
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(([argusMinValue, argusMaxValue]) => {
                    this.eligibleADVMinEmployeeCount = Number(argusMinValue);
                    this.eligibleADVMaxEmployeeCount = Number(argusMaxValue);
                    return this.benefitOfferingService.benefitOfferingSettingsData.pipe(
                        tap((censusEstimate) => {
                            this.argusTotalEligibleEmployees = censusEstimate.argusTotalEligibleEmployees;
                            this.argusEmployeesInRange =
                                this.argusTotalEligibleEmployees >= this.eligibleADVMinEmployeeCount &&
                                this.argusTotalEligibleEmployees <= this.eligibleADVMaxEmployeeCount;
                        }),
                    );
                }),
            )
            .subscribe();
        // To get agent level from user state
        this.agentLevel = this.store.selectSnapshot(UserState).agentLevel;
        this.quasiService.stepClicked$.next(1);
        this.planYearChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearChoice);
        this.planYearId = this.store.selectSnapshot(BenefitsOfferingState.GetPlanYearId);
        this.getVasPermission();
        // Made changes to check if situs state is NY to disable VAS selection
        if (this.mpGroup) {
            this.showSpinner = true;
            const configForAflacLimit = "broker.plan_year_setup.plan_choices.min_aflac_products_vas";
            forkJoin(
                this.accountService.getAccount(this.mpGroup.toString()),
                // To get the minimum number of aflac product from config to enable VAS product
                this.staticUtilService.cacheConfigValue(configForAflacLimit).pipe(take(1)),
            )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.showSpinner = false;
                        if (response[0] && response[0].situs && response[0].situs.state && response[0].situs.state.abbreviation === "NY") {
                            this.isSitusNY = true;
                        }
                        this.minimumAflacToSelect = parseInt(response[1], 10);
                        this.getProductsPanel();
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.isError = true;
                        this.errorMessage = "secondary.portal.benefitsOffering.product.responseError";
                    },
                );
        }
        // preSelectedproducts contains all the aflac products that were selected during IBO
        this.preSelectedProducts = this.store
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
            .map((product) => product.product.id);
    }

    /**
     * function to get VAS Exception
     */
    checkVasException(): void {
        this.exceptionService
            .getExceptions(this.mpGroup.toString())
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
                this.hasVasRenewalAflacPlanException = res.some(
                    (eachException) => eachException.type === ExceptionType.VAS_RENEWAL_YEAR_PRODUCT_ADD,
                );
                this.vasExceptions = res;
                this.updateDisable();
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
    getPlanYearRelatedProduct(planChoices: PlanChoice[], planYearId: number): number[] {
        const planYearPlans = planChoices.filter(
            (eachPlanChoice) => eachPlanChoice.continuous === false && eachPlanChoice.planYearId === planYearId,
        );
        const planYearProducts = planYearPlans.map((eachPlanYearChoice) => eachPlanYearChoice.plan.productId);
        const productIds = [];
        planYearProducts.forEach((prod) => {
            if (productIds.findIndex((product) => product === prod) === -1) {
                productIds.push(prod);
            }
        });
        return productIds;
    }
    /**
     * function to get Plan year related group choices
     */
    getPlanYearRelatedChoices(): void {
        const approvedPlanChoices = this.store
            .selectSnapshot(BenefitsOfferingState.getPlanChoices)
            .filter((planChoice) => planChoice.plan.policyOwnershipType === PolicyOwnershipType.GROUP);
        const approvedProductIds = this.getPlanYearRelatedProduct(approvedPlanChoices, this.planYearId);
        this.uniqueProductIds = approvedProductIds;
    }
    /**
     * Gets Plan year related Individual choices
     */
    getPlanYearRelatedIndividualChoices(): void {
        const approvedPlanChoices = this.store
            .selectSnapshot(BenefitsOfferingState.getPlanChoices)
            .filter((planChoice) => planChoice.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL);
        const approvedProductIds = this.getPlanYearRelatedProduct(approvedPlanChoices, this.planYearId);
        this.uniqueIndividualProductIds = approvedProductIds;
    }

    /**
     * Gets plan year related ADV choices
     */
    getPlanYearRelatedADVChoices(): void {
        const approvedPlanChoices = this.store
            .selectSnapshot(BenefitsOfferingState.getPlanChoices)
            .filter(
                (planChoice) =>
                    planChoice.plan.policyOwnershipType === PolicyOwnershipType.GROUP && planChoice.plan.carrierId === CarrierId.ADV,
            );
        const approvedProductIds = this.getPlanYearRelatedProduct(approvedPlanChoices, this.planYearId);
        this.uniqueADVProductIds = approvedProductIds;
    }
    /**
     * gets the products for the account
     */
    getProductsPanel(): void {
        this.quasiService.stepClicked$.next(1);
        this.products = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts));
        if (!this.isVASPermission) {
            this.products = this.products.filter((product) => !product.product.valueAddedService);
        }
        if (!this.argusEmployeesInRange) {
            this.products = this.products.map((product) => {
                if (product.product.name === VISION_PLAN || product.product.name === DENTAL_PLAN) {
                    product.groupEligibility = false;
                    product.carrier = product.carrier.filter(
                        (carriers) => carriers.name === this.aflacCarrier || carriers.name === CarrierType.VSP_INDIVIDUAL_VISION,
                    );
                    return product;
                }
                return product;
            });
        }
        this.updateVasProductIds();
        this.fetchProductChoice();
    }

    /**
     * gets the tax id for the account
     */
    getTaxId() {
        // Get feature flag value and tax id
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_TAX_ID_FOR_ABS),
            this.accountService.getGroupAttributesByName([TAX_ID]),
        ])
            .pipe(
                tap(([taxIdFeature, taxIdAttribute]) => {
                    this.isTaxIdFeatureEnabled = taxIdFeature;
                    this.isTaxId = taxIdAttribute.some(
                        (taxId) => taxId && taxId?.attribute === "tax_id" && taxId?.value && taxId?.value?.length > 0,
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Function to fetch Product Choice
     */
    fetchProductChoice(): void {
        this.unapprovedProductChoice = this.store
            .selectSnapshot(BenefitsOfferingState.GetUnapprovedPanel)
            .filter((panel) => panel.productChoice != null)
            .map((product) => product.productChoice);
        this.unApprovedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.planYearProductChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearProductChoice);
        const choice = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter((panel) => panel.productChoice != null)
            .map((product) => product.productChoice);
        if (choice.length) {
            this.productChoice = choice;
            this.checkVasPlanChoice();
            if (this.planYearChoice === null) {
                this.fetchProductsView();
            } else {
                if (this.planYearChoice && !this.planYearProductChoice.length) {
                    this.getPlanYearRelatedChoices();
                }
                this.getPlanYearRelatedIndividualChoices();
                this.getPlanYearRelatedADVChoices();
                this.fetchGroupProductsView();
            }
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
                    this.checkVasPlanChoice();
                    if (this.planYearChoice === null) {
                        this.fetchProductsView();
                    } else {
                        if (this.planYearChoice && !this.planYearProductChoice.length) {
                            this.getPlanYearRelatedIndividualChoices();
                            this.getPlanYearRelatedADVChoices();
                            this.getPlanYearRelatedChoices();
                        }
                        this.fetchGroupProductsView();
                    }
                    this.updateDisable();
                });
        }
    }

    /**
     * Gather all available group products for selection and select appropriate ones if applicable.
     */
    fetchGroupProductsView(): void {
        this.productsView = this.products
            .filter((product) => {
                if (product.product) {
                    if (product.groupEligibility) {
                        this.groupEligible = true;
                    }
                    if (product.individualEligibility) {
                        this.individualEligible = true;
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
                individual: product.individualEligibility ? this.uniqueIndividualProductIds.includes(product.product.id) : undefined,
                group: product.groupEligibility ? this.uniqueProductIds.includes(product.product.id) : undefined,
                carrier: product.carrier.map((data) => data.name),
                disabled: product.plans.map((plan) => plan.plan.disabled),
                carrierId: product.plans.map((plan) => plan.plan.carrierId),
            }));
        this.aloneVasGroup();
        this.addNewPlanYearProductChoice();
        if (this.vasProducts.length) {
            this.addVasProduct(true);
        }
        this.initializeSelection(this.fromIndividual);
        if (this.groupEligible) {
            this.initializeSelection(this.fromGroup);
        }
        this.showSpinner = false;
    }
    getGroupCarrierName(plans: any[], carrier: any[]): string[] {
        const carrierNames = [];
        const carrierIds = [];
        plans.forEach((plan) => {
            const planData = plan.plan;
            if (planData.policyOwnershipType === PolicyOwnershipType.GROUP) {
                carrierIds.push(planData.carrierId);
            }
        });
        const uniqueCarrierIds = Array.from(new Set(carrierIds));
        uniqueCarrierIds.forEach((carrierId) => {
            const index = carrier.findIndex((cr) => cr.id === carrierId);
            if (index > -1) {
                carrierNames.push(carrier[index].name);
            }
        });
        return carrierNames;
    }
    /**
     * This method is used to update vas product ids and to set @var preSelectedAflacProduct
     */
    updateVasProductIds(): void {
        this.products.forEach((prod) => {
            if (prod.product && prod.product.valueAddedService) {
                this.allVasProducts.push(prod.product);
            }
        });
        this.preSelectedAflacProduct = this.products.filter(
            (product) =>
                product.product &&
                product.productChoice &&
                product.carrier.findIndex(
                    (carrier) =>
                        carrier.name === this.aflacCarrier ||
                        carrier.name === this.aflacGroupCarrier ||
                        carrier.name === CarrierType.AFLAC_ADV_CARRIER,
                ) > -1 &&
                product.plans.some((plan) => plan.planChoice),
        ).length;
        if (this.data.opensFrom === COPY_NEW_PLAN_YEAR_CONSTANT) {
            this.preSelectedAflacProduct = 0;
        }
    }
    /**
     * This method is used to check whether inputted product has any planChoices or not
     * @param product is the inputted product for which planChoice has to be checked
     * @param option is the option which is used to filter
     * @returns boolean which determines whether inputted product has any planChoices or not
     */
    checkPlanChoice(product: any, option: string): boolean {
        return product.plans.some((plan) => plan.plan.policyOwnershipType === option.toUpperCase() && plan.planChoice !== null);
    }
    /**
     * used to check whether inputted product is already submitted or not
     * @param product is the inputted product which needs to be checked
     * @param option is the option of individual or group used to filter
     * @returns boolean which determines whether the product choice is already submitted or not
     */
    checkUnApprovedProductChoice(product: PanelModel, option: string): boolean {
        return this.unApprovedPlanChoices.some(
            (plan) =>
                plan.plan?.productId === product.product.id &&
                plan.plan?.policyOwnershipType === option.toUpperCase() &&
                !plan.requiredSetup?.includes(RequiredSetup.NOT_SUBMITTED),
        );
    }
    /**
     * Check for VAS plans
     */
    checkVasPlanChoice(): void {
        const vasPlanChoice = this.products.filter(
            (product) =>
                product.product &&
                product.product.valueAddedService &&
                product.productChoice &&
                (this.checkPlanChoice(product, this.fromGroup) ||
                    this.unapprovedProductChoice.some((prod) => prod.id === product.product.id && prod.group)),
        );
        if (vasPlanChoice.length) {
            this.hasVasPlanChoice = true;
        }
    }
    updateIndividualEligibilty(product: any): any {
        if (product.productChoice && product.productChoice.individual && this.checkPlanChoice(product, this.fromIndividual)) {
            product.individualEligibility = false;
        }
        return product;
    }
    /**
     * Update group eligibilty of the products
     * @param product
     * @returns
     */
    updateGroupEligibilty(product: any): any {
        if (
            product.productChoice &&
            product.productChoice.group &&
            (this.checkPlanChoice(product, this.fromGroup) ||
                this.unapprovedProductChoice.some((prod) => prod.id === product.product.id && prod.group))
        ) {
            product.groupEligibility = false;
        }
        return product;
    }
    /**
     * Function to fetch products to display
     */
    fetchProductsView(): void {
        this.productsView = this.products
            // eslint-disable-next-line complexity
            .filter((product) => {
                if (product.product) {
                    let productToBeRemoved = false;
                    if (product.groupEligibility && product.individualEligibility) {
                        if (
                            (product.productChoice &&
                                product.productChoice.individual &&
                                this.checkPlanChoice(product, this.fromIndividual)) ||
                            this.checkUnApprovedProductChoice(product, this.fromIndividual)
                        ) {
                            product.individualEligibility = false;
                        }
                        if (
                            (product.productChoice && product.productChoice.group && this.checkPlanChoice(product, this.fromGroup)) ||
                            this.checkUnApprovedProductChoice(product, this.fromGroup)
                        ) {
                            product.groupEligibility = false;
                        }
                        if (
                            (!product.individualEligibility && !product.groupEligibility) ||
                            (!product.individualEligibility && product.groupEligibility) ||
                            (product.individualEligibility && !product.groupEligibility)
                        ) {
                            this.hiddenProducts.push({
                                id: product.product.id,
                                individual: !product.individualEligibility,
                                group: !product.groupEligibility,
                            });
                        }
                        if (!product.individualEligibility && !product.groupEligibility) {
                            productToBeRemoved = true;
                        }
                    } else if (product.groupEligibility && !product.individualEligibility) {
                        product = this.updateGroupEligibilty(product);
                        if (!product.groupEligibility) {
                            if (!product.product.valueAddedService) {
                                this.hiddenProducts.push({ id: product.product.id, group: true });
                            } else {
                                this.vasAlreadySelected = true;
                            }
                            productToBeRemoved = true;
                        }
                    } else if (!product.groupEligibility && product.individualEligibility) {
                        product = this.updateIndividualEligibilty(product);
                        if (!product.individualEligibility) {
                            this.hiddenProducts.push({ id: product.product.id, individual: true });
                            productToBeRemoved = true;
                        }
                    }
                    if (product.product.valueAddedService) {
                        if (!this.hasVasPlanChoice) {
                            this.vasProducts.push(product);
                        }
                    } else if (!productToBeRemoved) {
                        if (product.groupEligibility) {
                            this.groupEligible = true;
                        }
                        if (product.individualEligibility) {
                            this.individualEligible = true;
                        }
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
                disabled: product.plans.map((plan) => plan.plan.disabled),
                carrierId: product.plans.map((plan) => plan.plan.carrierId),
            }));
        this.aloneVasGroup();
        this.addUnapprovedProductChoice();
        if (this.vasProducts.length) {
            this.addVasProduct();
            this.groupEligible = true;
        }
        if (this.individualEligible) {
            this.initializeSelection(this.fromIndividual);
        }
        if (this.groupEligible) {
            this.initializeSelection(this.fromGroup);
        }
        this.showSpinner = false;
    }
    addNewPlanYearProductChoice(): void {
        this.planYearProductChoice.forEach((prod) => {
            const index = this.productsView.findIndex((pr) => pr.id === prod.id);
            // eslint-disable-next-line sonarjs/no-collapsible-if
            if (index > -1) {
                if (this.productsView[index].groupEligibility) {
                    this.productsView[index].group = prod.group;
                }
                if (this.productsView[index].individualEligibility) {
                    this.productsView[index].individual = prod.individual;
                }
            }
        });
    }
    /**
     * This method is used to pre-populate unapproved product choices
     */
    addUnapprovedProductChoice(): void {
        this.unapprovedProductChoice.forEach((prod) => {
            const index = this.productsView.findIndex((pr) => pr.id === prod.id);
            if (index > -1) {
                if (this.productsView[index].individualEligibility) {
                    this.productsView[index].individual = prod.individual;
                }
                if (this.productsView[index].groupEligibility) {
                    this.productsView[index].group = prod.group;
                }
            }
        });
        const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (currentAccount && currentAccount.importType === AccountImportTypes.SHARED_CASE) {
            const approvedProductChoices: ProductSelection[] = this.store.selectSnapshot(BenefitsOfferingState.getApprovedProductChoices);
            const approvedPlanChoices: PlanChoice[] = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
            const unApprovedPlanChoices: PlanChoice[] = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
            const allAflacGroupPlanChoices = [...approvedPlanChoices, ...unApprovedPlanChoices].filter(
                (res) => res.requiredSetup && res.plan.carrierId === CarrierId.AFLAC_GROUP,
            );
            this.hiddenProducts.push(
                ...approvedProductChoices.filter(
                    (eachProductChoice) =>
                        allAflacGroupPlanChoices.findIndex((planChoice) => planChoice.plan.productId === eachProductChoice.id) !== -1,
                ),
            );
        }
    }
    aloneVasGroup(): void {
        this.productsView.forEach((prod) => {
            if (!this.vasGroupEligible) {
                this.vasGroupEligible = prod.groupEligibility ? true : false;
            }
        });
    }
    // This method will add VAS poduct to separate row.
    addVasProduct(flag?: boolean): void {
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
            group: flag ? this.newPlanYearVasChoice(id) : group,
        });
    }
    newPlanYearVasChoice(vasIds: number[]): boolean {
        let returnValue = false;
        this.planYearProductChoice.forEach((prod) => {
            if (!returnValue && vasIds.includes(prod.id)) {
                returnValue = true;
            }
        });
        if (!returnValue) {
            this.uniqueProductIds.forEach((id) => {
                if (vasIds.includes(id)) {
                    returnValue = true;
                }
            });
        }
        return returnValue;
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

    /**
     * This method will return the product choices related to that product.
     * @param id id of the product
     * @param option either individual or group
     * @returns boolean option of individual or group else if not present in unapprovedProductChoice returns false
     */
    checkEligibility(id: number, option: string): boolean {
        const choice = this.unapprovedProductChoice.filter((product) => product.id === id);
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
     * This method is used to check copied plan-year products length is greater than or equal to currently selected products length or not
     * If copied plan-year products length is greater than or equal to selected, then VAS product will disable
     */
    checkIndividualSelectionsToEnableVas(): void {
        if (
            this.data.opensFrom === COPY_NEW_PLAN_YEAR_CONSTANT &&
            !this.checkNewAflacProductSelected() &&
            !this.hasVasRenewalAflacPlanException
        ) {
            this.disabled = true;
        }
    }

    /**
     * Checks new aflac product selected
     * @returns true if new aflac product selected
     */
    checkNewAflacProductSelected(): boolean {
        let selectedProductsFromIndividual: [];
        let selectedProductsFromGroup: [];
        const selectedProducts = [];
        if (this.selection[this.fromIndividual]) {
            // selectedProductsFromIndividual contains product ids of individual aflac products that are selected
            selectedProductsFromIndividual = this.selection[this.fromIndividual].selected
                .filter(
                    (product) =>
                        this.checkAflacCarrierPlans(product.id, this.fromIndividual) &&
                        (this.fromIndividual !== this.fromGroup || !(product.individual && product.group)),
                )
                .map((product) => product.id);
        }
        if (this.selection[this.fromGroup]) {
            // selectedProductsFromGroup contains product ids of group aflac products that are selected
            selectedProductsFromGroup = this.selection[this.fromGroup].selected
                .filter(
                    (product) =>
                        (product.id === ProductId.DENTAL || product.id === ProductId.VISION) &&
                        this.checkAflacCarrierPlans(product.id, this.fromGroup),
                )
                .map((product) => product.id);
        }
        // all individual and group aflac products are pushed into selectedProducts
        selectedProducts.push(...selectedProductsFromIndividual);
        selectedProducts.push(...selectedProductsFromGroup);
        if (
            // condition is true if all pre selected products of IBO are selected during MBO
            selectedProducts.filter((selectedProduct) => this.preSelectedProducts.includes(selectedProduct)).length ===
                this.preSelectedProducts.length &&
            // condition is true if selected products during MBO are greater than pre selected products of IBO
            selectedProducts.length > this.preSelectedProducts.length
        ) {
            return true;
        }
        return false;
    }
    /**
     * This method will enable/disable checkbox for VAS product.
     */
    updateDisable(): void {
        const initialGroupCount = 0;
        // disabled property will be true if selected aflac carrier product for individual and group
        // and preselected sum count will be less than config requirement
        if (!this.isVasException) {
            this.disabled =
                this.preSelectedAflacProduct +
                    this.checkAflacCarrier(this.fromIndividual) +
                    (this.groupEligible ? this.checkAflacCarrier(this.fromGroup) : initialGroupCount) <
                this.minimumAflacToSelect;
        } else {
            this.disabled =
                this.preSelectedAflacProduct +
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
                      this.checkAflacCarrierPlans(product.id, option) &&
                      (option !== this.fromGroup || !(product.individual && product.group)),
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
        const productData: PanelModel = this.products.find((product) => product.product.id === productId);
        return (
            productData &&
            productData.plans &&
            productData.plans.some(
                (plan) =>
                    (plan.plan.carrierNameOverride === CarrierType.AFLAC_CARRIER ||
                        plan.plan.carrierNameOverride === this.aflacGroupCarrier ||
                        plan.plan.carrierId === CarrierId.ADV) &&
                    plan.plan.policyOwnershipType ===
                        (option === this.fromGroup ? PolicyOwnershipType.GROUP : PolicyOwnershipType.INDIVIDUAL),
            )
        );
    }

    // This will return boolean whether disabled is true or false.
    isDisabled(row: any, option?: string): boolean {
        if ((row.valueAddedService && this.disabled) || this.handleMissingTaxId(row, option)) {
            return true;
        }
        return false;
    }

    /**
     * This method will return boolean value whether all checkbox is checked or not.
     * @param option specifies whether to select group or individual products
     * @returns boolean indicating whether all products in specified product category are selected
     */
    isAllSelected(option: string): boolean {
        const numSelected = this.selection[option] ? this.selection[option].selected.length : 0;
        const disableRows = this.disabledRows ? this.disabledRows.size : 0;
        const numRows = this.numRows[option];
        if (option === this.GROUP && this.disabledRows.size) {
            const totalRows = numRows - disableRows;
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
            }
        });
    }
    // This method will select all the checkbox.
    updateProducts(option: string): void {
        this.productsView.forEach((product) => {
            if (product[option] !== undefined && !this.handleMissingTaxId(product, option)) {
                product[option] = true;
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
            }
        });
        this.updateDisable();
    }

    // Checks if ABS, tax id is missing and is a group product
    private handleMissingTaxId(row: any, option: string): boolean {
        // checks if feature config is on
        if (this.isTaxIdFeatureEnabled) {
            const isABS = row.carrierId?.some((id) => id === 70);
            const isTaxIdMissing = row.disabled?.some((disable) => disable === true);
            if (option === "group" && isABS && isTaxIdMissing) {
                this.disabledRows.add(row);
                return true;
            }
            return false;
        }
        return false;
    }
    // This method will return all the checked products.
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
    onNext(): void {
        this.isError = false;
        this.getCheckedProducts();
        if (this.selectedProducts.length) {
            const currentProductObservables: Observable<void>[] = [];
            this.showSpinner = true;
            const choicesObservable = [];
            this.selectedProducts.forEach((prod) => {
                if (
                    this.productChoice.findIndex((ch) => ch.id === prod.id) === -1 &&
                    this.unapprovedProductChoice.findIndex((ch) => ch.id === prod.id) === -1
                ) {
                    currentProductObservables.push(
                        this.benefitOfferingService.deleteProductChoice(prod.id, this.mpGroup).pipe(
                            switchMap((response) => this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup)),
                            map((planOfferings) => {
                                if (!planOfferings.length) {
                                    this.showSpinner = false;
                                }
                                return planOfferings.filter(
                                    (planOffering) => planOffering.plan.productId === prod.id && !planOffering.plan.rider,
                                );
                            }),
                            switchMap((planOfferings) =>
                                planOfferings && planOfferings.length
                                    ? forkJoin(
                                          planOfferings.map((plan) =>
                                              this.benefitOfferingService.deletePlanChoice(
                                                  {},
                                                  plan.id,
                                                  this.mpGroup,
                                                  this.enrollmentEndDate,
                                              ),
                                          ),
                                      )
                                    : of(null),
                            ),
                            catchError((error) => of(error)),
                        ),
                    );

                    choicesObservable.push(this.benefitOfferingService.createProductChoice(prod, this.mpGroup));
                } else if (
                    this.productChoice.findIndex((ch) => ch.id === prod.id) > -1 ||
                    this.unapprovedProductChoice.findIndex((ch) => ch.id === prod.id) > -1
                ) {
                    const index = this.hiddenProducts.findIndex((pr) => pr.id === prod.id);
                    if (index > -1) {
                        const individual = this.hiddenProducts[index].individual;
                        const group = this.hiddenProducts[index].group;
                        const product: ProductSelection = { id: prod.id, individual: false, group: false };
                        if (individual && !group) {
                            product.individual = individual;
                            product.group = prod.group;
                        } else if (!individual && group) {
                            product.group = group;
                            product.individual = prod.individual;
                        }
                        currentProductObservables.push(
                            this.benefitOfferingService
                                .updateProductChoice(this.hiddenProducts[index], this.mpGroup)
                                .pipe(catchError((error) => of(error))),
                        );
                        choicesObservable.push(this.benefitOfferingService.updateProductChoice(product, this.mpGroup));
                    } else {
                        currentProductObservables.push(this.setExistingUpdateProductChoice(prod));
                        choicesObservable.push(this.benefitOfferingService.updateProductChoice(prod, this.mpGroup));
                    }
                }
            });

            // Fetch IDs of products which have planChoices
            const planChoicesProductIds = this.store
                .selectSnapshot(BenefitsOfferingState.getpanelProducts)
                .filter((product) => product.product && product.productChoice && product.plans.some((plan) => plan.planChoice !== null))
                .map((product) => product.product.id);

            this.productChoice.forEach((choice) => {
                const index = this.hiddenProducts.findIndex((pro) => pro.id === choice.id);
                if (
                    this.selectedProducts.findIndex((pro) => pro.id === choice.id) === -1 &&
                    index === -1 &&
                    planChoicesProductIds.includes(choice.id)
                ) {
                    const vasIndex = this.allVasProducts.findIndex((pro) => pro.id === choice.id);
                    if (vasIndex === -1 || (vasIndex > -1 && !this.hasVasPlanChoice)) {
                        choicesObservable.push(
                            this.benefitOfferingService.deleteProductChoice(choice.id, this.mpGroup).pipe(
                                switchMap((response) => this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup)),
                                map((planOfferings) => {
                                    if (!planOfferings.length) {
                                        this.showSpinner = false;
                                    }
                                    return planOfferings.filter(
                                        (planOffering) => planOffering.plan.productId === choice.id && !planOffering.plan.rider,
                                    );
                                }),
                                switchMap((planOfferings) =>
                                    planOfferings && planOfferings.length
                                        ? forkJoin(
                                              planOfferings.map((plan) =>
                                                  this.benefitOfferingService.deletePlanChoice(
                                                      {},
                                                      plan.id,
                                                      this.mpGroup,
                                                      this.enrollmentEndDate,
                                                  ),
                                              ),
                                          )
                                        : of(null),
                                ),
                            ),
                        );
                    }
                } else if (this.selectedProducts.findIndex((pro) => pro.id === choice.id) === -1 && index > -1) {
                    choicesObservable.push(this.benefitOfferingService.updateProductChoice(this.hiddenProducts[index], this.mpGroup));
                }
            });
            this.unapprovedProductChoice.forEach((choice) => {
                const index = this.hiddenProducts.findIndex((pro) => pro.id === choice.id);
                if (
                    this.selectedProducts.findIndex((pro) => pro.id === choice.id) === -1 &&
                    index === -1 &&
                    this.productChoice.findIndex((pro) => pro.id === choice.id) === -1
                ) {
                    choicesObservable.push(
                        this.benefitOfferingService.deleteProductChoice(choice.id, this.mpGroup).pipe(
                            switchMap((response) => this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup)),
                            map((planOfferings) => {
                                if (!planOfferings.length) {
                                    this.showSpinner = false;
                                }
                                return planOfferings.filter(
                                    (planOffering) => planOffering.plan.productId === choice.id && !planOffering.plan.rider,
                                );
                            }),
                            switchMap((planOfferings) =>
                                planOfferings && planOfferings.length
                                    ? forkJoin(
                                          planOfferings.map((plan) =>
                                              this.benefitOfferingService.deletePlanChoice(
                                                  {},
                                                  plan.id,
                                                  this.mpGroup,
                                                  this.enrollmentEndDate,
                                              ),
                                          ),
                                      )
                                    : of(null),
                            ),
                        ),
                    );
                } else if (
                    this.selectedProducts.findIndex((pro) => pro.id === choice.id) === -1 &&
                    index > -1 &&
                    this.productChoice.findIndex((pro) => pro.id === choice.id) === -1
                ) {
                    choicesObservable.push(this.benefitOfferingService.updateProductChoice(this.hiddenProducts[index], this.mpGroup));
                }
            });
            forkJoin(choicesObservable).subscribe(
                (resp) => {
                    this.benefitOfferingService.getProductChoices(this.mpGroup, false).subscribe(
                        (result) => {
                            this.showSpinner = false;
                            this.quasiService.setProducts(currentProductObservables);
                            this.store.dispatch(new MapProductChoiceToPanelProduct(result));
                            this.store.dispatch(new MapProductChoiceToUnapprovedPanelProduct(this.selectedProducts));
                            this.quasiService.defaultStepPositionChanged$.next(3);
                        },
                        (error) => {
                            this.showSpinner = false;
                            this.isError = true;
                            this.errorMessage = "primary.portal.common.servertimeout";
                        },
                    );
                },
                (error) => {
                    this.showSpinner = false;
                    this.isError = true;
                    if (error.status === AppSettings.API_RESP_409 && error.error.code === "invalidState") {
                        this.errorMessage = "secondary.api.409.invalidState";
                    } else if (error.status === AppSettings.API_RESP_403 && error.error.code === "prerequisiteFailed") {
                        this.errorMessage = "secondary.api.403.forbidden";
                    } else if (error.status === AppSettings.API_RESP_404 && error.error.code === "notFound") {
                        this.errorMessage = "secondary.portal.benefitsOffering.404.notFound";
                    } else if (error.status === AppSettings.API_RESP_408) {
                        this.errorMessage = "primary.portal.common.servertimeout";
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.errorMessage = "secondary.api.500.internalServerError";
                    }
                },
            );
        } else {
            this.isError = true;
            this.errorMessage = "secondary.portal.benefitsOffering.product.requirementError";
        }
    }

    onBack(): void {
        this.quasiService.stepClicked$.next(0);
    }
    // This method will unsubscribe all the api subscription.
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    nextClicked(): void {
        if (this.planYearChoice === null) {
            this.onNext();
        } else if (this.planYearChoice !== null) {
            this.nextPlanYearChoice();
        }
    }
    /**
     * method to update new plan year product selection choice
     */
    nextPlanYearChoice(): void {
        this.isError = false;
        this.getCheckedProducts();
        if (this.selectedProducts.length) {
            this.showSpinner = true;
            const choicesObservable = [];
            const currentProductObservables: Observable<void>[] = [];
            this.selectedProducts.forEach((prod) => {
                if (
                    this.productChoice.findIndex((ch) => ch.id === prod.id) === -1 &&
                    this.unapprovedProductChoice.findIndex((ch) => ch.id === prod.id) === -1
                ) {
                    // If the selected product choice is not in existing choices and unapproved choices
                    // push delete observable to delete on close of dialog
                    currentProductObservables.push(
                        this.benefitOfferingService.deleteProductChoice(prod.id, this.mpGroup).pipe(catchError((error) => of(error))),
                    );
                    // create new product choice
                    choicesObservable.push(this.benefitOfferingService.createProductChoice(prod, this.mpGroup));
                } else if (
                    this.productChoice.findIndex((ch) => ch.id === prod.id) > -1 ||
                    this.unapprovedProductChoice.findIndex((ch) => ch.id === prod.id) > -1
                ) {
                    // If the selected product choice is in existing choices
                    const choice = this.productChoice.find((ch) => ch.id === prod.id);
                    const product: ProductSelection = { id: prod.id, individual: false, group: false };
                    product.individual = (choice && choice.individual) || prod.individual;
                    product.group = (choice && choice.group) || prod.group;
                    if (choice) {
                        currentProductObservables.push(
                            this.benefitOfferingService.updateProductChoice(choice, this.mpGroup).pipe(catchError((error) => of(error))),
                        );
                    }
                    choicesObservable.push(this.benefitOfferingService.updateProductChoice(product, this.mpGroup));
                } else {
                    currentProductObservables.push(this.setExistingUpdateProductChoice(prod));
                    choicesObservable.push(this.benefitOfferingService.updateProductChoice(prod, this.mpGroup));
                }
            });
            const prodChoice = this.store.selectSnapshot(BenefitsOfferingState.GetNewPlanYearProductChoice);
            if (prodChoice.length) {
                // Logic to execute when product is unselected in current flow by coming back
                prodChoice.forEach((product) => {
                    if (this.selectedProducts.findIndex((pro) => pro.id === product.id) === -1) {
                        const index = this.productChoice.findIndex((pro) => pro.id === product.id);
                        if (index === -1) {
                            const indexId = this.unapprovedProductChoice.findIndex((pro) => pro.id === product.id);
                            if (indexId !== -1) {
                                // Deletes unapproved product choices
                                choicesObservable.push(
                                    this.benefitOfferingService
                                        .deleteProductChoice(product.id, this.mpGroup)
                                        .pipe(switchMap((response) => this.deleteUnApprovedPlanChoices(product.id))),
                                );
                            }
                        } else {
                            // reverts approved product choice
                            choicesObservable.push(
                                this.benefitOfferingService
                                    .updateProductChoice(this.productChoice[index], this.mpGroup)
                                    .pipe(switchMap((response) => this.deleteUnApprovedPlanChoices(this.productChoice[index].id))),
                            );
                        }
                    }
                });
            }
            forkJoin(choicesObservable)
                .pipe(
                    switchMap((resp) =>
                        forkJoin([
                            this.benefitOfferingService.getProductChoices(this.mpGroup, false),
                            this.benefitOfferingService.getProductChoices(this.mpGroup, true),
                        ]),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (results) => {
                        this.quasiService.setProducts(currentProductObservables);
                        this.showSpinner = false;
                        this.store.dispatch(new MapProductChoiceToPanelProduct(results[0]));
                        this.store.dispatch(new MapProductChoiceToUnapprovedPanelProduct(results[1]));
                        this.store.dispatch(new MapProductChoiceToNewPlanYearPanel(this.selectedProducts));
                        this.quasiService.defaultStepPositionChanged$.next(3);
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.isError = true;
                        this.errorMessage = "primary.portal.common.servertimeout";
                    },
                );
        } else {
            this.isError = true;
            this.errorMessage = "secondary.portal.benefitsOffering.product.requirementError";
        }
    }
    /**
     * deletes unapproved plan choices of a product
     * @param productId indicates product id
     * @returns observable of void
     */
    deleteUnApprovedPlanChoices(productId: number): Observable<void> {
        return this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup).pipe(
            map((planOfferings) =>
                planOfferings.filter((planOffering) => planOffering.plan.productId === productId && !planOffering.plan.rider),
            ),
            switchMap((planOfferings) =>
                planOfferings && planOfferings.length
                    ? forkJoin(
                          planOfferings.map((plan) =>
                              this.benefitOfferingService.deletePlanChoice({}, plan.id, this.mpGroup, this.enrollmentEndDate),
                          ),
                      )
                    : of(null),
            ),
            catchError((error) => of(error)),
        );
    }
    /**
     * This method is used to check inputted productSelection in existing product choices
     * @param prod is current ProductSelection
     * @returns update product choice Observable
     */
    setExistingUpdateProductChoice(prod: ProductSelection): Observable<void> {
        return this.productChoice.findIndex((ch) => ch.id === prod.id) > -1
            ? this.benefitOfferingService
                  .updateProductChoice(this.productChoice[this.productChoice.findIndex((ch) => ch.id === prod.id)], this.mpGroup)
                  .pipe(catchError((error) => of(error)))
            : this.benefitOfferingService
                  .updateProductChoice(
                      this.unapprovedProductChoice[this.unapprovedProductChoice.findIndex((ch) => ch.id === prod.id)],
                      this.mpGroup,
                  )
                  .pipe(catchError((error) => of(error)));
    }
    /**
     * This method will open wellthie pop up
     */
    openWellthiePopup(): void {
        this.empoweredModalService.openDialog(WellthiePopupComponent, {
            data: { accessedFrom: AccessedFrom.BENEFIT_SELECTION },
        });
    }
}
