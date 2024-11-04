import { Component, Input } from "@angular/core";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
export class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}
