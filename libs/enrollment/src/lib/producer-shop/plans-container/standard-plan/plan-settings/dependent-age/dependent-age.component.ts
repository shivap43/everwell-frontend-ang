import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { PlanOfferingWithCartAndEnrollment, SettingsDropdownName } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { combineLatest, merge, Observable, Subject } from "rxjs";
import { filter, map, mapTo, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { DependentAgeService } from "../../../../services/dependent-age/dependent-age.service";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import {
    DependentAgeState,
    PanelIdentifiers,
} from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
// eslint-disable-next-line max-len
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../../../services/producer-shop-helper/producer-shop-helper.service";
import { DependentAge } from "./dependent-age.model";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-dependent-age",
    templateUrl: "./dependent-age.component.html",
    styleUrls: ["./dependent-age.component.scss"],
})
export class DependentAgeComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() portalRef?: DropDownPortalComponent;

    readonly form: FormGroup;
    readonly languageStrings = this.getLanguageStrings();

    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should revert
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();

    showResetButton$!: Observable<boolean>;

    // Get dependent age range to populate dependent age dropdown values
    dependentAgeRange$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getDependentAgeRange));
    // Get DependentAgeState using ProducerShopComponentStore
    private dependentAgeState$!: Observable<DependentAgeState>;

    constructor(
        private readonly fb: FormBuilder,
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly dependentAgeService: DependentAgeService,
        private readonly producerShopHelperService: ProducerShopHelperService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.DEPENDENT_AGE);

        this.form = this.fb.group({
            dependentAge: ["", Validators.required],
        });
    }

    ngOnInit(): void {
        // We should call onInit before anything else
        // Pass isExpanded$ Observable since there are multiple PlanSettings dropdowns per Producer Shop:
        // there can be more than one DependentAge dropdown at a time (one for each plan panel)
        super.onInit(this.producerShopHelperService.isSelectedPlanPanel(this.planPanel));

        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        // Dependent Age data based on planId from ProducerShopComponentStore
        this.dependentAgeState$ = this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers).pipe(
            // Capture when dependentAgeRange$ emits a value
            withLatestFrom(this.dependentAgeRange$.pipe(mapTo(true), startWith(false))),
            // Filter until dependentAgeRange$ emit a first value
            filter(([_, initializedDependentAgeState]) => !!initializedDependentAgeState),
            map(([producerShopDependentAgeState]) => producerShopDependentAgeState),
        );

        // Whenever `Apply` is clicked:
        // 1. Validate Form
        // 2. Update ProducerShopComponentStore
        // 3. Close dependent age dropdown
        this.onApply$
            .pipe(
                tap(() => {
                    this.handleOnApply(panelIdentifiers);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Handle initializing / resetting form
        // reset form on reset click
        this.onReset$
            .pipe(
                switchMap(() =>
                    // get dependentAge
                    this.dependentAgeService.getMemberDependentChildAgeResetStateValue().pipe(map((dependentAge) => ({ dependentAge }))),
                ),
                tap(({ dependentAge }) => {
                    this.handleOnReset(dependentAge, panelIdentifiers);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Listen for values from NGRX store to populate forms.
        // Handle initializing / reverting form
        combineLatest([
            // revert happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // revert form onHide
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            // ProducerShopComponentStore DependentAgeState
            this.dependentAgeState$,
        ])
            .pipe(
                // Ignore first value since we don't care about the value emitted by onRevert$
                tap(([revert, dependentAgeState]) => {
                    this.handleOnRevert(revert, dependentAgeState.dependentAge);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // show/hide reset button on dependent age dropdown
        this.showResetButton$ = merge(this.form.valueChanges, this.onRevert$, this.onReset$, this.onApply$)
            .pipe(startWith(false))
            .pipe(
                switchMap(() =>
                    // get default dependentAge
                    this.dependentAgeService.getMemberDependentChildAgeResetStateValue().pipe(map((dependentAge) => dependentAge)),
                ),
                map((dependentAge) => this.form.controls.dependentAge.value !== dependentAge),
            );
    }

    /**
     * when apply button click update dependentAgeState with form/selected value.
     * @param panelIdentifiers current panel identifiers
     */
    handleOnApply(panelIdentifiers: PanelIdentifiers): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        // Exit early if FormGroup isn't valid
        if (!this.form.valid) {
            return;
        }
        const dependentAge: number = this.form.controls.dependentAge.value;
        // Update ProducerShopComponentStore with form value (selected value)
        this.producerShopComponentStoreService.upsertDependentAgeState({ dependentAge, panelIdentifiers });

        // Assuming FormGroup is valid, close dropdown
        this.portalRef?.hide();
    }

    /**
     * Reset form value back to initial/reset state value and update component store on reset button click
     *
     * @param dependentAge dependentAge initial/reset state value
     * @param panelIdentifiers current panel identifiers
     */
    handleOnReset(dependentAge: number, panelIdentifiers: PanelIdentifiers): void {
        // set form value to reset back to initial value
        this.setFormValues(dependentAge);
        // Update ProducerShopComponentStore with reset state value
        this.producerShopComponentStoreService.upsertDependentAgeState({ dependentAge, panelIdentifiers });
        // pristine to remove dirty flag
        this.form.markAsPristine();
        // Close dropdown
        this.portalRef?.hide();
    }

    /**
     * Revert form value back to last selected value in form on revert/hide button click
     *
     * @param revert {boolean} - determine whether to revert dependentAge selection or not.
     * @param dependentAge dependent age value from dependentAgeState
     */
    handleOnRevert(revert: boolean, dependentAge: number): void {
        // Local state of this dependentAge dropdown doesn't get stored into the ProducerShopComponentStore until apply/submit
        this.setFormValues(dependentAge);

        if (revert) {
            // Then mark form as pristine to remove dirty flag
            this.form.markAsPristine();
        }
    }

    /**
     * Set form values, and populate it using dependentAgeState
     *
     * @param dependentAge dependentAge that determines the value of form
     */
    setFormValues(dependentAge: number): void {
        this.form.controls.dependentAge.setValue(dependentAge);
    }

    /**
     * function executes on hiding
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Is used to emit when to submit FormGroup
     */
    onApply(): void {
        this.onApply$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to revert FormGroup
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
        this.onReset$.next();
    }

    /**
     * Call base class ngOnDestroy.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues(["primary.portal.common.FPO"]);
    }

    /**
     * Returns unique identifier for DependentAge numeric value.
     * trackBy for *ngFor involving DependentAge used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param dependentAge {number} current DependentAge numeric value in iteration
     * @returns unique identifier for DependentAge numeric value
     */
    trackByDependentAge(index: number, dependentAge: DependentAge): number {
        return dependentAge;
    }
}
