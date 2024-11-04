import { CategoryAdminAssignmentRowComponent } from "./../category-admin-assignment-row/category-admin-assignment-row.component";
import { AdminAssignment, MessageCategory } from "@empowered/api";
import { FormBuilder, Validators, FormControl } from "@angular/forms";
import {
    Component,
    OnInit,
    ComponentRef,
    ComponentFactoryResolver,
    OnDestroy,
    ViewChild,
    ViewContainerRef,
    Input,
    Output,
    EventEmitter,
} from "@angular/core";
import { Observable, BehaviorSubject, combineLatest, merge, Subscription } from "rxjs";
import { map, switchMap, tap, startWith, shareReplay } from "rxjs/operators";
import { MessageCenterFacadeService } from "../../../services/message-center-facade.service";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage, Admin } from "@empowered/constants";

@Component({
    selector: "empowered-category-admin-assignment",
    templateUrl: "./category-admin-assignment.component.html",
    styleUrls: ["./category-admin-assignment.component.scss"],
})
export class CategoryAdminAssignmentComponent implements OnInit, OnDestroy {
    MessageCenterLanguage = MessageCenterLanguage;

    @Input() category: MessageCategory;
    @Input() assignments: AdminAssignment;

    @Output() currentAssignments: EventEmitter<AdminAssignment> = new EventEmitter();

