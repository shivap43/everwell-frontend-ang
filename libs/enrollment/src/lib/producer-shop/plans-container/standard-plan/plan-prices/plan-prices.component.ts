import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { distinctUntilChanged, map, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";

import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { CoverageLevelPrice, PlanOfferingPriceTableRow } from "./plan-prices.model";
import { PlanOfferingService } from "../../../services/plan-offering/plan-offering.service";
import { POSITION } from "./plan-prices.constants";
import { CurrencyPipe, formatCurrency } from "@angular/common";
import { RiderComponentStoreService } from "../../../services/rider-component-store/rider-component-store.service";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import { RiderStateWithPlanPricings } from "../../../services/rider-component-store/rider-component-store.model";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { AMOUNT_ZERO } from "../../plans-container.constant";
import {
    CarrierId,
    PlanOfferingPricingCoverage,
    PlanOfferingWithCartAndEnrollment,
    CoverageLevelNames,
    KnockoutType,
    CoverageLevel,
    CountryState,
    PlanOfferingPricing,
    MemberFlexDollar,
    ContributionType,
    Characteristics,
    PlanFlexDollarOrIncentives,
} from "@empowered/constants";
import { PlanPanelService } from "../../../services/plan-panel/plan-panel.service";
import { ProducerShopHelperService } from "../../../services/producer-shop-helper/producer-shop-helper.service";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";

@Component({
    selector: "empowered-plan-prices",
    templateUrl: "./plan-prices.component.html",
    styleUrls: ["./plan-prices.component.scss"],
})
export class PlanPricesComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    contributionType = ContributionType;
    // Get PlanOfferingPricingCoverages using PlanOffering input bind
    // Used to populate mat-table for BASE PlanOffering
    private planOfferingPricingCoverage$!: Observable<PlanOfferingPricingCoverage[]>;

    // Get CoverageLevels using PlanOffering input bind
    private selectedCoverageLevels$!: Observable<CoverageLevel[]>;

    // Get RiderStateWithPlanPricings using PlanOffering input bind
    // Used to populate mat-table for RIDER PlanOfferings
    private riderStateWithPlanPricings$!: Observable<RiderStateWithPlanPricings[]>;

    // Observable of boolean to check whether plan offering is supplementary plan
    isSupplementaryPlan$!: Observable<boolean>;

    // Get totalPrice using PlanOffering input bind
    totalPrices$!: Observable<string[]>;

    position = POSITION;

    // Get displayNames using PlanOffering input bind
    displayName$!: Observable<[string, ...CoverageLevelNames[]]>;

    // Get PlanOfferingPriceTableRows using PlanOffering input bind
    dataSource$!: Observable<PlanOfferingPriceTableRow[]>;

    isExpandedPanel$!: Observable<boolean>;

    readonly payFrequency$ = this.ngrxStore
        .onAsyncValue(select(MembersSelectors.getSelectedMemberPayFrequency))
        .pipe(map(({ name }) => name));

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService.getSelectedProductRiskClassOnAsyncValue().pipe(
        map((riskClass) => riskClass?.id),
        distinctUntilChanged(),
    );

    // Get applied flex dollar for cart items
    private readonly appliedFlexDollars$ = this.ngrxStore.onAsyncValue(
        select(ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCart),
    );
    appliedCartFlexDollar$!: Observable<PlanFlexDollarOrIncentives | null>;

    // Gets selected coverage level id using PlanOffering input bind
    private selectedCoverageLevel$!: Observable<CoverageLevel>;
    selectedCoverageLevelId$!: Observable<number | null>;

    // Gets plan eligibility based on knockouts
    private readonly knockoutPlanEligibility$ = this.producerShopComponentStoreService.selectPlanKnockoutEligibility();

    // holds record of coverage level id, if its spouse knockout or not
    private coverageLevelsKnockoutData$: Observable<Record<number, boolean>>;
    // Get selected member flex dollars data (Employer contributions)
    private readonly selectedMemberFlexDollars$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberFlexDollars));
    // Get employer contribution excluded states from config
    private readonly employerContributionExcludedStates$ = this.ngrxStore.onAsyncValue(
        select(SharedSelectors.getEmployerContributionExcludedStates),
    );
    // Get selected state
    private readonly selectedCountryState$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentState));

    private showEmployerContributions$!: Observable<boolean>;

    readonly languageStrings = this.getLanguageStrings();

    // Get the latest tobacco status based on dropdown
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    private readonly unsubscribe$ = new Subject<void>();

    readonly coverageLevelIdSelected$ = new Subject<number>();

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly language: LanguageService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly rxjsService: RXJSService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly currencyPipe: CurrencyPipe,
    ) {}

    ngOnInit(): void {
        const planOfferingId = this.planPanel.planOffering.id;
        const planId = this.planOfferingService.getPlanId(this.planPanel.planOffering);
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);
        const cartItemId = this.planPanel?.cartItemInfo?.id;
        // Get flex dollar applied for the selected plan with cart id else return null
        this.appliedCartFlexDollar$ = cartItemId
            ? this.appliedFlexDollars$.pipe(
                map((appliedFlexDollar) =>
                    appliedFlexDollar?.planFlexDollarOrIncentives?.find((flexDollar) => flexDollar?.cartItemId === cartItemId),
                ),
            )
            : of(null);

        this.isExpandedPanel$ = this.producerShopHelperService.isSelectedPlanPanel(this.planPanel);

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

        this.selectedCoverageLevel$ = this.producerShopComponentStoreService
            .getCoverageLevelState(panelIdentifiers)
            .pipe(map((coverageLevelState) => coverageLevelState?.coverageLevel));

        this.selectedCoverageLevelId$ = this.selectedCoverageLevel$.pipe(map((coverageLevel) => coverageLevel?.id ?? null));

        // Get Rider Pricings to populate table
        this.riderStateWithPlanPricings$ = this.riderComponentStoreService
            .getRiderStatesWithPlanPricings(panelIdentifiers)
            .pipe(map((riderStateWithPlanPricings) => riderStateWithPlanPricings.filter(({ riderState }) => riderState.checked)));

        // Filtered Pricings
        this.planOfferingPricingCoverage$ = combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEffectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            // Get benefitAmount based on dropdown for planOffering plan
            this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers),
            // Get eliminationPeriod based on dropdown for planOffering plan
            this.producerShopComponentStoreService.getEliminationPeriodState(panelIdentifiers),
            // Get Tobacco status based on dropdown
            this.selectedTobaccoInformation$,
            // Get dependentAge based on dropdown for planOffering plan
            this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers),
        ]).pipe(
            switchMap(
                ([
                    riskClassId,
                    coverageEffectiveDate,
                    benefitAmountState,
                    eliminationPeriodState,
                    tobaccoInformation,
                    dependentAgeState,
                ]) => {
                    const productId = this.planOfferingService.getProductId(this.planPanel.planOffering);
                    const shoppingCartItemId = this.planPanel.cartItemInfo?.id;

                    return this.ngrxStore.onAsyncValue(
                        select(
                            PlanOfferingsSelectors.getPlanOfferingPricingCoverages(
                                tobaccoInformation,
                                planOfferingId,
                                productId,
                                riskClassId,
                                coverageEffectiveDate,
                                benefitAmountState?.benefitAmount,
                                eliminationPeriodState?.eliminationPeriod?.id,
                                dependentAgeState.dependentAge,
                                shoppingCartItemId,
                            ),
                        ),
                    );
                },
            ),
        );

        this.selectedCoverageLevels$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(planId))).pipe(
            // Since Coverage Level api calls are made frequently, onAsyncValue for selected CoverageLevels
            // will emit multiple times for each api call,
            // to prevent this, we can check if the array of CoverageLevels change using their ids
            this.rxjsService.distinctArrayUntilChanged(),
        );

        // Whenever a selection is made through the template, a CoverageLevel id is emitted
        // Finds CoverageLevel by id and sets it in ProducerShopComponentStore
        this.coverageLevelIdSelected$
            .pipe(
                withLatestFrom(this.selectedCoverageLevels$),
                map(([coverageLevelId, coverageLevels]) =>
                    coverageLevels.find((possibleCoverageLevel) => possibleCoverageLevel.id === coverageLevelId),
                ),
                tap((coverageLevel) => this.setCoverageLevel(coverageLevel)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.displayName$ = this.planOfferingPricingCoverage$.pipe(
            map((coverageLevelPricings) => [
                POSITION,
                ...coverageLevelPricings.map((coverageLevelPricing) => coverageLevelPricing.coverageLevel.displayName),
            ]),
            this.rxjsService.distinctArrayUntilChanged<[string, ...CoverageLevelNames[]]>(
                (coverageLevelPricingA, coverageLevelPricingB) => coverageLevelPricingA === coverageLevelPricingB,
            ),
        );

        // Gets coverage level and its related knockout data based on spouse knockout
        // Only spouse knockout is valid for coverage level disability
        this.coverageLevelsKnockoutData$ = combineLatest([this.knockoutPlanEligibility$, this.selectedCoverageLevels$]).pipe(
            map(([knockoutPlanEligibility, selectedCoverageLevels]) => {
                // If plan do not have spouse knockout, then knockout is not applicable for all coverages
                // So no need to return any coverage level and its data
                if (knockoutPlanEligibility[this.planPanel.planOffering.id]?.knockoutType !== KnockoutType.SPOUSE_KNOCKOUT) {
                    return [];
                }

                return selectedCoverageLevels.reduce<Record<number, boolean>>((coverageLevelKnockout, coverageLevel) => {
                    // If plan have spouse knockout, then knockout is applicable for all coverages that covers spouse
                    coverageLevelKnockout[coverageLevel.id] = coverageLevel.rule.coversSpouse;
                    return coverageLevelKnockout;
                }, {});
            }),
        );
        // determine show/hide employer contribution row in pricing table
        this.showEmployerContributions$ = combineLatest([
            this.planOfferingPricingCoverage$,
            this.selectedMemberFlexDollars$,
            this.employerContributionExcludedStates$,
            this.selectedCountryState$,
        ]).pipe(
            map(([coverageLevelPricing, memberFlexDollars, employerContributionExcludedStates, selectedState]) =>
                this.showEmployerContributionInPricingTable(
                    coverageLevelPricing,
                    memberFlexDollars,
                    employerContributionExcludedStates,
                    selectedState,
                ),
            ),
        );

        // Create data source to show plan pricing table
        this.dataSource$ = combineLatest([
            this.planOfferingPricingCoverage$,
            this.riderStateWithPlanPricings$,
            this.coverageLevelsKnockoutData$,
            this.selectedCoverageLevelId$,
            this.selectedMemberFlexDollars$,
            combineLatest([this.showEmployerContributions$, this.appliedCartFlexDollar$]),
        ]).pipe(
            map(
                ([
                    coverageLevelPricing,
                    riderCoverageLevelPricings,
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    selectedMemberFlexDollars,
                    [showEmployerContributions, appliedCartFlexDollar],
                ]) =>
                    this.getMappedTableData(
                        coverageLevelPricing,
                        riderCoverageLevelPricings,
                        coverageLevelsKnockoutData,
                        selectedCoverageLevelId,
                        selectedMemberFlexDollars,
                        showEmployerContributions,
                        appliedCartFlexDollar,
                    ),
            ),
        );

        // Get total cost of a coverage level to display in table footer
        this.totalPrices$ = combineLatest([this.dataSource$, this.planOfferingPricingCoverage$]).pipe(
            map(([planOfferingPriceTableRows, planOfferingCoverages]) =>
                planOfferingCoverages.map((_, index) => {
                    const coverageTotal = planOfferingPriceTableRows
                        .map((planOfferingPriceTableRow) =>
                            Number(
                                this.currencyPipe.transform(planOfferingPriceTableRow.coverageLevelPrices[index]?.price, "", "", "1.2-2"),
                            ),
                        )
                        .reduce((acc, cur) => acc + cur, 0);

                    //  Total cost will display 0 if it is less than or equal to 0 (planOffering price < adjustmentAmount)
                    return coverageTotal <= 0 ? AMOUNT_ZERO.toString() : coverageTotal.toString();
                }),
            ),
        );
    }

    /**
     * Emit selected CoverageLevel id from template
     *
     * @param coverageLevelId {number} - Coveragelevel id
     */
    // We are not using reactive form as it was triggering infinite loop with value changes setting store,
    // and store setting back the form
    // Hence removed reactive forms and using change events
    coverageLevelIdSelected(coverageLevelId?: number | null): void {
        this.coverageLevelIdSelected$.next(coverageLevelId);
    }

    /**
     * Store selected CoverageLevel in ProducerShopComponentStore
     *
     * @param coverageLevel {CoverageLevel} - selected CoverageLevel
     */
    setCoverageLevel(coverageLevel: CoverageLevel): void {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        this.producerShopComponentStoreService.upsertCoverageLevelState({ coverageLevel, panelIdentifiers });
    }

    /**
     * Determine show/hide employer contribution row in pricing table
     *
     * @param coverageLevelPricing {PlanOfferingPricingCoverage} - Combined data model of pricing & coverage level
     * @param memberFlexDollars {MemberFlexDollar[]} selected member flex dollars data
     * @param employerContributionExcludedStates {String} employer contribution excluded states
     * @param selectedState {CountryState} selected state
     *
     */
    showEmployerContributionInPricingTable(
        coverageLevelPricing: PlanOfferingPricingCoverage[],
        memberFlexDollars: MemberFlexDollar[],
        employerContributionExcludedStates: string[],
        selectedState: CountryState,
    ): boolean {
        // If there are no CoverageLevelPricings, there's no need to show employer contributions
        if (!coverageLevelPricing.length) {
            return false;
        }
        if (this.planPanel?.planOffering?.plan?.characteristics.includes(Characteristics.COMPANY_PROVIDED)) {
            return false;
        }

        // If the plan is AG and total cost and member cost are different then to show employer contribution
        if (
            this.planPanel.planOffering.plan.carrierId === CarrierId.AFLAC_GROUP &&
            coverageLevelPricing[0].planOfferingPricing.totalCost !== coverageLevelPricing[0].planOfferingPricing.memberCost
        ) {
            return true;
        }
        // Don't show view employer contribution button if there is no employer contribution available.
        if (!memberFlexDollars.length) {
            return false;
        }
        // Don't show view employer contribution button if selected state is in excluded state list (from config).
        if (employerContributionExcludedStates.includes(selectedState.abbreviation)) {
            return false;
        }
        return true;
    }

    /**
     * Returns mapped coverage level with pricing. Used to get data to populate mat-table
     * @param coverageLevelPricings {PlanOfferingPricingCoverage[]} Mapped coverage level with pricing
     * @param riderStatesWithPricings {RiderStateWithPlanPricings[]} Mapped RiderState and Pricing
     * @param coverageLevelsKnockoutData {Record<number, boolean>} coverage level id and its related knockout data
     * @param selectedCoverageLevelId {number} Selected BASE PlanOffering CoverageLevel id
     * @param memberFlexDollars {MemberFlexDollar[]} selected member flex dollars data (Employer contributions)
     * @param showEmployerContributions {boolean} determine whether to show/hide employee contributions
     * @param appliedCartFlexDollar {PlanFlexDollarOrIncentives} applied flex dollar for a cart item
     * @returns {PlanOfferingPriceTableRow[]} plan price elements with pricing for respective coverage level
     */
    getMappedTableData(
        coverageLevelPricings: PlanOfferingPricingCoverage[],
        riderStatesWithPricings: RiderStateWithPlanPricings[],
        coverageLevelsKnockoutData: Record<number, boolean>,
        selectedCoverageLevelId: number,
        memberFlexDollars: MemberFlexDollar[],
        showEmployerContributions: boolean,
        appliedCartFlexDollar: PlanFlexDollarOrIncentives,
    ): PlanOfferingPriceTableRow[] {
        // Get base plan price for all coverage levels associated with the plan
        // At the 0th index of planPriceElement we should always have the base plan's
        // Coverage levels and prices wrt those coverage levels
        const coverageLevelPricingsTableData: PlanOfferingPriceTableRow = {
            rowLabel: this.languageStrings["primary.portal.createQuote.basePrice"],
            coverageLevelPrices: coverageLevelPricings.map(({ coverageLevel, planOfferingPricing }) =>
                this.getCoverageLevelPrice(coverageLevel, planOfferingPricing, coverageLevelsKnockoutData[coverageLevel.id]),
            ),
        };
        // Filtering the coverage levels with available pricing
        const coverageLevelWithPricings = coverageLevelPricings.filter((coverageLevelPricing) => coverageLevelPricing.planOfferingPricing);

        // Based on available coverage level with pricing, here we will filter pricing data of same coverage level riders
        riderStatesWithPricings = [
            ...riderStatesWithPricings.map((riderStatesWithPricing) => ({
                baseBenefitAmount: riderStatesWithPricing.baseBenefitAmount,
                pricingDatas: riderStatesWithPricing.pricingDatas.map((pricingData) => ({
                    // keep the rider pricing data if its base coverage pricing exist
                    riderPlanOfferingPricing: coverageLevelWithPricings.some(
                        (coverageLevelWithPricing) => coverageLevelWithPricing.coverageLevel.id === pricingData.baseCoverageLevel.id,
                    )
                        ? pricingData.riderPlanOfferingPricing
                        : null,
                    baseCoverageLevel: pricingData.baseCoverageLevel,
                })),
                riderState: riderStatesWithPricing.riderState,
            })),
        ];

        // Get table rows for rider pricings
        const riderStateWithPlanPricingsTableDatas: PlanOfferingPriceTableRow[] = riderStatesWithPricings.map((riderStateWithPricings) => {
            let selectedPriceData = riderStateWithPricings.pricingDatas;
            // filter pricing when elimination period exists
            if (riderStateWithPricings.pricingDatas.some((price) => price.baseCoverageLevel.eliminationPeriod)) {
                selectedPriceData = riderStateWithPricings.pricingDatas.filter(
                    (pricingData) => pricingData.baseCoverageLevel.id === selectedCoverageLevelId,
                );
            }
            return {
                isReturnOfPremiumRider: riderStateWithPricings.riderState.returnOfPremiumRider,
                rowLabel: this.getRiderRowDisplay(riderStateWithPricings, selectedCoverageLevelId),
                coverageLevelPrices: selectedPriceData.map(({ baseCoverageLevel, riderPlanOfferingPricing }) =>
                    this.getCoverageLevelPrice(
                        baseCoverageLevel,
                        riderPlanOfferingPricing,
                        coverageLevelsKnockoutData[baseCoverageLevel.id],
                    ),
                ),
            };
        });

        // Get selected product id
        const productId = this.planOfferingService.getProductId(this.planPanel.planOffering);
        // Employer contribution for selected product
        const selectedProductEmployerContribution = memberFlexDollars.filter(
            (memberFlexDollar) => memberFlexDollar.applicableProductId === productId,
        );
        // To calculate and show employer contribution for Ag plans
        if (
            showEmployerContributions &&
            !selectedProductEmployerContribution.length &&
            this.planPanel.planOffering.plan.carrierId === CarrierId.AFLAC_GROUP
        ) {
            const employerContributionPricingDatas: PlanOfferingPriceTableRow = {
                rowLabel: this.languageStrings["primary.portal.quoteShop.employerContribution"],
                coverageLevelPrices: coverageLevelPricings.map(
                    ({ coverageLevel, planOfferingPricing }) =>
                        ({
                            id: coverageLevel.id,
                            price: (-(planOfferingPricing?.totalCost - planOfferingPricing?.memberCost)).toString(),
                            spouseKnockoutDisable: coverageLevelsKnockoutData[coverageLevel.id],
                        } as CoverageLevelPrice),
                ),
            };
            return [coverageLevelPricingsTableData, ...riderStateWithPlanPricingsTableDatas, employerContributionPricingDatas];
        }

        if (showEmployerContributions && selectedProductEmployerContribution?.length) {
            return this.getEmployerComtributionData(
                coverageLevelPricings,
                coverageLevelsKnockoutData,
                selectedProductEmployerContribution,
                appliedCartFlexDollar,
                coverageLevelPricingsTableData,
                riderStateWithPlanPricingsTableDatas,
            );
        }

        // Table data should always start with row of Base Plan's pricings
        // Then is followed up by each Rider pricings
        return [coverageLevelPricingsTableData, ...riderStateWithPlanPricingsTableDatas];
    }

    /**
     * Returns mapped coverage level with employer contribution pricing.
     * @param coverageLevelPricings {PlanOfferingPricingCoverage[]} Mapped coverage level with pricing
     * @param coverageLevelsKnockoutData {Record<number, boolean>} coverage level id and its related knockout data
     * @param selectedProductEmployerContribution {MemberFlexDollar[]} selected member flex dollars data (Employer contributions)
     * @param appliedCartFlexDollar {PlanFlexDollarOrIncentives} applied flex dollar for a cart item
     * @param coverageLevelPricingsTableData {PlanOfferingPriceTableRow} Mapped coverage level and plan pricing
     * @param riderStateWithPlanPricingsTableDatas {PlanOfferingPriceTableRow[]} Mapped RiderState and Pricing
     * @returns {PlanOfferingPriceTableRow[]} plan price elements with pricing for respective coverage level
     */
    getEmployerComtributionData(
        coverageLevelPricings: PlanOfferingPricingCoverage[],
        coverageLevelsKnockoutData: Record<number, boolean>,
        selectedProductEmployerContribution: MemberFlexDollar[],
        appliedCartFlexDollar: PlanFlexDollarOrIncentives,
        coverageLevelPricingsTableData: PlanOfferingPriceTableRow,
        riderStateWithPlanPricingsTableDatas: PlanOfferingPriceTableRow[],
    ): PlanOfferingPriceTableRow[] {
        if (this.planPanel?.cartItemInfo?.id && appliedCartFlexDollar) {
            const employerContributionPricingDatasForCart: PlanOfferingPriceTableRow = {
                rowLabel: this.languageStrings["primary.portal.quoteShop.employerContribution"],
                coverageLevelPrices: coverageLevelPricings.map(
                    ({ coverageLevel }) =>
                        ({
                            id: coverageLevel.id,
                            price: appliedCartFlexDollar.flexDollarOrIncentiveAmount.toString(),
                            spouseKnockoutDisable: coverageLevelsKnockoutData[coverageLevel.id],
                        } as CoverageLevelPrice),
                ),
            };
            return [coverageLevelPricingsTableData, ...riderStateWithPlanPricingsTableDatas, employerContributionPricingDatasForCart];
        }
        // Get table rows for Employer contribution pricings
        const employerContributionPricingDatas: PlanOfferingPriceTableRow = {
            rowLabel: this.languageStrings["primary.portal.quoteShop.employerContribution"],
            coverageLevelPrices: [
                ...coverageLevelPricings.map(({ coverageLevel, planOfferingPricing }, index) => {
                    const ridersPrice = riderStateWithPlanPricingsTableDatas
                        .map((riderPrice) => Number(riderPrice.coverageLevelPrices[index]?.price))
                        .reduce((acc, cur) => acc + cur, 0);

                    const basePrice = this.getCoverageLevelPrice(
                        coverageLevel,
                        planOfferingPricing,
                        coverageLevelsKnockoutData[coverageLevel.id],
                        selectedProductEmployerContribution[0],
                    );

                    const employerContribution = selectedProductEmployerContribution[0].currentAmount;

                    // EC deduction amount for flat
                    // If base + rider total > than EC then amount to be reduced is employerContribution - basePrice
                    // Else reduce the total riderPrice
                    const basePlusRider = Number(basePrice.price) - ridersPrice;
                    const riderDeduction =
                        -basePlusRider > employerContribution ? employerContribution + Number(basePrice.price) : ridersPrice;

                    // Subtracts from the base price the Employer Contribution amount (percentage or flat)
                    // considering the number of Riders included
                    return {
                        ...basePrice,
                        price: `${
                            Number(basePrice.price) -
                            (selectedProductEmployerContribution[0].contributionType === this.contributionType.PERCENTAGE
                                ? ridersPrice * (employerContribution / 100)
                                : riderDeduction)
                        }`,
                    };
                }),
            ],
        };

        return [coverageLevelPricingsTableData, ...riderStateWithPlanPricingsTableDatas, employerContributionPricingDatas];
    }

    /**
     * Gets coverage level price display. Used to display price text per cell.
     * Might be disabled based on Knockout Questions involving Member spouse
     *
     * @param coverageLevel {CoverageLevel} - Used to get identifier: CoverageLevel.id
     * @param planOfferingPricing {PlanOfferingPricing} - Source of pricing numeric value
     * @param spouseKnockoutDisable indicated if coverage has to be disabled based on spouse knockout
     * @param selectedProductEmployerContribution {MemberFlexDollar} (optional) Employer contribution for selected product.
     * @returns coverage level price display
     */
    getCoverageLevelPrice(
        coverageLevel: CoverageLevel,
        planOfferingPricing: PlanOfferingPricing,
        spouseKnockoutDisable: boolean,
        selectedProductEmployerContribution?: MemberFlexDollar,
    ): CoverageLevelPrice {
        return {
            id: coverageLevel.id,
            price: this.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution),
            spouseKnockoutDisable,
        };
    }

    /**
     * Gets pricing display text from PlanOfferingPricing
     * @param planOfferingPricing {PlanOfferingPricing} Source of pricing numeric value
     * @param selectedProductEmployerContribution {MemberFlexDollar} (optional) Employer contribution for selected product.
     * @returns price for selected coverage
     */
    getPriceForCoverageLevel(planOfferingPricing: PlanOfferingPricing, selectedProductEmployerContribution?: MemberFlexDollar): string {
        // for price mapping of ag plans
        if (this.planPanel.planOffering.plan.carrierId === CarrierId.AFLAC_GROUP) {
            return planOfferingPricing?.totalCost.toString() ?? "";
        }
        if (!selectedProductEmployerContribution) {
            return planOfferingPricing?.memberCost.toString() ?? "";
        } else {
            // exit early if no memberCost available
            if (!planOfferingPricing?.memberCost) {
                return "";
            }

            if (!selectedProductEmployerContribution?.currentAmount) {
                return "";
            }

            // employer contribution type is percentage
            if (selectedProductEmployerContribution?.contributionType === this.contributionType.PERCENTAGE) {
                // return employer contribution in negative amount
                return (-(planOfferingPricing.memberCost * selectedProductEmployerContribution.currentAmount) / 100).toString();
            }

            // employer contribution type is flat amount
            // if employerContributionAmount is greater then memberCost than return memberCost as employerContribution
            return selectedProductEmployerContribution.currentAmount > planOfferingPricing.memberCost
                ? (-planOfferingPricing.memberCost).toString()
                : (-selectedProductEmployerContribution.currentAmount).toString();
        }
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            "primary.portal.quoteShop.knockout.reanswerMessageToolTip",
            "primary.portal.shoppingExperience.missingDependentInfo",
            "primary.portal.createQuote.basePrice",
            "primary.portal.shopQoute.ROPMessage",
            "primary.portal.quoteShop.employerContribution",
        ]);
    }

    /**
     * Gets RIDER PlanOffering CoverageLevels based on a specific BASE PlanOffering's CoverageLevel.
     * Used to get the RIDER PlanOffering pricing that is used for populating the table
     * @param riderPlanId {number} - RIDER PlanOffering Plan id
     * @param baseCoverageLevelId {number} - BASE PlanOffering CoverageLevel id
     * @returns {Observable<CoverageLevel[]>} Rider's CoverageLevels
     */
    getRiderCoverageLevels(riderPlanId: number, baseCoverageLevelId: number): Observable<CoverageLevel[]> {
        return this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(riderPlanId, baseCoverageLevelId)));
    }

    /**
     * Gets formatted display text for any numeric value (BenefitAmount)
     *
     * @param value {number} currency numeric value
     * @returns {string} formatted currency string. Used to display Benefit Amount
     */
    getCurrencyDisplayText(value: number): string {
        if (!value) {
            return "";
        }

        return formatCurrency(value, "en-US", "$", "US", "1.0-0");
    }

    /**
     * Gets row display text for Rider pricing. If there is a Benefit Amount, it is added to the Plan name
     * @param riderPricingCoverageSummary {RiderPricingCoverageSummary} source of text to show. for row. Contains
     * @param baseCoverageId {number} used to determine which RIDER PlanOffering Pricing to get benefit amount from
     * Plan name and possible Benefit Amount.
     * @returns {string} row display text for Rider pricing
     */
    getRiderRowDisplay(riderStateWithPlanPricings: RiderStateWithPlanPricings, baseCoverageId: number): string {
        const { riderState, pricingDatas } = riderStateWithPlanPricings;

        const pricingBenefitAmount = pricingDatas.find((pricingData) => pricingData.baseCoverageLevel.id === baseCoverageId)
            ?.riderPlanOfferingPricing?.benefitAmount;

        const riderPlanName = riderState.riderPlanName;

        const benefitAmountDisplayValue = this.getCurrencyDisplayText(pricingBenefitAmount);

        if (!benefitAmountDisplayValue || riderState.returnOfPremiumRider) {
            return riderPlanName;
        }

        return `${riderPlanName}: ${benefitAmountDisplayValue}`;
    }

    /**
     * Destroys component and unsubscribes existing subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
