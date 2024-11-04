import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, ConfigName, SettingsDropdownName } from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { Subject, combineLatest, Observable } from "rxjs";
import { mapTo, startWith, takeUntil, tap, map } from "rxjs/operators";
import { RateSheetMoreSettings } from "../../rate-sheets-component-store/rate-sheets-component-store.model";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";

@Component({
    selector: "empowered-rate-sheet-more-settings",
    templateUrl: "./more-settings.component.html",
    styleUrls: ["./more-settings.component.scss"],
})
export class MoreSettingsComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    readonly form: FormGroup;
    selectedState$: Observable<string> = this.rateSheetsComponentStoreService
        .selectCountryStateOnAsyncValue()
        .pipe(map((state) => state?.abbreviation));
    sicCodeMaxLength: number;
    eligibleSubscribersMaxLength: number;
    defaultMoreSettings$ = this.rateSheetsComponentStoreService.selectMoreSettingsOnAsyncValue();
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
        private readonly staticUtilService: StaticUtilService,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.MORE);
        // initializing more settings form
        this.form = this.formBuilder.group({
            zipCode: [""],
            sicCode: [""],
            eligibleSubscribers: [""],
        });
    }

    /**
     * initializes the component
     */
    ngOnInit(): void {
        super.onInit();
        // configs for form validations
        combineLatest([
            this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MAX_LENGTH),
            this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MIN_VALUE),
            this.staticUtilService.cacheConfigValue(ConfigName.SIC_CODE_MAX_VALUE),
            this.staticUtilService.cacheConfigValue(ConfigName.ELIGIBLE_EMPLOYEES_MAX_LENGTH),
            this.staticUtilService.cacheConfigValue(ConfigName.ELIGIBLE_EMPLOYEES_MIN_VALUE),
        ])
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(([sicCodeMaxLength, sicCodeMin, sicCodeMax, eligibleSubscribersMaxLength, eligibleSubscribersMin]) => {
                this.sicCodeMaxLength = +sicCodeMaxLength;
                this.form.controls.sicCode.setValidators([Validators.min(+sicCodeMin), Validators.max(+sicCodeMax)]);
                this.eligibleSubscribersMaxLength = +eligibleSubscribersMaxLength;
                this.form.controls.eligibleSubscribers.setValidators([Validators.min(+eligibleSubscribersMin)]);
            });
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.defaultMoreSettings$.pipe(startWith(null))])
            .pipe(
                tap(([revert, defaultMoreSettings]) => {
                    if (this.form.controls.zipCode.value !== defaultMoreSettings?.zipCode) {
                        this.form.controls.zipCode.setValue(defaultMoreSettings?.zipCode);
                    }
                    if (this.form.controls.sicCode.value !== defaultMoreSettings?.sicCode) {
                        this.form.controls.sicCode.setValue(defaultMoreSettings?.sicCode);
                    }
                    if (this.form.controls.eligibleSubscribers.value !== defaultMoreSettings?.eligibleSubscribers) {
                        this.form.controls.eligibleSubscribers.setValue(defaultMoreSettings?.eligibleSubscribers);
                    }
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
     * function executes on more settings dropdown show
     */
    onShow(): void {
        this.onShow$.next();
        this.onHide();
    }

    /**
     * function executes on hiding more settings dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on click of apply in more settings dropdown
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        const moreSettings: RateSheetMoreSettings = {
            zipCode: this.form.controls.zipCode.value,
            sicCode: this.form.controls.sicCode.value,
            eligibleSubscribers: this.form.controls.eligibleSubscribers.value,
        };
        this.rateSheetsComponentStoreService.setMoreSettings({
            status: AsyncStatus.SUCCEEDED,
            value: moreSettings,
            error: null,
        });
        this.portalRef?.hide();
        this.onApply$.next();
    }

    /**
     * function to revert the form
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * function executes on click of reset in more settings dropdown and resets form to default state
     */
    onReset(): void {
        const moreSettings: RateSheetMoreSettings = {
            zipCode: "",
            sicCode: null,
            eligibleSubscribers: null,
        };
        this.rateSheetsComponentStoreService.setMoreSettings({
            status: AsyncStatus.SUCCEEDED,
            value: moreSettings,
            error: null,
        });
        this.form.reset();
        this.onReset$.next();
        this.portalRef?.hide();
    }

    /**
     * cleans up the subscription
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
