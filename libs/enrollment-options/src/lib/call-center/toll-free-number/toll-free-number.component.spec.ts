import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { PhoneNumberFormatDirective } from "@empowered/ui";
import { NgxsModule } from "@ngxs/store";
import { TollFreeNumberComponent } from "./toll-free-number.component";
import { MaskApplierService, NgxMaskPipe, MaskService } from "ngx-mask";

@Component({
    selector: "empowered-host-component",
    template: "<empowered-toll-free-number [formControl]='formControl'></empowered-toll-free-number>",
})
class TestHostComponent {
    @ViewChild(TollFreeNumberComponent) tollFreeNumberComponent: TollFreeNumberComponent;
    formControl = new FormControl("111-22-9929");
}
describe("TollFreeNumberComponent", () => {
    let testHostComponent: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxsModule.forRoot()],
            declarations: [TollFreeNumberComponent, TestHostComponent, PhoneNumberFormatDirective],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [NgxMaskPipe, { provide: MaskService, useValue: {} }, { provide: MaskApplierService, useValue: {} }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = fixture.componentInstance;
        fixture.detectChanges();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(testHostComponent.tollFreeNumberComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(testHostComponent.tollFreeNumberComponent.formControl.value).toStrictEqual("111-22-9929");
        });

        it("should propagate values from the model to the view", () => {
            testHostComponent.formControl.setValue("343-45-2455");
            expect(testHostComponent.tollFreeNumberComponent.formControl.value).toStrictEqual("343-45-2455");
        });

        it("should propagate values from the view to the model", () => {
            testHostComponent.tollFreeNumberComponent.formControl.setValue("343-45-2455");
            expect(testHostComponent.formControl.value).toStrictEqual("343-45-2455");
        });

        it("should set disabled state", () => {
            testHostComponent.formControl.disable();
            expect(testHostComponent.tollFreeNumberComponent.formControl.disabled).toBeTruthy();
        });
    });
});
