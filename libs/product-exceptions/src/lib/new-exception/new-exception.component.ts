import { LanguageService } from "@empowered/language";
import { ChipSelectComponent } from "@empowered/ui";
import { Component, OnInit, Optional, Inject, ViewChild, OnDestroy, QueryList, ViewChildren } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ExceptionsService, BenefitsOfferingService, AllowWithdrawnPlan, StaticService } from "@empowered/api";
import { FormGroup, FormBuilder, FormArray, Validators, FormControl, ValidationErrors } from "@angular/forms";
import { Observable, of, Subject, concat, BehaviorSubject } from "rxjs";
import { map, take, catchError, tap, takeUntil, toArray, distinctUntilChanged, filter } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { SharedState, RegexDataType } from "@empowered/ngxs-store";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSelectChange } from "@angular/material/select";
import { Store, Select } from "@ngxs/store";
import { Permission, AppSettings, ExceptionType, CountryState, ChipData, DateInfo, DateFormat } from "@empowered/constants";
import { DateService } from "@empowered/date";

interface ExceptionTypeDetails {
    name: string;
    value: string;
}

interface DialogData {
    mpGroup: number;
    isVasExceptionUser: boolean;
    exceptionTypes: ExceptionTypeDetails[];
}
interface NewExceptionResult {
    success: boolean;
    error?: unknown;
}

const MIN_PLANS = 0;
const MAX_PLANS = 99;
const MAX_PLAN_VALUE = "maxValue";
const PLAN_DETAILS = "planDetails";

