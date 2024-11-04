import { ProductOffering } from "../productOffering.model";
import { PlanOfferingWithCoverageDates } from "./plan-offering-with-coverage-dates.model";

export interface CombinedOfferings {
    productOffering: ProductOffering;
    planOfferingsWithCoverageDates: PlanOfferingWithCoverageDates[];
    /**
     * This is the earliest of earliestCoverageStartDate found in the CoverageDatesRecord
     */
    earliestCoverageStartDate: string | null;
    /**
     * This is the earliest of latestCoverageStartDate found in the CoverageDatesRecord
     */
    latestCoverageStartDate: string | null;
    /**
     * This is the earliest of defaultCoverageStartDate found in the CoverageDatesRecord
     */
    defaultCoverageStartDate: string | null;
}
