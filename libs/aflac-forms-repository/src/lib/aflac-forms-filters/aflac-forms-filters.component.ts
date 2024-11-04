import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl } from "@angular/forms";
import { FormChannel, CoreService, GetForms, FormFilters, FormsRepository, StaticService } from "@empowered/api";
import { Observable, Subject } from "rxjs";
import { CarrierId, CountryState, Product } from "@empowered/constants";
import { switchMap, takeUntil, tap } from "rxjs/operators";
import { Store } from "@ngxs/store";
type SearchType = "FILTER_SEARCH" | "FORM_SEARCH";
const CHAR_CODE_SLASH = 47;
const CHAR_CODE_COLON = 58;
const CHAR_CODE_AT_SIGN = 64;
const CHAR_CODE_LEFT_SQUARE_BRACKET = 91;
const CHAR_CODE_GRAVE_ACCENT = 96;
const CHAR_CODE_LEFT_CURLY_BRACE = 123;
const CHAR_CODE_SPACE = 32;
const CHAR_CODE_UNDERSCORE = 95;
interface SelectOptions<T> {
    value: T;
    viewValue: string;
}
enum FilterTypes {
    FORM_TYPE = "formType",
    CHANNELS = "channels",
    PRODUCTS = "products",
    POLICY_SERIES = "PolicySeries",
    STATES = "states",
}

