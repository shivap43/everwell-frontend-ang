import { TitleCasePipe } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Gender, SettingsDropdownName } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { select } from "@ngrx/store";
import { Subject, combineLatest } from "rxjs";
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";

@Component({
    selector: "empowered-gender",
    templateUrl: "./gender.component.html",
    styleUrls: ["./gender.component.scss"],
})
export class GenderComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    @Input() genders: Gender[];

    form: FormGroup;
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    genders$ = this.selectedPlanSeries$.pipe(
        withLatestFrom(this.selectedProduct$),
        switchMap(
            ([
                { planSeries },
                {
                    product: { id },
                },
            ]) => this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(id, planSeries.id))),
        ),
        map(([{ genders }]) => genders.map((gender) => ({ value: gender, text: this.titleCasePipe.transform(gender) }))),
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
        private readonly titleCasePipe: TitleCasePipe,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.GENDER);
    }

    /**
     * Initialize subscriptions.
     */
    ngOnInit(): void {
        super.onInit();
        this.form = this.formBuilder.group({
            genders: [],
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
                tap(({ settings: { genders } }) => {
                    this.form.reset({ genders });
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

        this.onReset$.next();
    }

    /**
     * Executes on click of 'Apply'.
     */
    onApply(): void {
        const genders = this.form.controls.genders.value;
        this.form.controls.genders.setErrors(genders?.length ? null : { required: true });

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
                                settings: { genders },
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
