import { Component, OnInit, ViewChild, OnDestroy, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl, ValidatorFn } from "@angular/forms";
import { MatRadioChange } from "@angular/material/radio";
import { CoreService, AflacService, AccountProfileService, PeoData, AccountService, DualPeoRiskSaveRequest } from "@empowered/api";
import { Observable, Subscription, forkJoin, of } from "rxjs";
import { AccountListState, BenefitsOfferingState, AddAccountInfo, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { ImportPeoModalComponent, OpenToast, ToastModel } from "@empowered/ui";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { catchError, switchMap, tap, filter, finalize } from "rxjs/operators";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { Router } from "@angular/router";
import { ClassType, ConfigName, ProductId, RiskClass, ToastType, CarrierId, PlanChoice, RatingCode, Accounts } from "@empowered/constants";
import { ERROR_MESSAGE, PEO_TOAST_DURATION, RETRY, SUCCESS_MESSAGE, VIEW, WARNING_MESSAGE } from "./classtype.constants";
import { EmpoweredModalService } from "@empowered/common-services";

interface DialogData {
    carrierId: number;
}
const PEO_CLASS_NAME_MAX_LENGTH = 4;
const PEO_CLASS_NAME_MIN_LENGTH = 4;

@Component({
    selector: "empowered-classtype-popup",
    templateUrl: "./classtype-popup.component.html",
    styleUrls: ["./classtype-popup.component.scss"],
})
export class ClasstypePopupComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;
    stepOneForm: FormGroup;
    stepTwoForm: FormGroup;
    stepThreeForm: FormGroup;
    stepFourForm: FormGroup;
    radioValue: ClassType = ClassType.PEO;
    classes: FormArray;
    currentDefaultClass: AbstractControl;
    classArray: FormArray;
    @Select(BenefitsOfferingState.getAllProducts) AllProducts$: Observable<any>;
    @Select(BenefitsOfferingState.getPlanChoices) SelectedPlans$: Observable<PlanChoice[]>;
    ShowDualProductOne = false;
    ShowDualProductTwo = false;
    Product1: string;
    Product2: string;
    count = 0;
    countError = 0;
    riskClassId: number;
    productOneRisk: number;
    productTwoRisk: number;
    MpGroup: number;
    SelectedPlanSubscription: Subscription;
    AllProductsSubscription: Subscription;
    showDuplicateError = false;
    subscriptions: Subscription[] = [];
    riskClasses: RiskClass[];
    errorMessage: string;
    PEO_CLASS_NAME_MAX_LENGTH = PEO_CLASS_NAME_MAX_LENGTH;
    accountName: string;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.classtypePopup.addClass",
        "primary.portal.classtypePopup.industryCode",
        "primary.portal.classtypePopup.assignCode",
        "primary.portal.classtypePopup.setAsDefault",
        "primary.portal.classtypePopup.defaultClassName",
        "primary.portal.classtypePopup.className",
        "primary.portal.classtypePopup.selectClasstype",
        "primary.portal.classtypePopup.classtypeStandard",
        "primary.portal.classtypePopup.classtypePeo",
        "primary.portal.classtypePopup.classtypeDual",
        "primary.portal.classTypePopup.assignIndustryCodes",
        "primary.portal.classtypePopup.setupPeo",
        "primary.portal.classtypePopup.setupStandard",
        "primary.portal.classtypePopup.setupDual",
        "primary.portal.classtypePopup.maximumCharacters",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.common.requiredField",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.optional",
        "primary.portal.classtypePopup.classDescriptionOptional",
        "primary.portal.members.document.addUpdate.MaxChar",
        "primary.portal.classTypePopup.createClass",
        "primary.portal.classTypePopup.createClasses",
        "primary.portal.classTypePopup.addDepartment",
        SUCCESS_MESSAGE,
        ERROR_MESSAGE,
        WARNING_MESSAGE,
        RETRY,
        VIEW,
    ]);
    secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.pattern",
        "secondary.portal.classType.minlength",
        "secondary.portal.departmentNumber.minLength",
        "secondary.portal.departmentNumber.duplicate",
    ]);
    industryCodesDual: RiskClass[];
    industryCodesStandard: RiskClass[];
    industryCodesPeo: RiskClass[];
    isLoading: boolean;
    form: FormGroup;
    isPeoImportChecked = this.radioValue === ClassType.PEO;
    showPeoImport = this.radioValue === ClassType.PEO;
    peoFeatureEnabled: boolean;
    portal: string;

    constructor(
        private readonly dialogRef: MatDialogRef<any>,
        private readonly formBuilder: FormBuilder,
        private readonly coreService: CoreService,
        private readonly aflacService: AflacService,
        private readonly accountProfileService: AccountProfileService,
        private readonly store: Store,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly router: Router,
        private readonly dialog: MatDialog,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.accountName = this.store.selectSnapshot(AccountListState.getGroup)?.name;
        this.constructForm();
        this.getCarrierRiskClasses();
        this.isDualVisible();
        this.MpGroup = +this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.checkPeoFeatureEnabled();
    }

    /**
     * check peo feature is enabled using config value
     */
    checkPeoFeatureEnabled(): void {
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled(ConfigName.FEATURE_ENABLE_PEO_RULES)
                .subscribe((peoFeatureEnabled) => (this.peoFeatureEnabled = peoFeatureEnabled)),
        );
    }

    // construct form to display radio buttons to select between standar/peo/dual.
    constructForm(): void {
        this.stepOneForm = this.formBuilder.group({ classType: [""] });
    }
    /**
     * Get carrier risk classes and separate them according to rating code
     * @returns nothing
     */
    getCarrierRiskClasses(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.coreService.getRiskClasses(CarrierId.AFLAC).subscribe((riskClasses) => {
                this.riskClasses = riskClasses;
                this.industryCodesPeo = riskClasses.filter((riskClass) => !riskClass.groupRatingCode);
                this.industryCodesStandard = riskClasses.filter(
                    (riskClass) => riskClass.groupRatingCode === RatingCode.STANDARD || riskClass.groupRatingCode === undefined,
                );
                this.isLoading = false;
            }),
        );
    }
    /**
     * get the value selected either peo/standard/dual
     * @param event MatRadioChange event
     */
    getRadioValue(event: MatRadioChange): void {
        this.radioValue = event.value;
        this.isPeoImportChecked = this.radioValue === ClassType.PEO;
        this.showPeoImport = this.radioValue === ClassType.PEO;
    }
    /**
     * function to check if peo import checkbox is checked
     * @param event MatCheckboxChange
     */
    togglePeoData(matCheckboxChange: MatCheckboxChange): void {
        this.isPeoImportChecked = matCheckboxChange.checked;
    }
    /**
     * Initializes value for Toast Model and opens the toast component.
     * @param message content for toast component
     * @param type type of toast to display is set based on this value
     * @param actionText action text is to display the hyperlink
     * @param duration duration of time to display the toast
     */
    openToast(message: string, type: ToastType, actionText?: string, duration?: number): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: duration,
            action: {
                text: actionText,
                callback: () => {
                    if (actionText === this.languageStrings[VIEW]) {
                        this.router.navigate([`${this.portal.toLowerCase()}/payroll/${this.MpGroup}/dashboard/profile/structure`]);
                        this.dialog.closeAll();
                    }
                    if (actionText === this.languageStrings[RETRY]) {
                        // make api call again for importing peo
                        this.subscriptions.push(this.importPeoData().subscribe());
                    }
                },
            },
        };
        this.store.dispatch(new OpenToast(toastData));
    }

    /**
     * To import peo data
     */
    importPeoData(): Observable<PeoData> {
        return this.aflacService.importPeoData(this.MpGroup, { peoClass: "peo", importPeoData: true }).pipe(
            tap((importDetails) => {
                if (importDetails && importDetails.importRowCount) {
                    // if response is success and have some value
                    this.openToast(
                        this.languageStrings[SUCCESS_MESSAGE].replace("##accountName##", this.accountName).replace(
                            "##noOfRecords##",
                            importDetails.importRowCount.toString(),
                        ),
                        ToastType.SUCCESS,
                        this.languageStrings[VIEW],
                        PEO_TOAST_DURATION,
                    );
                } else {
                    // when response is null
                    this.openToast(
                        this.languageStrings[WARNING_MESSAGE].replace("##accountName##", this.accountName),
                        ToastType.WARNING,
                        "",
                        PEO_TOAST_DURATION,
                    );
                }
            }),
            catchError((peoError) => {
                // when error occurs
                this.openToast(
                    this.languageStrings[ERROR_MESSAGE].replace("##accountName##", this.accountName),
                    ToastType.DANGER,
                    this.languageStrings[RETRY],
                    PEO_TOAST_DURATION,
                );
                return of(null);
            }),
            finalize(() => this.dialogRef.close()),
        );
    }

    /**
     * To get account details and dispatch updated details into store
     * @returns Observable<Accounts>
     */
    getAccount(): Observable<Accounts> {
        return this.accountService.getAccount(this.MpGroup.toString()).pipe(
            tap((accountDetails) => {
                this.store.dispatch(
                    new AddAccountInfo({
                        accountInfo: accountDetails,
                        mpGroupId: this.MpGroup.toString(),
                    }),
                );
            }),
        );
    }

    /**
     * either go to peo or standard or dual flow
     */
    goTo(): void {
        if (this.radioValue === ClassType.PEO) {
            // when import peo data checkbox is checked
            if (this.isPeoImportChecked && this.showPeoImport && this.peoFeatureEnabled) {
                this.empoweredModalService.openDialog(ImportPeoModalComponent);
                this.submitPeo();
            } else {
                // when peo is selected construct form
                this.constructFormPeo();
            }
        }
        if (this.radioValue === ClassType.STANDARD) {
            this.constructStandardForm();
        }
        if (this.radioValue === ClassType.DUAL) {
            this.constructDualForm();
        }
    }
    /**
     * PEO related methods
     * method to construct form if user selects Peo
     * @returns nothing
     */
    constructFormPeo(): void {
        this.stepTwoForm = this.formBuilder.group(
            {
                classes: this.formBuilder.array([this.createClass()]),
            },
            { updateOn: "blur" },
        );
        this.matStepper.selectedIndex = 1;
    }
    /**
     * Create a form to create a new PEO class. Default classes are not created through the UI.
     * A default class will be automatically created when the form is submitted and it cannot be changed.
     * @returns {FormGroup} enables addition of a new class
     */
    createClass(): FormGroup {
        return this.formBuilder.group({
            name: [
                "",
                [
                    Validators.required,
                    Validators.maxLength(PEO_CLASS_NAME_MAX_LENGTH),
                    Validators.minLength(PEO_CLASS_NAME_MIN_LENGTH),
                    Validators.pattern(this.store.selectSnapshot(SharedState.regex).ALPHANUMERIC),
                    this.isDepartmentNumberDuplicate(),
                ],
            ],
            description: "",
            riskClassId: ["", Validators.required],
            default: [false],
            errorDuplicate: [false],
        });
    }
    /**
     * Form validation for duplicate department number
     * @returns ValidatorFn
     */
    isDepartmentNumberDuplicate(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: boolean } | null => {
            const departments = this.stepTwoForm ? this.getClassesArray().value : [];
            const departmentNumbers = departments.map((item) => item.name.trim());
            return control.value.length === PEO_CLASS_NAME_MIN_LENGTH && departmentNumbers.includes(control.value)
                ? { duplicate: true }
                : null;
        };
    }
    /**
     * Abstracting classes array form field
     * @returns FormArray
     */
    getClassesArray(): FormArray {
        return this.stepTwoForm.get("classes") as FormArray;
    }
    /**
     * Abstracting riskClassId form field
     * @param index { number } Classes array index
     * @returns AbstractControl
     */
    getRiskClassIdControl(index: number): AbstractControl {
        return this.getClassesArray().at(index).get("riskClassId");
    }
    /**
     * Abstracting default form field
     * @param index { number } Classes array index
     * @returns AbstractControl
     */
    getDefaultControl(index: number): AbstractControl {
        return this.getClassesArray().at(index).get("default");
    }
    /**
     * On click of add class link for creating new peo class object and pushing into classes array object
     * @returns nothing
     */
    addClass(): void {
        this.showDuplicateError = false;
        this.classes = this.getClassesArray();
        this.classes.push(this.createClass());
    }
    /**
     * on click of remove delete the fields generated
     * @param index { number } remove class index from classes array object
     * @returns nothing
     */
    RemoveClass(index: number): void {
        const arrayControl = this.getClassesArray();
        arrayControl.removeAt(index);
    }
    /**
     * set the particular class as default
     * @param i { number } adding defaultClass value as true
     * @returns nothing
     */
    setAsDefault(i: number): void {
        this.classArray = this.getClassesArray();
        this.count++;
        this.classArray.controls.forEach((element, j) => {
            if (i !== j) {
                this.getDefaultControl(j).setValue(false);
            } else {
                this.getDefaultControl(j).setValue(true);
                this.currentDefaultClass = this.classArray.controls[j];
            }
        });
    }
    /**
     * Create one/more PEO classes. The default class is created behind the scenes and is invisible to the user.
     * @returns nothing
     */
    submitPeo(): void {
        this.errorMessage = null;
        this.isLoading = true;
        const isPeoImport = this.isPeoImportChecked && this.showPeoImport && this.peoFeatureEnabled;
        const RISK_CLASS_FOR_DEFAULT_PEO_CLASS = "Z";
        const DEFAULT_PEO_CLASS = {
            name: "UNSP",
            description: "Unspecified",
            riskClassId: this.riskClasses.find((code) => code.name === RISK_CLASS_FOR_DEFAULT_PEO_CLASS).id,
            default: true,
        };
        const peoClassForms =
            this.stepTwoForm && this.stepTwoForm.value && this.stepTwoForm.value.classes && !isPeoImport
                ? [DEFAULT_PEO_CLASS, ...this.stepTwoForm.value.classes]
                : [DEFAULT_PEO_CLASS];
        this.subscriptions.push(
            forkJoin(
                peoClassForms.map((peoClass) =>
                    this.aflacService.createPeoClass(this.MpGroup, peoClass).pipe(
                        catchError((error) => {
                            throw error;
                        }),
                    ),
                ),
            )
                .pipe(
                    tap(() => {
                        this.isLoading = false;
                        if (!isPeoImport) {
                            this.dialogRef.close();
                        }
                    }),
                    catchError((error) => {
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${error.error.status}.${error.error.code}`,
                        );
                        this.isLoading = false;
                        throw error;
                    }),
                    filter(() => isPeoImport),
                    switchMap(() => this.getAccount()),
                    switchMap(() => this.importPeoData()),
                )
                .subscribe(),
        );
    }

    // standard related methods
    // Get data to prefill in standard form
    constructStandardForm(): void {
        this.stepThreeForm = this.formBuilder.group({ industryCode: ["", Validators.required] });
        this.matStepper.selectedIndex = 2;
    }
    submitStandard(): void {
        const stepThreeFormData = {
            clazz: {
                name: this.stepThreeForm.value.industryCode,
            },
            checkGroupRiskClass: true,
        };
        this.subscriptions.push(
            this.accountProfileService.createClass(stepThreeFormData, this.data.carrierId, this.MpGroup.toString()).subscribe((resp) => {
                this.dialogRef.close();
            }),
        );
    }
    // Dual related methods
    // Dual selection to be visible only when product id 1 and 5 have plans under them
    isDualVisible(): void {
        this.SelectedPlanSubscription = this.SelectedPlans$.subscribe((selectedPlan) => {
            selectedPlan.forEach((plan) => {
                if (plan.plan.productId === ProductId.ACCIDENT) {
                    this.ShowDualProductOne = true;
                }
                if (plan.plan.productId === ProductId.SHORT_TERM_DISABILITY) {
                    this.ShowDualProductTwo = true;
                }
            });
        });
        // get product names
        this.AllProductsSubscription = this.AllProducts$.subscribe((products) => {
            products.forEach((product) => {
                if (product.id === ProductId.ACCIDENT) {
                    this.Product1 = product.name;
                }
                if (product.id === ProductId.SHORT_TERM_DISABILITY) {
                    this.Product2 = product.name;
                }
            });
        });
    }
    // form controls based on if there is data that should be prefilled
    constructDualForm(): void {
        this.stepFourForm = this.formBuilder.group({
            productOne: ["", Validators.required],
            productTwo: ["", Validators.required],
        });
        this.matStepper.selectedIndex = 3;
    }
    submitDual(): void {
        const industryCode = this.industryCodesPeo.find((industrycode) => industrycode.name === this.stepFourForm.value.productOne);
        this.productOneRisk = industryCode.id;
        const industryCodeTwo = this.industryCodesPeo.find((industrycode) => industrycode.name === this.stepFourForm.value.productTwo);
        this.productTwoRisk = industryCodeTwo.id;
        const submitDualObj: DualPeoRiskSaveRequest = {
            [ProductId.ACCIDENT]: this.productOneRisk.toString(),
            [ProductId.SHORT_TERM_DISABILITY]: this.productTwoRisk.toString(),
        };
        this.subscriptions.push(
            this.aflacService.saveDualPeoSelection(this.MpGroup, submitDualObj).subscribe(() => this.dialogRef.close()),
        );
    }
    // close dialog on click of cancel
    onCancelClick(): void {
        this.dialogRef.close();
    }
    goToSelection(): void {
        this.matStepper.selectedIndex = 0;
    }
    stepChanged(event: any, stepper: any): void {
        stepper.selected.interacted = false;
    }
    ngOnDestroy(): void {
        if (this.SelectedPlanSubscription) {
            this.SelectedPlanSubscription.unsubscribe();
        }
        if (this.AllProductsSubscription) {
            this.AllProductsSubscription.unsubscribe();
        }
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
