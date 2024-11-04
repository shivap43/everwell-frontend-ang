export interface GuaranteedIssue {
    id: number;
    name: string;
    displayOrder: number;
    coverageAmount?: number;
    benefitAmount: number;
    totalCost: number;
    totalCostPerPayPeriod: number;
    memberCost: number;
    memberCostPerPayPeriod: number;
}
