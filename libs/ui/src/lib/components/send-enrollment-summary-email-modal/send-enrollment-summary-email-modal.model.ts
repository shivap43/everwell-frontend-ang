import { MemberContactListDisplay } from "@empowered/constants";

export enum SendEnrollmentSummaryEmailModalAction {
    SKIP = "skip",
    CLOSE = "close",
    SEND = "send",
}

export interface SendEnrollmentSummaryEmailModalData {
    contactList: MemberContactListDisplay[];
}

export interface SendEnrollmentSummaryEmailModalResponseData {
    action?: SendEnrollmentSummaryEmailModalAction;
    selectedValue?: MemberContactListDisplay;
}

export enum ContactOptions {
    EMAIL = "email",
    PHONE = "phone",
}

export interface Address {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
}

export interface Email {
    email: string;
    type?: string;
    verified?: boolean;
    primary?: boolean;
    id?: number;
}

export interface Phone {
    phoneNumber?: number;
    type?: string;
    isMobile?: boolean;
    verified?: boolean;
    primary?: boolean;
    id?: number;
}

export interface Contact {
    addressed?: Address;
    emailAddresses?: Email[];
    phoneNumbers?: Phone[];
    phoneNumber?: string;
    cellPhoneNumber?: string;
    email?: string;
    contactId?: number;
    contactType?: string;
    addressValidationDate?: string;
    immediateContactPreference?: string;
    contactTimeOfDay?: string;
}
