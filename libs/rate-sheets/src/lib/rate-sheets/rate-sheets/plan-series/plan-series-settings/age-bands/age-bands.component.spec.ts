import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AgeBandsComponent } from "./age-bands.component";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { mockSettingsDropdownComponentStore } from "@empowered/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { provideMockStore } from "@ngrx/store/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA, forwardRef } from "@angular/core";

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

describe("AgeBandsComponent", () => {
    let component: AgeBandsComponent;
    let fixture: ComponentFixture<AgeBandsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AgeBandsComponent, MockEmpoweredCheckboxListComponent],
            imports: [ReactiveFormsModule],
            providers: [
                FormBuilder,
                NGRXStore,
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownComponentStore,
                },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AgeBandsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onShow()", () => {
        it("should show", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should call onRevert()", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onRevert()", () => {
        it("should revert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should reset", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getAgeBandLabels()", () => {
        it("should combine AgeBand array into labels array", () => {
            const spy = jest.spyOn(component, "getAgeBandLabels");
            component.getAgeBandLabels([
                { minAge: 20, maxAge: 68 },
                { minAge: 18, maxAge: 68 },
            ]);
            expect(spy).toReturnWith(["18–68", "20–68"]);
        });
    });

    describe("getAgeBands()", () => {
        it("should split labels array into AgeBand array", () => {
            const spy = jest.spyOn(component, "getAgeBands");
            component.getAgeBands(["18–68"]);
            expect(spy).toReturnWith([{ minAge: 18, maxAge: 68 }]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
