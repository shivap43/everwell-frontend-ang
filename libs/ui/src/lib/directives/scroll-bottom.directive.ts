import { Directive, ElementRef, HostListener } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[scrollBottom]",
    exportAs: "scrollBottom",
})
export class ScrollBottomDirective {
    disableBtn = false;
    top: number;
    offSetHeight: number;
    scrollHeight: number;
    constructor(private readonly elementRef: ElementRef) {}

    /**
     * Changes the disableBtn value when the scroll reaches to the bottom
     * @return: none
     */
    @HostListener("scroll") onScroll(): void {
        this.top = this.elementRef.nativeElement.scrollTop;
        this.offSetHeight = this.elementRef.nativeElement.offsetHeight;
        this.scrollHeight = this.elementRef.nativeElement.scrollHeight;
        if (this.top > this.scrollHeight - this.offSetHeight - 1) {
            this.disableBtn = true;
        }
    }
}
