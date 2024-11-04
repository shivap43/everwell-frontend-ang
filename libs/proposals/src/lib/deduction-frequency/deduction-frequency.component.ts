import { Observable } from "rxjs";
import { Component, EventEmitter, forwardRef, Output } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR, Validators } from "@angular/forms";
import { PayFrequency } from "@empowered/constants";
import { Select } from "@ngxs/store";
import { ProposalsState } from "@empowered/ngxs-store";
@Component({
    selector: "empowered-deduction-frequency",
    templateUrl: "./deduction-frequency.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DeductionFrequencyComponent),
            multi: true,
        },
    ],
})
export class DeductionFrequencyComponent implements ControlValueAccessor {
    @Output() selectionChange = new EventEmitter<number>();

    @Select(ProposalsState.getDeductionFrequencies) deductionFrequencies$: Observable<PayFrequency[]>;

    formControl: FormControl = this.formBuilder.control("", Validators.required);

    // Disabling rule on the next line because onChange expects a 'value' param.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onChange: (value: number) => void;
    onTouched: () => void;

    constructor(private readonly formBuilder: FormBuilder) {}

    writeValue(value: string): void {
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
     * Handles a selection change event.
     *
     * @param deductionFrequencyId id of selected deduction frequency
     */
    onDeductionFrequencyChange(deductionFrequencyId: number): void {
        this.selectionChange.emit(deductionFrequencyId);
        this.onChange(deductionFrequencyId);
        this.onTouched();
    }
}
