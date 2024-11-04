import { NgModule } from "@angular/core";
import { MockComponent, MockDirective } from "@empowered/jest";

const MockMatMenu = MockComponent("mat-menu", { exportAs: "matMenu" }) as any;

const MockMatMenuItem = MockComponent("[mat-menu-item]", {
    exportAs: "matMenuItem",
    inputs: ["disabled", "disableRipple"],
}) as any;

const MockMatMenuTrigger = MockDirective("[mat-menu-trigger-for], [matMenuTriggerFor]", {
    exportAs: "matMenuTrigger",
    inputs: ["mat-menu-trigger-for", "matMenuTriggerFor", "matMenuTriggerData", "matMenuTriggerRestoreFocus"],
    outputs: ["menuClosed", "menuOpened"],
}) as any;

const MockMatMenuContent = MockDirective("ng-template[matMenuContent]") as any;

export const MockMatMenuModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MockMatMenu, MockMatMenuItem, MockMatMenuContent, MockMatMenuTrigger, MockMatMenuContent],
        exports: [MockMatMenu, MockMatMenuItem, MockMatMenuContent, MockMatMenuTrigger, MockMatMenuContent],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
