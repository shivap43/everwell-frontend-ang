import { CommunicationPreference, ContactType, CorrespondenceType, TimeOfDay } from "../enums";
import { UserContact } from "./contact.model";

export type MemberContact = UserContact & ContactPreferences;

/**
 * @private
 */
interface ContactPreferences {
    immediateContactPreference?: CommunicationPreference;
    contactTimeOfDay?: TimeOfDay;
    correspondenceType?: CorrespondenceType;
    correspondenceLocation?: ContactType;
}

export interface MemberContactListDisplay {
    contact: string;
    disableField: boolean;
    type?: string;
    primary?: boolean;
    formatted?: string;
}
