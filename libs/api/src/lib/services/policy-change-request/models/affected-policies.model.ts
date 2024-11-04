import { Name } from "@empowered/constants";

export interface AffectedPolicies {
    policyNumber: string;
    policyName: string;
    productId: number;
    rider?: boolean;
    accountNumber: string;
    accountName?: string;
    billingName: Name;
    accountType?: "PAYROLL_DEDUCTION" | "DIRECT_PAY";
    riderId?: number;
    benefitPeriod?: number;
}
