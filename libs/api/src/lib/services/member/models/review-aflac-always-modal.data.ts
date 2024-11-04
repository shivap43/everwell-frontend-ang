export interface Plan {
    enrollmentId: number,
    planName: string
}

export interface BillingName {
    firstName?: string,
    lastName?: string
}

export interface BillingAddress {
    address1?: string,
    address2?: string,
    city?: string,
    state?: string,
    zip?: string
}

export interface PaymentMethod {
    id: number,
    billingName: BillingName,
    paymentType: string,
    billingAddress?: BillingAddress,
    sameAddressAsHome: boolean,
    bankName?: string,
    accountName: string,
    accountType?: string,
    routingNumber?: string,
    accountNumberLastFour?: string,
    tempusTokenIdentityGuid: string,
    tokens?: any,
    lastFour?: string,
    expirationMonth?: number
    expirationYear?: number,
    type?: string,
    tempusPostalCode?: string,
}

export interface ReviewAflacAlwaysModalData {
    enrolledPlans: Plan[],
    paymentMethod: PaymentMethod,
    paymentAmount: number,
    paymentFrequency: string
}