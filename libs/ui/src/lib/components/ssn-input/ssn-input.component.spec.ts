import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { take } from "rxjs/operators";
import { SsnFormatPipe } from "../../pipes";

import { SsnInputComponent } from "./ssn-input.component";
import { SSNVisibility } from "./ssn-visibility.enum";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@Component({
    selector: "empowered-host-component",
    template: "<empowered-ssn-input [formControl]='formControl' [regex]='mockRegex'></empowered-ssn-input>",
})
class TestHostComponent {
    @ViewChild(SsnInputComponent) ssnInputComponent: SsnInputComponent;
    formControl = new FormControl("111-22-9929");
    mockRegex = {
        SSN_SPLIT_FORMAT: "([dX]{3})([dX]{2})([dX]{4})",
    };
}
describe("SsnInputComponent", () => {
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, BrowserAnimationsModule],
            declarations: [SsnInputComponent, TestHostComponent, SsnFormatPipe],
            providers: [SsnFormatPipe],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = fixture.componentInstance;
        fixture.detectChanges();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(testHostComponent.ssnInputComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(testHostComponent.ssnInputComponent.formControl.value).toStrictEqual("111-22-9929");
        });

        it("should propagate values from the model to the view", () => {
            testHostComponent.formControl.setValue("343-45-2455");
            expect(testHostComponent.ssnInputComponent.formControl.value).toStrictEqual("343-45-2455");
        });

        it("should propagate values from the view to the model", () => {
            testHostComponent.ssnInputComponent.onValueChange("343-45-2455");
            expect(testHostComponent.formControl.value).toStrictEqual("343-45-2455");
        });

        it("should set disabled state", () => {
            testHostComponent.formControl.disable();
            expect(testHostComponent.ssnInputComponent.formControl.disabled).toBeTruthy();
        });
    });
    describe("onFocus()", () => {
        it("should unmask SSN", () => {
            testHostComponent.formControl.setValue("973-27-2766");
            testHostComponent.ssnInputComponent.onFocus();
            expect(testHostComponent.ssnInputComponent.formControl.value).toMatch(/973-27-2766/);
        });
    });

    describe("onBlur()", () => {
        it("should mask SSN", () => {
            testHostComponent.ssnInputComponent.showSSN$.pipe(take(1)).subscribe(() => {
                const nextSpy = jest.spyOn(testHostComponent.ssnInputComponent.showSSNSubject$, "next");
                expect(testHostComponent.ssnInputComponent.formControl.value).toMatch(/XXX-XX-2766/);
                expect(testHostComponent.ssnInputComponent.lastValue).toMatch(/973-27-2766/);
                expect(nextSpy).toBeCalledWith(false);
            });
            testHostComponent.formControl.setValue("973-27-2766");
            testHostComponent.ssnInputComponent.onBlur();
        });
    });

    describe("onFocus()", () => {
        it("should unmask SSN", () => {
            testHostComponent.ssnInputComponent.showSSN$.pipe(take(1)).subscribe(() => {
                const nextSpy = jest.spyOn(testHostComponent.ssnInputComponent.showSSNSubject$, "next");
                expect(testHostComponent.ssnInputComponent.formControl.value).toMatch(/973-27-2766/);
                expect(testHostComponent.ssnInputComponent.lastValue).toMatch(/973-27-2766/);
                expect(nextSpy).toBeCalledWith(true);
            });
            testHostComponent.formControl.setValue("973-27-2766");
            testHostComponent.ssnInputComponent.onFocus();
        });
    });

    describe("getMaskedSSN()", () => {
        it("should return the original value if SSN is set to be fully visible", () => {
            expect(testHostComponent.ssnInputComponent.getMaskedSSN("", SSNVisibility.FULLY_VISIBLE)).toStrictEqual("");
            expect(testHostComponent.ssnInputComponent.getMaskedSSN("973-27-2766", SSNVisibility.FULLY_VISIBLE)).toStrictEqual(
                "973-27-2766",
            );
            expect(testHostComponent.ssnInputComponent.getMaskedSSN("973-27-2766", SSNVisibility.FULLY_MASKED)).toStrictEqual(
                "XXX-XX-XXXX",
            );
            expect(testHostComponent.ssnInputComponent.getMaskedSSN("XXX-XX-2766", SSNVisibility.PARTIALLY_MASKED)).toStrictEqual(
                "XXX-XX-2766",
            );
        });
    });

    describe("onToggle()", () => {
        it("should toggle SSN visibility", () => {
            const nextSpy = jest.spyOn(testHostComponent.ssnInputComponent.showSSNSubject$, "next");
            testHostComponent.ssnInputComponent.onToggle();
            expect(nextSpy).toBeCalled();
        });
    });

    describe("setDisabledState()", () => {
        it("should set the disabled status on form control", () => {
            testHostComponent.ssnInputComponent.setDisabledState(true);
            expect(testHostComponent.ssnInputComponent.disabled).toEqual(true);
            expect(testHostComponent.ssnInputComponent.formControl.disabled).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(testHostComponent.ssnInputComponent["unsubscribe$"], "next");
            const complete = jest.spyOn(testHostComponent.ssnInputComponent["unsubscribe$"], "complete");
            testHostComponent.ssnInputComponent.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("registerOnValidatorChange", () => {
        it("should set onValidationChange to the provided function", () => {
            const mockFn = jest.fn();
            testHostComponent.ssnInputComponent.registerOnValidatorChange(mockFn);
            expect(testHostComponent.ssnInputComponent.onValidationChange).toBe(mockFn);
        });
    });

    describe("registerOnTouched()", () => {
        it("should set onTouched to the provided function", () => {
            const mockFn = jest.fn();
            testHostComponent.ssnInputComponent.registerOnTouched(mockFn);
            expect(testHostComponent.ssnInputComponent.onTouched).toBe(mockFn);
        });
    });
});
