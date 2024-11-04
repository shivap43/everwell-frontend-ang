import { CombinedPlanAndPlanSeries, Plan, RateSheetPlanSeriesOption, RateSheetRider } from "@empowered/constants";

export const mockPlanValueChangesTL = [
    {
        id: 11856,
        name: "Direct - Aflac Term Life | 10-year | B60000",
        adminName: "Direct - Aflac Term Life | 10-year | B60000",
        carrierId: 1,
        displayOrder: 1,
        description: "Direct - Guaranteed premium rate | 10-year Term | Portable | Renewable annually at end of term",
    },
] as Plan[];

export const mockSelectedProductTL = {
    planSeries: [],
    product: { id: 29, name: "Term Life" },
} as CombinedPlanAndPlanSeries;

export const mockPlanOptionsFilteredRidersTL = [
    {
        planId: 11856,
        riders: [
            {
                planId: 11899,
                planName: "Child Term Life Insurance Rider | B60000",
            },
            {
                planId: 11897,
                planName: "Waiver of Premium Rider | B60000",
            },
            {
                planId: 11898,
                planName: "Accidental-Death Benefit Rider | B60000",
            },
        ],
    },
] as RateSheetPlanSeriesOption[];

export const mockOptionsTL = [
    {
        planId: 11899,
        planName: "Child Term Life Insurance Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 15000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 382, name: "Accept Optional Child Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11897,
        planName: "Waiver of Premium Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 384, name: "Accept Waiver of Premium Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11898,
        planName: "Accidental-Death Benefit Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 383, name: "Accept Accidental-Death Benefit Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11859,
        planName: "10-Year Term Life Insurance Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 10000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 385, name: "10-Year Term Life Insurance Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
] as RateSheetRider[];

export const mockFilteredRidersTL = [
    {
        planId: 11899,
        planName: "Child Term Life Insurance Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 15000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 382, name: "Accept Optional Child Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11897,
        planName: "Waiver of Premium Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 384, name: "Accept Waiver of Premium Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11898,
        planName: "Accidental-Death Benefit Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 383, name: "Accept Accidental-Death Benefit Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
] as RateSheetRider[];

export const mockPlanValueChangesNonTL = [
    {
        id: 11855,
        name: "Direct - Aflac Whole Life |  B60000",
        adminName: "Direct - Aflac Whole Life | B60000",
        carrierId: 1,
        displayOrder: 1,
        description: "Direct - Guaranteed premium rate | Provides protection for entire life | Portable | Increasing Cash Value",
    },
] as Plan[];

export const mockSelectedProductNonTL = {
    planSeries: [],
    product: { id: 28, name: "Whole Life" },
} as CombinedPlanAndPlanSeries;

export const mockPlanOptionsFilteredRidersNonTL = [
    {
        planId: 11855,
        riders: [
            {
                planId: 11859,
                planName: "10-Year Term Life Insurance Rider | B60000",
            },
            {
                planId: 11862,
                planName: "Child Term Life Insurance Rider | B60000",
            },
            {
                planId: 11860,
                planName: "Waiver of Premium Rider | B60000",
            },
            {
                planId: 11861,
                planName: "Accidental-Death Benefit Rider | B60000",
            },
        ],
    },
] as RateSheetPlanSeriesOption[];

export const mockOptionsNonTL = [
    {
        planId: 11899,
        planName: "Child Term Life Insurance Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 15000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 382, name: "Accept Optional Child Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11897,
        planName: "Waiver of Premium Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 384, name: "Accept Waiver of Premium Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11898,
        planName: "Accidental-Death Benefit Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 20000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 383, name: "Accept Accidental-Death Benefit Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
    {
        planId: 11859,
        planName: "10-Year Term Life Insurance Rider | B60000",
        benefitAmounts: [{ units: 1, amount: 10000 }],
        coverageLevelOptionsMap: {
            1: [{ id: 385, name: "10-Year Term Life Insurance Rider" }],
        },
        coverageLevelOptions: undefined,
        spouseGenders: undefined,
        spouseTobaccoStatuses: undefined,
    },
];
