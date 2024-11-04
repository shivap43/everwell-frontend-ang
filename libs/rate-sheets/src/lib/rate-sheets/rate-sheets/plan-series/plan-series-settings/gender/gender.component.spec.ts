import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GenderComponent } from "./gender.component";
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { DropDownPortalComponent, SettingsDropdownComponentStore } from "@empowered/ui";
import { mockSettingsDropdownComponentStore } from "@empowered/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Pipe, PipeTransform, forwardRef } from "@angular/core";
import { TitleCasePipe } from "@angular/common";

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}

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

describe("GenderComponent", () => {
    let component: GenderComponent;
    let fixture: ComponentFixture<GenderComponent>;
    const portalRef = {
        hide: () => {},
    } as DropDownPortalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GenderComponent, MockEmpoweredCheckboxListComponent],
            providers: [
                FormBuilder,
                NGRXStore,
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownComponentStore,
                },
                {
                    provide: TitleCasePipe,
                    useClass: MockTitleCasePipe,
                },
                provideMockStore({}),
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GenderComponent);
        component = fixture.componentInstance;
        component.portalRef = portalRef;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onApply", () => {
        it("should set required error correctly", () => {
            component.form.controls.genders.setValue([]);
            component.onApply();
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.genders.errors?.required).toBe(true);
        });

        it("should set null value for error", () => {
            component.form.controls.genders.setValue(["Male"]);
            component.onApply();
            expect(component.form.valid).toBe(true);
            expect(component.form.controls.genders.errors).toBeNull();
        });

        it("should update and validate FormGroup", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
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

        it("should close dropdown when portalRef exists", () => {
            const spy = jest.spyOn(portalRef, "hide");
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
