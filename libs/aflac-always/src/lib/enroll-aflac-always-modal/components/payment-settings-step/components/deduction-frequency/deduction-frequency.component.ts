import { Component, EventEmitter, forwardRef, Injector, OnInit, Output } from "@angular/core";
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { AflacAlwaysLanguageService } from "../../../../services/aflac-always-language.service";
import { TitleCasePipe } from "@angular/common";
import { Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { AflacAlwaysConfigService } from "../../../../services/aflac-always-config.service";
import { AflacAlwaysStoreService } from "../../../../services/aflac-always-store.service";

const MONTHS = 12;
const QUARTER = 4;
const AMOUNT_PRECISION = 2;

export interface DeductionFrequencyLanguageKeys {
    deductionFrequency: string;
    deductionFrequencyRequired: string;
}

export interface SelectFieldOption<T = string> {
    label: string;
    value: T;
    selected?: boolean;
}

@Component({
    selector: "empowered-deduction-frequency",
    templateUrl: "./deduction-frequency.component.html",
    styleUrls: ["./deduction-frequency.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DeductionFrequencyComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DeductionFrequencyComponent),
            multi: true,
        },
    ],
})
export class DeductionFrequencyComponent implements OnInit {
    value: string = null;
    disabled = false;
    languageStrings: Record<string, string>;
    languageKeys: Record<keyof DeductionFrequencyLanguageKeys, string>;
    control: FormControl = new FormControl(null, [Validators.required]);
    options$: Observable<SelectFieldOption[]>;
    @Output() inputChange: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        readonly aflacLanguageService: AflacAlwaysLanguageService,
        protected readonly injector: Injector,
        protected readonly titleCasePipe: TitleCasePipe,
        protected readonly configService: AflacAlwaysConfigService,
        protected readonly storeService: AflacAlwaysStoreService,
        readonly languageService: LanguageService,
    ) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    ngOnInit(): void {
        this.options$ = this.buildOptions();
        // Set the preselect value Monthly and emit
        this.control.setValue(this.aflacLanguageService.strings.monthly);
        this.inputChange.emit(this.aflacLanguageService.strings.monthly);
        this.control.valueChanges.pipe(take(1)).subscribe((value) => {
            this.inputChange.emit(value);
        });
    }

    /**
     * @description Builds the options
     * @returns {Observable<SelectFieldOption[]>}
     * @memberof DeductionFrequencySelectFieldComponent
     * @override
     */
    buildOptions(): Observable<SelectFieldOption[]> {
        return this.storeService.fetchMonthlyCost().pipe(
            map((monthlyCost: number) => {
                const quarterlyCost = ((monthlyCost * MONTHS) / QUARTER).toFixed(AMOUNT_PRECISION);
                return this.configService.strings.deductionFrequencies.map(
                    (p): SelectFieldOption => ({
                        label: this.getOptionLabel(p, monthlyCost.toFixed(AMOUNT_PRECISION), quarterlyCost),
                        value: p,
                        selected: p === this.control?.value,
                    }),
                );
            }),
            take(1),
        );
    }

    /**
     * @description Gets the option label
     * @param {string} optionLabel
     * @param {number} monthlyCost
     * @param {string} quarterlyCost
     * @returns {string}
     * @memberof DeductionFrequencySelectFieldComponent
     */
    private getOptionLabel(optionLabel: string, monthlyCost: string, quarterlyCost: string): string {
        if (optionLabel === this.aflacLanguageService.strings.quarterly) {
            return `${this.aflacLanguageService.strings.quarterly}: $${quarterlyCost}`;
        }

        if (optionLabel === this.aflacLanguageService.strings.monthly) {
            return `${this.aflacLanguageService.strings.monthly}: $${monthlyCost}`;
        }

        return optionLabel;
    }

    /**
     * @description Changes the value
     * @returns void
     * @memberof DeductionFrequencyComponent
     */
    onChange(value: string): void {
        this.inputChange.emit(value);
    }
    /**
     * @description Changes the touched state
     * @returns void
     * @memberof DeductionFrequencyComponent
     */
    onTouched: () => void = () => {};
    /**
     * @description Changes the validation state
     * @returns void
     * @memberof DeductionFrequencyComponent
     */
    onValidationChange = () => {};

    /**
     * @description Writes the value to the component
     * @param {string} value
     * @returns void
     * @memberof DeductionFrequencyComponent
     * @override
     */
    writeValue(value: string): void {
        this.value = value;
    }
    /**
     * @description Registers the change event
     * @param { (value: string) => void } fn
     * @returns void
     * @memberof DeductionFrequencyComponent
     * @override
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the touched event
     * @param {() => void} fn
     * @returns void
     * @memberof DeductionFrequencyComponent
     * @override
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Registers a callback function to call when the validator inputs change.
     * @param fn the callback function
     * @returns void
     * @memberof DeductionFrequencyComponent
     * @override
     */
    registerOnValidatorChange?(fn: () => void): void {
        this.onValidationChange = fn;
    }

    /**
     * @description Validates the value
     * @returns {Record<string, boolean>}
     * @memberof DeductionFrequencyComponent
     */
    validate(): Record<string, boolean> {
        return this.control?.invalid ? { deductionFrequency: true } : null;
    }

    /**
     * @description Builds the language keys
     * @returns {Record<keyof DeductionFrequencyLanguageKeys, string>}
     * @memberof DeductionFrequencyComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof DeductionFrequencyLanguageKeys, string> {
        return {
            deductionFrequency: "primary.portal.aflac.always.modal.deductionFrequency",
            deductionFrequencyRequired: "primary.portal.aflac.always.modal.deductionFrequency.deductionFrequencyRequired",
        };
    }

    /**
     * @description Builds the language strings
     * @returns {Record<string, string>}
     * @memberof DeductionFrequencyComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            this.languageKeys.deductionFrequency,
            this.languageKeys.deductionFrequencyRequired,
        ]);
    }
}
