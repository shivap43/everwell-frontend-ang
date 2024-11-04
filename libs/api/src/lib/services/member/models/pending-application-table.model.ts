import { AccountPendingEnrollmentsTable } from ".";
import { Enrollments, MemberQualifyingEvent } from "@empowered/constants";

export interface PendingApplicationTableModel {
    plan: Enrollments;
    product: Enrollments;
    reason: MemberQualifyingEvent | string;
    lifeEventDate: string;
    status: string;
    disable: boolean;
}

export interface RangeFilterModel {
    id: number;
    name: string;
    propertyName: string;
    minValue: string;
    maxValue: string;
}
export interface AccountPESearchModel {
    employee: EmployeeBasicInfo;
    data: AccountPendingEnrollmentsTable[];
}
export interface EmployeeBasicInfo {
    id: number;
    name: string;
    ssn: string;
}
