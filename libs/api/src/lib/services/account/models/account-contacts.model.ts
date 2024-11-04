import { Address } from "@empowered/constants";
import { ContactTypes } from "./account-contact-type.model";
import { AccountContactsEmail } from "./account-contacts-email.model";
import { AccountContactsPhone } from "./account-contacts-phone.model";

export interface AccountContacts {
    address: Address;
    phoneNumbers: AccountContactsPhone[];
    emailAddresses: AccountContactsEmail[];
    id: number;
    name: number;
    typeId: number;
    type: ContactTypes;
    primary: boolean;
}
