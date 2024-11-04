import { CoverageDates } from "../coverage-dates-record.model";
import { PlanOffering } from "../planOffering.model";

export interface PlanOfferingWithCoverageDates extends CoverageDates {
    planOffering: PlanOffering;
}
