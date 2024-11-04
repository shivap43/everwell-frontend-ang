import { Component, Input } from "@angular/core";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mat-radio-button",
    template: "",
})
export class MockMatRadioButtonComponent {
    @Input() value!: string;
}
