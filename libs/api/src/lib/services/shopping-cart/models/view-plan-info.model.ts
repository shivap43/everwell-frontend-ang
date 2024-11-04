import { Characteristics, PlanFlexDollarOrIncentives } from "@empowered/constants";

/**
 * Interface for TPI view plan details
 */
export interface ViewPlanInfoModel {
    planName: string;
    coverageLevel: string;
    riders: string[];
    taxStatus: string;
    planCost: number;
    netCost: number;
    payFrequencyName: string;
    isRider: boolean;
    cartId: number;
    isCompanyProvided: Characteristics[];
    flexDollars: PlanFlexDollarOrIncentives[];
}
