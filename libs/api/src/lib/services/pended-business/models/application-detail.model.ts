export interface ApplicationDetail {
    accountName: string;
    accountNumber: string;
    flexPlanYearStart: string;
    flexPlanYearEnd: string;
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
    name: string;
    dob: string;
    ssn: string;
    address: string;
    phone: string;
    spouseName: string;
    spouseDOB: string;
    policyOwner: string;
    destination: string;
    destinationDate: string;
    remarks: string;
    reasons: string[];
    company: string;
    applicantSSN: string;
}
