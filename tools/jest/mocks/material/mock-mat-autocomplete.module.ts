import { NgModule } from "@angular/core";
import { MockComponent, MockDirective } from "@empowered/jest";

const MockMatAutocomplete = MockComponent("mat-autocomplete", {
    exportAs: "matAutocomplete",
    inputs: ["autoActiveFirstOption", "classList", "disableRipple", "displayWith", "panelWidth"],
    outputs: ["closed", "opened", "optionSelected"],
}) as any;

const MockMatAutocompleteTrigger = MockDirective("input[matAutocomplete], textarea[matAutocomplete]", {
    inputs: ["autocomplete", "autocompleteDisabled", "connectedTo", "position"],
}) as any;

const MOCK_DECLARATIONS = [MockMatAutocomplete, MockMatAutocompleteTrigger];

export const MockMatAutocompleteModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
