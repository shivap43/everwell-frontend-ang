import { Carrier } from "./carrier.model";

export interface AccountCarriers {
    carrier: Carrier;
    carrierAttributes: { [key: string]: string };
    status: string;
}
