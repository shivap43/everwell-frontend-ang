import {
    Component,
    OnInit,
    Input,
    ViewChild,
    ElementRef,
    OnDestroy,
    ViewContainerRef,
    ComponentFactoryResolver,
    ComponentRef,
    Output,
    EventEmitter,
} from "@angular/core";
import { FilterModel, GET_FILTER_MODEL_VALUES, ActiveFilter, FILTER_MODEL_LIST_EQUAL } from "../FilterModel";
import { Observable, combineLatest, Subscription, interval, BehaviorSubject, of, merge } from "rxjs";
import { map, tap, filter, distinctUntilChanged, switchMap, withLatestFrom, shareReplay, debounceTime } from "rxjs/operators";
import { PillFilterComponent } from "../pill-filter/pill-filter.component";
import { LanguageService } from "@empowered/language";

// Magic number, a pill will approximately be this size
const PILL_WIDTH_CONST = 250;

@Component({
    selector: "empowered-pill-filter-group",
    templateUrl: "./pill-filter-group.component.html",
    styleUrls: ["./pill-filter-group.component.scss"],
})
export class PillFilterGroupComponent implements OnInit, OnDestroy {
    @ViewChild("pillContainer", { read: ElementRef, static: true }) pillContainer: ElementRef;
    @ViewChild("pillContainerView", { read: ViewContainerRef, static: true }) pillContainerView: ViewContainerRef;

    @Input() filterModels$: Observable<FilterModel[]>;
    filterModelsWithUpdates$: Observable<FilterModel[]>;

    // OUTPUT
    activeFilters$: Observable<ActiveFilter[]>;
    @Output() filterChange: EventEmitter<ActiveFilter[]> = new EventEmitter();
    @Output() filterOpen: EventEmitter<boolean> = new EventEmitter();

    pillFilterRefs: ComponentRef<PillFilterComponent>[] = [];
    private pillFilterRefsSubject$: BehaviorSubject<ComponentRef<PillFilterComponent>[]> = new BehaviorSubject([]);
    pillFilterOpen$: Observable<boolean>;

    // Any time there is a model change, container resize, or label change, re-evaluate layout
    modelContainerChange$: Observable<any>;

    subscriptions: Subscription[] = [];
    filters: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.globalComponent.filter.filters");

    constructor(private readonly resolver: ComponentFactoryResolver, private readonly languageService: LanguageService) {}

