import { Component, forwardRef, Input, OnInit } from "@angular/core";
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators } from "@angular/forms";
import { EnrollmentMethodDetail } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { AflacAlwaysHelperService } from "../../services/aflac-always-helper.service";

export interface SelectPoliciesFormKeys {
    enrollmentMethod: string;
    eligiblePolicies: string;
    importPolicy: string;
}

@Component({
    selector: "empowered-select-policies-step",
    templateUrl: "./select-policies-step.component.html",
    styleUrls: ["./select-policies-step.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectPoliciesStepComponent),
            multi: true,
        },
    ],
})
export class SelectPoliciesStepComponent implements OnInit, ControlValueAccessor {
    readonly languageStrings: Record<string, string>;
    readonly languageKeys: Record<string, string>;
    readonly formKeys: Record<keyof SelectPoliciesFormKeys, string>;

    @Input() shouldShowEnrollmentMethod = true;
    @Input() mpGroup: string;
    @Input() isModalMode: boolean;

    formGroup: FormGroup;
    isEnrollmentMethodRequiredError = false;
    value: SelectPoliciesFormKeys;
    isPolicySelected$ = this.aflacAlwaysHelperService.policySelected$;
    noPoliciesFound$ = this.aflacAlwaysHelperService.noPoliciesFound$;
    hasClickedNext$ = this.aflacAlwaysHelperService.hasClickedNext$;
    isLoading$ = this.aflacAlwaysHelperService.isLoading$();

    constructor(private readonly language: LanguageService, private readonly aflacAlwaysHelperService: AflacAlwaysHelperService) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
        this.formKeys = this.buildFormKeys();
    }

    /**
     * @description Gets the enrollment method form control
     * @returns FormControl
     * @memberof SelectPoliciesStepComponent
     */
    get enrollmentMethodFormControl(): FormControl {
        return this.formGroup.controls[this.formKeys.enrollmentMethod] as FormControl;
    }

    /**
     * @description Gets the enrollment method
     * @returns EnrollmentMethodDetail
     * @memberof SelectPoliciesStepComponent
     */
    get enrollmentMethod(): EnrollmentMethodDetail {
        return this.enrollmentMethodFormControl.value;
    }

    /**
     * @description Fires the onChange function
     * @param value SelectPoliciesFormKeys
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    onChange = (value: SelectPoliciesFormKeys) => {
        this.value = value;
    };

    /**
     * @description Fires the onTouched function
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    onTouched = () => {};

    /**
     * @description Registers the onChange function
     * @param fn (value: SelectPoliciesFormKeys) => void
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    registerOnChange(fn: (value: SelectPoliciesFormKeys) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the onTouched function
     * @param fn (value: SelectPoliciesFormKeys) => void
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * @description Writes the value to the form
     * @returns void
     * @memberof SelectPoliciesStepComponent
     * @param {SelectPoliciesFormKeys} obj
     */
    writeValue(obj: SelectPoliciesFormKeys): void {
        this.value = obj;
    }

    /**
     * @description Initializes the component
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    ngOnInit(): void {
        this.formGroup = this.buildFormGroup();
        // Emitting true when component is loaded since initially so selection has been made
        this.aflacAlwaysHelperService.policySelected$.next(true);
        // Emitting false when component is loaded since error should be displayed on click of next
        this.aflacAlwaysHelperService.noPoliciesFound$.next(false);
        this.listenToEnrollmentMethodChanges();
    }

    /**
     * @description Builds the form group
     * @returns FormGroup
     * @memberof SelectPoliciesStepComponent
     */
    private listenToEnrollmentMethodChanges(): void {
        this.enrollmentMethodFormControl.valueChanges.subscribe((status) => (this.isEnrollmentMethodRequiredError = status === "INVALID"));
    }

    /**
     * @description Builds the form group
     * @returns FormGroup
     * @memberof SelectPoliciesStepComponent
     */
    private buildFormGroup(): FormGroup {
        return new FormGroup({
            [this.formKeys.enrollmentMethod]: new FormControl("", Validators.required),
            [this.formKeys.eligiblePolicies]: new FormControl("", Validators.required),
            [this.formKeys.importPolicy]: new FormControl("", Validators.required),
        });
    }

    /**
     * @description Builds the form keys
     * @returns Record<keyof SelectPoliciesFormKeys, string>
     * @memberof SelectPoliciesStepComponent
     * @private
     */
    private buildFormKeys(): Record<keyof SelectPoliciesFormKeys, string> {
        return {
            enrollmentMethod: "enrollmentMethod",
            eligiblePolicies: "eligiblePolicies",
            importPolicy: "importPolicy",
        };
    }

    /**
     * @description This function builds the language keys for the component
     * @memberof SelectPoliciesStepComponent
     * @returns Record<string, string>
     */
    private buildLanguageKeys(): Record<string, string> {
        return {
            selectPoliciesHeader: "primary.portal.aflac.always.select.policies",
            selectPoliciesText: "primary.portal.aflac.always.definition",
            noPolicySelected: "primary.portal.aflac.always.policy.nopolicyselected",
            noPoliciesFound: "primary.portal.aflac.always.policy.noPoliciesFound",
        };
    }

    /**
     * @description Submits the form
     * @returns void
     * @memberof SelectPoliciesStepComponent
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.selectPoliciesHeader,
            this.languageKeys.selectPoliciesText,
            this.languageKeys.noPolicySelected,
            this.languageKeys.noPoliciesFound,
        ]);
    }
}
