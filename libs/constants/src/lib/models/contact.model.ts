import { ContactType } from "../enums";
import { Address } from "./api";

/**
 * Contact Model Object (Nominal Type)
 * @arg {ContactTypes} T - Specifies the type of contact.
 * @see https://basarat.gitbooks.io/typescript/content/docs/tips/nominalTyping.html
 */
export interface Contact<T extends ContactTypes = "default"> {
    address?: Address;
    phoneNumbers?: PhoneNumber<T>[];
    emailAddresses?: EmailAddress<T>[];
    /**
     * @deprecated
     */
    phoneNumber?: string;
    /**
     * @deprecated
     */
    cellPhoneNumber?: string;
    /**
     * @deprecated
     */
    email?: string;
    name?: string;
    typeId?: number;
    primary?: boolean;
    addressValidationDate?: Date;
    contactType?: ContactType;
}

/**
 * @description This type alias is pure syntactic sugar to match the api contract schema.
 */
export type UserContact = Contact<"user">;

/**
 * @private
 */
type ContactTypes = "default" | "user";

/**
 * Conditional Phone Number Type
 * @private
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types
 */
type PhoneNumber<T extends ContactTypes> = T extends "user" ? PhoneContact & UserContactParameters : PhoneContact;

/**
 * Conditional Email Address Type
 * @private
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types
 */
type EmailAddress<T extends ContactTypes> = T extends "user" ? EmailContact & UserContactParameters : EmailContact;

/**
 * @private
 */
export interface PhoneContact {
    phoneNumber: string;
    extension?: string;
    /**
     * @description one of /static/phoneNumberTypes
     * @todo needs strong typing - enum or string literal
     */
    type?: string;
    id?: number;
    isMobile?: boolean;
}

/**
 * @private
 */
export interface EmailContact {
    email: string;
    /**
     * @description one of /static/emailTypes
     * @todo needs strong typing - enum or string literal
     */
    type?: string;
    id?: number;
}

/**
 * @private
 */
export interface UserContactParameters {
    readonly verified: boolean;
    primary: boolean;
}
