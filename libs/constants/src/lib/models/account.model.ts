import { AccountImportTypes, PartnerAccountType, ProspectType, RatingCode, StatusTypeValues } from "../enums";
import { AccessibleAccountDetails } from "./accessible-account-details.model";
import { AccountLock } from "./account-lock.model";
import { Contact } from "./contact.model";
import { GroupTaxIdAccountDetails } from "./group-account-id-tax-details.model";
import { ProspectInformation } from "./prospect-information.model";
import { SitusState } from "./situs-state";

export interface Accounts {
    id?: number;
    name: string;
    groupNumber?: string;
    altGroupNumber?: number;
    ratingCode?: RatingCode;
    contact: Contact<"user">;
    primaryContact: Contact<"default">;
    situs: SitusState;
    payFrequencyId: number;
    type: ProspectType;
    prospectInformation: ProspectInformation;
    subordinateProducerId: number;
    typeId: number;
    status: StatusTypeValues;
    readonly partnerAccountType: PartnerAccountType;
    readonly partnerId: number;
    employeeCount: number;
    productsCount: number;
    daysToEnroll: number;
    taxId?: number;
    duplicateTaxAccountIds?: number[];
    taxMatchedIndividualAccounts?: IndividualTaxIdAccountDetails;
    taxMatchedAflacGroupAccount?: GroupTaxIdAccountDetails;
    accountNumber?: string;
    aflacGroupNumber?: number;
    importType?: AccountImportTypes;
    enrollmentAssistanceAgreement: boolean;
    thirdPartyPlatformsEnabled?: boolean;
    companyCode?: string;
    lock?: AccountLock;
    locked?: boolean;
    checkedOut?: boolean;
}

export interface IndividualTaxIdAccountDetails {
    accessibleAccounts: AccessibleAccountDetails[];
    inaccessibleAccountsFound: boolean;
}

export interface AccountInformation {
    id: number;
    name: string;
    accountNumber: string;
    primaryContact: Contact<"default">;
    situs: SitusState;
    type: ProspectType;
    importType: AccountImportTypes;
}

export enum PhoneNumberType {
    WORK = "Work",
    PERSONAL = "Personal",
    OTHER = "other",
}

export enum EmailAddressType {
    WORK = "Work",
    HOME = "Home",
    CELL = "Cell",
    OTHER = "other",
}
