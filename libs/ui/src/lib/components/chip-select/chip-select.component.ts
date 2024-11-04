import { Component, ElementRef, ViewChild, EventEmitter, Input, Output, OnInit, OnDestroy } from "@angular/core";
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { FormControl } from "@angular/forms";
import { map, tap, withLatestFrom, startWith, filter, takeUntil } from "rxjs/operators";
import { Observable, BehaviorSubject, combineLatest, Subscription, isObservable, Subject } from "rxjs";
import { ChipData } from "@empowered/constants";

@Component({
    selector: "empowered-chip-select",
    templateUrl: "./chip-select.component.html",
    styleUrls: ["./chip-select.component.scss"],
})
export class ChipSelectComponent implements OnInit, OnDestroy {
    // Used to help prevent autocomplete
    randomId = Math.random();
    color = "primary";
    selectable = true;
    removable = true;
    addOnBlur = true;

    chipControl: FormControl = new FormControl();

    @Input() valuesChipControl: FormControl = new FormControl("");
    @Input() changeStrategy: Observable<void> | "change" | "blur";

    @ViewChild("input", { static: true }) input: ElementRef;
    @ViewChild(MatAutocompleteTrigger, { read: MatAutocompleteTrigger, static: true })
    inputAutoComplit: MatAutocompleteTrigger;

    // Options to be displayed
    @Input() chipOptions$: Observable<ChipData[]>;
    // Values that should be initially selected
    @Input() initSelectedChips: string[];
    @Input() hasSelectAll: boolean;
    @Input() isParentSelectable = true;

    // Handles enable/disable chip & clear icon within form
    @Input() disableChip = false;
    // Emits whenever the selection changes
    @Output() chipChange: EventEmitter<ChipData[]> = new EventEmitter();

    /**
     * DATA OBSERVABLES
     */
    // Data model for all options
    chipOptions: ChipData[] = [];
    // Data model for options that are to be selected when the data becomes available
    selectOnLoad: string[] = [];
    // Subject to allow selections to be made programatically
    private selectOnLoadSubject$: BehaviorSubject<string[]> = new BehaviorSubject([]);

    /**
     * EVENT OBSERVABLES
     */
    // Data model for the selected options
    selectedChips: ChipData[] = [];
    // Subject for selected options, triggers a psuedo-onChange to emit the latest values and keep track of selectable options
    private selectedChipSubject$: BehaviorSubject<ChipData[]> = new BehaviorSubject(this.selectedChips);
    // Emits through chipChange whenever the list of selected options changes
    private selectedChipSubscription: Subscription = this.selectedChipSubject$
        .asObservable()
        .subscribe((selections) => this.emitChipChange());

    subscriptions: Subscription[] = [];

    // Selectable options. Total options without any previously selected options
    filteredData$: Observable<ChipData[]>;

    isAllChipsSelected: boolean;
    invalidState$: Observable<boolean>;
    private readonly unsubscribe$ = new Subject<void>();
    filteredData: ChipData[];

    constructor() {}

    /**
     * Allow for data bound variables for options and selected options
     */
    ngOnInit(): void {
        this.subscriptions.push(this.selectedChipSubscription);
        if (this.changeStrategy && this.valuesChipControl) {
            if (isObservable(this.changeStrategy)) {
                this.invalidState$ = combineLatest(this.changeStrategy, this.valuesChipControl.statusChanges).pipe(
                    map((result) => this.valuesChipControl.status === "INVALID"),
                );
            } else if (this.changeStrategy === "change") {
                this.invalidState$ = this.valuesChipControl.statusChanges.pipe(map((result) => result === "INVALID"));
            } else if (this.changeStrategy === "blur") {
                this.invalidState$ = this.valuesChipControl.statusChanges.pipe(
                    filter((result) => this.chipControl.touched),
                    map((result) => result === "INVALID"),
                );
            }
        }
        if (this.chipOptions$ != null) {
            this.setChipOptions(this.chipOptions$);
        }
        if (this.initSelectedChips != null && this.initSelectedChips.length > 0) {
            this.setSelectedChips(this.initSelectedChips);
        }
    }

    onFocus(): void {
        this.chipControl.markAsUntouched();
    }

    onBlur(): void {
        this.chipControl.markAsTouched();
    }

