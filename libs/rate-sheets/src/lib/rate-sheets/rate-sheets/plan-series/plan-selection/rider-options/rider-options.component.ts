import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { AsyncStatus, Plan, ProductId, RateSheetPlanSeriesOption, RateSheetRider, RiderSelection } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { Observable, Subject, combineLatest } from "rxjs";
import { RateSheetsComponentStoreService } from "../../../rate-sheets-component-store/rate-sheets-component-store.service";
import { distinctUntilChanged, map, pairwise, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { RiderOptionsFormGroupControls, RiderOptionSelected } from "./rider-options.model";
import { LanguageService } from "@empowered/language";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";

@Component({
    selector: "empowered-rider-options",
    templateUrl: "./rider-options.component.html",
    styleUrls: ["./rider-options.component.scss"],
})
export class RiderOptionsComponent implements OnInit, OnDestroy {
    @Input() planValueChanges!: Observable<Plan[]>;
    @Input() options!: RateSheetRider[];
    @Input() planOptionsFilteredRiders!: RateSheetPlanSeriesOption[];
    @Output() ridersValueChange: EventEmitter<RiderSelection[]> = new EventEmitter<RiderSelection[]>();

    ridersForm: FormGroup = this.formBuilder.group({});
    riderOptionSelected = RiderOptionSelected;

    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct));
    selectedProductAndPlanSeries$ = this.selectedPlanSeries$.pipe(
        withLatestFrom(this.selectedProduct$),
        map(([planSeries, product]) => ({ planSeriesId: planSeries.planSeries?.id, productId: product.product?.id })),
    );
    enableRiders$: Observable<{ [key: string]: string }>;
    riderDisabledTooltip$ = this.selectedProduct$.pipe(
        map((product) =>
            this.language
                .fetchPrimaryLanguageValue("primary.portal.rateSheets.disabled.checkbox.message")
                .replace(
                    "##selection##",
                    this.language.fetchPrimaryLanguageValue(
                        `primary.portal.rateSheets.${product.product.id === ProductId.SHORT_TERM_DISABILITY ? "benefitPeriods" : "plans"}`,
                    ),
                ),
        ),
    );
    selectedRiders: RiderSelection[] = [];
    riderMap: { [key: string]: string } = {};
    selectedPlansWithRiders = [];
    protected unsubscribe$ = new Subject<void>();
    disableCombined = true;
    disableCustom = true;
    showRiderCoverageLevels = false;
    spouseRiderIDs = [];
    spouse10YearPlanId = 1308;
    selectedPlanSeriesId: number;
    ridersFiltered = false;

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
    ) {}

    ngOnInit(): void {
        let selectedProductId: number;
        this.selectedProductAndPlanSeries$
            .pipe(
                tap((selection) => {
                    this.selectedPlanSeriesId = selection.planSeriesId;
                    selectedProductId = selection.productId;
                }),
                switchMap((selected) =>
                    this.ngrxStore.onAsyncValue(
                        select(RateSheetsSelectors.getRateSheetPlanSelections(selected.productId, selected.planSeriesId)),
                    ),
                ),
                tap((planSelections) => {
                    this.selectedRiders = planSelections[0].riderSelections?.filter((rider) => rider.selected);
                    const selectedPlans = this.planOptionsFilteredRiders.filter((planFilteredData) =>
                        planSelections.some((planData) => planData.planId === planFilteredData.planId),
                    );
                    this.filterRidersForTermLife(selectedPlans, selectedProductId);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        if (this.options || this.selectedRiders) {
            this.ridersForm = this.initRidersFormArray(this.options, this.selectedRiders);
        }
        combineLatest([this.planValueChanges, this.selectedProduct$])
            .pipe(
                tap(([plan, product]) => {
                    if (plan.length === 0) {
                        this.ridersForm.reset();
                    }
                    this.selectedPlansWithRiders = [];
                    const selectedPlansData = this.planOptionsFilteredRiders.filter((planFilteredData) =>
                        plan.some((planData) => planData.id === planFilteredData.planId),
                    );
                    selectedPlansData.forEach((data) => {
                        const planObject = { id: data.planId, riders: data.riders };
                        this.selectedPlansWithRiders = [...this.selectedPlansWithRiders, JSON.parse(JSON.stringify(planObject))];
                    });
                    if (!this.ridersFiltered) {
                        this.filterRidersForTermLife(selectedPlansData, product.product.id);
                    }
                    let coverageLevelOptions;
                    this.selectedPlansWithRiders.forEach((data) => {
                        data.riders.forEach((riderData) => {
                            coverageLevelOptions = [];
                            Object.keys(riderData.coverageLevelOptionsMap)?.forEach((key) => {
                                coverageLevelOptions = [...coverageLevelOptions, ...riderData.coverageLevelOptionsMap[key]];
                            });
                            riderData.coverageLevelOptions = coverageLevelOptions;
                        });
                    });
                    const spouseRider = this.ridersForm.controls?.riders?.value.filter((rider) =>
                        this.spouseRiderIDs.some((id) => id === rider.planId),
                    );

                    if (plan?.length === 1 && spouseRider[0]?.selected && this.checkSelectedPlanHasSingleCoverageOption()) {
                        this.disableCombined = false;
                        this.disableCustom = true;
                        this.showRiderCoverageLevels = false;
                    } else if (plan?.length > 1 && spouseRider[0]?.selected) {
                        this.disableCombined = false;
                        this.disableCustom = false;
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.ngrxStore
            .onAsyncValue(select(SharedSelectors.getTLWLSpouseRiderIds))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.spouseRiderIDs = value;
            });

        const formArray = this.ridersForm?.controls?.riders as FormArray;
        if (this.options) {
            formArray?.controls.forEach((riderFormGroup: FormGroup, index) =>
                this.disableAndResetRiderControls(riderFormGroup.controls, index),
            );
        }
        formArray?.valueChanges
            .pipe(
                startWith(formArray.value),
                distinctUntilChanged((prev, curr) =>
                    this.stringArraysEqual(
                        prev?.map(({ selected }) => selected),
                        curr?.map(({ selected }) => selected),
                    ),
                ),
                pairwise(),
                tap(([prev, curr]: RiderOptionsFormGroupControls[][]) => {
                    const index = prev.findIndex((p, i) => p.selected !== curr[i].selected);
                    this.onRiderSelectionChange(formArray.controls[index] as FormGroup, index);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.enableRiders$ = combineLatest([this.planValueChanges, this.selectedProductAndPlanSeries$]).pipe(
            switchMap(([plans, { planSeriesId, productId }]) =>
                combineLatest([
                    this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(productId, planSeriesId))),
                    this.rateSheetsComponentStoreService.getCoverageLevelState({ planSeriesId }),
                ]).pipe(
                    // Output is { [riderName]: false, [riderName2]: false }
                    // false implies the rider is available with the selected plan/s
                    map(([options, state]) => {
                        const enabledRiders = options
                            .filter((option) => plans.some((plan) => plan.id === option.planId))
                            .reduce((a, c) => ({ ...a, ...c.riders.reduce((ar, cr) => ({ ...ar, [cr.planName]: false }), {}) }), {});
                        // Enable/disable riders based on base plan coverage level selection
                        state?.coverageLevels?.forEach((coverageOption) => {
                            options[0].riders.forEach((rider) => {
                                if (!rider.coverageLevelOptionsMap[coverageOption.id].length) {
                                    // Check if valid coverage level selected for the certain riders to enable/disable
                                    const validCoverageSelected = state?.coverageLevels?.some((parentCoverageLevel) => {
                                        const validCoverageLevelId = Object.keys(rider.coverageLevelOptionsMap).filter(
                                            (key) => rider.coverageLevelOptionsMap[key].length,
                                        );
                                        return validCoverageLevelId.some((ids) => ids.includes(parentCoverageLevel.id.toString()));
                                    });
                                    // if valid coverage level is not selected for the certain riders then disable that rider
                                    if (!validCoverageSelected) {
                                        delete enabledRiders[rider.planName];
                                    }
                                }
                            });
                        });
                        return enabledRiders;
                    }),
                    tap((ridersMap) => {
                        if (Object.keys(ridersMap).length) {
                            this.rateSheetsComponentStoreService.upsertRidersState({
                                riderOptions: { riderOptions: ridersMap },
                                panelIdentifiers: { planSeriesId: this.selectedPlanSeriesId },
                            });
                        }
                        formArray.controls.forEach((riderFormGroup: FormGroup, index) => {
                            // If a rider checkbox is disabled, deselect it and the params under it.
                            if (!ridersMap[riderFormGroup.controls.planName.value]) {
                                this.disableAndResetRiderControls(riderFormGroup.controls, index, riderFormGroup.value.enableRiders);
                            }
                        });
                    }),
                ),
            ),
            startWith(this.selectedRiders.length > 0 ? this.selectedRiders?.find((rider) => rider.selected)?.enableRiders : this.riderMap),
            switchMap(() => this.rateSheetsComponentStoreService.getRidersState({ planSeriesId: this.selectedPlanSeriesId })),
            map((riderMap) => {
                this.riderMap = riderMap?.riderOptions.riderOptions;
                return this.riderMap;
            }),
        );

        this.ridersForm.valueChanges
            .pipe(withLatestFrom(this.rateSheetsComponentStoreService.getRidersState({ planSeriesId: this.selectedPlanSeriesId })))
            .subscribe(([riderForm, state]) => {
                const riderWithSelections: RiderSelection[] = this.getRiderWithEnableRiders(
                    riderForm?.riders,
                    state.riderOptions.riderOptions,
                );
                this.ridersValueChange.emit(riderWithSelections);
            });
    }

    /**
     * Only display riders for displayed plans from plan series for TL
     *
     * @param selectedPlans
     * @param productId
     */
    filterRidersForTermLife(selectedPlans: RateSheetPlanSeriesOption[], productId: number): void {
        let filteredRiders: RateSheetRider[] = [];
        if (productId === ProductId.TERM_LIFE) {
            selectedPlans.forEach((selectedPlan) => {
                this.options.forEach((option) => {
                    if (
                        !filteredRiders.some((filteredRider) => filteredRider.planName === option.planName) &&
                        selectedPlan.riders.some((rider) => option.planName === rider.planName)
                    ) {
                        filteredRiders = [...filteredRiders, option];
                    }
                });
            });
            this.options = [...filteredRiders];
        }
        this.ridersFiltered = true;
    }

    /**
     * get riders with enableRiders property
     *
     * @param riders selected riders from ridersForm.
     * @param enableRiders enabled riders for selected plans
     * @returns selected rider with available rider property
     */
    getRiderWithEnableRiders(riders: RiderSelection[], enableRiders: { [key: string]: string }): RiderSelection[] {
        return riders?.map((rider) => {
            if (rider?.selected === true) {
                rider.enableRiders = enableRiders;
                const cloneRider = { ...rider };
                return { ...cloneRider, enableRiders: enableRiders };
            }
            return rider;
        });
    }

    /**
     * Initializes the riders form array.
     *
     * @param riderOptions riders available under a plan series.
     * @param selectedRiders previously selected riders
     * @returns form group
     */
    initRidersFormArray(riderOptions: RateSheetRider[], selectedRiders: RiderSelection[]): FormGroup {
        return this.formBuilder.group({
            riders: this.formBuilder.array(
                riderOptions?.map((option) => {
                    let riderBenefitAmount = option.benefitAmounts?.length === 1 ? option.benefitAmounts[0].amount : undefined;
                    let riderCoverageLevel = option.coverageLevelOptions?.length === 1 ? option.coverageLevelOptions[0].id : undefined;

                    selectedRiders?.forEach((rider) => {
                        if (rider.planId === option.planId) {
                            riderBenefitAmount = rider.benefitAmount;
                        }
                    });
                    this.selectedPlansWithRiders?.forEach((rider) => {
                        if (rider.planId === option.planId) {
                            riderCoverageLevel = rider.coverageLevelId;
                        }
                    });
                    return this.formBuilder.group({
                        benefitAmount: [
                            {
                                value: riderBenefitAmount,
                                disabled: !selectedRiders?.some((rider) => rider.planId === option.planId),
                            },
                        ],
                        coverageLevel: [
                            {
                                value: riderCoverageLevel,
                                disabled: !selectedRiders?.some((rider) => rider.planId === option.planId),
                            },
                        ],
                        coverageLevelOption: [
                            {
                                value: this.riderOptionSelected.COMBINED,
                                disabled: true,
                            },
                        ],
                        spouseCoverageLevel: this.formBuilder.array([]),
                        selected: [selectedRiders.length > 0 ? selectedRiders?.some((rider) => rider.planId === option.planId) : false],
                        planName: [option.planName],
                        spouseTobaccoStatus: [selectedRiders?.find((rider) => rider.planId === option?.planId)?.spouseTobaccoStatus],
                        spouseGender: [selectedRiders?.find((rider) => rider.planId === option?.planId)?.spouseGender],
                        planId: [option.planId],
                        enableRiders: {},
                    });
                }),
            ),
        });
    }

    /**
     * Returns true if the input string arrays are 'equal'.
     *
     * @param a first array
     * @param b second array
     * @returns true if the input string arrays have the same length and same strings at a given index
     */
    stringArraysEqual(a: string[], b: string[]): boolean {
        return a.length === b.length && a.every((aValue, i) => aValue === b[i]);
    }

    /**
     * Executes when one of the rider checkboxes is selected / deselected.
     *
     * @param group form group for rider params
     * @param index index into the riders array
     */
    onRiderSelectionChange(group: FormGroup, index: number): void {
        if (group.value.selected) {
            this.setRiderControls(group.controls, index);
        } else {
            this.disableAndResetRiderControls(group.controls, index);
        }
    }

    /**
     * Enables rider params.
     *
     * @param riderFormGroupControls form controls for rider params
     * @param i index into the riders array
     */
    setRiderControls(riderFormGroupControls: { [key: string]: AbstractControl }, i: number): void {
        riderFormGroupControls.benefitAmount.enable();
        riderFormGroupControls.benefitAmount.setValue(this.options[i]?.benefitAmounts?.[0].amount);
        riderFormGroupControls.coverageLevel.enable();
        riderFormGroupControls.spouseTobaccoStatus.enable();
        riderFormGroupControls.spouseGender.enable();
        riderFormGroupControls.coverageLevelOption.enable();
        if (this.selectedPlansWithRiders?.length > 1) {
            this.disableCustom = false;
            this.disableCombined = false;
        } else {
            this.disableCustom = true;
            this.disableCombined = false;
        }
        if (this.selectedPlansWithRiders?.length === 1 && this.checkSelectedPlanHasSingleCoverageOption()) {
            this.disableCustom = true;
            this.disableCombined = false;
            riderFormGroupControls.coverageLevelOption.setValue(this.riderOptionSelected.COMBINED);
        } else if (this.selectedPlansWithRiders?.length >= 1) {
            this.disableCustom = false;
            this.disableCombined = false;
            riderFormGroupControls.coverageLevelOption.setValue(this.riderOptionSelected.COMBINED);
        }
        riderFormGroupControls.coverageLevelOption.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            if (value === this.riderOptionSelected.CUSTOM) {
                this.addCoverageLevelOptionsToSpouseControl(riderFormGroupControls);
                this.showRiderCoverageLevels = true;
            } else {
                this.showRiderCoverageLevels = false;
            }
        });
    }

    /**
     * Add CoverageLevelOptions To SpouseControl.
     * @param riderFormGroupControls form controls for rider params
     */
    addCoverageLevelOptionsToSpouseControl(riderFormGroupControls: { [key: string]: AbstractControl }): void {
        const spouseControl = riderFormGroupControls.spouseCoverageLevel as FormArray;
        spouseControl?.clear();
        this.selectedPlansWithRiders?.forEach((planData) => {
            planData?.riders.forEach((rider) => {
                if (this.checkIfSpouseRiderSelected(rider.planId)) {
                    spouseControl?.push(new FormControl(rider?.coverageLevelOptions[0]?.name));
                }
            });
        });
    }

    /**
     * Disables and resets all controls under a rider checkbox to default value (when the rider checkbox is deselected)
     *
     * @param riderFormGroupControls form controls for rider params
     */
    disableAndResetRiderControls(
        riderFormGroupControls: { [key: string]: AbstractControl },
        i: number,
        enableRiders?: { [key: string]: string },
    ): void {
        let disableRider = !riderFormGroupControls.selected.value;
        if (enableRiders) {
            disableRider = enableRiders[riderFormGroupControls.planName.value] === undefined;
        }

        if (!riderFormGroupControls.selected.value || disableRider) {
            riderFormGroupControls.benefitAmount.disable();
            riderFormGroupControls.coverageLevel.disable();
            riderFormGroupControls.coverageLevelOption.disable();
            riderFormGroupControls.spouseTobaccoStatus.disable();
            riderFormGroupControls.spouseGender.disable();
            riderFormGroupControls.benefitAmount.setValue(this.options[i]?.benefitAmounts?.[0].amount);
            riderFormGroupControls.coverageLevel.setValue(this.options[i].coverageLevelOptions?.[0].name);
            riderFormGroupControls.benefitAmount.setValue(this.riderOptionSelected.COMBINED);
            riderFormGroupControls.spouseTobaccoStatus.setValue(this.options[i].spouseTobaccoStatuses?.[0]);
            riderFormGroupControls.spouseGender.setValue(this.options[i].spouseGenders?.[0]);
            riderFormGroupControls.selected.setValue(false);
            riderFormGroupControls.coverageLevelOption.setValue(this.riderOptionSelected.COMBINED);
        } else {
            riderFormGroupControls.benefitAmount.enable();
            riderFormGroupControls.coverageLevel.enable();
            riderFormGroupControls.spouseTobaccoStatus.enable();
            riderFormGroupControls.spouseGender.enable();
            riderFormGroupControls.coverageLevelOption.enable();
        }
    }

    /**
     * checks if selected rider is spouse rider.
     * @param riderId riderId of selected rider
     */
    checkIfSpouseRiderSelected(riderId: number): boolean {
        return this.spouseRiderIDs?.some((id) => id === riderId);
    }

    /**
     * Check selected plan has single CoverageOption
     */
    checkSelectedPlanHasSingleCoverageOption(): boolean {
        let spouseRider: RateSheetRider;
        this.selectedPlansWithRiders[0]?.riders.forEach((riderData) => {
            if (this.spouseRiderIDs.find((id) => id === riderData.planId)) {
                spouseRider = riderData;
            }
        });
        return Boolean(spouseRider?.coverageLevelOptions?.length === 1);
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
