import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EsignatureComponent } from "./esignature.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { mockMatDialog, mockStore } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { FormControl, Validators } from "@angular/forms";
const ALPHA_NUMERIC_UNDERSCORE_REGEX = "^[A-Za-z]+[A-Za-z'\\ \\-]*[A-Za-z]+$";
describe("EsignatureComponent", () => {
    let component: EsignatureComponent;
    let fixture: ComponentFixture<EsignatureComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EsignatureComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Store, useValue: mockStore }, { provide: MatDialog, useValue: mockMatDialog }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EsignatureComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.registerOnChange((onChange: string) => {});
        component.registerOnTouched(() => {});
        component.registerOnValidatorChange(() => {});
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("validate()", () => {
        it("should return validation errors", () => {
            component.control = new FormControl(null, [
                Validators.required,
                Validators.maxLength(200),
                Validators.minLength(3),
                Validators.pattern(ALPHA_NUMERIC_UNDERSCORE_REGEX),
            ]);
            component.control.setValue("as");
            const result1 = component.validate();
            expect(result1).toStrictEqual({ invalid: true });

            component.control.setValue("1sdd");
            const result2 = component.validate();
            expect(result2).toStrictEqual({ invalid: true });

            component.control.setValue("test @Test");
            const result3 = component.validate();
            expect(result3).toStrictEqual({ invalid: true });

            component.control.setValue("test test ");
            const result4 = component.validate();
            expect(result4).toStrictEqual({ invalid: true });

            component.control.setValue("test test");
            const result5 = component.validate();
            expect(result5).toBeNull();
        });
    });
    describe("setDisabledState()", () => {
        it("should set disabled", () => {
            component.setDisabledState(true);
            expect(component.disabled).toBe(true);
        });
    });
    describe("onInput()", () => {
        it("should emit entered value", () => {
            const spy = jest.spyOn(component.inputChange, "emit");
            component.onInput("value");
            expect(spy).toBeCalledWith("value");
        });
    });

    describe("writeValue()", () => {
        it("should set value", () => {
            component.writeValue("true");
            expect(component.value).toBeTruthy();
        });
    });

    describe("onValueChange()", () => {
        it("should call all three method with value", () => {
            const spy = jest.spyOn(component, "onChange");
            const spy1 = jest.spyOn(component, "onTouched");
            const spy2 = jest.spyOn(component, "onValidationChange");
            component.onValueChange("value");
            expect(spy).toBeCalledWith("value");
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("registerOnTouched()", () => {
        it("should set onTouched to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnTouched(mockFn);
            expect(component.onTouched).toBe(mockFn);
        });
    });

    describe("registerOnValidatorChange", () => {
        it("should set onValidationChange to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnValidatorChange(mockFn);
            expect(component.onValidationChange).toBe(mockFn);
        });
    });
});
