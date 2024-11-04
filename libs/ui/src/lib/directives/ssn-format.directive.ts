import { Directive, ElementRef, HostListener } from "@angular/core";
import { NgxMaskPipe } from "ngx-mask";

@Directive({
    selector: "[empoweredSsnFormat]",
})
export class SsnFormatDirective {
    constructor(private readonly element: ElementRef, private readonly maskPipe: NgxMaskPipe) {}

    @HostListener("keydown", ["$event"]) transform(event: KeyboardEvent): void {
        const backSpaceKeyConst = "Backspace";
        const deleteKeyConst = "Delete";
        const ssnFormat = "000-00-0000";
        if (event.key !== backSpaceKeyConst && event.key !== deleteKeyConst) {
            this.element.nativeElement.value = this.maskPipe.transform(this.element.nativeElement.value, ssnFormat);
        }
    }
}
