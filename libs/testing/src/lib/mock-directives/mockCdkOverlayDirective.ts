import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[cdkOverlayOrigin]",
})
export class MockCdkOverlayDirective {
    @Input("cdkOverlayOrigin") text!: string;
}
