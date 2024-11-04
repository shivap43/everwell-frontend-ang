import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, PayFrequency, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { combineLatest, Observable, Subject } from "rxjs";
import { mapTo, startWith, takeUntil, tap, map } from "rxjs/operators";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";

@Component({
    selector: "empowered-payment-frequency",
    templateUrl: "./payment-frequency.component.html",
    styleUrls: ["./payment-frequency.component.scss"],
})
export class PaymentFrequencyComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    readonly form: FormGroup;
    allPayFrequencies$: Observable<PayFrequency[]> = this.ngxsRateSheetsStateService
        .getLevelSettings()
        .pipe(map((levelSettings) => levelSettings?.payFrequency));
    configurations$ = this.ngxsRateSheetsStateService.getConfigurations();
    showResetButton$!: Observable<boolean>;
    defaultPayFrequency$ = this.rateSheetsComponentStoreService.selectPaymentFrequencyOnAsyncValue();
    selectedChannel$ = this.rateSheetsComponentStoreService.selectChannelOnAsyncValue();
    paymentFrequencies$: Observable<PayFrequency[]> = combineLatest([
        this.selectedChannel$,
        this.allPayFrequencies$,
        this.configurations$,
        this.defaultPayFrequency$,
    ]).pipe(
        map(([selectedChannel, allPayFrequencies, configurations, defaultPayFrequency]) => {
            const index = configurations?.findIndex((config) => config.channel.toUpperCase() === selectedChannel);
            if (index > -1) {
                const paymentFrequencies = allPayFrequencies?.filter((payFrequency) =>
                    configurations[index].allowedPayFrequency.includes(payFrequency.frequencyType),
                );
                if (
                    paymentFrequencies?.findIndex((payFrequency) => payFrequency.name === defaultPayFrequency.name) === -1 &&
                    paymentFrequencies.length
                ) {
                    this.rateSheetsComponentStoreService.setPayFrequency({
                        status: AsyncStatus.SUCCEEDED,
                        value: paymentFrequencies[0],
                        error: null,
                    });
                }
                return paymentFrequencies;
            }
            return allPayFrequencies;
        }),
    );
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
        super(settingsDropdownStore, SettingsDropdownName.PAYMENT_FREQUENCY);
        // initializing the form
        this.form = this.formBuilder.group({
            selectedPaymentFrequency: ["", Validators.required],
        });
    }

    /**
     * updating form to default value and dropdown functions to default behavior on component initialization
     */
    ngOnInit(): void {
        super.onInit();
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.defaultPayFrequency$])
            .pipe(
                tap(([revert, defaultPayFrequency]) => {
                    this.form.controls.selectedPaymentFrequency.setValue(defaultPayFrequency.name);
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
     * function executes on payFrequency dropdown show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * function executes on hiding payFrequency dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on click of apply in payFrequency dropdown
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        let selectedPayFrequency;
        this.paymentFrequencies$.subscribe(
            (paymentFrequencies) =>
                (selectedPayFrequency = paymentFrequencies?.find(
                    (paymentFrequency) => paymentFrequency.name === this.form.controls.selectedPaymentFrequency.value,
                )),
        );
        this.rateSheetsComponentStoreService.setPayFrequency({
            status: AsyncStatus.SUCCEEDED,
            value: selectedPayFrequency,
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
     * function executes on click of reset in payFrequency dropdown and resets form to default payFrequency
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
