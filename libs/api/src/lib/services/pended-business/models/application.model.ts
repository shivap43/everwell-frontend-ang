export interface PendedApplication {
    applicationNumber: string;
    lineOfBusiness: string;
    pendDate: string;
    billForm: string;
    annualPremium: number;
    deskCode: string;
    baseTaxStatus: "PRETAX" | "POSTTAX";
    riderTaxStatus: "PRETAX" | "POSTTAX";
    employeeStatusInd: string;
    coverageEffectiveDate: string;
    applicationStatus: string;
}
