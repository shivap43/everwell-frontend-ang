import { Directive, ElementRef, HostListener, Input } from "@angular/core";
import { NgxMaskPipe } from "ngx-mask";

const BACKSPACE = "Backspace";
const DELETE = "Delete";

const PASTE_EVENT = "paste";
const KEYUP_EVENT = "keyup";
const INPUT_EVENT = "input";

const HOST_LISTENER_ARGS = ["$event"];
const INSERT_FROM_PASTE = "insertFromPaste";

const PHONE_NUMBER_FORMAT = "000-000-0000";
const PHONE_NUMBER_FORMAT_WITH_DIALING_CODE = "0-000-000-0000";
const US_DIALING_CODE = "1";

@Directive({
    selector: "[empoweredPhoneNumberFormat]",
})
export class PhoneNumberFormatDirective {
    @Input() includeDialingCode = false;
    pasteText = "";

    constructor(private readonly element: ElementRef, private readonly maskPipe: NgxMaskPipe) {}

    /**
     * Formats input in the specified phone number format as the user types.
     *
     * @param event keyboard; describes a user interaction with the keyboard
     */
    @HostListener(KEYUP_EVENT, HOST_LISTENER_ARGS)
    transform(event: KeyboardEvent): void {
        if (event.key !== BACKSPACE && event.key !== DELETE) {
            this.formatAndUpdateValue(this.element.nativeElement.value);
        }
    }

    /**
     * When an input event is triggered on paste, this listener formats the
     * copied text and updates the native element.
     *
     * @param event represents an event notifying the user of editable content changes
     */
    @HostListener(INPUT_EVENT, HOST_LISTENER_ARGS)
    // TODO - event's type should be InputEvent
    // but using it causes a build failure. Need to install @types/dom-inputevent to fix.
    onInput(event: KeyboardEvent & { inputType: string }): void {
        if (event.inputType === INSERT_FROM_PASTE) {
            this.formatAndUpdateValue(this.pasteText);
        }
    }

    /**
     * Stores copied text for the native element to be updated on the input event.
     *
     * @param event provides information related to modification of the clipboard, that is cut, copy, and paste events
     */
    @HostListener(PASTE_EVENT, HOST_LISTENER_ARGS)
    onPaste(event: ClipboardEvent): void {
        this.pasteText = event.clipboardData.getData("Text");
    }

    /**
     * Formats input value and updates native element.
     *
     * @param value value to be formatted
     */
    formatAndUpdateValue(value: string): void {
        const phoneFormat =
            this.includeDialingCode && value.startsWith(US_DIALING_CODE) ? PHONE_NUMBER_FORMAT_WITH_DIALING_CODE : PHONE_NUMBER_FORMAT;
        this.element.nativeElement.value = this.maskPipe.transform(value, phoneFormat);
    }
}
