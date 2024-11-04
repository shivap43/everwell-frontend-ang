import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { Subscription } from "rxjs";
import { ChangeAddressComponent } from "./change-address.component";

@Directive({
    selector: "[empoweredNumberValidation]",
})
class MockNumberValidationDirective {
    @Input() allowDecimals: boolean;
    @Input() allowDashes: boolean;
}

@Directive({
    selector: "[empoweredPhoneNumberFormat]",
})
class MockPhoneNumberFormatDirective {
    @Input() includeDialingCode = false;
}

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

describe("ChangeAddressComponent", () => {
    let component: ChangeAddressComponent;
    let fixture: ComponentFixture<ChangeAddressComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangeAddressComponent, MockNumberValidationDirective, MockPhoneNumberFormatDirective, MockMonSpinnerComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
            imports: [ReactiveFormsModule, NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeAddressComponent);
        component = fixture.componentInstance;
    });

    describe("ChangeAddressComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("createFormControl()", () => {
            beforeEach(() => {
                component.changeAddressForm = null;
                component.validationRegex = {
                    ADDRESS: "sample_address_validation_regex",
                };
                component.createFormControl();
            });
            it("should initialize the changeAddressForm", () => {
                expect(component.changeAddressForm).toBeInstanceOf(FormGroup);
            });

            describe("formControl", () => {
                it("should return formControl", () => {
                    expect(component.formControl).toBe(component.changeAddressForm.controls);
                });
            });
        });
    });

    describe("closeModal()", () => {
        it("should close address-verify modal", () => {
            component.addressResp = null;
            component.closeModal();
            expect(component.addressResp).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
