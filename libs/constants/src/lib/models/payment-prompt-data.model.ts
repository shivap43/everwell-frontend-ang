import { EditPayment } from "./add-payment.model";
import { TempusSessionObjectModel } from "./tempus-session-object.model";
export interface PaymentPromptDataModel {
    tempusSessionObject?: TempusSessionObjectModel;
    memberId: number;
    mpGroup: number;
    tempusIframeURL?: string;
    editModal: boolean;
    creditCardDetails?: EditPayment;
    bankDraftDetails?: EditPayment;
    paymentMethod?: string;
    isACHPartnerAccountType?: boolean;
    defaultRoutingNumber?: string;
}
