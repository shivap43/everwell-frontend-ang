import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CheckboxListComponent } from "./checkbox-list.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewChild } from "@angular/core";
import { MockMatCheckboxComponent, MockMatSelectionListComponent } from "@empowered/testing";

@Component({
    selector: "empowered-host-component",
    template: `<empowered-checkbox-list [formControl]="childControl" [options]="options" [showSelectAll]="showSelectAll">
        <mat-error></mat-error>
    </empowered-checkbox-list>`,
})
class TestHostComponent {
    @ViewChild(CheckboxListComponent) checkboxListComponent: CheckboxListComponent;
    childControl = new FormControl(["first"]);
    options = [
        { value: "first", text: "First" },
        { value: "second", text: "Second" },
        { value: "third", text: "Third" },
    ];
    showSelectAll = true;
}

describe("CheckboxListComponent", () => {
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [CheckboxListComponent, TestHostComponent, MockMatCheckboxComponent, MockMatSelectionListComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(testHostComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(testHostComponent.checkboxListComponent.control.value).toStrictEqual(["first"]);
        });

        it("should propagate values from the model to the view", () => {
            testHostComponent.childControl.setValue(["first", "second"]);
            expect(testHostComponent.checkboxListComponent.control.value).toStrictEqual(["first", "second"]);
        });

        it("should propagate values from the view to the model", () => {
            testHostComponent.checkboxListComponent.control.setValue(["first", "second"]);
            expect(testHostComponent.childControl.value).toStrictEqual(["first", "second"]);
        });

        it("should propagate errors from the model to the view", () => {
            testHostComponent.childControl.setErrors({ invalid: true });
            expect(testHostComponent.checkboxListComponent.control.errors).toStrictEqual({ invalid: true });
            expect(testHostComponent.checkboxListComponent.selectAll.errors).toStrictEqual({ invalid: true });
        });

        it("should set disabled state", () => {
            testHostComponent.childControl.disable();
            expect(testHostComponent.checkboxListComponent.disabled).toBeTruthy();
        });

        it("should enable form control", () => {
            testHostComponent.childControl.enable();
            expect(testHostComponent.checkboxListComponent.control.disabled).toBeFalsy();
        });

        it("should set 'Select all' when all values are selected", () => {
            testHostComponent.childControl.setValue(["first", "second", "third"]);
            expect(testHostComponent.checkboxListComponent.selectAll.value).toBeTruthy();
        });

        it("should deselect 'Select all' when none of the values are selected", () => {
            testHostComponent.childControl.setValue([]);
            expect(testHostComponent.checkboxListComponent.selectAll.value).toBeFalsy();
        });

        it("should select all options when 'Select all' is checked", () => {
            testHostComponent.checkboxListComponent.selectAll.setValue(true);
            expect(testHostComponent.checkboxListComponent.control.value).toStrictEqual(["first", "second", "third"]);
        });

        it("should deselect all options when 'Select all' is unchecked", () => {
            testHostComponent.checkboxListComponent.selectAll.setValue(false);
            expect(testHostComponent.checkboxListComponent.control.value).toStrictEqual([]);
        });
    });

    describe("registerOnTouched()", () => {
        it("should set onTouched to the provided function", () => {
            const mockFn = jest.fn();
            testHostComponent.checkboxListComponent.registerOnTouched(mockFn);
            expect(testHostComponent.checkboxListComponent.onTouched).toBe(mockFn);
        });
    });
});
