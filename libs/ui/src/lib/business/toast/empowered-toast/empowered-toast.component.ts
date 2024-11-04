import { Component, Inject, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { ToastModel } from "../toast.model";
import { Store } from "@ngxs/store";
import { fromEvent, Subject } from "rxjs";
import { tap, takeUntil } from "rxjs/operators";
import { OpenToast } from "..";

const KEY_A = "KeyA";

@Component({
    selector: "empowered-toast",
    templateUrl: "./empowered-toast.component.html",
    styleUrls: ["./empowered-toast.component.scss"],
})
export class EmpoweredToastComponent implements AfterViewInit, OnDestroy {
    aPressed = false;
    private readonly close$: Subject<boolean> = new Subject<boolean>();

    /**
     * Attach keydown and keyup event listeners to document while toast is open.
     *
     * @param snackBarRef reference to this toast element's wrapper
     * @param data metadata for the toast
     * @param store local database from which language is derived
     * @param el refers to host element
     */
    constructor(
        public snackBarRef: MatSnackBarRef<EmpoweredToastComponent>,
        @Inject(MAT_SNACK_BAR_DATA) public data: ToastModel,
        private readonly store: Store,
        private readonly el: ElementRef,
    ) {
        if (this.data.pending) {
            this.data.pending.notifier.subscribe(() => {
                this.store.dispatch(new OpenToast(this.data.pending.completionToast));
                // Replace pending toast
                this.closeToast();
            });
        } else {
            this.addKeyboardEventListener("keydown", this.keydownListener);
            this.addKeyboardEventListener("keyup", this.keyupListener);
        }
    }

    /**
     * Listens for keydown events and closes toast if ctrl+shift+a is pressed.
     * Defined as a lambda function to keep reference to "this" pointing to component.
     *
     * @param event keyboard event to determine combo press
     */
    keydownListener: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
        if (event.code === KEY_A) {
            this.aPressed = true;
        }
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && this.aPressed) {
            this.actionFired();
        }
    };

    /**
     * Listens for keyup events and sets aPressed to false if "a" is released.
     * Defined as a lambda function to keep reference to "this" pointing to component.
     *
     * @param event keyboard event to determine aPressed status
     */
    keyupListener: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
        if (event.code === KEY_A) {
            this.aPressed = false;
        }
    };

    /**
     * Adds a listener to the given keyboard event.
     */
    addKeyboardEventListener(event: string, listener: (event: KeyboardEvent) => void): void {
        fromEvent(document, event).pipe(tap(listener), takeUntil(this.close$)).subscribe();
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.close$.next(true);
        this.close$.complete();
    }

    /**
     * Disables the toast's overlay from stopping click event propagation to lower layers.
     */
    ngAfterViewInit(): void {
        this.el.nativeElement.offsetParent.offsetParent.offsetParent.style.pointerEvents = "none";
    }

    /**
     * Dismisses the toast and performs the callback provided in the toast model.
     */
    actionFired(): void {
        this.snackBarRef.dismissWithAction();
        // eslint-disable-next-line no-underscore-dangle
        this.snackBarRef.containerInstance._onExit.next();
    }

    /**
     * Dismisses the toast and returns focus to the element with it before the toast initialized.
     */
    closeToast(): void {
        // this dismiss call is kept for encapsulated functionality, does not change toast closing
        this.snackBarRef.dismiss();

        // eslint-disable-next-line no-underscore-dangle
        this.snackBarRef.containerInstance._onExit.next();
    }
}
