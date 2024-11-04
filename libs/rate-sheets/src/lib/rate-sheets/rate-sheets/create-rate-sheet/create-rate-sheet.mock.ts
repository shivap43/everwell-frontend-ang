import { PlanSelections } from "@empowered/api";
import {
    Plan,
    PlanSeries,
    Product,
    CombinedPlanAndPlanSeries,
    RateSheetBenefitAmount,
    RiderSelection,
    AsyncData,
    PlanIds,
    PlanOrderElement,
    PlanSeriesPlansOrder,
    RateSheetRider,
    RateSheetPlanSeriesOption,
    AsyncStatus,
    RateSheetCoverageLevelOption,
} from "@empowered/constants";
import { RateSheetsState } from "@empowered/ngrx-store/ngrx-states/rate-sheets";
import {
    RateSheetPlanSelectionsIdentifiers,
    RateSheetPlanSelectionsEntity,
} from "@empowered/ngrx-store/ngrx-states/rate-sheets/rate-sheets.model";
import { RATE_SHEETS_FEATURE_KEY, RateSheetsPartialState } from "@empowered/ngrx-store/ngrx-states/rate-sheets/rate-sheets.reducer";
import { Dictionary } from "@ngrx/entity";

export const mockInitialState = {
    [RATE_SHEETS_FEATURE_KEY]: {
        ...RateSheetsState.initialState,
        rateSheetPlanSelectionsEntities: RateSheetsState.rateSheetPlanSelectionsEntityAdapter.setAll(
            [
                {
                    identifiers: {
                        productId: 1,
                        planSeriesId: 2,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                planId: 1463,
                                benefitAmounts: [],
                                riderSelections: [
                                    {
                                        planId: 1530,
                                        selected: false,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1505,
                                        selected: false,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RiderSelection[],
                                coverageLevelIds: [27, 28, 29, 30],
                            },
                            {
                                planId: 1528,
                                benefitAmounts: [],
                                riderSelections: [
                                    {
                                        planId: 1530,
                                        selected: false,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1505,
                                        selected: false,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RiderSelection[],
                                coverageLevelIds: [27, 28, 29, 30],
                            },
                        ] as PlanSelections[],
                        error: null,
                    },
                },
                {
                    identifiers: {
                        productId: 8,
                        planSeriesId: 23,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                planId: 1237,
                                benefitAmounts: [],
                                riderSelections: [
                                    {
                                        planId: 1240,
                                        selected: false,
                                        planName: "First-Occurrence Building Benefit Rider",
                                    },
                                    {
                                        planId: 1243,
                                        selected: false,
                                        planName: "Specified Health Event Recovery Benefit Rider",
                                    },
                                ] as RiderSelection[],
                                coverageLevelIds: [27, 28, 29, 30],
                            },
                        ] as PlanSelections[],
                        error: null,
                    },
                },
            ],
            { ...RateSheetsState.initialState.rateSheetPlanSelectionsEntities },
        ),
        rateSheetPlanSeriesOptionsEntities: RateSheetsState.rateSheetPlanSeriesOptionsEntityAdapter.setAll(
            [
                {
                    identifiers: {
                        productId: 1,
                        planSeriesId: 2,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                planId: 1463,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1530,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1505,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1464,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1531,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1508,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1465,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1532,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1509,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1466,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1533,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1510,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1528,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1529,
                                        planName: "Additional Accidental-Death Benefit Rider",
                                    },
                                    {
                                        planId: 1534,
                                        planName: "Aflac Plus Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                        ] as RateSheetPlanSeriesOption[],
                        error: null,
                    },
                },
                {
                    identifiers: {
                        productId: 8,
                        planSeriesId: 23,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                planId: 1237,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1240,
                                        planName: "First-Occurrence Building Benefit Rider",
                                    },
                                    {
                                        planId: 1243,
                                        planName: "Specified Health Event Recovery Benefit Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1238,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1241,
                                        planName: "First-Occurrence Building Benefit Rider",
                                    },
                                    {
                                        planId: 1244,
                                        planName: "Specified Health Event Recovery Benefit Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                            {
                                planId: 1239,
                                coverageLevelOptions: [
                                    {
                                        id: 27,
                                        name: "Individual",
                                    },
                                    {
                                        id: 28,
                                        name: "Named Insured / Spouse Only",
                                    },
                                    {
                                        id: 29,
                                        name: "One Parent Family",
                                    },
                                    {
                                        id: 30,
                                        name: "Two Parent Family",
                                    },
                                ] as RateSheetCoverageLevelOption[],
                                riders: [
                                    {
                                        planId: 1242,
                                        planName: "First-Occurrence Building Benefit Rider",
                                    },
                                    {
                                        planId: 1245,
                                        planName: "Specified Health Event Recovery Benefit Rider",
                                    },
                                ] as RateSheetRider[],
                            },
                        ] as RateSheetPlanSeriesOption[],
                        error: null,
                    },
                },
            ],
            { ...RateSheetsState.initialState.rateSheetPlanSeriesOptionsEntities },
        ),
    },
} as RateSheetsPartialState;

