import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AdminService } from "@empowered/api";
import {
    AgeBand,
    AsyncStatus,
    ConfigName,
    CountryState,
    CredentialProperties,
    Gender,
    PayFrequency,
    ProductId,
    QuickQuotePlanDetails,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesSettings,
    RateSheetSettings,
    RiskClass,
    TobaccoStatus,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore, getEntityId } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { RestictedConfigurations } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { select } from "@ngrx/store";
import { forkJoin, Observable, Subject, combineLatest, of, EMPTY } from "rxjs";
import { filter, switchMap, takeUntil, tap, withLatestFrom, take, pairwise, catchError, map } from "rxjs/operators";
import { CreateRateSheetComponent } from "./create-rate-sheet/create-rate-sheet.component";
import { NGXSRateSheetsStateService } from "./ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetMoreSettings } from "./rate-sheets-component-store/rate-sheets-component-store.model";
import { RateSheetsComponentStoreService } from "./rate-sheets-component-store/rate-sheets-component-store.service";
import { EmpoweredSheetService } from "@empowered/common-services";
import { PlanSeriesComponent } from "./plan-series/plan-series.component";
import { SharedActions } from "@empowered/ngrx-store/ngrx-states/shared";

@Component({
    selector: "empowered-rate-sheets",
    templateUrl: "./rate-sheets.component.html",
    styleUrls: ["./rate-sheets.component.scss"],
})
export class RateSheetsComponent implements OnInit, OnDestroy {
    @ViewChild(PlanSeriesComponent) planSeriesComponent: PlanSeriesComponent;
    rateSheetsPlanSelections = [];
    buttonDisabledTooltipValue = this.languageService.fetchPrimaryLanguageValue("primary.portal.common.buttonDisabled.tooltip.message");
    adminId: number;
    riskClasses: RiskClass[];
    paymentFrequency: PayFrequency[];
    allStates: CountryState[];
    preferenceConstant = ["state", "channel", "pay_frequency", "job_class"];
    payrollDirectBillConstant = "PAYROLLDIRECTBILL";
    payrollConstant = "PAYROLL";
    payrollDirectBillConstantWithSpace = "PAYROLL DIRECT BILL";
    defaultStateName: string;
    defaultChannelName: string;
    defaultRiskClassName: string;
    defaultPayFrequencyName: string;
    showRateSheetSettings = false;

    rateSheetSettings$: Observable<RateSheetSettings> = this.rateSheetsComponentStoreService.selectRateSheetSettings();
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    enableCreateRateSheet$ = this.ngrxStore
        .pipe(select(RateSheetsSelectors.getIncludedPlanSeries))
        .pipe(map((planSeriesMap) => Object.keys(planSeriesMap).length > 0));
    private readonly unsubscribe$ = new Subject<void>();
    private readonly showSpinnerSubject$ = new Subject<boolean>();
    showSpinner$ = this.showSpinnerSubject$.asObservable();
    isRateSheetSettingsNull: boolean;

    constructor(
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly userService: UserService,
        private readonly ngxsRateSheetsStateService: NGXSRateSheetsStateService,
        private readonly adminService: AdminService,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
        private readonly sheetService: EmpoweredSheetService,
    ) {}

