export interface PlanIds {
    productId: number;
    planSeriesId: number;
    planId: number;
    sortingIndex: number;
    planSeriesCategory?: string;
}

export interface PlanOrderElement {
    product: string;
    plan: string;
    riders: number;
    productId: number;
    planId: number;
    planSeriesId: number;
    planSeriesCategory?: string;
}

export interface RiderChoices {
    planId: number;
    coverageLevelIds: number[];
    benefitAmount?: number;
}

export interface Riders {
    ridersChoices: RiderChoices[];
    spouseGender: string;
    spouseTobaccoStatus: string;
}

export interface PlanSeriesPlansOrder {
    planSeriesId: number;
    productId: number;
    plansMap: Record<string, string>;
    planSeriesCategory?: string;
}

export interface AddedPlans {
    productId: number;
    planSeriesId: number;
    planSeriesCategory?: string;
}