export const mockCombinedQuickQuotePlansAndPlanSeries = [
    {
        planSeries: [
            {
                id: 2,
                code: "A36000",
                name: "Aflac Accident Advantage",
                plans: [
                    {
                        adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [11413, 1530, 11408, 1505],
                        description: "Aflac Accident Advantage | 24-Hour coverage",
                        displayOrder: 8,
                        enrollable: true,
                        id: 1463,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
                        planSeriesId: 2,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A36100",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Accident",
                            cardColorCode: "b71c1c",
                            carrierIds: [1, 9, 10, 12],
                            description:
                                "Whether you're at home, at work or on the road, accidents can happen. \
                                Make sure you're well-protected no matter where you are.",
                            displayOrder: 1,
                            iconLocation: "{fileServer}/images/aflac/products/icon/accident.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/accident.svg",
                            id: 1,
                            name: "Accident",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 1",
                    } as Plan,
                    {
                        adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 2",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [11414, 1531, 11409, 1508],
                        description: "Aflac Accident Advantage | 24-Hour coverage",
                        displayOrder: 8,
                        enrollable: true,
                        id: 1464,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 2",
                        planSeriesId: 2,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A36200",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Accident",
                            cardColorCode: "b71c1c",
                            carrierIds: [1, 9, 10, 12],
                            description:
                                "Whether you're at home, at work or on the road, accidents can happen. \
                                Make sure you're well-protected no matter where you are.",
                            displayOrder: 1,
                            iconLocation: "{fileServer}/images/aflac/products/icon/accident.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/accident.svg",
                            id: 1,
                            name: "Accident",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 2",
                    } as Plan,
                    {
                        adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 3",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [11415, 1532, 11410, 1509],
                        description: "Aflac Accident Advantage | 24-Hour coverage",
                        displayOrder: 8,
                        enrollable: true,
                        id: 1465,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 3",
                        planSeriesId: 2,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A36200",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Accident",
                            cardColorCode: "b71c1c",
                            carrierIds: [1, 9, 10, 12],
                            description:
                                "Whether you're at home, at work or on the road, accidents can happen. \
                                Make sure you're well-protected no matter where you are.",
                            displayOrder: 1,
                            iconLocation: "{fileServer}/images/aflac/products/icon/accident.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/accident.svg",
                            id: 1,
                            name: "Accident",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 3",
                    } as Plan,
                    {
                        adminName: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 4",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [11416, 1533, 11411, 1510],
                        description: "Aflac Accident Advantage | 24-Hour coverage",
                        displayOrder: 8,
                        enrollable: true,
                        id: 1466,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 4",
                        planSeriesId: 2,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A36400",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Accident",
                            cardColorCode: "b71c1c",
                            carrierIds: [1, 9, 10, 12],
                            description:
                                "Whether you're at home, at work or on the road, accidents can happen. \
                                Make sure you're well-protected no matter where you are.",
                            displayOrder: 1,
                            iconLocation: "{fileServer}/images/aflac/products/icon/accident.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/accident.svg",
                            id: 1,
                            name: "Accident",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 4",
                    } as Plan,
                    {
                        adminName: "Aflac Accident Advantage | Off-The-Job Accident-Only Insurance",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [11412, 11417, 1529, 1534],
                        description: "Aflac Accident Advantage | Off-the-Job coverage",
                        displayOrder: 12,
                        enrollable: true,
                        id: 1528,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Accident Advantage | Off-The-Job Accident-Only Insurance",
                        planSeriesId: 2,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A363OF",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Accident",
                            cardColorCode: "b71c1c",
                            carrierIds: [1, 9, 10, 12],
                            description:
                                "Whether you're at home, at work or on the road, accidents can happen. \
                                Make sure you're well-protected no matter where you are.",
                            displayOrder: 1,
                            iconLocation: "{fileServer}/images/aflac/products/icon/accident.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/accident.svg",
                            id: 1,
                            name: "Accident",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Off-The-Job Accident-Only Insurance",
                    } as Plan,
                ] as Plan[],
            },
        ] as Array<PlanSeries & { plans: Plan[] }>,
        product: {
            id: 1,
            name: "Accident",
        } as Product,
    } as CombinedPlanAndPlanSeries,
    {
        planSeries: [
            {
                id: 23,
                code: "A74000",
                name: "Aflac Critical Care Protection",
                plans: [
                    {
                        adminName: "Aflac Critical Care Protection | Option 1",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [1240, 1243],
                        description:
                            "First-Occurrence Benefit | Subsequent Specified Health Event Benefit | Coronary Angioplasty Benefit | \
                            Hospital Confinement Benefit | Continuing Care Benefit",
                        displayOrder: 1,
                        enrollable: true,
                        id: 1237,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Critical Care Protection | Option 1",
                        planSeriesId: 23,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A74100",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "CI",
                            cardColorCode: "1e88e5",
                            carrierIds: [1, 9, 10, 11, 12],
                            description:
                                "Helps with out-of-pocket costs if you're ever diagnosed with a covered major illness \
                                such as cancer, a heart attack or stroke.",
                            displayOrder: 22,
                            iconLocation: "{fileServer}/images/aflac/products/icon/critical_Illness.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/critical_Illness.svg",
                            id: 8,
                            name: "Critical Illness",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 1",
                    } as Plan,
                    {
                        adminName: "Aflac Critical Care Protection | Option 2",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [1241, 1244],
                        description:
                            "First-Occurrence Benefit | Subsequent Specified Health Event Benefit | Coronary Angioplasty Benefit | \
                            Hospital Confinement Benefit | Continuing Care Benefit",
                        displayOrder: 2,
                        enrollable: true,
                        id: 1238,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Critical Care Protection | Option 2",
                        planSeriesId: 23,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A74200",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "CI",
                            cardColorCode: "1e88e5",
                            carrierIds: [1, 9, 10, 11, 12],
                            description:
                                "Helps with out-of-pocket costs if you're ever diagnosed with a covered major illness \
                                such as cancer, a heart attack or stroke.",
                            displayOrder: 22,
                            iconLocation: "{fileServer}/images/aflac/products/icon/critical_Illness.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/critical_Illness.svg",
                            id: 8,
                            name: "Critical Illness",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 2",
                    } as Plan,
                    {
                        adminName: "Aflac Critical Care Protection | Option 3",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [1242, 1245],
                        description:
                            "First-Occurrence Benefit | Subsequent Specified Health Event Benefit | Coronary Angioplasty Benefit | \
                            Hospital Confinement Benefit | Continuing Care Benefit",
                        displayOrder: 3,
                        enrollable: true,
                        id: 1239,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Critical Care Protection | Option 3",
                        planSeriesId: 23,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A74300",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "CI",
                            cardColorCode: "1e88e5",
                            carrierIds: [1, 9, 10, 11, 12],
                            description:
                                "Helps with out-of-pocket costs if you're ever diagnosed with a covered major illness \
                                such as cancer, a heart attack or stroke.",
                            displayOrder: 22,
                            iconLocation: "{fileServer}/images/aflac/products/icon/critical_Illness.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/critical_Illness.svg",
                            id: 8,
                            name: "Critical Illness",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option 3",
                    } as Plan,
                ] as Plan[],
            },
            {
                id: 22,
                planSeriesCode: "A73000",
                name: "Aflac Lump Sum Critical Illness",
                plans: [
                    {
                        adminName: "Aflac Lump Sum Critical Illness",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [10907, 10075, 11199, 6585],
                        description:
                            "Offers benefits to help cover the costs associated with a heart attack, \
                            stroke, coma, paralysis &amp; other covered illnesses.",
                        displayOrder: 6,
                        enrollable: true,
                        id: 8,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Lump Sum Critical Illness",
                        planSeriesId: 22,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A73100",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "CI",
                            cardColorCode: "1e88e5",
                            carrierIds: [1, 9, 10, 11, 12],
                            description:
                                "Helps with out-of-pocket costs if you're ever diagnosed with a covered major illness \
                                such as cancer, a heart attack or stroke.",
                            displayOrder: 22,
                            iconLocation: "{fileServer}/images/aflac/products/icon/critical_Illness.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/critical_Illness.svg",
                            id: 8,
                            name: "Critical Illness",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Aflac Lump Sum Critical Illness",
                    } as Plan,
                    {
                        adminName: "Aflac Lump Sum Critical Illness | Option H  ",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: [],
                        dependentPlanIds: [7095, 10092, 10144, 7096],
                        description: "Aflac Lump Sum Critical Illness | Option H  ",
                        displayOrder: 7,
                        enrollable: true,
                        id: 9,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Lump Sum Critical Illness | Option H  ",
                        planSeriesId: 22,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "A7310H",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "CI",
                            cardColorCode: "1e88e5",
                            carrierIds: [1, 9, 10, 11, 12],
                            description:
                                "Helps with out-of-pocket costs if you're ever diagnosed with a covered major illness \
                                such as cancer, a heart attack or stroke.",
                            displayOrder: 22,
                            iconLocation: "{fileServer}/images/aflac/products/icon/critical_Illness.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/critical_Illness.svg",
                            id: 8,
                            name: "Critical Illness",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Option H",
                    } as Plan,
                ] as Plan[],
            },
        ] as Array<PlanSeries & { plans: Plan[] }>,
        product: {
            id: 8,
            name: "Critical Illness",
        } as Product,
    } as CombinedPlanAndPlanSeries,
    {
        planSeries: [
            {
                id: 38,
                code: "B61000",
                name: "Aflac Individual Juvenile Life",
                plans: [
                    {
                        adminName: "Aflac Individual Juvenile Term Life",
                        carrierId: 1,
                        carrierNameOverride: "Aflac",
                        characteristics: ["STACKABLE"],
                        dependentPlanIds: [],
                        description: "Guaranteed premium rate | Provides protection for entire life | Portable | Increasing Cash Value",
                        displayOrder: 2,
                        enrollable: true,
                        id: 11587,
                        mutuallyExclusivePlanIds: [],
                        name: "Aflac Individual Juvenile Term Life | B61000",
                        planSeriesId: 38,
                        policyOwnershipType: "INDIVIDUAL",
                        policySeries: "B61JTO",
                        pricingEditable: false,
                        pricingModel: "UNIVERSAL",
                        product: {
                            adminName: "Juvenile Term Life",
                            cardColorCode: "ffea00",
                            carrierIds: [1, 10, 11, 32],
                            description: "Juvenile Term Life Insurance provides coverage with fixed payments for a fixed period of time.",
                            displayOrder: 55,
                            iconLocation: "{fileServer}/images/aflac/products/icon/life.svg",
                            iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/life.svg",
                            id: 67,
                            name: "Juvenile Term Life",
                            valueAddedService: false,
                        },
                        rider: false,
                        shortName: "Aflac Individual Juvenile Term Life",
                    } as Plan,
                ] as Plan[],
            },
        ] as Array<PlanSeries & { plans: Plan[] }>,
        product: {
            id: 67,
            name: "Juvenile Term Life",
        } as Product,
    } as CombinedPlanAndPlanSeries,
] as CombinedPlanAndPlanSeries[];

