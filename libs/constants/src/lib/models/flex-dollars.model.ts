/**
 * Interface for Flex Dollar
 */
export interface FlexDollarModel {
    aggregateFlexDollarOrIncentives: AggregateFlexDollarOrIncentive[];
    planFlexDollarOrIncentives: PlanFlexDollarOrIncentives[];
}

/**
 * Interface for Plan Flex Dollar
 */
export interface PlanFlexDollarOrIncentives {
    planId: number;
    cartItemId: number;
    enrollmentId: number;
    flexDollarOrIncentiveName: string;
    flexDollarOrIncentiveAmount: number;
}

/**
 * Interface for Aggregate Flex Dollar
 */
export interface AggregateFlexDollarOrIncentive {
    flexDollarOrIncentiveName: string;
    flexDollarOrIncentiveAmount: number;
}
