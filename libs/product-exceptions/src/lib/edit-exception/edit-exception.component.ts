import { Component, OnInit, Optional, Inject, ViewChild, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AllowWithdrawnPlan, BenefitsOfferingService, ExceptionsService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { Observable, Subject, of, BehaviorSubject } from "rxjs";
import { DatePipe } from "@angular/common";
import { ChipSelectComponent } from "@empowered/ui";
import { Exceptions, CountryState, ChipData, DateInfo, DateFormat } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { takeUntil, catchError, finalize, filter, distinctUntilChanged, map, take } from "rxjs/operators";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";

export interface DialogData {
    id: number;
    mpGroup: number;
}

@Component({
    selector: "empowered-edit-exception",
    templateUrl: "./edit-exception.component.html",
    styleUrls: ["./edit-exception.component.scss"],
})
export class EditExceptionComponent implements OnInit, OnDestroy {
    maxStartDate = this.dateService.addDays(new Date(), DateInfo.START_DATE_OFFSET_DAYS);
    minEndDate = this.dateService.addDays(new Date(), 1);
    today = new Date();
    exceptionData: Exceptions;
    exceptionForm: FormGroup;
    @ViewChild("input") matInput;
    @ViewChild(ChipSelectComponent) statesChipSelect: ChipSelectComponent;
    withDrawnPlan = [AllowWithdrawnPlan.ALLOW_DROPDOWN];
    products = [];
    prepopulateProduct: string;
    prepopulatePolicy: string;
    PlansForProduct = [];
    planSelected = [];
    isChecked = false;
    stateDropdownData: any;
    initialStateValues: string[] = [];
    lastFilter: string;
    filteredState: Observable<CountryState[]>;
    statesForPlan = [];
    updatedStates = [];
    languageStrings: Record<string, string>;
    startDateIsSameOrBeforeToday = false;
    showSpinner = false;
    startDateMax = this.dateService.addDays(new Date(), DateInfo.START_DATE_OFFSET_DAYS);
    endDateMax = this.dateService.addYears(new Date(), DateInfo.END_DATE_OFFSET_YEARS);
    endDateMin = this.dateService.addDays(new Date(), 1);
    dateFormat = DateFormat.MONTH_DAY_YEAR;
    returnData = null;
    exceptionPayload: any;
    selectAllStates: CountryState[] = [];
    private readonly unsub$: Subject<void> = new Subject<void>();
    private readonly changeStrategySubject$: Subject<void> = new Subject();
    private readonly allStatesSubject$ = new BehaviorSubject<ChipData[]>([]);
    changeStrategy$ = this.changeStrategySubject$.asObservable();
    allStates$ = this.allStatesSubject$.asObservable();
    stateValueChipSelect: FormControl;
    errorMessage = "";
    endDateMinError: string;
    startDateMaxError: string;
    secondaryLanguage: Record<string, string>;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<EditExceptionComponent>,
        private readonly exceptionService: ExceptionsService,
        private readonly formBuilder: FormBuilder,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly ref: ChangeDetectorRef,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.fetchLanguageData();
        this.getException();
    }
    getException(): void {
        this.exceptionService
            .getException(this.data.mpGroup.toString(), this.data.id)
            .pipe(takeUntil(this.unsub$))
            .subscribe((data) => {
                this.exceptionData = data;
                this.getExceptionPlansByExceptionType(this.exceptionData);
            });
    }
    getExceptionPlansByExceptionType(exceptionData: Exceptions): void {
        this.benefitsOfferingService
            .getExceptionPlansByExceptionType(this.data.mpGroup, AllowWithdrawnPlan.ALLOW_WITHDRAWN_API)
            .pipe(take(1))
            .subscribe((data) => {
                // Do not show product that does not have policySeries for any plan.
                this.products = data
                    .filter((product) => product.product.plans.every((plan) => plan.policySeries))
                    .sort((a, b) => (a.product.name < b.product.name ? -1 : a.product.name > b.product.name ? 1 : 0));
                this.constructForm(exceptionData, this.products);
            });
    }
    /**
     * construct the form
     * @param exceptionData: the exception record information from the DB
     * @param products
     */
    constructForm(exceptionData: Exceptions, products: any): void {
        if (this.dateService.checkIsTodayOrBefore(exceptionData.validity.effectiveStarting.toString())) {
            this.startDateIsSameOrBeforeToday = true;
        }
        products.forEach((product) => {
            product.product.plans.forEach((plan) => {
                if (plan.id === exceptionData.plan.id) {
                    this.prepopulateProduct = product.product.name;
                    this.prepopulatePolicy = plan.policySeries;
                    this.statesForPlan = plan.states;
                }
            });
        });
        this.allStatesSubject$.next(
            [...this.statesForPlan].sort((a, b) => this.sortStates(a, b)).map((state) => this.constructStateChipData(state)),
        );
        const statesList: string[] = [];
        exceptionData.states.sort().forEach((state) => {
            const stateData = this.statesForPlan.find((stateName) => stateName.abbreviation === state);
            statesList.push(stateData.name);
            this.initialStateValues.push(stateData.abbreviation);
        });
        // default start date to today's date if the start date is not editable (in the past)
        this.exceptionForm = this.formBuilder.group(
            {
                // Exception type cannot be changed in 'edit' mode.
                exceptionType: [{ value: this.withDrawnPlan[0], disabled: true }],
                startDate: [
                    {
                        value: this.startDateIsSameOrBeforeToday
                            ? new Date()
                            : this.dateService.toDate(exceptionData.validity.effectiveStarting.toString()),
                        disabled: this.startDateIsSameOrBeforeToday,
                    },
                    Validators.required,
                ],
                endDate: [this.dateService.toDate(exceptionData.validity.expiresAfter.toString()), Validators.required],
                product: [{ value: this.prepopulateProduct, disabled: this.startDateIsSameOrBeforeToday }],
                policySeries: [{ value: this.prepopulatePolicy, disabled: this.startDateIsSameOrBeforeToday }],
                planName: [{ value: exceptionData.plan.id, disabled: this.startDateIsSameOrBeforeToday }],
            },
            { updateOn: "blur" },
        );
        this.stateValueChipSelect = new FormControl(statesList, { updateOn: "change" });
        this.exceptionForm.addControl("states", this.stateValueChipSelect);
        this.subscribeToStartDateValueChanges();
        this.subscribeToEndDateValueChanges();
    }
    /**
     * trigger other form controls upon selecting a product
     * @param selectedProduct
     */
    getSelectedProduct(selectedProduct: string): void {
        this.exceptionForm.controls.policySeries.setValue(undefined);
        this.exceptionForm.controls.planName.setValue(undefined);
        this.ref.detectChanges();
        this.getPolicySeries(selectedProduct);
        this.exceptionForm.get("policySeries").reset();
        this.allStatesSubject$.next([]);
        this.statesChipSelect.clear();
    }
    getPolicySeries(selectedProduct: string): Array<string> {
        this.PlansForProduct = this.products.filter((product) => product.product.name === selectedProduct);
        if (this.PlansForProduct.length > 0) {
            const policySeries = [];
            this.PlansForProduct[0].product.plans.forEach((plan) => {
                policySeries.push(plan.policySeries);
            });
            return policySeries.sort();
        }
        return this.returnData;
    }
    getPlanName(selectedPlan: string): Array<string> {
        if (this.PlansForProduct.length > 0) {
            this.planSelected = this.PlansForProduct[0].product.plans.filter((plan) => plan.policySeries === selectedPlan);
            if (this.planSelected && this.planSelected.length > 0) {
                this.selectAllStates = this.planSelected[0].states;
            }
            return this.planSelected;
        }
        return this.returnData;
    }
    dateFormatter(date: Date | string): string {
        return this.datePipe.transform(date, DateFormat.YEAR_MONTH_DAY);
    }
    closeView(): void {
        this.matDialogRef.close();
    }

    /**
     * update exception
     */
    updateException(): void {
        this.changeStrategySubject$.next();
        this.addRequiredValidatorToFormFields();
        const exceptionFormValue = this.exceptionForm.getRawValue();
        this.exceptionPayload = {
            type: AllowWithdrawnPlan.ALLOW_WITHDRAWN_API,
            planId: exceptionFormValue.planName,
            validity: {
                effectiveStarting: this.dateFormatter(
                    this.startDateIsSameOrBeforeToday ? this.dateFormatter(new Date()) : exceptionFormValue.startDate,
                ),
                expiresAfter: this.dateFormatter(exceptionFormValue.endDate),
            },
            states: exceptionFormValue.states,
        };
        if (this.exceptionForm.valid) {
            this.showSpinner = true;
            this.exceptionService
                .updateException(this.data.mpGroup.toString(), this.data.id, this.exceptionPayload)
                .pipe(
                    takeUntil(this.unsub$),
                    catchError((e: HttpErrorResponse): Observable<HttpResponse<void> | HttpErrorResponse> => {
                        this.errorMessage =
                            this.languageStrings[`primary.portal.productExceptions.errors.${e.error.status}.${e.error.code}`];
                        return of(e);
                    }),
                    finalize(() => {
                        this.showSpinner = false;
                    }),
                    filter((resp) => !resp["error"]),
                )
                .subscribe((resp) => {
                    this.errorMessage = "";
                    this.matDialogRef.close({ data: resp });
                });
        }
    }
    /**
     * validating fields on the form
     */
    addRequiredValidatorToFormFields(): void {
        this.exceptionForm.get("product").setValidators([Validators.required]);
        this.exceptionForm.get("product").updateValueAndValidity();
        this.exceptionForm.get("policySeries").setValidators([Validators.required]);
        this.exceptionForm.get("policySeries").updateValueAndValidity();
        this.exceptionForm.get("planName").setValidators([Validators.required]);
        this.exceptionForm.get("planName").updateValueAndValidity();
        if (this.exceptionForm.value.states === null) {
            this.exceptionForm.get("states").setErrors({ required: true });
            this.exceptionForm.get("states").markAsTouched();
        }
    }
    fetchLanguageData(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.productExceptions.newException.editTitle",
            "primary.portal.productExceptions.newException.exceptionType",
            "primary.portal.productExceptions.newException.startDate",
            "primary.portal.productExceptions.newException.endDate",
            "primary.portal.productExceptions.newException.product",
            "primary.portal.productExceptions.newException.policySeries",
            "primary.portal.productExceptions.newException.planName",
            "primary.portal.productExceptions.newException.states",
            "primary.portal.common.cancel",
            "primary.portal.common.save",
            "primary.portal.common.close",
            "primary.portal.census.errorMessage.general.error.date_format",
            "primary.portal.productExceptions.newException.cantBeInPast",
            "primary.portal.productExceptions.newException.mustBeBefore",
            "primary.portal.common.selectionRequired",
            "primary.portal.benefitsOffering.setting.selectAll",
            "primary.portal.common.requiredField",
            "primary.portal.productExceptions.errors.409.duplicate",
        ]);
        this.secondaryLanguage = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
            "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        ]);
    }

    /**
     * reset plan name and states upon change of policy series
     */
    onPolicySeriesSelectionChange(): void {
        this.exceptionForm.get("planName").reset();
        this.allStatesSubject$.next([]);
        this.statesChipSelect.clear();
    }

    /**
     * reset plan states form field upon change of plan name
     * @param states a list of the plan states
     */
    onPlanNameChange(states: CountryState[]): void {
        const currentStates = [...states].sort((a, b) => this.sortStates(a, b)).map((state) => this.constructStateChipData(state));
        this.allStatesSubject$.next(currentStates);
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
     * update the state form control
     * @param event a list of selected chips
     */
    changeStateControl(event: ChipData[]): void {
        if (!event.length) {
            this.exceptionForm.controls.states.reset();
        } else {
            this.exceptionForm.controls.states.setValue(event.map((chip) => chip.value));
        }
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
                            this.dateService.checkIsTodayOrBefore(endDateControl.value)
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
                    this.startDateMax = this.dateService.checkIsTodayOrBefore(this.maxStartDate.toString())
                        ? oneDayMinusEndDate
                        : this.maxStartDate;
                } else {
                    this.startDateMax = this.maxStartDate;
                    if (endDateControl.errors && endDateControl.errors.matDatepickerMin) {
                        this.endDateMinError = this.dateService.isBefore(this.today)
                            ? this.languageStrings["primary.portal.productExceptions.newException.cantBeInPast"]
                            : this.secondaryLanguage["secondary.portal.benefitsOffering.coveragedates.invalidenddate"];
                    }
                }
            });
    }

    /**
     * unsubscribe subscriptions on destroy of component
     */
    ngOnDestroy(): void {
        this.unsub$.next();
        this.unsub$.complete();
    }
}
