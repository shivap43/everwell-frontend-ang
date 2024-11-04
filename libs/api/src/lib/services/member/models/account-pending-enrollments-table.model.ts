import { Enrollments, MemberProfile, MemberQualifyingEvent } from "@empowered/constants";

export interface AccountPendingEnrollmentsTable {
    product: string;
    reason: string;
    reasonTypes: string[];
    createdDate: string;
    coverageStarts: string;
    status: string;
}

export interface AccountEnrollmentModel {
    employeeDetails: MemberProfile;
    quaifyingLifeEvents: MemberQualifyingEvent[];
    enrollments: Enrollments[];
}
