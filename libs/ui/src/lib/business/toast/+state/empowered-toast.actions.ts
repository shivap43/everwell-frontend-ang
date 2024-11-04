/* eslint-disable max-classes-per-file */

/*
This is a list of actions that are used in populate and dismiss toast
*/
import { MatSnackBarRef } from "@angular/material/snack-bar";
import { ToastModel } from "../toast.model";
import { EmpoweredToastComponent } from "..";

// Action to Open Toast
export class OpenToast {
    static readonly type = "[Toast] OpenToast";
    constructor(public toastModel: ToastModel) {}
}

export class CloseToast {
    static readonly type = "[Toast] CloseToast";
    constructor(public snackBarRef: MatSnackBarRef<EmpoweredToastComponent>) {}
}

export class CloseAllToast {
    static readonly type = "[Toast] CloseAllToast";
    constructor() {}
}
