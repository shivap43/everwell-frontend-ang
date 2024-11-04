import { Store } from "@ngxs/store";
import { AudienceRowComponent } from "./../audience-row/audience-row.component";
import { BehaviorSubject, Observable, merge, Subscription, of, combineLatest, EMPTY } from "rxjs";
import { AbstractAudience, ClassType, RegionType, AudienceType, GET_AUDIENCE_CONTEXT, COMPARE_AUDIENCE } from "@empowered/api";
import { ProductOffering } from "@empowered/constants";
import {
    Component,
    OnInit,
    ViewChild,
    ViewContainerRef,
    ComponentRef,
    Input,
    OnDestroy,
    ComponentFactoryResolver,
    Output,
    EventEmitter,
} from "@angular/core";
import { shareReplay, map, switchMap, distinctUntilChanged, startWith, tap, filter } from "rxjs/operators";
import {
    AudienceGroupBuilderState,
    SetDefaultPlanChoices,
    GetClassTypes,
    GetRegionTypes,
    GetProductOfferings,
    ResetAudienceGroup,
    GetEmployeeIds,
} from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-audience-builder-container",
    templateUrl: "./audience-builder-container.component.html",
    styleUrls: ["./audience-builder-container.component.scss"],
})
export class AudienceBuilderContainerComponent implements OnInit, OnDestroy {
    /**
     * LANGUAGE CONSTANTS
     */
    // Option labels
    employeeIdLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeEmployeeId");
    ssnLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeSsn");
    statusLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeEmploymentStatus");
    classLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeClassTypes");
    regionLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeRegionTypes");
    plansLabel: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeEnrolledPlans");

    // The Audience types displayed as options
    @Input() displayAudienceGroupTypes: AudienceType[] = [];
    private displayAudienceGroupTypesSubject$: BehaviorSubject<AudienceType[]> = new BehaviorSubject(this.displayAudienceGroupTypes);

    // Initial audience grouping, used to prepopulate the audience builder
    @Input() initialAudienceGrouping: AbstractAudience[] = [];
    @Input() submitEvent$: Observable<void>;
    @Output() isValid: EventEmitter<boolean> = new EventEmitter();
    // Emits the most current audience grouping whenever an audience gets updated
    @Output() audienceGrouping: EventEmitter<AbstractAudience[]> = new EventEmitter();

    @ViewChild("audienceRows", { read: ViewContainerRef, static: true }) audienceRowsView: ViewContainerRef;
    dynamicAudienceRows: Map<number, ComponentRef<AudienceRowComponent>> = new Map();
    private dynamicAudienceRowsSubject$: BehaviorSubject<Map<number, ComponentRef<AudienceRowComponent>>> = new BehaviorSubject(
        this.dynamicAudienceRows,
    );
    dynamicId = 0;

    /**
     * DATA OBSERVABLES
     */
    // Class types used as a sub-type in "Class Types"
    dynamicAudienceId = 0;
    classTypes$: Observable<ClassType[]> = this.store
        .select(AudienceGroupBuilderState.getClassTypes)
        .pipe(distinctUntilChanged(), shareReplay(1));
    classTypeOptions$: Observable<AudienceOption[]> = this.classTypes$.pipe(
        map((classTypes) =>
            classTypes.map((classType) => ({
                type: "CLAZZ" as AudienceType,
                selectedBy: null,
                name: classType.name,
                id: "" + this.dynamicAudienceId++,
                contextValue: classType.id,
            })),
        ),
        shareReplay(1),
    );
    // Region types used as a sub-type in "Region Types"
    regionTypes$: Observable<RegionType[]> = this.store
        .select(AudienceGroupBuilderState.getRegionTypes)
        .pipe(distinctUntilChanged(), shareReplay(1));
    regionTypeOptions$: Observable<AudienceOption[]> = this.regionTypes$.pipe(
        map((regionTypes) =>
            regionTypes.map((regionType) => ({
                type: "REGION" as AudienceType,
                selectedBy: null,
                name: regionType.name,
                id: "" + this.dynamicAudienceId++,
                contextValue: regionType.id,
            })),
        ),
        shareReplay(1),
    );
    // Product Types used as sub-types in  "Product type"
    productOfferings$: Observable<ProductOffering[]> = this.store
        .select(AudienceGroupBuilderState.getProducts)
        .pipe(distinctUntilChanged(), shareReplay(1));
    productOfferingOptions$: Observable<AudienceOption[]> = this.productOfferings$.pipe(
        map((productOfferings) =>
            productOfferings.map((productOffering) => ({
                type: "ENROLLMENT_PLAN" as AudienceType,
                selectedBy: null,
                name: productOffering.product.name,
                id: "" + this.dynamicAudienceId++,
                contextValue: productOffering.id,
            })),
        ),
    );

