import { CallCenterMessageType } from "../enums";

export interface CallCenterProducersWithAccountInfo {
    producer: Producer;
    accounts: Account[];
}

export interface Account {
    id: number;
    name: string;
}

interface Producer {
    id: number;
    type: string;
    name: Name;
    emailAddress: string;
    phoneNumber: string;
    reportsToId: number;
    reportsTo: ReportsTo;
    title: string;
    npn: string;
    writingNumbers: WritingNumber[];
    brokerageId: number;
}

interface WritingNumber {
    number: string;
    sitCodes: SitCode[];
}

export interface SitCode {
    id: number;
    code: string;
}

export interface ReportsTo {
    id?: number;
    type?: string;
    name?: Name;
    emailAddress?: string;
    phoneNumber?: string;
    reportsToId?: number;
    reportsTo?: ReportsTo;
}

interface Name {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    maidenName: string;
    nickname: string;
}

export interface CallCenter {
    id: number;
    name: string;
    minSubscriberCount: number;
    messageType?: CallCenterMessageType;
    aflacGroupEnrollmentAllowed?: boolean;
    directOnly?: boolean;
}