export const mockIncludedPlanSeries = {
    "1-2": {
        identifiers: {
            planSeriesId: 2,
            productId: 1,
        } as RateSheetPlanSelectionsIdentifiers,
        data: {
            error: null,
            status: "succeeded",
            value: [
                {
                    planId: 1463 as number,
                    coverageLevelIds: [27, 28, 29, 30] as number[],
                    eliminationPeriods: undefined as number[],
                    benefitAmounts: [] as RateSheetBenefitAmount[],
                    riderSelections: [
                        {
                            selected: false,
                            planName: "Additional Accidental-Death Benefit Rider",
                            planId: 1530,
                            enableRiders: {},
                        } as RiderSelection,
                        {
                            selected: false,
                            planName: "Aflac Plus Rider",
                            planId: 1505,
                            enableRiders: {},
                        } as RiderSelection,
                    ] as RiderSelection[],
                } as PlanSelections,
                {
                    planId: 1528 as number,
                    coverageLevelIds: [27, 28, 29, 30] as number[],
                    eliminationPeriods: undefined as number[],
                    benefitAmounts: [] as RateSheetBenefitAmount[],
                    riderSelections: [
                        {
                            selected: false,
                            planName: "Additional Accidental-Death Benefit Rider",
                            planId: 1530,
                            enableRiders: {},
                        } as RiderSelection,
                        {
                            selected: false,
                            planName: "Aflac Plus Rider",
                            planId: 1505,
                            enableRiders: {},
                        } as RiderSelection,
                    ] as RiderSelection[],
                } as PlanSelections,
            ] as PlanSelections[],
        } as AsyncData<PlanSelections[]>,
    } as RateSheetPlanSelectionsEntity<AsyncData<PlanSelections[]>>,
    "8-23": {
        identifiers: {
            planSeriesId: 23,
            productId: 8,
        } as RateSheetPlanSelectionsIdentifiers,
        data: {
            error: null,
            status: "succeeded",
            value: [
                {
                    planId: 1237 as number,
                    coverageLevelIds: [27, 28, 29, 30] as number[],
                    eliminationPeriods: undefined as number[],
                    benefitAmounts: [] as RateSheetBenefitAmount[],
                    riderSelections: [
                        {
                            selected: false,
                            planName: "First-Occurrence Building Benefit Rider",
                            planId: 1240,
                            enableRiders: {},
                        } as RiderSelection,
                        {
                            selected: false,
                            planName: "Specified Health Event Recovery Benefit Rider",
                            planId: 1243,
                            enableRiders: {},
                        } as RiderSelection,
                    ] as RiderSelection[],
                } as PlanSelections,
            ] as PlanSelections[],
        } as AsyncData<PlanSelections[]>,
    } as RateSheetPlanSelectionsEntity<AsyncData<PlanSelections[]>>,
} as Dictionary<RateSheetPlanSelectionsEntity<AsyncData<PlanSelections[]>>>;

