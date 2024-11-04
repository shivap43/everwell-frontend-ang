import { CoveragePeriod } from "./coverage-period.model";

export interface PriceOrRatesDisplay {
    uuid?: string;
    age?: string;
    tobaccoStatus?: string;
    coverageLevel?: string;
    type?: string;
    price?: string;
    ratePer?: string;
    rate?: string;
    employerContributionPercent?: string;
    employerContributionPrice?: string;
    packageCode?: string;
    validity?: CoveragePeriod;
}
