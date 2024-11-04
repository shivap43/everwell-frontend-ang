import { Directive, ElementRef, OnInit, OnDestroy } from "@angular/core";

@Directive({
    selector: "[empoweredPreventPasteOnHtmlElements]",
})
export class PreventPasteOnHtmlElementsDirective implements OnInit, OnDestroy {
    constructor(private elRef: ElementRef) {}
    ngOnInit(): void {
        this.elRef.nativeElement.addEventListener("paste", this.onPasteEvent);
    }

    ngOnDestroy(): void {
        this.elRef.nativeElement.removeEventListener("paste", this.onPasteEvent);
    }

    onPasteEvent(event: ClipboardEvent): boolean {
        event.preventDefault();
        return false;
    }
}
