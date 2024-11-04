import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, Observable, Subject } from "rxjs";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { map, switchMap } from "rxjs/operators";
import { SettingsDropdownMeta } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { formatCurrency } from "@angular/common";
import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { BenefitAmountState, DependentAgeState } from "../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { RiderComponentStoreService } from "../../../services/rider-component-store/rider-component-store.service";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { ProductId } from "@empowered/ngrx-store/services/plan-offering-helper/plan-offering-helper.constants";
import { PlanPanelService } from "../../../services/plan-panel/plan-panel.service";
import {
    PlanOfferingWithCartAndEnrollment,
    BackdropStyleInput,
    SettingsDropdownName,
    CoverageLevel,
    PlanOffering,
} from "@empowered/constants";

@Component({
    selector: "empowered-plan-settings",
    templateUrl: "./plan-settings.component.html",
    styleUrls: ["./plan-settings.component.scss"],
})
export class PlanSettingsComponent implements OnInit, OnDestroy {
    @Input() backdropAnchor!: HTMLElement;
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // Get PlanOfferingRiders using PlanOffering input bind
    riders$!: Observable<PlanOffering[]>;
    // Get if there are PlanOfferingRiders using PlanOffering input bind
    hasRiders$!: Observable<boolean>;
    // Get number of selected PlanOfferingRiders using PlanOffering input bind
    selectedRidersCount$!: Observable<number>;

    // Get benefit amounts using PlanOffering input bind
    benefitAmounts$!: Observable<number[]>;
    // Get if there are benefit amounts using PlanOffering input bind
    hasBenefitAmounts$!: Observable<boolean>;

    // Get elimination period related CoverageLevels using PlanOffering input bind
    eliminationPeriods$!: Observable<CoverageLevel[]>;
    // Get if there are elimination period related CoverageLevels using PlanOffering input bind
    hasEliminationPeriods$!: Observable<boolean>;

    readonly languageStrings = this.getLanguageStrings();

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService
        .getSelectedProductRiskClassOnAsyncValue()
        .pipe(map((riskClass) => riskClass?.id));

    // Selected BenefitAmount from producerShopComponentStore
    private selectedBenefitAmountState$!: Observable<BenefitAmountState>;

    benefitAmountPortalMeta!: SettingsDropdownMeta;
    ridersPortalMeta!: SettingsDropdownMeta;
    eliminationPeriodPortalMeta!: SettingsDropdownMeta;
    dependentAgePortalMeta!: SettingsDropdownMeta;

    // Selected EliminationPeriod from producerShopComponentStore
    private selectedEliminationPeriod$!: Observable<EliminationPeriod>;

    selectedDependentAge$!: Observable<DependentAgeState>;
    // Used to show/hide dependent age dropdown
    hasDependentAge$!: Observable<boolean>;

    // Gets selected product id
    private selectedProductId$!: Observable<number>;

