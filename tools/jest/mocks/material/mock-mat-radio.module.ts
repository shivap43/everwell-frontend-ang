import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatRadioGroup = MockComponent("mat-radio-group", {
    exportAs: "matRadioGroup",
    inputs: ["color", "disabled", "labelPosition", "name", "required", "selected", "value"],
    outputs: ["change"],
}) as any;

const MockMatRadioButton = MockComponent("mat-radio-button", {
    exportAs: "matRadioButton",
    inputs: [
        "ariaDescribedby",
        "ariaLabel",
        "ariaLabelledBy",
        "checked",
        "color",
        "disableRipple",
        "disabled",
        "id",
        "labelPosition",
        "name",
        "required",
        "value",
    ],
    outputs: ["change"],
}) as any;

const MOCK_DECLARATIONS = [MockMatRadioGroup, MockMatRadioButton];

export const MockMatRadioModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