    allAudienceTypes$: Observable<AudienceOption[]> = combineLatest([
        // All audience types
        of([
            {
                type: "SSN" as AudienceType,
                name: this.ssnLabel,
                id: "" + this.dynamicAudienceId++,
            },
            {
                type: "EMPLOYEE_ID" as AudienceType,
                name: this.employeeIdLabel,
                id: "" + this.dynamicAudienceId++,
            },
            {
                type: "EMPLOYMENT_STATUS" as AudienceType,
                name: this.statusLabel,
                id: "" + this.dynamicAudienceId++,
            },
            {
                type: "CLAZZ" as AudienceType,
                name: this.classLabel,
                id: "" + this.dynamicAudienceId++,
            },
            {
                type: "REGION" as AudienceType,
                name: this.regionLabel,
                id: "" + this.dynamicAudienceId++,
            },
            {
                type: "ENROLLMENT_PLAN" as AudienceType,
                name: this.plansLabel,
                id: "" + this.dynamicAudienceId++,
            },
        ] as AudienceOption[]),
        // Class type sub-types
        this.classTypeOptions$,
        // Region type sub-types
        this.regionTypeOptions$,
        // Product type sub-types
        this.productOfferingOptions$,
    ]).pipe(
        // Add in the sub-types to their parent components
        map(([parentTypes, classTypes, regionTypes, productOfferingTypes]) => {
            parentTypes.forEach((parentType) => {
                if (parentType.type === ("CLAZZ" as AudienceType)) {
                    parentType.subValues = classTypes;
                } else if (parentType.type === ("REGION" as AudienceType)) {
                    parentType.subValues = regionTypes;
                } else if (parentType.type === ("ENROLLMENT_PLAN" as AudienceType)) {
                    parentType.subValues = productOfferingTypes;
                }
            });
            return parentTypes;
        }),
        // Keep the latest emitted value, when new rows subscribe it will emit
        shareReplay(1),
    );

    // Filter off all the available types with the specified display types
    filteredAudienceTypes$: Observable<AudienceOption[]> = combineLatest([
        this.displayAudienceGroupTypesSubject$.asObservable(),
        this.allAudienceTypes$,
    ]).pipe(
        map(([requestedTypes, allTypes]) => allTypes.filter((type) => requestedTypes.indexOf(type.type) !== -1)),
        shareReplay(1),
    );

    /**
     * EVENT OBSERVABLES
     */
    // Emits whenever an audience row is added or removed
    dynamicAudienceRows$: Observable<Map<number, ComponentRef<AudienceRowComponent>>> = this.dynamicAudienceRowsSubject$.pipe(
        shareReplay(1),
    );

    // Listen for delete requests and handle them here
    audienceRowDeleteRequests$: Observable<number> = this.dynamicAudienceRows$.pipe(
        map((componentMap) => {
            const deleteRequests: Observable<number>[] = [];
            componentMap.forEach((component, key) => deleteRequests.push(component.instance.getDeleteRequestStream()));
            return deleteRequests;
        }),
        switchMap((deleteRequests) => merge(...deleteRequests)),
        tap((componentId) => this.deleteAudienceRow(componentId)),
    );

    // Emit any time a child changes its selected type value
    audienceValueChanges$: Observable<any[]> = this.dynamicAudienceRows$.pipe(
        map((componentMap) => {
            const valueChages: Observable<any>[] = [];
            componentMap.forEach((componentRef, key) =>
                valueChages.push(
                    componentRef.instance
                        .getControl()
                        .valueChanges // Controls need to start with their current value because map can change
                        .pipe(startWith(componentRef.instance.getControl().value)),
                ),
            );
            return valueChages;
        }),
        switchMap((valueChanges) => combineLatest([...valueChanges])),
    );

