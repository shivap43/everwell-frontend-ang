/* eslint-disable @typescript-eslint/ban-types */
import { PersonalAddress } from "@empowered/constants";
import { PhoneNumber } from "./phone.model";
import { EmailAddress } from "./email.model";

export interface PrimaryContact {
    address: PersonalAddress;
    phoneNumbers: PhoneNumber[];
    emailAddresses: EmailAddress[];
    phoneNumber: string;
    cellPhoneNumber: string;
    email: string;
    id: number;
    name: string;
    typeId: number;
    type: {};
    primary: boolean;
}
