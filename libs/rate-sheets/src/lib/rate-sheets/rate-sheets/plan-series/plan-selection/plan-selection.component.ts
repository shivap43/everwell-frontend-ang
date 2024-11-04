import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import {
    PlanSeries,
    ProductId,
    RateSheetPlanSeriesOption,
    RateSheetCoverageLevelOption,
    Product,
    AgeBand,
    RateSheetBenefitAmount,
    RateSheetPlanSeriesOptionBenefitAmounts,
    RateSheetPlanSeriesSettings,
    RateSheetSettings,
    RateSheetRider,
    CarrierId,
    Plan,
    PlanSeriesCategory,
    ADVPlanType,
    RiderSelection,
} from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { filter, map, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { PlanSelections } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-plan-selection",
    templateUrl: "./plan-selection.component.html",
    styleUrls: ["./plan-selection.component.scss"],
})
export class PlanSelectionComponent implements OnInit, OnDestroy {
    [x: string]: any;
    @Input() planSeries: PlanSeries;
    @Input() product: Product;
    @Input() includedInRateSheet: boolean;

    @Output() saved: EventEmitter<void> = new EventEmitter<void>();

    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    selectedPlanSeriesData$: Observable<RateSheetPlanSeriesOption[]>;
    isStdProduct$ = this.selectedProduct$.pipe(map((product) => product?.product.id === ProductId.SHORT_TERM_DISABILITY));
    isWholeAndTermLifeProduct$: Observable<boolean> = this.selectedProduct$.pipe(
        map((product) => product?.product.id === ProductId.WHOLE_LIFE || product?.product.id === ProductId.TERM_LIFE),
    );
    isOtherProductSelected$: Observable<boolean> = combineLatest([this.isWholeAndTermLifeProduct$, this.isStdProduct$]).pipe(
        map(([isWholeAndTermLifeProduct, isStdProduct]) => !(isWholeAndTermLifeProduct || isStdProduct)),
    );
    riskClassId$ = this.rateSheetsComponentStoreService.selectRiskClassOnAsyncValue();
    selectedState$ = this.rateSheetsComponentStoreService.selectCountryStateOnAsyncValue();
    selectedpayrollFrequencyId$ = this.rateSheetsComponentStoreService.selectPaymentFrequencyOnAsyncValue();
    selectedChannel$ = this.rateSheetsComponentStoreService.selectChannelOnAsyncValue();
    planSeriesAccordionData$ = combineLatest([
        this.selectedPlanSeries$,
        this.riskClassId$,
        this.selectedState$,
        this.selectedpayrollFrequencyId$,
        this.selectedChannel$,
    ]);
    coverageLevelOptions$: Observable<RateSheetCoverageLevelOption[]>;
    eliminationOptions$: Observable<RateSheetCoverageLevelOption[]>;
    benefitAmountOptions$: Observable<RateSheetBenefitAmount[]>;
    private readonly unsubscribe$: Subject<void> = new Subject();
    readonly revertChanges$: Subject<void> = new Subject();
    riderOptions$ = this.selectedPlanSeries$.pipe(
        switchMap(({ planSeries }) =>
            this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRiderOptions(this.product.id, planSeries.id))),
        ),
    );

    planOptionsWithFilteredRiders$ = this.selectedPlanSeries$.pipe(
        switchMap(({ planSeries }) =>
            this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getPlansFilteredRiderOptions(this.product.id, planSeries.id))),
        ),
    );

    form: FormGroup;
    disableCoverageLevelOptions: boolean[];
    disableEliminationPeriods: boolean[];
    disableBenefitAmountOptions: boolean[];
    buttonDisabledTooltip = this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.planSelections.button.tooltip");
    isIndeterminate = false;
    disablePlans = new Map<number, boolean>();
    isToolTipAge = false;
    toolTipAge = this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.planSelections.disabled.tooltip.missingInfo.age");
    toolTipEligibleEmployees = this.language.fetchPrimaryLanguageValue(
        "primary.portal.rateSheets.planSelections.disabled.tooltip.missingInfo.eligibleEmployees",
    );
    toolTipMessage = this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.planSelections.disabled.tooltip");
    toolTipMessageAge: string = this.toolTipMessage + `<li>${this.toolTipAge}</li>`;
    toolTipMessageEligibleEmployees: string = this.toolTipMessage + `<li>${this.toolTipEligibleEmployees}</li>`;
    isInvalidEliminationPeriodSelection = false;
    isInvalidBenefitAmountSelection = false;
    invalidPlanSelections: Record<number, boolean> = {};
    requiredEliminationPeriodSelections: boolean[] = [];
    requiredBenefitAmountSelections: boolean[] = [];
    minimumBenefitAmountOptions: RateSheetBenefitAmount[] = [];
    plansLanguage = this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.plans");
    benefitPeriodsLanguage = this.language.fetchPrimaryLanguageValue("primary.portal.rateSheets.benefitPeriods");
    riderChoices: RiderSelection[];
    previouslySelectedRiders: RiderSelection[] = [];
    isRiderSelectionChange = false;
    planSeriesSettings$: Observable<RateSheetPlanSeriesSettings> = combineLatest([this.selectedProduct$, this.selectedPlanSeries$]).pipe(
        switchMap(
            ([
                {
                    product: { id },
                },
                { planSeries },
            ]) => this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlansSeriesSettings(id, planSeries.id))),
        ),
    );
    rateSheetSettings$: Observable<RateSheetSettings> = this.rateSheetsComponentStoreService.selectRateSheetSettings();
    planSeriesOptionBenefitAmounts$ = combineLatest([this.planSeriesSettings$, this.rateSheetSettings$]).pipe(
        switchMap(([planSeriesSettings, rateSheetSettings]) =>
            this.ngrxStore.onAsyncValue(
                select(
                    RateSheetsSelectors.getRateSheetPlanSeriesOptionBenefitAmounts(
                        planSeriesSettings?.planSeriesId,
                        rateSheetSettings.state,
                        rateSheetSettings.partnerAccountType,
                        rateSheetSettings.payrollFrequencyId,
                        rateSheetSettings.riskClassId,
                        planSeriesSettings?.settings?.ageBands?.[0].minAge,
                        planSeriesSettings?.settings?.ageBands?.[0].maxAge,
                    ),
                ),
            ),
        ),
    );
    riderOptionsBenefitAmounts$: Observable<RateSheetRider[]>;
    planTypeOptions = [ADVPlanType.EMPLOYEE_PAID, ADVPlanType.EMPLOYER_PAID];
    isCarrierOfADV$ = this.selectedPlanSeries$.pipe(
        map(({ planSeries }) => planSeries.plans.some((plan) => plan.carrierId === CarrierId.ADV)),
    );
    distinctPlansForADV: Plan[] = [];

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
    ) {}

    ngOnInit(): void {
        this.distinctPlansForADV = this.removeDuplicatePlans(this.planSeries);
        this.initializeForm();
        this.selectedPlanSeriesData$ = this.planSeriesAccordionData$.pipe(
            switchMap(([{ planSeries }]) =>
                this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(this.product.id, planSeries.id))),
            ),
        );
        this.getCoverageLevelOptions();
        this.getEliminationPeriods();
        this.getBenefitAmounts();
        this.getRateSheetPlanSeriesOptionBenefitAmounts();

        // Initialize form
        combineLatest([this.ngrxStore.pipe(select(RateSheetsSelectors.getIncludedPlanSeries)), this.revertChanges$])
            .pipe(
                withLatestFrom(this.isCarrierOfADV$),
                filter(([[included], isCarrierOfADV]) => {
                    if (isCarrierOfADV && this.product.id === ProductId.DENTAL) {
                        if (this.planSeries.plans.some((r) => r.planSeriesCategory === PlanSeriesCategory.MAC)) {
                            return !!included[`${this.product.id}-${this.planSeries.id}-MAC`];
                        }
                        if (this.planSeries.plans.some((r) => r.planSeriesCategory === PlanSeriesCategory.PPO)) {
                            return !!included[`${this.product.id}-${this.planSeries.id}-PPO`];
                        }
                    }
                    return !!included[`${this.product.id}-${this.planSeries.id}-`];
                }),
                // Get previously saved selections (if they exist) to prepopulate the form
                switchMap(() =>
                    this.ngrxStore.onAsyncValue(
                        select(
                            RateSheetsSelectors.getRateSheetPlanSelections(
                                this.product.id,
                                this.planSeries.id,
                                this.planSeries.plans.map((r) => r.planSeriesCategory)[0],
                            ),
                        ),
                    ),
                ),
                withLatestFrom(
                    this.coverageLevelOptions$,
                    this.eliminationOptions$,
                    this.selectedPlanSeriesData$,
                    this.benefitAmountOptions$,
                    this.isOtherProductSelected$,
                    this.isCarrierOfADV$,
                    this.selectedPlanSeries$,
                ),
                tap(
                    ([
                        selections,
                        coverageLevelOptions,
                        eliminationPeriods,
                        selectedPlanSeriesData,
                        benefitAmountOptions,
                        isOtherProductSelected,
                        isCarrierOfADV,
                        { planSeries },
                    ]) => {
                        let selectedPlans;
                        selectedPlans = isCarrierOfADV
                            ? planSeries?.plans?.filter((plan) => selections.some((selection) => selection.planId === plan.id))
                            : this.planSeries.plans.filter((plan) => selections.some((selection) => selection.planId === plan.id));

                        if (selections[0].planTypes?.length === 1 && selections[0].planTypes?.includes(ADVPlanType.EMPLOYER_PAID)) {
                            selectedPlans = this.distinctPlansForADV.filter((plan) =>
                                selectedPlans.some(
                                    (selectedPlan) =>
                                        selectedPlan.shortName?.trim() === plan.shortName?.trim() && selectedPlan.characteristics?.length,
                                ),
                            );
                        }

                        selectedPlans.forEach((selectedPlan) => {
                            const index = selectedPlanSeriesData.findIndex(
                                (selectedPlanSeries) => selectedPlanSeries.planId === selectedPlan.id,
                            );
                            const selectedPlanSeriesCoverageLevels = selectedPlanSeriesData[index]?.coverageLevelOptions?.map(
                                (coverageLevel) => coverageLevel.id,
                            );
                            const selectedPlanSeriesBenefitAmounts = selectedPlanSeriesData[index]?.benefitAmounts?.map(
                                (benefitAmount) => benefitAmount.amount,
                            );
                            this.disableBenefitAmountOptions = this.getDisabledBenefitAmounts(
                                benefitAmountOptions,
                                selectedPlanSeriesBenefitAmounts,
                            );
                            this.disableEliminationPeriods = this.getDisabledEliminationPeriods(
                                eliminationPeriods,
                                selectedPlanSeriesCoverageLevels,
                            );
                            // minimumBenefitAmountOptions has the valid applicable benefit amounts for selected plans of Std/TL/WL products
                            this.getBenefitAmountOptions(benefitAmountOptions, selectedPlanSeriesBenefitAmounts);
                        });
                        this.form.patchValue({
                            plans: selectedPlans,
                            coverageOptions: selections[0]?.coverageLevelIds?.length
                                ? selections[0]?.coverageLevelIds.map((id) => coverageLevelOptions.find((option) => option.id === id))
                                : [],
                            eliminationPeriods: selections[0]?.eliminationPeriods?.length
                                ? selections[0]?.eliminationPeriods.map((id) => eliminationPeriods.find((option) => option.id === id))
                                : [],
                            benefitAmounts: selections[0]?.benefitAmounts?.length
                                ? !isOtherProductSelected
                                    ? selections[0]?.benefitAmounts[0]
                                    : selections[0]?.benefitAmounts.map((benefitAmount) => benefitAmount)
                                : [],
                            planTypes: selections[0].planTypes?.length && selectedPlans.length ? selections[0].planTypes : [],
                        });
                        if (selections[0].eliminationPeriods?.length) {
                            const eliminationOptionsCount = eliminationPeriods.filter(
                                (eliminationOption, i) => !this.disableEliminationPeriods[i],
                            ).length;
                            this.updateSelectAllCheckbox(
                                "selectAllEliminationPeriods",
                                eliminationOptionsCount,
                                selections[0].eliminationPeriods.length,
                            );
                        }
                        if (isOtherProductSelected && selections[0].benefitAmounts?.length) {
                            const benefitAmountsCount = benefitAmountOptions.filter(
                                (benefitAmount, i) => !this.disableBenefitAmountOptions[i],
                            ).length;
                            this.updateSelectAllCheckbox(
                                "selectAllBenefitAmounts",
                                benefitAmountsCount,
                                selections[0].benefitAmounts.length,
                            );
                        }
                    },
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.revertChanges$.next();
        combineLatest([
            this.form.controls.plans.valueChanges,
            this.selectedPlanSeriesData$,
            this.coverageLevelOptions$,
            this.eliminationOptions$,
            this.benefitAmountOptions$,
            this.isStdProduct$,
            this.isWholeAndTermLifeProduct$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    selectedPlans,
                    selectedPlanSeriesData,
                    coverageLevelOptions,
                    eliminationPeriods,
                    benefitAmountOptions,
                    isStdProduct,
                    isWholeAndTermLifeProduct,
                ]) => {
                    this.invalidPlanSelections = {};
                    // refreshing disable options on change of coverage level/elimination period selections
                    this.disableCoverageLevelOptions = [];
                    this.disableEliminationPeriods = [];
                    this.disableBenefitAmountOptions = [];
                    this.minimumBenefitAmountOptions = [];
                    selectedPlans.forEach((selectedPlan) => {
                        const index = selectedPlanSeriesData.findIndex((planSeries) => planSeries.planId === selectedPlan.id);
                        const selectedPlanSeriesCoverageLevels = selectedPlanSeriesData[index]?.coverageLevelOptions?.map(
                            (coverageLevel) => coverageLevel.id,
                        );
                        const selectedPlanSeriesBenefitAmounts = selectedPlanSeriesData[index]?.benefitAmounts?.map(
                            (benefitAmount) => benefitAmount.amount,
                        );
                        if (coverageLevelOptions?.length) {
                            // identifies valid coverage levels for selected plans and disables the rest coverage levels
                            this.disableCoverageLevelOptions = coverageLevelOptions?.map((coverageLevelOption, i) => {
                                if (!(this.disableCoverageLevelOptions?.length > 0) || this.disableCoverageLevelOptions[i] === true) {
                                    return !selectedPlanSeriesCoverageLevels?.includes(coverageLevelOption.id);
                                }
                                return false;
                            });
                            // pre-populating form with valid coverage levels for selected plans
                            this.form.controls.coverageOptions.setValue(
                                coverageLevelOptions?.filter((coverageLevelOption, i) => !this.disableCoverageLevelOptions[i]),
                            );
                        }
                        if (eliminationPeriods?.length) {
                            // identifies valid elimination periods for selected plans and disables rest elimination periods
                            this.disableEliminationPeriods = this.getDisabledEliminationPeriods(
                                eliminationPeriods,
                                selectedPlanSeriesCoverageLevels,
                            );
                            // pre-populating form with valid elimination periods for selected plans
                            this.form.controls.eliminationPeriods.setValue(
                                eliminationPeriods?.filter((eliminationPeriod, i) => !this.disableEliminationPeriods[i]),
                            );
                        }
                        if (benefitAmountOptions?.length) {
                            // identifies valid benefit amounts for selected plans and disables the rest benefit amounts for other products
                            this.disableBenefitAmountOptions = this.getDisabledBenefitAmounts(
                                benefitAmountOptions,
                                selectedPlanSeriesBenefitAmounts,
                            );
                            // minimumBenefitAmountOptions has the valid applicable benefit amounts for selected plans of Std/TL/WL products
                            this.getBenefitAmountOptions(benefitAmountOptions, selectedPlanSeriesBenefitAmounts);
                            if (!isWholeAndTermLifeProduct) {
                                this.riderOptionsBenefitAmounts$ = this.riderOptions$;
                            }
                            if (isStdProduct) {
                                this.form.addControl("benefitAmounts", new FormControl({ minBenefitAmount: {}, maxBenefitAmount: {} }));
                                this.form.controls.benefitAmounts.setValue({ minBenefitAmount: {}, maxBenefitAmount: {} });
                            } else {
                                this.form.addControl("benefitAmounts", new FormControl([]));
                                this.form.controls.benefitAmounts.setValue([]);
                            }
                        }
                    });
                },
            );

        // When all plan selections are removed, remove plan series from selections
        this.form.controls.plans.valueChanges
            .pipe(
                filter((plans) => !plans?.length),
                withLatestFrom(this.selectedPlanSeries$),
                tap(([, { planSeries }]) => {
                    const selectedPlanSeriesCat = planSeries.categories as unknown;
                    const category = this.planSeries.categories as unknown;
                    if (selectedPlanSeriesCat !== category) {
                        return;
                    }
                    this.ngrxStore.dispatch(
                        RateSheetsActions.removeRateSheetPlanSeriesSelections({
                            productId: this.product.id,
                            planSeriesId: this.planSeries.id,
                            planSeriesCategory: selectedPlanSeriesCat as string,
                        }),
                    );
                    this.form.controls.planTypes.setValue([]);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.form.controls.selectAllEliminationPeriods.valueChanges
            .pipe(
                withLatestFrom(this.eliminationOptions$),
                tap(([value, eliminationOptions]) => {
                    this.requiredEliminationPeriodSelections = [];
                    this.form.controls.eliminationPeriods.setValue(
                        value ? eliminationOptions.filter((eliminationOption, i) => !this.disableEliminationPeriods[i]) : [],
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.form.controls.selectAllBenefitAmounts.valueChanges
            .pipe(
                withLatestFrom(this.benefitAmountOptions$),
                tap(([value, benefitAmountsData]) =>
                    this.form.controls.benefitAmounts.setValue(
                        value ? benefitAmountsData.filter((benefitAmount, i) => !this.disableBenefitAmountOptions[i]) : [],
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.form.controls.benefitAmounts?.valueChanges
            .pipe(
                withLatestFrom(
                    this.benefitAmountOptions$,
                    this.isWholeAndTermLifeProduct$,
                    this.planSeriesSettings$,
                    this.rateSheetSettings$,
                ),
                tap(([value, benefitAmountsData, isWholeAndTermLifeProduct, planSeriesSettings, rateSheetSettings]) => {
                    const benefitAmountsCount = benefitAmountsData.filter(
                        (benefitAmount, i) => !this.disableBenefitAmountOptions[i],
                    ).length;
                    if (this.form.controls.benefitAmounts.value?.length > 0) {
                        this.updateSelectAllCheckbox("selectAllBenefitAmounts", benefitAmountsCount, value?.length);
                    }
                    if (isWholeAndTermLifeProduct && this.form.controls.benefitAmounts?.value?.amount) {
                        this.ngrxStore.dispatch(
                            RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmounts({
                                planSeriesId: planSeriesSettings?.planSeriesId,
                                state: rateSheetSettings.state,
                                partnerAccountType: rateSheetSettings.partnerAccountType,
                                payrollFrequencyId: rateSheetSettings.payrollFrequencyId,
                                riskClassId: rateSheetSettings.riskClassId,
                                minAge: planSeriesSettings?.settings?.ageBands?.[0].minAge,
                                maxAge: planSeriesSettings?.settings?.ageBands?.[0].maxAge,
                                baseBenefitAmount: this.form.controls.benefitAmounts?.value.amount,
                            }),
                        );
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.form.controls.eliminationPeriods.valueChanges
            .pipe(
                withLatestFrom(this.eliminationOptions$),
                tap(([value, eliminationOptions]) => {
                    this.requiredEliminationPeriodSelections = [];
                    const eliminationOptionsCount = eliminationOptions.filter(
                        (eliminationOption, i) => !this.disableEliminationPeriods[i],
                    ).length;
                    this.updateSelectAllCheckbox("selectAllEliminationPeriods", eliminationOptionsCount, value?.length);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        combineLatest([this.planSeriesOptionBenefitAmounts$, this.form.controls.plans.valueChanges, this.isWholeAndTermLifeProduct$])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([planSeriesOptionBenefitAmounts, selectedPlans, isWholeAndTermLifeProduct]) => {
                if (isWholeAndTermLifeProduct) {
                    selectedPlans.forEach((selectedPlan) => {
                        this.getBenefitAmountsForSelectedAges(selectedPlan.id, planSeriesOptionBenefitAmounts);
                    });
                }
            });

        // When coverage level value change updating values in rate-sheets component store.
        this.form.controls.coverageOptions.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((coverageOptions) =>
            this.rateSheetsComponentStoreService.upsertCoverageLevelState({
                coverageLevels: coverageOptions,
                panelIdentifiers: { planSeriesId: this.planSeries.id },
            }),
        );

        this.getValidPlans();
        this.getPreviouslySelectedRiders();
    }

    /**
     * Gets benefit amounts for selected ages
     * @param selectedPlanId id of the selected plan
     * @param planSeriesOptionBenefitAmounts benefits amounts valid for selected age range
     */
    getBenefitAmountsForSelectedAges(
        selectedPlanId: number,
        planSeriesOptionBenefitAmounts: RateSheetPlanSeriesOptionBenefitAmounts[],
    ): void {
        const index = planSeriesOptionBenefitAmounts.findIndex(
            (planSeriesOptionBenefitAmount) => selectedPlanId === planSeriesOptionBenefitAmount.planId,
        );
        if (index !== -1) {
            if (this.minimumBenefitAmountOptions.length) {
                this.minimumBenefitAmountOptions = planSeriesOptionBenefitAmounts[index].benefitAmounts;
            }
            this.riderOptionsBenefitAmounts$ = combineLatest([this.riderOptions$, this.planSeriesOptionBenefitAmounts$]).pipe(
                map(([planSeriesRiderOptions, planSeriesBenefitAmounts]) => {
                    const riderOptions = this.utilService.copy(planSeriesRiderOptions);
                    planSeriesBenefitAmounts[index].riders.forEach((rider) => {
                        const riderIndex = riderOptions.findIndex((riderOption) => riderOption.planId === rider.planId);
                        if (riderIndex !== -1 && rider.benefitAmounts) {
                            riderOptions[riderIndex].benefitAmounts = rider.benefitAmounts;
                        }
                    });
                    return riderOptions;
                }),
            );
        }
    }

    /**
     * Gets rate sheet plan series option benefit amounts based on age range selected
     */
    getRateSheetPlanSeriesOptionBenefitAmounts(): void {
        combineLatest([this.planSeriesSettings$, this.isWholeAndTermLifeProduct$, this.rateSheetSettings$])
            .pipe(
                filter(([planSeriesSettings]) => !!planSeriesSettings.settings.ageBands),
                tap(([planSeriesSettings, isWholeAndTermLifeProduct, rateSheetSettings]) => {
                    if (isWholeAndTermLifeProduct) {
                        // dispatchIfIdle avoids multiple duplicate api calls
                        this.ngrxStore.dispatchIfIdle(
                            RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmounts({
                                planSeriesId: planSeriesSettings.planSeriesId,
                                state: rateSheetSettings.state,
                                partnerAccountType: rateSheetSettings.partnerAccountType,
                                payrollFrequencyId: rateSheetSettings.payrollFrequencyId,
                                riskClassId: rateSheetSettings.riskClassId,
                                minAge: planSeriesSettings.settings.ageBands?.[0].minAge,
                                maxAge: planSeriesSettings.settings.ageBands?.[0].maxAge,
                            }),
                            RateSheetsSelectors.getRateSheetPlanSeriesOptionBenefitAmounts(
                                planSeriesSettings?.planSeriesId,
                                rateSheetSettings.state,
                                rateSheetSettings.partnerAccountType,
                                rateSheetSettings.payrollFrequencyId,
                                rateSheetSettings.riskClassId,
                                planSeriesSettings?.settings?.ageBands?.[0].minAge,
                                planSeriesSettings?.settings?.ageBands?.[0].maxAge,
                            ),
                        );
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Gets benefit amount options for std/TL/WL products
     * @param benefitAmountOptions
     * @param selectedPlanSeriesBenefitAmounts
     */
    getBenefitAmountOptions(benefitAmountOptions: RateSheetBenefitAmount[], selectedPlanSeriesBenefitAmounts: number[]): void {
        benefitAmountOptions.forEach((benefitAmount) => {
            if (
                selectedPlanSeriesBenefitAmounts?.includes(benefitAmount.amount) &&
                (!this.minimumBenefitAmountOptions.length ||
                    (this.minimumBenefitAmountOptions.length &&
                        !this.minimumBenefitAmountOptions.some((minBenefitAmount) => minBenefitAmount.amount === benefitAmount.amount)))
            ) {
                this.minimumBenefitAmountOptions.push(benefitAmount);
            }
        });
    }

    /**
     * Updates select all checkbox state
     * @param formControlName
     * @param optionsCount benefit amounts or elimination periods options count
     * @param selectedOptionsCount selected benefit amounts or elimination periods options count
     */
    updateSelectAllCheckbox(formControlName: string, optionsCount: number, selectedOptionsCount: number): void {
        this.form?.get(formControlName)?.setValue(selectedOptionsCount === optionsCount ? true : false, {
            emitEvent: false,
        });
        // Set indeterminate for select all checkbox
        this.isIndeterminate = selectedOptionsCount >= 1 && selectedOptionsCount !== optionsCount;
    }

    /**
     * Gets disabled benefit amounts based on plan/benefit period selection
     * @param benefitAmountOptions
     * @param selectedPlanSeriesBenefitAmounts
     * @returns disabled benefit amounts
     */
    getDisabledBenefitAmounts(benefitAmountOptions: RateSheetBenefitAmount[], selectedPlanSeriesBenefitAmounts: number[]): boolean[] {
        return benefitAmountOptions.map((benefitAmountOption, i) => {
            if (!(this.disableBenefitAmountOptions?.length > 0) || this.disableBenefitAmountOptions[i] === true) {
                return !selectedPlanSeriesBenefitAmounts?.includes(benefitAmountOption.amount);
            }
            return false;
        });
    }

    /**
     * Gets disabled elimination periods based on benefit period selection
     * @param eliminationPeriods
     * @param selectedPlanSeriesCoverageLevels
     * @returns disabled benefit amounts
     */
    getDisabledEliminationPeriods(
        eliminationPeriods: RateSheetCoverageLevelOption[],
        selectedPlanSeriesCoverageLevels: number[],
    ): boolean[] {
        return eliminationPeriods.map((eliminationPeriod, i) => {
            if (!(this.disableEliminationPeriods?.length > 0) || this.disableEliminationPeriods[i] === true) {
                return !selectedPlanSeriesCoverageLevels.includes(eliminationPeriod.id);
            }
            return false;
        });
    }

    /**
     * Gets valid plans based on settings
     */
    getValidPlans(): void {
        combineLatest([this.planSeriesSettings$, this.selectedPlanSeriesData$, this.rateSheetSettings$])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([planSeriesSettings, selectedPlanSeriesOptionData, rateSheetSettings]) => {
                const minAges = planSeriesSettings.settings.ageBands?.map((ageBand) => ageBand.minAge);
                const eligibleSubscribers = rateSheetSettings.eligibleSubscribers;

                // Disable plans based on Eligible Employees
                if (eligibleSubscribers) {
                    this.planSeries.plans.forEach((plan) => {
                        this.disablePlans[plan.id] =
                            // Disable if the eligible employee input is not within the plan min/max
                            !(
                                eligibleSubscribers >= plan.planDetails?.minEligibleSubscribers &&
                                eligibleSubscribers <= plan.planDetails?.maxEligibleSubscribers
                            );

                        if (this.disablePlans[plan.id] && this.form.controls.plans.value?.length) {
                            this.isToolTipAge = false;
                            const selectedPlans = this.form.controls.plans.value;
                            this.form.controls.plans.setValue(selectedPlans.filter((selectedPlan) => selectedPlan.id !== plan.id));
                        }
                    });
                }

                selectedPlanSeriesOptionData.forEach((optionData) => {
                    // Disable plans based on Age Bands
                    if (minAges) {
                        this.disablePlans[optionData.planId] =
                            this.getMaxAge(optionData.ageBands) < minAges.reduce((a, b) => Math.max(a, b));
                    }

                    if (this.disablePlans[optionData.planId] && this.form.controls.plans.value?.length) {
                        this.isToolTipAge = true;
                        const selectedPlans = this.form.controls.plans.value;
                        this.form.controls.plans.setValue(selectedPlans.filter((selectedPlan) => selectedPlan.id !== optionData.planId));
                    }
                });
            });
    }

    /**
     * Gets max age
     * @param ageBands object with minAge and maxAge
     * @returns maximum age among all maxAge
     */
    getMaxAge(ageBands: AgeBand[]): number {
        const maxAge: number[] = ageBands.map((ageBand) => ageBand.maxAge);
        return maxAge.reduce((a, b) => Math.max(a, b));
    }

    /**
     * Initializes form
     */
    initializeForm(): void {
        this.form = this.formBuilder.group({
            plans: [],
            coverageOptions: [],
            eliminationPeriods: [],
            selectAllEliminationPeriods: [],
            selectAllBenefitAmounts: [],
            planTypes: [],
        });
        this.isStdProduct$.pipe(takeUntil(this.unsubscribe$)).subscribe((isStdProduct) => {
            if (isStdProduct) {
                this.form.addControl("benefitAmounts", new FormControl({ minBenefitAmount: {}, maxBenefitAmount: {} }));
            } else {
                this.form.addControl("benefitAmounts", new FormControl([]));
            }
        });
    }

    /**
     * Gets unique coverage level options of all the plans' coverage options
     */
    getCoverageLevelOptions(): void {
        this.coverageLevelOptions$ = this.planSeriesAccordionData$.pipe(
            switchMap(([{ planSeries }]) =>
                this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getCoverageOptions(this.product.id, planSeries.id))),
            ),
        );
    }

    /**
     * Gets unique elimination periods of all the plans' coverage options
     */
    getEliminationPeriods(): void {
        this.eliminationOptions$ = this.planSeriesAccordionData$.pipe(
            switchMap(([{ planSeries }]) =>
                this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getEliminationOptions(this.product.id, planSeries.id))),
            ),
        );
    }

    /**
     * Gets unique Benefit Amounts of all the plans
     */
    getBenefitAmounts(): void {
        this.benefitAmountOptions$ = this.planSeriesAccordionData$.pipe(
            switchMap(([{ planSeries }]) =>
                this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getBenefitAmountOptions(this.product.id, planSeries.id))),
            ),
        );
    }

    /**
     * Store selections in state if valid
     */
    addToRateSheet(): void {
        let coverageLevels;
        this.coverageLevelOptions$.pipe(takeUntil(this.unsubscribe$)).subscribe((coverageOptions) => {
            coverageLevels = coverageOptions;
            // if only one coverageOption available, then directly populating it into form instead of making user to choose
            if (coverageOptions?.length === 1) {
                this.form.controls.coverageOptions.setValue(coverageOptions);
            }
        });
        let eliminationOptions;
        this.eliminationOptions$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((eliminationPeriods) => (eliminationOptions = eliminationPeriods));
        let benefitAmounts;
        this.benefitAmountOptions$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((benefitAmountOption) => (benefitAmounts = benefitAmountOption));
        if (coverageLevels?.length > 0 && this.form.value.coverageOptions?.length === 0) {
            this.form.controls.coverageOptions.setErrors({ required: true });
        }
        if (eliminationOptions?.length > 0 && this.form.value.eliminationPeriods?.length === 0) {
            this.form.controls.eliminationPeriods.setErrors({ required: true });
            this.form.controls.selectAllEliminationPeriods.setErrors({ required: true });
            (this.form.controls.eliminationPeriods.statusChanges as EventEmitter<string>).emit("TOUCHED");
        }
        // Benefit amount - non STD
        if (
            benefitAmounts?.length > 0 &&
            (this.form.value.benefitAmounts?.length === 0 || this.form.value.benefitAmounts?.benefitAmountSelected?.length === 0)
        ) {
            this.form.controls.benefitAmounts.setErrors({ required: true });
            this.isWholeAndTermLifeProduct$
                .pipe(
                    tap((isWholeAndTermLifeProduct) => {
                        if (!isWholeAndTermLifeProduct) {
                            // not WL/TL -> set errors for Select All checkbox
                            this.form.controls.selectAllBenefitAmounts.setErrors({ required: true });
                        }
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
            (this.form.controls.benefitAmounts.statusChanges as EventEmitter<string>).emit("TOUCHED");
        }
        // Benefit amount - STD
        this.isStdProduct$.pipe(takeUntil(this.unsubscribe$)).subscribe((isStdProduct) => {
            if (benefitAmounts?.length > 0 && isStdProduct && !this.form.value.benefitAmounts?.minBenefitAmount) {
                this.form.controls.benefitAmounts.setErrors({ required: true });
                (this.form.controls.benefitAmounts.statusChanges as EventEmitter<string>).emit("TOUCHED");
            }
        });
        let selectedPlanIsADV: boolean;
        this.isCarrierOfADV$.pipe(takeUntil(this.unsubscribe$)).subscribe((isCarrierOfADV) => {
            selectedPlanIsADV = isCarrierOfADV;
            if (isCarrierOfADV && (this.form.value.planTypes === null || this.form.value.planTypes?.length === 0)) {
                this.form.controls.planTypes?.setErrors({ required: true });
                (this.form.controls.planTypes?.statusChanges as EventEmitter<string>).emit("TOUCHED");
            }
        });
        this.setInvalidSelectionsError();
        this.form.markAllAsTouched();
        if (this.form.invalid || this.isInvalidEliminationPeriodSelection || this.isInvalidBenefitAmountSelection) {
            return;
        }
        const selectedPlans = selectedPlanIsADV ? this.setPlanForADV(this.form.value.plans) : this.form.value.plans;
        const planSelections: PlanSelections[] = selectedPlans.map((plan) => ({
            planId: plan.id,
            coverageLevelIds: this.form.value.coverageOptions
                ? this.form.value.coverageOptions.map((coverageOption) => coverageOption.id)
                : undefined,
            eliminationPeriods: this.form.value.eliminationPeriods
                ? this.form.value.eliminationPeriods.map((period) => period.id)
                : undefined,
            benefitAmounts: this.form.value.benefitAmounts
                ? this.form.value.benefitAmounts?.length
                    ? this.form.value.benefitAmounts
                    : [this.form.value.benefitAmounts]
                : undefined,
            riderSelections: this.riderChoices?.length ? this.riderChoices : undefined,
            planTypes: this.form.value.planTypes ? this.form.value.planTypes : undefined,
            planSeriesCategory: plan.planSeriesCategory ? plan.planSeriesCategory : undefined,
        }));
        this.ngrxStore.dispatch(
            RateSheetsActions.setRateSheetPlanSeriesSelections({
                productId: this.product.id,
                planSeriesId: this.planSeries.id,
                planSelections,
                planSeriesCategory: planSelections.find((plan) => plan.planSeriesCategory)
                    ? planSelections.find((plan) => plan.planSeriesCategory)?.planSeriesCategory
                    : undefined,
            }),
        );
        this.saved.emit();
        this.resetForm();
    }

    /**
     * base on planTypes selection, add/remove ADV plans to list.
     * @param plans List of selected plans (form value)
     * @returns Updated list of selected plans.
     */
    setPlanForADV(listOfPlan: Plan[]): Plan[] {
        let selectedPlans: Plan[] = [];
        if (this.form.value.planTypes) {
            this.planSeries.plans.forEach((plan) => {
                const checkPlanShortName = listOfPlan.some((selectedPlan) => plan?.shortName?.trim() === selectedPlan?.shortName?.trim());
                if (checkPlanShortName) {
                    selectedPlans = [...selectedPlans, plan];
                }
            });
            if (this.form.value.planTypes?.length === 1) {
                selectedPlans = selectedPlans.filter((pl) =>
                    this.form.value.planTypes.includes(ADVPlanType.EMPLOYER_PAID)
                        ? pl.characteristics?.length > 0
                        : pl.characteristics?.length === 0,
                );
            }
        }
        return selectedPlans;
    }

    /**
     * Remove same short name plans from the list.
     * @param planSeries selected planSeries
     * @returns Plan[] - List of distinct plan.
     */
    removeDuplicatePlans(planSeries: PlanSeries): Plan[] {
        return planSeries?.plans?.filter(
            (plan, i, copyOfPlans) => copyOfPlans.findIndex((pln) => plan.shortName.trim() === pln.shortName.trim()) === i,
        );
    }

    /**
     * Sets error on selecting plans/benefit periods and benefit amounts/elimination periods that are incompatible
     */
    setInvalidSelectionsError(): void {
        combineLatest([
            this.selectedPlanSeriesData$,
            this.eliminationOptions$,
            this.benefitAmountOptions$,
            this.isOtherProductSelected$,
            this.isStdProduct$,
            this.isWholeAndTermLifeProduct$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    selectedPlanSeriesData,
                    eliminationPeriods,
                    benefitAmountOptions,
                    isOtherProductSelected,
                    isStdProduct,
                    isWholeAndTermLifeProduct,
                ]) => {
                    this.requiredEliminationPeriodSelections = [];
                    this.requiredBenefitAmountSelections = [];
                    this.isInvalidBenefitAmountSelection = false;
                    this.isInvalidEliminationPeriodSelection = false;
                    this.form.get("plans").value.forEach((plan) => {
                        const index = selectedPlanSeriesData.findIndex((planSeries) => planSeries.planId === plan.id);
                        /**
                         * sets error on benefit periods,
                         * and on elimination periods that are applicable to selected benefit periods but not checked
                         */
                        if (this.form.get("eliminationPeriods").value?.length > 0) {
                            const selectedPlanSeriesCoverageLevels = selectedPlanSeriesData[index].coverageLevelOptions.map(
                                (coverageLevel) => coverageLevel.id,
                            );
                            this.invalidPlanSelections[plan.id] = !this.form
                                .get("eliminationPeriods")
                                .value.some((eliminationPeriod) => selectedPlanSeriesCoverageLevels.includes(eliminationPeriod.id));
                            if (this.invalidPlanSelections[plan.id]) {
                                this.requiredEliminationPeriodSelections = eliminationPeriods.map((eliminationPeriod, i) => {
                                    if (
                                        !(this.requiredEliminationPeriodSelections?.length > 0) ||
                                        this.requiredEliminationPeriodSelections[i] === true
                                    ) {
                                        return selectedPlanSeriesCoverageLevels.includes(eliminationPeriod.id);
                                    }
                                    return false;
                                });
                                this.isInvalidEliminationPeriodSelection = this.requiredEliminationPeriodSelections.includes(true);
                            }
                        }
                        /**
                         * sets error on plans/benefit periods,
                         * and on benefit amount(s) that are applicable to selected plans/benefit periods but not checked
                         */
                        if (this.form.get("benefitAmounts")?.value) {
                            const selectedPlanSeriesBenefitAmounts = selectedPlanSeriesData[index]?.benefitAmounts?.map(
                                (benefitAmount) => benefitAmount.amount,
                            );
                            if (isOtherProductSelected && this.form.get("benefitAmounts").value?.length) {
                                this.invalidPlanSelections[plan.id] = !this.form
                                    .get("benefitAmounts")
                                    .value.some((benefitAmount) => selectedPlanSeriesBenefitAmounts?.includes(benefitAmount.amount));
                                if (this.invalidPlanSelections[plan.id]) {
                                    this.requiredBenefitAmountSelections = benefitAmountOptions.map((benefitAmountOption, i) => {
                                        if (
                                            !(this.requiredBenefitAmountSelections?.length > 0) ||
                                            this.requiredBenefitAmountSelections[i] === true
                                        ) {
                                            return selectedPlanSeriesBenefitAmounts?.includes(benefitAmountOption.amount);
                                        }
                                        return false;
                                    });
                                    this.isInvalidBenefitAmountSelection = this.requiredBenefitAmountSelections.includes(true);
                                }
                            } else if (isStdProduct) {
                                if (
                                    this.invalidPlanSelections[plan.id] &&
                                    this.form.controls.benefitAmounts.value.minBenefitAmount.amount &&
                                    !selectedPlanSeriesBenefitAmounts?.includes(
                                        this.form.controls.benefitAmounts.value.minBenefitAmount.amount,
                                    )
                                ) {
                                    this.form.controls.benefitAmounts.setErrors({ invalid: true });
                                    this.isInvalidBenefitAmountSelection = true;
                                } else if (
                                    !this.invalidPlanSelections[plan.id] &&
                                    this.form.controls.benefitAmounts.value.minBenefitAmount.amount
                                ) {
                                    this.invalidPlanSelections[plan.id] = !selectedPlanSeriesBenefitAmounts?.includes(
                                        this.form.controls.benefitAmounts.value.minBenefitAmount.amount,
                                    );
                                    if (this.invalidPlanSelections[plan.id]) {
                                        this.form.controls.benefitAmounts.setErrors({ invalid: true });
                                        this.isInvalidBenefitAmountSelection = true;
                                    }
                                }
                            }
                        }
                    });
                },
            );
    }

    /**
     * Mark form as untouched and pristine
     */
    resetForm(): void {
        this.form.markAsUntouched();
        this.form.markAsPristine();
    }

    /**
     * Gets previously selected riders
     */
    getPreviouslySelectedRiders(): void {
        this.ngrxStore
            .onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSelections(this.product?.id, this.planSeries?.id)))
            .pipe(
                tap((planSelections) => {
                    this.previouslySelectedRiders = planSelections[0]?.riderSelections?.filter((rider) => rider.selected);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Executes when rider selections change.
     *
     * @param riderChoices selected riders and associated params
     */
    onRidersValueChange(riderChoices: RiderSelection[]): void {
        this.isRiderSelectionChange = this.checkRiderSelectionChange(riderChoices);
        if (this.isRiderSelectionChange) {
            this.form.controls.plans.markAsDirty();
        }
        this.riderChoices = riderChoices;
    }

    /**
     * check for rider selections change.
     * @param riderChoices selected riders and associated params
     * @returns Boolean
     */
    checkRiderSelectionChange(selectedRider: RiderSelection[]): boolean {
        // Get the selected rider plan Id
        const selectedRiderPlanIds = selectedRider?.filter((rider) => rider?.selected).map((r) => r?.planId);

        // This check is for when no rider selected for the first time and add plan to rate-sheet,
        // and later try to updated plan by selecting rider
        if (this.previouslySelectedRiders?.length === 0 && this.previouslySelectedRiders?.length < selectedRiderPlanIds?.length) {
            return true;
        }

        // This check is for when user try to add/remove rider
        if (this.previouslySelectedRiders?.length && this.previouslySelectedRiders?.length !== selectedRiderPlanIds?.length) {
            return true;
        }

        // Check if selectedRiderPlanIds includes any of the previouslySelectedRider's planId
        if (this.previouslySelectedRiders?.length) {
            return this.previouslySelectedRiders?.some(
                (previouslySelectedRider) => !selectedRiderPlanIds?.includes(previouslySelectedRider?.planId),
            );
        }
        return false;
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
