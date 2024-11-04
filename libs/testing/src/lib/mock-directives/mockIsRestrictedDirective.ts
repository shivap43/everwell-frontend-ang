import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[isRestricted]",
})
export class MockIsRestrictedDirective {
    @Input() isRestricted!: any;
}
