export interface UpdateCoverageModal {
    enrollment: {
        coverageLevelId: number;
        memberCost: number;
        totalCost: number;
        paymentInformation?: {};
        benefitAmount: number;
        validity: {};
        dependents?: {};
        taxStatus: string;
        tobaccoStatus: string;
        salaryMultiplier?: number;
    };
    riderIds?: [];
    dependents?: [];
    beneficiaries?: [];
    reason: string;
    description: string;
    effectiveDate: any;
}
