import { DateFormats } from "@empowered/constants";
import { DateInputPanel } from "./../../FilterModel";
import { Component, OnInit, Output, OnDestroy, EventEmitter } from "@angular/core";
import { AbstractPanel } from "../AbstractPanel";
import { FilterModel, CLONE_FILTER_MODEL } from "../../FilterModel";
import { Observable, BehaviorSubject, combineLatest, Subject } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { FormControl, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { DateService } from "@empowered/date";

const SPECIFIC = "specific";
const RANGE = "range";

@Component({
    selector: "empowered-date-filter-panel",
    templateUrl: "./date-filter-panel.component.html",
    styleUrls: ["./date-filter-panel.component.scss"],
    providers: [{ provide: AbstractPanel, useExisting: DateFilterPanelComponent }],
})
export class DateFilterPanelComponent extends AbstractPanel implements OnInit, OnDestroy {
    selectionSubject$: BehaviorSubject<FilterModel>;
    selectionModel$: Observable<FilterModel>;
    filterModelSubject$: BehaviorSubject<FilterModel>;
    filterModel$: Observable<FilterModel>;
    allSelected$: Observable<boolean>;
    allSelected: boolean;
    dateFilterType: FormControl = new FormControl("", [Validators.required]);
    specificDate: FormControl = new FormControl("", { updateOn: "blur", validators: [Validators.required] });
    startDate: FormControl = new FormControl("", { updateOn: "blur", validators: [Validators.required] });
    endDate: FormControl = new FormControl("", { updateOn: "blur", validators: [Validators.required] });
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    @Output() selectionEvent = new EventEmitter<boolean>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.requiredField",
        "primary.portal.common.selectionRequired",
    ]);

    /**
     * constructor of class
     * @param language - injection of language service
     */
    constructor(private readonly language: LanguageService, private readonly dateService: DateService) {
        super();
    }

    /**
     * Initializes necessary variables
     */
    ngOnInit(): void {
        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.initFormControls(this.selections.date);
        this.subscribeToFormControlValueChanges();
        this.selectionSubject$ = new BehaviorSubject(this.selections);
        this.selectionModel$ = this.selectionSubject$.asObservable();
        this.filterModelSubject$ = new BehaviorSubject(this.filterModel);
        this.filterModel$ = this.filterModelSubject$.asObservable();
    }

    /**
     * Resets selections in the panel to their original state.
     */
    clearSelections(): void {
        this.selections = { ...this.selections, date: {} };
        this.selectionSubject$.next(this.selections);
        this.applySelections();
        this.resetFormValues();
    }

    /**
     * Resets Form Values
     */
    resetFormValues(): void {
        this.specificDate.reset();
        this.startDate.reset();
        this.endDate.reset();
        this.dateFilterType.reset();
    }

    /**
     * Resets the panel's selections to the currently applied selections
     */
    resetSelections(): void {
        this.selections = CLONE_FILTER_MODEL(this.filterModel);
        this.selectionSubject$.next(this.selections);
    }

    /**
     * Updates the filter model with the latest selections
     */
    applySelections(): void {
        this.filterModel = { ...this.selections };
        this.filterModelSubject$.next(this.filterModel);
    }

    /**
     * Returns an observable that emits whenever the panel's selection changes
     * @returns observable of the filter model
     */
    getSelectionChanges$(): Observable<FilterModel> {
        return this.filterModel$;
    }

    /**
     * Sets the initial date and date filter type values
     * @param date the date model
     */
    initFormControls(date: DateInputPanel): void {
        if (date) {
            if (date.specific) {
                this.dateFilterType.setValue(SPECIFIC);
                this.specificDate.setValue(this.dateService.toDate(date.specific));
            } else if (date.range) {
                this.dateFilterType.setValue(RANGE);
                if (date.range.start) {
                    this.startDate.setValue(this.dateService.toDate(date.range.start));
                }
                if (date.range.end) {
                    this.endDate.setValue(this.dateService.toDate(date.range.end));
                }
            }
        }
    }

    /**
     * Sets up listeners for date value changes
     */
    subscribeToFormControlValueChanges(): void {
        const datesValueChanges = [this.specificDate.valueChanges, this.startDate.valueChanges, this.endDate.valueChanges];
        combineLatest(datesValueChanges.map((observable) => observable.pipe(startWith(null))))
            .pipe(
                map((values) =>
                    values.map((value) =>
                        this.dateService.isValid(this.dateService.toDate(value))
                            ? this.dateService.format(value, DateFormats.MONTH_DAY_YEAR)
                            : null,
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([specific, start, end]) => {
                const date: DateInputPanel = {};
                if (this.dateFilterType.value === SPECIFIC) {
                    date.specific = specific;
                    if (specific) {
                        this.selectionEvent.emit(true);
                    } else {
                        this.selectionEvent.emit(false);
                    }
                } else if (this.dateFilterType.value === RANGE) {
                    date.range = { start, end };
                    if (start || end) {
                        this.selectionEvent.emit(true);
                    } else {
                        this.selectionEvent.emit(false);
                    }
                }
                this.selections = { ...this.selections, date };
            });
    }
    /**
     * Cleans up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
