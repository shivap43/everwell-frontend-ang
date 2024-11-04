import { Directive, ElementRef, HostListener, Input } from "@angular/core";
import { NgxMaskPipe } from "ngx-mask";
import { AppSettings } from "@empowered/constants";

const EXPIRY_DATE_FORMAT = "09/0000";
const SLASH_KEY = "/";
const BACK_SPACE_KEYWORD = "Backspace";
@Directive({
    selector: "[empoweredDateTransform]",
})
export class DateTransformDirective {
    @Input() notCalenderFormat: boolean;
    allowedDigitRegex = /^[0-9/]+$/g;
    dateFormat = AppSettings.DATE_MASK_FORMAT;
    constructor(private element: ElementRef, private maskPipe: NgxMaskPipe) {}

    /**
     * This function is responsible for masking the date format in MM/DD/YYYY format
     * @param event event object is for bypassing backspace key event
     */
    @HostListener("keyup", ["$event"])
    @HostListener("keypress", ["$event"])
    @HostListener("blur", ["$event"])
    @HostListener("dateChange", ["$event"])
    transform(event: KeyboardEvent): void {
        if (event.key !== BACK_SPACE_KEYWORD) {
            let dateFormat = AppSettings.DATE_MASK_FORMAT;
            if (this.notCalenderFormat) {
                dateFormat = EXPIRY_DATE_FORMAT;
            }
            const maskedValue = this.maskPipe.transform(this.element.nativeElement.value, dateFormat);
            const maskedValueArray = maskedValue.split(SLASH_KEY);
            this.element.nativeElement.value = maskedValue;
            if (maskedValueArray.length === 3) {
                this.element.nativeElement.value = `${this.to2digit(maskedValueArray[0])}${SLASH_KEY}${this.to2digit(
                    maskedValueArray[1],
                )}${SLASH_KEY}${maskedValueArray[2]}`;
            }
        }
    }

    /**
     * This functionis responsiblke to add leading zero in date and month
     * @param maskedArrayValue Parameter in which we have to add leading zero, in this case its month and date
     */
    to2digit(maskedArrayValue: string): string {
        return ("00" + maskedArrayValue).slice(-2);
    }
    /**
     * @param event any type of event from template
     * @returns void
     * Preventing Character value and input length should not be more than configurable value
     * on keypress
     */
    @HostListener("keypress", ["$event"]) onKeyPress(event: KeyboardEvent): boolean | undefined {
        if (this.element.nativeElement.value.length === this.dateFormat.length || !event.key.match(this.allowedDigitRegex)) {
            return false;
        }
        return undefined;
    }
}
