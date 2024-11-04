import {
    Component,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    AfterViewInit,
    ViewChildren,
    QueryList,
    AfterContentInit,
    OnDestroy,
    ChangeDetectorRef,
} from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { FilterModel, FILTER_MODEL_TYPE, FilterType, IS_FILTER_ACTIVE, GET_FILTER_MODEL_VALUE_LABEL } from "./../FilterModel";
import { BehaviorSubject, Observable, Subject, combineLatest, Subscription, merge } from "rxjs";
import { shareReplay, distinctUntilChanged, startWith, tap, delay, switchMap, withLatestFrom, filter, map } from "rxjs/operators";
import { AbstractPanel } from "../panels/AbstractPanel";
// TODO: FocusTrapFactory is deprecated https://material.angular.io/cdk/a11y/api#FocusTrapFactory
// There are known issues with trying to use the suggested alternative: https://github.com/angular/components/issues/21703
// Once these issues within AngularMaterial are resolved and we have updated to use those fixes, switch to ConfigurableFocusTrapFactory
import { FocusTrapFactory } from "@angular/cdk/a11y";
import { LanguageService } from "@empowered/language";
import { DateFilterPanelComponent } from "../panels/date-filter-panel/date-filter-panel.component";
import { TruncatePipe } from "../../../pipes/truncate.pipe";

const SPECIFIC = "specific";

@Component({
    selector: "empowered-pill-filter",
    templateUrl: "./pill-filter.component.html",
    styleUrls: ["./pill-filter.component.scss"],
})
export class PillFilterComponent implements AfterViewInit, OnDestroy {
    static readonly MAX_LABEL_LENGTH = 30;

    @ViewChild(MatMenuTrigger, { read: MatMenuTrigger }) menuTriggerDirective: MatMenuTrigger;
    @ViewChildren(AbstractPanel, { read: AbstractPanel }) panels: QueryList<AbstractPanel>;

    @ViewChild("panelsContainer", { read: ElementRef, static: true }) panelsContainer: ElementRef;
    @ViewChild("placeholder", { read: ElementRef, static: true }) placeholder: ElementRef;

    // Emits when the filter is opened and when it is closed. Used to apply overlays to filtered content
    @Output() filterOpen: EventEmitter<boolean> = new EventEmitter();

    private filterModels: FilterModel[] = [];
    private filterModelsSubject$: BehaviorSubject<FilterModel[]> = new BehaviorSubject([]);
    filterModels$: Observable<(FilterModel & { filterType: FilterType })[]> = this.filterModelsSubject$.asObservable().pipe(
        map((models) => models.map((model) => ({ ...model, filterType: FILTER_MODEL_TYPE(model) }))),
        tap((models) => (this.modelCount = models.length)),
        shareReplay(1),
    );
    showFilter$: Observable<boolean> = this.filterModels$.pipe(
        map((filterModels) =>
            filterModels.reduce(
                (accumulator, value) =>
                    accumulator ||
                    (["CHIP", "MULTI", "SINGLE"].indexOf(value.filterType) > -1 &&
                        ((value["multi"] && value["multi"]["options"].length > 0) ||
                            (value["single"] && value["single"]["options"].length > 0))) ||
                    value.filterType === "DATE",
                false,
            ),
        ),
    );
    modelCount: number;

    // Set aria and visible language variables in filter menu.
    apply: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.apply");
    reset: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.reset");
    clear: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.clear");
    filter: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.filter");
    conjunction: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.conjunction");
    title: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.title");

    // Emits when the view is initialized
    private readonly afterViewInit$: Subject<void> = new Subject();
    // Emits when the apply button is clicked
    private readonly onApplySubject$: Subject<void> = new Subject();
    onApply$: Observable<void> = this.onApplySubject$.asObservable().pipe(
        tap((event) => {
            if (this.panels) {
                this.panels.forEach((panel) => panel.applySelections());
            }
        }),
        shareReplay(1),
    );

    // Generates filter aria label for screen readers whenever filter model source changes
    readonly filterAriaLabel$: Observable<string | void> = this.filterModelsSubject$.asObservable().pipe(
        map(() => {
            // converts each panel title into a single label
            const temp = this.filterModels.reduce((acc: string, val) => (acc = `${acc}${val.title} ${this.conjunction} `), "");
            // replaces trailing conjunction (and trailing space) with filter language specification
            return temp.substring(0, temp.length - this.conjunction.length - 1) + this.filter;
        }),
    );

    private readonly filterSelectionSubject$: BehaviorSubject<FilterModel[]> = new BehaviorSubject([]);

    /**
     * Selections that have been applied to the filter with the apply button
     */
    appliedSelections$: Observable<FilterModel[]> = merge(
        this.filterModelsSubject$,
        this.onApply$.pipe(
            withLatestFrom(this.filterSelectionSubject$.asObservable()),
            map(([, selections]) => selections),
        ),
    ).pipe(
        tap(
            (appliedSelections) =>
                (this.isActive = appliedSelections.reduce((accumulator, update) => accumulator || IS_FILTER_ACTIVE(update), false)),
        ),
        shareReplay(1),
    );

