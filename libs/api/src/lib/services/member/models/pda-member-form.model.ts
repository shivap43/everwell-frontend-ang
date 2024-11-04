import { Name, Validity, Address } from "@empowered/constants";
import { FormType } from "../enums";

export interface PdaForm {
    id?: number;
    type?: FormType;
    socialSecurityNumber?: string;
    memberName: Name;
    employerName?: string;
    memberAddress: Address;
    signature?: string;
    pin?: string;
    departmentNumber?: string;
    location?: string;
    firstDeductionDate?: string;
    payFrequencyId?: number;
    policyPremiums: PdaPolicyPremium[];
    payrollAccountNumber?: string;
    isAflacPolicyHolder?: boolean;
    validity?: Validity;
    enrollmentState?: string;
    applicantName?: Name;
    companyToSuspendDeductionFrom?: string;
    suspendedAmount?: number;
    processAsNewDeduction?: boolean;
    payrollDepartmentNumber?: string;
    formType?: string;
    submissionMethod?: string;
}

export interface PdaPolicyPremium {
    policyName: string;
    oldPreTax?: number;
    oldPostTax?: number;
    newPreTax?: number;
    newPostTax?: number;
    newEnrollmentId?: number;
    policyNumber?: number;
    totalPremium?: number;
    employerContribution?: number;
    employeeDeduction?: number;
}
export interface AllCompletedPDAForm {
    PDA: PdaForm[];
}

export interface SendReminderMode {
    email?: string;
    phoneNumber?: string;
}
