import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AsyncStatus, RiskClass, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { combineLatest, Observable, Subject } from "rxjs";
import { mapTo, startWith, takeUntil, tap, map } from "rxjs/operators";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";

@Component({
    selector: "empowered-job-class",
    templateUrl: "./job-class.component.html",
    styleUrls: ["./job-class.component.scss"],
})
export class JobClassComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    readonly form: FormGroup;
    allJobClasses$: Observable<RiskClass[]> = this.ngxsRateSheetsStateService
        .getLevelSettings()
        .pipe(map((levelSettings) => levelSettings?.riskClasses));
    configurations$ = this.ngxsRateSheetsStateService.getConfigurations();
    showResetButton$!: Observable<boolean>;
    defaultJobClass$ = this.rateSheetsComponentStoreService.selectRiskClassOnAsyncValue();
    selectedChannel$ = this.rateSheetsComponentStoreService.selectChannelOnAsyncValue();
    jobClasses$: Observable<RiskClass[]> = combineLatest([
        this.selectedChannel$,
        this.allJobClasses$,
        this.configurations$,
        this.defaultJobClass$,
    ]).pipe(
        map(([selectedChannel, allJobClasses, configurations, defaultJobClass]) => {
            const index = configurations?.findIndex((config) => config.channel.toUpperCase() === selectedChannel);
            if (index > -1) {
                const jobClasses = allJobClasses?.filter((risk) => configurations[index].allowedRiskValues.includes(risk.name));
                if (jobClasses?.findIndex((jobClass) => jobClass.name === defaultJobClass.name) === -1 && jobClasses.length) {
                    this.rateSheetsComponentStoreService.setRiskClass({
                        status: AsyncStatus.SUCCEEDED,
                        value: jobClasses[0],
                        error: null,
                    });
                }
                return jobClasses;
            }
            return allJobClasses;
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
        super(settingsDropdownStore, SettingsDropdownName.JOB_CLASS);
        // initializing form
        this.form = this.formBuilder.group({
            selectedJobClass: ["", Validators.required],
        });
    }

    /**
     * updating form to default value and dropdown functions to default behavior on component initialization
     */
    ngOnInit(): void {
        super.onInit();
        combineLatest([this.onRevert$.pipe(mapTo(true), startWith(false)), this.defaultJobClass$])
            .pipe(
                tap(([revert, defaultJobClass]) => {
                    this.form.controls.selectedJobClass.setValue(defaultJobClass.name);
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
     * function executes on jobClass dropdown show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * function executes on hiding jobClass dropdown
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on click of apply in jobClass dropdown
     */
    onApply(): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        let selectedJobClass;
        this.jobClasses$.subscribe(
            (jobClasses) =>
                (selectedJobClass = jobClasses?.find((jobClass) => jobClass.name === this.form.controls.selectedJobClass.value)),
        );
        this.rateSheetsComponentStoreService.setRiskClass({
            status: AsyncStatus.SUCCEEDED,
            value: selectedJobClass,
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
     * function executes on click of reset in jobClass dropdown and resets form to default jobClass
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
