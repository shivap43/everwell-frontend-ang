import { IncomeRate } from "../../enums";

export interface SalarySummary {
    incomeRate: IncomeRate;
    annualTotal?: string | null;
    hourlyTotal?: string | null;
    hoursPerWeek?: number | null;
    hourlyWage?: string | null;
}