export const mockIncludedPlansIds = [
    {
        productId: 1,
        planSeriesId: 2,
        planId: 1463,
        sortingIndex: 0,
        planSeriesCategory: undefined,
    } as PlanIds,
    {
        productId: 1,
        planSeriesId: 2,
        planId: 1528,
        sortingIndex: 0,
        planSeriesCategory: undefined,
    } as PlanIds,
    {
        productId: 8,
        planSeriesId: 23,
        planId: 1237,
        sortingIndex: 1,
        planSeriesCategory: undefined,
    } as PlanIds,
] as PlanIds[];

export const mockPlanOrder = [
    {
        product: "Accident",
        plan: "Aflac Accident Advantage | 24-Hour Accident-Only Insurance | Option 1",
        riders: 0,
        productId: 1,
        planId: 1463,
        planSeriesId: 2,
        planSeriesCategory: undefined,
    },
    {
        product: "Accident",
        plan: "Aflac Accident Advantage | Off-The-Job Accident-Only Insurance",
        riders: 0,
        productId: 1,
        planId: 1528,
        planSeriesId: 2,
        planSeriesCategory: undefined,
    },
    {
        product: "Critical Illness",
        plan: "Aflac Critical Care Protection | Option 1",
        riders: 0,
        productId: 8,
        planId: 1237,
        planSeriesId: 23,
        planSeriesCategory: undefined,
    },
] as PlanOrderElement[];

