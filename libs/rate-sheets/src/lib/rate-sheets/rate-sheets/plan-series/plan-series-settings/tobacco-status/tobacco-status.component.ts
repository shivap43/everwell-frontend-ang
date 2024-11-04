import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { SettingsDropdownName } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { select } from "@ngrx/store";
import { Subject, combineLatest } from "rxjs";
import { map, switchMap, take, takeUntil, tap, filter, withLatestFrom } from "rxjs/operators";

@Component({
    selector: "empowered-tobacco-status",
    templateUrl: "./tobacco-status.component.html",
    styleUrls: ["./tobacco-status.component.scss"],
})
export class TobaccoStatusComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;

    form: FormGroup;
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    tobaccoStatuses$ = this.selectedPlanSeries$.pipe(
        withLatestFrom(this.selectedProduct$),
        switchMap(
            ([
                { planSeries },
                {
                    product: { id },
                },
            ]) => this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(id, planSeries.id))),
        ),
        map(([{ tobaccoStatuses }]) =>
            tobaccoStatuses?.map((status) => ({
                value: status,
                text: this.language.fetchPrimaryLanguageValue(
                    `primary.portal.rateSheets.planSeriesSettings.tobacco.options.${status.toLowerCase()}`,
                ),
            })),
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
        private readonly language: LanguageService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.TOBACCO);
    }

    /**
     * Initialize subscriptions.
     */
    ngOnInit(): void {
        super.onInit();
        this.form = this.formBuilder.group({
            tobaccoStatuses: [],
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
                filter(({ settings }) => !!settings),
                tap(({ settings: { tobaccoStatuses } }) => {
                    this.form.reset({ tobaccoStatuses });
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
        this.onRevert$.next();
    }

    /**
     * Executes on click of 'Apply'.
     */
    onApply(): void {
        const tobaccoStatuses = this.form.controls.tobaccoStatuses.value;
        this.form.controls.tobaccoStatuses.setErrors(tobaccoStatuses?.length ? null : { required: true });

        if (!this.form) {
            return;
        }
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
                                settings: { tobaccoStatuses },
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
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
