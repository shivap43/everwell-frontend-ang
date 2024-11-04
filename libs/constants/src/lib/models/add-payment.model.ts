import { AccountType, PaymentType } from "../enums";
import { BillingAddress } from "./billing-address.model";
import { BillingNameSchema } from "./billing-name.model";

// TODO: Additional error codes to be provided by Tempus.
// Once available, they need to be added in this enum to account for.
export enum AddPaymentErrorCodes {
    CANCEL = 1,
    MAX_ATTEMPTS_REACHED,
    DECLINED_CARD,
    EXPIRED_CARD,
    ACCOUNT_VALIDATION_FAILED,
    ROUTING_NUMBER_MISMATCH,
}

// These error codes will be provided by tempus in case if there is any validation failure
export enum BankDraftErrorCodes {
    GS01 = "GS01",
    GS02 = "GS02",
    RT01 = "RT01",
}
interface IAddPayment {
    name: string;
    paymentType: PaymentType;
    billingAddress?: BillingAddress;
    sameAddressAsHome: boolean;
    bankName: string;
    accountType: string;
    accountNumber: string;
    routingNumber: string;
    tokens: Token[];
    lastFour: string;
    expirationMonth: number;
    expirationYear: number;
    billingName: BillingNameSchema;
    accountName: string;
    type: string;
    tempusPostalCode: string;
    tempusTokenIdentityGuid: string;
    errorCode: AddPaymentErrorCodes;
    accountNumberLastFour?: string;
}
export type AddPayment = Partial<IAddPayment>;

export interface EditPayment extends AddPayment {
    id?: number;
}

export interface RoutingNumberModel extends AddPayment {
    id: number;
    accountNumberLastFour: string;
    routingNumberLastFour: string;
}

export interface PaymentEditPopUpClose {
    action: string;
    closed: boolean;
    updatedData: AddPayment;
    accountType: AccountType;
    id: number;
}

export interface Token {
    carrierId: number;
    token: string;
}

export interface UpdatePcrPayment {
    expirationMonth?: number;
    expirationYear?: number;
    tempusTokenIdentityGuid: string;
    tempusPostalCode?: string;
    cardHolderName?: string;
    accountName?: string;
    accountType?: string;
    paymentType?: string;
}
