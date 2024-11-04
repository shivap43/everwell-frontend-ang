import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatSelect = MockComponent("mat-select", {
    exportAs: "matSelect",
    inputs: [
        "ariaLabel",
        "ariaLabelledby",
        "compareWith",
        "disableOptionCatering",
        "disableRipple",
        "disabled",
        "errorStateMatcher",
        "id",
        "multiple",
        "panelClass",
        "placeholder",
        "required",
        "sortComparator",
        "value",
    ],
    outputs: ["openedChange", "selectionChange"],
}) as any;

const MockMatOption = MockComponent("mat-option", {}) as any;

const MOCK_DECLARATIONS = [MockMatSelect, MockMatOption];

export const MockMatSelectModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
