import { CommunicationPreference, ContactType, CorrespondenceType, Gender, TobaccoStatus, Vocabulary } from "../enums";
import { Address } from "./api";

export interface MemberProfile {
    id?: number;
    name: Name;
    birthDate: string;
    gender: Gender;
    profile?: Profile;
    address?: Address;
    workInformation?: WorkInformation;
    verificationInformation?: VerificationInformation;
    customerInformationFileNumber?: string;
    /**
     * @deprecated
     */
    ssn?: string;
    /**
     * @deprecated
     */
    hireDate?: string;
    /**
     * @deprecated
     */
    employeeId?: string;
    /**
     * @deprecated
     */
    organizationId?: number;
    username?: string;
    isPrimaryAddress?: boolean;
    registrationStatus?: string;
    ssnConfirmed?: boolean;
    phoneNumber?: string;
    email?: string;
}
/**
 * Verification Information used to pass to createMember endpoint in the backend when a MPP/MAP user manually adds them to an account
 */
export interface VerificationInformation {
    zipCode: number | string;
    verifiedEmail: string;
    verifiedPhone: string;
}

interface Name {
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    maidenName?: string;
    nickName?: string;
}

export interface WorkInformation {
    occupation?: string;
    occupationDescription?: string;
    hireDate?: Date | string;
    organizationId?: number;
    payrollFrequencyId?: number;
    termination?: Termination;
    departmentNumber?: string;
    industryCode?: string;
    hoursPerWeek?: number;
    employerName?: string;
    employeeId?: string;
    employeeIdRequired?: boolean;
    hoursPerWeekRequired?: boolean;
}

interface Termination {
    terminationCodeId: number;
    terminationDate: Date | string;
    terminationReason: string;
    terminationComments: Date | string;
}

interface Profile {
    birthState?: string;
    height?: number;
    heightFt?: number;
    heightInches?: number;
    weight?: number;
    ethnicity?: string;
    maritalStatus?: string;
    citizenship?: string;
    driversLicenseNumber?: string;
    driversLicenseState?: string;
    languagePreference?: Vocabulary;
    tobaccoStatus?: TobaccoStatus;
    medicareEligibility?: boolean;
    dependentOrder?: string;
    correspondenceType?: CorrespondenceType;
    correspondenceLocation?: ContactType;
    communicationPreference?: CommunicationPreference;
    allowCallCenter?: boolean;
    test?: boolean;
    courtOrdered?: boolean;
    hiddenFromEmployee?: boolean;
    ineligibleForCoverage?: boolean;
}
