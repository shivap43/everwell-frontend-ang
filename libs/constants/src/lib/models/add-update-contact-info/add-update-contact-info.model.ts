export interface AddUpdateContactDialogData {
    parentMode: string;
    isAdd: boolean;
    isPrimary: boolean;
    mpGroupId: string;
    showType?: boolean;
    accountContact?: any;
    carrier?: any;
    carrierContact?: any;
    replacePrimary?: any;
    allowEditingAddress: boolean;
    allowEditingContactName: boolean;
    allowEditingPhoneNumber: boolean;
    allowEditingEmailAddress: boolean;
}
