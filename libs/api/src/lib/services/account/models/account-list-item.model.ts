import { STATUS } from "../enums";
import { AccountListProducer } from "./account-list-producer.model";

export interface AccountListItem {
    id: number;
    name: string;
    groupNumber: string;
    altGroupNumber: string;
    state: string;
    currentCallCenterId: number;
    renewalDate: string | Date;
    status: STATUS;
    employeeCount: number;
    producers: AccountListProducer[];
    products: string[];
    notifications: Notification[];
}