    ngOnInit(): void {
        this.ngrxStore.dispatch(
            SharedActions.loadConfigurations({
                configurationNameRegex: ConfigName.RATE_SHEET_TERM_WHOLE_LIFE_SPOUSE_RIDER,
            }),
            true,
        );
        if (!this.adminId) {
            this.getAdminId();
        }

        // Show Rate Sheet Settings
        combineLatest([
            this.ngxsRateSheetsStateService.getAdminPreference(),
            this.ngxsRateSheetsStateService.getLevelSettings(),
            this.ngxsRateSheetsStateService.getChannels(),
            this.ngxsRateSheetsStateService.getConfigurations(),
        ])
            .pipe(
                switchMap(([adminPreferences, levelSettings, channels, configurations]) => {
                    if (adminPreferences && levelSettings && channels?.length && configurations?.length) {
                        const channelIndex = adminPreferences.findIndex((channel) => channel.name === this.preferenceConstant[1]);
                        const stateIndex = adminPreferences.findIndex((state) => state.name === this.preferenceConstant[0]);
                        this.allStates = levelSettings.states;
                        if (!adminPreferences.length || (adminPreferences.length && channelIndex === -1 && stateIndex === -1)) {
                            // When no admin preference exists, create DB rows for risk class and payment frequency
                            return this.adminService.getAdminContact(this.adminId).pipe(
                                tap((resp) => {
                                    // Admin Contact exists then use the address state for preference creation
                                    if (Object.entries(resp).length && resp.address && resp.address.state) {
                                        this.defaultStateName = this.getStateName(resp.address.state, levelSettings.states);
                                    } else {
                                        // No admin contact address, use the default state name
                                        if (
                                            levelSettings.states.length &&
                                            levelSettings.payFrequency.length &&
                                            levelSettings.riskClasses.length
                                        ) {
                                            this.defaultStateName = levelSettings.states[0].name;
                                        }
                                    }
                                    this.defaultPayFrequencyName = levelSettings.payFrequency[0].name;
                                    this.defaultRiskClassName = levelSettings.riskClasses[0].name;
                                    this.defaultChannelName = this.payrollConstant;
                                    this.updateConfigurations(levelSettings.riskClasses, levelSettings.payFrequency, configurations);
                                    // Update header settings in store
                                    this.updateDefaultSettingValuesToStore();
                                    this.showRateSheetSettings = true;
                                }),
                            );
                        } else if (adminPreferences.length) {
                            // When admin preference exists update default settings values
                            const freqIndex = adminPreferences.findIndex((key) => key.name === this.preferenceConstant[2]);
                            const riskClassIndex = adminPreferences.findIndex((key) => key.name === this.preferenceConstant[3]);
                            this.defaultStateName =
                                stateIndex > -1 ? this.getStateName(adminPreferences[stateIndex].value, levelSettings.states) : null;
                            this.defaultChannelName =
                                channelIndex > -1
                                    ? adminPreferences[channelIndex].value.replace(
                                        this.payrollDirectBillConstant,
                                        this.payrollDirectBillConstantWithSpace,
                                    )
                                    : this.payrollConstant;
                            this.defaultPayFrequencyName = freqIndex > -1 ? adminPreferences[freqIndex].value : null;
                            this.defaultRiskClassName = riskClassIndex > -1 ? adminPreferences[riskClassIndex].value : null;
                            this.updateConfigurations(levelSettings.riskClasses, levelSettings.payFrequency, configurations);
                            // Update header settings in store
                            this.updateDefaultSettingValuesToStore();
                            this.showRateSheetSettings = true;
                        }
                    }
                    return EMPTY;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        let adminPreference: number;
        this.ngxsRateSheetsStateService.getAdminPreference().subscribe((adminPreferences) => (adminPreference = adminPreferences.length));
        if (!adminPreference) {
            forkJoin([
                this.ngxsRateSheetsStateService.setAdminPreference(this.adminId),
                this.ngxsRateSheetsStateService.setQuoteLevelData(),
                this.ngxsRateSheetsStateService.setRestrictedConfiguration(),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe();
        }
        // pre populating selected plan series to default plan series of selected product
        this.ngrxStore
            .onAsyncValue(select(RateSheetsSelectors.getSelectedProduct))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((selectedProduct) =>
                this.ngrxStore.dispatch(RateSheetsActions.setSelectedPlanSeries({ planSeries: selectedProduct.planSeries[0] })),
            );
        this.rateSheetSettings$
            .pipe(
                withLatestFrom(this.selectedPlanSeries$),
                tap(([{ state, partnerAccountType, payrollFrequencyId, riskClassId }, { planSeries }]) => {
                    // Clear any saved data when the top-level rate sheet settings change
                    this.clearRateSheetsPlanSeries();
                    const append = [QuickQuotePlanDetails.MIN_ELIGIBLE_SUBSCRIBERS, QuickQuotePlanDetails.MAX_ELIGIBLE_SUBSCRIBERS];
                    // Load plan series and quick quote plan data to set up the plan series accordions
                    this.ngrxStore.dispatch(RateSheetsActions.loadPlanSeries());
                    this.ngrxStore.dispatch(
                        RateSheetsActions.loadQuickQuotePlans({ state, partnerAccountType, payrollFrequencyId, riskClassId, append }),
                    );
                    if (planSeries) {
                        this.ngrxStore.dispatch(RateSheetsActions.setSelectedPlanSeries({ planSeries }));
                    }
                }),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        combineLatest([this.selectedPlanSeries$, this.rateSheetSettings$])
            .pipe(
                pairwise(),
                switchMap(([[, previousSettings], [{ planSeries }, settings]]) =>
                    this.ngrxStore.pipe(select(RateSheetsSelectors.getRateSheetPlanSeriesOptionsEntities)).pipe(
                        take(1),
                        withLatestFrom(this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct))),
                        filter(
                            ([options, selectedProduct]) =>
                                // Fetch options from service if rate sheet settings change OR
                                !this.rateSheetsComponentStoreService.rateSheetSettingsEqual(previousSettings, settings) ||
                                // if there is a cache miss.
                                !options.ids.some((id) => id === getEntityId(selectedProduct.product.id, planSeries.id)),
                        ),
                        tap(
                            ([
                                ,
                                {
                                    product: { id },
                                },
                            ]) => {
                                // Clear previously saved settings.
                                this.ngrxStore.dispatch(
                                    RateSheetsActions.setRateSheetPlanSeriesSettings({
                                        productId: id,
                                        planSeriesId: planSeries.id,
                                        settings: null,
                                    }),
                                );
                                // Load options from API.
                                this.ngrxStore.dispatch(
                                    RateSheetsActions.loadRateSheetPlanSeriesOptions({
                                        ...settings,
                                        productId: id,
                                        planSeriesId: planSeries.id,
                                        sicCode: +settings.sicCode,
                                    }),
                                );
                            },
                        ),
                        catchError((error) => {
                            this.showSpinnerSubject$.next(false);
                            return of(null);
                        }),
                        // Set default settings on the plan series.
                        switchMap(
                            ([
                                ,
                                {
                                    product: { id },
                                },
                            ]) => {
                                this.isRateSheetSettingsNull = true;
                                return this.setRateSheetPlanSeriesDefaultSettings(id, planSeries.id);
                            },
                        ),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Get the admin id from store.
     */
    getAdminId(): void {
        this.userService.credential$
            .pipe(
                tap((credential) => {
                    if (CredentialProperties.PRODUCER_ID in credential) {
                        this.adminId = credential[CredentialProperties.PRODUCER_ID];
                    } else if (CredentialProperties.ADMIN_ID in credential) {
                        this.adminId = credential[CredentialProperties.ADMIN_ID];
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Gets state name of the stateAbbreviation passed as parameter
     * @param stateAbbreviation abbreviation of the state name
     * @param allStates array of states containing state name and state abbreviation
     * @returns state name
     */
    getStateName(stateAbbreviation: string, allStates: CountryState[]): string {
        const index = allStates.findIndex((states) => states.abbreviation === stateAbbreviation);
        return allStates[index].name;
    }

    /**
     * Updates riskClasses and payFrequencies with valid values based on configurations
     * @param allRiskClasses contains all riskClasses irrespective of any channel
     * @param allPaymentFrequency contains all pay frequencies irrespective of any channel
     * @param configurations contains valid riskClasses and payFrequencies with respect to channel
     */
    updateConfigurations(
        allRiskClasses: RiskClass[],
        allPaymentFrequency: PayFrequency[],
        configurations: RestictedConfigurations[],
    ): void {
        const index = configurations.findIndex((config) => config.channel.toUpperCase() === this.defaultChannelName);
        if (index > -1) {
            this.riskClasses = allRiskClasses.filter((risk) => configurations[index].allowedRiskValues.includes(risk.name));
            this.paymentFrequency = allPaymentFrequency.filter((freq) =>
                configurations[index].allowedPayFrequency.includes(freq.frequencyType),
            );
            const selectedFrequency = this.defaultPayFrequencyName;
            const selectedJobClass = this.defaultRiskClassName;
            if (this.paymentFrequency.findIndex((freq) => freq.name === selectedFrequency) === -1 && this.paymentFrequency.length) {
                this.defaultPayFrequencyName = this.paymentFrequency[0].name;
            }
            if (this.riskClasses.findIndex((jobClass) => jobClass.name === selectedJobClass) === -1 && this.riskClasses.length) {
                this.defaultRiskClassName = this.riskClasses[0].name;
            }
        }
    }

    /**
     * Updates default setting values to component store
     * @param allStates list of states that contains default state value as one of its values
     */
    updateDefaultSettingValuesToStore(): void {
        const defaultStateIndex = this.allStates?.findIndex((state) => state.name === this.defaultStateName);
        this.rateSheetsComponentStoreService.setCountryState({
            status: AsyncStatus.SUCCEEDED,
            value: this.allStates[defaultStateIndex],
            error: null,
        });
        this.rateSheetsComponentStoreService.setChannel({
            status: AsyncStatus.SUCCEEDED,
            value: this.defaultChannelName,
            error: null,
        });
        const defaultPayFrequencyIndex = this.paymentFrequency?.findIndex(
            (payFrequency) => payFrequency.name === this.defaultPayFrequencyName,
        );
        this.rateSheetsComponentStoreService.setPayFrequency({
            status: AsyncStatus.SUCCEEDED,
            value: this.paymentFrequency[defaultPayFrequencyIndex],
            error: null,
        });
        const defaultRiskClassIndex = this.riskClasses?.findIndex((riskClass) => riskClass.name === this.defaultRiskClassName);
        this.rateSheetsComponentStoreService.setRiskClass({
            status: AsyncStatus.SUCCEEDED,
            value: this.riskClasses[defaultRiskClassIndex],
            error: null,
        });
    }

    /**
     * Resets all the rate sheet settings to default values (NGXS)
     */
    resetSettings(): void {
        this.updateDefaultSettingValuesToStore();
        const moreSettings: RateSheetMoreSettings = { zipCode: null, sicCode: null, eligibleSubscribers: null };
        this.rateSheetsComponentStoreService.setMoreSettings({
            status: AsyncStatus.SUCCEEDED,
            value: moreSettings,
            error: null,
        });
        this.clearRateSheetsPlanSeries();
        this.planSeriesComponent?.accordion.closeAll();
    }

    /**
     * Get plan series options.
     *
     * @param planSeriesId id of plan series
     * @returns options available for the selected plan series
     */
    getRateSheetPlanSeriesOptions(productId: number, planSeriesId: number): Observable<RateSheetPlanSeriesOption[]> {
        return this.ngrxStore.pipe(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(productId, planSeriesId))).pipe(
            filter((asyncData) => asyncData.status === AsyncStatus.FAILED || asyncData.status === AsyncStatus.SUCCEEDED),
            map((asyncData) => asyncData.value ?? []),
        );
    }

    /**
     * Get settings for the selected plan series.
     *
     * @param planSeriesId id of plan series
     * @returns settings for the selected plan series
     */
    getRateSheetPlansSeriesSettings(productId: number, planSeriesId: number): Observable<RateSheetPlanSeriesSettings> {
        return this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlansSeriesSettings(productId, planSeriesId)));
    }

    /**
     * Set plan series settings for the selected plan series.
     *
     * @param planSeriesId id of plan series for which settings are being updated
     * @returns plan series options for the selected plan series
     */
    setRateSheetPlanSeriesDefaultSettings(productId: number, planSeriesId: number): Observable<RateSheetPlanSeriesOption[]> {
        return this.getRateSheetPlansSeriesSettings(productId, planSeriesId).pipe(
            // Set default plan series settings only if the user has not set them already
            filter(({ settings }) => this.isRateSheetSettingsNull || !(settings && Object.keys(settings).length)),
            tap(() => this.showSpinnerSubject$.next(true)),
            switchMap(() => this.getRateSheetPlanSeriesOptions(productId, planSeriesId)),
            tap(() => this.showSpinnerSubject$.next(false)),
            filter((planSeriesOptions) => planSeriesOptions?.length > 0),
            tap(([{ ageBands, genders, tobaccoStatuses }]) => {
                this.isRateSheetSettingsNull = false;
                this.ngrxStore.dispatch(
                    RateSheetsActions.setRateSheetPlanSeriesSettings(
                        this.getPlanSeriesSettingsDefaults(productId, planSeriesId, ageBands, genders, tobaccoStatuses),
                    ),
                );
            }),
            take(1),
        );
    }

    /**
     * Get default plan series settings.
     *
     * @param planSeriesId id of plan series
     * @param productId id of selected product
     * @param ageBands available age bands
     * @param genders available genders
     * @param tobaccoStatuses available tobacco statuses
     * @returns default settings for the plan series
     */
    getPlanSeriesSettingsDefaults(
        productId: number,
        planSeriesId: number,
        ageBands: AgeBand[],
        genders: Gender[],
        tobaccoStatuses: TobaccoStatus[],
    ): RateSheetPlanSeriesSettings {
        // For Whole Life and Term Life products, applicant defaults are Female and Non-tobacco.
        if ([ProductId.WHOLE_LIFE, ProductId.TERM_LIFE].includes(productId)) {
            return {
                productId,
                planSeriesId,
                settings: {
                    ageBands,
                    genders: genders?.filter((gender) => gender === Gender.FEMALE) || undefined,
                    tobaccoStatuses: tobaccoStatuses?.filter((status) => status === TobaccoStatus.NONTOBACCO) || undefined,
                },
            };
        }

        // For other products, all options are selected by default.
        return { productId, planSeriesId, settings: { ageBands, genders, tobaccoStatuses } };
    }

    /**
     * Clear all plan series data.
     */
    clearRateSheetsPlanSeries(): void {
        this.ngrxStore.dispatch(RateSheetsActions.clearRateSheetPlanSeriesOptions());
        this.ngrxStore.dispatch(RateSheetsActions.clearRateSheetPlanSeriesSettings());
        this.ngrxStore.dispatch(RateSheetsActions.removeAllRateSheetPlanSeriesSelections());
    }

    /**
     * Open quasi-modal to download rate sheet
     */
    createRateSheet(): void {
        const config = {
            restoreFocus: false,
        };
        this.sheetService.openSheet(CreateRateSheetComponent, config);
    }

    /**
     * Passes default values to store, subjects and unsubscribes all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.ngrxStore.dispatch(RateSheetsActions.resetRateSheetsState());
    }
}
