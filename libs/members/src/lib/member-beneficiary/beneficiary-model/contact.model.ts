import { Address, Email, Phone } from "@empowered/constants";
export interface Contact {
    address: Address;
    phoneNumbers: Phone[];
    emailAddresses: Email[];
    phoneNumber: string;
    cellPhoneNumber?: string;
    email: string;
    immediateContactPreference?: string;
    contactTimeOfDay?: string;
}
