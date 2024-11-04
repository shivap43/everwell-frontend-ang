import { Directive, ElementRef, HostListener } from "@angular/core";
import { NgxMaskPipe } from "ngx-mask";
/**
 * This directive is used to handle benefit amount in benefit dollars
 */
@Directive({
    selector: "[empoweredBenefitAmountFormat]",
})
export class BenefitAmountDirective {
    constructor(private readonly element: ElementRef, private readonly maskPipe: NgxMaskPipe) {}
    /**
     * This method is used to mask benefit amount based on format
     * @param event is used to capture keyboard event
     * @returns void
     */
    @HostListener("keyup", ["$event"]) transform(event: KeyboardEvent): void {
        const backSpaceKeyConst = "Backspace";
        const deleteKeyConst = "Delete";
        const amountFormat = "0000000000.00";
        if (event.key !== backSpaceKeyConst && event.key !== deleteKeyConst) {
            this.element.nativeElement.value = this.maskPipe.transform(this.element.nativeElement.value, amountFormat);
        }
    }
}
