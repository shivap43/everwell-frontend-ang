import { Component, Input } from "@angular/core";
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from "@angular/material/core";
import { ControlValueAccessor, NgControl, FormControl, Validators } from "@angular/forms";
import { DateFormats } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { DateFnsDateAdapter, DATE_FNS_FORMATS, DateService } from "@empowered/date";

/**
 * formControl brings in the form that the component is being used on and is needed for the component to function
 * example: [formControl]="(insert FormGroup here).controls['(insert FormControlName here)']"
 * @param minDate sets the minimum date the date picker will accept as valid input
 * example: [minDate]="insert date object here"
 * @param maxDate sets the maximum date the date picker will accept as valid input
 * example: [maxDate]="insert date object here"
 * @param customHint accepts a string and is used to hold the value pushed to the aria label of the hint
 * example: [customHint]="'insert string here'" or [customHint]="insert string variable here"
 * @param customError accepts a string and is used to hold the value pushed to the aria label of the error
 * example: [customError]="'insert string here'" or [customError]="insert string variable here"
 * @param labeledById accepts a string to be used as the aria-labelledby value
 * example: [labeledById]="'insert string here'" or [labeledById]="insert string variable here"
 */
/**
 * The exported constant below is used to format the text in the date picker's input
 * and the display with in the dropdown menu in the icon.
 */
export const APP_DATE_FORMATS: MatDateFormats = {
    parse: {
        dateInput: DateFormats.MONTH_DAY_YEAR_UPPERCASE,
    },
    display: {
        dateInput: DateFormats.MONTH_DAY_YEAR_UPPERCASE,
        monthYearLabel: DateFormats.COMPLETE_MONTH_YEAR,
        dateA11yLabel: DateFormats.LONG_MONTH_SHORT_DAY_YEAR,
        monthYearA11yLabel: DateFormats.COMPLETE_MONTH_YEAR,
    },
};

@Component({
    selector: "empowered-date-picker",
    templateUrl: "./date-picker.component.html",
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FNS_FORMATS },
    ],
})
export class EmpoweredDatePickerComponent implements ControlValueAccessor {
    @Input() minDate: Date;
    @Input() maxDate: Date;
    @Input() customHint: string;
    @Input() labeledById: string;
    @Input() displayOrder: string;
    @Input() formName: string;

    // eslint-disable-next-line @typescript-eslint/ban-types
    onChange: Function;
    datePickerControl = new FormControl("", Validators.required);
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.datePickerLabel",
        "primary.portal.common.dateHint",
        "primary.portal.common.requiredField",
        "primary.portal.common.datePickerIconLabel",
    ]);

    constructor(
        private readonly ngControl: NgControl,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {
        this.ngControl.valueAccessor = this;
    }

    /**
     * function takes an input string and attempts to create a date object matching the
     * format MM/DD/YYYY specifically. if so isValid returns true and the function returns true.
     * @param dateString is the string to be tested, as this method should only be called from
     * onInput it should only be testing the value in the view of the date picker
     * @returns a boolean of whether or not the dateString provided is valid or not.
     */
    private isCorrectFormat(dateString: string): boolean {
        return this.dateService.isValid(this.dateService.parseDate(dateString, DateFormats.MONTH_DAY_YEAR));
    }

    /**
     * this function checks whether an input string matches the proper format and if the child
     * controller is holding proper data. If it does the data is pushed to the parent controller.
     * otherwise the parent controller is cleared.
     * @param newInputReceived is the new value in the date picker display
     */
    onInput(newInputReceived: string): void {
        if (this.datePickerControl.valid && this.isCorrectFormat(newInputReceived)) {
            this.onChange(this.dateService.format(newInputReceived, DateFormats.MONTH_DAY_YEAR));
        } else {
            this.onChange(null);
        }
    }

    /**
     * This method comes from the ControlValueAccessor and is needed to maintain its functionality
     * @param fn pushes values to the parent form. sets onChange to do push values as new dates are input.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    registerOnChange(fn: Function): void {
        this.onChange = fn;
    }
    /**
     * This method comes from the ControlValueAccessor and is needed to maintain its functionality
     */
    registerOnTouched(): void {}
    /**
     * This method comes from the ControlValueAccessor and is needed to maintain its functionality
     * @param value contains the initial date value to be pushed into the view
     * and to be pushed into the parent component. This ensures that the component
     * is pre-populated on render and that the parent component has an initial value.
     */
    writeValue(value: Date): void {
        // ensures date in parent component is in proper format
        // sets the initial value in the date picker's
        this.datePickerControl.setValue(this.dateService.format(value, DateFormats.DATE_TIME));
    }
}
