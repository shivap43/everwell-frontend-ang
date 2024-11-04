import { Plan, Product } from "../api";
import { PlanSeries } from "./plan-series.model";

export interface CombinedPlanAndPlanSeries {
    planSeries: Array<PlanSeries & { plans: Plan[] }>;
    product: Product;
}
