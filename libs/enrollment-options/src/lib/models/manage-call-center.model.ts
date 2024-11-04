import { AccountCallCenter, CallCenter, PageableResponse, ProducerListItem, AccountDetails } from "@empowered/api";
import { Exceptions, PlanChoice } from "@empowered/constants";
import { CallCenterConfigs } from "./call-center-configs.model";

// This model is used internally by components in this lib
// and does not model any data from the API contracts.

export interface ManageCallCenterDialogData {
    isAdd: boolean; // if true, open 'add call center' modal, otherwise 'edit call center'
    callCenter: AccountCallCenter; // if edit mode is selected, the call center to be edited
    accountCallCenters: AccountCallCenter[]; // other call centers added in the account
    callCentersList: CallCenter[]; // static list of all available call centers
    numberOfMembers: number; // number of members in the account,
    planChoices: PlanChoice[]; // plans chosen as part of the benefit offering for the account
    pinSignatureExceptions: Exceptions[]; // added pin signature exceptions
    producers: PageableResponse<ProducerListItem>; // list of producers of the account
    configs: CallCenterConfigs; // configs required for 8x8 call centers
    callCenterDisabilityEnrollmentRestricted: boolean; // true if disability enrollment is not allowed
}

export interface CallingScheduleTime {
    value: string;
    text: string;
}

export interface ManageCallCenterDismissed {
    action: string;
    currentAccountCallCenter?: AccountCallCenter;
    startDate?: string;
    endDate?: string;
    is8x8CallCenterSelected?: boolean;
    account?: AccountDetails;
    purpose?: string;
    callCenterName?: string;
}

export enum DateRangeErrorType {
    START = "START",
    END = "END",
    BOTH = "BOTH",
}

export enum ExceptionFormType {
    ADD = "ADD",
    EDIT = "EDIT",
    REMOVE = "REMOVE",
    CANCEL = "CANCEL",
}
