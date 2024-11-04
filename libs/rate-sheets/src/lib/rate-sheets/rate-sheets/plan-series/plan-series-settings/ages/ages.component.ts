import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { AgeBand, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { Subject, combineLatest } from "rxjs";
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";

@Component({
    selector: "empowered-ages",
    templateUrl: "./ages.component.html",
    styleUrls: ["./ages.component.scss"],
})
export class AgesComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    @Input() ageBands: AgeBand[];

    ageOptions: number[];

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
        map(
            ([
                {
                    ageBands: [{ minAge, maxAge }],
                },
            ]) => this.getNumberRange(minAge, maxAge),
        ),
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
        super(settingsDropdownStore, SettingsDropdownName.AGE);
    }

    /**
     * Initialize subsccriptions.
     */
    ngOnInit(): void {
        super.onInit();
        this.form = this.formBuilder.group(
            { minAge: [], maxAge: [] },
            {
                validators: (group: FormGroup) => (group.value.minAge > group.value.maxAge ? { invalidMinAge: true } : null),
            },
        );
        this.form.valueChanges
            .pipe(
                tap(({ minAge, maxAge }) => this.form.controls.maxAge.setErrors(minAge > maxAge ? { invalid: true } : null)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

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
                tap(
                    ({
                        settings: {
                            ageBands: [{ minAge, maxAge }],
                        },
                    }) => {
                        this.form.reset({ minAge, maxAge });
                        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(
                            this.form,
                            this.onRevert$,
                            this.onReset$,
                            this.onApply$,
                        );
                    },
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.onRevert();
    }

    /**
     * Executes on click of 'Apply'.
     */
    onApply(): void {
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
                                settings: { ageBands: [this.form.value] },
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
     * Get an array of numbers in the specified interval. [start, end)
     *
     * @param start
     * @param end
     * @returns array of numbers {x | start <= x < end}
     */
    getNumberRange(start: number, end: number): number[] {
        return new Array(end - start + 1).fill(0).map((d, i) => i + start);
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
