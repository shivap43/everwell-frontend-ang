import { Directive, HostListener } from "@angular/core";
import { NgControl } from "@angular/forms";
/**
 * Angular custom directive to trim leading and trailing space from form control input text.
 */
@Directive({
    selector: "[empoweredTrimSpace]",
})
export class TrimSpaceDirective {
    constructor(private readonly ngControl: NgControl) {}

    /**
     * Host-listener method which triggers on
     *  1. Keyboard event keyup
     *  2. Clipboard event paste
     *  3. On blur event
     * Check if the form control value has leading or trailing spaces and remove those spaces.
     * @param event Keyboard event or Clipboard event
     */
    @HostListener("keyup", ["$event"])
    @HostListener("paste", ["$event"])
    @HostListener("blur", ["$event"])
    trimValue(event: KeyboardEvent | ClipboardEvent): void {
        if (event.type === "paste" || this.ngControl.value !== this.ngControl.value.trim()) {
            this.ngControl.control.setValue(this.ngControl.value.trim());
        }
    }
}
