import { NgControl } from "@angular/forms";
import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[disableControl]",
})
export class DisableControlDirective implements OnChanges {
    @Input() disableControl: boolean;
    constructor(private ngControl: NgControl) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["disableControl"]) {
            const action = this.disableControl ? "disable" : "enable";
            this.ngControl.control?.[action]();
        }
    }
}
