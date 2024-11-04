import { Component, EventEmitter, forwardRef, Injector, Output } from "@angular/core";
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from "@angular/forms";
import { LanguageService } from "@empowered/language";

export interface PaymentAcknowledgementCheckboxLanguageKeys {
    paymentAcknowledgement: string;
    paymentAcknowledgementTitle: string;
}

@Component({
    selector: "empowered-payment-acknowledgement-checkbox",
    templateUrl: "./payment-acknowledgement-checkbox.component.html",
    styleUrls: ["./payment-acknowledgement-checkbox.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PaymentAcknowledgementCheckboxComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PaymentAcknowledgementCheckboxComponent),
            multi: true,
        },
    ],
})
export class PaymentAcknowledgementCheckboxComponent {
    value: string = null;
    disabled = false;
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof PaymentAcknowledgementCheckboxLanguageKeys, string>;
    control: FormControl = new FormControl("", [(control) => (!control.value ? { required: true } : null)]);
    @Output() inputChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private readonly language: LanguageService, private readonly injector: Injector) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    /**
     * @description Changes the value
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     */
    onInput(event: boolean): void {
        this.inputChange.emit(event);
    }

    /**
     * @description Changes the validation state
     * @returns void
     * @memberof ESignatureComponent
     */
    onValidationChange = () => {};

    /**
     * @description Writes the value to the component
     * @param {string} value
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @override
     */
    writeValue(value: string): void {
        this.value = value;
    }

    /**
     * @description Registers the touched event
     * @param {() => void} fn
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @override
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    /**
     * @description Registers the change event
     * @param { (value: string) => void } fn
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @override
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    /**
     * Registers a callback function to call when the validator inputs change.
     * @param fn the callback function
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @override
     */
    registerOnValidatorChange?(fn: () => void): void {
        this.onValidationChange = fn;
    }

    /**
     * @description Sets the disabled state
     * @param {boolean} isDisabled
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @override
     */
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    /**
     * @description Validates the value
     * @returns {Record<string, boolean>}
     * @memberof PaymentAcknowledgementCheckboxComponent
     */
    validate(): ValidationErrors | null {
        if (this.control?.invalid) {
            return { invalid: true };
        } else {
            return null;
        }
    }

    /**
     * @description Changes the touched state
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     */

    onTouched(event: boolean): void {
        this.inputChange.emit(event);
    }

    /**
     * @description Changes the value
     * @returns void
     * @memberof PaymentAcknowledgementCheckboxComponent
     */
    onChange(value: string): void {}

    /**
     * @description Builds the language keys
     * @returns {Record<keyof PaymentAcknowledgementCheckboxLanguageKeys, string>}
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof PaymentAcknowledgementCheckboxLanguageKeys, string> {
        return {
            paymentAcknowledgement: "primary.portal.aflac.always.modal.paymentAcknowledgementCheckbox",
            paymentAcknowledgementTitle: "primary.portal.aflac.always.modal.paymentAcknowledgementTitle",
        };
    }

    /**
     * @description Builds the language strings
     * @returns {Record<string, string>}
     * @memberof PaymentAcknowledgementCheckboxComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.paymentAcknowledgement,
            this.languageKeys.paymentAcknowledgementTitle,
        ]);
    }
}
