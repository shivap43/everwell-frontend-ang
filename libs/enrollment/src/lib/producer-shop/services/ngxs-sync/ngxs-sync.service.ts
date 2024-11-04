import { Injectable } from "@angular/core";
import { merge, Observable } from "rxjs";
import { map, mapTo, share, switchMap, take, tap } from "rxjs/operators";
import { NGRXEnrollmentStateService } from "./ngrx-enrollment-state/ngrx-enrollment-state.service";
import { NGXSEnrollmentStateService } from "./ngxs-enrollment-state/ngxs-enrollment-state.service";

@Injectable()
export class NGXSSyncService {
    readonly ngrxEnrollmentState$ = this.ngrxEnrollmentStateService.getLatestState();
    readonly ngxsEnrollmentState$ = this.ngxsEnrollmentStateService.getLatestState();

    constructor(
        private readonly ngrxEnrollmentStateService: NGRXEnrollmentStateService,
        private readonly ngxsEnrollmentStateService: NGXSEnrollmentStateService,
    ) {
        this.defaultNGRXEnrollmentState();
    }

    /**
     * Set NGRX enrollment state based on the latest NGXS enrollment state snapshot.
     * This is planned to work regardless of if NGXS enrollment state is ready/stable since if
     * NGXS enrollment state updates after defaulting, NGXS enrollment state changes will update NGRX enrollment state using
     * `syncFromNGXSEnrollmentState()` / `syncEnrollmentStates()`
     */
    defaultNGRXEnrollmentState(): void {
        const ngxsSnapshot = this.ngxsEnrollmentStateService.getStateSnapshot();

        this.ngrxEnrollmentStateService.setState(ngxsSnapshot);
    }

    /**
     * Checks for NGRX enrollment state changes,
     * compares to the latest NGXS enrollment state changes,
     * attempts to update NGXS enrollment state if it changes
     *
     * @returns {Observable<void>} void
     */
    syncFromNGRXEnrollmentState(): Observable<void> {
        return this.ngrxEnrollmentState$.pipe(
            switchMap((ngrxEnrollmentState) =>
                this.ngxsEnrollmentState$.pipe(
                    map((existingNGXSEnrollmentState) => ({ ngrxEnrollmentState, existingNGXSEnrollmentState })),
                    take(1),
                ),
            ),
            tap(({ ngrxEnrollmentState, existingNGXSEnrollmentState }) =>
                this.ngxsEnrollmentStateService.setState(ngrxEnrollmentState, existingNGXSEnrollmentState),
            ),
            mapTo(null),
            share(),
        );
    }

    /**
     * Checks for NGXS enrollment state changes,
     * compares to the latest NGRX enrollment state changes,
     * attempts to update NGRX enrollment state if it changes
     *
     * @returns {Observable<void>} void
     */
    syncFromNGXSEnrollmentState(): Observable<void> {
        return this.ngxsEnrollmentState$.pipe(
            switchMap((ngxsEnrollmentState) =>
                this.ngrxEnrollmentState$.pipe(
                    map((existingNGRXEnrollmentState) => ({ ngxsEnrollmentState, existingNGRXEnrollmentState })),
                    take(1),
                ),
            ),
            tap(({ ngxsEnrollmentState, existingNGRXEnrollmentState }) =>
                this.ngrxEnrollmentStateService.setState(ngxsEnrollmentState, existingNGRXEnrollmentState),
            ),
            mapTo(null),
            share(),
        );
    }

    /**
     * Checks both NGRX and NGXS enrollment changes,
     * compares current state to upcoming state if it's different,
     * then updates state if it is
     *
     * @returns {Observable<void>} void
     */
    syncEnrollmentStates(): Observable<void> {
        return merge(this.syncFromNGXSEnrollmentState(), this.syncFromNGRXEnrollmentState());
    }
}
