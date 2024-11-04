import { Component, OnInit, Provider, forwardRef, OnDestroy, Optional, Host, SkipSelf, Input } from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl, ControlContainer, AbstractControl } from "@angular/forms";
import { Observable, Subject, ReplaySubject, combineLatest, iif, defer, EMPTY } from "rxjs";
import { map, tap, takeUntil, filter, switchMap, shareReplay } from "rxjs/operators";
import { LanguageService } from "@empowered/language";

const HEX_COLOR_INPUT_VALUE_ACCESSOR_PROVIDER: Provider = {
    provide: NG_VALUE_ACCESSOR,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    useExisting: forwardRef(() => HexColorInputComponent),
    multi: true,
};

const POUND_PREFIX = "#";

@Component({
    selector: "empowered-hex-color-input",
    templateUrl: "./hex-color-input.component.html",
    styleUrls: ["./hex-color-input.component.scss"],
    providers: [HEX_COLOR_INPUT_VALUE_ACCESSOR_PROVIDER],
})
export class HexColorInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() formControlName: string;

    // signals when the onTouch function has been registered
    private readonly onTouchedRegistered$: Subject<void> = new Subject<void>();
    // signals when the onChange function has been registered
    private readonly onChangeRegistered$: Subject<void> = new Subject<void>();
    // Queue of values that have not been loaded yet
    private readonly inputValueQueueSubject$: ReplaySubject<string> = new ReplaySubject<string>();
    // Unsubscribe functionality
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    // Signals when all required elements have been registered
    isRegistered$: Observable<void[]> = combineLatest([
        this.onTouchedRegistered$.asObservable(),
        this.onChangeRegistered$.asObservable(),
    ]).pipe(shareReplay(1));

    // ControlValueAccessor implementation specific variables
    hexColorControl: FormControl = new FormControl();
    onChange: (value: string) => void;
    onTouched: () => void;

    /**
     * Every time the user changes the value, strip off the masked value and echo it out.
     * If the mask is not present, add it back in
     */
    valueChange$: Observable<string> = this.isRegistered$.pipe(
        switchMap(() => this.hexColorControl.valueChanges),
        // Prevent update emissions until onChange is defined
        filter(() => Boolean(this.onChange)),
        // Reapply the mask if removed
        tap((value) => {
            if (value && value.length > 0 && value.charAt(0) !== POUND_PREFIX) {
                this.writeValue(value);
            }
        }),
        // Map the out going value to a raw 6 char string
        map((value) => this.stripMask(value)),
        // Call the ControlValueAccessor's functions whenever the value changes
        tap((rawValue) => {
            this.onChange(rawValue);
            this.onTouched();
        }),
        // Handle unsubscription
        takeUntil(this.unsubscribe$.asObservable()),
    );

    inputValueQueue$: Observable<string> = this.isRegistered$.pipe(
        switchMap(() => this.inputValueQueueSubject$.asObservable()),
        tap((value) => this.hexColorControl.setValue(value)),
        takeUntil(this.unsubscribe$.asObservable()),
    );

    isInvalid$: Observable<boolean>;

    ariaString = this.languageService.fetchPrimaryLanguageValue("primary.portal.branding.aria.hex_input");

    parentControl: AbstractControl;

    constructor(
        private readonly languageService: LanguageService,
        @Optional() @Host() @SkipSelf() private readonly controlContainer: ControlContainer,
    ) {}

    /**
     * Subscribe to the observables here
     */
    ngOnInit(): void {
        if (this.controlContainer) {
            this.parentControl = this.controlContainer.control.get(this.formControlName);
        }
        this.isInvalid$ = iif(
            () => Boolean(this.controlContainer && this.formControlName),
            defer(() =>
                this.parentControl.valueChanges.pipe(
                    map(() => (this.parentControl.invalid ? this.parentControl.dirty || this.parentControl.touched : false)),
                    tap((isInvalid) => this.hexColorControl.setErrors(isInvalid ? { parentError: "error in parent" } : null)),
                ),
            ),
            EMPTY,
        );

        this.isInvalid$.subscribe();
        this.valueChange$.subscribe();
        this.inputValueQueue$.subscribe();
    }

    /**
     * Clean up the subscriptions here
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Sets the current value, needs to be mapped to the appropriate mask
     *
     * @param value The value to assign
     */
    writeValue(value: string): void {
        if (this.onChange) {
            this.hexColorControl.setValue(this.applyMask(value));
        } else {
            this.inputValueQueueSubject$.next(this.applyMask(value));
        }
    }

    /**
     * ControlValueAccessor interface function, sets the onChange function
     *
     * @param fn The onChange (value: string) => void
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
        this.onChangeRegistered$.next();
    }

    /**
     * ControlValueAccessor interface function, sets the onTouched function
     *
     * @param fn The onTouched (value: string) => void
     */
    registerOnTouched(fn: (value: string) => void): void {
        this.onTouched = Function;
        this.onTouchedRegistered$.next();
    }

    /**
     * Applies a leading '#' to the start of the value
     *
     * @param value the value to be masked
     * @returns masked value
     */
    applyMask(value: string): string {
        const stringValue = value ? value : "";
        return value && value.length > 0 && value.charAt(0) === POUND_PREFIX ? value : `${POUND_PREFIX}${stringValue}`;
    }

    /**
     * Removes the mask from the value
     *
     * @param value the masked value
     * @returns unmasked value
     */
    stripMask(value: string): string {
        return value && value.length > 0 && value.charAt(0) === POUND_PREFIX ? value.replace(POUND_PREFIX, "") : value;
    }
}
