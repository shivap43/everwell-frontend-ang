import { Component, Input } from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";

@Component({
    selector: "empowered-checkbox-list",
    template: "",
})
export class MockCheckboxListComponent implements ControlValueAccessor {
    @Input() options!: any[];
    @Input() showSelectAll!: boolean;
    @Input() value!: string;

    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}