    // Language
    primaryAdminAria = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.CATEGORY_ADMIN_ASSIGNMENT_LABEL_ARIA);
    cannotRemoveTooltip = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.CATEGORY_ADMIN_ASSIGNMENT_TOOLTIP);

    admins$: Observable<Admin[]> = this.messageCenterFacade.getAdmins();

    primaryAdminControl: FormControl = this.builder.control("", Validators.required);

    @ViewChild("standardAdmins", { read: ViewContainerRef, static: true }) standardAdminsView: ViewContainerRef;
    latestDynamicId = 1;

    // Keep track of inserted rows
    private readonly adminAssignmentComponentRefs: Map<number, ComponentRef<CategoryAdminAssignmentRowComponent>> = new Map();
    private readonly adminAssignmentComponentRefsSubject$: BehaviorSubject<Map<number, ComponentRef<CategoryAdminAssignmentRowComponent>>> =
        new BehaviorSubject(new Map());
    adminAssignmentComponentRefs$: Observable<Map<number, ComponentRef<CategoryAdminAssignmentRowComponent>>> =
        this.adminAssignmentComponentRefsSubject$.asObservable().pipe(shareReplay(1));

    // Monitor for delete row requests coming from the row
    adminAssignmentDeleteRequests$: Observable<number> = this.adminAssignmentComponentRefs$
        .pipe(
            map((componentMap) => this.mapToList(componentMap)),
            map((components) => components.map((component) => component.instance.getDeleteRequestStream())),
            switchMap((deleteRequestStreams) => merge(...deleteRequestStreams)),
        )
        .pipe(tap((dynamicId) => this.deleteStandardAdmin(dynamicId)));

    // Monitor for promote row requests coming from the row
    adminAssignmentPromoteRequests$: Observable<number> = this.adminAssignmentComponentRefs$
        .pipe(
            map((componentMap) => this.mapToList(componentMap)),
            map((components) => components.map((component) => component.instance.getPromoteRequestStream())),
            switchMap((promoteRequestStreams) => merge(...promoteRequestStreams)),
        )
        .pipe(tap((dynamicId) => this.promoteStandardAdmin(dynamicId)));

    // Primary Admin form control value change
    primaryAdminAssingmentLatestValue$ = this.primaryAdminControl.valueChanges.pipe(
        startWith(this.primaryAdminControl.value),
        // Keep track of the latest emitted value
        shareReplay(1),
    );

    // Monitor when values change for the inserted rows
    adminAssignmentLatestValues$: Observable<string[]> = this.adminAssignmentComponentRefs$.pipe(
        map((componentMap) => this.mapToList(componentMap)),
        map((components) =>
            components.map((component) =>
                component.instance.getControl().valueChanges.pipe(startWith(component.instance.getControl().value)),
            ),
        ),
        switchMap((valueChanges) => combineLatest([...valueChanges, this.primaryAdminAssingmentLatestValue$])),
        shareReplay(1),
    );
    canAddAdminRow = true;

    // List of admins with component that has selected them
    adminsAndAssignment$: Observable<(Admin & { selectedId: number })[]>;

    // Detect changes in the assignments and emit when there are new assignments
    updateAdminAssignments$ = combineLatest([this.adminAssignmentComponentRefs$, this.adminAssignmentLatestValues$]).pipe(
        tap(([componentMap, valueChanges]) => {
            const adminAssignments: AdminAssignment = {};
            componentMap.forEach((value, key) => {
                // Standard admins
                const controlValue: string = value.instance.getControl().value;
                if (controlValue != null && controlValue !== "") {
                    adminAssignments[`${controlValue}`] = "STANDARD";
                }
            });

            // Primary Admin
            const primaryValue: string = this.primaryAdminControl.value;
            if (primaryValue != null && primaryValue !== "") {
                adminAssignments[`${primaryValue}`] = "PRIMARY";
            }

            this.currentAssignments.emit(adminAssignments);
        }),
        shareReplay(1),
    );

    subscriptions: Subscription[] = [];

    constructor(
        private readonly builder: FormBuilder,
        private readonly resolver: ComponentFactoryResolver,
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Subscribe to the required observables
     */
    ngOnInit(): void {
        // Start listening for the primary admin's value to change
        this.subscriptions.push(this.adminAssignmentLatestValues$.subscribe());
        this.subscriptions.push(this.updateAdminAssignments$.subscribe());

        // Build the main observable that keeps track of what sub-component owns what value in the shared list
        this.adminsAndAssignment$ = combineLatest([
            this.admins$,
            // Emit on new assignment row
            this.adminAssignmentComponentRefs$,
            // Emit on admin value change
            this.adminAssignmentLatestValues$,
        ]).pipe(
            shareReplay(1),
            // Check to see if new admins can be added
            tap(([admins, componentMap, latestValues]) => {
                this.canAddAdminRow =
                    latestValues.length < admins.length
                        ? latestValues.reduce((acumulator, currentValue) => acumulator && currentValue != null && currentValue !== "", true)
                        : false;
            }),
            // For each admin, find the component that has selected it and assign that component's id to the selectedId
            map(([admins, componentMap]) => {
                const selectedAdmins: (Admin & { selectedId: number })[] = [];
                admins.forEach((admin) => {
                    let controlId: number;
                    componentMap.forEach((component, key) => {
                        const componentValue: string = component.instance.getControl().value;
                        if (componentValue != null && componentValue !== "" && Number(componentValue) === admin.id) {
                            controlId = key;
                        }
                    });
                    if (controlId == null && Number(this.primaryAdminControl.value) === admin.id) {
                        controlId = 0;
                    }

                    selectedAdmins.push({ ...admin, selectedId: controlId });
                });
                return selectedAdmins;
            }),
        );

        // Initialize with the passed in assignments
        Object.keys(this.assignments).forEach((key) => {
            if (this.assignments[key] === "PRIMARY") {
                this.primaryAdminControl.setValue(Number(key));
            } else {
                this.addStandardAdmin(Number(key));
            }
        });

        this.subscriptions.push(this.adminAssignmentDeleteRequests$.subscribe());
        this.subscriptions.push(this.adminAssignmentPromoteRequests$.subscribe());
    }

    /**
     * Unsubscribe on destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    /**
     * Use a factory to dynamically keep track of the standard admins for the assingments
     *
     * @param adminId the admin id
     */
    addStandardAdmin(adminId?: number): void {
        if (this.canAddAdminRow) {
            const id = this.latestDynamicId;
            this.latestDynamicId++;

            const factory = this.resolver.resolveComponentFactory(CategoryAdminAssignmentRowComponent);
            const ref: ComponentRef<CategoryAdminAssignmentRowComponent> = this.standardAdminsView.createComponent(factory);
            ref.instance.id = id;
            ref.instance.adminsAndAssignment$ = this.adminsAndAssignment$;
            if (adminId != null) {
                ref.instance.setControlValue(adminId);
            }

            this.adminAssignmentComponentRefs.set(id, ref);
            this.adminAssignmentComponentRefsSubject$.next(this.adminAssignmentComponentRefs);
        }
    }

    /**
     * Delete the admin row that was dynamically created
     *
     * @param dynamicId internal tracking id for standard admin
     */
    deleteStandardAdmin(dynamicId: number): void {
        const ref: ComponentRef<CategoryAdminAssignmentRowComponent> = this.adminAssignmentComponentRefs.get(dynamicId);
        if (ref != null) {
            // Remove component reference
            this.adminAssignmentComponentRefs.delete(dynamicId);
            this.adminAssignmentComponentRefsSubject$.next(this.adminAssignmentComponentRefs);

            ref.destroy();
        }
    }

    /**
     * Promote the admin to the primary for the category, and then move the primary to a standard
     *
     * @param dynamicId internal tracking id for standard admin
     */
    promoteStandardAdmin(dynamicId: number): void {
        const rowComponent: ComponentRef<CategoryAdminAssignmentRowComponent> = this.adminAssignmentComponentRefs.get(dynamicId);
        if (rowComponent != null) {
            const rowValue: string = rowComponent.instance.getControl().value;
            if (rowValue != null && rowValue !== "") {
                rowComponent.instance.getControl().setValue(Number(this.primaryAdminControl.value));
                this.primaryAdminControl.setValue(Number(rowValue));
            }
        }
    }

    /**
     * Convert the map into a list of all rows
     *
     * @param componentMap the map to convert
     * @returns the component values in list form
     */
    private mapToList(
        componentMap: Map<number, ComponentRef<CategoryAdminAssignmentRowComponent>>,
    ): ComponentRef<CategoryAdminAssignmentRowComponent>[] {
        const components: ComponentRef<CategoryAdminAssignmentRowComponent>[] = [];
        this.adminAssignmentComponentRefs.forEach((value, key) => components.push(value));
        return components;
    }
}
