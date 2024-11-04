import { Directive } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[mat-flat-button]|[mat-button]",
})
export class MockMatButtonDirective {}
