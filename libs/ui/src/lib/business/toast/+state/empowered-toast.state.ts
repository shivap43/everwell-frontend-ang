import { MatSnackBarRef, MatSnackBarConfig, MatSnackBar } from "@angular/material/snack-bar";
import { OpenToast, CloseAllToast, CloseToast } from "./empowered-toast.actions";
import { Action, State, StateContext } from "@ngxs/store";
import { Observable, Subject, race } from "rxjs";
import { SharedStateModel } from "@empowered/ngxs-store";
import { filter, tap } from "rxjs/operators";
import { EmpoweredToastComponent } from "..";
import { Injectable } from "@angular/core";

const TOAST_DISMISS_DURATION_IN_MILLISECONDS = 5000;

@State<void>({
    name: "toasts",
})
@Injectable()
export class ToastListState {
    // used to close multiple snack bar references
    private readonly closeAll$: Subject<void> = new Subject<void>();
    constructor(public snackBar: MatSnackBar) {}

    /**
     * Opens the snackbar with required configuration
     * @param context SharedStateModel
     * @param toastModel Snackbar reference
     * @returns an observable with an unknown type or no value depending upon race condition
     */
    @Action(OpenToast)
    openToast(context: StateContext<SharedStateModel>, { toastModel }: OpenToast): Observable<unknown> | void {
        // Set configuration user has added in toastModel
        const config = new MatSnackBarConfig();

        // Set panelClass to snackBar
        if (toastModel.toastType) {
            config.panelClass = [toastModel.toastType];
        }

        // Set snackbar dismiss duration
        if (toastModel.duration) {
            if (toastModel.duration < 0) {
                config.duration = undefined;
            } else {
                config.duration = toastModel.duration;
            }
        } else {
            config.duration = TOAST_DISMISS_DURATION_IN_MILLISECONDS;
        }

        // Set message and action text
        config.data = {
            message: toastModel.message,
            action: toastModel.action,
            politeness: "polite",
            pending: toastModel.pending,
        };

        // open snackBar
        const snackBarReference: MatSnackBarRef<EmpoweredToastComponent> = this.snackBar.openFromComponent(EmpoweredToastComponent, config);

        /* return 2 observables.
         *  1. afterDismissed with action callback
         *  2. force dismiss all
         */
        return race(
            snackBarReference.onAction().pipe(
                // action callback will be invoked if action text exist.
                filter((afterDismiss) => Boolean(toastModel && toastModel.action)),
                tap((afterDismiss) => {
                    toastModel.action.callback();
                }),
            ),
            this.closeAll$.pipe(tap((closeCommand) => snackBarReference.dismiss())),
        );
    }

    /**
     * This Method used to close specific snackbar
     * @param context SharedStateModel
     * @param snackBarRef Snackbar reference
     * @returns no value
     */
    @Action(CloseToast)
    closeToast(context: StateContext<SharedStateModel>, { snackBarRef }: CloseToast): void {
        snackBarRef.dismiss();
    }

    /**
     * This Method used to close all snack-bars
     * @param context SharedStateModel
     * @returns no value
     */
    @Action(CloseAllToast)
    closeAll(context: StateContext<SharedStateModel>): void {
        this.closeAll$.next();
    }
}
