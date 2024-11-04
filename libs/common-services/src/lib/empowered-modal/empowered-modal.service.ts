import { Injectable, TemplateRef, OnDestroy } from "@angular/core";
import { MatDialogRef, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { Subscription } from "rxjs";

const MODAL_PANEL_CLASS = "emp-modal-lib";

/**
 * Only one dialog can be open at a time, excluding the bottom sheet.
 */
@Injectable({
    providedIn: "root",
})
export class EmpoweredModalService implements OnDestroy {
    private dialogRefs: MatDialogRef<unknown>[] = [];

    subscriptions: Subscription[] = [];

    constructor(private matDialog: MatDialog) {}

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    /**
     * Function opens a modal and sets the program to refocus on the object that opened
     * it when the modal is closed
     * @param componentOrTemplateRef component/template to be passed to  the modal
     * @param config config for opening the dialog box
     * @param refocus holds the target html element that activated the modal element
     * html element passed via reference $event.currentTarget during click event from html
     * if refocus does not exist, then the program defaults to the active HTML element
     * @param disableRefocus holds a boolean to disable the refocus if true, function does
     * not focus on the element that opened it on close
     * @returns a reference to a new MatDialog object
     */
    openDialog<T, D = any, R = any>(
        componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
        config?: MatDialogConfig<D>,
        refocus?: HTMLElement,
        disableRefocus: boolean = false,
    ): MatDialogRef<T, R> {
        // Apply the blur before the dialog is opened
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("dialog-open-screen-blur");

        // Apply panel class
        if (config && config.panelClass) {
            config.panelClass = Array.isArray(config.panelClass)
                ? [...config.panelClass, MODAL_PANEL_CLASS]
                : [config.panelClass, MODAL_PANEL_CLASS];
        } else if (config) {
            config.panelClass = MODAL_PANEL_CLASS;
        } else {
            config = { panelClass: MODAL_PANEL_CLASS };
        }

        // Open the dialog
        const dialogRef: MatDialogRef<T, R> = this.matDialog.open(componentOrTemplateRef, config);
        this.dialogRefs.push(dialogRef);

        // Destroy the blur after the dialog is closed
        this.subscriptions.push(dialogRef.afterClosed().subscribe(() => bodyElement.classList.remove("dialog-open-screen-blur")));

        if (!disableRefocus) {
            if (!refocus) {
                refocus = document.activeElement as HTMLElement;
            }
            this.subscriptions.push(dialogRef.afterClosed().subscribe(() => refocus.focus()));
        }

        return dialogRef;
    }

    closeDialog(): void {
        if (this.dialogRefs.length > 0) {
            this.dialogRefs.pop().close();
        }
    }
}
