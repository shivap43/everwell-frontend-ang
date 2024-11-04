import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { SharedActions, SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { combineLatest, merge, Observable, Subject } from "rxjs";
import { distinctUntilChanged, map, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { EnrollmentMethod, Flow, SettingsDropdownName, CountryState } from "@empowered/constants";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { STATE_NY } from "./enrollment-location.const";
import { AccountUtilService } from "@empowered/common-services";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-enrollment-location",
    templateUrl: "./enrollment-location.component.html",
    styleUrls: ["./enrollment-location.component.scss"],
})
export class EnrollmentLocationComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef!: DropDownPortalComponent;

    // Form creation
    readonly form: FormGroup = this.fb.group({
        state: [null, Validators.required],
        city: [null, Validators.required],
    });

    // Store observables required to load form
    private readonly selectedCountryStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity),
    );
    private readonly selectedCountryState$ = this.selectedCountryStateAndCity$.pipe(map(({ countryState }) => countryState));
    private readonly selectedCity$ = this.selectedCountryStateAndCity$.pipe(map(({ city }) => city));

    readonly cities$ = merge(this.selectedCountryState$, this.form.controls.state.valueChanges).pipe(
        switchMap((countryState: CountryState) =>
            this.ngrxStore.onAsyncValue(select(SharedSelectors.getCities(countryState?.abbreviation))),
        ),
    );
    private readonly selectedEnrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));
    private readonly crossBorderRules$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedCrossBorderRules));

    // Indicates if selected flow is direct
    readonly isDirectFlow$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedFlow)).pipe(map((flow) => flow === Flow.DIRECT));

    // Gets enrollment states based on selected flow and selected state
    readonly enrollmentStates$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentMethodDetail)).pipe(
        withLatestFrom(this.selectedCountryState$, this.isDirectFlow$),
        map(([enrollmentMethodDetail, selectedState, isDirectFlow]) => {
            // Gets enrollment states
            let enrollmentStates = enrollmentMethodDetail.enrollmentStates;
            if (isDirectFlow) {
                // Filter enrollment states for direct flow based on selected state
                if (selectedState?.abbreviation === STATE_NY) {
                    enrollmentStates = enrollmentStates.filter((enrollmentState) => enrollmentState.state.abbreviation === STATE_NY);
                } else {
                    enrollmentStates = enrollmentStates.filter((enrollmentState) => enrollmentState.state.abbreviation !== STATE_NY);
                }
            }
            return enrollmentStates?.map((enrollmentState) => enrollmentState.state);
        }),
    );

    // observable for filtered cities based on form value and updated city list
    readonly filteredCityOptions$: Observable<string[]> = combineLatest([
        this.form.controls.city.valueChanges.pipe(startWith("")),
        this.cities$.pipe(startWith([])),
    ]).pipe(map(([value, cities]) => (value ? this.filteredCity(value, cities) : cities)));

    // Observable for current state from state value changes event
    private readonly currentState$ = this.form.controls.state.valueChanges.pipe(
        startWith(""),
        distinctUntilChanged(),
        withLatestFrom(this.enrollmentStates$.pipe(startWith([])), this.selectedEnrollmentMethod$),
        map(([currentState, enrollmentStates, enrollmentMethod]) => {
            if (currentState && enrollmentStates.length) {
                // Updates/ reset city data based on state value
                this.updateCityBasedOnState(currentState, enrollmentMethod);
                return currentState;
            }
        }),
    );

    // Observable listening for EAA/ Cross border messages
    readonly eaaResponse$ = combineLatest([
        this.selectedEnrollmentMethod$,
        this.currentState$,
        this.crossBorderRules$,
        this.selectedCountryState$,
    ]).pipe(
        map(([selectedEnrollmentMethod, currentState, crossBorderRules, selectedState]) => {
            if (selectedEnrollmentMethod === EnrollmentMethod.FACE_TO_FACE && (selectedState || currentState)) {
                return this.accountUtilService.checkCrossBorderRules(
                    currentState ? currentState.abbreviation : selectedState.abbreviation,
                    crossBorderRules,
                );
            }
            return null;
        }),
    );

    // Used to detect when to revert FormGroup
    private readonly onRevert$ = new Subject<void>();
    private readonly onReset$ = new Subject<void>();
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();
    showResetButton$!: Observable<boolean>;

    // Translations
    languageStrings: Record<string, string>;

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly ngrxStore: NGRXStore,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly accountUtilService: AccountUtilService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.LOCATION);

        // Translations
        this.languageStrings = this.getLanguageStrings();
    }

    /**
     * Sets initial values and revert logic
     */
    ngOnInit(): void {
        super.onInit();

        // Set initial values to form
        this.setInitialValues();

        // Disables/enables form based enrollment method is Face to Face
        this.disableOnFaceToFace();

        this.onReset$
            .pipe(
                tap(() => {
                    if (this.form.invalid || !this.form.controls.city.value) {
                        return;
                    }
                    this.portalRef?.hide();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // logic to revert
        merge(this.onRevert$)
            .pipe(
                withLatestFrom(this.selectedCountryState$, this.selectedCity$),
                tap(([, state, city]) => {
                    this.revertFormValues(state, city);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Sets initial values of form from store
     */
    setInitialValues(): void {
        combineLatest([this.selectedCountryState$, this.selectedCity$])
            .pipe(
                tap(([selectedState, selectedCity]) => {
                    // Sets form Values
                    this.setFormValues(selectedState, selectedCity);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Disables/enables form based enrollment method is Face to Face
     */
    disableOnFaceToFace(): void {
        this.selectedEnrollmentMethod$
            .pipe(
                withLatestFrom(this.selectedCountryState$),
                tap(([selectedEnrollmentMethod, selectedState]) => {
                    // Logic to disable form if enrollment method is not Face to Face
                    if (selectedEnrollmentMethod !== EnrollmentMethod.FACE_TO_FACE) {
                        this.form.disable({ emitEvent: false });
                    } else if (selectedState.abbreviation === STATE_NY) {
                        // For NY State, state option should be disabled. Only city is enabled.
                        this.form.controls.state.disable({ emitEvent: false });
                        this.form.controls.city.enable({ emitEvent: false });
                    } else {
                        this.form.enable({ emitEvent: false });
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Sets state and city values to form
     * @param state state
     * @param city city
     */
    setFormValues(state: CountryState, city: string): void {
        this.form.patchValue({
            state: state,
            city: city,
        });
    }

    /**
     * Resets form on click on revert
     * @param state state
     * @param city city
     */
    revertFormValues(state: CountryState, city: string): void {
        this.form.reset({ state, city });
    }

    /**
     * Resets form on hide of dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Logic to run on show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Validates form and dispatches store action on click of apply
     */
    onApply(): void {
        this.form.markAllAsTouched();

        if (this.form.invalid || !this.form.controls.city.value) {
            return;
        }

        // Sets state and city values to store
        this.setSelectedStateAndCity(this.form.controls.state.value, this.form.controls.city.value);

        this.portalRef?.hide();

        this.onApply$.next();
    }

    /**
     * Resets form on click of revert
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onRevert();
        this.onReset$.next();
    }

    /**
     * Dispatches actions to set selected state and city
     * @param state selected state
     * @param city selected city
     */
    setSelectedStateAndCity(countryState: CountryState, city: string): void {
        this.ngrxStore.dispatch(
            SharedActions.setSelectedCountryStateAndCity({
                countryState,
                city,
            }),
        );
    }

    /**
     * private function to get the matching list of cities based on value
     * @param value value entered by user
     * @param cities list of cities
     * @returns filtered list of cities
     */
    private filteredCity(value: string, cities: string[]): string[] {
        const filterValue = value.toLowerCase();
        return cities.filter((option) => option.toLowerCase().startsWith(filterValue));
    }

    /**
     * Removes typed city by user if not present in cities list on blur
     * @param cities list of cities
     */
    removeCityText(cities: string[]): void {
        const typedValue = cities.find((item) => item.toLowerCase() === this.form.controls.city.value?.toLowerCase());
        if (typedValue) {
            this.form.controls.city.setValue(typedValue);
        } else if (typedValue === undefined) {
            this.form.controls.city.setValue("");
        }
    }

    /**
     * Updates/ Rest cities data based on state change and enrollment method
     * @param state entered state
     * @param enrollmentMethod selected enrollment method
     */
    updateCityBasedOnState(state: CountryState, enrollmentMethod: EnrollmentMethod): void {
        if (state && enrollmentMethod === EnrollmentMethod.FACE_TO_FACE) {
            // City should not be changed  when state value is changed for non-F2F enrollments
            // Dispatches action to load cities based on state
            this.ngrxStore.dispatch(SharedActions.loadCities({ stateAbbreviation: state.abbreviation }), true);
            this.form.controls.city.reset();
        }
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.placeholderSelect",
            "primary.portal.common.requiredField",
            "primary.portal.location.employeeStateInfo",
            "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
            "primary.portal.enrollmentMethod.missingEAAWarning",
            "primary.portal.location.customerStateInfo",
            "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
        ]);
    }

    /**
     * Comparator function used to determine if the state has this option selected. Without it, there is no visual
     * that something state has  been selected.
     *
     * @param state1 First state option
     * @param state2 Second state option
     */
    compareStateValue(state1: CountryState, state2: CountryState): boolean {
        return state1?.name === state2?.name;
    }

    /**
     * Returns unique identifier for CountryState.
     * trackBy for *ngFor involving CountryStates used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param state {CountryState} current CountryState in iteration
     * @returns unique identifier for CountryState
     */
    trackByCountryStateName(index: number, state: CountryState): string {
        return state.name;
    }

    /**
     * Returns unique identifier for city.
     * trackBy for *ngFor involving cities used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param city {string} current city in iteration
     * @returns unique identifier for city
     */
    trackByCity(index: number, city: string): string {
        return city;
    }

    /**
     * Unsubscribes all subscriptions from base settings dropdown
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
