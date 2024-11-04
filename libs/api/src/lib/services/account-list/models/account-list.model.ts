import { Pageable, Sort } from "../../shared";
import { AccountLock, Name, Validity, Address, AbstractNotificationModel } from "@empowered/constants";
import { Producer } from "./producer.model";

// Account list model
export interface AccountList {
    id: number;
    name: string;
    groupNumber: string;
    altGroupNumber: string;
    primaryContactAddress: Address;
    state: string;
    renewalDate: Date;
    status: string;
    openEnrollmentPeriods: OpenEnrollmentPeriod[];
    employeeCount: number;
    notificationCount: number;
    producers: Producer[];
    primaryProducer: string;
    products: string[];
    productsCount: number;
    currentCallCenterId: number;
    notifications: AbstractNotificationModel[];
    accountNumber?: string;
    aflacGroupNumber?: string;
    createDate?: string;
    lock?: AccountLock;
    locked?: boolean;
    canDeactivateProspect?: boolean;
}

export interface OpenEnrollmentPeriod {
    enrollmentPeriodId: number;
    validity: Validity;
}

export interface AccountListResponse {
    content: AccountList[];
    pageable: Pageable;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    sort: Sort;
    numberOfElements: number;
    size: number;
    // eslint-disable-next-line id-denylist
    number: number;
    empty: boolean;
}
