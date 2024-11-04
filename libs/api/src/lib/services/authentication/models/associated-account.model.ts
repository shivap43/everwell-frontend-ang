// Model of an account returned by getAssociatedAccounts
// when a member belongs to more than one account
export interface AssociatedAccount {
    groupId: number;
    memberId: number;
    accountName: string;
    accountAddress: string;
    registered: boolean;
}
