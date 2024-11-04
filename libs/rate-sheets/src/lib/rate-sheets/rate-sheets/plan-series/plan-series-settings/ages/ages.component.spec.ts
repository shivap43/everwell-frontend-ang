import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AgesComponent } from "./ages.component";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { mockSettingsDropdownComponentStore } from "@empowered/testing";
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA, forwardRef } from "@angular/core";

@Component({
    // eslint-disable-next-line
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent implements ControlValueAccessor {
    @Input() placeholder!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

describe("AgesComponent", () => {
    let component: AgesComponent;
    let fixture: ComponentFixture<AgesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AgesComponent, MockMatSelectComponent],
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
        fixture = TestBed.createComponent(AgesComponent);
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

    describe("getNumberRange()", () => {
        it("should return array of numbers in specified interval", () => {
            const spy = jest.spyOn(component, "getNumberRange");
            component.getNumberRange(1, 5);
            expect(spy).toReturnWith([1, 2, 3, 4, 5]);
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
