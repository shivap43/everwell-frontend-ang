import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatButton = MockComponent(
    "button[mat-button], button[mat-raised-button], button[mat-icon-button], button[mat-flat-button],\n             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],\n             button[mat-flat-button]",
    {
        exportAs: "matButton",
        inputs: ["disabled", "disableRipple", "color"],
    }
) as any;

const MockMatAnchor = MockComponent(
    "a[mat-button], a[mat-raised-button], a[mat-icon-button], a[mat-fab], a[mat-mini-fab], a[mat-stroked-button], a[mat-flat-button]",
    {
        exportAs: "matButton, matAnchor",
        inputs: ["disabled", "disableRipple", "color"],
    }
) as any;

export const MockMatButtonModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MockMatButton, MockMatAnchor],
        exports: [MockMatButton, MockMatAnchor],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
