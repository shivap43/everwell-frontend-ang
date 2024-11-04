import { EnrollmentMethod, CountryState } from "@empowered/constants";

export interface NGRXEnrollmentState {
    mpGroup?: number | null;
    memberId?: number | null;
    enrollmentMethod?: EnrollmentMethod | null;
    headsetCountryState?: CountryState | null;
    selectedCountryState?: CountryState | null;
    selectedCity?: string | null;
}
