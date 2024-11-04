import { AccountDetailsModel } from "./account-detail.model";

export interface PolicyChangeRequestListModel {
    id: number;
    account: AccountDetailsModel;
    policyHolderName: string;
    requestNumber: string;
    requestType: string;
    dateSubmitted: string;
    status: string;
    memberId: number;
    cifNumber: string;
}
