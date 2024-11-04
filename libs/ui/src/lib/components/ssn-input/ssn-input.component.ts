import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { filter, take, takeUntil } from "rxjs/operators";
import { BehaviorSubject, Subject } from "rxjs";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl, ValidationErrors } from "@angular/forms";
import { SsnFormatPipe } from "../../pipes";
import { SSNVisibility } from "./ssn-visibility.enum";
import { SSN_FIELD_MAX_LENGTH } from "./ssn-input.constants";

@Component({
    selector: "empowered-ssn-input",
    templateUrl: "./ssn-input.component.html",
    styleUrls: ["./ssn-input.component.scss"],
})
export class SsnInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() ssnErrors: Array<{ key: string; value: string }>;
    @Input() visibility = SSNVisibility.PARTIALLY_MASKED;
    @Input() regex: { [key: string]: string };
    @Input() allowPaste: boolean;
    @Input() showToggle: boolean;
    @Input() showHint: boolean;
    @Input() isProducerPortal: boolean;
    @Input() ariaLabel?: string;

    @Output() inputChange: EventEmitter<string> = new EventEmitter<string>();

    readonly showSSNSubject$ = new BehaviorSubject(false);
    showSSN$ = this.showSSNSubject$.asObservable();
    private readonly unsubscribe$ = new Subject<void>();

    masked = true;
    lastValue = "";
    disabled: boolean;
    formControl: FormControl = this.formBuilder.control("", { updateOn: "blur" });

    onChange: (value: string) => void;
    onTouched = () => {};
    onValidationChange = () => {};

    constructor(private readonly formBuilder: FormBuilder, private readonly ssnFormatPipe: SsnFormatPipe, public ngControl: NgControl) {
        ngControl.valueAccessor = this;
    }

    /**
     * Sets up observers to track SSN visibility and update form control values.
     */
    ngOnInit(): void {
        this.showSSN$.pipe(takeUntil(this.unsubscribe$)).subscribe((showSSN) => {
            if (!this.formControl.errors?.pattern) {
                if (showSSN) {
                    this.formControl.setValue(this.lastValue);
                } else {
                    if (!this.isMasked(this.formControl.value)) {
                        this.lastValue = this.formControl.value;
                    }
                    this.formControl.setValue(this.getMaskedSSN(this.lastValue, this.visibility));
                }
                this.formControl.setErrors(this.ngControl.errors);
            }
        });
        this.ngControl.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.formControl.setErrors(this.ngControl.errors));
        this.formControl.valueChanges
            .pipe(
                filter((value) => !this.isMasked(value)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((value) => this.onValueChange(value));
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: string): void {
        const ssnSplitFormat = new RegExp(this.regex?.SSN_SPLIT_FORMAT);

        this.showSSN$.pipe(take(1)).subscribe((showSSN) => {
            const formattedSSN = this.ssnFormatPipe.transform(value, ssnSplitFormat);
            if (showSSN) {
                this.formControl.setValue(formattedSSN);
            } else {
                this.lastValue = formattedSSN;
                this.formControl.setValue(this.getMaskedSSN(this.ssnFormatPipe.transform(value, ssnSplitFormat), this.visibility));
            }
        });
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
            this.formControl.disable();
        } else {
            this.formControl.enable();
        }
    }

    /**
     * Toggles SSN visibility.
     */
    onToggle(): void {
        this.showSSN$.pipe(take(1)).subscribe((showSSN) => this.showSSNSubject$.next(!showSSN));
    }

    /**
     * Masks SSN if applicable (visibility is not set to FULLY_VISIBLE).
     */
    onBlur(): void {
        this.showSSNSubject$.next(false);
    }

    /**
     * Unmasks SSN.
     */
    onFocus(): void {
        this.showSSNSubject$.next(true);
    }

    /**
     * Calls onChange to propagate changes to the model from the view.
     *
     * @param value value with which to update the model
     */
    onValueChange(value: string): void {
        this.onChange(value);
        this.onTouched();
        this.onValidationChange();
    }

    /**
     * Method that performs synchronous validation against the provided control,
     * called when the control's value changes.
     *
     * @returns map of errors returned from failed validation checks
     */
    validate(): ValidationErrors | null {
        if (this.formControl?.invalid) {
            return { invalid: true };
        } else {
            return null;
        }
    }

    /**
     * Returns the masked SSN value.
     *
     * @param value unmasked SSN value
     * @param visibility SSN visibility configuration
     * @returns masked SSN
     */
    getMaskedSSN(value: string, visibility: SSNVisibility): string {
        if (!value || value.length !== SSN_FIELD_MAX_LENGTH || visibility === SSNVisibility.FULLY_VISIBLE) {
            return value;
        }
        if (visibility === SSNVisibility.PARTIALLY_MASKED) {
            return value.replace(new RegExp(this.regex?.SSN_PARTIAL_MASK, "gm"), (m) => m.replace(/\d/g, "X"));
        }
        if (visibility === SSNVisibility.FULLY_MASKED) {
            return "XXX-XX-XXXX";
        }
        return value;
    }

    /**
     * Emits an input change event.
     *
     * @param value string to emit
     */
    onInput(value: string): void {
        this.inputChange.emit(value);
    }

    /**
     * Determines whether pasting on an input field is allowed or not
     * @returns true if paste is allowed
     */
    onPaste(): boolean {
        return this.allowPaste;
    }

    /**
     * Returns whether input SSN is masked.
     *
     * @param value SSN
     * @returns whether SSN is masked
     */
    isMasked(value: string): boolean {
        return value?.includes("X");
    }

    /**
     * Cleans up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
