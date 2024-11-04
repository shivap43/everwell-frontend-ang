import { Plan } from "../api/plan.model";

export interface PlanSeries {
    id: number;
    code: string;
    name: string;
    categories: string[];
    plans?: Plan[];
}
