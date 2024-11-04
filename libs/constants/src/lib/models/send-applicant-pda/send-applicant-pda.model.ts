import { MemberContactListDisplay } from "../member-contact.model";

export interface SendPdaDialogData {
    contactList: MemberContactListDisplay[];
    firstName: string;
}

export interface SendPdaDialogResponseData {
    action?: string;
    selectedValue?: MemberContactListDisplay;
}

export enum SendPdaDialogAction {
    SKIP = "skip",
    SEND = "send",
    ADD_CONTACT = "addContact",
}
