import { Component, Input, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
export class MockMatSelectComponent implements ControlValueAccessor {
    @Input() placeholder!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}
