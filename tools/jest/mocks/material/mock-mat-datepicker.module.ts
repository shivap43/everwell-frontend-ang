import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatDatepicker = MockComponent("mat-datepicker", {
    exportAs: "matDatepicker",
    inputs: [
        "calendarHeaderComponent",
        "color",
        "dateClass",
        "disabled",
        "opened",
        "panelClass",
        "startAt",
        "startView",
        "touchUi",
    ],
    outputs: ["closedStream", "monthSelected", "openedStream", "yearSelected"],
}) as any;

const MockMatDatepickerToggle = MockComponent("mat-datepicker-toggle", {
    inputs: ["datepicker", "disableRipple", "disabled", "for"],
}) as any;

const MOCK_DECLARATIONS = [MockMatDatepicker, MockMatDatepickerToggle];

export const MockMatDatepickerModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
