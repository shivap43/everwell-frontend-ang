import { CountryState } from "@empowered/constants";

export interface EnrollmentState {
    crossBorderAllowed: boolean;
    state: CountryState;
}

/**
 * Model to map the Enrollment Method object
 */
export interface EnrollmentMethodDetail {
    name: string;
    description: string;
    enrollmentStates: EnrollmentState[];
}
