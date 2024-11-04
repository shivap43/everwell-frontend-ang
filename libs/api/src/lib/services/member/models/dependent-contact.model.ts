import { Address, ContactType, CommunicationPreference, CorrespondenceType, UserContact, TimeOfDay } from "@empowered/constants";
export type MemberDependentContact = UserContact & ContactPreferences;

/**
 * @private
 */
interface ContactPreferences {
    address: Address;
    immediateContactPreference?: CommunicationPreference;
    contactTimeOfDay?: TimeOfDay;
    correspondenceType?: CorrespondenceType;
    correspondenceLocation?: ContactType;
}
