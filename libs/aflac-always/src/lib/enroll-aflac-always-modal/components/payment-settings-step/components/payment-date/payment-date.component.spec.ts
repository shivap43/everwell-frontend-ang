import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PaymentDateComponent } from "./payment-date.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { provideMockStore } from "@ngrx/store/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockMatDialog, mockStore } from "@empowered/testing";
import { FormControl, Validators } from "@angular/forms";

describe("PaymentDateComponent", () => {
    let component: PaymentDateComponent;
    let fixture: ComponentFixture<PaymentDateComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaymentDateComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Store, useValue: mockStore }, { provide: MatDialog, useValue: mockMatDialog }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentDateComponent);
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
            component.control = new FormControl(null, [Validators.required, Validators.min(1), Validators.max(28)]);
            component.control.setValue(30);
            const result1 = component.validate();
            expect(result1).toStrictEqual({ invalid: true });
            component.control.setValue(20);
            const result2 = component.validate();
            expect(result2).toBeNull();
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

    describe("registerOnChange", () => {
        it("should set onChange to the provided function", () => {
            const mockFn = jest.fn();
            component.registerOnChange(mockFn);
            expect(component.onChange).toBe(mockFn);
        });
    });
});
