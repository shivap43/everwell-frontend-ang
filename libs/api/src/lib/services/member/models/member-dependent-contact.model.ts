import { Address, ContactType, Email, Phone, CommunicationPreference, CorrespondenceType, TimeOfDay } from "@empowered/constants";

export interface DependentContact {
    address?: Address;
    contactId?: number;
    phoneNumbers?: Phone[];
    emailAddresses?: Email[];
    immediateContactPreference?: CommunicationPreference;
    contactTimeOfDay?: TimeOfDay;
    correspondenceType?: CorrespondenceType;
    correspondenceLocation?: ContactType;
    contactType?: string;
}
