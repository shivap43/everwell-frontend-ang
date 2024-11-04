import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatDrawer = MockComponent("mat-drawer", {
    exportAs: "matDrawer",
    inputs: ["autoFocus", "disableClose", "mode", "opened", "position"],
    outputs: ["closedStart", "onPositionChanged", "openedChange", "openedStart"],
}) as any;

const MockMatDrawerContainer = MockComponent("mat-drawer-container", {
    exportAs: "matDrawerContainer",
    inputs: ["autosize", "hasBackdrop"],
    outputs: ["backdropClick"],
}) as any;

const MockMatDrawerContent = MockComponent("mat-drawer-content") as any;

const MockMatSidenav = MockComponent("mat-sidenav", {
    exportAs: "matSidenav",
    inputs: [
        "autoFocus",
        "disableClose",
        "fixedBottomGap",
        "fixedInViewport",
        "fixedTopGap",
        "mode",
        "opened",
        "position",
    ],
    outputs: ["closedStart", "onPositionChanged", "openedChange", "openedStart"],
}) as any;

const MockMatSidenavContainer = MockComponent("mat-sidenav-container", {
    exportAs: "matSidenavContainer",
    inputs: ["autosize", "hasBackdrop"],
    outputs: ["backdropClick"],
}) as any;

const MockMatSidenavContent = MockComponent("mat-sidenav-content") as any;

export const MockMatSidenavModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [
            MockMatDrawer,
            MockMatDrawerContainer,
            MockMatDrawerContent,
            MockMatSidenav,
            MockMatSidenavContainer,
            MockMatSidenavContent,
        ],
        exports: [
            MockMatDrawer,
            MockMatDrawerContainer,
            MockMatDrawerContent,
            MockMatSidenav,
            MockMatSidenavContainer,
            MockMatSidenavContent,
        ],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
