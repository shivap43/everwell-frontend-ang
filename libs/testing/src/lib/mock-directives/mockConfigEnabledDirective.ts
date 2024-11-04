import { Directive, Input } from "@angular/core";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[configEnabled]",
})
export class MockConfigEnableDirective {
    @Input("configEnabled") configKey!: string;
}
