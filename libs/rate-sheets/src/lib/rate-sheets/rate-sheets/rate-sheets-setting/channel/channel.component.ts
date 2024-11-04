import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { combineLatest, Observable, Subject } from "rxjs";
import { mapTo, startWith, takeUntil, tap } from "rxjs/operators";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";

@Component({
    selector: "empowered-channel",
    templateUrl: "./channel.component.html",
    styleUrls: ["./channel.component.scss"],
})
export class ChannelComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    readonly form: FormGroup;
    channels$: Observable<string[]>;
    showResetButton$!: Observable<boolean>;
    defaultChannel$ = this.rateSheetsComponentStoreService.selectChannelOnAsyncValue();
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
    ) {
        super(settingsDropdownStore, SettingsDropdownName.CHANNEL);
        // initializing form
        this.form = this.formBuilder.group({
            selectedChannel: ["", Validators.required],
        });
    }

    /**
     * updating form to default value and dropdown functions to default behavior on component initialization
     */
    ngOnInit(): void {
        super.onInit();
        this.channels$ = this.ngxsRateSheetsStateService.getChannels();
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.defaultChannel$])
            .pipe(
                tap(([revert, defaultChannel]) => {
                    this.form.controls.selectedChannel.setValue(defaultChannel);
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
     * function executes on channel dropdown show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * function executes on hiding channel dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on click of apply in channel dropdown
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        this.rateSheetsComponentStoreService.setChannel({
            status: AsyncStatus.SUCCEEDED,
            value: this.form.controls.selectedChannel.value,
            error: null,
        });
        this.onApply$.next();
        this.portalRef?.hide();
    }

    /**
     * function to revert the form
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * function executes on click of reset in channel dropdown and resets form to default channel
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
