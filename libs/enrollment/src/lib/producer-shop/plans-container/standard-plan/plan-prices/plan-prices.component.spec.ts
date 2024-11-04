import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { PlanPricesComponent } from "./plan-prices.component";
import { RiderComponentStoreService } from "../../../services/rider-component-store/rider-component-store.service";
import {
    CarrierId,
    PlanOfferingPricingCoverage,
    CoverageLevel,
    CountryState,
    Plan,
    PlanOffering,
    Product,
    PlanOfferingPricing,
    MemberFlexDollar,
    GetCartItems,
    AggregateFlexDollarOrIncentive,
    PlanFlexDollarOrIncentives,
    FlexDollarModel,
    AsyncStatus,
} from "@empowered/constants";
import { RiderState } from "../../../services/rider-state/rider-state.model";
import { RiderStateWithPlanPricings } from "../../../services/rider-component-store/rider-component-store.model";
import { PlanOfferingService } from "../../../services/plan-offering/plan-offering.service";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { appliedFlexDollarEntityAdapter } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.state";
import { CurrencyPipe } from "@angular/common";
import { MockCurrencyPipe, mockPlanPanelService } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PanelIdentifiers } from "../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { of } from "rxjs";
import { PlanPanelService } from "../../../services/plan-panel/plan-panel.service";
import { MatTableModule } from "@angular/material/table";

const mockLanguageService = {
    fetchPrimaryLanguageValue: (tagNames: string) => tagNames,
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() backdrop = false;
    @Input() enableSpinner = false;
}
const mockPlanOfferingService = {
    getProductId: (planOffering: PlanOffering) => planOffering.plan.product.id ?? null,
    getPlanId: (planOffering: PlanOffering) => planOffering?.plan.id ?? null,
} as PlanOfferingService;

