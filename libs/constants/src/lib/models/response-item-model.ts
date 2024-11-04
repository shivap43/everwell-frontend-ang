import { Application } from "./application.model";
import { ResponsePanel } from "./response-panel-model";

export interface ResponseItem {
    planId: number;
    application: Application;
    response: ResponsePanel[];
    cartId?: number;
}
