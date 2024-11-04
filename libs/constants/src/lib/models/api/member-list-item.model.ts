import { MemberListItemStatus } from "../../enums/member-list-item-status.enum";
import { AbstractNotificationModel } from "./abstract-notification.model";
import { MemberListDependent } from "./member-list-dependent.model";
import { MemberListProduct } from "./member-list-product.model";

export interface MemberListItem {
    id: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    registered: boolean;
    status: MemberListItemStatus;
    products: MemberListProduct;
    dependents: MemberListDependent[];
    notifications?: AbstractNotificationModel[];
    phoneNumber?: string;
    email?: string;
    notificationSum?: number;
}
