import { CountryState } from "./api";

export interface AddressResult {
    action: string;
    newState: CountryState;
    newCity: string;
}
