import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PaymentAcknowledgementCheckboxComponent } from "./payment-acknowledgement-checkbox.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { provideMockStore } from "@ngrx/store/testing";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockMatDialog, mockStore } from "@empowered/testing";
import { FormControl, Validators } from "@angular/forms";

describe("PaymentAcknowledgementCheckboxComponent", () => {
    let component: PaymentAcknowledgementCheckboxComponent;
    let fixture: ComponentFixture<PaymentAcknowledgementCheckboxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaymentAcknowledgementCheckboxComponent],
            imports: [HttpClientTestingModule],
            providers: [{ provide: Store, useValue: mockStore }, { provide: MatDialog, useValue: mockMatDialog }, provideMockStore({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentAcknowledgementCheckboxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.registerOnChange((onChang: string) => {});
        component.registerOnValidatorChange(() => {});
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("validate()", () => {
        it("should return validation errors", () => {
            component.control = new FormControl("", [Validators.required]);
            component.control.setValue("");
            const result1 = component.validate();
            expect(result1).toStrictEqual({ invalid: true });
            component.control.setValue(true);
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
            component.onInput(true);
            expect(spy).toBeCalledWith(true);
        });
    });

    describe("writeValue()", () => {
        it("should set value", () => {
            component.writeValue("true");
            expect(component.value).toBeTruthy();
        });
    });

    describe("onTouched()", () => {
        it("should emit touched value", () => {
            const spy = jest.spyOn(component.inputChange, "emit");
            component.onTouched(true);
            expect(spy).toBeCalledWith(true);
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
