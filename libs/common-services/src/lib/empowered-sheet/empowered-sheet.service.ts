import { Injectable, OnDestroy } from "@angular/core";
import { ComponentType } from "@angular/cdk/overlay/index";
import { MatBottomSheetConfig, MatBottomSheetRef, MatBottomSheet } from "@angular/material/bottom-sheet";
import { Subscription, Observable, of, Subject } from "rxjs";
import { first, filter, tap, catchError, takeUntil } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class EmpoweredSheetService implements OnDestroy {
    private sheetRef: MatBottomSheetRef;
    private cancelHook: () => Observable<boolean>;

    subscriptions: Subscription[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(private matSheet: MatBottomSheet) {}

    /**
     * Clean up all observables on destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Opens up the component in a bottom sheet, and applies proper blur effect on open and closed
     *
     * @param component Component to open in a sheet
     * @param config Configuration for the Material sheet service
     * @param cancelHook The cancel hook to run when the user attempts to close the modal
     * @returns The reference to the Material bottom sheet
     */
    openSheet<T, D = any, R = any>(
        component: ComponentType<T>,
        config?: MatBottomSheetConfig<D>,
        cancelHook?: () => Observable<boolean>,
    ): MatBottomSheetRef<T, R> {
        this.dismissSheet();

        // Apply the blur before the sheet opens
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("dialog-open-screen-blur");

        // Open the sheet
        this.sheetRef = this.matSheet.open(component, config);
        this.cancelHook = cancelHook;

        // Destroy the blur after the sheet closes
        this.subscriptions.push(this.sheetRef.afterDismissed().subscribe(() => bodyElement.classList.remove("dialog-open-screen-blur")));

        return this.sheetRef;
    }

    /**
     * Close out the sheet, and run the cancel hook if applicable.
     */
    dismissSheet(): void {
        this.unsubscribe$.next();

        if (this.cancelHook && this.sheetRef) {
            this.cancelHook
                .apply(null, [])
                .pipe(
                    first(),
                    takeUntil(this.unsubscribe$.asObservable()),
                    catchError((error) => of(true)),
                    filter((response) => Boolean(response)),
                    tap((response) => this.sheetRef.dismiss()),
                )
                .subscribe();
        } else if (this.sheetRef) {
            this.sheetRef.dismiss();
        }
    }
}
