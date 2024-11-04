import { AfterViewInit, Component, Input, OnDestroy } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, NgControl } from "@angular/forms";
import { SharedState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";

const US_TOLL_FREE_NUMBER_MAX_LENGTH = 14;
const US_DIALING_CODE = "1";
const US_PHONE_REGEX = /^(\d{3})-(\d{3})-(\d{4})$/;

@Component({
    selector: "empowered-toll-free-number",
    templateUrl: "./toll-free-number.component.html",
    styleUrls: ["./toll-free-number.component.scss"],
})
export class TollFreeNumberComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
    @Input() hint: string; // info about the field

    disabled: boolean;
    includeDialingCode = true;
    regex = this.store.selectSnapshot(SharedState.regex);
    subscriptions: Subscription[] = [];

    // TODO - get updateOn from ngControl.control
    formControl: FormControl = this.formBuilder.control("", { updateOn: "blur" });

    // used in the template
    US_TOLL_FREE_NUMBER_MAX_LENGTH = US_TOLL_FREE_NUMBER_MAX_LENGTH;

    constructor(private readonly store: Store, private readonly formBuilder: FormBuilder, public ngControl: NgControl) {
        ngControl.valueAccessor = this;
    }

    onChange = (value: string) => {};
    onTouched = () => {};

    /**
     * Initializes the form control and sets up observer to track changes.
     */
    ngAfterViewInit(): void {
        this.formControl.updateValueAndValidity();
        this.subscriptions.push(
            this.formControl.valueChanges.subscribe((value) => {
                this.onChange(value);
                this.onTouched();
            }),
            this.ngControl.statusChanges.subscribe((value) => this.formControl.setErrors(this.ngControl.errors)),
        );
    }

    /**
     * Called by the forms API to write to the view when programmatic changes from model to view are requested.
     *
     * @param value the new value for the element
     */
    writeValue(value: string = ""): void {
        this.formControl.setValue(value);
    }

    /**
     * Registers a callback function that is called when the control's value changes in the UI.
     *
     * @param fn the callback function to register
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    /**
     * Registers a callback function that is called by the forms API on initialization to update the form model on blur.
     *
     * @param fn the callback function to register
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
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
     * Masks input if it is valid.
     *
     * @param value input value
     */
    onBlur(value: string): void {
        const valueToWrite = US_PHONE_REGEX.test(value) ? `${US_DIALING_CODE}-${value}` : value;
        this.writeValue(valueToWrite);
    }

    /**
     * Cleans up subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
