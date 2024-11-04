export interface HasCoverageDates {
    defaultCoverageStartDate: string;
    earliestCoverageStartDate: string;
    latestCoverageStartDate: string;
}

export interface CoverageDates extends HasCoverageDates {
    isContinuous: boolean;
}

/**
 * Keys are PlanOffering.id
 */
export type CoverageDatesRecord = Record<number, CoverageDates>;
