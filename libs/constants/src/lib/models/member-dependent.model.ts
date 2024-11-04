import { CommunicationPreference, ContactType, CorrespondenceType, TobaccoStatus, Vocabulary } from "../enums";
import { Address } from "./api";

export interface MemberDependent {
    readonly id?: number;
    name: any;
    homeAddressSameAsEmployee?: boolean;
    address?: Address;
    state: string;
    birthDate: string;
    gender: string;
    relation?: string;
    dependentRelationId?: number;
    profile?: Profile;
    verificationStatus?: string;
    ssn?: string;
    customerInformationFileNumber?: string;
}

interface Profile {
    birthState?: string;
    height?: number;
    heightFeet?: number;
    heightInch?: number;
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

    disabled?: boolean;
    handicapped?: boolean;
    hiddenFromEmployee?: boolean;
    verified?: string;
    ineligibleForCoverage?: boolean;
    courtOrdered?: boolean;
    student?: boolean;
    school?: string;

    correspondenceType?: CorrespondenceType;
    correspondenceLocation?: ContactType;
    communicationPreference?: CommunicationPreference;
    allowCallCenter?: boolean;
}
