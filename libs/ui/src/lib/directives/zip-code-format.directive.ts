import { Directive, ElementRef, HostListener } from "@angular/core";
import { NgxMaskPipe } from "ngx-mask";

@Directive({
    selector: "[empoweredZipCodeFormat]",
})
export class ZipCodeFormatDirective {
    constructor(private readonly element: ElementRef, private readonly maskPipe: NgxMaskPipe) {}
    /**
     *
     * This function is used to append "-" between the zip code and extension if length of the zip is greater then five
     * @param event keyboard event
     * @returns void
     */
    @HostListener("input", ["$event"])
    transform(event: KeyboardEvent): void {
        const BACKSPACE_KEY = "Backspace";
        const DELETE_KEY = "Delete";
        const ZIP_FORMAT = "00000-0000";
        if (event.key !== BACKSPACE_KEY && event.key !== DELETE_KEY) {
            this.element.nativeElement.value = this.maskPipe.transform(this.element.nativeElement.value, ZIP_FORMAT);
        }
    }
}
