import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatFormField = MockComponent("mat-form-field", {
    exportAs: "matFormField",
    inputs: ["appearance", "color", "floatLabel", "hideRequiredMarker", "hintLabel"],
}) as any;

const MockMatHint = MockComponent("mat-hint", {
    inputs: ["align", "id"],
}) as any;

const MockMatError = MockComponent("mat-error", {
    inputs: ["id"],
}) as any;

const MOCK_DECLARATIONS = [MockMatFormField, MockMatHint, MockMatError];

export const MockMatFormFieldModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
