import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";

@Component({
    selector: "empowered-plan-type",
    templateUrl: "./plan-type.component.html",
    styleUrls: ["./plan-type.component.scss"],
})
export class PlanTypeComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() planTypes: string[];

    private readonly unsubscribe$ = new Subject<void>();

    formControl: FormControl = this.formBuilder.control([]);
    onChange: (value: string) => void;
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(public ngControl: NgControl, private readonly formBuilder: FormBuilder) {
        ngControl.valueAccessor = this;
    }
    ngOnInit(): void {
        this.ngControl.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.formControl.setErrors(this.ngControl.errors);
            this.formControl.markAsTouched();
        });
        this.formControl.valueChanges
            .pipe(
                tap((value) => this.onChange(value)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: any[]): void {
        this.formControl.setValue(value);
    }

    /**
     * ControlValueAccessor interface function, sets the onChange function
     *
     * @param fn The onChange Function
     */
    registerOnChange(fn: () => void): void {
        this.onChange = fn;
    }

    /**
     * ControlValueAccessor interface function, sets the onTouched Function
     *
     * @param fn The onTouched Function
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