export const mockPlanOrderMaps = [
    {
        planSeriesCategory: undefined,
        planSeriesId: 2,
        productId: 1,
        plansMap: {
            "1463": "1",
            "1528": "2",
        } as Record<string, string>,
    } as PlanSeriesPlansOrder,
    {
        planSeriesCategory: undefined,
        planSeriesId: 23,
        productId: 8,
        plansMap: {
            "1237": "3",
        } as Record<string, string>,
    } as PlanSeriesPlansOrder,
] as PlanSeriesPlansOrder[];

export const planSelectionsAccident = {
    error: null,
    status: "succeeded",
    value: [
        {
            benefitAmounts: [],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 1463,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 1464,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 1465,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 1466,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 1528,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Additional Accidental-Death Benefit Rider": "false",
                        "Aflac Plus Rider": "false",
                    },
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
    ],
} as AsyncData<PlanSelections[]>;

export const planSelectionsHospital = {
    error: null,
    status: "succeeded",
    value: [
        {
            benefitAmounts: [{ amount: 500 }, { amount: 1000 }, { amount: 1500 }, { amount: 2000 }],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 10169,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10172,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10175,
                    planName: "Hospital Stay and Surgical Care Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10174,
                    planName: "Extended Benefits Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [{ amount: 500 }, { amount: 1000 }, { amount: 1500 }, { amount: 2000 }],
            coverageLevelIds: [27, 28, 29, 30],
            eliminationPeriods: undefined,
            planId: 10170,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10172,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10175,
                    planName: "Hospital Stay and Surgical Care Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Hospital Stay and Surgical Care Rider": "false",
                        "Extended Benefits Rider": "false",
                    },
                    planId: 10174,
                    planName: "Extended Benefits Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
    ],
} as AsyncData<PlanSelections[]>;

export const planSelectionsJuvenileTL = {
    error: null,
    status: "succeeded",
    value: [
        {
            benefitAmounts: [{ amount: 10000 }, { amount: 20000 }, { amount: 30000 }],
            coverageLevelIds: [1],
            eliminationPeriods: undefined,
            planId: 11587,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: undefined,
        },
    ],
} as AsyncData<PlanSelections[]>;

export const planSelectionsSTD = {
    error: null,
    status: "succeeded",
    value: [
        {
            benefitAmounts: [
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ],
            coverageLevelIds: undefined,
            eliminationPeriods: [16, 17, 18, 19, 20, 21, 22, 302, 303, 304],
            planId: 17,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    benefitAmount: 300,
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6573,
                    planName: "On-the-Job Injury Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6578,
                    planName: "Aflac Value Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 1072,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ],
            coverageLevelIds: undefined,
            eliminationPeriods: [16, 17, 18, 19, 20, 21, 22, 302, 303, 304],
            planId: 18,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    benefitAmount: 300,
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6573,
                    planName: "On-the-Job Injury Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6578,
                    planName: "Aflac Value Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 1072,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ],
            coverageLevelIds: undefined,
            eliminationPeriods: [16, 17, 18, 19, 20, 21, 22, 302, 303, 304],
            planId: 6567,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    benefitAmount: 300,
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6573,
                    planName: "On-the-Job Injury Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6578,
                    planName: "Aflac Value Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 1072,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ],
            coverageLevelIds: undefined,
            eliminationPeriods: [16, 17, 18, 19, 20, 21, 22, 302, 303, 304],
            planId: 6568,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    benefitAmount: 300,
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6573,
                    planName: "On-the-Job Injury Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6578,
                    planName: "Aflac Value Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 1072,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    minBenefitAmount: {
                        units: 6,
                        amount: 600,
                    },
                    maxBenefitAmount: {
                        units: 15,
                        amount: 1500,
                    },
                },
            ],
            coverageLevelIds: undefined,
            eliminationPeriods: [16, 17, 18, 19, 20, 21, 22, 302, 303, 304],
            planId: 6569,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    benefitAmount: 300,
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6573,
                    planName: "On-the-Job Injury Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 6578,
                    planName: "Aflac Value Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Aflac Plus Rider": "false",
                        "Aflac Value Rider": "false",
                        "On-the-Job Injury Rider": "false",
                    },
                    planId: 1072,
                    planName: "Aflac Plus Rider",
                    selected: true,
                    spouseCoverageLevel: [],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
    ],
} as AsyncData<PlanSelections[]>;