    ngOnInit(): void {
        this.filterModels$ = this.filterModels$.pipe(shareReplay(1));

        // Always have the latest input model with updates
        this.filterModelsWithUpdates$ = merge(
            // When input model changes, use it (TODO :: confirm with design what should happen with the selected filters)
            this.filterModels$,
            // If the filters' selections update, get the latest values from all and combine
            this.pillFilterRefsSubject$
                .asObservable()
                .pipe(
                    filter((refs) => refs.length > 0),
                    switchMap((refs) => combineLatest(refs.map((ref) => ref.instance.appliedSelections$))),
                )
                .pipe(
                    // flatten matrix to a list
                    map((updateMatrix) => updateMatrix.reduce((accumulator, updates) => [...accumulator, ...updates], [])),
                ),
        ).pipe(shareReplay(1));

        // Whenever there is an update, make sure the user knows if not a duplicate
        this.activeFilters$ = this.filterModelsWithUpdates$.pipe(
            debounceTime(100),
            map((updates) =>
                updates
                    .filter((update) => GET_FILTER_MODEL_VALUES(update).filter((value) => value !== "").length > 0)
                    .map((update) => ({ filterId: update.id, values: GET_FILTER_MODEL_VALUES(update) } as ActiveFilter)),
            ),
            distinctUntilChanged((prev, curr) => {
                if (prev.length !== curr.length) {
                    return false;
                }

                let isEqual = true;
                prev.forEach((prevValue) => {
                    if (isEqual) {
                        const currActiveFilter: ActiveFilter = curr.find((currValue) => currValue.filterId === prevValue.filterId);
                        if (!currActiveFilter || prevValue.values.length !== currActiveFilter.values.length) {
                            isEqual = false;
                        }

                        prevValue.values.forEach((value) => {
                            if (currActiveFilter.values.indexOf(value) === -1) {
                                isEqual = false;
                            }
                        });
                        currActiveFilter.values.forEach((value) => {
                            if (prevValue.values.indexOf(value) === -1) {
                                isEqual = false;
                            }
                        });
                    }
                });
                return isEqual;
            }),
            tap((activeFilters) => this.filterChange.emit(activeFilters)),
        );

        this.modelContainerChange$ = combineLatest(
            // Raw input model, data is not used, just to track emissions
            this.filterModels$,
            // Determine Pill group width, poll for change
            interval(250).pipe(
                map((iter) => this.pillContainer.nativeElement.offsetWidth),
                distinctUntilChanged(),
            ),
            // Detemine Pills width sum, emit whenever a pill changes its label
            this.pillFilterRefsSubject$.asObservable().pipe(
                switchMap((refs) => (refs.length === 0 ? of([0]) : combineLatest(refs.map((ref) => ref.instance.filterSize$)))),
                map((widths) => widths.reduce((acumulator, width) => acumulator + width, 0)),
                distinctUntilChanged(),
            ),
        ).pipe(
            // Get the latest list of references
            withLatestFrom(this.pillFilterRefsSubject$.asObservable()),
            // Read the container and the pill widths and determine if new filters should be added removed
            map(([[filterModels, containerWidth, pillSum], pillRefs]) => {
                const pillClone = [...pillRefs];

                if (pillRefs.length > 1 && pillSum > containerWidth) {
                    // If there is more than on pill and the pills have out grown their container, drop a pill
                    pillClone.pop().destroy();
                } else if (pillRefs.length < filterModels.length) {
                    // There may be room to add another pill
                    const remianingRoom = containerWidth - pillSum;
                    const maxAdd = filterModels.length - pillRefs.length;
                    let addCount = (remianingRoom - (remianingRoom % PILL_WIDTH_CONST)) / PILL_WIDTH_CONST;
                    addCount = addCount < maxAdd ? addCount : maxAdd;
                    for (let i = 0; i < addCount; i++) {
                        pillClone.push(this.createPillFilter());
                    }
                }

                this.pillFilterRefs = pillClone;
                return pillClone;
            }),
            // Bring in the latest updated model
            withLatestFrom(this.filterModelsWithUpdates$),
            distinctUntilChanged(
                ([prevPills, prevModels], [currPills, currModels]) =>
                    prevPills.length === currPills.length && FILTER_MODEL_LIST_EQUAL(prevModels, currModels),
            ),
            // Redistribute the models across the pills
            tap(([references, models]) => {
                this.redistributeModels(references, models);
                this.pillFilterRefsSubject$.next(references);
            }),
        );

        this.pillFilterOpen$ = this.pillFilterRefsSubject$.asObservable().pipe(
            switchMap((pillFilterComponents) =>
                merge(...pillFilterComponents.map((component) => component.instance.filterOpen.asObservable())),
            ),
            tap((isOpen) => this.filterOpen.emit(isOpen)),
        );

        // Subscribe to non-view observables
        this.subscriptions.push(this.modelContainerChange$.subscribe());
        this.subscriptions.push(this.filterModelsWithUpdates$.subscribe());
        this.subscriptions.push(this.activeFilters$.subscribe());
        this.subscriptions.push(this.pillFilterOpen$.subscribe());
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    /**
     * Create a new Pill Filter in the view, and then determine the appropriate group height for
     */
    createPillFilter(): ComponentRef<PillFilterComponent> {
        const factory = this.resolver.resolveComponentFactory(PillFilterComponent);
        const reference: ComponentRef<PillFilterComponent> = this.pillContainerView.createComponent(factory);

        return reference;
    }

    redistributeModels(references: ComponentRef<PillFilterComponent>[], models: FilterModel[]): void {
        if (references.length > 0 && models.length > 0) {
            for (let i = 0; i < references.length && i < models.length; i++) {
                if (i === references.length - 1 && models.slice(i).length > 0) {
                    references[i].instance.setFilterModels(models.slice(i));
                } else {
                    references[i].instance.setFilterModels([models[i]]);
                }
            }
        }
    }
}
