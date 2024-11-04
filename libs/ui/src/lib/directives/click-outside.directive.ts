import { Directive, ElementRef, Output, EventEmitter, HostListener } from "@angular/core";

@Directive({
    selector: "[empoweredClickOutside]",
})
export class ClickOutsideDirective {
    @Output()
    private empoweredClickOutside = new EventEmitter<MouseEvent>();

    constructor(private elementRef: ElementRef) {}

    @HostListener("document:click", ["$event", "$event.target"])
    private onClick(event: MouseEvent, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }

        const clickedInside = this.elementRef.nativeElement.contains(targetElement);
        if (!clickedInside) {
            this.empoweredClickOutside.emit(event);
        }
    }
}