export const planSelectionsTermLife = {
    error: null,
    status: "succeeded",
    value: [
        {
            benefitAmounts: [
                {
                    benefitAmountSelected: {
                        amount: 25000,
                        units: 5,
                    },
                },
            ],
            coverageLevelIds: [1],
            eliminationPeriods: undefined,
            planId: 1308,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1312,
                    planName: "Spouse Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: "FEMALE",
                    spouseTobaccoStatus: "NONTOBACCO",
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1316,
                    planName: "Child Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1320,
                    planName: "Waiver of Premium Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1324,
                    planName: "Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    benefitAmountSelected: {
                        amount: 25000,
                        units: 5,
                    },
                },
            ],
            coverageLevelIds: [1],
            eliminationPeriods: undefined,
            planId: 1307,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1312,
                    planName: "Spouse Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: "FEMALE",
                    spouseTobaccoStatus: "NONTOBACCO",
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1316,
                    planName: "Child Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1320,
                    planName: "Waiver of Premium Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1324,
                    planName: "Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
        {
            benefitAmounts: [
                {
                    benefitAmountSelected: {
                        amount: 25000,
                        units: 5,
                    },
                },
            ],
            coverageLevelIds: [1],
            eliminationPeriods: undefined,
            planId: 1306,
            planSeriesCategory: undefined,
            planTypes: undefined,
            riderSelections: [
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1312,
                    planName: "Spouse Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: "FEMALE",
                    spouseTobaccoStatus: "NONTOBACCO",
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1316,
                    planName: "Child Term Life Insurance Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1320,
                    planName: "Waiver of Premium Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
                {
                    coverageLevel: undefined,
                    coverageLevelOption: "10 year term",
                    enableRiders: {
                        "Accidental-Death Benefit Rider": "false",
                        "Child Term Life Insurance Rider": "false",
                        "Spouse Term Life Insurance Rider": "false",
                        "Waiver of Premium Rider": "false",
                    },
                    planId: 1324,
                    planName: "Accidental-Death Benefit Rider",
                    selected: true,
                    spouseCoverageLevel: [
                        "Spouse 10-Year Term Life Insurance Rider",
                        "Spouse 20-Year Term Life Insurance Rider",
                        "Spouse 30-Year Term Life Insurance Rider",
                    ],
                    spouseGender: undefined,
                    spouseTobaccoStatus: undefined,
                } as RiderSelection,
            ],
        },
    ],
} as AsyncData<PlanSelections[]>;

