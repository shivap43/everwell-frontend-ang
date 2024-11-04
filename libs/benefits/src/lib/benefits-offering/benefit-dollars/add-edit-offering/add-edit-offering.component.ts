import { Component, OnInit, OnChanges, OnDestroy, ViewChild, Output, EventEmitter, Inject } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { BenefitDollars, AccountService, FlexDollar, BenefitDollarData } from "@empowered/api";
import { Observable, Subject, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Store, Select } from "@ngxs/store";
import { takeUntil, switchMap, catchError, take } from "rxjs/operators";
import { BenefitsOfferingState, SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ClientErrorResponseCode, PayFrequency, PayFrequencyObject, AppSettings, Product, ContributionType } from "@empowered/constants";

const MAX_LENGTH_FOR_NAME = 200;
const MAX_LENGTH_FOR_DESCRIPTION = 1000;
const SAVE = "save";
const COMMA = ",";
const MIN_LENGTH_FLAT_AMOUNT = 10;

@Component({
    selector: "empowered-add-edit-offering",
    templateUrl: "./add-edit-offering.component.html",
    styleUrls: ["./add-edit-offering.component.scss"],
})
export class AddEditOfferingComponent implements OnInit, OnChanges, OnDestroy {
    offeringForm: FormGroup;
    displaySuffixPrefix = false;
    offeringName = "";
    amount: number;
    percentageAmount: number;
    initialAudienceGroupingIds: number[] = [];
    payFrequency: PayFrequency;
    payFrequencies: PayFrequency[];
    allProducts: Product[];
    currentOffering: FlexDollar;
    selectedProduct: Product;
    isProductChecked = false;
    filteredProducts: Observable<Product[]>;
    lastProductFilter: string;

