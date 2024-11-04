import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, CountryState, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { combineLatest, Observable, Subject } from "rxjs";
import { mapTo, startWith, takeUntil, tap, map } from "rxjs/operators";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { UtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-state",
    templateUrl: "./state.component.html",
    styleUrls: ["./state.component.scss"],
})
export class StateComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    readonly form: FormGroup;
    states$: Observable<CountryState[]>;
    showResetButton$!: Observable<boolean>;
    defaultState$ = this.rateSheetsComponentStoreService.selectCountryStateOnAsyncValue();
    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should reset
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();
    // Used to determine when FormGroup should show
    private readonly onShow$ = new Subject<void>();
    // Used to clean up rxjs subscriptions
    private readonly unsubscriber$ = new Subject<void>();

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly formBuilder: FormBuilder,
        private readonly ngxsRateSheetsStateService: NGXSRateSheetsStateService,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
        private readonly utilService: UtilService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.STATE);
        // initializing the form
        this.form = this.formBuilder.group({
            selectedState: [null, Validators.required],
        });
    }

    /**
     * updating form to default value and dropdown functions to default behavior on component initialization
     */
    ngOnInit(): void {
        super.onInit();
        this.states$ = this.ngxsRateSheetsStateService.getLevelSettings().pipe(map((levelSettings) => levelSettings?.states));
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.defaultState$])
            .pipe(
                tap(([revert, defaultState]) => {
                    this.form.controls.selectedState.setValue(defaultState.name);
                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }, takeUntil(this.unsubscriber$)),
            )
            .subscribe();
        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * function executes on state dropdown show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * function executes on hiding state dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on click of apply in state dropdown
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        let countryState;
        this.states$.subscribe((states) => (countryState = states?.find((state) => state.name === this.form.controls.selectedState.value)));
        this.rateSheetsComponentStoreService.setCountryState({
            status: AsyncStatus.SUCCEEDED,
            value: countryState,
            error: null,
        });
        this.updateMoreSettingsZipField(countryState.abbreviation);
        this.onApply$.next();
        this.portalRef?.hide();
    }

    /**
     * function to clear more settings zip field when state selection change and doesn't match with zip
     * @param selectedStateAbbr selected state abbreviation
     */
    updateMoreSettingsZipField(selectedStateAbbr: string): void {
        let moreSettings;
        // get more settings fields value from component store
        this.rateSheetsComponentStoreService
            .selectMoreSettingsOnAsyncValue()
            .pipe(
                tap((value) => (moreSettings = value)),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
        if (moreSettings?.zipCode) {
            this.utilService
                .validateZip(selectedStateAbbr, moreSettings?.zipCode.toString())
                .pipe(takeUntil(this.unsubscriber$))
                .subscribe((res) => {
                    if (!res) {
                        moreSettings.zipCode = "";
                        // set more settings fields value to component store
                        this.rateSheetsComponentStoreService.setMoreSettings({
                            status: AsyncStatus.SUCCEEDED,
                            value: moreSettings,
                            error: null,
                        });
                    }
                });
        }
    }

    /**
     * function to revert the form
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * function executes on click of reset in state dropdown and resets form to default state
     */
    onReset(): void {
        this.onReset$.next();
        this.portalRef?.hide();
    }

    /**
     * Call base class instance's ngOnDestroy.
     *
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