export const planSeriesOptionsAccident = {
    error: null,
    status: "succeeded",
    value: [
        {
            planId: 1463,
            coverageLevelOptions: [
                { id: 27, name: "Individual" },
                { id: 28, name: "Named Insured / Spouse Only" },
                { id: 29, name: "One Parent Family" },
                { id: 30, name: "Two Parent Family" },
            ],
            riders: [
                {
                    planId: 1530,
                    planName: "Additional Accidental-Death Benefit Rider",
                    coverageLevelOptionsMap: {
                        27: [{ id: 27, name: "Individual" }],
                        28: [{ id: 28, name: "Named Insured / Spouse Only" }],
                        29: [{ id: 29, name: "One Parent Family" }],
                        30: [{ id: 30, name: "Two Parent Family" }],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
                {
                    planId: 1505,
                    planName: "Aflac Plus Rider",
                    coverageLevelOptionsMap: {
                        27: [
                            { id: 298, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 294, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        28: [
                            { id: 295, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 299, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                        29: [
                            { id: 300, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 296, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        30: [
                            { id: 297, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 301, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1464,
            coverageLevelOptions: [
                { id: 27, name: "Individual" },
                { id: 28, name: "Named Insured / Spouse Only" },
                { id: 29, name: "One Parent Family" },
                { id: 30, name: "Two Parent Family" },
            ],
            riders: [
                {
                    planId: 1531,
                    planName: "Additional Accidental-Death Benefit Rider",
                    coverageLevelOptionsMap: {
                        27: [{ id: 27, name: "Individual" }],
                        28: [{ id: 28, name: "Named Insured / Spouse Only" }],
                        29: [{ id: 29, name: "One Parent Family" }],
                        30: [{ id: 30, name: "Two Parent Family" }],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
                {
                    planId: 1508,
                    planName: "Aflac Plus Rider",
                    coverageLevelOptionsMap: {
                        27: [
                            { id: 298, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 294, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        28: [
                            { id: 295, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 299, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                        29: [
                            { id: 300, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 296, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        30: [
                            { id: 297, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 301, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1465,
            coverageLevelOptions: [
                { id: 27, name: "Individual" },
                { id: 28, name: "Named Insured / Spouse Only" },
                { id: 29, name: "One Parent Family" },
                { id: 30, name: "Two Parent Family" },
            ],
            riders: [
                {
                    planId: 1532,
                    planName: "Additional Accidental-Death Benefit Rider",
                    coverageLevelOptionsMap: {
                        27: [{ id: 27, name: "Individual" }],
                        28: [{ id: 28, name: "Named Insured / Spouse Only" }],
                        29: [{ id: 29, name: "One Parent Family" }],
                        30: [{ id: 30, name: "Two Parent Family" }],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
                {
                    planId: 1509,
                    planName: "Aflac Plus Rider",
                    coverageLevelOptionsMap: {
                        27: [
                            { id: 298, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 294, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        28: [
                            { id: 295, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 299, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                        29: [
                            { id: 300, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 296, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        30: [
                            { id: 297, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 301, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1466,
            coverageLevelOptions: [
                { id: 27, name: "Individual" },
                { id: 28, name: "Named Insured / Spouse Only" },
                { id: 29, name: "One Parent Family" },
                { id: 30, name: "Two Parent Family" },
            ],
            riders: [
                {
                    planId: 1533,
                    planName: "Additional Accidental-Death Benefit Rider",
                    coverageLevelOptionsMap: {
                        27: [{ id: 27, name: "Individual" }],
                        28: [{ id: 28, name: "Named Insured / Spouse Only" }],
                        29: [{ id: 29, name: "One Parent Family" }],
                        30: [{ id: 30, name: "Two Parent Family" }],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
                {
                    planId: 1510,
                    planName: "Aflac Plus Rider",
                    coverageLevelOptionsMap: {
                        27: [
                            { id: 298, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 294, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        28: [
                            { id: 295, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 299, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                        29: [
                            { id: 300, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 296, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        30: [
                            { id: 297, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 301, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1528,
            coverageLevelOptions: [
                { id: 27, name: "Individual" },
                { id: 28, name: "Named Insured / Spouse Only" },
                { id: 29, name: "One Parent Family" },
                { id: 30, name: "Two Parent Family" },
            ],
            riders: [
                {
                    planId: 1534,
                    planName: "Additional Accidental-Death Benefit Rider",
                    coverageLevelOptionsMap: {
                        27: [{ id: 27, name: "Individual" }],
                        28: [{ id: 28, name: "Named Insured / Spouse Only" }],
                        29: [{ id: 29, name: "One Parent Family" }],
                        30: [{ id: 30, name: "Two Parent Family" }],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
                {
                    planId: 1529,
                    planName: "Aflac Plus Rider",
                    coverageLevelOptionsMap: {
                        27: [
                            { id: 298, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 294, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        28: [
                            { id: 295, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 299, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                        29: [
                            { id: 300, name: "Aflac Plus Rider (Series CIRIDER)" },
                            { id: 296, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                        ],
                        30: [
                            { id: 297, name: "Aflac Plus Rider (Series CIRIDERH | HSA-Compatible)" },
                            { id: 301, name: "Aflac Plus Rider (Series CIRIDER)" },
                        ],
                    },
                    coverageLevelOptions: undefined,
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                    benefitAmounts: null,
                } as RateSheetRider,
            ],
        },
    ],
} as AsyncData<RateSheetPlanSeriesOption[]>;

export const planSeriesOptionsJuvenileTL = {
    error: null,
    status: "succeeded",
    value: [
        {
            planId: 11587,
            ageBands: [{ minAge: 0, maxAge: 17 }],
            benefitAmounts: [{ amount: 10000 }, { amount: 20000 }, { amount: 30000 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
        },
        {
            planId: 11586,
            ageBands: [
                { minAge: 0, maxAge: 0 },
                { minAge: 1, maxAge: 1 },
                { minAge: 2, maxAge: 2 },
                { minAge: 3, maxAge: 3 },
                { minAge: 4, maxAge: 4 },
                { minAge: 5, maxAge: 5 },
                { minAge: 6, maxAge: 6 },
                { minAge: 7, maxAge: 7 },
                { minAge: 8, maxAge: 8 },
                { minAge: 9, maxAge: 9 },
                { minAge: 10, maxAge: 10 },
                { minAge: 11, maxAge: 11 },
                { minAge: 12, maxAge: 12 },
                { minAge: 13, maxAge: 13 },
                { minAge: 14, maxAge: 14 },
                { minAge: 15, maxAge: 15 },
                { minAge: 16, maxAge: 16 },
                { minAge: 17, maxAge: 17 },
            ],
            benefitAmounts: [{ amount: 10000 }, { amount: 20000 }, { amount: 30000 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
        },
    ],
} as AsyncData<RateSheetPlanSeriesOption[]>;

export const planSeriesOptionsTermLife = {
    error: null,
    status: "succeeded",
    value: [
        {
            planId: 1308,
            ageBands: [{ minAge: 18, maxAge: 68 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
            genders: ["FEMALE", "MALE"],
            tobaccoStatuses: ["TOBACCO", "NONTOBACCO"],
            riders: [
                {
                    planId: 1312,
                    planName: "Spouse Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 10000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 241, name: "Spouse 10-Year Term Life Insurance Rider" }],
                    },
                    spouseGenders: ["FEMALE", "MALE"],
                    spouseTobaccoStatuses: ["NONTOBACCO", "TOBACCO"],
                } as RateSheetRider,
                {
                    planId: 1316,
                    planName: "Child Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 5000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 244, name: "Accept Optional Child Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1320,
                    planName: "Waiver of Premium Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 245, name: "Accept Waiver of Premium Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1324,
                    planName: "Accidental-Death Benefit Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 246, name: "Accept Accidental-Death Benefit Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1307,
            ageBands: [{ minAge: 18, maxAge: 60 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
            genders: ["FEMALE", "MALE"],
            tobaccoStatuses: ["TOBACCO", "NONTOBACCO"],
            riders: [
                {
                    planId: 1311,
                    planName: "Spouse Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 10000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [
                            { id: 242, name: "Spouse 20-Year Term Life Insurance Rider" },
                            { id: 241, name: "Spouse 10-Year Term Life Insurance Rider" },
                        ],
                    },
                    spouseGenders: ["FEMALE", "MALE"],
                    spouseTobaccoStatuses: ["NONTOBACCO", "TOBACCO"],
                } as RateSheetRider,
                {
                    planId: 1315,
                    planName: "Child Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 5000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 244, name: "Accept Optional Child Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1319,
                    planName: "Waiver of Premium Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 245, name: "Accept Waiver of Premium Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1323,
                    planName: "Accidental-Death Benefit Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 246, name: "Accept Accidental-Death Benefit Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1306,
            ageBands: [{ minAge: 18, maxAge: 50 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
            genders: ["FEMALE", "MALE"],
            tobaccoStatuses: ["TOBACCO", "NONTOBACCO"],
            riders: [
                {
                    planId: 1310,
                    planName: "Spouse Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 10000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [
                            { id: 241, name: "Spouse 10-Year Term Life Insurance Rider" },
                            { id: 243, name: "Spouse 30-Year Term Life Insurance Rider" },
                        ],
                    },
                    spouseGenders: ["FEMALE", "MALE"],
                    spouseTobaccoStatuses: ["NONTOBACCO", "TOBACCO"],
                } as RateSheetRider,
                {
                    planId: 1314,
                    planName: "Child Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 5000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 244, name: "Accept Optional Child Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1318,
                    planName: "Waiver of Premium Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 245, name: "Accept Waiver of Premium Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1322,
                    planName: "Accidental-Death Benefit Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 246, name: "Accept Accidental-Death Benefit Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
            ],
        },
        {
            planId: 1305,
            ageBands: [{ minAge: 18, maxAge: 70 }],
            coverageLevelOptions: [{ id: 1, name: "Enrolled" }],
            genders: ["FEMALE", "MALE"],
            tobaccoStatuses: ["TOBACCO", "NONTOBACCO"],
            riders: [
                {
                    planId: 1309,
                    planName: "Spouse Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 10000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 241, name: "Spouse 10-Year Term Life Insurance Rider" }],
                    },
                    spouseGenders: ["FEMALE", "MALE"],
                    spouseTobaccoStatuses: ["NONTOBACCO", "TOBACCO"],
                } as RateSheetRider,
                {
                    planId: 1313,
                    planName: "Child Term Life Insurance Rider",
                    benefitAmounts: [{ units: 1, amount: 5000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 244, name: "Accept Optional Child Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1317,
                    planName: "Waiver of Premium Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 245, name: "Accept Waiver of Premium Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
                {
                    planId: 1321,
                    planName: "Accidental-Death Benefit Rider",
                    benefitAmounts: [{ units: 1, amount: 20000 }],
                    coverageLevelOptions: undefined,
                    coverageLevelOptionsMap: {
                        1: [{ id: 246, name: "Accept Accidental-Death Benefit Rider" }],
                    },
                    spouseGenders: null,
                    spouseTobaccoStatuses: null,
                } as RateSheetRider,
            ],
        },
    ],
} as AsyncData<RateSheetPlanSeriesOption[]>;
