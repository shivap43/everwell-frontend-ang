import { FlexDollarModel } from "./flex-dollars.model";

export interface EnrollmentInformation {
    payrollDeductionInformationComponent: PayrollInfo;
    flexDollarOrIncentivesApplied: FlexDollarModel;
}

interface PayrollInfo {
    payrollsRemainingInYear: number;
    nextPayrollDate?: Date | string;
}
