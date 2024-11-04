import { Validity } from "./validity.model";

export interface Salary {
    id?: number;
    type: "ACTUAL" | "BENEFIT";
    annualSalary?: string;
    unmaskedAnnualSalary?: string;
    hoursPerYear?: number;
    hourlyWage?: string;
    validity: Validity;
    manage?: boolean;
    masked?: boolean;
    ongoing?: boolean;
}
