/**
 *  toast object properties use to config snackBar and display massages with action callback.
 */
import { ToastType } from "@empowered/constants";
import { Observable } from "rxjs";

export interface Action {
    text: string;
    callback: () => void;
}

export interface ToastModel {
    message: string;
    action?: Action;
    toastType?: ToastType;
    duration?: number;
    pending?: {
        notifier: Observable<unknown>;
        completionToast: ToastModel;
    };
}