    ngOnDestroy(): void {
        // Relinquish subscriptions
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Let listening components / parents know the value has changed
     */
    emitChipChange(): void {
        this.chipChange.emit(
            this.selectedChips.filter(
                (selectedChip) => this.chipOptions.find((chipOption) => selectedChip.value === chipOption.value) != null,
            ),
        );
    }

    /**
     * Add a chip to the list of selected options
     *
     * @param event selection event
     */
    add(event: MatAutocompleteSelectedEvent): void {
        if (!event.option || !event.option.value) {
            this.selectedChipSubject$.next(this.selectedChips);
            return;
        }
        // TODO refactor class being added
        document.getElementById(event.option.id).classList.add("bg-selected-item");

        const value = this.chipOptions.filter((i) => i.value === event.option.value)[0];

        this.selectedChips.push(value);
        this.selectedChipSubject$.next(this.selectedChips);
        this.chipControl.setValue("");
        this.valuesChipControl.setValue(this.selectedChips);
        this.openPanel();
    }

    /**
     * Remove a specific chip from the selection
     *
     * @param value value of the selected chip
     */
    remove(value: string): void {
        this.chipControl.setValue("");
        const index = this.selectedChips.findIndex((i) => i.value === value);
        if (index >= 0) {
            this.selectedChips.splice(index, 1);
            this.selectedChipSubject$.next(this.selectedChips);
        }
        this.valuesChipControl.setValue(this.selectedChips.length ? this.selectedChips : "");
        this.chipChange.emit(this.selectedChips);
    }

    /**
     * Remove all selections and emit chip change
     */
    clear(event?: MouseEvent): void {
        this.selectedChips = this.selectedChips.filter((chip) => chip.required);
        this.selectedChipSubject$.next(this.selectedChips);
        this.input.nativeElement.value = "";
        this.valuesChipControl.setValue(this.selectedChips.length ? this.selectedChips : "");
        if (event) {
            event.preventDefault();
        }
        this.chipChange.emit(this.selectedChips);
    }

    /**
     * Add all selections
     */
    selectAllChips(): void {
        this.chipOptions.forEach((chipOption) => {
            if ((this.isParentSelectable || chipOption.parentValue) && !this.selectedChips.includes(chipOption)) {
                this.selectedChips.push(chipOption);
            }
        });
        this.valuesChipControl.setValue(this.selectedChips);
        this.selectedChipSubject$.next(this.selectedChips);
    }

    /**
     * Keep the selection panel open after a selection. Bug with material closes the panel
     * and forces the user to focus off the select, and re-focus.
     */
    openPanel(): void {
        setTimeout(() => {
            this.inputAutoComplit.openPanel();
        });
    }

    /**
     * Set the options that are available (for use when creating components dynamically)
     *
     * @param newData the new options available to select
     */
    setChipOptions(newData: Observable<ChipData[]>): void {
        // Save out the initial options, and add a cheeky tap
        this.chipOptions$ = newData.pipe(
            tap((data) => {
                this.chipOptions = data;
            }),
        );
        // Filter all of the options down to what can be displayed (!Selected && matches autocomplete)
        this.filteredData$ = combineLatest([
            // all options
            this.chipOptions$,
            // selected options
            this.selectedChipSubject$.asObservable(),
            // autocomplete
            this.chipControl.valueChanges.pipe(startWith("")),
            this.selectOnLoadSubject$.asObservable(),
        ]).pipe(
            // Remove options that have been selected, and if present, the name of the option must match the autocomplete
            map(([options, selected, autoCompleteValue]) => {
                this.isAllChipsSelected =
                    options.filter((option) => this.isParentSelectable || option.parentValue).length === selected.length;
                // make sure parent chips are removed when children chips are already selected
                const parentOptionsToBeRemoved: ChipData[] = selected
                    .filter(
                        (selectedOption) =>
                            selectedOption.parentValue && options.find((option) => option.value === selectedOption.parentValue),
                    )
                    .map((selectedOption) => {
                        const parentOption = options.find((option) => option.value === selectedOption.parentValue);
                        if (
                            parentOption &&
                            options.filter((option) => option.parentValue === parentOption.value).length ===
                                selected.filter((selectedChip) => selectedChip.parentValue === parentOption.value).length
                        ) {
                            return parentOption;
                        }
                        return undefined;
                    });
                options = options.filter((option) => parentOptionsToBeRemoved.length === 0 || !parentOptionsToBeRemoved.includes(option));
                return options.filter(
                    (option) =>
                        selected.find((select) => select.value === option.value) == null &&
                        (autoCompleteValue === "" ||
                            autoCompleteValue === null ||
                            autoCompleteValue === undefined ||
                            option.name.toLowerCase().indexOf(autoCompleteValue.toString().toLowerCase()) === 0),
                );
            }),
            withLatestFrom(this.selectOnLoadSubject$.asObservable()),
            // Check to see if any of the preload values are available, and select them
            map(([availableChips, selectOnLoadValues]) => {
                const stillPending: string[] = [];
                let didUpdateSelection = false;
                selectOnLoadValues.forEach((value) => {
                    const chip: ChipData = availableChips.find((availableChip) => availableChip.value === value);
                    if (chip != null) {
                        this.selectedChips.push(chip);
                        availableChips = availableChips.filter((availableChip) => availableChip.value !== value);
                        didUpdateSelection = true;
                    } else {
                        stillPending.push(value);
                    }
                });
                this.selectOnLoad = stillPending;

                if (didUpdateSelection) {
                    this.selectOnLoadSubject$.next(this.selectOnLoad);
                    this.valuesChipControl.setValue(this.selectedChips);
                    this.emitChipChange();
                }

                return availableChips;
            }),
        );
        this.filteredData$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => (this.filteredData = data));
    }

    /**
     * Set the options that have been selected (for use when created components dynamically).
     * Chips will be selected when they become available, if they values do not exist in the
     * data set, they will not be selecte and their values will not be emitted.
     *
     * @param chipValues the values of the chips that are to be selected
     */
    setSelectedChips(chipValues: string[]): void {
        this.selectOnLoad = chipValues;
        this.selectOnLoadSubject$.next(this.selectOnLoad);
    }
}
