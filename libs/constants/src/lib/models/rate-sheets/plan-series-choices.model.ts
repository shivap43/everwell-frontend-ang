import { RiderSelection } from "../aflac/rider-selections.model";

export interface AgeBand {
    minAge: number;
    maxAge: number;
}

interface BenefitRange {
    minBenefitAmount: number;
    maxBenefitAmount: number;
}

interface CoverageLevelChoices {
    coverageLevelIds: number[];
}

export interface PlanSeriesChoice {
    planIdPdfOrderMap: Record<string, string>;
    ageBands: AgeBand[];
    coverageLevelChoices: CoverageLevelChoices;
    genders?: string[];
    tobaccoStatuses?: string[];
    spouseGender?: string;
    spouseTobaccoStatus?: string;
    benefitAmounts?: number[];
    benefitRange?: BenefitRange;
    ridersChoices?: RiderSelection[];
}
