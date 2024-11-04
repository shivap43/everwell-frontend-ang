import { Directive, Input, Output, EventEmitter, ElementRef, HostListener } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[scrollSpy]",
})
export class ScrollSpyDirective {
    @Input() spiedTags = [];
    @Output() sectionChange = new EventEmitter<string>();
    private currentSection: string;

    constructor(private readonly elementRef: ElementRef) {}

    @HostListener("scroll", ["$event"])
    onScroll(event: any): void {
        let currentSection: string;
        const children = this.elementRef.nativeElement.children;
        const scrollTop = event.target.scrollTop;
        const parentOffset = event.target.offsetTop;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < children.length; i++) {
            const element = children[i];
            if (this.spiedTags.some((spiedTag) => spiedTag === element.tagName) && element.offsetTop - parentOffset <= scrollTop) {
                currentSection = element.id;
            }
        }
        if (currentSection !== this.currentSection) {
            this.currentSection = currentSection;
            this.sectionChange.emit(this.currentSection);
        }
    }
}
