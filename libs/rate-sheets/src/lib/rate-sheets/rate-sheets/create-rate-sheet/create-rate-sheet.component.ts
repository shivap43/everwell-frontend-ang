import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { Observable, Subject, from, combineLatest } from "rxjs";
import { map, tap, takeUntil, switchMap } from "rxjs/operators";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    PlanSeriesChoice,
    RateSheetSettings,
    PlanOrderElement,
    PlanSeriesPlansOrder,
    DisplayedColumns,
    PlanIds,
    DateFormats,
    PlanSeriesId,
    AsyncData,
    RateSheetPlanSeriesOption,
    RateSheetBenefitAmount,
    RiderChoices,
    Riders,
    AddedPlans,
} from "@empowered/constants";
import { EditPlanOrderComponent } from "./edit-plan-order/edit-plan-order.component";
import { NGRXStore } from "@empowered/ngrx-store";
import { RateSheetsActions, RateSheetsSelectors } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import { select } from "@ngrx/store";
import { RateSheetsComponentStoreService } from "../rate-sheets-component-store/rate-sheets-component-store.service";
import { DatePipe } from "@angular/common";
import { PlanSelections } from "@empowered/api";

@Component({
    selector: "empowered-create-rate-sheet",
    templateUrl: "./create-rate-sheet.component.html",
    styleUrls: ["./create-rate-sheet.component.scss"],
})
export class CreateRateSheetComponent implements OnInit, OnDestroy {
    isSpinnerLoading: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.rateSheets.createRateSheet",
        "primary.portal.rateSheets.rateSheetName",
        "primary.portal.rateSheets.yourRateSheet",
        "primary.portal.rateSheets.selectedPlans",
        "primary.portal.rateSheets.editPlanOrder",
        "primary.portal.rateSheets.downloadRateSheet",
        "primary.portal.rateSheets.productHeader",
        "primary.portal.rateSheets.planHeader",
        "primary.portal.rateSheets.ridersHeader",
    ]);
    displayedColumns = [DisplayedColumns.PRODUCT, DisplayedColumns.PLAN, DisplayedColumns.RIDERS];
    createRateSheetForm: FormGroup;
    planOrder: PlanOrderElement[];
    rateSheetSettings$: Observable<RateSheetSettings> = this.rateSheetsComponentStoreService.selectRateSheetSettings();
    includedPlanSeries$ = this.ngrxStore.pipe(select(RateSheetsSelectors.getIncludedPlanSeries));
    enableEditPlanOrder$ = this.includedPlanSeries$.pipe(
        map(
            (planSeriesMap) => Object.keys(planSeriesMap).length > 1 || planSeriesMap[Object.keys(planSeriesMap)[0]]?.data.value.length > 1,
        ),
    );
    combinedQuickQuotePlansAndPlanSeries$ = this.ngrxStore.onAsyncValue(
        select(RateSheetsSelectors.getCombinedQuickQuotePlansAndPlanSeries),
    );
    includedPlansIds$: Observable<PlanIds>;
    planOrderMaps: PlanSeriesPlansOrder[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly bottomSheetRef: MatBottomSheetRef<CreateRateSheetComponent>,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly ngrxStore: NGRXStore,
        private readonly rateSheetsComponentStoreService: RateSheetsComponentStoreService,
        private readonly elementRef: ElementRef,
        private readonly renderer: Renderer2,
        private readonly datePipe: DatePipe,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * used to call @method initializeForm which initializes FormGroup
     */
    ngOnInit(): void {
        this.isSpinnerLoading = false;
        this.initializeForm();
        this.fetchSelectedPlans();
    }

    /**
     * This method is used to initialize form FormGroup
     */
    initializeForm(): void {
        this.createRateSheetForm = this.fb.group({
            rateSheetTitle: this.languageStrings["primary.portal.rateSheets.yourRateSheet"],
        });
    }

    /**
     * This method is used to fetch selected plan data for the table
     */
    fetchSelectedPlans(): void {
        // Get productId, planSeriesId, planId, and riderSelections for each plan in rate sheet
        let includedPlansIds: PlanIds[] = [];
        combineLatest([this.includedPlanSeries$, this.combinedQuickQuotePlansAndPlanSeries$])
            .pipe(
                tap(([planSeriesMap, combinedQuickQuotePlansAndPlanSeries]) => {
                    for (const key in planSeriesMap) {
                        if (Object.prototype.hasOwnProperty.call(planSeriesMap, key)) {
                            for (const plan of planSeriesMap[key].data.value) {
                                includedPlansIds = [
                                    ...includedPlansIds,
                                    {
                                        productId: planSeriesMap[key].identifiers.productId,
                                        planSeriesId: planSeriesMap[key].identifiers.planSeriesId,
                                        planId: plan.planId,
                                        sortingIndex: combinedQuickQuotePlansAndPlanSeries.findIndex(
                                            (product) => product.product.id === planSeriesMap[key].identifiers.productId,
                                        ),
                                        planSeriesCategory: plan?.planSeriesCategory,
                                    },
                                ];
                            }
                        }
                    }
                    // sorting the plans based on order in which they should be displayed on ui
                    includedPlansIds.sort((a, b) => a.sortingIndex - b.sortingIndex);
                    this.includedPlansIds$ = from(includedPlansIds);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Get plan info
        const includedPlans$ = this.includedPlansIds$.pipe(
            switchMap((planIds) =>
                this.combinedQuickQuotePlansAndPlanSeries$.pipe(
                    // Filter product
                    map(
                        (planSeriesAndProductMap) =>
                            planSeriesAndProductMap.filter(
                                (planSeriesAndProduct) => planSeriesAndProduct.product.id === planIds["productId"],
                            )[0],
                    ),
                    // Filter plan series
                    map(
                        (planSeriesAndProduct) =>
                            planSeriesAndProduct.planSeries.filter(
                                (planSeries) =>
                                    planSeries.id === planIds["planSeriesId"] &&
                                    (!planSeries.categories || planSeries.categories.toString() === planIds["planSeriesCategory"]),
                            )[0],
                    ),
                    // Filter plan
                    map((planSeries) => planSeries.plans.filter((plan) => plan.id === planIds["planId"])[0]),
                ),
            ),
            takeUntil(this.unsubscribe$),
        );

        // Add plans to table
        this.planOrder = [];
        includedPlans$
            .pipe(
                switchMap((plan) =>
                    combineLatest([
                        this.ngrxStore.pipe(
                            select(
                                RateSheetsSelectors.getRateSheetPlanSelections(plan.product.id, plan.planSeriesId, plan.planSeriesCategory),
                            ),
                        ),
                        this.ngrxStore.pipe(select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(plan.product.id, plan.planSeriesId))),
                    ]).pipe(
                        tap(([planSelections, planSeriesOptions]) => {
                            // Get riders count for plan
                            let riders = [];
                            planSelections.value.map((planSelection) => {
                                if (planSelection.planId === plan.id) {
                                    planSelection.riderSelections
                                        ?.filter((riderSelection) => riderSelection.selected)
                                        .forEach((riderSelection) => {
                                            // Get rider plan from options data
                                            // NOTE: using rider.planName to find correct rider plan
                                            // because riderSelection only uses rider.planId from first plan in plan series
                                            // (can't match on rider.planId if selected plan is not first in plan series)
                                            const riderPlan = planSeriesOptions.value
                                                .filter((option) => option.planId === planSelection.planId)[0]
                                                .riders.filter((rider) => rider.planName === riderSelection.planName)[0];
                                            if (riderPlan) {
                                                riders = [...riders, riderPlan];
                                            }
                                        });
                                }
                            });

                            // Push table data for plan
                            this.planOrder = [
                                ...this.planOrder,
                                {
                                    product: plan.product.name,
                                    plan: plan.name,
                                    riders: riders.length,
                                    productId: plan.product.id,
                                    planId: plan.id,
                                    planSeriesId: plan.planSeriesId,
                                    planSeriesCategory: plan.planSeriesCategory,
                                },
                            ];
                        }),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Open quasi-modal to download rate sheet
     */
    editPlanOrder(): void {
        this.empoweredModalService
            .openDialog(EditPlanOrderComponent, { data: this.planOrder })
            .afterClosed()
            .subscribe((updatedPlanOrder) => {
                if (updatedPlanOrder) {
                    this.planOrder = [...updatedPlanOrder];
                }
            });
    }

    /**
     * Create map with planIds and displayOrder for each planSeriesId
     */
    getPlanOrderMaps(): void {
        let displayOrder = 0;
        let planSeriesIdIndex = -1;
        let planSeriesCategoryIndex = -1;
        let productIdIndex = -1;
        let planIdString, displayOrderString;
        for (const plan of this.planOrder) {
            // Add plansMap (planId + displayOrder) for planSeriesId/productId of all included plans
            displayOrder++;
            planSeriesIdIndex = this.planOrderMaps.findIndex((planOrderMap) => planOrderMap.planSeriesId === plan.planSeriesId);
            planSeriesCategoryIndex = this.planOrderMaps.findIndex(
                (planOrderMap) => planOrderMap.planSeriesCategory === plan.planSeriesCategory,
            );
            productIdIndex = this.planOrderMaps.findIndex((planOrderMap) => planOrderMap.productId === plan.productId);
            planIdString = plan.planId.toString();
            displayOrderString = displayOrder.toString();

            const isPlanSeriesAdded =
                plan.planSeriesId === PlanSeriesId.ADV_DENTAL
                    ? planSeriesIdIndex > -1 && planSeriesCategoryIndex > -1
                    : planSeriesIdIndex > -1;
            const isProductAdded = productIdIndex > -1;

            if (isPlanSeriesAdded && isProductAdded) {
                // If map exists for planSeriesId/productId, add new key-value pair and skip rest of loop
                const index = plan.planSeriesId === PlanSeriesId.ADV_DENTAL ? planSeriesCategoryIndex : planSeriesIdIndex;
                this.planOrderMaps[index].plansMap[planIdString] = displayOrderString;

                continue;
            }
            // Create new map for planSeriesId/productId
            const record: Record<string, string> = {};
            record[planIdString] = displayOrderString;
            this.planOrderMaps = [
                ...this.planOrderMaps,
                {
                    planSeriesId: plan.planSeriesId,
                    productId: plan.productId,
                    plansMap: record,
                    planSeriesCategory: plan.planSeriesCategory,
                },
            ];
        }
    }

    /**
     * Get benefit amounts from plan selections data
     *
     * @param planSelections PlanSelections[] data for selected plans in a single plan series
     * @returns benefitAmounts array with numbers or RateSheetBenefitAmount objects
     */
    getBenefitAmounts(planSelections: AsyncData<PlanSelections[]>): number[] | RateSheetBenefitAmount[] {
        let benefitAmounts = [];
        if (planSelections.value[0].benefitAmounts) {
            planSelections.value[0].benefitAmounts.forEach((benefitAmountObject) => {
                if (benefitAmountObject.minBenefitAmount) {
                    benefitAmounts = [...benefitAmounts, benefitAmountObject];
                } else if (benefitAmountObject.benefitAmountSelected) {
                    benefitAmounts = [...benefitAmounts, benefitAmountObject.benefitAmountSelected.amount];
                } else {
                    benefitAmounts = [...benefitAmounts, benefitAmountObject.amount];
                }
            });
        }
        return benefitAmounts;
    }

    /**
     * Get riders data from plan selections data
     *
     * @param planSelections PlanSelections[] data for selected plans in a single plan series
     * @param planSeriesOptions RateSheetPlanSeriesOption[] data for all plans in a single plan series
     * @returns Riders object with RidersChoices[], spouseGender, and spouseTobaccoStatus
     */
    getRiders(planSelections: AsyncData<PlanSelections[]>, planSeriesOptions: AsyncData<RateSheetPlanSeriesOption[]>): Riders {
        let coverageLevelIds: number[] = [];
        let riderChoices: RiderChoices;
        let ridersChoices: RiderChoices[] = [];
        let spouseGender: string = null;
        let spouseTobaccoStatus: string = null;

        planSelections.value.forEach((planSelection) => {
            planSelection.riderSelections
                ?.filter((riderSelection) => riderSelection.selected)
                .forEach((riderSelection) => {
                    // Get rider plan from options data
                    // NOTE: using rider.planName to find correct rider plan
                    // because riderSelection only uses rider.planId from first plan in plan series
                    // (can't match on rider.planId if selected plan is not first in plan series)
                    const riderPlan = planSeriesOptions.value
                        .filter((option) => option.planId === planSelection.planId)[0]
                        .riders.filter((rider) => rider.planName === riderSelection.planName)[0];
                    if (riderPlan) {
                        // Get coverageLevelIds from options
                        coverageLevelIds = [];
                        Object.keys(riderPlan.coverageLevelOptionsMap)
                            .map(Number)
                            .forEach((key) => {
                                if (planSelection.coverageLevelIds?.includes(key) || planSelection.eliminationPeriods?.includes(key)) {
                                    riderPlan.coverageLevelOptionsMap[key].forEach((coverageLevel) => {
                                        coverageLevelIds = [...coverageLevelIds, coverageLevel.id];
                                    });
                                }
                            });
                        // Push data to ridersChoices array (exclude bad data where benefitAmount stored as string)
                        riderChoices = {
                            planId: riderPlan.planId,
                            benefitAmount: typeof riderSelection?.benefitAmount === "number" ? riderSelection.benefitAmount : null,
                            coverageLevelIds: coverageLevelIds,
                        };
                        ridersChoices = [...ridersChoices, riderChoices];
                        // Get spouse gender and tobacco status
                        if (riderSelection?.spouseGender || riderSelection?.spouseTobaccoStatus) {
                            spouseGender = riderSelection?.spouseGender;
                            spouseTobaccoStatus = riderSelection?.spouseTobaccoStatus;
                        }
                    }
                });
        });
        return { ridersChoices, spouseGender, spouseTobaccoStatus } as Riders;
    }

    /**
     * This method will be called on click of download rate sheet
     * used to call @method getPlanOrderMap which creates an array of maps with plan Ids and display order
     */
    downloadRateSheetAndClose(): void {
        this.isSpinnerLoading = true;
        const rateSheetTitle: string = this.createRateSheetForm.get("rateSheetTitle").value;
        let planSeriesChoice: PlanSeriesChoice;
        let benefitAmounts;
        let riders: Riders;
        let planSeriesChoices: PlanSeriesChoice[] = [];
        let addedPlans: AddedPlans[] = [];

        this.getPlanOrderMaps();

        // Get plan series choices
        this.includedPlansIds$
            .pipe(
                switchMap((planIds) =>
                    combineLatest([
                        this.ngrxStore.pipe(
                            select(
                                RateSheetsSelectors.getRateSheetPlanSelections(
                                    planIds["productId"],
                                    planIds["planSeriesId"],
                                    planIds["planSeriesCategory"],
                                ),
                            ),
                        ),
                        this.ngrxStore.pipe(
                            select(RateSheetsSelectors.getRateSheetPlansSeriesSettings(planIds["productId"], planIds["planSeriesId"])),
                        ),
                        this.ngrxStore.pipe(
                            select(RateSheetsSelectors.getRateSheetPlanSeriesOptions(planIds["productId"], planIds["planSeriesId"])),
                        ),
                    ]).pipe(
                        tap(([planSelections, planSeriesSettings, planSeriesOptions]) => {
                            const isProductAdded = !(addedPlans.findIndex((addedPlan) => addedPlan.productId === planIds.productId) === -1);
                            const isPlanSeriesAdded = !(planIds.planSeriesId === PlanSeriesId.ADV_DENTAL &&
                            addedPlans.findIndex((addedPlan) => addedPlan.planSeriesCategory != null) !== -1
                                ? addedPlans.findIndex((addedPlan) => addedPlan.planSeriesCategory === planIds.planSeriesCategory) === -1
                                : addedPlans.findIndex((addedPlan) => addedPlan.planSeriesId === planIds.planSeriesId) === -1);

                            // Add data to planSeriesChoices array if plan series/product has not already been added
                            if (!isPlanSeriesAdded || !isProductAdded) {
                                // Parse benefitAmounts for different products
                                benefitAmounts = this.getBenefitAmounts(planSelections);
                                // Get riders
                                riders = this.getRiders(planSelections, planSeriesOptions);
                                // Add plan series data to planSeriesChoice object to push to array
                                planSeriesChoice = {
                                    planIdPdfOrderMap: this.planOrderMaps.find((element) =>
                                        element.planSeriesId === PlanSeriesId.ADV_DENTAL
                                            ? element.planSeriesId === planIds.planSeriesId &&
                                              element.productId === planIds.productId &&
                                              element.planSeriesCategory === planIds.planSeriesCategory
                                            : element.planSeriesId === planIds["planSeriesId"] && element.productId === planIds.productId,
                                    ).plansMap,
                                    genders: planSeriesSettings.value.settings?.genders,
                                    tobaccoStatuses: planSeriesSettings.value.settings?.tobaccoStatuses,
                                    ageBands: planSeriesSettings.value.settings.ageBands,
                                    coverageLevelChoices: {
                                        coverageLevelIds:
                                            planSelections.value[0]?.coverageLevelIds || planSelections.value[0]?.eliminationPeriods,
                                    },
                                    spouseGender: riders?.spouseGender,
                                    spouseTobaccoStatus: riders?.spouseTobaccoStatus,
                                    benefitAmounts: benefitAmounts[0]?.minBenefitAmount ? null : benefitAmounts,
                                    benefitRange: benefitAmounts[0]?.minBenefitAmount
                                        ? {
                                            minBenefitAmount: benefitAmounts[0].minBenefitAmount.amount,
                                            maxBenefitAmount: benefitAmounts[0].maxBenefitAmount.amount,
                                        }
                                        : null,
                                    ridersChoices: riders?.ridersChoices,
                                } as PlanSeriesChoice;
                                planSeriesChoices = [...planSeriesChoices, planSeriesChoice];
                                addedPlans = [
                                    ...addedPlans,
                                    {
                                        planSeriesId: planIds.planSeriesId,
                                        productId: planIds.productId,
                                        planSeriesCategory: planIds.planSeriesCategory,
                                    },
                                ];
                            }
                        }),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Get rate sheet settings
        this.rateSheetSettings$
            .pipe(
                tap((settings) => {
                    // downloadRateSheet api is called
                    this.ngrxStore.dispatch(
                        RateSheetsActions.downloadRateSheet({
                            state: settings.state,
                            partnerAccountType: settings.partnerAccountType,
                            payrollFrequencyId: settings.payrollFrequencyId,
                            riskClassId: settings.riskClassId,
                            rateSheetTitle: rateSheetTitle,
                            planSeriesChoices: planSeriesChoices,
                            zipCode: settings?.zipCode,
                            sicCode: settings?.sicCode ? Number(settings.sicCode) : null,
                            eligibleSubscribers: settings?.eligibleSubscribers,
                        }),
                    );
                }),
                switchMap((settings) =>
                    // gets the downloadRateSheet api response from the store
                    this.ngrxStore.onAsyncValue(
                        select(
                            RateSheetsSelectors.getDownloadRateSheetResponse(
                                settings.state,
                                settings.partnerAccountType,
                                settings.payrollFrequencyId,
                                settings.riskClassId,
                                rateSheetTitle,
                                settings?.zipCode,
                                settings?.sicCode ? Number(settings.sicCode) : null,
                                settings?.eligibleSubscribers,
                            ),
                        ),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((response) => {
                // downloads the rateSheet pdf with particular name format
                const currentDate = this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR_HYPHEN);
                const link = this.renderer.createElement("a");
                this.renderer.setAttribute(link, "download", rateSheetTitle + "_" + currentDate.toString());
                this.renderer.setAttribute(link, "href", response);
                this.renderer.setAttribute(link, "target", "_blank");
                this.renderer.appendChild(this.elementRef.nativeElement, link);
                link.click();
                this.renderer.removeChild(this.elementRef.nativeElement, link);
                // revoking the object URL in order to avoid it from being piled up on browser's memory
                setTimeout(() => {
                    window.URL.revokeObjectURL(response);
                }, 1000);
                // closes the create-rate-sheet component after pdf download
                this.isSpinnerLoading = false;
                this.bottomSheetRef.dismiss();
            });
    }

    /**
     * Cleans up subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
