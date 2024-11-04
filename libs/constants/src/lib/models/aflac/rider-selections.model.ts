export interface RiderSelection {
    planId?: number;
    coverageLevelId?: number;
    benefitAmount?: number;
    childAge?: number;
    coverageLevelIds?: number[];
    benefitAmounts?: number[];
    selected?: boolean;
    spouseTobaccoStatus?: string;
    spouseGender?: string;
    enableRiders?: { [key: string]: string };
    planName?: string;
}
