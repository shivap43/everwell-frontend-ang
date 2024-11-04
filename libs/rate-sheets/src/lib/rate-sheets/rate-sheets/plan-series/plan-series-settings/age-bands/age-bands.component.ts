import { Component, EventEmitter, Input, OnDestroy, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { AgeBand, SettingsDropdownName } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { SettingsDropdownContent, DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { select } from "@ngrx/store";
import { Subject, combineLatest } from "rxjs";
import { switchMap, takeUntil, tap, take, map, withLatestFrom, filter } from "rxjs/operators";

@Component({
    selector: "empowered-age-bands",
    templateUrl: "./age-bands.component.html",
    styleUrls: ["./age-bands.component.scss"],
})
export class AgeBandsComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    @Input() ageBands: AgeBand[];
    @Input() planSeriesId: number;

    ageOptions: string[];
    form: FormGroup;

    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    ageOptions$ = this.selectedPlanSeries$.pipe(
        withLatestFrom(this.selectedProduct$),
        switchMap(
            ([
                { planSeries },
                {
                    product: { id },
                },
            ]) => this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(id, planSeries.id))),
        ),
        map(([{ ageBands }]) => this.getAgeBandLabels(ageBands).map((band) => ({ value: band, text: band }))),
    );

    protected unsubscribe$ = new Subject<void>();

    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should revert
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly formBuilder: FormBuilder,
        private readonly ngrxStore: NGRXStore,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.AGE_BANDS);
    }

    /**
     * Initialize subscriptions.
     */
    ngOnInit(): void {
        super.onInit();
        this.form = this.formBuilder.group({
            selectAll: [],
            ageBands: [],
        });

        this.onRevert$
            .pipe(
                switchMap(() => this.selectedPlanSeries$),
                withLatestFrom(this.selectedProduct$),
                switchMap(
                    ([
                        { planSeries },
                        {
                            product: { id },
                        },
                    ]) => this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlansSeriesSettings(id, planSeries.id))),
                ),
                filter(({ settings }) => !!settings?.ageBands),
                tap(({ settings: { ageBands } }) => {
                    this.form.reset({ ageBands: this.getAgeBandLabels(ageBands) });
                    this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(
                        this.form,
                        this.onRevert$,
                        this.onReset$,
                        this.onApply$,
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.onRevert();
    }

    /**
     * Executes on click of 'Apply'.
     */
    onApply(): void {
        const errors = !this.form.controls.ageBands.value?.length;
        [this.form.controls.ageBands, this.form.controls.selectAll].forEach((control) => {
            control.setErrors(errors ? { required: true } : null);
            (control.statusChanges as EventEmitter<string>).emit("TOUCHED");
        });

        this.form.markAllAsTouched();

        if (!this.form.valid) {
            return;
        }

        combineLatest([this.selectedPlanSeries$, this.selectedProduct$])
            .pipe(
                tap(
                    ([
                        { planSeries },
                        {
                            product: { id },
                        },
                    ]) =>
                        this.ngrxStore.dispatch(
                            RateSheetsActions.setRateSheetPlanSeriesSettings({
                                productId: id,
                                planSeriesId: planSeries.id,
                                settings: { ageBands: this.getAgeBands(this.form.controls.ageBands.value) },
                            }),
                        ),
                ),
                take(1),
            )
            .subscribe();

        this.portalRef?.hide();

        this.onApply$.next();
    }

    /**
     * Executes when portal is shown.
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Executes when portal is hidden.
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Revert form changes.
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Reset form and hide portal.
     */
    onReset(): void {
        this.onRevert$.next();
        this.portalRef?.hide();
    }

    /**
     * Get labels for age band objects.
     *
     * @param ageBands array of age bands
     * @returns array of age band labels
     */
    getAgeBandLabels(ageBands: AgeBand[]): string[] {
        return [...ageBands].sort((a, b) => a.minAge - b.minAge).map(({ minAge, maxAge }) => `${minAge}–${maxAge}`);
    }

    /**
     * Get age band objects from labels.
     *
     * @param ageBandLabels array of age band labels
     * @returns array of age band labels
     */
    getAgeBands(ageBandLabels: string[]): AgeBand[] {
        return ageBandLabels.map((label) => {
            const [minAge, maxAge] = label.split("–").map(Number);
            return { minAge, maxAge };
        });
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
