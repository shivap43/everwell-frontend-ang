import { CategoryUpdateRowComponent } from "./../category-update-row/category-update-row.component";
import { AbstractControl } from "@angular/forms";
import { BehaviorSubject, Observable, combineLatest, merge, of, forkJoin, Subject, defer, iif } from "rxjs";
import { MessageCenterFacadeService } from "./../../../services/message-center-facade.service";
import { Component, OnInit, OnDestroy, ComponentRef, ViewChild, ViewContainerRef, ComponentFactoryResolver } from "@angular/core";
import { MessageCategory, MessagingService } from "@empowered/api";
import { DeleteCategoryModalComponent } from "../../../components/modals/delete-category-modal/delete-category-modal.component";
import { map, switchMap, tap, startWith, catchError, takeUntil, filter } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-category-settings-container",
    templateUrl: "./category-settings-container.component.html",
    styleUrls: ["./category-settings-container.component.scss"],
})
export class CategorySettingsContainerComponent implements OnInit, OnDestroy {
    MessageCenterLanguage = MessageCenterLanguage;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @ViewChild("dynamicCategoriesView", { read: ViewContainerRef, static: true })
    dynamicCategoriesView: ViewContainerRef;

    // Language
    removeTooltip = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.CATEGORY_SETTINGS_TOOLTIP);

    categoryUpdates: Map<number, string> = new Map();
    categories$: Observable<MessageCategory[]> = this.messageCenterFacade.getCategories().pipe(
        // Maintain a copy of the original list of categories
        tap((categories) => (this.categories = categories)),
        // Apply any outstanding updates to the categories that are going to be displayed
        map((categories) => {
            const clone: MessageCategory[] = [];
            categories.forEach((category) =>
                clone.push({
                    id: category.id,
                    name: this.categoryUpdates.has(category.id) ? this.categoryUpdates.get(category.id) : category.name,
                    numberOfThreads: category.numberOfThreads,
                    numberOfUnresolvedThreads: category.numberOfUnresolvedThreads,
                }),
            );
            return clone;
        }),
    );
    // Original list of categories
    categories: MessageCategory[];

    // Monitor the dynamically inserted FormControl values
    categoryFormControlInserts: Map<number, AbstractControl> = new Map();
    private readonly categoryFormControlInsertsSubject$: BehaviorSubject<AbstractControl[]> = new BehaviorSubject([]);
    canAddDynamicCategory$: Observable<boolean> = this.categoryFormControlInsertsSubject$.asObservable().pipe(
        switchMap((controls) =>
            iif(
                () => Boolean(controls && controls.length),
                defer(() =>
                    combineLatest(
                        controls.map((formControl) =>
                            formControl.valueChanges.pipe(
                                startWith(formControl.value),
                                map((value) => Boolean(value)),
                            ),
                        ),
                    ).pipe(
                        map((containsValueArray) =>
                            containsValueArray.reduce((accumulator, currentValue) => accumulator && currentValue, true),
                        ),
                    ),
                ),
                defer(() => of(true)),
            ),
        ),
        tap((allNotEmpty) => (this.canAddDynamicCategory = allNotEmpty)),
    );
    canAddDynamicCategory = true;

    // Monitor delete requests from dynamically inserted category row components
    categoryComponentRefInserts: Map<number, ComponentRef<CategoryUpdateRowComponent>> = new Map();
    private readonly categoryComponentRefInsertsSubject$: BehaviorSubject<ComponentRef<CategoryUpdateRowComponent>[]> = new BehaviorSubject(
        [],
    );
    categoryInsertDeleteRequests$: Observable<number> = this.categoryComponentRefInsertsSubject$
        .asObservable()
        .pipe(
            // Map the ComponentRef to the deleteRequest stream...
            map((componentReferences) =>
                componentReferences.map((componentRef) => componentRef.instance.deleteRequestEmitter.asObservable()),
            ),
            // ...Subscribe to the outer observable, and then merge the inner observables together...
            switchMap((observableNumberArray) => merge(...observableNumberArray)),
        )
        .pipe(
            // ...and whenever a value is emitted, call the delete function to remove it from the list
            tap((dynamicId) => {
                this.onClickDeleteDynamicCategory(dynamicId);
            }),
        );

    latestDynamicId = 0;

    /**
     * Dispatch the required actions for data being used on the page
     *
     * @param messageCenterFacade
     * @param empoweredModal
     * @param messagingService
     * @param resolver
     * @param languageService
     */
    constructor(
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly messagingService: MessagingService,
        private readonly resolver: ComponentFactoryResolver,
        private readonly languageService: LanguageService,
    ) {
        forkJoin(
            this.messageCenterFacade.requestAdmins(),
            this.messageCenterFacade.requestCategories(),
            this.messageCenterFacade.requestMembers(),
            this.messageCenterFacade.requestProducers(),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    /**
     * Subscribe to the non-display observables
     */
    ngOnInit(): void {
        this.categoryInsertDeleteRequests$.pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.canAddDynamicCategory$.pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * Clean up the subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * update the internal model with the new category data
     *
     * @param updatedName new name of the category
     * @param categoryId the ID of the category to change
     */
    updateCategoryName(updatedName: string, categoryId: number): void {
        this.categoryUpdates.set(categoryId, updatedName);
    }

    /**
     * Delete the category from the mapping
     *
     * @param categoryId category to delete
     */
    onClickDeleteCategory(categoryId: number): void {
        this.empoweredModal
            .openDialog(DeleteCategoryModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp != null && resp)),
                switchMap((resp) => this.messagingService.deleteMessageCategory(categoryId)),
                tap((r) => this.messageCenterFacade.requestCategories(true)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Use a factory to dynamically create category rows
     */
    onClickAddDynamicCategory(): void {
        if (this.canAddDynamicCategory) {
            const dynamicCategoryId = this.latestDynamicId;
            this.latestDynamicId++;

            const factory = this.resolver.resolveComponentFactory(CategoryUpdateRowComponent);
            const ref: ComponentRef<CategoryUpdateRowComponent> = this.dynamicCategoriesView.createComponent(factory);
            ref.instance.id = dynamicCategoryId;

            this.categoryFormControlInserts.set(dynamicCategoryId, ref.instance.getCategoryControl());
            this.categoryFormControlInsertsSubject$.next(this.valueArray(this.categoryFormControlInserts));
            this.categoryComponentRefInserts.set(dynamicCategoryId, ref);
            this.categoryComponentRefInsertsSubject$.next(this.valueArray(this.categoryComponentRefInserts));
        }
    }

    /**
     * Delete the dynamic row for the id
     *
     * @param dynamicRowId row ID to delete
     */
    onClickDeleteDynamicCategory(dynamicRowId: number): void {
        const ref: ComponentRef<CategoryUpdateRowComponent> = this.categoryComponentRefInserts.get(dynamicRowId);

        if (ref) {
            ref.destroy();
            this.categoryFormControlInserts.delete(dynamicRowId);
            this.categoryComponentRefInserts.delete(dynamicRowId);

            this.categoryFormControlInsertsSubject$.next(this.valueArray(this.categoryFormControlInserts));
            this.categoryComponentRefInsertsSubject$.next(this.valueArray(this.categoryComponentRefInserts));
        }
    }

    /**
     * On click of the save button, fire off the requests to save the categories
     */
    onClickSaveCategories(): void {
        const httpRequests: Observable<unknown>[] = [];

        // Update existing categories if changed
        if (this.categories) {
            const successfulUpdates: number[] = [];
            this.categoryUpdates.forEach((value, key) => {
                const existingCategory: MessageCategory = this.categories.find((category) => category.id === key);
                if (existingCategory && existingCategory.name !== value && value !== "") {
                    httpRequests.push(
                        this.messagingService.updateMessageCategory(key, value).pipe(
                            tap((updateResponse) => this.categoryUpdates.delete(key)),
                            catchError((error) => of("CAUGHT ERROR")), // Display API error here?
                        ),
                    );
                }
            });
        }

        // Add any new categories
        if (this.categoryFormControlInserts.size > 0) {
            const successfulUpdates: number[] = [];
            this.categoryFormControlInserts.forEach((value, key) => {
                if (value.value) {
                    httpRequests.push(
                        this.messagingService.createMessageCategory(value.value).pipe(
                            tap((response) => this.onClickDeleteDynamicCategory(key)),
                            catchError((error) => of("CAUGHT ERROR")), // Display API error here?
                        ),
                    );
                }
            });
        }

        // Fire off requests, after complete re-request data
        if (httpRequests.length) {
            forkJoin(httpRequests)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([response]) => this.messageCenterFacade.requestCategories(true));
        }
    }

    /**
     * Transforms the map into a list
     *
     * @param target Map to transform
     * @returns the array of values
     */
    valueArray<T>(target: Map<number, T>): T[] {
        const values: T[] = [];

        target.forEach((value, key) => values.push(value));
        return values;
    }
}