    // Label for the filter based off of the latest applied values
    filterLabel$: Observable<string> = this.appliedSelections$.pipe(
        map((models) => {
            if (models.length > 1) {
                return "More";
            }
            if (models.length === 1) {
                const model: FilterModel = models[0];
                if (this.isActive) {
                    const label: string = model.title + ": ";

                    const value: string = GET_FILTER_MODEL_VALUE_LABEL(
                        model,
                        this.languageService.fetchPrimaryLanguageValues([
                            "primary.portal.globalComponent.filter.date.onOrBefore",
                            "primary.portal.globalComponent.filter.date.onOrAfter",
                        ]),
                    );
                    const remainingChars: number = PillFilterComponent.MAX_LABEL_LENGTH - label.length;
                    // Multi-selects use count instead
                    if (FILTER_MODEL_TYPE(model) === "MULTI" || FILTER_MODEL_TYPE(model) === "CHIP") {
                        if (model.multi.options.filter((option) => option.selected).length === model.multi.options.length) {
                            return label + "All";
                        }
                        if (value.length >= remainingChars) {
                            return label + model.multi.options.filter((option) => option.selected).length;
                        }
                    }
                    if (value.length >= remainingChars) {
                        return label + this.truncatePipe.transform(value, remainingChars);
                    }
                    return label + value;
                }

                return model.title;
            }
            return "";
        }),
        shareReplay(1),
    );

    resetLabel$: Observable<string> = this.filterModelsSubject$
        .asObservable()
        .pipe(
            map((filterModels) =>
                filterModels.length > 1 || (filterModels.length === 1 && !("single" in filterModels[0])) ? this.clear : this.reset,
            ),
        );

    // Whenever the label changes, get the new size of the component
    filterSize$: Observable<number> = combineLatest(this.filterLabel$, this.afterViewInit$.asObservable()).pipe(
        delay(10),
        map(([labelValue]) => this.elementRef.nativeElement.offsetWidth),
        distinctUntilChanged(),
        shareReplay(1),
    );

    // Whenever the panel closes, reset the selections to the last submitted model
    resetOnClose$: Observable<boolean> = this.filterOpen.asObservable().pipe(
        filter((isOpen) => !isOpen && this.panels !== undefined && this.panels != null),
        tap((isNotOpen) => this.panels.forEach((panel) => panel.resetSelections())),
    );

    // On click of apply, notify panels that they need to emit the latest selections.

    // Display states
    isActive = false;
    isSelected = false;
    resetActive = false;
    isOpened = false;

    subscriptions: Subscription[] = [];

    constructor(
        private readonly elementRef: ElementRef,
        private readonly truncatePipe: TruncatePipe,
        // FocusTrapFactory will be deleted in Angular Material v11.
        // Only need to replace with (and import) ConfigurableFocusTrapFactory. Everything else stays the same.
        private readonly focusTrap: FocusTrapFactory,
        private readonly languageService: LanguageService,
        private readonly changeDetector: ChangeDetectorRef,
    ) {}

    ngAfterViewInit(): void {
        this.afterViewInit$.next();

        // Whenever a panel gets added or removed, start listening to the selected values
        this.subscriptions.push(
            this.panels.changes
                .pipe(
                    map((changes) =>
                        this.panels.reduce((accumulator: AbstractPanel[], panel: AbstractPanel) => [...accumulator, panel], []),
                    ),
                    startWith(this.panels.reduce((accumulator: AbstractPanel[], panel: AbstractPanel) => [...accumulator, panel], [])),
                )
                .pipe(
                    switchMap((abstractPanels) =>
                        combineLatest(abstractPanels.map((abstractPanel) => abstractPanel.getSelectionChanges$())),
                    ),
                    tap((updatedModels) => this.filterSelectionSubject$.next(updatedModels)),
                    tap((appliedSelections) => {
                        this.resetActive = appliedSelections.reduce(
                            (accumulator, update) => accumulator || IS_FILTER_ACTIVE(update),
                            false,
                        );
                        /* The view update requires angular detection to be triggered to avoid ExpressionChangedAfterItHasBeenCheckedError
                         console error */
                        this.changeDetector.detectChanges();
                    }),
                )
                .subscribe(),
        );
        this.subscriptions.push(this.resetOnClose$.subscribe());
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    setSelectedValue(isSelected: boolean): void {
        this.isSelected = isSelected;
    }

    setFilterModels(filterModels: FilterModel[]): void {
        this.filterModels = filterModels;
        this.filterModelsSubject$.next(this.filterModels);
    }

    /**
     * Applies Filter after validation
     */
    applyFilters(): void {
        let isValid = true;
        this.panels.forEach((panel) => {
            if (panel instanceof DateFilterPanelComponent) {
                panel.dateFilterType.markAsTouched();
                if (panel.dateFilterType.invalid) {
                    isValid = false;
                } else if (panel.dateFilterType.value === SPECIFIC) {
                    panel.specificDate.markAsTouched();
                    if (panel.specificDate.invalid) {
                        isValid = false;
                    }
                } else {
                    panel.startDate.markAsTouched();
                    panel.endDate.markAsTouched();
                    if (panel.startDate.invalid || panel.endDate.invalid) {
                        isValid = false;
                    }
                }
            }
        });
        if (isValid) {
            this.applyNext();
        }
    }

    /**
     * Applies filter and closes menu
     */
    applyNext(): void {
        this.onApplySubject$.next();
        this.menuTriggerDirective.closeMenu();
    }

    /**
     * Reset Filter and closes menu
     */

    resetFilters(): void {
        this.isSelected = false;
        this.panels.forEach((panel) => panel.clearSelections());
        this.applyNext();
    }

    /**
     * Emits menu state and traps focus in it.
     * @param isOpened state of filter menu
     */
    onMenuStateChange(isOpened: boolean): void {
        this.isOpened = isOpened;
        this.filterOpen.emit(isOpened);
        if (isOpened) {
            this.focusTrap.create(this.panelsContainer.nativeElement);
            this.placeholder.nativeElement.focus();
        }
    }

    /**
     * Navigates out of pill filter menu when user hits escape. Otherwise, traps key strokes within menu.
     * @param event KeyboardEvent that triggers this callback
     */
    escapeFilterMenu(event: KeyboardEvent): void {
        if (event.key === "Escape") {
            return;
        }
        event.stopPropagation();
    }
}
