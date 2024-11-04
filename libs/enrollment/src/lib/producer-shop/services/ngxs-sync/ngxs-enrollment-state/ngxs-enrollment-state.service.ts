import { Injectable } from "@angular/core";
import { Select, Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { NGRXEnrollmentState } from "../ngrx-sync.model";
import { EnrollmentMethodState, SetEnrollmentMethodSpecific, EnrollmentMethodModel } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class NGXSEnrollmentStateService {
    @Select(EnrollmentMethodState.currentEnrollment)
    currentEnrollment$: Observable<EnrollmentMethodModel>;

    constructor(private readonly store: Store) {}

    /**
     * Compares two `EnrollmentMethodModel` and returns true if any property is different
     * This includes any property not tracked for syncing NGRX state
     *
     * @param a {EnrollmentMethodModel} some `EnrollmentMethodModel`
     * @param b {EnrollmentMethodModel} another `EnrollmentMethodModel`
     * @returns `true` if a is different from b
     */
    compareState(a: EnrollmentMethodModel, b: EnrollmentMethodModel): boolean {
        if (a.memberId !== b.memberId || a.mpGroup !== b.mpGroup) {
            return false;
        }

        return this.compareSyncableState(a, b);
    }

    /**
     * Compares two `EnrollmentMethodModel` and returns true if any property is different
     * This includes only properties tracked for syncing NGRX state
     *
     * @param a {EnrollmentMethodModel} some `EnrollmentMethodModel`
     * @param b {EnrollmentMethodModel} another `EnrollmentMethodModel`
     * @returns `true` if a is different from b for properties that require syncing
     */
    compareSyncableState(a: EnrollmentMethodModel, b: EnrollmentMethodModel): boolean {
        // Avoid comparing null vs undefined
        // Fallback to always null instead for optional properties
        const enrollmentCityA = a.enrollmentCity ?? null;
        const enrollmentCityB = b.enrollmentCity ?? null;

        if (
            a.enrollmentMethod !== b.enrollmentMethod ||
            a.enrollmentState !== b.enrollmentState ||
            a.enrollmentStateAbbreviation !== b.enrollmentStateAbbreviation ||
            a.headSetState !== b.headSetState ||
            a.headSetStateAbbreviation !== b.headSetStateAbbreviation ||
            enrollmentCityA !== enrollmentCityB
        ) {
            return false;
        }

        return true;
    }

    /**
     * Gets the latest NGXS enrollment state. This includes EnrollmentMethod, State, State Abbreviation, City
     *
     * @returns {Observable<EnrollmentMethodModel | null | undefined>} latest `EnrollmentMethodModel`
     */
    getLatestState(): Observable<EnrollmentMethodModel | null | undefined> {
        return this.currentEnrollment$.pipe(
            distinctUntilChanged((a, b) => {
                // Always emit whenever NGXS enrollment state is cleared
                // Or when replacing empty NGXS enrollment state
                if (!a || !b) {
                    return false;
                }

                return this.compareSyncableState(a, b);
            }),
        );
    }

    /**
     * Gets NGXS enrollment state snapshot synchronously. This includes EnrollmentMethod, State, State Abbreviation, City
     *
     * @returns {EnrollmentMethodModel | null | undefined} latest `EnrollmentMethodModel` snapshot
     */
    getStateSnapshot(): EnrollmentMethodModel {
        return this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
    }

    /**
     * Creates an NGXS enrollment state from NGRX enrollment state
     *
     * @param ngrxEnrollmentState {NGRXEnrollmentState} NGRX enrollment state
     * @returns {EnrollmentMethodModel} NGXS enrollment state
     */
    getState(ngrxEnrollmentState: NGRXEnrollmentState): EnrollmentMethodModel {
        const snapshot = this.getStateSnapshot();

        const { enrollmentMethod, selectedCountryState, headsetCountryState, selectedCity, memberId, mpGroup } = ngrxEnrollmentState;

        return {
            enrollmentMethod,
            enrollmentState: selectedCountryState?.name,
            headSetState: headsetCountryState?.name,
            headSetStateAbbreviation: headsetCountryState?.abbreviation,
            enrollmentStateAbbreviation: selectedCountryState?.abbreviation,
            enrollmentCity: selectedCity,
            memberId,
            // Even though mpGroup has any type which is done likely to support string and number
            // The more common type for NGXS is to set mpGroup as a string
            mpGroup: mpGroup ? mpGroup.toString() : null,
            userType: snapshot?.userType,
        };
    }

    /**
     * Converts NGRX enrollment state to NGXS enrollment state and updates NGXS enrollment state if its current state is different
     *
     * @param ngrxEnrollmentState {NGRXEnrollmentState | undefined | null} NGRX enrollment state used to update NGXS enrollment state
     * @param existingNGXSEnrollmentState {EnrollmentMethodModel | undefined | null} NGXS enrollment state
     * used to prevent redundent updates to NGXS state if no differences would be made. If none is provided,
     * NGXS enrollment state will update no matter what
     */
    setState(ngrxEnrollmentState?: NGRXEnrollmentState | null, existingNGXSEnrollmentState?: EnrollmentMethodModel | null): void {
        const ngxsEnrollmentState = this.getState(ngrxEnrollmentState);

        if (existingNGXSEnrollmentState && this.compareState(ngxsEnrollmentState, existingNGXSEnrollmentState)) {
            return;
        }

        this.store.dispatch(new SetEnrollmentMethodSpecific(ngxsEnrollmentState));
    }

    /**
     * Resets default value in state to null after navigating to BO page
     */
    resetState() {
        this.store.dispatch(new SetEnrollmentMethodSpecific(null));
    }
}
