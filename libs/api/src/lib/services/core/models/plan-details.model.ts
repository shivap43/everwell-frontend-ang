export interface PlanDetails {
    name: string;
    value: string;
    coverageDetailDisplayName: string;
    coverageDetailDisplayValue: string;
    valueType: "BOOLEAN" | "STRING" | "INTEGER" | "CURRENCY" | "PERCENTAGE" | "MONTHS";
    network: "IN_NETWORK" | "OUT_OF_NETWORK";
}
