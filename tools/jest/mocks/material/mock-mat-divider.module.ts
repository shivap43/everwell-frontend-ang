import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatDivider = MockComponent("mat-divider", {
    inputs: ["inset", "vertical"],
}) as any;

const MOCK_DECLARATIONS = [MockMatDivider];

export const MockMatDividerModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