const mockRiderComponentStoreService = {
    getRiderStatesWithPlanPricings: (panelIdentifiers: PanelIdentifiers) => of([]),
};

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("PlanPricesComponent", () => {
    let component: PlanPricesComponent;
    let fixture: ComponentFixture<PlanPricesComponent>;
    let producerShopComponentStoreService: ProducerShopComponentStoreService;
    let languageService: LanguageService;
    let planPanelService: PlanPanelService;
    const initialState = {
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
            selectedMPGroup: 111,
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
            selectedMemberId: 333,
        },
        [SHOPPING_CARTS_FEATURE_KEY]: {
            ...ShoppingCartsState.initialState,
            appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId: 333,
                        mpGroup: 111,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            aggregateFlexDollarOrIncentives: [
                                {
                                    flexDollarOrIncentiveName: "incentive",
                                    flexDollarOrIncentiveAmount: 888,
                                },
                            ] as AggregateFlexDollarOrIncentive[],
                            planFlexDollarOrIncentives: [
                                {
                                    planId: 200,
                                    cartItemId: 22,
                                },
                            ] as PlanFlexDollarOrIncentives[],
                        } as FlexDollarModel,
                        error: null,
                    },
                },
                { ...ShoppingCartsState.initialState.appliedFlexDollarsSetsEntities },
            ),
        },
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanPricesComponent, MockMonSpinnerComponent, MockRichTooltipDirective],
            imports: [ReactiveFormsModule, HttpClientTestingModule, MatTableModule],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({ initialState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: PlanOfferingService,
                    useValue: mockPlanOfferingService,
                },
                ProducerShopComponentStoreService,
                {
                    provide: RiderComponentStoreService,
                    useValue: mockRiderComponentStoreService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: MockCurrencyPipe,
                },
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        producerShopComponentStoreService = TestBed.inject(ProducerShopComponentStoreService);
        languageService = TestBed.inject(LanguageService);
        planPanelService = TestBed.inject(PlanPanelService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanPricesComponent);
        component = fixture.componentInstance;
        component.planPanel = {
            planOffering: {
                id: 999,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                    characteristics: [],
                },
            } as PlanOffering,
        };
        jest.spyOn(planPanelService, "getPanelIdentifiers").mockReturnValue({
            planOfferingId: 1,
            cartId: 2,
            enrollmentId: 3,
        });
        fixture.detectChanges();
    });

    describe("component creation", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("showEmployerContributionInPricingTable()", () => {
        it("should return false if there are no CoverageLevelPricings", () => {
            const result = component.showEmployerContributionInPricingTable([], [], [], {} as CountryState);
            expect(result).toBe(false);
        });

        it("should return true if the plan is AG and total cost and member cost are different", () => {
            component.planPanel = {
                planOffering: {
                    id: 999,
                    plan: {
                        id: 777,
                        product: {
                            id: 888,
                        },
                        characteristics: [],
                        carrierId: CarrierId.AFLAC_GROUP,
                    },
                } as PlanOffering,
            };
            const result = component.showEmployerContributionInPricingTable(
                [{ planOfferingPricing: { totalCost: 111, memberCost: 222 } } as PlanOfferingPricingCoverage],
                [],
                [],
                {} as CountryState,
            );
            expect(result).toBe(true);
        });

        it("should return false if there is no employer contribution available", () => {
            component.planPanel = {
                planOffering: {
                    id: 999,
                    plan: {
                        id: 777,
                        product: {
                            id: 888,
                        },
                        characteristics: [],
                        carrierId: CarrierId.AFLAC_GROUP,
                    },
                } as PlanOffering,
            };
            const result = component.showEmployerContributionInPricingTable(
                [{ planOfferingPricing: { totalCost: 111, memberCost: 111 } } as PlanOfferingPricingCoverage],
                [],
                [],
                {} as CountryState,
            );
            expect(result).toBe(false);
        });

        it("should return false if selected state is in excluded state list", () => {
            component.planPanel = {
                planOffering: {
                    id: 999,
                    plan: {
                        id: 777,
                        product: {
                            id: 888,
                        },
                        characteristics: [],
                        carrierId: CarrierId.AFLAC_GROUP,
                    },
                } as PlanOffering,
            };
            const result = component.showEmployerContributionInPricingTable(
                [{ planOfferingPricing: { totalCost: 111, memberCost: 111 } } as PlanOfferingPricingCoverage],
                [{} as MemberFlexDollar],
                ["CA"],
                { abbreviation: "CA" } as CountryState,
            );
            expect(result).toBe(false);
        });

        it("should return true if employer contribution should show row in pricing table", () => {
            component.planPanel = {
                planOffering: {
                    id: 999,
                    plan: {
                        id: 777,
                        product: {
                            id: 888,
                        },
                        characteristics: [],
                        carrierId: CarrierId.AFLAC_GROUP,
                    },
                } as PlanOffering,
            };
            const result = component.showEmployerContributionInPricingTable(
                [{ planOfferingPricing: { totalCost: 111, memberCost: 111 } } as PlanOfferingPricingCoverage],
                [{} as MemberFlexDollar],
                ["VA"],
                { abbreviation: "CA" } as CountryState,
            );
            expect(result).toBe(true);
        });
    });

    describe("getCurrencyDisplayText", () => {
        it("should return empty string if no value is passed", () => {
            const result = component.getCurrencyDisplayText(undefined);
            expect(result).toBe("");
        });
        it("should return formatted currency display text", () => {
            expect(component.getCurrencyDisplayText(134)).toBe("$134");
        });
    });

    describe("setCoverageLevel", () => {
        let coverageLevel;
        beforeEach(() => {
            coverageLevel = { id: 1 } as CoverageLevel;
        });
        it("should update the coverage level state", () => {
            const spy1 = jest.spyOn(producerShopComponentStoreService, "upsertCoverageLevelState");
            component.setCoverageLevel(coverageLevel);
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("appliedCartFlexDollar$", () => {
        it("should set appliedCartFlexDollar to null", (done) => {
            expect.assertions(1);
            component.planPanel.cartItemInfo = {
                id: 1,
            } as GetCartItems;
            component.appliedCartFlexDollar$.subscribe((result) => {
                expect(result).toBe(null);
                done();
            });
        });
    });

    describe("getLanguageStrings", () => {
        it("getLanguageStrings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.getLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getRiderRowDisplay()", () => {
        let riderState;
        let pricingData1;
        let pricingData2;
        let baseCoverageLevelId;
        beforeEach(() => {
            riderState = {
                riderPlanName: "Aflac plus rider",
                returnOfPremiumRider: false,
            } as RiderState;
            pricingData1 = {
                riderPlanOfferingPricing: { benefitAmount: 234 } as PlanOfferingPricing,
                baseCoverageLevel: { id: 29 } as CoverageLevel,
            };
            pricingData2 = {
                riderPlanOfferingPricing: { benefitAmount: 134 } as PlanOfferingPricing,
                baseCoverageLevel: { id: 27 } as CoverageLevel,
            };
            baseCoverageLevelId = 27;
        });
        it("Should get row display text with benefit amount for Rider pricing", () => {
            const spy = jest.spyOn(component, "getCurrencyDisplayText").mockReturnValueOnce("134$");
            expect(
                component.getRiderRowDisplay(
                    { riderState, pricingDatas: [pricingData1, pricingData2] } as RiderStateWithPlanPricings,
                    baseCoverageLevelId,
                ),
            ).toBe("Aflac plus rider: 134$");
            expect(spy).toBeCalledTimes(1);
        });
        it("Should get row display text without benefit amount for Rider pricing", () => {
            riderState.returnOfPremiumRider = true;
            const spy = jest.spyOn(component, "getCurrencyDisplayText").mockReturnValueOnce("134$");
            expect(
                component.getRiderRowDisplay(
                    { riderState, pricingDatas: [pricingData1, pricingData2] } as RiderStateWithPlanPricings,
                    baseCoverageLevelId,
                ),
            ).toBe("Aflac plus rider");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getPriceForCoverageLevel()", () => {
        let planOfferingPricing;
        let selectedProductEmployerContribution;
        beforeEach(() => {
            planOfferingPricing = { memberCost: 12, totalCost: 23 } as PlanOfferingPricing;
            selectedProductEmployerContribution = { contributionType: "PERCENTAGE", currentAmount: 50 } as MemberFlexDollar;
        });
        it("should return total cost in case of AG plans", () => {
            component.planPanel.planOffering.plan.carrierId = CarrierId.AFLAC_GROUP;
            expect(component.getPriceForCoverageLevel(planOfferingPricing)).toBe("23");
        });
        it("should return member cost data for non AG plans and without employer contribution", () => {
            component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
            expect(component.getPriceForCoverageLevel(planOfferingPricing)).toBe("12");
        });
        it("Should return empty string when member cost not available", () => {
            component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
            planOfferingPricing.memberCost = undefined;
            expect(component.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution)).toBe("");
        });

        it("Should return empty string when employer contribution current amount is not available", () => {
            component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
            selectedProductEmployerContribution.currentAmount = undefined;
            expect(component.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution)).toBe("");
        });
        it("Should return cost after calculation when contribution is in percentage", () => {
            component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
            expect(component.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution)).toBe("-6");
        });

        describe("contribution is flat amount", () => {
            it("Should return cost equal to negative of employer contribution amount when employer contribution not greater then member cost", () => {
                component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
                selectedProductEmployerContribution.contributionType = "FLAT_AMOUNT";
                selectedProductEmployerContribution.currentAmount = 10;
                expect(component.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution)).toBe("-10");
            });

            it("Should return cost equal to negative of member cost as employer contribution when employer contribution greater then member cost", () => {
                component.planPanel.planOffering.plan.carrierId = CarrierId.ARGUS;
                selectedProductEmployerContribution.contributionType = "FLAT_AMOUNT";
                selectedProductEmployerContribution.currentAmount = 10;
                planOfferingPricing.memberCost = 8;
                expect(component.getPriceForCoverageLevel(planOfferingPricing, selectedProductEmployerContribution)).toBe("-8");
            });
        });
    });

    describe("getCoverageLevelPrice()", () => {
        it("should return coverage level price display", () => {
            const coverageLevel = {
                id: 23,
            } as CoverageLevel;
            const planOfferingPricing = { memberCost: 12, totalCost: 23 } as PlanOfferingPricing;
            const selectedProductEmployerContribution = { contributionType: "PERCENTAGE", currentAmount: 100 } as MemberFlexDollar;
            const spouseKnockoutDisable = false;
            const spy = jest.spyOn(component, "getPriceForCoverageLevel").mockReturnValueOnce("12.5");
            expect(
                component.getCoverageLevelPrice(
                    coverageLevel,
                    planOfferingPricing,
                    spouseKnockoutDisable,
                    selectedProductEmployerContribution,
                ),
            ).toStrictEqual({ id: 23, price: "12.5", spouseKnockoutDisable });
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("coverageLevelIdSelected()", () => {
        it("should emit selected CoverageLevel id from template", () => {
            const spy = jest.spyOn(component["coverageLevelIdSelected$"], "next");
            component.coverageLevelIdSelected(12);
            expect(spy).toBeCalledTimes(1);
        });
    });
    describe("getMappedTableData()", () => {
        let coverageLevelPricing;
        let riderStatesWithPricings;
        let coverageLevelsKnockoutData;
        let selectedCoverageLevelId;
        let memberFlexDollar;
        let appliedCartFlexDollar;
        beforeEach(() => {
            coverageLevelPricing = {
                coverageLevel: { id: 1 } as CoverageLevel,
                planOfferingPricing: { totalCost: 12, memberCost: 12 } as PlanOfferingPricing,
            } as PlanOfferingPricingCoverage;
            riderStatesWithPricings = {
                riderState: { returnOfPremiumRider: false } as RiderState,
                baseBenefitAmount: 1.23,
                pricingDatas: [
                    {
                        riderPlanOfferingPricing: {} as PlanOfferingPricing,
                        baseCoverageLevel: { id: 27, eliminationPeriod: "0/7 days" } as CoverageLevel,
                    },
                ],
            } as RiderStateWithPlanPricings;
            coverageLevelsKnockoutData = {
                1: true,
            };
            selectedCoverageLevelId = 27;
            memberFlexDollar = {
                contributionType: "PERCENTAGE",
                currentAmount: 100,
                applicableProductId: 2,
            } as MemberFlexDollar;
            appliedCartFlexDollar = null;
        });

        it("should return mapped coverage level with pricing", () => {
            const showEmployerContributions = false;
            const spy1 = jest
                .spyOn(component, "getCoverageLevelPrice")
                .mockReturnValue({ id: 27, price: "12.5", spouseKnockoutDisable: true });

            expect(
                component.getMappedTableData(
                    [coverageLevelPricing],
                    [riderStatesWithPricings],
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    [memberFlexDollar],
                    showEmployerContributions,
                    appliedCartFlexDollar,
                ),
            ).toStrictEqual([
                { coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }], rowLabel: undefined },
                {
                    coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }],
                    isReturnOfPremiumRider: false,
                    rowLabel: undefined,
                },
            ]);
            expect(spy1).toBeCalledTimes(2);
        });
        it("should return mapped coverage level with pricing for AG plans", () => {
            const showEmployerContributions = true;
            component.planPanel.planOffering.plan.carrierId = CarrierId.AFLAC_GROUP;
            const spy1 = jest
                .spyOn(component, "getCoverageLevelPrice")
                .mockReturnValue({ id: 27, price: "12.5", spouseKnockoutDisable: true });
            expect(
                component.getMappedTableData(
                    [coverageLevelPricing],
                    [riderStatesWithPricings],
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    [memberFlexDollar],
                    showEmployerContributions,
                    appliedCartFlexDollar,
                ),
            ).toStrictEqual([
                { coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }], rowLabel: undefined },
                {
                    coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }],
                    isReturnOfPremiumRider: false,
                    rowLabel: undefined,
                },
                {
                    coverageLevelPrices: [
                        {
                            id: 1,
                            price: "0",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    rowLabel: undefined,
                },
            ]);
            expect(spy1).toBeCalledTimes(2);
        });
        it.skip("should return mapped coverage level with pricing after calculation when employer contribution is available", () => {
            // TODO: Need to refactor this test
            const showEmployerContributions = true;
            component.planPanel.planOffering = {
                plan: { carrierId: CarrierId.AFLAC, product: { id: 2 } as Product } as Plan,
            } as PlanOffering;
            riderStatesWithPricings.pricingDatas[0].baseCoverageLevel.eliminationPeriod = "0/7 days";
            const spy1 = jest
                .spyOn(component, "getCoverageLevelPrice")
                .mockReturnValue({ id: 27, price: "12.5", spouseKnockoutDisable: true });
            const spy2 = jest.spyOn(mockPlanOfferingService, "getProductId");
            expect(
                component.getMappedTableData(
                    [coverageLevelPricing],
                    [riderStatesWithPricings],
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    [memberFlexDollar],
                    showEmployerContributions,
                    appliedCartFlexDollar,
                ),
            ).toStrictEqual([
                { coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }], rowLabel: undefined },
                {
                    coverageLevelPrices: [
                        {
                            id: 27,
                            price: "12.5",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    isReturnOfPremiumRider: false,
                    rowLabel: undefined,
                },
                {
                    coverageLevelPrices: [
                        {
                            id: 27,
                            price: "0",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    rowLabel: undefined,
                },
            ]);
            expect(spy1).toBeCalledTimes(3);
            expect(spy2).toBeCalledTimes(1);
        });

        it.skip("should return mapped coverage level EC price based on applied flex dollar price when there is cart item", () => {
            // TODO: Need to refactor this test
            const showEmployerContributions = true;
            component.planPanel.planOffering = {
                plan: { carrierId: CarrierId.AFLAC, product: { id: 2 } as Product } as Plan,
            } as PlanOffering;
            component.planPanel.cartItemInfo = {
                id: 1,
            } as GetCartItems;
            appliedCartFlexDollar = {
                cartItemId: 1,
                flexDollarOrIncentiveAmount: -3.85,
                flexDollarOrIncentiveName: "Employer Contributions",
                planId: 130,
            };
            riderStatesWithPricings.pricingDatas[0].baseCoverageLevel.eliminationPeriod = "0/7 days";
            const spy1 = jest
                .spyOn(component, "getCoverageLevelPrice")
                .mockReturnValue({ id: 27, price: "12.5", spouseKnockoutDisable: true });
            const spy2 = jest.spyOn(mockPlanOfferingService, "getProductId");
            expect(
                component.getMappedTableData(
                    [coverageLevelPricing],
                    [riderStatesWithPricings],
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    [memberFlexDollar],
                    showEmployerContributions,
                    appliedCartFlexDollar,
                ),
            ).toStrictEqual([
                { coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }], rowLabel: undefined },
                {
                    coverageLevelPrices: [
                        {
                            id: 27,
                            price: "12.5",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    isReturnOfPremiumRider: false,
                    rowLabel: undefined,
                },
                {
                    coverageLevelPrices: [
                        {
                            id: 1,
                            price: "-3.85",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    rowLabel: undefined,
                },
            ]);
            expect(spy1).toBeCalledTimes(2);
            expect(spy2).toBeCalledTimes(2);
        });

        it.skip("should return mapped coverage level EC price and not consider applied flex dollar since there is no cart item", () => {
            // TODO: Need to refactor this test
            const showEmployerContributions = true;
            component.planPanel.planOffering = {
                plan: { carrierId: CarrierId.AFLAC, product: { id: 2 } as Product } as Plan,
            } as PlanOffering;
            appliedCartFlexDollar = {
                cartItemId: 1,
                flexDollarOrIncentiveAmount: -3.85,
                flexDollarOrIncentiveName: "Employer Contributions",
                planId: 130,
            };
            riderStatesWithPricings.pricingDatas[0].baseCoverageLevel.eliminationPeriod = "0/7 days";
            const spy1 = jest
                .spyOn(component, "getCoverageLevelPrice")
                .mockReturnValue({ id: 27, price: "12.5", spouseKnockoutDisable: true });
            const spy2 = jest.spyOn(mockPlanOfferingService, "getProductId");
            expect(
                component.getMappedTableData(
                    [coverageLevelPricing],
                    [riderStatesWithPricings],
                    coverageLevelsKnockoutData,
                    selectedCoverageLevelId,
                    [memberFlexDollar],
                    showEmployerContributions,
                    appliedCartFlexDollar,
                ),
            ).toStrictEqual([
                { coverageLevelPrices: [{ id: 27, price: "12.5", spouseKnockoutDisable: true }], rowLabel: undefined },
                {
                    coverageLevelPrices: [
                        {
                            id: 27,
                            price: "12.5",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    isReturnOfPremiumRider: false,
                    rowLabel: undefined,
                },
                {
                    coverageLevelPrices: [
                        {
                            id: 27,
                            price: "0",
                            spouseKnockoutDisable: true,
                        },
                    ],
                    rowLabel: undefined,
                },
            ]);
            expect(spy1).toBeCalledTimes(3);
            expect(spy2).toBeCalledTimes(3);
        });
    });
});
