import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatCheckbox = MockComponent("mat-checkbox", {
    exportAs: "matCheckbox",
    inputs: [
        "ariaLabel",
        "ariaLabelledby",
        "checked",
        "color",
        "disableRipple",
        "disabled",
        "id",
        "indeterminate",
        "labelPosition",
        "name",
        "required",
        "value",
    ],
    outputs: ["change", "indeterminateChange"],
}) as any;

const MOCK_DECLARATIONS = [MockMatCheckbox];

export const MockMatCheckboxModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
