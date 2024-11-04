import { CoverageLevel } from "@empowered/constants";
import { CoveragePeriod } from "./coverage-period.model";

export interface PriceOrRates {
    uuid: string;
    minAge: number;
    maxAge: number;
    type: string;
    coverageLevel: CoverageLevel;
    tobaccoStatus: string;
    packageCode: string;
    benefitAmount?: number;
    priceMonthly?: number;
    memberPortionMonthly?: number;
    pricePerIncrement?: number;
    incrementSize?: number;
    minBenefitAmount?: number;
    maxBenefitAmount?: number;
    gender?: string;
    validity?: CoveragePeriod;
    carrierRegionId?: number;
    carrierRiskClassId?: number;
    minEligibleSalary?: number;
}
