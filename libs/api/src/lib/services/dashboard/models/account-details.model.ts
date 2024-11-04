import { Situs } from "./situs.model";
import { PrimaryContact } from "./primary-contact.model";
import { AccountImportTypes, AccountLock, Accounts } from "@empowered/constants";

export interface AccountDetails extends Accounts {
    id: number;
    name: string;
    groupNumber: string;
    primaryContact: PrimaryContact;
    situs: Situs;
    payFrequencyId: number;
    accountNumber?: string;
    importType?: AccountImportTypes;
    lock?: AccountLock;
    locked?: boolean;
    thirdPartyPlatformsEnabled?: boolean;
}
