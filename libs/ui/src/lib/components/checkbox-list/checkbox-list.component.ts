import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl, ValidationErrors } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";

@Component({
    selector: "empowered-checkbox-list",
    templateUrl: "./checkbox-list.component.html",
    styleUrls: ["./checkbox-list.component.scss"],
})
export class CheckboxListComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() showSelectAll = false;
    @Input() options: { text: string; value: unknown }[];

    control: FormControl = this.formBuilder.control("");
    selectAll: FormControl = this.formBuilder.control("");
    disabled: boolean;

    readonly unsubscribe$ = new Subject<void>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onChange = (value: string) => {};
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(private readonly formBuilder: FormBuilder, public ngControl: NgControl) {
        ngControl.valueAccessor = this;
    }

    ngOnInit(): void {
        this.control.valueChanges
            .pipe(
                tap((value) => this.onChange(value)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.ngControl.statusChanges
            .pipe(
                tap((status) => {
                    this.control.setErrors(this.ngControl.errors);
                    if (status === "TOUCHED") {
                        this.control.markAsTouched();
                    }
                    if (this.showSelectAll) {
                        this.selectAll.setErrors(this.ngControl.errors);
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        if (this.showSelectAll) {
            this.selectAll.valueChanges
                .pipe(
                    tap((selectAllValue) => this.control.setValue(selectAllValue ? this.options.map(({ value }) => value) : [])),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();

            this.control.valueChanges
                .pipe(
                    tap((value) => this.selectAll.setValue(value?.length === this.options.length, { emitEvent: false })),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: string = ""): void {
        this.control.setValue(value);
    }

    /**
     * Registers a callback function that is called when the control's value changes in the UI.
     *
     * @param fn the callback function to register
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }
    /**
     * Registers a callback function that is called by the forms API on initialization to update the form model on blur.
     *
     * @param fn the callback function to register
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Registers a callback function to call when the validator inputs change.
     * @param fn the callback function
     */
    registerOnValidatorChange?(fn: () => void): void {
        this.onValidationChange = fn;
    }

    /**
     * Called by the forms API when the control status changes to or from 'DISABLED'
     * to enable or disable the appropriate DOM element.
     *
     * @param disabled the disabled status to set on the element
     */
    setDisabledState(disabled: boolean): void {
        this.disabled = disabled;
        if (disabled) {
            this.control.disable();
        } else {
            this.control.enable();
        }
    }

    /**
     * Method that performs synchronous validation against the provided control,
     * called when the control's value changes.
     *
     * @returns map of errors returned from failed validation checks
     */
    validate(): ValidationErrors | null {
        if (this.control?.invalid) {
            return { invalid: true };
        } else {
            return null;
        }
    }

    /**
     * Cleans up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
