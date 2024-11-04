import {
    AsyncStatus,
    PlanSeriesCategory,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesOptionBenefitAmounts,
    RateSheetPlanSeriesSettings,
} from "@empowered/constants";
import { RATE_SHEETS_FEATURE_KEY } from "./rate-sheets.selectors";
import {
    downloadRateSheetEntityAdapter,
    initialState,
    rateSheetPlanSelectionsEntityAdapter,
    rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter,
    rateSheetPlanSeriesOptionsEntityAdapter,
    rateSheetPlanSeriesSettingsEntityAdapter,
    State,
} from "./rate-sheets.state";
import * as RateSheetsSelectors from "./rate-sheets.selectors";

describe("RateSheetsSelectors", () => {
    let rateSheetsState: {
        readonly [RATE_SHEETS_FEATURE_KEY]: State;
    };

    beforeEach(() => {
        rateSheetsState = {
            [RATE_SHEETS_FEATURE_KEY]: {
                ...initialState,
                planSeries: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 200,
                            code: "some code",
                            name: "some name",
                            plans: [],
                            categories: [PlanSeriesCategory.MAC],
                        },
                    ],
                    error: null,
                },
                quickQuotePlans: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 10873,
                            carrierId: 1,
                            name: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                            adminName: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                            description: "Aflac Accident Advantage | 24-Hour coverage including Wellness Benefit",
                            planSeriesId: 200,
                            displayOrder: 6,
                            product: {
                                id: 1,
                                name: "Accident",
                                code: "",
                            },
                            missingEmployerFlyer: false,
                        },
                    ],
                    error: null,
                },
                selectedProductIndex: 0,
                rateSheetPlanSeriesSettingsEntities: rateSheetPlanSeriesSettingsEntityAdapter.setOne(
                    {
                        identifiers: {
                            productId: 1,
                            planSeriesId: 123,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {} as RateSheetPlanSeriesSettings,
                            error: null,
                        },
                    },
                    { ...initialState.rateSheetPlanSeriesSettingsEntities },
                ),
                rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.setOne(
                    {
                        identifiers: {
                            productId: 1,
                            planSeriesId: 123,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [] as RateSheetPlanSeriesOption[],
                            error: null,
                        },
                    },
                    { ...initialState.rateSheetPlanSeriesOptionsEntities },
                ),
                downloadRateSheetEntities: downloadRateSheetEntityAdapter.setOne(
                    {
                        identifiers: {
                            state: "some state",
                            partnerAccountType: "some partner account type",
                            payrollFrequencyId: 345,
                            riskClassId: 324,
                            rateSheetTitle: "My Rate Sheet",
                            zipCode: "some zip code",
                            sicCode: 33455,
                            eligibleSubscribers: 500,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: "",
                            error: null,
                        },
                    },
                    { ...initialState.downloadRateSheetEntities },
                ),
                rateSheetPlanSelectionsEntities: rateSheetPlanSelectionsEntityAdapter.setOne(
                    {
                        identifiers: {
                            productId: 1,
                            planSeriesId: 200,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    planId: 10873,
                                    coverageLevelIds: [28, 29],
                                },
                            ],
                            error: null,
                        },
                    },
                    { ...initialState.rateSheetPlanSelectionsEntities },
                ),
                rateSheetPlanSeriesOptionBenefitAmountsEntities: rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter.setOne(
                    {
                        identifiers: {
                            planSeriesId: 123,
                            state: "some state",
                            partnerAccountType: "some partner account",
                            payrollFrequencyId: 1123,
                            riskClassId: 345,
                            minAge: 18,
                            maxAge: 60,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [] as RateSheetPlanSeriesOptionBenefitAmounts[],
                            error: null,
                        },
                    },
                    { ...initialState.rateSheetPlanSeriesOptionBenefitAmountsEntities },
                ),
            },
        };
    });

    describe("getPlanSeries", () => {
        it("should get plan series object", () => {
            const result = RateSheetsSelectors.getPlanSeries(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        id: 200,
                        code: "some code",
                        name: "some name",
                        plans: [],
                        categories: [PlanSeriesCategory.MAC],
                    },
                ],
                error: null,
            });
        });
    });

    describe("getRateSheetPlanSeriesOptionsEntities", () => {
        it("should get rate sheet plan series options entities", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSeriesOptionsEntities(rateSheetsState);
            expect(result).toStrictEqual(rateSheetsState[RATE_SHEETS_FEATURE_KEY].rateSheetPlanSeriesOptionsEntities);
        });
    });

    describe("getRateSheetPlanSeriesOptions", () => {
        it("should get rateSheetPlanSeriesOptions object", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSeriesOptions(1, 123)(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [] as RateSheetPlanSeriesOption[],
                error: null,
            });
        });
    });

    describe("getDownloadRateSheetEntities", () => {
        it("should get the download rate sheet entities", () => {
            const result = RateSheetsSelectors.getDownloadRateSheetEntities(rateSheetsState);
            expect(result).toStrictEqual(rateSheetsState[RATE_SHEETS_FEATURE_KEY].downloadRateSheetEntities);
        });
    });

    describe("getDownloadRateSheetResponse", () => {
        it("should get the download rate sheet response", () => {
            const result = RateSheetsSelectors.getDownloadRateSheetResponse(
                "some state",
                "some partner account type",
                345,
                324,
                "My Rate Sheet",
                "some zip code",
                33455,
                500,
            )(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: "",
                error: null,
            });
        });
    });

    describe("getQuickQuotePlans", () => {
        it("should get Quick Quote plans", () => {
            const result = RateSheetsSelectors.getQuickQuotePlans(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        id: 10873,
                        carrierId: 1,
                        name: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                        adminName: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                        description: "Aflac Accident Advantage | 24-Hour coverage including Wellness Benefit",
                        planSeriesId: 200,
                        displayOrder: 6,
                        product: {
                            id: 1,
                            name: "Accident",
                            code: "",
                        },
                        missingEmployerFlyer: false,
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedProductIndex", () => {
        it("should get selected products's index", () => {
            const result = RateSheetsSelectors.getSelectedProductIndex(rateSheetsState);
            expect(result).toStrictEqual(0);
        });
    });

    describe("getRateSheetPlansSeriesSettingsEntities", () => {
        it("should get rate sheet's plan series settings entities", () => {
            const result = RateSheetsSelectors.getRateSheetPlansSeriesSettingsEntities(rateSheetsState);
            expect(result).toStrictEqual(rateSheetsState[RATE_SHEETS_FEATURE_KEY].rateSheetPlanSeriesSettingsEntities);
        });
    });

    describe("getRateSheetPlansSeriesSettings", () => {
        it("should get rate sheet's plan series settings", () => {
            const result = RateSheetsSelectors.getRateSheetPlansSeriesSettings(1, 123)(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {} as RateSheetPlanSeriesSettings,
                error: null,
            });
        });
    });

    describe("getCombinedQuickQuotePlansAndPlanSeries", () => {
        it("should get combined plan series data array", () => {
            const result = RateSheetsSelectors.getCombinedQuickQuotePlansAndPlanSeries(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        planSeries: [
                            {
                                id: 200,
                                code: "some code",
                                name: "some name",
                                categories: [PlanSeriesCategory.MAC],
                                plans: [
                                    {
                                        id: 10873,
                                        carrierId: 1,
                                        name: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                                        adminName:
                                            "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                                        description: "Aflac Accident Advantage | 24-Hour coverage including Wellness Benefit",
                                        planSeriesId: 200,
                                        displayOrder: 6,
                                        product: {
                                            id: 1,
                                            name: "Accident",
                                            code: "",
                                        },
                                        missingEmployerFlyer: false,
                                    },
                                ],
                            },
                        ],
                        product: {
                            id: 1,
                            name: "Accident",
                        },
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedProduct", () => {
        it("should get selected product's details", () => {
            const result = RateSheetsSelectors.getSelectedProduct(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    planSeries: [
                        {
                            id: 200,
                            code: "some code",
                            name: "some name",
                            categories: [PlanSeriesCategory.MAC],
                            plans: [
                                {
                                    id: 10873,
                                    carrierId: 1,
                                    name: "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                                    adminName:
                                        "Aflac Accident Advantage | 24-Hour Accident-Only including Wellness Benefit Insurance | Option 1",
                                    description: "Aflac Accident Advantage | 24-Hour coverage including Wellness Benefit",
                                    planSeriesId: 200,
                                    displayOrder: 6,
                                    product: {
                                        id: 1,
                                        name: "Accident",
                                        code: "",
                                    },
                                    missingEmployerFlyer: false,
                                },
                            ],
                        },
                    ],
                    product: {
                        id: 1,
                        name: "Accident",
                    },
                },
                error: null,
            });
        });
    });

    describe("getIncludedPlanSeries", () => {
        it("should get plan series and selected plans included in rate sheet", () => {
            const result = RateSheetsSelectors.getIncludedPlanSeries(rateSheetsState);
            expect(result).toStrictEqual({
                "1-200-": {
                    data: {
                        error: null,
                        status: "succeeded",
                        value: [
                            {
                                coverageLevelIds: [28, 29],
                                planId: 10873,
                            },
                        ],
                    },
                    identifiers: {
                        productId: 1,
                        planSeriesId: 200,
                    },
                },
            });
        });
    });

    describe("getRateSheetProductSelections", () => {
        it("should get an array of all products' ids included in rate sheet", () => {
            const result = RateSheetsSelectors.getRateSheetProductSelections(rateSheetsState);
            expect(result).toStrictEqual([1]);
        });
    });

    describe("getRateSheetPlanSelectionsEntities", () => {
        it("should get rate sheet's plan selection entities", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSelectionsEntities(rateSheetsState);
            expect(result).toStrictEqual(rateSheetsState[RATE_SHEETS_FEATURE_KEY].rateSheetPlanSelectionsEntities);
        });
    });

    describe("getRateSheetPlanSelections", () => {
        it("should get plan selections for specified series", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSelections(1, 200)(rateSheetsState);
            expect(result).toStrictEqual({
                error: null,
                status: "succeeded",
                value: [
                    {
                        coverageLevelIds: [28, 29],
                        planId: 10873,
                    },
                ],
            });
        });
    });

    describe("getRateSheetPlanSeriesOptionBenefitAmountsEntities", () => {
        it("should get rate sheet plan series option benefit amounts entities", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSeriesOptionBenefitAmountsEntities(rateSheetsState);
            expect(result).toStrictEqual(rateSheetsState[RATE_SHEETS_FEATURE_KEY].rateSheetPlanSeriesOptionBenefitAmountsEntities);
        });
    });

    describe("getRateSheetPlanSeriesOptionBenefitAmouNTs", () => {
        it("should get rateSheetPlanSeriesOptionBenefitAmounts object", () => {
            const result = RateSheetsSelectors.getRateSheetPlanSeriesOptionBenefitAmounts(
                123,
                "some state",
                "some partner account",
                1123,
                345,
                18,
                60,
            )(rateSheetsState);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [] as RateSheetPlanSeriesOptionBenefitAmounts[],
                error: null,
            });
        });
    });
});
