import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
export class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}
