import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[hasAnyPermission]",
})
export class MockHasAnyPermissionDirective {
    @Input("hasAnyPermission") permission!: string;
}