    mpGroup: number;
    isAddForm: boolean;
    isEditForm: boolean;
    isLoading = false;
    CLAZZ_STRING = "CLAZZ";
    REGION = "REGION";
    NAME = "name";
    ID = "id";
    DESCRIPTION = "description";
    CONTRIBUTION_TYPE = "contributionType";
    AMOUNT = "amount";
    PERCENTAGE_AMOUNT = "percentageAmount";
    CLASSES = "classes";
    REGIONS = "regions";
    PRODUCTS = "products";
    PAY_FREQUENCY_DATA = "payFrequency";
    AUDIENCE_GROUPING_ID = "audienceGroupingId";
    APPLICABLE_PRODUCT_ID = "applicableProductId";
    STRING = "string";
    TYPE = "type";
    displayPercentageSuffix = false;
    MIN_PERCENTAGE_AMOUNT = 0.01;
    amountTypeVal: string;
    amountControlValue: string;
    percentageSuffix = BenefitDollars.PERCENTAGE;
    FIXING_VALUE = 2;
    PERCENTAGE_MAX = 100;
    payFrequencyObject: PayFrequencyObject;
    isDuplicateFlexDollar = false;
    MONTHLY = "MONTHLY";
    errorMessage: string;
    benefitDollars = BenefitDollars;
    addForm = false;
    editForm = false;
    regexForAmount: string;
    @ViewChild("productInput") productInput;
    @Output() emitCancelSave = new EventEmitter<string>();
    @Output() emitIsAdd = new EventEmitter<boolean>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.offeringName",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.newOffering",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.name.maxChar",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.description.maxChar",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.description",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.employeeAccess",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.classess",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.regions",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.products",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.offeringAmount",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.monthly",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.searchProduct",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.searchRegion",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.searchClasses",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.employeeAccessDesc",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.productsApply",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.productsApplyDesc",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.flatAmountValidation",
        "primary.portal.common.requiredField",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.selectAll",
        "primary.portal.common.saveOffering",
        "primary.portal.common.cancel",
        "primary.portal.common.updateOffering",
        "primary.portal.common.optional",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.discount",
        "primary.portal.common.selectOption",
        "primary.portal.common.placeholderSelect",
        "primary.portal.benefitsOffering.product.validation",
        "primary.portal.qle.addNewQle.badParameter",
        "primary.portal.census.editEstimate.nonZero",
        "primary.portal.common.edit",
        "primary.portal.applicationFlow.beneficiary.percentCannotBeZero",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.percentageAmountValidation",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.newBenefitDollarOffering",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.editBenefitDollarOffering",
        "primary.portal.benefitOffering.offeringAmount.flatAmount",
        "primary.portal.benefitOffering.offeringAmount.percentage",
    ]);
    secondaryLanguages: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.maxLength200",
        "secondary.portal.common.maxLength1000",
    ]);

    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isPercentage: boolean;
    constructor(
        private readonly fb: FormBuilder,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly dialogRef: MatDialogRef<AddEditOfferingComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: BenefitDollarData,
    ) {}
    /**
     * @function ngOnInit
     * @description To set-up initial data for the component
     * @returns {void}
     */
    ngOnInit(): void {
        this.payFrequency = this.data.payFrequency;
        this.payFrequencies = this.data.payFrequencies;
        this.currentOffering = this.data.currentOffering;
        this.allProducts = this.data.allProducts;
        this.staticUtilService
            .cacheConfigValue("general.benefitDollar.excluded.product.ids")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productIds) => {
                const excludeProductIds = productIds.split(COMMA);
                this.allProducts = this.allProducts.filter((data) => !excludeProductIds.includes(data.id.toString()));
            });
        this.isLoading = true;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regex) => {
            this.regexForAmount = regex.BENEFITDOLLARAMOUNT;
            this.constructFormControls();
        });
        if (this.currentOffering === undefined) {
            this.addForm = true;
        } else {
            this.editForm = true;
            this.patchFormValues();
        }
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.createListener();
        this.updateValidations();
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars.classes_and_regions")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    /**
     * @function ngOnChanges
     * @description To track changes of edit benefit dollars (while edit)
     * @returns {void}
     */
    ngOnChanges(): void {
        this.getAddEditDetails();
    }
    /**
     * @function getAddEditDetails
     * @description method to handle details on add and edit of Benefit dollars
     * @returns {void}
     */
    getAddEditDetails(): void {
        this.payFrequencyObject = {
            payFrequencies: this.payFrequencies,
            pfType: this.payFrequency.name,
            payrollsPerYear: 0,
        };
        if (this.payFrequencyObject.payFrequencies) {
            const monthlyPayFrequency = this.payFrequencyObject.payFrequencies.find((ele) => ele.frequencyType === this.MONTHLY);
            this.payFrequencyObject.payrollsPerYear = monthlyPayFrequency.payrollsPerYear;
        }
        this.patchFormValues();
        this.filteredProducts = of(this.allProducts);
    }
    /**
     * @function patchFormValues
     * @description method to set existing values to the form in edit mode
     * @returns {void}
     */
    patchFormValues(): void {
        if (this.currentOffering) {
            this.isEditForm = true;
            this.isAddForm = false;
            this.editForm = true;
            this.addForm = false;
            this.offeringForm.get(this.NAME).patchValue(this.currentOffering.name);
            this.offeringName = this.currentOffering.name;
            this.offeringForm.get(this.CONTRIBUTION_TYPE).patchValue(this.currentOffering.contributionType);
            this.offeringForm.get(this.CONTRIBUTION_TYPE).setValue(this.currentOffering.contributionType);
            this.amountTypeVal = this.currentOffering.contributionType;
            this.amountControlValue =
                this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
                    ? this.AMOUNT
                    : this.PERCENTAGE_AMOUNT;

            if (this.currentOffering.contributionType === ContributionType.FLAT_AMOUNT) {
                this.offeringForm.get(this.amountControlValue).patchValue(this.currentOffering.amount.toFixed(this.FIXING_VALUE));
                this.amount = this.currentOffering.amount;
                this.isPercentage = false;
            } else {
                this.percentageAmount = this.currentOffering.amount;
                this.offeringForm.get(this.amountControlValue).patchValue(this.currentOffering.amount);
                this.isPercentage = true;
            }
            this.offeringForm.get(this.DESCRIPTION).patchValue(this.currentOffering.description);
            if (this.currentOffering.applicableProductId) {
                let productSelected: number;
                this.allProducts.forEach((element) => {
                    if (element.id === this.currentOffering.applicableProductId) {
                        productSelected = element.id;
                        this.selectedProduct = element;
                    }
                });
                this.offeringForm.get(this.PRODUCTS).setValue(productSelected);
            }
        } else {
            this.offeringForm.get(this.CONTRIBUTION_TYPE).patchValue(this.benefitDollars.FLAT_AMOUNT);
            this.amountTypeVal = this.benefitDollars.FLAT_AMOUNT;
            this.amountControlValue =
                this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
                    ? this.AMOUNT
                    : this.PERCENTAGE_AMOUNT;
            this.setDefaultValues();
            this.editForm = false;
            this.addForm = true;
            this.isEditForm = false;
            this.isAddForm = true;
            this.emitIsAdd.emit(true);
        }
    }
    /**
     * @function setDefaultValues
     * @description method to set default values for the amount fields
     * @returns {void}
     */
    setDefaultValues(): void {
        const defaultAmount = 0;
        this.offeringForm
            .get(this.amountControlValue)
            .patchValue(
                this.offeringForm.get(this.CONTRIBUTION_TYPE).value === this.benefitDollars.FLAT_AMOUNT
                    ? defaultAmount.toFixed(this.FIXING_VALUE)
                    : defaultAmount,
            );
    }

    /**
     * @function constructFormControls
     * @description method to construct form controls for creating or editing benefit dollars
     * @returns {void}
     */
    constructFormControls(): void {
        this.offeringForm = this.fb.group({
            name: [
                this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution"],
                {
                    validators: Validators.compose([Validators.required, Validators.maxLength(MAX_LENGTH_FOR_NAME), this.noWhitespace]),
                },
            ],
            description: [
                "",
                {
                    validators: Validators.compose([
                        Validators.required,
                        Validators.maxLength(MAX_LENGTH_FOR_DESCRIPTION),
                        this.noWhitespace,
                    ]),
                },
            ],
            products: ["", [Validators.required]],
            contributionType: [this.benefitDollars.FLAT_AMOUNT],
            amount: [
                "",
                [
                    Validators.required,
                    Validators.min(AppSettings.MIN_AMOUNT),
                    // Regex for maximum 10 digits and maximum 2 decimal places
                    Validators.pattern(new RegExp(this.regexForAmount)),
                ],
            ],
            percentageAmount: ["", [Validators.required, Validators.min(this.MIN_PERCENTAGE_AMOUNT), Validators.max(this.PERCENTAGE_MAX)]],
        });
        this.amountControlValue =
            this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT ? this.AMOUNT : this.PERCENTAGE_AMOUNT;
        this.amountTypeVal = this.benefitDollars.FLAT_AMOUNT;
        this.setDefaultValues();
    }

    /**
     * @function noWhitespace
     * @description method to create custom validator to trim white spaces
     * @param control {FormControl} instance of the form-control
     * @returns {Validators}
     */
    noWhitespace(control: FormControl): Validators {
        return (control.value || "").trim().length === 0 ? { whitespace: true } : null;
    }
    /**
     * @function fieldValidation
     * @description method to validate form fields
     * @param fieldType {FormControl} instance of the form-control name
     * @param selectedList {array} instance of selected list of that form control
     * @returns {void}
     */
    private fieldValidation(fieldType: string, selectedList: []): void {
        const fieldName = this.offeringForm.get(fieldType);
        if (selectedList.length > 0) {
            fieldName.clearValidators();
            fieldName.setErrors({ required: null });
            fieldName.updateValueAndValidity();
        } else {
            fieldName.setValidators([Validators.required]);
            fieldName.markAsTouched();
            fieldName.setErrors({ required: true });
            fieldName.updateValueAndValidity();
        }
    }
    /**
     * @function cancel
     * @description method to close the quasi modal on click of cancel
     * @returns {void}
     */
    cancel(): void {
        this.currentOffering = null;
        this.emitCancelSave.emit("cancel");
        this.dialogRef.close({ data: "cancel" });
    }
    /**
     * @function saveOffering
     * @description method called on saving or updating the flex dollars
     * @returns {void}
     */
    saveOffering(): void {
        if (this.offeringForm.valid) {
            this.isLoading = true;
            const productId = this.offeringForm.controls.products.value;

            const offeringObject: FlexDollar = {
                name: null,
                description: null,
                amount: null,
                contributionType: null,
                audienceGroupingId: null,
                applicableProductId: null,
            };

            if (this.addForm) {
                offeringObject[this.AUDIENCE_GROUPING_ID] = null;
                this.createFlexDollar(offeringObject, productId).subscribe();
            } else {
                this.updateOffering(offeringObject, productId);
            }
        }
    }
    /**
     * @function createFlexDollar
     * @description method to construct data for calling a service to create benefit dollars
     * @param offeringObject {FlexDollar}  array of form data objects
     * @param productId {number} product Id for this account
     * @returns {void}
     */
    createFlexDollar(offeringObject: FlexDollar, productId: number): Observable<void> {
        offeringObject[this.NAME] = this.offeringForm.controls.name.value;
        offeringObject[this.DESCRIPTION] = this.offeringForm.value[this.DESCRIPTION];
        offeringObject[this.AMOUNT] = this.offeringForm.value[this.amountControlValue];
        offeringObject[this.CONTRIBUTION_TYPE] = this.offeringForm.value[this.CONTRIBUTION_TYPE];
        offeringObject[this.APPLICABLE_PRODUCT_ID] = productId;
        if (this.offeringForm.get(this.CONTRIBUTION_TYPE).value === this.benefitDollars.FLAT_AMOUNT) {
            offeringObject[this.PAY_FREQUENCY_DATA] = this.payFrequency;
        }
        return this.accountService.createFlexDollar(offeringObject, this.mpGroup).pipe(
            take(1),
            switchMap((result) => {
                this.emitCancelSave.emit(SAVE);
                this.isLoading = false;
                this.dialogRef.close({ data: SAVE });
                return of(null);
            }),
            catchError((err) => {
                this.isLoading = false;
                this.errorHandlingMethod(err.status);
                return of(null);
            }),
        );
    }
    /**
     * @function errorHandlingMethod
     * @description method to handle API errors for create and update flex dollars
     * @param errorStatus {number}  error status which API returns
     * @returns {void}
     */
    errorHandlingMethod(errorStatus: number): void {
        this.emitCancelSave.emit(SAVE);
        if (errorStatus === ClientErrorResponseCode.RESP_409) {
            this.isDuplicateFlexDollar = true;
            this.errorMessage = this.languageStrings["primary.portal.benefitsOffering.product.validation"];
        } else if (errorStatus === ClientErrorResponseCode.RESP_400) {
            this.isDuplicateFlexDollar = true;
            this.errorMessage = this.languageStrings["primary.portal.qle.addNewQle.badParameter"];
        }
    }
    /**
     * @function updateOffering
     * @description method to construct data to call API to update flex dollars
     * @param offeringObject {FlexDollar}  array of form data objects
     * @param productId {number}  that holds the selected product Ids
     * @returns {void}
     */
    updateOffering(offeringObject: FlexDollar, productId: number): void {
        offeringObject[this.NAME] = this.offeringForm.controls.name.value;
        offeringObject[this.DESCRIPTION] = this.offeringForm.value[this.DESCRIPTION];
        offeringObject[this.CONTRIBUTION_TYPE] = this.offeringForm.value[this.CONTRIBUTION_TYPE];
        offeringObject[this.AMOUNT] = this.offeringForm.value[this.amountControlValue];
        offeringObject[this.APPLICABLE_PRODUCT_ID] = productId;
        if (this.offeringForm.get(this.CONTRIBUTION_TYPE).value === this.benefitDollars.FLAT_AMOUNT) {
            offeringObject[this.PAY_FREQUENCY_DATA] = this.payFrequency;
        }
        offeringObject[this.AUDIENCE_GROUPING_ID] = null;
        this.updateFlexDollars(offeringObject);
    }
    /**
     * @function updateFlexDollars
     * @description method to construct data for calling a service to update benefit dollars
     * @param offeringObject {FlexDollar}  array of form data objects
     * @returns {void}
     */
    updateFlexDollars(offeringObject: FlexDollar): void {
        this.accountService
            .updateFlexDollar(this.currentOffering.id, offeringObject, this.mpGroup)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.emitCancelSave.emit(SAVE);
                    this.dialogRef.close({ data: SAVE });
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                    this.errorHandlingMethod(err.status);
                },
            );
    }
    /**
     * @function createListener
     * @description method to handle value changes on form fields
     * @returns {void}
     */
    createListener(): void {
        if (this.offeringForm.get(this.NAME) !== null) {
            this.offeringForm
                .get(this.NAME)
                .valueChanges.pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.offeringName = res;
                });
        }
        this.offeringForm
            .get(this.amountControlValue)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (this.offeringForm.controls.contributionType.value === BenefitDollars.FLAT_AMOUNT) {
                    this.amount = res;
                } else {
                    this.percentageAmount = res;
                }
            });
    }
    /**
     * @function selectProduct
     * @description method to handle selection of products drop down
     * @param id {number} its the id of the selected product
     * @returns {void}
     */
    selectProduct(id: number): void {
        this.allProducts.forEach((element) => {
            if (element.id === id) {
                this.selectedProduct = element;
                this.offeringForm.controls.name.patchValue(
                    this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution"] +
                        element.name,
                );
            }
        });
    }
    /**
     * @function changeAmountType
     * @description method to handle change on contribution type radio buttons
     * @param event {string} its an event to get the value of radio-button at that instance
     * @returns {void}
     */
    changeAmountType(event: string): void {
        if (event) {
            this.amountTypeVal = event;
            this.updateValidations();
            this.offeringForm.get(this.CONTRIBUTION_TYPE).patchValue(this.amountTypeVal);
            this.amountControlValue = this.amountTypeVal === this.benefitDollars.FLAT_AMOUNT ? this.AMOUNT : this.PERCENTAGE_AMOUNT;
            if (this.offeringForm.get(this.amountControlValue).value === "") {
                this.setDefaultValues();
            }
        }
    }
    /**
     * @function updateValidations
     * @description method to handle amount form-control validations based on radio button selection
     * @returns {void}
     */
    updateValidations(): void {
        if (this.amountTypeVal === this.benefitDollars.FLAT_AMOUNT) {
            this.amountControlValue = this.AMOUNT;
            this.offeringForm.controls.amount.markAsPristine();
            this.offeringForm.controls.amount.markAsUntouched();
            this.offeringForm.controls.percentageAmount.clearValidators();
            this.offeringForm.controls.amount.setValidators([
                Validators.required,
                Validators.min(AppSettings.MIN_AMOUNT),
                Validators.pattern(new RegExp(this.regexForAmount)),
            ]);
        } else {
            this.amountControlValue = this.PERCENTAGE_AMOUNT;
            this.offeringForm.controls.percentageAmount.markAsPristine();
            this.offeringForm.controls.percentageAmount.markAsUntouched();
            this.offeringForm.controls.amount.clearValidators();
            this.offeringForm.controls.percentageAmount.setValidators([
                Validators.required,
                Validators.min(this.MIN_PERCENTAGE_AMOUNT),
                Validators.max(this.PERCENTAGE_MAX),
            ]);
        }
        this.offeringForm.controls.amount.updateValueAndValidity();
        this.offeringForm.controls.percentageAmount.updateValueAndValidity();
    }
    /**
     * @function restrictNegativeValue
     * @description restricts minus in the input
     * @param event holds the keypress event object
     * @memberof AddEditOfferingComponent
     */
    restrictNegativeValue(event: KeyboardEvent): void {
        if (event.key === "-") {
            event.preventDefault();
        }
    }

    /**
     * @function ngOnDestroy
     * @description ng life cycle hook used to unsubscribe all subscriptions
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
