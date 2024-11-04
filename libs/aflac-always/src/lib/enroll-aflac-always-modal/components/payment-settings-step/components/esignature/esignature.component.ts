import { Component, EventEmitter, forwardRef, Output, Input } from "@angular/core";
import { ControlValueAccessor, FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from "@angular/forms";
import { LanguageService } from "@empowered/language";

export interface EsignatureLanguageKeys {
    eSignature: string;
    eSignatureRequired: string;
    invalidFormat: string;
    maxChar: string;
    leastChar: string;
}

@Component({
    selector: "empowered-esignature",
    templateUrl: "./esignature.component.html",
    styleUrls: ["./esignature.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EsignatureComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => EsignatureComponent),
            multi: true,
        },
    ],
})
export class EsignatureComponent implements ControlValueAccessor {
    @Input() label: string;
    @Input() control = new FormControl();
    @Input() disabled = false;
    value: string = null;
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof EsignatureLanguageKeys, string>;
    formGroup: FormGroup;
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
     * @description Changes the validation state
     * @returns void
     * @memberof ESignatureComponent
     */
    onValidationChange = () => {};

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
     * @memberof EsignatureComponent
     * @override
     */
    writeValue(value: string): void {
        this.value = value;
    }

    /**
     * @description Registers the change event
     * @param {(_: string) => void} fn
     * @returns void
     * @memberof EsignatureComponent
     * @override
     */
    registerOnChange(fn: (_: string) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the touched event
     * @param {() => void} fn
     * @returns void
     * @memberof EsignatureComponent
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
     * @memberof EsignatureComponent
     * @override
     */
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

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
     * @memberof EsignatureComponent
     */
    onChange: (value: string) => void = () => {};

    /**
     * @description Changes the touched state
     * @returns void
     * @memberof EsignatureComponent
     */
    onTouched: () => void = () => {};

    /**
     * @description Builds the language keys
     * @returns {Record<keyof EsignatureLanguageKeys, string>}
     * @memberof EsignatureComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof EsignatureLanguageKeys, string> {
        return {
            eSignature: "primary.portal.aflac.always.modal.eSignature",
            eSignatureRequired: "primary.portal.aflac.always.modal.eSignatureRequired",
            invalidFormat: "primary.portal.aflac.always.modal.eSignature.invalid.format",
            maxChar: "primary.portal.aflac.always.modal.eSignature.max.char",
            leastChar: "primary.portal.aflac.always.modal.eSignature.min.char",
        };
    }

    /**
     * @description Builds the language strings
     * @returns {Record<string, string>}
     * @memberof EsignatureComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.eSignature,
            this.languageKeys.eSignatureRequired,
            this.languageKeys.invalidFormat,
            this.languageKeys.maxChar,
            this.languageKeys.leastChar,
        ]);
    }
}
