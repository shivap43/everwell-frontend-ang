import { Entity } from "@empowered/constants";

export interface EnrollmentsIdentifiers {
    mpGroup: number; // Compound Id
    memberId: number; // Compound Id
}

export type EnrollmentsEntity<Value> = Entity<EnrollmentsIdentifiers, Value>;

export interface EnrollmentRidersIdentifiers {
    mpGroup: number; // Compound Id
    memberId: number; // Compound Id
    enrollmentId: number; // Compound Id
}

export type EnrollmentRidersEntity<Value> = Entity<EnrollmentRidersIdentifiers, Value>;

// TODO [Enrollment Method]: Should EnrollmentMethod be part of the identifiers for EnrollmentMethodDetail?
export interface EnrollmentMethodDetailsIdentifiers {
    mpGroup: number; // Primary Id
}

export type EnrollmentMethodDetailsEntity<Value> = Entity<EnrollmentMethodDetailsIdentifiers, Value>;

/**
 * Interface for the 'Beneficiary Information of Existing Coverage' data
 */
export interface EnrollmentBeneficiariesIdentifiers {
    memberId: number;
    enrollmentId: number;
    mpGroup: number;
}
export type EnrollmentBeneficiariesEntity<Value> = Entity<EnrollmentBeneficiariesIdentifiers, Value>;

/**
 * Interface for the 'Dependent Information of Existing Coverage' data
 */
export interface EnrollmentDependentIdentifiers {
    memberId: number;
    enrollmentId: number;
    mpGroup: number;
}
export type EnrolledDependentEntity<Value> = Entity<EnrollmentDependentIdentifiers, Value>;

export interface ImportPolicyIdentifiers {
    memberId: number;
    mpGroup: number;
}
export type ImportPolicyEntity<Value> = Entity<ImportPolicyIdentifiers, Value>;

export interface DownloadPreliminaryFormIdentifiers {
    memberId: number;
    preliminaryFormPath: string;
    cartItemId: number;
    mpGroupId: number;
}
export type DownloadPreliminaryFormEntity<Value> = Entity<DownloadPreliminaryFormIdentifiers, Value>;

export interface EmailPreliminaryFormIdentifiers {
    memberId: number;
    email: string;
    mpGroupId: number;
}
export type EmailPreliminaryFormEntity<Value> = Entity<EmailPreliminaryFormIdentifiers, Value>;