@Component({
    selector: "empowered-aflac-forms-filters",
    templateUrl: "./aflac-forms-filters.component.html",
    styleUrls: ["./aflac-forms-filters.component.scss"],
})
export class AflacFormsFiltersComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.formRepository.searchType",
        "primary.portal.coverage.filter",
        "primary.portal.formRepository.form",
        "primary.portal.customer.all",
        "primary.portal.editCoverage.select",
        "primary.portal.formRepository.formType",
        "primary.portal.formRepository.channel",
        "primary.portal.formRepository.product",
        "primary.portal.formRepository.policySeries",
        "primary.portal.formRepository.state",
        "primary.portal.common.search",
        "primary.portal.formRepository.searchForms",
        "primary.portal.formRepository.form",
        "primary.portal.formRepository.filtersSelected",
        "primary.portal.formRepository.formNumberRequired",
        "primary.portal.forms.repository.zeroState",
    ]);
    secondaryLanguageStrings: Record<string, string> = {};
    @Input() formsLength: number;
    @Output() formsList: EventEmitter<FormsRepository[]> = new EventEmitter<FormsRepository[]>();
    searchType: SearchType = "FILTER_SEARCH";
    filterForm: FormGroup;
    formTypeFilterOptions: SelectOptions<string>[] = [];
    chanelFilterOptions: SelectOptions<string>[] = [];
    productsFilterOptions: SelectOptions<number>[];
    policySeriesFilterOptions: SelectOptions<string>[] = [];
    statesFilterOptions: SelectOptions<string>[] = [];
    @Output() enableSpinner: EventEmitter<boolean> = new EventEmitter<boolean>();
    noResultsFound = false;
    numberSearchInput: FormControl;
    searchTerm: string;
    FilterTypes = FilterTypes;
    private readonly unsubscribe$ = new Subject<void>();
    allStates: CountryState[];

    constructor(
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly coreService: CoreService,
        private readonly store: Store,
        private readonly staticService: StaticService,
    ) {}
    /**
     * In this ngOnInit life cycle hook we will enable spinner and initialize filters options
     */
    ngOnInit(): void {
        this.store
            .dispatch(new LoadSecondaryLandingLanguage("secondary.portal.formRepository.*"))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.secondaryLanguageStrings = this.language.fetchSecondaryLanguageValues([
                    "secondary.portal.formRepository.formNumber.required",
                    "secondary.portal.formRepository.filters.selectionrequired",
                ]);
            });
        this.enableSpinner.emit(true);
        this.initializeFilterForm();
        this.initializeFilters({ carrierId: CarrierId.AFLAC }, FilterTypes.FORM_TYPE);
    }
    /**
     * this function will initialize the filter form
     */
    initializeFilterForm(): void {
        this.filterForm = this.formBuilder.group({
            formType: [null, Validators.required],
            channel: [],
            productId: [],
            policySeries: [],
            state: [],
        });
        this.numberSearchInput = this.formBuilder.control("", Validators.required);
    }
    /**
     *  this function will return the observable of formFilters endpoint with the request body param
     * @param requestBody is the body of the request for formFilters endpoint
     * @returns Observable<FormFilters>
     */
    getFormFilters(requestBody: GetForms): Observable<FormFilters> {
        requestBody.carrierId = CarrierId.AFLAC;
        return this.coreService.getFormFilters(this.cleanFilterObj({ ...requestBody }));
    }
    /**
     * this will subscribe to the form filters endpoint observable to get filter options and will call
     * corresponding functions to update filter options
     * @param filters will be passed as request body to the form filters endpoint
     * @param filterType is used to determine what all filter options have to be updated based on hierarchy in the switch case statements
     */
    initializeFilters(filters: GetForms, filterType: FilterTypes): void {
        this.staticService
            .getStates()
            .pipe(
                tap((states) => (this.allStates = states)),
                switchMap((response) => this.getFormFilters(this.createRequestBodyForFilters(filterType, { ...filters }))),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (response: FormFilters) => {
                    // had to disable no-switch-case-fall-through rule for each case as the business functionality
                    // is to run all the cases below the matched case and not using a break statement would achieve this
                    switch (filterType) {
                        // please do not change the switch case order as it is following a hierarchy
                        case FilterTypes.FORM_TYPE:
                            this.populateFilterOptions<string>(FilterTypes.FORM_TYPE, [...response.formType].sort());
                        // eslint-disable-next-line no-fallthrough
                        case FilterTypes.CHANNELS:
                            this.populateFilterOptions<FormChannel>(
                                FilterTypes.CHANNELS,
                                [...response.channels].sort((a, b) => (a.name > b.name ? 1 : -1)),
                            );
                        // eslint-disable-next-line no-fallthrough
                        case FilterTypes.PRODUCTS:
                            this.populateFilterOptions<Product>(
                                FilterTypes.PRODUCTS,
                                [...response.products].sort((a, b) => (a.name > b.name ? 1 : -1)),
                            );
                        // eslint-disable-next-line no-fallthrough
                        case FilterTypes.POLICY_SERIES:
                            this.populateFilterOptions<string>(FilterTypes.POLICY_SERIES, [...response.policySeries].sort());
                        // eslint-disable-next-line no-fallthrough
                        case FilterTypes.STATES:
                            this.populateFilterOptions<CountryState>(FilterTypes.STATES, [...this.allStates].sort());
                    }

                    this.enableSpinner.emit(false);
                },
                () => {
                    this.enableSpinner.emit(false);
                },
            );
    }
    /**
     * This function will update the filter options when a filter selection changes
     * @param filterType is the changed selection filter type
     */
    updateFilterOptions(filterType: FilterTypes): void {
        this.enableSpinner.emit(true);
        this.initializeFilters(this.filterForm.value, filterType);
    }
    /**
     * this will populate the filter options to be displayed
     * @param filterType to be populated
     * @param values to be populated for the filter type
     */
    populateFilterOptions<T>(filterType: FilterTypes, values: T[]): void {
        switch (filterType) {
            case FilterTypes.CHANNELS: {
                this.chanelFilterOptions = [];
                this.updateChannelTypeFilterOptions(values as unknown as FormChannel[]);
                this.updateControlValue<string>(
                    this.filterForm.controls.channel,
                    this.chanelFilterOptions.map((option) => option.value),
                );
                break;
            }
            case FilterTypes.FORM_TYPE: {
                this.formTypeFilterOptions = [];
                this.updateStringTypeFilterOptions(values as unknown as string[], FilterTypes.FORM_TYPE);
                this.updateControlValue<string>(
                    this.filterForm.controls.formType,
                    this.formTypeFilterOptions.map((option) => option.value),
                );
                break;
            }
            case FilterTypes.POLICY_SERIES: {
                this.policySeriesFilterOptions = [];
                this.updateStringTypeFilterOptions(values as unknown as string[], FilterTypes.POLICY_SERIES);
                this.updateControlValue<string>(
                    this.filterForm.controls.policySeries,
                    this.policySeriesFilterOptions.map((option) => option.value),
                );
                break;
            }
            case FilterTypes.PRODUCTS: {
                this.productsFilterOptions = [];
                this.updateProductTypeFilterOptions(values as unknown as Product[]);
                this.updateControlValue<number>(
                    this.filterForm.controls.productId,
                    this.productsFilterOptions.map((option) => option.value),
                );
                break;
            }
            case FilterTypes.STATES: {
                this.statesFilterOptions = this.updateStateTypeFilterOptions(values as unknown as CountryState[]);
                this.updateControlValue<string>(
                    this.filterForm.controls.state,
                    this.statesFilterOptions.map((option) => option.value),
                );
                break;
            }
        }
    }
    /**
     *this function will update the filter options
     * @param values to be updated
     * @param filterType to which values has to be updated
     */
    updateStringTypeFilterOptions(values: string[], filterType: FilterTypes): void {
        switch (filterType) {
            case FilterTypes.STATES: {
                values.forEach((value) => {
                    this.statesFilterOptions.push({
                        value: value,
                        viewValue: value,
                    });
                });
                break;
            }
            case FilterTypes.POLICY_SERIES: {
                values.forEach((value) => {
                    this.policySeriesFilterOptions.push({
                        value: value,
                        viewValue: value,
                    });
                });
                break;
            }
            case FilterTypes.FORM_TYPE:
                {
                    values.forEach((value) => {
                        this.formTypeFilterOptions.push({
                            value: value,
                            viewValue: value,
                        });
                    });
                }
                break;
        }
    }
    /**
     * this function will update product type filter options
     * @param values to be updated
     */
    updateProductTypeFilterOptions(values: Product[]): void {
        values.forEach((value) => {
            this.productsFilterOptions.push({
                value: value.productId,
                viewValue: value.name,
            });
        });
    }
    /**
     * this function will update state type filter options
     * @param countryStates to be updated
     */
    updateStateTypeFilterOptions(countryStates: CountryState[]): SelectOptions<string>[] {
        return countryStates.map((countryState) => ({
            value: countryState.abbreviation,
            viewValue: countryState.name,
        }));
    }
    /**
     * this function will update channel type filter options
     * @param values to be updated
     */
    updateChannelTypeFilterOptions(values: FormChannel[]): void {
        values.forEach((value) => {
            this.chanelFilterOptions.push({
                value: value.value,
                viewValue: value.name,
            });
        });
    }
    /**
     * this function will return getForms endpoint observable
     * @param requestBody will be the body of getForms endpoint
     * @returns Observable<FormsRepository[]>
     */
    getForms(requestBody: GetForms): Observable<FormsRepository[]> {
        requestBody.carrierId = CarrierId.AFLAC;
        return this.coreService.getForms(this.cleanFilterObj({ ...requestBody }));
    }
    /**
     * This function will subscribe to getForms endpoint and will update forms list
     * @param formNumberSearch boolean flag which will be set if this is a trigger form formNumberSearch
     */
    updateFormsList(formNumberSearch: boolean): void {
        let requestBody: GetForms;
        if (formNumberSearch) {
            this.numberSearchInput.setValue(this.numberSearchInput.value.trimLeft());
            if (this.numberSearchInput.valid) {
                requestBody = {
                    formNumber: this.numberSearchInput.value.toString(),
                    carrierId: CarrierId.AFLAC,
                };
            } else {
                return;
            }
        } else if (this.filterForm.invalid) {
            return;
        }
        this.enableSpinner.emit(true);
        this.getForms(requestBody || this.filterForm.value)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.formsList.emit(response);
                    this.enableSpinner.emit(false);
                    if (formNumberSearch && response.length === 0) {
                        this.noResultsFound = true;
                        this.searchTerm = this.numberSearchInput.value;
                    }
                },
                (error) => {
                    this.enableSpinner.emit(false);
                },
            );
    }
    /**
     * This will clean the filter object before passing as a request body
     * @param filterObj to be cleaned
     * @returns cleaned filter obj
     */
    cleanFilterObj(filterObj: GetForms): GetForms {
        for (const propName in filterObj) {
            if (filterObj[propName] === null || filterObj[propName] === undefined) {
                delete filterObj[propName];
            }
        }
        return filterObj;
    }
    /**
     * This function will update the control value to null if value npt found in updated options
     * @param control of the filter
     * @param options options of the filter
     */
    updateControlValue<T>(control: AbstractControl, options: T[]): void {
        if (control.value && options.indexOf(control.value) < 0) {
            control.setValue(null);
        }
    }
    /**
     * This function will be triggered on keypress of the form number input field  and
     *  will restrict user from entering special characters other than hyphen and space
     * @param event holds the keypress event object
     * @returns boolean flag which will determine to allow or restrict the character
     */
    updateFormNumberInputValue(event: KeyboardEvent): boolean {
        const charCode = event.key.charCodeAt(0);

        return (
            (charCode > CHAR_CODE_SLASH && charCode < CHAR_CODE_COLON) ||
            (charCode > CHAR_CODE_AT_SIGN && charCode < CHAR_CODE_LEFT_SQUARE_BRACKET) ||
            (charCode > CHAR_CODE_GRAVE_ACCENT && charCode < CHAR_CODE_LEFT_CURLY_BRACE) ||
            (charCode === CHAR_CODE_SPACE && this.numberSearchInput.value.length > 0) ||
            charCode === CHAR_CODE_UNDERSCORE
        );
    }
    /**
     * this function will construct the request body object to be passed to get form filters
     * @param filterType which tells on which filter the change has occurred due to which we are updating the filters
     * @param filters the filter object to be updated
     * @return request body of type get forms
     */
    createRequestBodyForFilters(filterType: FilterTypes, filters: GetForms): GetForms {
        //  no-switch-case-fall-through is disabled as we need not use break statements as per the business use case
        switch (filterType) {
            // please do not change the switch case order as it is following a hierarchy
            case FilterTypes.FORM_TYPE:
                filters.formType = null;
            // eslint-disable-next-line no-fallthrough
            case FilterTypes.CHANNELS:
                filters.channel = null;
            // eslint-disable-next-line no-fallthrough
            case FilterTypes.PRODUCTS:
                filters.productId = null;
            // eslint-disable-next-line no-fallthrough
            case FilterTypes.POLICY_SERIES:
                filters.policySeries = null;
            // eslint-disable-next-line no-fallthrough
            case FilterTypes.STATES:
                filters.state = null;
        }
        return filters;
    }
    /**
     * life cycle hook executed on destroy will complete the unsubscribe subject
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
