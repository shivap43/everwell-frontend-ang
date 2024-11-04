import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { filter, map, mapTo, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { combineLatest, merge, Observable, Subject } from "rxjs";
// eslint-disable-next-line max-len
import { ProducerShopComponentStoreService } from "../../../../services/producer-shop-component-store/producer-shop-component-store.service";
import {
    BenefitAmountState,
    PanelIdentifiers,
} from "../../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { PlanPanelService } from "../../../../services/plan-panel/plan-panel.service";
import { PlanOfferingService } from "../../../../services/plan-offering/plan-offering.service";
import { ProducerShopHelperService } from "../../../../services/producer-shop-helper/producer-shop-helper.service";
import { PlanOfferingWithCartAndEnrollment, SettingsDropdownName } from "@empowered/constants";
import { DropDownPortalComponent, SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";

@Component({
    selector: "empowered-benefit-amount",
    templateUrl: "./benefit-amount.component.html",
    styleUrls: ["./benefit-amount.component.scss"],
})
export class BenefitAmountComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
    @Input() portalRef?: DropDownPortalComponent;

    // Observable of boolean to check whether plan offering is supplementary plan
    isSupplementaryPlan$!: Observable<boolean>;

    // Get benefit amounts using PlanOffering input bind
    benefitAmounts$!: Observable<number[]>;

    // Get BenefitAmountState using ProducerShopComponentStore
    private benefitAmountState$!: Observable<BenefitAmountState>;

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService
        .getSelectedProductRiskClassOnAsyncValue()
        .pipe(map((riskClass) => riskClass?.id));

    readonly form: FormGroup;

    // Used to determine when FormGroup should revert
    private readonly onRevert$ = new Subject<void>();
    // Used to determine when FormGroup should reset
    private readonly onReset$ = new Subject<void>();
    // Used to determine when FormGroup should submit
    private readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();

    showResetButton$!: Observable<boolean>;

    // get tobacco information from more settings
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    constructor(
        private readonly fb: FormBuilder,
        private readonly ngrxStore: NGRXStore,
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly planPanelService: PlanPanelService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly producerShopHelperService: ProducerShopHelperService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.BENEFIT_AMOUNT);
        this.form = this.fb.group({
            selectedBenefitAmount: [null, Validators.required],
        });
    }

    ngOnInit(): void {
        // We should call onInit before anything else
        // Pass isExpanded$ Observable since there are multiple PlanSettings dropdowns per Producer Shop:
        // there can be more than one BenefitAmount dropdown at a time (one for each plan panel)
        super.onInit(this.producerShopHelperService.isSelectedPlanPanel(this.planPanel));

        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        const shoppingCartItemId = this.planPanel.cartItemInfo?.id;

        // Elimination Period data based on planId from ProducerShopComponentStore
        const eliminationPeriod$ = this.producerShopComponentStoreService
            .getEliminationPeriodState(panelIdentifiers)
            .pipe(map((eliminationPeriodState) => eliminationPeriodState?.eliminationPeriod));

        this.isSupplementaryPlan$ = this.ngrxStore
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

        // List of benefit amounts options for the plan
        this.benefitAmounts$ = combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            eliminationPeriod$,
            this.selectedTobaccoInformation$,
        ]).pipe(
            switchMap(([riskClassId, coverageEffectiveDate, eliminationPeriod, selectedTobaccoInformation]) =>
                this.ngrxStore.onAsyncValue(
                    select(
                        PlanOfferingsSelectors.getBenefitAmounts(
                            selectedTobaccoInformation,
                            this.planPanel.planOffering.id,
                            riskClassId,
                            coverageEffectiveDate,
                            eliminationPeriod?.id,
                            shoppingCartItemId,
                        ),
                    ),
                ),
            ),
        );

        combineLatest([this.benefitAmounts$, this.isSupplementaryPlan$])
            .pipe(
                tap(([benefitAmount, isSupplementaryPlan]) => {
                    // Only enable if there's more than 1 benefit amount or belongs to a supplementary plan
                    this.portalRef.disableClick = benefitAmount.length === 1 || isSupplementaryPlan;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Benefit Amount data based on planId from ProducerShopComponentStore
        this.benefitAmountState$ = this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers).pipe(
            // Capture when benefitAmounts$ emits a value
            withLatestFrom(this.benefitAmounts$.pipe(mapTo(true), startWith(false))),
            // Filter until benefitAmounts$ emit a first value
            filter(([_, initializedBenefitAmountState]) => !!initializedBenefitAmountState),
            map(([producerShopBenefitAmountState]) => producerShopBenefitAmountState),
        );

        // Whenever `Apply` is clicked:
        // 1. Validate Form
        // 2. Update ProducerShopComponentStore
        // 3. Close benefit amount dropdown
        this.onApply$
            .pipe(
                tap(() => {
                    this.handleOnApply(panelIdentifiers);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Listen for values from ProducerShopComponentStore to populate forms.
        // Handle initializing / reverting form
        combineLatest([
            // revert happens on hidden instead of shown since form change animations might show during the dropdown rendering
            // revert form onHide
            this.onRevert$.pipe(mapTo(true), startWith(false)),
            // ProducerShopComponentStore benefitAmountState
            this.benefitAmountState$,
        ])
            .pipe(
                // Ignore first value since we don't care about the value emitted by onRevert$
                tap(([revert, producerShopBenefitAmount]) => {
                    this.handleOnRevert(revert, producerShopBenefitAmount.benefitAmount);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Handle initializing / resetting form
        // reset form on reset click
        this.onReset$
            .pipe(
                // ProducerShopComponentStore benefitAmountState
                withLatestFrom(this.benefitAmounts$),
                // Ignore first value since we don't care about the value emitted by onReset$
                tap(([, benefitAmounts]) => {
                    this.handleOnReset(benefitAmounts[0], panelIdentifiers);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // show/hide reset button on Benefit amounts dropdown
        this.showResetButton$ = merge(this.form.valueChanges, this.onRevert$, this.onReset$, this.onApply$)
            .pipe(startWith(false))
            .pipe(
                withLatestFrom(this.benefitAmounts$),
                map(([, benefitAmounts]) => this.form.controls.selectedBenefitAmount.value !== benefitAmounts[0]),
            );
    }

    /**
     * when apply button click update benefitAmountState with form/selected value.
     * @param panelIdentifiers current panel identifiers
     */
    handleOnApply(panelIdentifiers: PanelIdentifiers): void {
        // Trigger for validity and render error messages
        this.form.markAllAsTouched();

        // Exit early if FormGroup isn't valid
        if (!this.form.valid) {
            return;
        }
        const benefitAmount: number = this.form.controls.selectedBenefitAmount.value;

        // Update ProducerShopComponentStore with form value (selected value)
        this.producerShopComponentStoreService.upsertBenefitAmountState({ benefitAmount, panelIdentifiers });

        // Assuming FormGroup is valid, close dropdown
        this.portalRef?.hide();
    }

    /**
     * Reset form value back to initial/reset state value and update component store on reset button click
     *
     * @param benefitAmount benefit amount initial/reset state values
     * @param panelIdentifiers current panel identifiers
     */
    handleOnReset(benefitAmount: number, panelIdentifiers: PanelIdentifiers): void {
        // Set form value to its initial value
        this.setFormValues(benefitAmount);

        // Update ProducerShopComponentStore with reset state value
        this.producerShopComponentStoreService.upsertBenefitAmountState({
            benefitAmount,
            panelIdentifiers,
        });

        // Close dropdown
        this.portalRef?.hide();
        // Mark form as pristine to remove dirty flag
        this.form.markAsPristine();
    }

    /**
     * Revert form value back to last selected value in form on revert/hide
     *
     * @param revert {boolean} - determine whether to revert benefitAmount selection or not.
     * @param benefitAmount benefit amount value from benefitAmountState
     */
    handleOnRevert(revert: boolean, benefitAmount: number): void {
        // Local state of this benefitAmount dropdown doesn't get stored into the ProducerShopComponentStore until apply/submit
        this.setFormValues(benefitAmount);

        if (revert) {
            // Then mark form as pristine to remove dirty flag
            this.form.markAsPristine();
        }
    }

    /**
     * Set form values, and populate it using benefitAmountState
     *
     * @param benefitAmount benefitAmount that determines the value of form
     */
    setFormValues(benefitAmount: number): void {
        this.form.controls.selectedBenefitAmount.setValue(benefitAmount);
    }

    /**
     * function executes on hiding
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on show
     */
    onShow(): void {
        this.onShow$.next();
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
     * Is used to emit when to revert FormGroup
     */
    onRevert(): void {
        this.onRevert$.next();
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
     * Returns unique identifier for BenefitAmount numeric value.
     * trackBy for *ngFor involving BenefitAmount used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param benefitAmount {number} current BenefitAmount numeric value in iteration
     * @returns unique identifier for BenefitAmount numeric value
     */
    trackByBenefitAmount(index: number, benefitAmount: number): number {
        return benefitAmount;
    }

    /**
     * Call base class ngOnDestroy.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
