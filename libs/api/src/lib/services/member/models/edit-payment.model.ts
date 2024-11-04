import { RoutingNumberModel } from "@empowered/constants";

export interface DialogData {
    selectedIndex: RoutingNumberModel;
    selectedPaymentMethod: string;
    edit?: boolean;
    delete?: boolean;
    mpGroup: number;
    memberId: number;
    creditCardDate?: Date;
    debitCardDate?: Date;
    cardType?: string;
    lastFour?: string;
    isACHPartnerAccountType?: boolean;
    isAccountTypeDisabled?: boolean;
}

export interface ValidateRoutingNumber {
    invalid: boolean;
}
