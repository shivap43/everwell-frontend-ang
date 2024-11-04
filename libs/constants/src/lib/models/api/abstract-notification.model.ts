import { MultipleNotificationModel } from "./multiple-notification.model";
import { SingleNotificationModel } from "./single-notification.model";

export type AbstractNotificationModel = SingleNotificationModel | MultipleNotificationModel;
