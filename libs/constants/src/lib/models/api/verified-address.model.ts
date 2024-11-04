import { PersonalAddress } from "./personal-address.model";

export interface VerifiedAddress {
    matched: boolean;
    suggestedAddress: PersonalAddress;
}
