import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { combineLatest, merge, Observable, of, Subject } from "rxjs";
import { filter, map, mapTo, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
// eslint-disable-next-line max-len
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { RiderFormArray, RiderFormGroup, RiderFormGroupControls } from "./riders.model";
import { RiderState, RiderStateValidationOptions } from "../../../../services/rider-state/rider-state.model";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
import { ValidateRiderStateService } from "../../../../services/validate-rider-state/validate-rider-state.service";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import {
    BenefitAmountState,
    EliminationPeriodState,
    RiderPanelIdentifiers,
} from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { MINIMUM_REQUIRED_MAT_SELECT_OPTIONS } from "./riders.constant";
import {
    AsyncStatus,
    CoverageLevelId,
    CoverageLevelNames,
    FailedAsyncData,
    PlanOfferingWithCartAndEnrollment,
    SucceededAsyncData,
    TobaccoInformation,
    SettingsDropdownName,
    RiderCart,
    MissingInfoType,
    CoverageLevel,
    PlanOffering,
    EnrollmentRider,
    PlanOfferingPricing,
} from "@empowered/constants";
import { RiderComponentStoreService } from "../../../../services/rider-component-store/rider-component-store.service";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import { ProducerShopHelperService } from "../../../../services/producer-shop-helper/producer-shop-helper.service";
import { DropDownPortalComponent, SettingsDropdownContent, SettingsDropdownComponentStore } from "@empowered/ui";

@Component({
    selector: "empowered-riders",
    templateUrl: "./riders.component.html",
    styleUrls: ["./riders.component.scss"],
})
export class RidersComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // Get CoverageLevels using PlanOffering input bind
    private selectedCoverageLevels$!: Observable<CoverageLevel[]>;
    // Get PlanOfferingRiders using PlanOffering input bind
    private planOfferingRiders$!: Observable<PlanOffering[]>;
    // Get RiderStates with all the benefit amounts without exception filtering
    // to initialize ProducerShopComponentStore using PlanOffering input bind
    private initialRiderStateWithAllBenefitAmounts$!: Observable<RiderState[]>;
    // Get RiderStates with exception filtering benefit amounts array
    private firstDropdownRiderStates$!: Observable<RiderState[]>;
    // Get ProducerShop RiderStates using PlanOffering input bind and ProducerShopComponentStore
    private producerShopRiderStates$!: Observable<RiderState[]>;
    // Get local dropdown RiderStates using producerShopRiderStates$ and PlanOffering input bind
    dropdownRiderStates$!: Observable<RiderState[]>;
    // Get PlanOfferingCartItemRiders using PlanOffering input bind
    private planOfferingCartItemRiders$!: Observable<RiderCart[]>;
    // Observable for storing EnrollmentRiders with the enrollment
    private enrollmentRidersOfAdditionalUnitParentPlan$!: Observable<EnrollmentRider[]>;
    // Get selected BenefitAmount using PlanOffering input bind
    private selectedBenefitAmountState$!: Observable<BenefitAmountState | null>;
    // Observable of boolean to check whether plan offering is supplementary plan
    isSupplementaryPlan$!: Observable<boolean>;
    // Get eliminationPeriodState from ProducerShopComponentStore
    private selectedEliminationPeriodState$!: Observable<EliminationPeriodState>;

    selectedCoverageLevelId$!: Observable<number | null>;

    showResetButton$!: Observable<boolean>;
    // Get the EnrollmentRiders
    enrollmentRiders$!: Observable<EnrollmentRider[]>;

    // Get plans in cart
    private readonly existingCartItems$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.getCartItemsSet));

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService
        .getSelectedProductRiskClassOnAsyncValue()
        .pipe(map((riskClass) => riskClass?.id));

    // Main form that contains RiderFormArrays
    readonly form: FormGroup;
    // Each FormArray Control is a RiderFormGroup
    readonly riderFormArray: RiderFormArray;

    // Used to distinquish if this riders dropdown (by checking selected PlanOffering.id)
    // is closed compared to the other riders dropdowns
    private readonly selectedPlanOfferingId$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferingId));

    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();

    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();

    // Used to determine when FormGroup should reset to its initial state
    private readonly onReset$ = new Subject<void>();

    // Used to determine when FormGroup should show
    private readonly onShow$ = new Subject<void>();

    readonly missingInfoType = MissingInfoType;

    // Get all Enrollments (not specific to any one Plan Offering)
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments)).pipe(
        // Avoid redundent emitted values when no enrollments have changed
        this.rxjsService.distinctArrayUntilChanged(),
    );

    // Get AG Spouse Exception Data
    private readonly spouseException$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedSpouseExceptions));
    // Get Config value of rider plan ids to include in spouse exception benefit amount filtering
    private readonly riderPlanIdsForException$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getSpouseExceptionRiderPlanIds));
    // get tobacco information from more settings
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    private readonly mandatoryRiderPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getMandatoryRiderPlanIds));

    private readonly offTheJobAURiderPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getOffTheJobRiderPlanIdsForAU));

    private readonly offTheJobAURiderCoverageLevelIds$ = this.ngrxStore.onAsyncValue(
        select(SharedSelectors.getOffTheJobRiderCoverageLevelIdsForAU),
    );

    // Get coverage levels for all plan panel from component store
    private readonly coverageLevels$ = this.producerShopComponentStoreService.getCoverageLevelStates();
    // Get benefit amounts for all plan panel from component store
    private readonly benefitAmounts$ = this.producerShopComponentStoreService.getBenefitAmountStates();

    constructor(
        private readonly fb: FormBuilder,
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly ngrxStore: NGRXStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly validateRiderStateService: ValidateRiderStateService,
        private readonly rxjsService: RXJSService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopHelperService: ProducerShopHelperService,
    ) {
        // Warning! Currently all the rider dropdowns are linked together
        // Whenever there are more than one PlanOffering panels open at a time,
        // There can be more than one riders dropdown rendered in the dom
        // You'll only be able to see one at a time, but they're always rendered and just not visible
        // This means that there's has to be something extra to determine this riders dropdown
        // needs to revert on close instead of the other rendered riders dropdowns
        super(settingsDropdownStore, SettingsDropdownName.RIDERS);

        this.form = this.fb.group({
            riders: this.riderFormArray,
        });
    }

    /**
     * Uses NGRX state to create an initial RiderStatess and populates ProducerShopComponentStore
     *
     * Listens to ProducerShopComponentStore RiderStates and RiderFormArray changes to change UI
     *
     * Waits for apply/submit and revert to hide/show riders dropdown and update ProducerShopComponentStore with updated RiderStates
     */
    ngOnInit(): void {
        // We should call onInit before anything else
        // Pass isExpanded$ Observable since there are multiple PlanSettings dropdowns per Producer Shop:
        // there can be more than one Riders dropdown at a time (one for each plan panel)
        super.onInit(this.producerShopHelperService.isSelectedPlanPanel(this.planPanel));

        const planOffering = this.planPanelService.getPlanOffering(this.planPanel);
        const planId = this.planOfferingService.getPlanId(planOffering);
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        this.isSupplementaryPlan$ = this.isSupplementaryPlan();

        // Get the selected EnrollmentRiders for supplementary base plan
        this.enrollmentRidersOfAdditionalUnitParentPlan$ = this.getEnrolledRidersOfAdditionalUnitParentPlan();

        this.enrollmentRiders$ = this.ngrxStore
            .onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(this.planPanel.enrollment?.id)))
            .pipe(startWith([]));

        this.selectedCoverageLevels$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(planId))).pipe(
            // Since Coverage Level api calls are made frequently, onAsyncValue for selected CoverageLevels
            // will emit multiple times for each api call,
            // to prevent this, we can check if the array of CoverageLevels change using their ids
            this.rxjsService.distinctArrayUntilChanged(),
        );

        // Get riders added to the cart item
        this.planOfferingCartItemRiders$ = this.ngrxStore.onAsyncValue(
            select(PlanOfferingsSelectors.getSelectedPlanOfferingCartItemRiders(this.planPanel.cartItemInfo?.id)),
        );

        // Remove off the job riders from cart item if eligible
        this.planOfferingCartItemRiders$ = this.planOfferingCartItemRiders$.pipe(
            withLatestFrom(this.offTheJobAURiderPlanIds$, this.offTheJobAURiderCoverageLevelIds$),
            map(([planOfferingCartItemRiders, offTheJobAURiderPlanIds, offTheJobAURiderCoverageLevelIds]) =>
                this.filterRiderFromCartData(planOfferingCartItemRiders, offTheJobAURiderPlanIds, offTheJobAURiderCoverageLevelIds),
            ),
        );

        this.selectedCoverageLevelId$ = this.getSelectedCoverageLevelId();

        this.selectedEliminationPeriodState$ = this.producerShopComponentStoreService.getEliminationPeriodState(panelIdentifiers);

        // Get PlanOfferingRiders
        this.planOfferingRiders$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getPlanOfferingRiders(planOffering.id)));

        // Get selected BenefitAmountState using PlanOffering input bind
        this.selectedBenefitAmountState$ = this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers);

        // Uses NGRX state to create an initial RiderStates with benefit amounts not filtered for spouse exception
        this.initialRiderStateWithAllBenefitAmounts$ = this.getInitialRiderStateWithAllBenefitAmounts();

        // Uses NGRX state to create drop down RiderStates with benefit amounts filtered as per spouse exceptions
        // populates ProducerShopComponentStore
        this.firstDropdownRiderStates$ = this.getFirstDropdownRiderStates();

        // Populate ProducerShopComponentStore with initial RiderStates[]
        this.firstDropdownRiderStates$
            .pipe(
                withLatestFrom(this.riderComponentStoreService.getRiderStateValidationOptions()),
                tap(([riderStates, riderStateValidationOptions]) => {
                    this.riderComponentStoreService.addRiderStates({
                        ...riderStateValidationOptions,
                        riderStates,
                    });
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // ProducerShopComponentStore RiderStates
        this.producerShopRiderStates$ = this.firstDropdownRiderStates$.pipe(
            switchMap(() => this.riderComponentStoreService.selectValidatedRiderStates(panelIdentifiers)),
        );

        // Set spouse exception riders benefit amount on change of plan benefit amounts
        this.getSpouseExceptionFilteredRiderStates()
            .pipe(
                withLatestFrom(this.riderComponentStoreService.getRiderStateValidationOptions()),
                tap(([riderStates, riderStateValidationOptions]) => {
                    this.riderComponentStoreService.upsertRiderStates({
                        ...riderStateValidationOptions,
                        riderStates,
                    });
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Local riders dropdown RiderStates
        // Combines the RiderFormArray state with the ProducerShopComponentStore RiderStates
        this.dropdownRiderStates$ = combineLatest([
            // We don't use these valueChanges Observable directly,
            // Since we need more than just the values of the FormGroup, we just reference riderFormArray instead
            (this.riderFormArray.valueChanges as Observable<{ riderPlanName?: boolean }[]>).pipe(startWith({})),
            // ProducerShopComponentStore RiderStates
            this.producerShopRiderStates$,
        ]).pipe(
            withLatestFrom(this.riderComponentStoreService.getRiderStateValidationOptions()),
            map(([[, riderStates], riderStateValidationOptions]) => {
                const updatedRiderStates = riderStates.map((riderState, index) => {
                    const riderFormGroup: RiderFormGroup | undefined = this.riderFormArray.controls[index];
                    const riderPlanNameFormControl = riderFormGroup?.controls.riderPlanName;
                    const coverageLevelNameValue = riderFormGroup?.controls.coverageLevelName.value;
                    const eliminationPeriodNameValue = riderFormGroup?.controls.eliminationPeriodName.value;
                    const benefitAmountValue = riderFormGroup?.controls.benefitAmount.value;

                    return {
                        // Base RiderState off of the existing RiderState from ProduerShopComponentStore
                        ...riderState,
                        // Update RiderState based on FormGroup values
                        // Fall back to existing RiderState
                        checked: riderPlanNameFormControl?.value ?? riderState.checked,
                        disabled: riderPlanNameFormControl?.disabled ?? riderState.disabled,
                        selectedCoverageLevelName: coverageLevelNameValue ?? riderState.selectedCoverageLevelName,
                        selectedEliminationPeriodName: eliminationPeriodNameValue ?? riderState.selectedEliminationPeriodName,
                        selectedBenefitAmount: benefitAmountValue ?? riderState.selectedBenefitAmount,
                    };
                });

                return this.validateRiderStateService.getValidatedRiderStates(updatedRiderStates, {
                    ...riderStateValidationOptions,
                });
            }),
        );

        this.showResetButton$ = combineLatest([
            merge(this.form.valueChanges, this.onRevert$, this.onReset$, this.onApply$).pipe(startWith(false)),
            this.dropdownRiderStates$,
        ]).pipe(
            // If the empty state for the RiderFormArray doesn't match the current state, show reset button
            map(([, riderStates]) => !this.allRiderPlanNamesAreUnchecked(riderStates)),
        );

        // Whenever local riders dropdown RiderStates updates, update RidersFormArray
        this.dropdownRiderStates$
            .pipe(
                tap((riderStates) => this.updateFormUsingRiderStates(riderStates)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Listen for values from NGRX store to populate forms
        // Handle initializing / re-initializing / reverting form
        combineLatest([
            // revert happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // revert form onHide
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            this.producerShopRiderStates$,
        ])
            .pipe(
                withLatestFrom(this.selectedPlanOfferingId$),
                // Only initialize/re-initialize if this Rider Dropdown is active
                filter(([, selectedPlanOfferingId]) => planOffering.id === selectedPlanOfferingId),
                tap(([[revert, riderStates]]) => {
                    // Clear our the FormArray and reinitialize it based on the current RiderStates of the ProduerShopComponentStore
                    // Not the local state of this Component using dropdownRiderStates$
                    // Local state of this riders dropdown doesn't get stored into the ProducerShopComponentStore until apply/submit
                    this.setFormArrayValues(this.riderFormArray, riderStates);

                    if (revert) {
                        // Then mark form as pristine to remove dirty flag
                        this.form.markAsPristine();
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        merge(
            // Whenever `Apply` is clicked:
            // 1. Validate FormGroup
            // 2. Update ProducerShopComponentStore
            // 3. Close riders dropdown / dialog modal
            this.onApply$,
            // Whenever `Reset` is clicked:
            // 1. Uncheck all Riders and reset mat-selects to first possible value
            // 2. Validate FormGroup
            // 3. Update ProducerShopComponentStore
            // 4. Close riders dropdown / dialog modal
            this.onReset$.pipe(
                withLatestFrom(this.producerShopRiderStates$),
                tap(([, riderStates]) => this.resetRidersFormArray(riderStates)),
            ),
        )
            .pipe(
                withLatestFrom(
                    this.dropdownRiderStates$,
                    this.riderComponentStoreService.getRiderStateValidationOptions(),
                    this.isSupplementaryPlan(),
                ),
                tap(([, localDropdownRiderStates, riderStateValidationOptions, isSupplementaryPlan]) =>
                    this.submitForm(localDropdownRiderStates, riderStateValidationOptions, isSupplementaryPlan),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Remove rider from cart data in case of additional units or
     * Supplementary plans when the rider has reached the max units
     * In the base plan itself
     * @param planOfferingCartItemRiders {RiderCart[]} In cart Rider Array
     * @param offTheJobAURiderPlanIds {number[]} Config value for the eligible rider ids
     * @param offTheJobAURiderCoverageLevelIds {number[]} Config value for the coverage level ids
     * @returns filtered Rider array
     */
    filterRiderFromCartData(
        planOfferingCartItemRiders: RiderCart[],
        offTheJobAURiderPlanIds: number[],
        offTheJobAURiderCoverageLevelIds: number[],
    ): RiderCart[] {
        planOfferingCartItemRiders?.forEach((planOfferingCartItemRider) => {
            if (
                this.isSupplementaryPlan &&
                offTheJobAURiderPlanIds?.length &&
                offTheJobAURiderCoverageLevelIds?.length &&
                offTheJobAURiderPlanIds.includes(planOfferingCartItemRider.planId) &&
                offTheJobAURiderCoverageLevelIds.includes(planOfferingCartItemRider.coverageLevelId) &&
                !planOfferingCartItemRider.benefitAmount
            ) {
                planOfferingCartItemRiders = planOfferingCartItemRiders.filter(
                    (rider) => rider.planId !== planOfferingCartItemRider.planId,
                );
            }
        });
        return planOfferingCartItemRiders;
    }

    /**
     * Updates mat-checkboxes checked state without triggering RiderFormArray valueChanges
     *
     * and sets disabled state based on RiderState
     *
     * @param riderFormGroup {RiderFormGroup} RiderFormGroup that contains mat-checkbox of RiderFormArray
     * @param riderState {RiderState} used to determine whether or not to enable or disable
     */
    setMatCheckboxState(riderFormGroup: RiderFormGroup, riderState?: RiderState): void {
        const riderPlanNameControl = riderFormGroup.controls.riderPlanName;

        riderPlanNameControl.setValue(riderState?.checked, {
            emitEvent: false,
        });

        // Passing onlySelf is required so that FormGroup / FormArray doesn't emit changes
        if (riderState?.disabled || !riderState?.riderHasPrice) {
            riderPlanNameControl.disable({
                onlySelf: true,
            });
        } else {
            riderPlanNameControl.enable({
                onlySelf: true,
            });
        }
    }

    /**
     * Updates if rendered mat-selects should be enabled or disabled based on
     * whether or not a rider checkbox is checked
     *
     * @param riderFormGroup {RiderFormGroup} RiderFormGroup that contains mat-selects  of RiderFormArray
     */
    updateMatSelectStates(riderFormGroup: RiderFormGroup): void {
        const riderNameControl = riderFormGroup.controls.riderPlanName;
        const coverageLevelNameControl = riderFormGroup.controls.coverageLevelName;
        const eliminationPeriodNameControl = riderFormGroup.controls.eliminationPeriodName;
        const benefitAmountControl = riderFormGroup.controls.benefitAmount;

        // Passing onlySelf is required so that FormGroup / FormArray doesn't emit changes
        if (riderNameControl.value) {
            coverageLevelNameControl.enable({
                onlySelf: true,
            });
            eliminationPeriodNameControl.enable({
                onlySelf: true,
            });
            benefitAmountControl.enable({
                onlySelf: true,
            });
            return;
        }

        // Passing onlySelf is required so that FormGroup / FormArray doesn't emit changes
        coverageLevelNameControl.disable({
            onlySelf: true,
        });
        eliminationPeriodNameControl.disable({
            onlySelf: true,
        });
        benefitAmountControl.disable({
            onlySelf: true,
        });
    }

    /**
     * Handles enabled/disabled states for RidersFormArray based on RiderStates
     *
     * @param riderStates {RiderStates} source of enabled/disabled state
     */
    updateFormUsingRiderStates(riderStates: RiderState[]): void {
        this.riderFormArray.controls.forEach((riderFormGroup, index) => {
            const riderState = riderStates[index];

            // Update mat-checkbox state without triggering valueChanges for RiderFormArray
            this.setMatCheckboxState(riderFormGroup, riderState);

            // Update mat-select state without triggering valueChanges for RiderFormArray
            this.updateMatSelectStates(riderFormGroup);
        });
    }

    /**
     * Clear out RiderFormArray then populate it using RiderStates
     *
     * @param riderFormArray {RiderFormArray} FormArray that will be cleared then updated based on RiderStates
     * @param riderStates RiderState that determines the value of RiderFormGroups for RiderFormArray
     */
    setFormArrayValues(riderFormArray: RiderFormArray, riderStates: RiderState[]): void {
        // Avoiding rewriting FormArray reference
        riderFormArray.clear();

        // Sadly, we have to use forEach here to populate the FormArray
        // without replacing its reference to this Component
        riderStates.forEach((riderState) => {
            const { checked, disabled, selectedCoverageLevelName, selectedEliminationPeriodName, selectedBenefitAmount } = riderState;

            const riderFormGroup: RiderFormGroupControls = {
                riderPlanName: new FormControl({ value: !!checked, disabled: !!disabled }, Validators.required),
                coverageLevelName: new FormControl(
                    { value: selectedCoverageLevelName, disabled: !checked },
                    // (Not EliminationPeriods) CoverageLevels are only required when there are at a list to choose from
                    riderState.coverageLevelNames.length ? [Validators.required] : [],
                ),
                eliminationPeriodName: new FormControl(
                    { value: selectedEliminationPeriodName, disabled: !checked },
                    // EliminationPeriods (CoverageLevels) are only required when there are at a list to choose from
                    riderState.eliminationPeriodNames.length ? [Validators.required] : [],
                ),
                benefitAmount: new FormControl(
                    { value: selectedBenefitAmount, disabled: !checked },
                    // PlanOfferingPricings (benefit amounts) are only required when there are at a list to choose from
                    riderState.benefitAmounts.length ? [Validators.required] : [],
                ),
            };

            // Populate FormArray in the order of riderStates
            riderFormArray.push(this.fb.group(riderFormGroup));
        });
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used for reverting FormGroup on hide.
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     * We are required to provide this method since SettingsDropdownContent is an abstract class.
     *
     * Not used.
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to revert FormGroup
     */
    onRevert(): void {
        this.onRevert$.next();
    }

    /**
     * Is used to emit when to submit FormGroup
     */
    onApply(): void {
        this.onApply$.next();
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onReset$.next();
    }

    /**
     * Gets PlanOfferingPricings for a PlanOfferingRider. This method returns an empty array if api errors.
     *
     * @param riderPlanOfferingId {number} - RIDER PlanOffering id related to the Rider that these pricings belong to
     * @param riskClassId {number} - riskClassId that is required for pricing api
     * @param coverageEffectiveDate {string} - coverageEffectiveDate that is required for pricing api
     * @param selectedTobaccoInformation { TobaccoInformation } - tobacco status of employee and spouse
     * @param includeFee { boolean } - aflac policy fee status of the rider
     * @param parentPlanId {number} - Optional RIDER PlanOffering parentPlanId that is required for pricing api
     * @param baseBenefitAmount {number | null} - Optional base benefit amount for either the base plan or base rider
     * @param baseCoverageLevelId {number | null} - Optional base plans coverage level id
     * @param shoppingCartItemId {number | null} - Optional PlanPanel's CartItem id
     *
     * @returns {Observable<PlanOfferingPricing[]>} Observable<PlanOfferingPricing[]>
     */
    getRiderPricings(
        riderPlanOfferingId: number,
        riskClassId: number,
        coverageEffectiveDate: string,
        selectedTobaccoInformation: TobaccoInformation,
        includeFee: boolean,
        parentPlanId?: number | null,
        baseBenefitAmount?: number | null,
        baseCoverageLevelId?: number | null,
        shoppingCartItemId?: number | null,
    ): Observable<PlanOfferingPricing[]> {
        // NOTE: Dependent Age doesn't required to get Riders pricing
        return this.ngrxStore
            .pipe(
                select(
                    PlanOfferingsSelectors.getPlanOfferingPricings(
                        includeFee,
                        selectedTobaccoInformation.memberIsTobaccoUser,
                        selectedTobaccoInformation.spouseIsTobaccoUser,
                        riderPlanOfferingId,
                        riskClassId,
                        coverageEffectiveDate,
                        parentPlanId,
                        baseBenefitAmount,
                        baseCoverageLevelId,
                        shoppingCartItemId,
                    ),
                ),
            )
            .pipe(
                filter(
                    (
                        planOfferingPricingsData,
                    ): planOfferingPricingsData is SucceededAsyncData<PlanOfferingPricing[]> | FailedAsyncData<PlanOfferingPricing[]> =>
                        planOfferingPricingsData.status === AsyncStatus.SUCCEEDED || planOfferingPricingsData.status === AsyncStatus.FAILED,
                ),
                map((planOfferingPricingsData) => {
                    if (planOfferingPricingsData.status === AsyncStatus.FAILED) {
                        return [];
                    }

                    return planOfferingPricingsData.value;
                }),
            );
    }

    /**
     * Gets PlanOfferingPricing benefit amount numeric values
     *
     * Filters PlanOfferingPricings with no benefit amount
     *
     * If there would be an array of length 1, an empty array is returned instead
     *
     * @param planOfferingPricings {PlanOfferingPricing[]} - riderPlanOfferingId
     *
     * @returns {number[]} number[] - Array of PlanOfferingPricing benefit amount numeric values
     */
    getFilteredBenefitAmounts(planOfferingPricings: PlanOfferingPricing[]): number[] {
        // Find any pricing with coverageLevelId
        const anyRiderPlanOfferingPricingWithCoverageLevel = planOfferingPricings.find(
            (planOfferingPricing) => !!planOfferingPricing.coverageLevelId,
        );

        // If there are no pricings coverageLevelId, we shouldn't display pricings
        if (!anyRiderPlanOfferingPricingWithCoverageLevel) {
            return [];
        }

        const coverageLevelId = anyRiderPlanOfferingPricingWithCoverageLevel.coverageLevelId;

        // Find benefit amounts using any single coverageLevelId
        // This works since we only want the numeric values and the list of values are the same for any one CoverageLevel id
        const benefitAmountPricings = planOfferingPricings
            .filter((planOfferingPricing) => {
                // Filter out any PlanOfferingPricing that has nothing to do with benefitAmounts
                if (!planOfferingPricing.benefitAmount) {
                    return false;
                }

                // Filter PlanOfferingPricings that match the coverageLevel id
                // It doesn't matter which coverageLevel id we use since the possible numeric values
                // are supposed to be the same for all of them
                if (planOfferingPricing.coverageLevelId !== coverageLevelId) {
                    return false;
                }

                return true;
            })
            .map((planOfferingPricing) => planOfferingPricing.benefitAmount)
            // API response doesn't always come with sorted pricings using benefit amounts
            // Without mutating original array of PlanOfferingPricing, sort from smallest to largest
            .sort((benefitAmountA, benefitAmountB) => benefitAmountA - benefitAmountB);

        // We only want to show PlanOfferingPricings (benefit amounts) mat select if there's more than one PlanOfferingPricing
        if (benefitAmountPricings.length < MINIMUM_REQUIRED_MAT_SELECT_OPTIONS) {
            return [];
        }
        return benefitAmountPricings;
    }

    /**
     * Gets child CoverageLevel names for a RIDER PlanOffering
     *
     * Filters out declined CoverageLevels and PlanOffering Rider (child) CoverageLevel
     * with matching id of BASE PlanOffering (parent) CoverageLevel
     *
     * @param riderPlanId {number} - RIDER PlanOffering Plan id
     * @param baseCoverageLevel {CoverageLevel} - BASE PlanOffering (parent) CoverageLevel.
     * Typically the selected one, but doesn't really matter.
     * @param baseCoverageLevels {CoverageLevel[]} - BASE PlanOffering (parent) CoverageLevels
     * @param isSupplementaryPlan if selected plan is supplementary or not
     * @returns {Observable<CoverageLevel[]>} CoverageLevels that don't match up with BASE Plan Offering's
     */
    getFilteredChildCoverageLevels(
        riderPlanId: number,
        baseCoverageLevel: CoverageLevel,
        baseCoverageLevels: CoverageLevel[],
        isSupplementaryPlan: boolean,
    ): Observable<CoverageLevel[]> {
        return this.ngrxStore
            .onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(riderPlanId, baseCoverageLevel.id, isSupplementaryPlan)))
            .pipe(
                // Remove any declined CoverageLevels
                map((childCoverageLevels) =>
                    childCoverageLevels.filter((childCoverageLevel) => childCoverageLevel.id !== CoverageLevelId.DECLINED),
                ),
                // Remove any CoverageLevels that match with parent CoverageLevel
                map((childCoverageLevels) =>
                    childCoverageLevels.filter((childCoverageLevel) => !baseCoverageLevels.some(({ id }) => id === childCoverageLevel.id)),
                ),
            );
    }

    /**
     * Get base benefit amount of EnrollmentRider with same policy series and parent Plan id
     *
     * @param enrollmentRiders EnrollmentRiders info for existing coverage
     * @param rider selected rider
     * @returns base benefit amount of EnrollmentRider with same policy series and parent Plan id
     */
    getBaseBenefitAmountForEnrollmentRiders(enrollmentRiders: EnrollmentRider[], rider: PlanOffering): number | null {
        return (
            enrollmentRiders?.find(
                (enrollmentRider) =>
                    enrollmentRider?.plan.id === rider?.parentPlanId && enrollmentRider?.plan.policySeries === rider?.plan.policySeries,
            )?.benefitAmount ?? null
        );
    }

    /**
     * Gets array of names to populate mat-select options.
     * Filters out arrays that have less than 2 options.
     *
     * @param values {{ name?: string}[]} Instances that have name property (CoverageLevel[])
     * @returns {string[]} name properties
     */
    getMatSelectNames(values: { name?: string }[]): string[] {
        if (values.length < MINIMUM_REQUIRED_MAT_SELECT_OPTIONS) {
            return [];
        }

        return values.map(({ name }) => name ?? "");
    }

    /**
     * Compares two RiderFormArrays and returns true if they have all matching values
     *
     * @param riderFormArray {RiderFormArray} First RiderFormArray
     * @param otherRiderFormArray {RiderFormArray} Second RiderFormArray
     * @returns {boolean} true if both RiderFormArrays have all matching values
     */
    riderFormArraysMatch(riderFormArray: RiderFormArray, otherRiderFormArray: RiderFormArray): boolean {
        // If FormArrays have different lengths, they can't be the same
        if (riderFormArray.length !== otherRiderFormArray.length) {
            return false;
        }
        // Check if every FormGroup of the FormArray have matching values
        return riderFormArray.controls.every((riderFormGroup, index) => {
            // Must get raw value to include disabled FormControls
            const otherRiderFormGroupValue = otherRiderFormArray.controls[index].getRawValue();
            const riderFormGroupValue = riderFormGroup.getRawValue();

            if (riderFormGroupValue.riderPlanName !== otherRiderFormGroupValue.riderPlanName) {
                return false;
            }

            if (riderFormGroupValue.coverageLevelName !== otherRiderFormGroupValue.coverageLevelName) {
                return false;
            }

            if (riderFormGroupValue.eliminationPeriodName !== otherRiderFormGroupValue.eliminationPeriodName) {
                return false;
            }

            if (riderFormGroupValue.benefitAmount !== otherRiderFormGroupValue.benefitAmount) {
                return false;
            }

            return true;
        });
    }

    /**
     * Returns boolean based on if all RiderPlanName FormControls are unchecked
     *
     * @param riderStates {RiderState[]} Used to determine which Riders should be considered
     * @returns {boolean} true if all RiderPlanName FormControls are unchecked
     */
    allRiderPlanNamesAreUnchecked(riderStates: RiderState[]): boolean {
        // Get empty state for RiderFormArray
        let expectedFormArray: RiderFormArray;

        // Uncheck any Enrollment Riders from expectedFormArray
        this.setFormArrayValues(expectedFormArray, this.riderComponentStoreService.getUncheckedRiderStates(riderStates));

        // Check if current RiderFormArray matches expected RiderFormArray with all riderPlanName checkboxes unchecked
        return this.riderFormArraysMatch(expectedFormArray, this.riderFormArray);
    }

    /**
     * Get boolean based on when PlanPanel's Plan is Supplementary
     *
     * @returns Observable<boolean> emits true when Plan is Supplementary
     */
    isSupplementaryPlan(): Observable<boolean> {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        return this.ngrxStore
            .onAsyncValue(
                select(
                    PlanOfferingsSelectors.getPlanOfferingData(
                        panelIdentifiers.planOfferingId,
                        panelIdentifiers.cartId,
                        panelIdentifiers.enrollmentId,
                    ),
                ),
            )
            .pipe(
                map((planPanel) => (planPanel ? this.planOfferingService.planOfferingHasSupplementaryPlan(planPanel.planOffering) : false)),
            );
    }

    /**
     * Get EnrollmentRiders where PlanPanel's Plan is a dependent Plan of Enrollment.
     * PlanPanel's Plan must also be a Supplementary Plan
     *
     * @returns Observable<EnrollmentRider[]> EnrollmentRiders where PlanPanel's Plan is a dependent Plan of Enrollment
     */
    getEnrolledRidersOfAdditionalUnitParentPlan(): Observable<EnrollmentRider[]> {
        const planOffering = this.planPanelService.getPlanOffering(this.planPanel);

        return this.enrollments$.pipe(
            withLatestFrom(this.isSupplementaryPlan()),
            switchMap(([enrollments, isSupplementaryPlan]) => {
                const enrollment = enrollments?.find(
                    (possibleEnrollment) => possibleEnrollment.plan.dependentPlanIds?.includes(planOffering.plan.id) && isSupplementaryPlan,
                );

                if (!enrollment) {
                    return of([]);
                }

                return this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(enrollment.id)));
            }),
        );
    }

    /**
     * Get Selected CoverageLevel id based on PlanPanel
     *
     * @returns Observable<number | null> Selected CoverageLevel id
     */
    getSelectedCoverageLevelId(): Observable<number | null> {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        const selectedCoverageLevel$ = this.producerShopComponentStoreService
            .getCoverageLevelState(panelIdentifiers)
            .pipe(map((coverageLevelState) => coverageLevelState?.coverageLevel));

        return selectedCoverageLevel$.pipe(map((coverageLevel) => coverageLevel?.id ?? null));
    }

    /**
     * Get initial RiderStates with all BenefitAmounts. Later BenefitAmounts are filtered based on SpouseException.
     * It is important to keep a reference to all the BenefitAmounts so we can re-filter based on latest SpouseException.
     *
     * @returns {Observable<RiderState[]>} initial RiderStates with all BenefitAmounts
     */
    getInitialRiderStateWithAllBenefitAmounts(): Observable<RiderState[]> {
        const planOffering = this.planPanelService.getPlanOffering(this.planPanel);
        const planId = this.planOfferingService.getPlanId(planOffering);

        return combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            this.selectedCoverageLevels$,
            this.selectedEliminationPeriodState$,
            this.getSelectedCoverageLevelId(),
            combineLatest([this.selectedBenefitAmountState$, this.selectedTobaccoInformation$]),
        ]).pipe(
            withLatestFrom(
                this.planOfferingCartItemRiders$,
                this.enrollmentRidersOfAdditionalUnitParentPlan$.pipe(startWith([])),
                this.enrollmentRiders$.pipe(startWith([])),
                this.mandatoryRiderPlanIds$,
                this.isSupplementaryPlan(),
            ),
            // Unless any of the above values actually change,
            // we don't need to attempt to fetch any values from ngrx store
            // Check if every value of the previous array matches the new values
            this.rxjsService.distinctArrayUntilChanged((previous, current) => previous === current),
            switchMap(
                ([
                    [
                        riskClassId,
                        coverageEffectiveDate,
                        basePlanOfferingCoverageLevels,
                        eliminationPeriodState,
                        selectedBaseCoverageLevelId,
                        [baseBenefitAmount, selectedTobaccoInformation],
                    ],
                    planOfferingCartItemRiders,
                    enrollmentRidersOfAdditionalUnitParentPlan,
                    enrollmentRiders,
                    mandatoryRiderPlanIds,
                    isSupplementaryPlan,
                ]) =>
                    this.planOfferingRiders$.pipe(
                        map((planOfferingRiders) => ({
                            coverageEffectiveDate,
                            riskClassId,
                            basePlanOfferingCoverageLevels,
                            eliminationPeriodId: eliminationPeriodState?.eliminationPeriod?.id,
                            planOfferingRiders,
                            selectedBaseCoverageLevelId,
                            baseBenefitAmount,
                            planOfferingCartItemRiders,
                            enrollmentRidersOfAdditionalUnitParentPlan,
                            enrollmentRiders,
                            selectedTobaccoInformation,
                            mandatoryRiderPlanIds,
                            isSupplementaryPlan,
                        })),
                    ),
            ),
            switchMap(
                ({
                    coverageEffectiveDate,
                    riskClassId,
                    basePlanOfferingCoverageLevels,
                    planOfferingRiders,
                    baseBenefitAmount,
                    planOfferingCartItemRiders,
                    enrollmentRidersOfAdditionalUnitParentPlan,
                    enrollmentRiders,
                    selectedTobaccoInformation,
                    mandatoryRiderPlanIds,
                    isSupplementaryPlan,
                }) => {
                    // We don't need to get child CoverageLevels from each BASE PlanOffering's CoverageLevels
                    // since we will only use the names and the child CoverageLevel names are the same
                    // for each BASE PlanOffering's CoverageLevel
                    const baseCoverageLevel = basePlanOfferingCoverageLevels[0];

                    // Avoid doing combineLatest of empty array
                    // This will result in the Observable completing
                    if (!planOfferingRiders.length) {
                        return of([]);
                    }

                    return combineLatest(
                        planOfferingRiders.map((planOfferingRider) => {
                            // check if the rider is added to cart
                            const riderAddedToCart = planOfferingCartItemRiders?.find(
                                (cartRider) => cartRider.planOfferingId === planOfferingRider.id,
                            );
                            // check if the rider is enrolled
                            const enrollmentRiderData = enrollmentRiders.find(
                                (enrollmentRider) => enrollmentRider.plan.id === planOfferingRider.plan.id,
                            );

                            return combineLatest([
                                // NOTE: Dependent Age doesn't required to get Riders pricing
                                // Get PlanOfferingPricings
                                this.getRiderPricings(
                                    planOfferingRider.id,
                                    riskClassId,
                                    coverageEffectiveDate,
                                    selectedTobaccoInformation,
                                    mandatoryRiderPlanIds.includes(planOfferingRider.plan.id),
                                    planOfferingRider.parentPlanId,
                                    planOfferingRider.parentPlanId === planId
                                        ? baseBenefitAmount?.benefitAmount
                                        : this.getBaseBenefitAmountForEnrollmentRiders(
                                            enrollmentRidersOfAdditionalUnitParentPlan,
                                            planOfferingRider,
                                        ),
                                    planOfferingRider.parentPlanId === planId ? planOfferingRider.parentPlanCoverageLevelId : null,
                                    this.planPanel.cartItemInfo?.id,
                                ),
                                // Get RIDER PlanOffering (child) CoverageLevels
                                // using the first BASE PlanOffering (parent) CoverageLevel
                                this.getFilteredChildCoverageLevels(
                                    planOfferingRider.plan.id,
                                    baseCoverageLevel,
                                    basePlanOfferingCoverageLevels,
                                    isSupplementaryPlan,
                                ),
                            ]).pipe(
                                map(([riderPlanOfferingPricings, childCoverageLevels]) => ({
                                    planOfferingRider,
                                    riderPlanOfferingPricings,
                                    childCoverageLevels,
                                    riderAddedToCart,
                                    enrollmentRiderData,
                                    isSupplementaryPlan,
                                    enrollmentRidersOfAdditionalUnitParentPlan,
                                })),
                            );
                        }),
                    );
                },
            ),
            withLatestFrom(this.existingCartItems$.pipe(startWith([]))),
            map(([riderNGRXValues, existingCartItems]) =>
                riderNGRXValues.map(
                    (
                        {
                            planOfferingRider,
                            riderPlanOfferingPricings,
                            childCoverageLevels,
                            riderAddedToCart,
                            enrollmentRiderData,
                            isSupplementaryPlan,
                            enrollmentRidersOfAdditionalUnitParentPlan,
                        },
                        index,
                    ) => {
                        // Values from PlanOffering input bind
                        const planOfferingId = planOffering.id;
                        const productId = this.planOfferingService.getProductId(planOffering);
                        const productOfferingId = this.planOfferingService.getProductOfferingId(planOffering);

                        // Filter PlanOffering pricings for BenefitAmounts
                        const benefitAmounts = this.getFilteredBenefitAmounts(riderPlanOfferingPricings);
                        const isPlanInCart = existingCartItems.some(
                            (existingCartItem) => existingCartItem.id === this.planPanel.cartItemInfo?.id,
                        );
                        // Values from FormGroup
                        const individualRiderFormGroup = this.riderFormArray.controls[index];
                        const checked =
                            (!!riderAddedToCart || (!!enrollmentRiderData && !isPlanInCart)) ??
                            !!individualRiderFormGroup?.controls.riderPlanName.value;
                        const disabled = !!individualRiderFormGroup?.controls.riderPlanName.disabled;

                        // Separate which CoverageLevels are Elimination Periods or not
                        // They are displayed separately and have their own local state
                        const coverageLevels = childCoverageLevels.filter((coverageLevel) => !coverageLevel.eliminationPeriod);
                        const eliminationPeriods = childCoverageLevels.filter((coverageLevel) => !!coverageLevel.eliminationPeriod);

                        // Filter coverage levels to remove or keep only retain riders in case of supplementary plans
                        const filteredCoverageLevels = this.getFilteredRiderCoverageLevels(
                            isSupplementaryPlan,
                            coverageLevels,
                            planOfferingRider,
                            enrollmentRidersOfAdditionalUnitParentPlan,
                        );
                        // Display only the name values
                        // This is required since CoverageLevel / EliminationPeriod changes whenever BASE Plan Offering
                        // changes its selected CoverageLevel / EliminationPeriod.
                        // The only values that don't change are the name values
                        const coverageLevelNames = this.getMatSelectNames(filteredCoverageLevels);
                        const eliminationPeriodNames = this.getMatSelectNames(eliminationPeriods);

                        // TODO: We can't use the cart items api response to figure this out
                        // CartItem will be passed as an Input Bind instead
                        // Stackable plans can be "in the cart"
                        // and "out of the cart" at the same time (one is in and the other is always out)*/
                        // To determine which situation this is for the dropdowns, we need to only rely on the Input Bind
                        //
                        // libs/enrollment/src/lib/producer-shop/plans-container/plan-container/plan-container.component.ts
                        // @Input() planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment;
                        //
                        // Check for inCart coverageLevel,elimination period and benefit amount
                        // And default the rider drop-downs with cart item values
                        const inCartCoverageLevel = coverageLevels.find(
                            (coverageLevel) => coverageLevel.id === riderAddedToCart?.coverageLevelId,
                        )?.name;

                        const inCartEliminationPeriod = eliminationPeriods.find(
                            (eliminationPeriod) => eliminationPeriod.id === riderAddedToCart?.coverageLevelId,
                        )?.name;

                        // If the Rider has possible BenefitAmounts to pick from,
                        // then its benefitAmount in RiderCarts must be that selected value
                        const inCartBenefitAmount = benefitAmounts.length ? riderAddedToCart?.benefitAmount : null;

                        const riderPlanOfferingId = planOfferingRider.id;

                        const identifiers: RiderPanelIdentifiers = {
                            riderPlanOfferingId,
                            planOfferingId,
                            cartId: this.planPanel.cartItemInfo?.id,
                            enrollmentId: this.planPanel.enrollment?.id,
                        };

                        // get riders data which are enrolled if plan is not in cart
                        const enrolledRiderNotInCartPlan =
                            !!enrollmentRiderData && !isPlanInCart
                                ? {
                                    benefitAmount: enrollmentRiderData.benefitAmount,
                                    coverageLevel: childCoverageLevels.find(
                                        (coverageLevel) => coverageLevel.id === enrollmentRiderData?.coverageLevel.id,
                                    )?.name,
                                    eliminationPeriod: eliminationPeriods.find(
                                        (eliminationPeriod) => eliminationPeriod.id === enrollmentRiderData.coverageLevel.id,
                                    )?.name,
                                }
                                : null;

                        // If the Rider has possible BenefitAmounts to pick from,
                        // then its benefitAmount in enrolledRiderNotInCartPlan must be that selected value
                        const enrolledRiderBenefitAmount = benefitAmounts.length ? enrolledRiderNotInCartPlan?.benefitAmount : null;
                        return {
                            identifiers,
                            planId,
                            productId,
                            productOfferingId,
                            riderPlanId: this.planOfferingService.getPlanId(planOfferingRider),
                            riderPlanOfferingId,
                            riderParentPlanId: planOfferingRider.parentPlanId,
                            // Used to determine if Riders related to Broker Plans should be auto checked
                            brokerSelected: planOfferingRider.brokerSelected,
                            // Only present Coverage Levels mat-select if there's at least 2 options to pick from
                            // It doesn't seem like it matters if we just use the first set of child CoverageLevels,
                            // since they should all have the same names anyway
                            coverageLevelNames,
                            eliminationPeriodNames,
                            benefitAmounts,
                            missingInformation: planOfferingRider.missingInformation,
                            riderPlanName: this.planOfferingService.getPlanName(planOfferingRider),
                            planPolicySeries: planOfferingRider.plan.policySeries,
                            enrollmentRequirements: planOfferingRider.enrollmentRequirements ?? [],
                            disabled,
                            checked,
                            selectedCoverageLevelName:
                                enrolledRiderNotInCartPlan?.coverageLevel ?? inCartCoverageLevel ?? coverageLevelNames[0] ?? null,
                            selectedEliminationPeriodName:
                                enrolledRiderNotInCartPlan?.eliminationPeriod ??
                                inCartEliminationPeriod ??
                                eliminationPeriodNames[0] ??
                                null,
                            selectedBenefitAmount: enrolledRiderBenefitAmount ?? inCartBenefitAmount ?? benefitAmounts[0] ?? null,
                            returnOfPremiumRider: planOfferingRider.returnOfPremiumRider,
                            parentPlanCoverageLevelId: planOfferingRider.parentPlanCoverageLevelId ?? null,
                            riderHasPrice: !!riderPlanOfferingPricings?.length,
                        };
                    },
                ),
            ),
            take(1),
        );
    }

    /**
     * Get initial RiderStates to populate form and render form.
     *
     * @returns {Observable<RiderState[]>} First RiderStates needed to allow component to show form
     */
    getFirstDropdownRiderStates(): Observable<RiderState[]> {
        return this.initialRiderStateWithAllBenefitAmounts$.pipe(
            withLatestFrom(this.selectedBenefitAmountState$, this.riderPlanIdsForException$, this.spouseException$),
            map(([initialRiderStateWithAllBenefitAmounts, selectedBenefitAmountState, riderPlanIdsForException, spouseException]) =>
                this.riderComponentStoreService.getSpouseExceptionRiderData(
                    initialRiderStateWithAllBenefitAmounts,
                    initialRiderStateWithAllBenefitAmounts,
                    spouseException,
                    riderPlanIdsForException,
                    selectedBenefitAmountState.benefitAmount,
                ),
            ),
        );
    }

    /**
     * Gets filtered rider coverage levels
     * @param isSupplementaryPlan {boolean} boolean value to check if current plan is supplementary
     * @param coverageLevels {CoverageLevel[]} rider coverage level for planoffering rider
     * @param enrollmentRidersOfAdditionalUnitParentPlan {EnrollmentRider[]} enrolled riders data of base plan
     * @param planOfferingRider {PlanOffering} one of the plan offering riders of current plan panel
     * @returns {CoverageLevel[]} filtered rider coverage levels
     */
    getFilteredRiderCoverageLevels(
        isSupplementaryPlan: boolean,
        coverageLevels: CoverageLevel[],
        planOfferingRider: PlanOffering,
        enrollmentRidersOfAdditionalUnitParentPlan?: EnrollmentRider[],
    ): CoverageLevel[] {
        // if plan is not supplementary then we don't need to filter its coverage level
        if (!isSupplementaryPlan) {
            return coverageLevels;
        }
        // if base plan has some rider enrolled then only retain riders coverage levels should be displayed in supplementary plan
        // else retain rider coverage levels should be removed
        if (
            enrollmentRidersOfAdditionalUnitParentPlan?.some(
                (parentPlanRiders) => parentPlanRiders.plan.policySeries === planOfferingRider.plan.policySeries,
            )
        ) {
            return coverageLevels.filter((riderCoverageLevel) => riderCoverageLevel.retainCoverageLevel);
        } else {
            return coverageLevels.filter((riderCoverageLevel) => !riderCoverageLevel.retainCoverageLevel);
        }
    }

    /**
     * Get filtered RiderStates based on Spouse Exception
     *
     * @returns {Observable<RiderState[]>} Filtered RiderStates based on Spouse Exception
     */
    getSpouseExceptionFilteredRiderStates(): Observable<RiderState[]> {
        return this.selectedBenefitAmountState$.pipe(
            withLatestFrom(
                this.producerShopRiderStates$,
                this.riderPlanIdsForException$,
                this.spouseException$,
                this.initialRiderStateWithAllBenefitAmounts$,
            ),
            map(
                ([
                    selectedBenefitAmountState,
                    riderStates,
                    riderPlanIdsForException,
                    spouseException,
                    initialRiderStateWithAllBenefitAmounts,
                ]) =>
                    this.riderComponentStoreService.getSpouseExceptionRiderData(
                        riderStates,
                        initialRiderStateWithAllBenefitAmounts,
                        spouseException,
                        riderPlanIdsForException,
                        selectedBenefitAmountState.benefitAmount,
                    ),
            ),
        );
    }

    /**
     * Unchecks all RiderStates / Rider FormGroups of RiderFormArray
     *
     * @param riderStates {RiderState[]} expected RiderStates that represent all the Rider FormGroups of RiderFormArray
     */
    resetRidersFormArray(riderStates: RiderState[]): void {
        // Uncheck all Riders and possible disable Riders if they were dependant on some checked/selected Rider
        this.setFormArrayValues(this.riderFormArray, this.riderComponentStoreService.getUncheckedRiderStates(riderStates));
        // mark form as pristine to remove dirty flag
        this.form.markAsPristine();
    }

    /**
     * Marks form as touched and updates RiderComponentStoreService if form is valid. After, Rider dropdown is closed.
     *
     * @param riderStates {RiderState[]} RiderStates used to update RiderComponentStoreService
     * @param riderStateValidationOptions {RiderStateValidationOptions} used to validate all RiderComponentStoreService RiderStates
     * @param isSupplementaryPlan {boolean} if selected plan is supplementary or not
     */
    submitForm(riderStates: RiderState[], riderStateValidationOptions: RiderStateValidationOptions, isSupplementaryPlan?: boolean): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();

        // Exit early if FormGroup isn't valid
        if (!this.form.valid) {
            return;
        }

        this.riderComponentStoreService.upsertRiderStates({
            ...riderStateValidationOptions,
            riderStates,
            isSupplementaryPlan,
        });

        // Assuming FormGroup is valid, close dropdown
        this.portalRef?.hide();
    }

    /**
     * Returns unique identifier for Rider option value. This can be a primative value for
     * Rider CoverageLevels, BenefitAmounts, EliminationPeriods
     * trackBy for *ngFor involving Rider option value used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param optionValue {string | number} current Rider option value in iteration
     * @returns unique identifier for Rider option value
     */
    trackByRiderOption(index: number, optionValue: string | number): string | number {
        return optionValue;
    }

    /**
     * Destroys component and unsubscribes existing subscriptions
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
