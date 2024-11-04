import { NotificationType } from "../../enums";
import { NotificationCode } from "./notification-code.model";

export interface NotificationModel {
    directAccount: boolean;
    code: NotificationCode;
    type: NotificationType;
    category: "CTA" | "REMINDER" | "UPDATE";
    displayText: string;
    dismissable: boolean;
    link?: string;
    linkText?: string;
}
