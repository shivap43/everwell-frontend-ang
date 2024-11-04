import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { TobaccoStatusComponent } from "./tobacco-status.component";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { mockLanguageService, mockSettingsDropdownStore } from "@empowered/testing";
import { SettingsDropdownComponentStore, SettingsDropdownContent } from "@empowered/ui";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, forwardRef } from "@angular/core";
import { LanguageService } from "@empowered/language";
@Component({
    selector: "empowered-checkbox-list",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockEmpoweredCheckboxListComponent),
            multi: true,
        },
    ],
})
class MockEmpoweredCheckboxListComponent implements ControlValueAccessor {
    @Input() validateOnStateChange;
    @Input() formControl;
    @Input() stateControlValue;
    @Input() readonly;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}
describe("TobaccoStatusComponent", () => {
    let component: TobaccoStatusComponent;
    let fixture: ComponentFixture<TobaccoStatusComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TobaccoStatusComponent, MockEmpoweredCheckboxListComponent],
            imports: [ReactiveFormsModule, FormsModule],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: {} }),
                SettingsDropdownContent,
                FormBuilder,
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownStore as SettingsDropdownComponentStore,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TobaccoStatusComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onApply", () => {
        it("should set required error correctly", () => {
            component.form.controls.tobaccoStatuses.setValue([]);
            component.onApply();
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.tobaccoStatuses.errors?.required).toBe(true);
        });
        it("should set null value for error", () => {
            component.form.controls.tobaccoStatuses.setValue(["nonTobaccoUser"]);
            component.onApply();
            expect(component.form.valid).toBe(true);
            expect(component.form.controls.tobaccoStatuses.errors).toBeNull();
        });
    });
    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert Form", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalled();
        });
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalled();
        });
    });

    describe("onReset()", () => {
        it("should emit onReset", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy).toBeCalled();
        });
    });
});