@Component({
    selector: "empowered-new-exception",
    templateUrl: "./new-exception.component.html",
    styleUrls: ["./new-exception.component.scss"],
    providers: [DatePipe],
})
export class NewExceptionComponent implements OnInit, OnDestroy {
    maxStartDate = this.dateService.addDays(new Date(), DateInfo.START_DATE_OFFSET_DAYS);
    minEndDate = this.dateService.addDays(new Date(), 1);
    exceptionForm: FormGroup;
    planDetails: FormArray;
    products = [];
    statesList: string[] = [];
    stateName: string;
    isChecked = false;
    filteredState: Observable<CountryState[]>;
    @ViewChild("input") matInput;
    @ViewChildren(ChipSelectComponent) statesChipSelects: QueryList<ChipSelectComponent>;
    lastFilter: string;
    statesMapObj = [];
    plansForProduct = [];
    planSelected = [];
    allStates: CountryState[];
    languageStrings: Record<string, string>;
    secondaryLanguage: Record<string, string>;
    readonly TODAY = new Date();
    startDateMax = this.dateService.addDays(new Date(), DateInfo.START_DATE_OFFSET_DAYS);
    endDateMax = this.dateService.addYears(new Date(), DateInfo.END_DATE_OFFSET_YEARS);
    endDateMin = this.dateService.addDays(new Date(), 1);
    dateFormat = DateFormat.MONTH_DAY_YEAR;
    errorKey: string;
    currentResultSnapShot: NewExceptionResult[] = [];
    returnData = null;
    withDrawnPlan = [AllowWithdrawnPlan.ALLOW_WITHDRAWN_API];
    exceptionTypes: ExceptionTypeDetails[];
    selectAllStates: CountryState[] = [];
    disablePlanState = {};
    hasSubmittedForms = false;
    showSpinner = false;
    private readonly unsub$: Subject<void> = new Subject<void>();
    endDateMinError: string;
    startDateMaxError: string;
    private readonly changeStrategySubjects$: Subject<void>[] = [];
    private readonly allStatesSubjects$: BehaviorSubject<ChipData[]>[] = [];
    changeStrategies$: Observable<void>[] = [];
    allStates$: Observable<ChipData[]>[] = [];
    stateValueChipSelects: FormControl[] = [];
    isVasExceptionUser: boolean;
    invalidDate = false;
    allowWithdrawnPlan = AllowWithdrawnPlan;
    isRole20 = false;
    isRole108 = false;
    isRole12 = false;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<NewExceptionComponent>,
        private readonly exceptionService: ExceptionsService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly formBuilder: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly dateService: DateService,
    ) {}

    /**
     * Function to initialize variable and make necessary API calls on component initialization
     */
    ngOnInit(): void {
        this.checkRole();
        this.isVasExceptionUser = this.data.isVasExceptionUser;
        this.exceptionTypes = this.data.exceptionTypes.filter(
            (plans) => !this.isRole108 || plans.value !== ExceptionType.ALLOW_WITHDRAWN_PLAN,
        );

        this.fetchLanguageData();
        this.constructForm();
        this.serviceCalls();
        this.staticService
            .getStates()
            .pipe(take(1))
            .subscribe((states) => (this.allStates = states));
        this.subscribeToStartDateValueChanges();
        this.subscribeToEndDateValueChanges();
    }

    /**
     * Function to construct exception form
     */
    constructForm(): void {
        this.exceptionForm = this.formBuilder.group(
            {
                exceptionType: ["", Validators.required],
                startDate: ["", [Validators.required, this.validateStartDate.bind(this)]],
                endDate: ["", Validators.required],
            },
            { updateOn: "blur" },
        );
    }
    /**
     * function is used to check role and permission
     */
    checkRole(): void {
        const productExceptionPermission = this.store.selectSnapshot(SharedState.hasPermission(Permission.EXCEPTION_CREATE));
        const vasExceptionPermission = this.store.selectSnapshot(SharedState.hasPermission(Permission.VAS_EXCEPTIONS_CREATE_PERMISSION));
        if (productExceptionPermission && vasExceptionPermission) {
            this.isRole20 = true;
        } else if (vasExceptionPermission) {
            this.isRole108 = true;
        } else {
            this.isRole12 = true;
        }
    }
    /**
     * function to validate startDate
     * @returns ValidationErrors
     */
    validateStartDate(): ValidationErrors {
        if (this.invalidDate) {
            return {
                invalidStartDate: true,
            };
        }
        return null;
    }

    /**
     * Function to reset the start date error on date change
     */
    resetStartDateError(): void {
        this.invalidDate = false;
        this.exceptionForm.controls.startDate.setErrors(null);
    }

    /**
     * Method invoked on change of form value to set the validator based on form value
     * @param event Mat select change event
     */
    onChangeVas(event: MatSelectChange): void {
        this.resetStartDateError();
        const regex = this.store.selectSnapshot((state) => state.core.regex);
        if (event.value === AllowWithdrawnPlan.ALLOW_WITHDRAWN_API) {
            this.exceptionForm.addControl(PLAN_DETAILS, this.formBuilder.array([this.createPlan()]));
            this.exceptionForm.removeControl(MAX_PLAN_VALUE);
        } else if (event.value === ExceptionType.VAS_MULTIPLE_AFLAC_FUNDED) {
            this.exceptionForm.addControl(MAX_PLAN_VALUE, this.formBuilder.control(""));
            this.exceptionForm.removeControl(PLAN_DETAILS);
            this.exceptionForm
                .get(MAX_PLAN_VALUE)
                .setValidators([
                    Validators.required,
                    Validators.max(MAX_PLANS),
                    Validators.min(MIN_PLANS),
                    Validators.pattern(regex.ONLY_NUMBER),
                ]);
        } else {
            this.exceptionForm.removeControl(PLAN_DETAILS);
            this.exceptionForm.removeControl(MAX_PLAN_VALUE);
        }
        this.exceptionForm.updateValueAndValidity();
    }
    /**
     * create a form group related to plans every time we click add exception
     * @return the form group
     */
    createPlan(): FormGroup {
        const UPDATE_ON_CHANGE = "change";
        const form = this.formBuilder.group(
            {
                product: [""],
                policySeries: [""],
                planName: [""],
                states: ["", { updateOn: UPDATE_ON_CHANGE }],
                availablePolicySeries: [[]],
                availablePlans: [[]],
                availableProducts: [[...this.products]],
            },
            { updateOn: UPDATE_ON_CHANGE },
        );
        this.statesMapObj.push([]);
        this.allStatesSubjects$.push(new BehaviorSubject<ChipData[]>([]));
        this.allStates$.push(this.allStatesSubjects$[this.allStatesSubjects$.length - 1].asObservable());
        this.changeStrategySubjects$.push(new Subject<void>());
        this.changeStrategies$.push(this.changeStrategySubjects$[this.changeStrategySubjects$.length - 1].asObservable());
        this.stateValueChipSelects.push(new FormControl([], { validators: Validators.required, updateOn: UPDATE_ON_CHANGE }));
        return form;
    }

    /**
     * Function to make getException API calls
     */
    serviceCalls(): void {
        this.benefitsOfferingService
            .getExceptionPlansByExceptionType(this.data.mpGroup, AllowWithdrawnPlan.ALLOW_WITHDRAWN_API)
            .pipe(take(1))
            .subscribe((data) => {
                // Do not show product that does not have policySeries for any plan.
                this.products = data
                    .filter((product) => product.product.plans.some((plan) => plan.policySeries))
                    .sort((a, b) => (a.product.name < b.product.name ? -1 : a.product.name > b.product.name ? 1 : 0));
            });
    }

    /**
     * get selected product information
     * @param selectedProduct the product selected
     * @param index the exception in context
     */
    getSelectedProduct(index: number): void {
        this.isChecked = false;
        const formArrRef = this.exceptionForm.get("planDetails") as FormArray;
        const selectedForm = formArrRef.at(index) as FormGroup;
        selectedForm.controls.policySeries.reset();
        selectedForm.controls.policySeries.clearValidators();
        this.statesMapObj[index] = [];
        this.disablePlanState[index] = true;
        formArrRef.updateValueAndValidity();
        this.updatePolicySeries();
        this.allStatesSubjects$[index].next([]);
        this.statesChipSelects.toArray()[index].clear();
    }

    /**
     * Updates policy series array
     */
    updatePolicySeries(): void {
        const formArrRef = this.exceptionForm.controls.planDetails as FormArray;
        formArrRef.controls.forEach((form: FormGroup, index: number) => {
            form.controls.availablePolicySeries.setValue(this.getPolicySeries(index));
        });
    }

    /**
     * get policy series based on the product selected
     * @param index index of the product selected
     * @return policy series array
     */
    getPolicySeries(index: number): Array<string> {
        const formArrRef = this.exceptionForm.get("planDetails") as FormArray;
        this.plansForProduct = this.products.filter((product) =>
            formArrRef.at(index).value.product ? product.product.name === formArrRef.at(index).value.product : true,
        );
        const selectedPolicySeries =
            this.exceptionForm.value.planDetails &&
            this.exceptionForm.value.planDetails.filter((plan, i) => i !== index).map((plan) => plan.policySeries);
        if (this.plansForProduct.length > 0) {
            return this.plansForProduct[0].product.plans
                .filter((plan) => plan.policySeries && !selectedPolicySeries.includes(plan.policySeries))
                .map((plan) => plan.policySeries)
                .sort();
        }
        return this.returnData;
    }

    /**
     * Gets plan name based on the policy series selected
     * @param selectedPlan the selected policy series
     * @param i index of the selected policy series
     * @returns plan name array
     */
    getPlanName(selectedPlan: string, i: number): Array<string> {
        if (this.plansForProduct.length > 0) {
            this.planSelected = this.plansForProduct[0].product.plans.filter((plan) => plan.policySeries === selectedPlan);
            if (this.planSelected && this.planSelected.length > 0) {
                this.selectAllStates = this.planSelected[0].states;
            }
            return this.planSelected;
        }
        return this.returnData;
    }

    /**
     * sorting method for states - alphabetical
     * @param state1 the first state
     * @param state2 the second state
     * @return if state1 comes before state2, then return -1; otherwise, return 1
     */
    sortStates(state1: CountryState, state2: CountryState): number {
        return state1.name < state2.name ? -1 : 1;
    }

    /**
     * construct chip data for state
     * @param state the state in context
     * @return a ChipData object
     */
    constructStateChipData(state: CountryState): ChipData {
        return {
            name: state.name,
            value: state.abbreviation,
        } as ChipData;
    }

    /**
     * change the appropriate state control based on the latest selected value
     * @param event a list of states in the form of ChipData
     * @param index with respect to which state control to update the value for
     */
    changeStateControlValue(event: ChipData[], index: number): void {
        this.statesMapObj[index] = !event.length ? [] : event.map((state) => state.name);
    }

    /**
     * Adds new form on click of add new plan
     */
    addPlan(): void {
        this.addRequiredValidatorToFormFields();
        if (this.exceptionForm.valid) {
            const formArray = this.exceptionForm.get("planDetails") as FormArray;
            const plansToBeRemoved = formArray.value
                .filter((plan) => plan.product && plan.availablePolicySeries.length <= 1)
                .map((plan) => plan.product);
            const newForm = this.createPlan();
            newForm.controls.availableProducts.setValue(
                this.products.filter((product) => !plansToBeRemoved.includes(product.product.name)),
            );
            formArray.push(newForm);

            const count = this.exceptionForm.controls.planDetails["controls"].length;
            this.statesMapObj[count - 1] = [];
        }
    }

    /**
     * Dates formatter
     * @param date
     * @returns formatter
     */
    dateFormatter(date: any): any {
        return this.datePipe.transform(date, DateFormat.YEAR_MONTH_DAY);
    }

    /**
     * Function to create new exception
     */
    submitException(): void {
        this.invalidDate = false;
        const payLoadArray = [];
        this.currentResultSnapShot.length = 0; // empty array
        this.addRequiredValidatorToFormFields();
        if (this.exceptionForm.valid) {
            if (this.exceptionForm.controls.exceptionType.value === AllowWithdrawnPlan.ALLOW_WITHDRAWN_API) {
                this.exceptionForm.value.planDetails.forEach((plan, i) => {
                    const exceptionPayload = {
                        type: AllowWithdrawnPlan.ALLOW_WITHDRAWN_API,
                        planId: plan.planName,
                        validity: {
                            effectiveStarting: this.dateFormatter(this.exceptionForm.value.startDate),
                            expiresAfter: this.dateFormatter(this.exceptionForm.value.endDate),
                        },
                        states: this.statesMapObj[i].map(
                            (stateName) => this.allStates.find((state) => state.name === stateName).abbreviation,
                        ),
                    };
                    payLoadArray.push(exceptionPayload);
                });
            } else {
                const exceptionPayload = {
                    type: this.exceptionForm.value.exceptionType,
                    validity: {
                        effectiveStarting: this.dateFormatter(this.exceptionForm.value.startDate),
                        expiresAfter: this.dateFormatter(this.exceptionForm.value.endDate),
                    },
                    maxPlans: this.exceptionForm.value.maxValue ? this.exceptionForm.value.maxValue : 0,
                };
                payLoadArray.push(exceptionPayload);
            }
            this.showSpinner = true;
            concat(
                ...payLoadArray.map((payload, ind) =>
                    this.exceptionService.addException(this.data.mpGroup.toString(), payload).pipe(
                        map((res) => ({ success: true })),
                        catchError((e: HttpErrorResponse): Observable<NewExceptionResult> => {
                            if (e.error.status === AppSettings.API_RESP_409) {
                                this.invalidDate = true;
                                this.exceptionForm.controls.startDate.setErrors({ invalidDate: true });
                                this.exceptionForm.controls.startDate.updateValueAndValidity();
                            }
                            return of({ success: false, error: e.error });
                        }),
                    ),
                ),
            )
                .pipe(
                    take(payLoadArray.length),
                    toArray(),
                    tap((res) => {
                        this.currentResultSnapShot = res;
                    }),
                )
                .subscribe((newExceptionResult) => {
                    this.showSpinner = false;
                    // Has forms that were submitted
                    this.hasSubmittedForms = false;
                    if (newExceptionResult.find((entry) => entry.success === true)) {
                        this.hasSubmittedForms = true;
                    }
                    // No forms with success = false
                    if (!newExceptionResult.find((entry) => entry.success === false)) {
                        // No error
                        this.closeDialog();
                    } else {
                        // There are errors. Remove all forms that were successfully submitted.
                        newExceptionResult.forEach((formResult, i) => {
                            if (formResult.success === true) {
                                this.removePlan(i);
                            }
                        });
                    }
                });
        }
    }

    /**
     * Removes plan
     * @param index of the plan to be removed
     */
    removePlan(index: number): void {
        const arrayControl = this.exceptionForm.controls["planDetails"] as FormArray;
        arrayControl.removeAt(index);
        this.statesMapObj.splice(index, 1);
        this.currentResultSnapShot.splice(index, 1);
        this.allStates$.splice(index, 1);
        this.allStatesSubjects$.splice(index, 1);
        this.changeStrategies$.splice(index, 1);
        this.changeStrategySubjects$.splice(index, 1);
        this.stateValueChipSelects.splice(index, 1);
    }

    /**
     * add appropriate validation messages for all forms
     */
    addRequiredValidatorToFormFields(): void {
        Object.keys(this.exceptionForm.controls).forEach((key) => {
            const ctrl = this.exceptionForm.get(key);
            if (ctrl instanceof FormArray) {
                ctrl.controls.forEach((planDetailForm, i) => {
                    this.changeStrategySubjects$[i].next();
                    Object.keys((planDetailForm as FormGroup).controls).forEach((arrkey) => {
                        const arrctrl = planDetailForm.get(arrkey);
                        if (arrkey !== "states") {
                            arrctrl.setValidators([Validators.required]);
                            arrctrl.updateValueAndValidity({ emitEvent: false });
                            arrctrl.markAsTouched();
                        } else if (!this.statesMapObj || (this.statesMapObj[i] && this.statesMapObj[i].length === 0)) {
                            arrctrl.setErrors({ required: true });
                            arrctrl.markAsTouched();
                        } else if (this.statesMapObj[i] && this.statesMapObj[i].length > 0) {
                            arrctrl.updateValueAndValidity();
                            arrctrl.markAsTouched();
                        }
                    });
                });
            }
        });
    }

    /**
     * function to fetch language strings
     */
    fetchLanguageData(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.requiredField",
            "primary.portal.common.selectionRequired",
            "primary.portal.census.errorMessage.general.error.date_format",
            "primary.portal.common.placeholderSelect",
            "primary.portal.productExceptions.newException.title",
            "primary.portal.productExceptions.newException.plural.title",
            "primary.portal.productExceptions.newException.exceptionType",
            "primary.portal.productExceptions.newException.startDate",
            "primary.portal.productExceptions.newException.endDate",
            "primary.portal.productExceptions.newException.product",
            "primary.portal.productExceptions.newException.policySeries",
            "primary.portal.productExceptions.newException.planName",
            "primary.portal.productExceptions.newException.states",
            "primary.portal.productExceptions.newException.selectAll",
            "primary.portal.productExceptions.newException.addAnotherPlan",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
            "primary.portal.common.save",
            "primary.portal.common.close",
            "primary.portal.productExceptions.newException.cantBeInPast",
            "primary.portal.productExceptions.newException.mustBeBefore",
            "primary.portal.productExceptions.errors.409.duplicate",
            "primary.portal.productExceptions.newException.startDateOverlap",
            "primary.portal.productExceptions.newException.maxPlans",
            "primary.portal.productExceptions.newException.cannotExceed",
            "primary.portal.productExceptions.newException.minimumZero",
            "primary.portal.census.editEstimate.onlyNumbers",
        ]);
        this.secondaryLanguage = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
            "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
            "secondary.portal.benefitsOffering.coverageDates.startDate.validation",
        ]);
    }
    /**
     * set the appropriate form when policy series selection changes on it
     * @param index to indicate which exception we are talking about here
     */
    onPolicySeriesSelectionChange(policySeries: string, index: number): void {
        this.isChecked = false;
        const formArrRef = this.exceptionForm.get("planDetails") as FormArray;
        const selectedForm = formArrRef.at(index) as FormGroup;
        this.disablePlanState[index] = false;
        selectedForm.controls.planName.reset();
        if (this.statesMapObj && this.statesMapObj[index]) {
            this.statesMapObj[index] = [];
        }
        selectedForm.controls.states.setErrors(null);
        selectedForm.controls.planName.clearValidators();
        formArrRef.updateValueAndValidity();
        this.updatePolicySeries();
        selectedForm.controls.availablePlans.setValue(this.getPlanName(policySeries, index));
        this.allStatesSubjects$[index].next([]);
        this.statesChipSelects.toArray()[index].clear();
    }

    /**
     * Closes dialog
     */
    closeDialog(): void {
        let data;
        if (this.hasSubmittedForms) {
            data = { data: {} };
        }
        this.matDialogRef.close(data);
    }

    /**
     * Changes the min end date value according to selected start date.
     * If the start date is valid it updates the min end date to be 1 greater than the start date entered.
     * If start date is invalid, it displays the correct error message.
     * When the start date exceeds end date (OR START_DATE_MAX, if end date is undefined or invalid) the following messages are displayed.
     * If entered end date is defined and valid: "Must be before end date"
     * If there is no end entered or end date is invalid: "Must be before end date"
     */
    subscribeToStartDateValueChanges(): void {
        const startDateControl = this.exceptionForm.get("startDate");
        const endDateControl = this.exceptionForm.get("endDate");
        startDateControl.valueChanges
            .pipe(
                takeUntil(this.unsub$),
                filter(Boolean),
                map((startDate) => this.dateService.toDate(startDate.toString())),
                distinctUntilChanged(),
            )
            .subscribe((startDate) => {
                if (this.dateService.isValid(startDate) && startDateControl.valid) {
                    // If start date is valid min end date is 1 greater day than start date
                    this.endDateMin = this.dateService.addDays(startDate, 1);
                } else {
                    // If start date is invalid reset end date to the original constant
                    this.endDateMin = this.minEndDate;
                    if (startDateControl.errors && startDateControl.errors.matDatepickerMax) {
                        // If end date is defined and valid and one minus end date is same or before 364 days into the future,
                        // Show: "Must be before end date" else show "Must be before <mm/dd/yyyy>"
                        this.startDateMaxError =
                            endDateControl.valid &&
                            endDateControl.value &&
                            endDateControl.value.isValid() &&
                            this.dateService.isBeforeOrIsEqual(endDateControl.value, startDate)
                                ? this.secondaryLanguage["secondary.portal.benefitsOffering.coveragedates.invalidStartDate"]
                                : `${
                                    this.languageStrings["primary.portal.productExceptions.newException.mustBeBefore"]
                                } ${this.dateService.format(this.maxStartDate, DateFormat.MONTH_DAY_YEAR)}`;
                    }
                }
            });
    }

    /**
     * Changes the max start date value according to selected end date.
     * If the end date is valid it updates the max start date to be 1 less than the end date entered.
     * If end date is invalid, it displays the correct error message.
     * When the end date precedes start date (OR END_DATE_MIN, if start date is undefined or invalid) the following messages are displayed.
     * If entered start date is defined and valid: "Must be after start date"
     * If a past date is entered: "Can't be in the past"
     */
    subscribeToEndDateValueChanges(): void {
        const endDateControl = this.exceptionForm.get("endDate");
        endDateControl.valueChanges
            .pipe(
                takeUntil(this.unsub$),
                filter(Boolean),
                map((endDate) => this.dateService.toDate(endDate.toString())),
                distinctUntilChanged(),
            )
            .subscribe((endDate) => {
                if (this.dateService.isValid(endDate) && endDateControl.valid) {
                    const oneDayMinusEndDate = this.dateService.subtractDays(endDate, 1);
                    this.startDateMax = this.dateService.isBeforeOrIsEqual(oneDayMinusEndDate, this.maxStartDate)
                        ? oneDayMinusEndDate
                        : this.maxStartDate;
                } else {
                    const startDateValue = this.dateService.toDate(this.exceptionForm.get("startDate").value.toString());
                    const isSameDate = this.dateService.getDifferenceInDays(startDateValue, endDate) === 0;
                    this.startDateMax = this.maxStartDate;
                    if (endDateControl.errors && endDateControl.errors.matDatepickerMin) {
                        if (this.dateService.isBefore(endDate)) {
                            this.endDateMinError = this.languageStrings["primary.portal.productExceptions.newException.cantBeInPast"];
                        } else if (isSameDate) {
                            this.endDateMinError =
                                this.secondaryLanguage["secondary.portal.benefitsOffering.coverageDates.startDate.validation"];
                        } else {
                            this.endDateMinError = this.secondaryLanguage["secondary.portal.benefitsOffering.coveragedates.invalidenddate"];
                        }
                    }
                }
            });
    }

    /**
     * getting the error to display
     * @param error the error from API
     */
    getError(error: any): string {
        return this.languageStrings[`primary.portal.productExceptions.errors.${error.status}.${error.code}`];
    }
    onPlanChange(): void {
        this.isChecked = false;
    }
    /**
     * reset plan states form field upon change of plan name for a given exception
     * @param states a list of the plan states
     * @param index indicates which exception we're changing
     */
    onPlanNameChange(states: CountryState[], index: number): void {
        const currentStates = [...states].sort((a, b) => this.sortStates(a, b)).map((state) => this.constructStateChipData(state));
        this.allStatesSubjects$[index].next(currentStates);
    }
    /**
     * unsubscribe subscriptions
     */
    ngOnDestroy(): void {
        this.unsub$.next();
        this.unsub$.complete();
    }
}
