import { Address } from "@empowered/constants";

export interface AflacGroupLocationInformation {
    id: number;
    primaryContact: string;
    locationName: string;
    locationCode: string;
    address: Address;
}