    // The audience types, and what child has selected them
    availableAudienceTypes$: Observable<AudienceOption[]> = combineLatest(
        // Available audience types
        this.filteredAudienceTypes$,
        // Rows
        this.dynamicAudienceRows$,
        // Audience type valueChanges
        this.audienceValueChanges$.pipe(startWith([])),
    ).pipe(
        // Tap to determine if more rows can be added
        tap(([allAudienceTypes, , values]) => {
            // Count all options, including sub-options
            let audienceCount = 0;
            allAudienceTypes.forEach((audience) => {
                if (audience.subValues != null) {
                    audienceCount += audience.subValues.length;
                } else {
                    audienceCount++;
                }
            });

            this.canAddRow =
                values.length < audienceCount
                    ? values.reduce((accumulator, currentValue) => accumulator && currentValue != null && currentValue !== "", true)
                    : false;
        }),
        // Update the model with which component owns what value
        map(([allAudienceTypes, components]) => {
            const controlValues: any[] = [];
            const reverseMap: Map<any, number> = new Map();
            components.forEach((component, id) => {
                const componentValue: any = component.instance.getControl().value;
                controlValues.push(componentValue);
                reverseMap.set(componentValue, id);
            });

            allAudienceTypes.forEach((audienceType) => {
                if (controlValues.indexOf(audienceType.id) !== -1) {
                    audienceType.selectedBy = reverseMap.get(audienceType.id);
                } else if (audienceType.subValues != null) {
                    audienceType.subValues.forEach((subType) => {
                        if (controlValues.indexOf(subType.id) !== -1) {
                            subType.selectedBy = reverseMap.get(subType.id);
                        } else {
                            subType.selectedBy = null;
                        }
                    });
                } else {
                    audienceType.selectedBy = null;
                }
            });

            return allAudienceTypes;
        }),
        // count selected options
        tap((availableOptions) => {
            let tempCount = 0;
            availableOptions.forEach((option) => {
                if (option.subValues != null) {
                    tempCount += option.subValues.filter((subValue) => subValue.selectedBy != null).length;
                } else if (option.selectedBy != null) {
                    tempCount++;
                }
            });
            this.selectedCount = tempCount;
        }),
        // Save off the model
        tap((availableOptions) => (this.availableAudienceTypes = availableOptions)),
        shareReplay(1),
    );
    selectedCount = 0;
    availableAudienceTypes: AudienceOption[] = [];
    canAddRow = true;

    // Combine all of the output streams from the rows to keep track of the latest values
    latestAudienceGroupings$: Observable<AbstractAudience[]> = this.dynamicAudienceRows$.pipe(
        map((componentMap) => {
            const audienceConditions: Observable<AbstractAudience[]>[] = [];
            componentMap.forEach((component, id) => {
                audienceConditions.push(component.instance.getAudienceValueStream());
            });
            return audienceConditions;
        }),
        switchMap((valueStreams) => combineLatest(valueStreams)),
        filter((valueMatrix) => valueMatrix != null),
        map((valueMatrix) => {
            let audienceConditions: AbstractAudience[] = [];
            valueMatrix.forEach((audiences) => (audienceConditions = audienceConditions.concat(audiences != null ? [...audiences] : [])));
            return audienceConditions;
        }),
    );

    isValid$: Observable<boolean> = this.dynamicAudienceRows$.pipe(
        map((componentMap) => {
            const isvalidStream: Observable<boolean>[] = [];
            componentMap.forEach((component, id) => {
                isvalidStream.push(component.instance.isValidStream());
            });
            return isvalidStream;
        }),
        switchMap((valueStreams) => combineLatest(valueStreams)),
        map((valueMatrix) => {
            let isValid = true;
            valueMatrix.forEach((valid) => {
                if (valid === false) {
                    isValid = valid;
                }
            });
            return isValid;
        }),
        tap((resp) => this.isValid.emit(resp)),
    );

