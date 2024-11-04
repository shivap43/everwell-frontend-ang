import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { combineLatest, merge, Observable, Subject } from "rxjs";
import { filter, map, mapTo, startWith, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
// eslint-disable-next-line max-len
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import {
    EliminationPeriodState,
    PanelIdentifiers,
} from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopHelperService } from "../../../../services/producer-shop-helper/producer-shop-helper.service";
import { PlanOfferingWithCartAndEnrollment, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-elimination-period",
    templateUrl: "./elimination-period.component.html",
    styleUrls: ["./elimination-period.component.scss"],
})
export class EliminationPeriodComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() portalRef?: DropDownPortalComponent;

    // Observable of boolean to check whether plan offering is supplementary plan
    isSupplementaryPlan$!: Observable<boolean>;

    // Get elimination period related CoverageLevels using PlanOffering input bind
    eliminationPeriods$!: Observable<EliminationPeriod[]>;
    // elimination period reset state value
    eliminationPeriodResetStateValue$!: Observable<EliminationPeriod>;
    // Get ProducerShop EliminationPeriodsState using ProducerShopComponentStore
    private producerShopEliminationPeriodsState$!: Observable<EliminationPeriodState>;
    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should reset
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();
    // Used to determine when FormGroup should show
    private readonly onShow$ = new Subject<void>();

    showResetButton$!: Observable<boolean>;

    readonly form: FormGroup;

    constructor(
        private readonly fb: FormBuilder,
        private readonly ngrxStore: NGRXStore,
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly planOfferingService: PlanOfferingService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopHelperService: ProducerShopHelperService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.ELIMINATION_PERIOD);
        this.form = this.fb.group({
            selectedEliminationPeriod: ["", Validators.required],
        });
    }

    ngOnInit(): void {
        // We should call onInit before anything else
        // Pass isExpanded$ Observable since there are multiple PlanSettings dropdowns per Producer Shop:
        // there can be more than one EliminationPeriod dropdown at a time (one for each plan panel)
        super.onInit(this.producerShopHelperService.isSelectedPlanPanel(this.planPanel));

        const planOffering = this.planPanel.planOffering;
        const planId = this.planOfferingService.getPlanId(planOffering);
        const productId = this.planOfferingService.getProductId(planOffering);
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        // List of eligible periods options for the plan
        this.eliminationPeriods$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getEliminationPeriods(planId, productId)));

        this.isSupplementaryPlan$ = this.ngrxStore
            .onAsyncValue(
                select(
                    PlanOfferingsSelectors.getPlanOfferingData(
                        panelIdentifiers.planOfferingId,
                        panelIdentifiers.cartId,
                        panelIdentifiers.enrollmentId,
                    ),
                ),
            )
            .pipe(
                map((planPanel) => (planPanel ? this.planOfferingService.planOfferingHasSupplementaryPlan(planPanel.planOffering) : false)),
            );

        // Elimination Period reset state value
        this.eliminationPeriodResetStateValue$ = this.eliminationPeriods$.pipe(map((eliminationPeriods) => eliminationPeriods[0]));

        // Elimination Period data based on planId from ProducerShopComponentStore
        this.producerShopEliminationPeriodsState$ = this.producerShopComponentStoreService.getEliminationPeriodState(panelIdentifiers).pipe(
            // Get latest value from eliminationPeriods$
            withLatestFrom(this.eliminationPeriods$.pipe(mapTo(true), startWith(false))),
            // Filter until eliminationPeriods$ a first value
            filter(([_, initializedEliminationState]) => !!initializedEliminationState),
            map(([producerShopEliminationPeriodState]) => producerShopEliminationPeriodState),
        );

        // Whenever `Apply` is clicked:
        // 2. Validate Form
        // 3. Update ProducerShopComponentStore
        // 4. Close elimination period dropdown
        this.onApply$
            .pipe(
                tap(() => {
                    // Trigger for validity and render error messages
                    this.form.markAllAsTouched();
                    // Exit early if FormGroup isn't valid
                    if (!this.form.valid) {
                        return;
                    }
                    const eliminationPeriod: EliminationPeriod = this.form.controls.selectedEliminationPeriod.value;
                    // Update ProducerShopComponentStore with form value (selected value)
                    this.updateEliminationPeriodAndCoverageLevelState(eliminationPeriod, panelIdentifiers);
                    // Assuming FormGroup is valid, close dropdown
                    this.portalRef?.hide();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Listen for values from ProducerShopComponentStore to populate forms.
        // Handle initializing / reverting form
        combineLatest([
            // revert happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // revert form onHide
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            // ProducerShopComponentStore eliminationPeriodsState
            this.producerShopEliminationPeriodsState$,
        ])
            .pipe(
                // Ignore first value since we don't care about the value emitted by onRevert$
                tap(([revert, producerShopEliminationPeriods]) => {
                    // Local state of this eliminationPeriods dropdown that
                    // doesn't get stored into the ProducerShopComponentStore until apply/submit
                    this.setFormValues(producerShopEliminationPeriods.eliminationPeriod);

                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Handle initializing / resetting form
        // reset form on reset click
        this.onReset$
            .pipe(
                // ProducerShopComponentStore eliminationPeriodsState
                withLatestFrom(this.eliminationPeriodResetStateValue$),
                // Ignore first value since we don't care about the value emitted by onReset$
                tap(([, eliminationPeriodResetStateValue]) => {
                    // Set form value to its initial value
                    this.setFormValues(eliminationPeriodResetStateValue);
                    // Update ProducerShopComponentStore with elimination period and coverage level value (reset state value)
                    this.updateEliminationPeriodAndCoverageLevelState(eliminationPeriodResetStateValue, panelIdentifiers);
                    // Close dropdown
                    this.portalRef?.hide();
                    // Mark form as pristine to remove dirty flag
                    this.form.markAsPristine();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Disable the elimination period selection if supplementary plan
        this.isSupplementaryPlan$
            .pipe(
                filter((isSupplementaryPlan) => isSupplementaryPlan),
                tap(() => (this.portalRef.disableClick = true)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // show/hide reset button on Elimination period dropdown
        this.showResetButton$ = merge(this.form.valueChanges, this.onRevert$, this.onReset$, this.onApply$)
            .pipe(startWith(false))
            .pipe(
                withLatestFrom(this.eliminationPeriods$),
                map(([, eliminationPeriod]) => this.form.controls.selectedEliminationPeriod.value !== eliminationPeriod[0]),
            );
    }

    /**
     * Set form values, and populate it using eliminationPeriodState
     *
     * @param eliminationPeriodState eliminationPeriodState that determines the value of form
     */
    setFormValues(eliminationPeriodsState: EliminationPeriod): void {
        this.form.controls.selectedEliminationPeriod.setValue(eliminationPeriodsState);
    }

    /**
     * Update ProducerShopComponentStore with Elimination period and coverage level value
     *
     * @param eliminationPeriod Elimination period value (selected value or reset state value)
     * @param panelIdentifiers current panel identifiers
     */
    updateEliminationPeriodAndCoverageLevelState(eliminationPeriod: EliminationPeriod, panelIdentifiers: PanelIdentifiers): void {
        // Update ProducerShopComponentStore with default value
        this.producerShopComponentStoreService.upsertEliminationPeriodState({
            eliminationPeriod,
            panelIdentifiers,
        });
        this.producerShopComponentStoreService.upsertCoverageLevelState({
            coverageLevel: eliminationPeriod,
            panelIdentifiers,
        });
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
     * Returns unique identifier for EliminationPeriod.
     * trackBy for *ngFor involving EliminationPeriod used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param eliminationPeriod {EliminationPeriod} current EliminationPeriod in iteration
     * @returns unique identifier for EliminationPeriod
     */
    trackByEliminationPeriodName(index: number, eliminationPeriod: EliminationPeriod): string {
        return eliminationPeriod.name;
    }

    /**
     * Call base class ngOnDestroy.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
