import { CoverageLevelProperty } from "./../../enums";

export interface GetAncillary {
    addition: boolean;
    additionEligible: boolean;
    conversion: boolean;
    conversionEligible: boolean;
    currentBenefitAmount: number;
    downgrade: boolean;
    downgradeByBenefitEligible: boolean;
    downgradeEligible: boolean;
    reinstatement: boolean;
    reinstatementEligible: boolean;
    benefitAmountOptions?: number[];
    coverageLevels: AncillaryCoverageLevel[];
    currentCoverageLevelId: number;
    retainCoverageAmountEligible: boolean;
    guaranteeIssue: boolean;
    guaranteeIssueEligible: boolean;
}

export interface AncillaryCoverageLevel {
    coverageLevelId: number;
    coverageLevelProperty: CoverageLevelProperty;
}
