import { Name, MemberBeneficiary, Allocation } from "@empowered/constants";
import { Contact } from "./contact.model";
export interface AddBeneficiary extends MemberBeneficiary {
    contact: Contact;
    beneficiaryType: string;
    id?: number;
    type: string;
    details: string;
    allocations: Allocation[];
    dependentId?: number;
    trustName: string;
    organizationName: string;
    relationshipToMember?: string;
    homeAddressSameAsEmployee?: boolean;
    gender?: string;
    birthDate?: string;
    ssn?: string;
    trustee?: Name;
    trustAgreementDate?: string;
    taxId?: string;
}
