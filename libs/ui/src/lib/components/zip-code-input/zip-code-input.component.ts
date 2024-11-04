import { Component, OnInit, Input, OnDestroy, Provider, forwardRef } from "@angular/core";
import { Subject, Observable, of, BehaviorSubject } from "rxjs";
import { FormControl, ControlValueAccessor, AbstractControl, NG_VALUE_ACCESSOR, ValidationErrors, AsyncValidatorFn } from "@angular/forms";
import { map, switchMap, filter, tap, catchError, first, withLatestFrom, takeUntil } from "rxjs/operators";
import { StaticService } from "@empowered/api";
import { Select } from "@ngxs/store";
import { AddressConfig, AppSettings } from "@empowered/constants";
import { StaticUtilService, SharedState, RegexDataType } from "@empowered/ngxs-store";

const CHILD_ERROR = "childError";

const ZIP_CODE_INPUT_VALUE_ACCESSOR_PROVIDER: Provider = {
    provide: NG_VALUE_ACCESSOR,
    // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
    useExisting: forwardRef(() => ZipCodeInputComponent),
    multi: true,
};

@Component({
    selector: "empowered-zip-code-input",
    templateUrl: "./zip-code-input.component.html",
    styleUrls: ["./zip-code-input.component.scss"],
    providers: [ZIP_CODE_INPUT_VALUE_ACCESSOR_PROVIDER],
})
export class ZipCodeInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() inputLabel = "primary.portal.members.workLabel.zip";
    @Input() patternError = "secondary.portal.profile.editAccountInfo.invalidZipCode";
    @Input() stateMismatchError = "secondary.portal.members.situsMistmatchError";
    @Input() validateOnStateChange = false;
    @Input() readonly = false;
    @Input() ariaLabel?: string;

    private readonly formControlSubject$ = new BehaviorSubject<AbstractControl | undefined>(undefined);
    @Input()
    set formControl(formControl: AbstractControl) {
        this.formControlSubject$.next(formControl);
        if (formControl) {
            this.setFormControls();
        }
    }

    private readonly stateControlValueSubject$ = new BehaviorSubject("");
    @Input()
    set stateControlValue(stateControlValue: string) {
        this.stateControlValueSubject$.next(stateControlValue);
    }

    // contains zip code pattern
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;

    zipMinimumLength$ = this.staticUtilService.cacheConfigValue(AddressConfig.ZIP_MIN_LENGTH);
    zipMaximumLength$ = this.staticUtilService.cacheConfigValue(AddressConfig.ZIP_MAX_LENGTH);

    zipCodeControl = new FormControl();
    parentControl: AbstractControl;

    onTouched: () => void;
    onChange: (value: any) => void;

    // unique identifier for aria-labelledBy
    inputLabelElementId = "inputLabelElement" + Math.random();

    private readonly onChangeRegisteredSubject$ = new Subject<void>();
    private readonly asyncValidatorFiredSubject$ = new BehaviorSubject(false);
    private readonly unsubscribe$ = new Subject<void>();

    // if setting is enabled, triggers zipFormatAndStateMatchValidatorFn$
    private readonly stateControlValue$ = this.stateControlValueSubject$.asObservable().pipe(
        tap(() => this.zipCodeControl.updateValueAndValidity({ onlySelf: true })),
        takeUntil(this.unsubscribe$),
    );

    // Refire async validator if any value changes occur before onChange is registered.
    private readonly asyncValidatorQueue$ = this.onChangeRegisteredSubject$.asObservable().pipe(
        first(),
        withLatestFrom(this.asyncValidatorFiredSubject$),
        filter(([, asyncValidatorFired]) => !!asyncValidatorFired),
        tap(() => this.zipCodeControl.updateValueAndValidity({ onlySelf: true })),
    );

    constructor(private readonly staticService: StaticService, private readonly staticUtilService: StaticUtilService) {}

    /**
     * Test zip code input value via regex. If it's a correct format and there is a state input that
     * exists and has a valid value, check if the zip code belongs to that state. Apply error if parent
     * is invalid.
     *
     * @param control zipCodeControl
     * @returns Observable<null (zip format is valid and matches state if it exists) | ValidationErrors (on error)>
     */
    private readonly zipFormatAndStateMatchValidatorFn$: AsyncValidatorFn = (control: AbstractControl) =>
        this.regex$.pipe(
            tap(() => this.asyncValidatorFiredSubject$.next(true)),
            filter((regex) => !!regex && !!this.onChange),
            // regex validation
            map((regex) => {
                this.onChange(control.value);
                if (!control.value || !control.value.trim()) {
                    return null;
                }
                return this.testRegexString(regex, control.value);
            }),
            switchMap((regexResult) => {
                if (!regexResult && this.stateControlValueSubject$.value && Boolean(control.value)) {
                    // state and zip code match validation
                    return this.staticService.validateStateZip(this.stateControlValueSubject$.value, control.value).pipe(
                        map((response) => {
                            if (response.status === AppSettings.API_RESP_204) {
                                return null;
                            }
                        }),
                        catchError((error) => {
                            if (error.status === AppSettings.API_RESP_400) {
                                return of({ mismatch: "Zip code does not match selected state." });
                            }
                            return undefined;
                        }),
                        first(),
                    );
                }
                // parent control validation
                if (this.parentControl && this.parentControl.invalid && (this.parentControl.dirty || this.parentControl.touched)) {
                    // calibrate zipCodeControl's touch status with parentControl's
                    if (this.parentControl.touched) {
                        this.zipCodeControl.markAsTouched();
                    } else {
                        this.zipCodeControl.markAsUntouched();
                    }
                    return of({ parentError: "Error in parent form control", ...regexResult });
                }
                return of(regexResult);
            }),
            tap((result) => this.setChildErrorsInParentControl(result)),
            first(),
        );

    /**
     * Calibrate form controls, and add async validator.
     */
    ngOnInit(): void {
        if (this.formControlSubject$.value) {
            this.setFormControls();
        }
        this.zipCodeControl.setAsyncValidators(this.zipFormatAndStateMatchValidatorFn$);
        this.asyncValidatorQueue$.subscribe();
        if (this.validateOnStateChange) {
            this.stateControlValue$.subscribe();
        }
    }

    /**
     * Clean up the subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Test a string against a zip code regex pattern.
     *
     * @param regex object that holds zip code regex pattern
     * @param value string to be tested
     * @returns null (value matches regex) | ValidationErrors (value does not match regex)
     */
    testRegexString(regex: RegexDataType, value: string): null | ValidationErrors {
        return new RegExp(regex.ZIP_CODE).test(value)
            ? null
            : {
                pattern: {
                    requiredPattern: regex.ZIP_CODE,
                    actualValue: value,
                },
            };
    }

    /**
     * Calibrate inner form control to parent control's settings and append it to the containing
     * FormGroup/FormArray if one exists.
     */
    setFormControls(): void {
        this.parentControl = this.formControlSubject$.value;

        // maintain value and updateOn strategy whenever form control is updated
        this.zipCodeControl = new FormControl(this.zipCodeControl.value, { updateOn: this.parentControl.updateOn });

        // Add validator to form group/array if it exists (necessary for updateOn: "submit")
        const parent = this.parentControl.parent;
        if ("push" in parent) {
            parent.push(this.zipCodeControl);
        } else if ("addControl" in parent) {
            parent.addControl("childZip", this.zipCodeControl);
        }
    }

    /**
     * If result of async validator contains any errors pertaining to the zipCodeControl's
     * validation, then apply childError ValidationError to the parent form control. Otherwise,
     * remove the childError from parent if it exists.
     *
     * @param result end of async validator pipe. null indicates no errors
     */
    setChildErrorsInParentControl(result: null | ValidationErrors): void {
        if (
            result &&
            this.parentControl &&
            !this.parentControl.hasError(CHILD_ERROR) &&
            !(Object.keys(result).length === 1 && result["parentError"])
        ) {
            this.parentControl.setErrors({
                ...this.parentControl.errors,
                childError: "Error in child form control.",
            });
        } else if (!result && this.parentControl && this.parentControl.hasError(CHILD_ERROR)) {
            delete this.parentControl.errors.childError;
        }
    }

    /**
     * Depending on the status, enables or disables the form control.
     *
     * @param isDisabled the disabled status to set on the control
     */
    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.zipCodeControl.disable();
        } else {
            this.zipCodeControl.enable();
        }
    }

    /**
     * Sets the current value, needs to be mapped to the appropriate mask.
     *
     * @param value The value to assign
     */
    writeValue(value: string): void {
        this.zipCodeControl.setValue(value);
    }

    /**
     * ControlValueAccessor interface function, sets the onChange function.
     *
     * @param fn The onChange Function
     */
    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
        this.onChangeRegisteredSubject$.next();
    }

    /**
     * ControlValueAccessor interface function, sets the onTouched Function.
     *
     * @param fn The onTouched Function
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
}
