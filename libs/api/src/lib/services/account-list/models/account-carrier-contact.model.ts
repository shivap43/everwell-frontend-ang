import { Address } from "@empowered/constants";
import { PhoneNumber, EmailAddress } from "../../dashboard";

export interface AccountCarrierContact {
    address: Address;
    phoneNumbers?: PhoneNumber[];
    emailAddresses?: EmailAddress[];
    id?: number;
    name: string;
    primary?: boolean;
}
