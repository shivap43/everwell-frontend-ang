import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[hasPermission]",
})
export class MockHasPermissionDirective {
    @Input("hasPermission") permission!: string;
}
