import { Component, OnDestroy, ViewChild, OnInit } from "@angular/core";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { RateSheetsComponentStoreService } from "../rate-sheets-component-store/rate-sheets-component-store.service";
import {
    CarrierId,
    MissingInfoType,
    PlanSeries,
    PlanSeriesCategory,
    ProductId,
    RateSheetPlanSeriesOption,
    RateSheetSettings,
} from "@empowered/constants";
import { MatAccordion } from "@angular/material/expansion";
import { map, switchMap, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { LanguageService } from "@empowered/language";

const moreSettings = { eligibleEmployees: "Eligible employees", sicCode: "SIC/ABI code", zipCode: "Zip code" };

@Component({
    selector: "empowered-plan-series",
    templateUrl: "./plan-series.component.html",
    styleUrls: ["./plan-series.component.scss"],
})
export class PlanSeriesComponent implements OnInit, OnDestroy {
    @ViewChild(MatAccordion) accordion: MatAccordion;
    MAC = PlanSeriesCategory.MAC;
    PPO = PlanSeriesCategory.PPO;
    aflacGroupCarrierID = CarrierId.AFLAC_GROUP;
    dentalProductId = ProductId.DENTAL;
    rateSheetSettings$: Observable<RateSheetSettings> = this.rateSheetsComponentStoreService.selectRateSheetSettings();
    selectedProduct$ = this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getSelectedProduct)).pipe(
        withLatestFrom(this.rateSheetSettings$),
        map(([combinedPlanAndPlanSeries, settings]) => {
            // When eligible subscribers are more then 99 then remove vision group plan series
            if (
                settings.eligibleSubscribers > 99 &&
                (combinedPlanAndPlanSeries.product.id === ProductId.VISION || combinedPlanAndPlanSeries.product.id === ProductId.DENTAL)
            ) {
                combinedPlanAndPlanSeries.planSeries = combinedPlanAndPlanSeries.planSeries.filter((planSeries) =>
                    planSeries.plans.some((plan) => plan.carrierId !== CarrierId.ADV),
                );
            }
            return combinedPlanAndPlanSeries;
        }),
    );
    selectedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getSelectedPlanSeries));
    disable = new Map<number, boolean>();
    moreSettingsProperties = [];
    toolTipMessage: string;
    requiredProperties: MissingInfoType[] = [];
    selectedRateSheetPlanSeriesOptions$: Observable<RateSheetPlanSeriesOption[]>;
    includedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getIncludedPlanSeries));
    expandedPlanSeries: PlanSeries;

    // This is to ensure panel content is destroyed when the panel is closed
    readonly panelOpenSubject$ = new BehaviorSubject(false);
    panelOpen$ = this.panelOpenSubject$.asObservable();
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly language: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
    ) {}

    ngOnInit(): void {
        this.selectedProduct$
            .pipe(withLatestFrom(this.rateSheetSettings$), takeUntil(this.unsubscribe$))
            .subscribe(([selectedProduct, rateSheetSettings]) => {
                selectedProduct.planSeries.forEach((planSeries) => {
                    planSeries.plans?.forEach((plan) => {
                        plan?.planDetails?.requiredPriceRateProperties?.forEach((requiredProperty) => {
                            if (!this.requiredProperties.includes(requiredProperty)) {
                                this.addMoreSettingsProperty(requiredProperty);
                                this.requiredProperties.push(requiredProperty);
                            }
                        });
                    });

                    this.removeProperties(rateSheetSettings);
                    this.disablePlanSeries(planSeries);
                    this.generateMissingInfoToolTip();
                });
            });
    }

    /**
     * Disable plan series.
     * @param planSeries Plan Series.
     */
    disablePlanSeries(planSeries: PlanSeries): void {
        this.disable[planSeries.id] =
            planSeries.plans.some((plan) => plan.planDetails?.requiredPriceRateProperties?.length > 0) &&
            this.moreSettingsProperties?.length > 0;
    }

    /**
     * Remove properties from moreSettingsProperties and  requiredProperties array.
     * @param rateSheetSettings Rate sheet settings.
     */
    removeProperties(rateSheetSettings: RateSheetSettings): void {
        if (!rateSheetSettings || !(this.moreSettingsProperties?.length > 0)) {
            return;
        }
        if (rateSheetSettings.eligibleSubscribers && this.moreSettingsProperties?.includes(moreSettings.eligibleEmployees)) {
            this.removeRequiredProperty(MissingInfoType.ELIGIBLE_EMPLOYEES);
            this.removeMoreSettingProperty(moreSettings.eligibleEmployees);
        }
        if (rateSheetSettings.sicCode && this.moreSettingsProperties?.includes(moreSettings.sicCode)) {
            this.removeRequiredProperty(MissingInfoType.SIC_CODE);
            this.removeMoreSettingProperty(moreSettings.sicCode);
        }
        if (rateSheetSettings.zipCode && this.moreSettingsProperties?.includes(moreSettings.zipCode)) {
            this.removeRequiredProperty(MissingInfoType.WORK_ZIP_STATE);
            this.removeMoreSettingProperty(moreSettings.zipCode);
        }
    }

    /**
     * Add property into MissingElement array.
     * @param property property that needs to Add.
     */
    addMoreSettingsProperty(property: MissingInfoType): void {
        if (property === MissingInfoType.ELIGIBLE_EMPLOYEES) {
            this.moreSettingsProperties.push(moreSettings.eligibleEmployees);
        }
        if (property === MissingInfoType.SIC_CODE) {
            this.moreSettingsProperties.push(moreSettings.sicCode);
        }
        if (property === MissingInfoType.WORK_ZIP_STATE) {
            this.moreSettingsProperties.push(moreSettings.zipCode);
        }
    }

    /**
     * Remove Required property from the requiredProperties array when user update more setting.
     * @param property property that needs to remove.
     */
    removeRequiredProperty(property: MissingInfoType): void {
        const index: number = this.requiredProperties?.indexOf(property);
        this.requiredProperties?.splice(index, 1);
    }

    /**
     * Remove property from the moreSettingsProperties array when user update more setting.
     * @param property property that needs to remove.
     */
    removeMoreSettingProperty(property: string): void {
        const index: number = this.moreSettingsProperties?.indexOf(property);
        this.moreSettingsProperties?.splice(index, 1);
    }

    /**
     * Generate Missing Info ToolTip for ADV plan series
     */
    generateMissingInfoToolTip(): void {
        const message = this.language.fetchPrimaryLanguageValue("primary.portal.quickQuote.missingInfo.forRateSheet");
        this.toolTipMessage = message + this.moreSettingsProperties.reduce((list, element) => `${list}<li>${element}</li>`, "");
    }

    /**
     * Executes on expansion of the plans series panel.
     *
     * @param planSeriesId plan series id
     */
    onExpand(planSeries: PlanSeries): void {
        // current planSeries that is expanded
        this.expandedPlanSeries = planSeries;
        this.panelOpenSubject$.next(true);
        this.ngrxStore.dispatch(RateSheetsActions.setSelectedPlanSeries({ planSeries }));
        this.selectedRateSheetPlanSeriesOptions$ = this.selectedProduct$.pipe(
            switchMap(({ product: { id } }) =>
                this.ngrxStore.onAsyncValue(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(id, planSeries.id))),
            ),
        );
    }

    /**
     * Executes on closing of the plans series panel.
     */
    onClose(planSeriesId: number) {
        // executes only if user manually closes the panel that is currently expanded
        if (this.expandedPlanSeries.id === planSeriesId) {
            this.panelOpenSubject$.next(false);
        }
    }

    closeAllPanels(): void {
        this.accordion?.closeAll();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
