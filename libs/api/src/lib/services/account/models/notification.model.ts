import { TYPE } from "../enums";

export interface Notification {
    code: string;
    type: TYPE;
    dismissable: boolean;
}
