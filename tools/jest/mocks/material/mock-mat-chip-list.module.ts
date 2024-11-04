import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatChipList = MockComponent("mat-chip-list", {
    exportAs: "matChipList",
    inputs: ["ariaOrientation", "compareWith", "errorStateMatcher", "multiple", "selectable"],
    outputs: ["change"],
}) as any;

const MockMatChip = MockComponent("mat-basic-chip, [mat-basic-chip], mat-chip, [mat-basic-chip]", {
    exportAs: "matChip",
    inputs: ["color", "disableRipple", "disabled", "removable", "selectable", "selected", "value"],
    outputs: ["destroyed", "removed", "selectionChange"],
}) as any;

const MOCK_DECLARATIONS = [MockMatChipList, MockMatChip];

export const MockMatChipListModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
