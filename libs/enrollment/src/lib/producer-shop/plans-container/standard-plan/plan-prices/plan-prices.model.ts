export interface PlanOfferingPriceTableRow {
    rowLabel: string;
    coverageLevelPrices: CoverageLevelPrice[];
    // Use to determine Rider is returnOfPremium Rider
    isReturnOfPremiumRider?: boolean;
}

export interface CoverageLevelPrice {
    // id - coverage level id
    id: number;
    // price - indicates the pricing data for the coverage level
    price: string;
    // indicates if coverage level has to be disabled based on spouse knockout
    spouseKnockoutDisable: boolean;
}