    subscriptions: Subscription[] = [];

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.audienceBuilder.addCondition",
    ]);
    constructor(
        private readonly store: Store,
        private readonly resolver: ComponentFactoryResolver,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Does all of the comparisons between the initial audience grouping and
     * the current audience grouping, and determines the insertions and deletions
     * needed when the user selects save.
     *
     * @param initial The initial audience grouping
     * @param latest The latest audience grouping
     */
    static determineCRUDOperations(initial: AbstractAudience[], latest: AbstractAudience[]): AudienceCRUDOperations {
        let toCreate: AbstractAudience[] = [];
        let toRemove: AbstractAudience[] = [];

        if (initial != null && latest == null) {
            toRemove = toRemove.concat(initial);
        } else if (initial == null && latest != null) {
            toCreate = toCreate.concat(latest);
        } else if (initial != null && latest != null) {
            initial.forEach((init) => {
                if (latest.find((last) => COMPARE_AUDIENCE(init, last)) == null) {
                    toRemove.push(init);
                }
            });
            latest.forEach((last) => {
                if (initial.find((init) => COMPARE_AUDIENCE(init, last)) == null) {
                    toCreate.push(last);
                }
            });
        }

        return { create: toCreate, remove: toRemove };
    }

    /**
     * Dispatch all the relevant actions to load the associated data, and arrange all of the necessary subscriptions.
     */
    ngOnInit(): void {
        this.submitEvent$ = this.submitEvent$ ? this.submitEvent$.pipe(shareReplay(1)) : EMPTY;
        this.subscriptions.push(this.audienceRowDeleteRequests$.subscribe());
        // @Input of displayAudienceGroupTypes should be initialized before this
        this.displayAudienceGroupTypesSubject$.next(this.displayAudienceGroupTypes);
        // Get async sub-type data

        this.store.dispatch(new ResetAudienceGroup());
        this.store.dispatch(new GetClassTypes());
        this.store.dispatch(new GetRegionTypes());
        this.store.dispatch(new GetProductOfferings());
        this.store.dispatch(new SetDefaultPlanChoices());
        // Wait for the employee action to finish
        this.subscriptions.push(
            this.store
                .dispatch(new GetEmployeeIds())
                .pipe(
                    switchMap((action) => this.store.select(AudienceGroupBuilderState.getEmployeeIds)),
                    // If there are no members with IDs or no members...
                    map(
                        (members) =>
                            members && members.content && members.content.filter((member) => Boolean(member.employeeId)).length > 0,
                    ),
                    filter((hasEmployeeIds) => !hasEmployeeIds),
                    tap((hasEmployeeIds) => {
                        // ...then remove the employee id input field
                        this.displayAudienceGroupTypesSubject$.next(
                            this.displayAudienceGroupTypes.filter((type) => type !== "EMPLOYEE_ID"),
                        );
                    }),
                )
                .subscribe(),
        );

        // Emit the latest audience grouping as a list of audience groupings
        this.subscriptions.push(this.latestAudienceGroupings$.subscribe((resp) => this.audienceGrouping.emit(resp)));
        this.subscriptions.push(this.isValid$.subscribe());
        if (this.initialAudienceGrouping != null && this.initialAudienceGrouping.length > 0) {
            // Initialize any preloaded grouping
            this.initializeFromAudienceGrouping();
        } else {
            // Add the initial row
            this.addAudienceRow();
        }

        this.subscriptions.push(
            this.submitEvent$.subscribe((res) => {
                this.dynamicAudienceRows.forEach((cmp) => {
                    cmp.instance.invokeValidation();
                });
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    /**
     * Add a new audience row
     *
     * @param override allows a row to be added reguardless of the CanAdd variable
     */
    private addAudienceRow(override?: boolean): ComponentRef<AudienceRowComponent> | undefined {
        if ((override != null && override) || this.canAddRow) {
            const factory = this.resolver.resolveComponentFactory(AudienceRowComponent);

            const componentRef: ComponentRef<AudienceRowComponent> = this.audienceRowsView.createComponent(factory);
            const id = this.dynamicId++;
            componentRef.instance.id = id;
            componentRef.instance.setSubmitEvent(this.submitEvent$);
            componentRef.instance.setAvailableAudienceConditions(this.availableAudienceTypes$);
            componentRef.instance.isFirst = this.dynamicAudienceRows.size === 0;

            this.dynamicAudienceRows.set(id, componentRef);
            this.dynamicAudienceRowsSubject$.next(this.dynamicAudienceRows);

            return componentRef;
        }
        return undefined;
    }

    /**
     * Remove and audience row by its ID
     *
     * @param componentId ID of the audience row to remove
     */
    private deleteAudienceRow(componentId: number): void {
        const ref: ComponentRef<AudienceRowComponent> = this.dynamicAudienceRows.get(componentId);
        if (ref != null && this.dynamicAudienceRows.delete(componentId)) {
            ref.destroy();
            this.dynamicAudienceRowsSubject$.next(this.dynamicAudienceRows);
        }
    }

    /**
     * Initialize the grouping based on an existing audience grouping
     */
    private initializeFromAudienceGrouping(): void {
        const groupings: Map<AudienceType, AbstractAudience[]> = new Map();

        this.initialAudienceGrouping.forEach((audience) => {
            if (groupings.has(audience.type)) {
                groupings.get(audience.type).push(audience);
            } else {
                groupings.set(audience.type, [audience]);
            }
        });

        groupings.forEach((audiences, type) => {
            if (["CLAZZ", "REGION", "ENROLLMENT_STATUS", "ENROLLMENT_PLAN"].indexOf(type) > -1) {
                // If the type has sub-types, process the additional required context
                const contextGroupings: Map<any, AbstractAudience[]> = new Map();
                audiences.forEach((audience) => {
                    const context: any = GET_AUDIENCE_CONTEXT(audience);
                    if (contextGroupings.has(context)) {
                        contextGroupings.get(context).push(audience);
                    } else {
                        contextGroupings.set(context, [audience]);
                    }
                });

                contextGroupings.forEach((contextAudience, context) => {
                    const row: ComponentRef<AudienceRowComponent> = this.addAudienceRow(true);
                    row.instance.selectWhenAvailable(type, contextAudience, context);
                });
            } else {
                // Normal audience grouping
                const row: ComponentRef<AudienceRowComponent> = this.addAudienceRow(true);
                row.instance.selectWhenAvailable(type, audiences);
            }
        });
    }
}

// Interface for defining the complex option
export interface AudienceOption {
    type: AudienceType;
    id: string;
    name: string;
    contextValue?: any;
    subValues?: AudienceOption[];
    // dynamic id assigned to the row component
    selectedBy?: number;
}

// Helper interface to define api operations
export interface AudienceCRUDOperations {
    remove: AbstractAudience[];
    create: AbstractAudience[];
}
