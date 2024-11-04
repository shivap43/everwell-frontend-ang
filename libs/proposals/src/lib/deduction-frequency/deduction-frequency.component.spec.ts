import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { Component, forwardRef, Input, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DeductionFrequencyComponent } from "./deduction-frequency.component";
import { NgxsModule } from "@ngxs/store";

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockSpinnerComponent {
    @Input() enableSpinner: boolean;
    @Input() backdrop: boolean;
}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockFormFieldComponent {}

@Component({
    selector: "mat-label",
    template: "",
})
class MockLabelComponent {}

@Component({
    selector: "mat-error",
    template: "",
})
class MockErrorComponent {}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockSelectComponent),
            multi: true,
        },
    ],
})
class MockSelectComponent implements ControlValueAccessor {
    onChange = () => {};
    onTouched = () => {};
    writeValue() {}
    registerOnChange() {}
    registerOnTouched() {}
}

@Component({
    selector: "mat-option",
    template: "",
})
class MockOptionComponent {
    @Input() value: string;
}

@Component({
    selector: "host-component",
    template: "<empowered-deduction-frequency [formControl]='formControl'></empowered-deduction-frequency>",
})
class TestHostComponent {
    @ViewChild(DeductionFrequencyComponent) deductionFrequencyComponent: DeductionFrequencyComponent;
    formControl = new FormControl(5);
}

describe("DeductionFrequencyComponent", () => {
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HttpClientTestingModule, NgxsModule.forRoot([])],
            declarations: [
                DeductionFrequencyComponent,
                MockSpinnerComponent,
                MockFormFieldComponent,
                MockLabelComponent,
                MockErrorComponent,
                MockSelectComponent,
                MockOptionComponent,
                TestHostComponent,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = fixture.componentInstance;
        fixture.detectChanges();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(testHostComponent.deductionFrequencyComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should select dropdown based on initial formControl value", () => {
            expect(testHostComponent.deductionFrequencyComponent.formControl.value).toStrictEqual(5);
        });

        it("should select dropdown based on patched formControl value", () => {
            testHostComponent.formControl.patchValue(8);
            expect(testHostComponent.deductionFrequencyComponent.formControl.value).toStrictEqual(8);
        });
    });

    describe("onDeductionFrequencyChange()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should emit a change event with the new value when a new item is selected", () => {
            const onChangeSpy = jest.spyOn(testHostComponent.deductionFrequencyComponent, "onChange");
            const onTouchedSpy = jest.spyOn(testHostComponent.deductionFrequencyComponent, "onTouched");

            testHostComponent.deductionFrequencyComponent.formControl.setValue(6);
            testHostComponent.deductionFrequencyComponent.onDeductionFrequencyChange(1);

            expect(onChangeSpy).toHaveBeenCalledWith(1);
            expect(onTouchedSpy).toHaveBeenCalled();

            expect(testHostComponent.formControl.value).toBe(1);
        });
    });
});
