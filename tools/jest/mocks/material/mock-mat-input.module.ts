import { NgModule } from "@angular/core";
import { MockComponent } from "@empowered/jest";

const MockMatInput = MockComponent(
    "input[matInput], textarea[matInput], select[matNativeControl], input[matNativeControl], textarea[matNativeControl",
    {
        exportAs: "matInput",
        inputs: ["errorStateMatcher", "readonly", "type"],
    }
) as any;

const MOCK_DECLARATIONS = [MockMatInput];

export const MockMatInputModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
