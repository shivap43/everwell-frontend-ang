import { Directive, ElementRef, AfterViewInit } from "@angular/core";
/**
 * focusInitial directive is used to focus the element initially
 * Example of Usage:
 * <button focusInitial></button>
 */
@Directive({
    selector: "[empoweredFocusInitial]",
})
export class FocusInitialDirective implements AfterViewInit {
    constructor(private readonly element: ElementRef) {}

    /**
     * Used to focus the element that you apply directive
     */
    ngAfterViewInit(): void {
        setTimeout(() => this.element.nativeElement.focus(), 0);
    }
}
