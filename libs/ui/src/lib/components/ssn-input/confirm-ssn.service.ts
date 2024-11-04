import { Injectable } from "@angular/core";
import { AbstractControl, FormControl, Validators } from "@angular/forms";
import { combineLatest, Observable } from "rxjs";
import { tap, withLatestFrom, filter, map, distinctUntilChanged } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class ConfirmSsnService {
    /**
     * Matches original SSN input value with "confirmed" value.
     *
     * @param updatedSSN last valid SSN input value
     * @returns null if control value matches updatedSSN, error object otherwise
     */
    static createSSNMatchingValidator =
    (updatedSSN: string) =>
        ({ value }: AbstractControl) =>
            !value || value === updatedSSN ? null : { invalid: true };

    constructor() {}

    /**
     * Updates confirm SSN form control validators every time the last valid SSN input value changes.
     *
     * @param confirmSSN confirm SSN form control
     * @param latestValidSSN$ observable that emits the last valid SSN input value
     * @param primaryInputStatusChanges$ SSN input status changes
     * @returns observable that emits the last valid SSN input value
     */
    updateValidators(
        confirmSSN: FormControl,
        latestValidSSN$: Observable<string>,
        primaryInputStatusChanges$: Observable<string>,
    ): Observable<string[]> {
        return combineLatest([primaryInputStatusChanges$, latestValidSSN$]).pipe(
            tap(([primaryInputStatus, updatedSSN]) => {
                // Show errors only if the primary input is valid or disabled
                confirmSSN.setValidators(
                    primaryInputStatus === "VALID" || primaryInputStatus === "DISABLED"
                        ? [Validators.required, ConfirmSsnService.createSSNMatchingValidator(updatedSSN)]
                        : [],
                );
                confirmSSN.updateValueAndValidity();
            }),
        );
    }

    /**
     * Enables/disables the confirm SSN field according to the original input value.
     *
     * @param confirmSSN confirm SSN form control
     * @param latestValidSSN$ observable that emits the last valid SSN input value
     * @param primaryInputValueChanges$ SSN input value changes
     * @returns SSN input value changes
     */
    updateControl(
        confirmSSN: FormControl,
        latestValidSSN$: Observable<string>,
        primaryInputValueChanges$: Observable<string>,
    ): Observable<string> {
        return primaryInputValueChanges$.pipe(
            distinctUntilChanged(),
            withLatestFrom(latestValidSSN$),
            filter(([ssn, latestValidSSN]) => !latestValidSSN || !latestValidSSN.includes("X")),
            map(([ssn]) => ssn),
            tap((ssn) => {
                if (!ssn || confirmSSN.disabled) {
                    if (!ssn) {
                        confirmSSN.disable();
                    } else {
                        confirmSSN.enable();
                    }
                    confirmSSN.reset();
                }
            }),
        );
    }

    /**
     * Disables confirm SSN field when the form is submitted.
     *
     * @param confirmSSN confirm SSN form control
     * @param formSavedSubject$ observable that emits whenever form is submitted
     * @returns observable that emits whenever form is submitted
     */
    disableControl(confirmSSN: FormControl, formSavedSubject$: Observable<boolean>): Observable<boolean> {
        return formSavedSubject$.pipe(
            distinctUntilChanged(),
            filter<boolean>(Boolean),
            tap(() => {
                confirmSSN.disable();
                confirmSSN.markAsPristine();
            }),
        );
    }
}
