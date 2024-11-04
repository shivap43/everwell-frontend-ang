import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatIcon = MockComponent("mat-icon", {
    exportAs: "matIcon",
    inputs: ["color", "fontIcon", "fontSet", "inline", "svgIcon"],
}) as any;

export const MockMatIconModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MockMatIcon],
        exports: [MockMatIcon],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