    // get tobacco information from more settings
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    private readonly unsubscriber$ = new Subject<void>();

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly languageService: LanguageService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly planPanelService: PlanPanelService,
    ) {}

    ngOnInit(): void {
        // selected product Id
        this.selectedProductId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId));
        this.riders$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getPlanOfferingRiders(this.planPanel.planOffering.id)));

        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        this.selectedEliminationPeriod$ = this.producerShopComponentStoreService
            .getEliminationPeriodState(panelIdentifiers)
            .pipe(map((eliminationPeriodState) => eliminationPeriodState?.eliminationPeriod));

        this.selectedBenefitAmountState$ = this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers);

        this.hasRiders$ = this.riders$.pipe(map((riders) => !!riders.length));

        // Listen to validated RiderStates to determine how many riders are selected
        // Validation means that disabled/checked states will toggle based on various changes
        // such as selected CoverageLevel for PlanOffering
        this.selectedRidersCount$ = this.riderComponentStoreService
            .selectValidatedRiderStates(panelIdentifiers)
            .pipe(map((riderStates) => riderStates.filter((riderState) => riderState.checked).length));

        const shoppingCartItemId = this.planPanel.cartItemInfo?.id;

        this.benefitAmounts$ = combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            this.selectedEliminationPeriod$,
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

        this.hasBenefitAmounts$ = this.benefitAmounts$.pipe(map((benefitAmounts) => !!benefitAmounts.length));

        this.eliminationPeriods$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedEliminationPeriods));
        this.hasEliminationPeriods$ = this.eliminationPeriods$.pipe(map((eliminationPeriods) => !!eliminationPeriods.length));

        this.benefitAmountPortalMeta = this.getMeta(
            SettingsDropdownName.BENEFIT_AMOUNT,
            this.selectedBenefitAmountState$.pipe(
                map((benefitAmountState) => formatCurrency(benefitAmountState?.benefitAmount, "en-US", "$", "US", "1.0-0")),
            ),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.coverage.benefitamount"]}:`,
        );

        this.eliminationPeriodPortalMeta = this.getMeta(
            SettingsDropdownName.ELIMINATION_PERIOD,
            this.selectedEliminationPeriod$.pipe(map((eliminationPeriod) => eliminationPeriod?.name)),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.shoppingExperience.eliminationPeriod"]}:`,
        );

        this.ridersPortalMeta = this.getMeta(
            SettingsDropdownName.RIDERS,
            this.getRidersTitle(),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.shopQuote.riders"]}:`,
        );

        // get selected dependent age from producerShopComponentStore
        this.selectedDependentAge$ = this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers);

        // show dependent age dropdown only for juvenileTermLife and juvenileWholeLife
        this.hasDependentAge$ = this.selectedProductId$.pipe(
            map(
                (selectedProductId) =>
                    selectedProductId === ProductId.JUVENILE_TERM_LIFE || selectedProductId === ProductId.JUVENILE_WHOLE_LIFE,
            ),
        );
        this.dependentAgePortalMeta = this.getMeta(
            SettingsDropdownName.DEPENDENT_AGE,
            this.selectedDependentAge$.pipe(map((selectedDependentAge) => selectedDependentAge.dependentAge.toString())),
            this.languageStrings["primary.portal.shared.drop-down-modal.opened"],
            `${this.languageStrings["primary.portal.quickQuote.dependantAge"]}`,
        );
    }

    /**
     * Get meta data for a setting dropdown. Params are properties that change.
     * @param triggerValue dynamic value based on dropdown submission
     * @param portalTitle aria title triggered when opening dropdown
     * @param triggerLabel name of dropdown, optional because "More" doesn't follow standard
     * @returns setting dropdown meta data
     */
    getMeta(
        name: SettingsDropdownName,
        triggerValue: Observable<string>,
        portalTitle: string,
        triggerLabel?: string,
    ): SettingsDropdownMeta {
        return {
            name,
            class: "plan-setting",
            trigger: {
                label: triggerLabel,
                value: triggerValue,
            },
            backdrop: {
                anchor: this.backdropAnchor,
                style: BackdropStyleInput.LIGHT,
            },
            portal: {
                class: `producer-shop ${name}`,
                title: portalTitle,
            },
            footer: {
                apply: this.languageStrings["primary.portal.common.apply"],
                reset: this.languageStrings["primary.portal.common.reset"],
            },
        };
    }

    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.common.reset",
            "primary.portal.common.apply",
            "primary.portal.coverage.benefitamount",
            "primary.portal.shoppingExperience.eliminationPeriod",
            "primary.portal.shopQuote.riders",
            "primary.portal.members.workLabel.addClass",
            "primary.portal.shared.drop-down-modal.opened",
            "primary.portal.quickQuote.dependantAge",
        ]);
    }

    /**
     * Get title for riders dropdown, including a language string and the number of riders from ProduerShopComponentStore
     *
     * @returns Observable of type string that is a language string concatenated with a space and the number of riders
     */
    getRidersTitle(): Observable<string> {
        return this.selectedRidersCount$.pipe(
            map((selectedRidersCount) => {
                if (!selectedRidersCount) {
                    return this.languageStrings["primary.portal.members.workLabel.addClass"];
                }

                return String(selectedRidersCount);
            }),
        );
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
