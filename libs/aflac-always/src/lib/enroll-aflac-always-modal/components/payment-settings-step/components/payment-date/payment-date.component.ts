import { Component, EventEmitter, Output } from "@angular/core";
import { ControlValueAccessor, FormControl, Validators, ValidationErrors } from "@angular/forms";
import { LanguageService } from "@empowered/language";
export interface PaymentDateLanguageKeys {
    paymentDate: string;
    paymentDateHint: string;
}

@Component({
    selector: "empowered-payment-date",
    templateUrl: "./payment-date.component.html",
    styleUrls: ["./payment-date.component.scss"],
})
export class PaymentDateComponent implements ControlValueAccessor {
    disabled = false;
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof PaymentDateLanguageKeys, string>;
    control: FormControl = new FormControl(null, [Validators.required, Validators.min(1), Validators.max(28)]);

    @Output() inputChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(private readonly language: LanguageService) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
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
     * Emits an input change event.
     *
     * @param value string to emit
     */
    onInput(value: string): void {
        this.inputChange.emit(value);
    }

    /**
     * @description Writes the value to the component
     * @param {string} value
     * @returns void
     * @memberof PaymentDateComponent
     * @override
     */
    writeValue(value: string): void {}

    /**
     * @description Registers the change event
     * @param { (value: string) => void } fn
     * @returns void
     * @memberof PaymentDateComponent
     * @override
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the touched event
     * @param {() => void} fn
     * @returns void
     * @memberof PaymentDateComponent
     * @override
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
     * @description Sets the disabled state
     * @param {boolean} isDisabled
     * @returns void
     * @memberof PaymentDateComponent
     * @override
     */
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    /**
     * @description Validates the value
     * @returns ValidationErrors or null
     * @memberof PaymentDateComponent
     */
    validate(): ValidationErrors | null {
        if (this.control?.invalid) {
            return { invalid: true };
        } else {
            return null;
        }
    }

    /**
     * @description Changes the value
     * @returns void
     * @memberof PaymentDateComponent
     */
    onChange: (value: string) => void = () => {};

    /**
     * @description Changes the touched state
     * @returns void
     * @memberof PaymentDateComponent
     */
    onTouched: () => void = () => {};
    /**
     * @description Changes the validation state
     * @returns void
     * @memberof PaymentDateComponent
     */
    onValidationChange = () => {};

    /**
     * @description Builds the language keys
     * @returns {Record<keyof PaymentDateLanguageKeys, string>}
     * @memberof PaymentDateComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof PaymentDateLanguageKeys, string> {
        return {
            paymentDate: "primary.portal.aflac.always.modal.paymentDate.paymentDate",
            paymentDateHint: "primary.portal.aflac.always.modal.paymentDate.paymentDateHint",
        };
    }

    /**
     * @description Builds the language strings
     * @returns {Record<string, string>}
     * @memberof PaymentDateComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([this.languageKeys.paymentDate, this.languageKeys.paymentDateHint]);
    }
}
