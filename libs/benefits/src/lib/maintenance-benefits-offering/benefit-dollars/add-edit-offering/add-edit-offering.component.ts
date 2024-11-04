import { BenefitDollars } from "@empowered/api";
import { PayFrequency, PayFrequencyObject, AppSettings, Product } from "@empowered/constants";
import { Component, OnInit, EventEmitter, Output, ViewChild, Input, OnChanges, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RegionNames, ClassNames, AccountService, FlexDollar } from "@empowered/api";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { startWith, map, takeUntil } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Select } from "@ngxs/store";
import { SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";

const MAX_LENGTH_FOR_DESCRIPTION = 1000;
const SAVE = "save";
const COMMA = ",";
const RADIX = 10;
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
    amount = "";
    percentageAmount = "";
    initialAudienceGroupingIds = [];
    @Input() payFrequency: PayFrequency;
    @Input() payFrequencies: PayFrequency[];

    @Input() allRegions: any;
    selectedRegionList: RegionNames[] = [];
    isRegionChecked = false;
    filteredRegions: Observable<any[]>;
    lastRegionFilter: string;

    @Input() allClasses;
    selectedClassList: ClassNames[] = [];
    isClassChecked = false;
    filteredClasses: Observable<any[]>;
    lastClassFilter: string;

    @Input() allProducts: Product[];
    selectedProduct: Product;
    isProductChecked = false;
    lastProductFilter: string;

    mpGroup: number;
    isAddForm: boolean;
    isEditForm: boolean;
    isLoading = false;
    CLAZZ = "CLAZZ";
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
    AUDIENCEGROUPINGID = "audienceGroupingId";
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
    regexForAmount: string;
    @ViewChild("regionInput") regionInput;
    @ViewChild("classInput") classInput;
    @ViewChild("productInput") productInput;
    @Input() currentOffering;
    @Output() emitCancelSave = new EventEmitter<any>();
    @Output() emitIsAdd = new EventEmitter<boolean>();
    disableSaveOfferingOnClick: boolean;

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
        "primary.portal.applicationFlow.beneficiary.percentCannotBeZero",
        "primary.portal.maintenanceBenefitsOffering.addEditOffering.percentageAmountValidation",
        "primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution",
    ]);
    secondaryLanguages: Record<string, string> = this.language.fetchSecondaryLanguageValues(["secondary.portal.common.maxLength1000"]);
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    private readonly unsubscribe$ = new Subject<void>();
    isPercentage: boolean;

    constructor(
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * @function ngOnInit
     * @description To set-up initial data for the component
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.staticUtilService
            .cacheConfigValue("general.benefitDollar.excluded.product.ids")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((productIds) => {
                const excludeProductIds = productIds.split(COMMA);
                this.allProducts = this.allProducts.filter((data) => !excludeProductIds.includes(data.id.toString()));
            });
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        this.createListner();
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
     * @memberof AddEditOfferingComponent
     */
    ngOnChanges(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((regex) => {
            this.regexForAmount = regex.BENEFITDOLLARAMOUNT;
            this.constructFormControls();
        });
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
        if (this.currentOffering && this.currentOffering.audienceGrouping && this.currentOffering.audienceGrouping.audiences) {
            this.initialAudienceGroupingIds = [
                ...this.currentOffering.audienceGrouping.audiences.map((audGroup) => audGroup.classId),
                ...this.currentOffering.audienceGrouping.audiences.map((audGroup) => audGroup.regionId),
            ];
        }
        this.initialAudienceGroupingIds = this.initialAudienceGroupingIds.filter((x) => x !== undefined);
        this.filteredClasses = this.allClasses;
        this.filteredRegions = this.allRegions;
        this.updateFilteredRegions();
        this.updateFilteredClasses();
    }
    /**
     * @function patchFormValues
     * @description method to set existing values to the form in edit mode
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    patchFormValues(): void {
        if (this.currentOffering) {
            this.isEditForm = true;
            this.isAddForm = false;
            this.offeringForm.get(this.NAME).patchValue(this.currentOffering.name);
            this.offeringName = this.currentOffering.name;
            this.offeringForm.get(this.CONTRIBUTION_TYPE).patchValue(this.currentOffering.contributionType);
            this.offeringForm.get(this.CONTRIBUTION_TYPE).setValue(this.currentOffering.contributionType);
            this.amountTypeVal = this.currentOffering.contributionType;
            this.amountControlValue =
                this.offeringForm.controls.contributionType.value === this.benefitDollars.FLAT_AMOUNT
                    ? this.AMOUNT
                    : this.PERCENTAGE_AMOUNT;

            if (this.currentOffering.contributionType === BenefitDollars.FLAT_AMOUNT) {
                this.offeringForm.get(this.amountControlValue).patchValue(this.currentOffering.amount.toFixed(this.FIXING_VALUE));
                this.amount = this.currentOffering.amount;
                this.isPercentage = false;
            } else {
                this.percentageAmount = this.currentOffering.amount;
                this.offeringForm.get(this.amountControlValue).patchValue(this.currentOffering.amount);
                this.isPercentage = true;
            }
            this.offeringForm.get(this.DESCRIPTION).patchValue(this.currentOffering.description);
            if (this.currentOffering.audienceGrouping && this.currentOffering.audienceGrouping.audiences) {
                this.selectedRegionList = this.allRegions.filter((x) =>
                    this.currentOffering.audienceGrouping.audiences
                        .filter((y) => y.type === this.REGION)
                        .map((z) => z.regionId)
                        .includes(x.id),
                );
                this.selectedClassList = this.allClasses.filter((x) =>
                    this.currentOffering.audienceGrouping.audiences
                        .filter((y) => y.type === this.CLAZZ)
                        .map((z) => z.classId)
                        .includes(x.id),
                );
            } else {
                this.selectedRegionList = [];
                this.selectedClassList = [];
            }
            if (this.currentOffering.applicableProductId) {
                let productSelected;
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
            this.isEditForm = false;
            this.isAddForm = true;
            this.emitIsAdd.emit(true);
        }
    }
    /**
     * @function setDefaultValues
     * @description method to set default values for the amount fields
     * @returns {void}
     * @memberof AddEditOfferingComponent
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
     * @memberof AddEditOfferingComponent
     */
    constructFormControls(): void {
        this.offeringForm = this.fb.group({
            name: [this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.benefitDollars.employerContribution"]],
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
            classes: [""],
            regions: [""],
            products: ["", [Validators.required]],
            contributionType: [""],
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
    }

    noWhitespace(control: FormControl): Validators {
        return (control.value || "").trim().length === 0 ? { whitespace: true } : null;
    }

    addRemoveClass(clasObject: ClassNames): void {
        this.offeringForm.controls.classes.setValue("");
        const index = this.selectedClassList.findIndex((X) => X.id === clasObject.id);
        if (index >= 0) {
            this.isClassChecked = false;
            this.selectedClassList.splice(index, 1);
        } else {
            this.selectedClassList.push(clasObject);
        }
        if (this.selectedClassList.length === this.allClasses.length) {
            this.isClassChecked = true;
        }
        if (!this.offeringForm.controls.classes.value) {
            this.offeringForm.controls.classes.reset();
        }
    }

    removeClassText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.classInput.nativeElement.value = "";
            this.offeringForm.controls.classes.setValue("");
        }, 250);
    }

    removeAllClasses(): void {
        if (this.selectedClassList.length === this.allClasses.length) {
            this.isClassChecked = false;
        }
        this.selectedClassList = [];
        this.removeClassText();
    }

    isClassSelected(classObject: ClassNames): boolean {
        return this.selectedClassList.findIndex((x) => x.id === classObject.id) >= 0 ? true : false;
    }

    updateFilteredClasses(): void {
        this.filteredClasses = this.offeringForm.controls.classes.valueChanges.pipe(
            startWith<string | ClassNames[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastClassFilter)),
            map((filter) => this.filterClasses(filter)),
        );
    }

    filterClasses(filter: string): ClassNames[] {
        this.lastClassFilter = filter;
        let filteredClasses;
        if (filter) {
            filteredClasses = this.allClasses.filter((option) => option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else {
            filteredClasses = this.allClasses.slice();
        }
        return filteredClasses;
    }

    selectAllClasses(): void {
        this.isClassChecked = !this.isClassChecked;
        if (this.isClassChecked) {
            const classObject = this.allClasses.map((element) => element);
            this.selectedClassList = [...classObject];
        } else {
            this.selectedClassList = [];
        }
        if (!this.offeringForm.controls.classes.value) {
            this.offeringForm.controls.classes.reset();
        }
    }

    addRemoveRegion(region: RegionNames): void {
        const index = this.selectedRegionList.findIndex((X) => X.id === region.id);
        if (index >= 0) {
            this.isRegionChecked = false;
            this.selectedRegionList.splice(index, 1);
        } else {
            this.selectedRegionList.push(region);
        }
        if (this.selectedRegionList.length === this.allRegions.length) {
            this.isRegionChecked = true;
        }
        if (!this.offeringForm.controls.regions.value) {
            this.offeringForm.controls.regions.reset();
        }
        this.offeringForm.controls.regions.setValue("");
    }

    removeRegionText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.regionInput.nativeElement.value = "";
            this.offeringForm.controls.regions.setValue("");
        }, 250);
    }

    removeAllRegions(): void {
        if (this.selectedRegionList.length === this.allRegions.length) {
            this.isRegionChecked = false;
        }
        this.selectedRegionList = [];
        this.removeRegionText();
    }

    isRegionSelected(region: RegionNames): boolean {
        return this.selectedRegionList.findIndex((x) => x.id === region.id) >= 0 ? true : false;
    }

    updateFilteredRegions(): void {
        this.filteredRegions = this.offeringForm.controls.regions.valueChanges.pipe(
            startWith<string | RegionNames[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastRegionFilter)),
            map((filter) => this.filterRegions(filter)),
        );
    }

    filterRegions(filter: string): RegionNames[] {
        this.lastRegionFilter = filter;
        let filteredRegions;
        if (filter) {
            filteredRegions = this.allRegions.filter((option) => option.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0);
        } else {
            filteredRegions = this.allRegions.slice();
        }
        return filteredRegions;
    }

    selectAllRegions(): void {
        this.isRegionChecked = !this.isRegionChecked;
        if (this.isRegionChecked) {
            const region = this.allRegions.map((element) => element);
            this.selectedRegionList = [...region];
        } else {
            this.selectedRegionList = [];
        }
        if (!this.offeringForm.controls.regions.value) {
            this.offeringForm.controls.regions.reset();
        }
    }

    private fieldValidation(fieldType: string, selectedList: any): void {
        if (selectedList.length > 0) {
            this.offeringForm.get(fieldType).clearValidators();
            this.offeringForm.get(fieldType).setErrors({ required: null });
            this.offeringForm.get(fieldType).updateValueAndValidity();
        } else {
            this.offeringForm.get(fieldType).setValidators([Validators.required]);
            this.offeringForm.get(fieldType).markAsTouched();
            this.offeringForm.get(fieldType).setErrors({ required: true });
            this.offeringForm.get(fieldType).updateValueAndValidity();
        }
    }

    cancel(): void {
        this.emitCancelSave.emit("cancel");
        this.currentOffering = null;
    }
    /**
     * @function saveOffering
     * @description method called on saving or updating the flex dollars
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    saveOffering(): void {
        if (this.offeringForm.valid) {
            this.disableSaveOfferingOnClick = true;
            this.isLoading = true;
            const classObjectArray = [];
            const regionObjectArray = [];

            this.selectedClassList.forEach((element) => {
                classObjectArray.push({ type: this.CLAZZ, classTypeId: element.classTypeId, classId: element.id });
            });
            this.selectedRegionList.forEach((element) => {
                regionObjectArray.push({ type: this.REGION, regionId: element.id });
            });
            const productId = this.offeringForm.controls.products.value;

            const audienceGroupingObject = { audiences: [] };
            classObjectArray.forEach((element) => {
                audienceGroupingObject.audiences.push(element);
            });
            regionObjectArray.forEach((element) => {
                audienceGroupingObject.audiences.push(element);
            });

            const offeringObject: FlexDollar = {
                name: null,
                description: null,
                amount: null,
                contributionType: null,
                audienceGroupingId: null,
                applicableProductId: null,
            };

            if (this.isAddForm) {
                if (audienceGroupingObject.audiences.length > 0) {
                    this.addOffering(audienceGroupingObject, offeringObject, productId);
                } else {
                    offeringObject[this.AUDIENCEGROUPINGID] = null;
                    this.createFlexDollar(offeringObject, productId);
                }
            } else {
                this.updateOffering(offeringObject, productId);
            }
        }
    }

    addOffering(audienceGroupingObject: any, offeringObject: any, productId: number): void {
        this.accountService
            .createAudienceGrouping(audienceGroupingObject, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (result) => {
                    const audienceGroupingId = +result.headers.get(AppSettings.API_RESP_HEADER_LOCATION).split("/").slice(-1);
                    offeringObject[this.AUDIENCEGROUPINGID] = audienceGroupingId;
                    this.createFlexDollar(offeringObject, productId);
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * @function createFlexDollar
     * @description method to construct data for calling a service to create benefit dollars
     * @param offeringObject {FlexDollar}  array of form data objects
     * @param productId {number} product Id for this account
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    createFlexDollar(offeringObject: FlexDollar, productId: number): void {
        offeringObject[this.NAME] = this.offeringForm.controls.name.value;
        offeringObject[this.DESCRIPTION] = this.offeringForm.value[this.DESCRIPTION];
        offeringObject[this.AMOUNT] = this.offeringForm.value[this.amountControlValue];
        offeringObject[this.CONTRIBUTION_TYPE] = this.offeringForm.value[this.CONTRIBUTION_TYPE];
        offeringObject[this.APPLICABLE_PRODUCT_ID] = productId;
        if (this.offeringForm.get(this.CONTRIBUTION_TYPE).value === this.benefitDollars.FLAT_AMOUNT) {
            offeringObject[this.PAY_FREQUENCY_DATA] = this.payFrequency;
        }
        this.accountService
            .createFlexDollar(offeringObject, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.emitCancelSave.emit(SAVE);
                    this.isLoading = false;
                    this.disableSaveOfferingOnClick = false;
                },
                (err) => {
                    this.errorHandlingMethod(err.status);
                    this.isLoading = false;
                    this.disableSaveOfferingOnClick = false;
                },
            );
    }
    /**
     * @function errorHandlingMethod
     * @description method to handle API errors for create and update flex dollars
     * @param errorStatus {number}  error status which API returns
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    errorHandlingMethod(errorStatus: number): void {
        this.isLoading = false;
        if (errorStatus === AppSettings.API_RESP_409) {
            this.isDuplicateFlexDollar = true;
            this.errorMessage = this.languageStrings["primary.portal.benefitsOffering.product.validation"];
        } else if (errorStatus === AppSettings.API_RESP_400) {
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
     * @memberof AddEditOfferingComponent
     */
    updateOffering(offeringObject: FlexDollar, productId: number): void {
        const selectedClassIds = this.selectedClassList.map((x) => x.id);
        const selectedRegionIds = this.selectedRegionList.map((x) => x.id);
        const removedAudience = this.initialAudienceGroupingIds
            .filter((x) => !selectedClassIds.includes(x))
            .filter((y) => !selectedRegionIds.includes(y));

        if (removedAudience.length > 0) {
            removedAudience.forEach((audience) => {
                const removedAud = this.currentOffering.audienceGrouping.audiences.find(
                    (x) => x.regionId === audience || x.classId === audience,
                );
                this.accountService
                    .removeAudienceFromAudienceGrouping(this.currentOffering.audienceGrouping.id, removedAud.id, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res) => {},
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            });
        }

        const addedClassList = this.selectedClassList.filter((x) => !this.initialAudienceGroupingIds.includes(x.id));
        const addedRegionList = this.selectedRegionList.filter((x) => !this.initialAudienceGroupingIds.includes(x.id));
        offeringObject[this.NAME] = this.offeringForm.controls.name.value;
        offeringObject[this.DESCRIPTION] = this.offeringForm.value[this.DESCRIPTION];
        offeringObject[this.CONTRIBUTION_TYPE] = this.offeringForm.value[this.CONTRIBUTION_TYPE];
        offeringObject[this.AMOUNT] = this.offeringForm.value[this.amountControlValue];
        offeringObject[this.APPLICABLE_PRODUCT_ID] = productId;
        if (this.offeringForm.get(this.CONTRIBUTION_TYPE).value === this.benefitDollars.FLAT_AMOUNT) {
            offeringObject[this.PAY_FREQUENCY_DATA] = this.payFrequency;
        }

        if (this.initialAudienceGroupingIds.length === 0 && (addedClassList.length > 0 || addedRegionList.length > 0)) {
            const classObjectArray = [];
            const regionObjectArray = [];

            this.selectedClassList.forEach((element) => {
                classObjectArray.push({ type: this.CLAZZ, classTypeId: element.classTypeId, classId: element.id });
            });
            this.selectedRegionList.forEach((element) => {
                regionObjectArray.push({ type: this.REGION, regionId: element.id });
            });

            const audienceGroupingObject = { audiences: [] };
            classObjectArray.forEach((element) => {
                audienceGroupingObject.audiences.push(element);
            });
            regionObjectArray.forEach((element) => {
                audienceGroupingObject.audiences.push(element);
            });

            if (audienceGroupingObject.audiences.length > 0) {
                this.accountService
                    .createAudienceGrouping(audienceGroupingObject, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (result) => {
                            const audienceGroupingId = +result.headers.get(AppSettings.API_RESP_HEADER_LOCATION).split("/").slice(-1);
                            offeringObject[this.AUDIENCEGROUPINGID] = audienceGroupingId;
                            this.updateFlexDollars(offeringObject);
                        },
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            }
        } else if (this.initialAudienceGroupingIds.length === 0 && addedClassList.length === 0 && addedRegionList.length === 0) {
            offeringObject[this.AUDIENCEGROUPINGID] = null;
            this.updateFlexDollars(offeringObject);
        } else if (
            this.initialAudienceGroupingIds.length > 0 &&
            addedClassList.length === 0 &&
            addedRegionList.length === 0 &&
            removedAudience.length === this.initialAudienceGroupingIds.length
        ) {
            offeringObject[this.AUDIENCEGROUPINGID] = null;
            this.updateFlexDollars(offeringObject);
        } else {
            addedClassList.forEach((element) => {
                const audObj = {};
                audObj[this.TYPE] = this.CLAZZ;
                audObj["classTypeId"] = element.classTypeId;
                audObj["classId"] = element.id;
                this.accountService
                    .addAudienceToAudienceGrouping(this.currentOffering.audienceGrouping.id, audObj, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res) => {},
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            });

            addedRegionList.forEach((element) => {
                const audObj = {};
                audObj[this.TYPE] = this.REGION;
                audObj["regionId"] = element.id;
                this.accountService
                    .addAudienceToAudienceGrouping(this.currentOffering.audienceGrouping.id, audObj, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res) => {},
                        (err) => {
                            this.isLoading = false;
                        },
                    );
            });
            offeringObject[this.AUDIENCEGROUPINGID] = this.currentOffering.audienceGrouping.id;
            this.updateFlexDollars(offeringObject);
        }
    }
    /**
     * @function updateFlexDollars
     * @description method to construct data for calling a service to update benefit dollars
     * @param offeringObject {FlexDollar}  array of form data objects
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    updateFlexDollars(offeringObject: FlexDollar): void {
        this.accountService
            .updateFlexDollar(this.currentOffering.id, offeringObject, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.emitCancelSave.emit(SAVE);
                    this.isLoading = false;
                },
                (err) => {
                    this.errorHandlingMethod(err.status);
                },
            );
    }
    /**
     * @function createListner
     * @description method to handle value changes on form fields
     * @returns {void}
     * @memberof AddEditOfferingComponent
     */
    createListner(): void {
        this.offeringForm
            .get(this.NAME)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.offeringName = res;
            });
        this.offeringForm.get(this.amountControlValue).valueChanges.subscribe((res) => {
            if (this.offeringForm.controls.contributionType.value === BenefitDollars.FLAT_AMOUNT) {
                this.amount = res;
            } else {
                this.percentageAmount = res;
            }
        });
    }
    /**
     * @function selectProduct
     * @description method to handle selection of products dropdown
     * @param id {number} its the id of the selected product
     * @returns {void}
     * @memberof AddEditOfferingComponent
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
     * @memberof AddEditOfferingComponent
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
     * @memberof AddEditOfferingComponent
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
     * @memberof AddEditOfferingComponent
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
