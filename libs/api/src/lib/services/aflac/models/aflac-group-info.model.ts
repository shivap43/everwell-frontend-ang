import { Address } from "@empowered/constants";

export interface AflacGroupInfo {
    organization: string;
    aflacGroupNumber: string;
    aflacGroupFileName: string;
    employeeIdType: EmployeeIdType;
    situsState: SitusState;
    hoursPerWeek: number;
    agents: Agents[];
    billingAccounts: BillingAccount[];
    locations: Location[];
}
export interface Agents {
    partyKey: string;
    fullName: string;
    writingNumber: string;
    email: string;
}

export interface BillingAccount {
    accountNumber: string;
    deductionRegistrationDate: Date;
    firstDeduction: Date;
    createDate: Date;
}

interface Location {
    id: number;
    primaryContact: string;
    locationName: string;
    locationCode: string;
    address: Address;
}

interface SitusState {
    abbreviation: string;
    name: string;
}

enum EmployeeIdType {
    SSN = "SSN",
    EMPLOYEE_ID = "EMPLOYEE_ID",
}
