import { NotificationModel } from "./notification.model";

export interface SingleNotificationModel extends NotificationModel {
    id: number;
    textOverride?: string;
    groupId?: number;
    memberId?: number;
}
