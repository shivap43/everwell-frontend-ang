import { Address } from "./api";
import { Email } from "./email.model";
import { Phone } from "./phone.model";

export interface ContactInfo {
    address?: Address;
    phoneNumbers?: Phone[];
    emailAddresses?: Email[];
    phoneNumber?: string;
    cellPhoneNumber?: string;
    email?: string;
    immediateContactPreference?: string;
    contactTimeOfDay?: string;
}
