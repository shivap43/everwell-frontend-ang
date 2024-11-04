import { ContactInfo } from "./contact-info.model";

export enum BeneficiaryTypes {
    PRIMARY = "Primary",
    SECONDARY = "Secondary",
}

export interface MemberBeneficiary {
    readonly id?: number;
    type: string;
    details?: string;
    contact?: ContactInfo;
    allocations?: Allocation[];
    dependentId?: number;
    name?: Name;
    relationshipToMember?: string;
    gender?: string;
    birthDate?: string;
    ssn?: string;
    trustee?: Name;
    trustAgreementDate?: string;
    taxId?: string;
    isMember?: boolean;
    relationshipToInsured?: string;
}

export interface Allocation {
    product: string;
    percent: number;
    type: string;
    relationshipToInsured?: string;
    nameOfInsured: Name;
}

interface Name {
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    maidenName?: string;
    nickname?: string;
}

export interface MemberBeneficiaryDisplay extends MemberBeneficiary {
    actions?: string[];
    fullNameOfJuvenileInsured?: string;
    juvenileInsured?: boolean;
}
