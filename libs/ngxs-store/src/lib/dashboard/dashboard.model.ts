import { AccountDetails } from "@empowered/api";

export interface Account {
    accountInfo: AccountDetails;
    mpGroupId: string;
}
export interface Permission {
    hasPermission: boolean;
    groupId: string;
}
