import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { StaticUtilService } from "@empowered/ngxs-store";
import { mockRateSheetsComponentStoreService, mockSettingsDropdownComponentStore, mockStaticUtilService } from "@empowered/testing";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { MoreSettingsComponent } from "./more-settings.component";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { Observable, of } from "rxjs";
import { RateSheetMoreSettings } from "../../rate-sheets-component-store/rate-sheets-component-store.model";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, forwardRef } from "@angular/core";

@Component({
    selector: "empowered-zip-code-input",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockEmpoweredZipCodeInputComponent),
            multi: true,
        },
    ],
})
class MockEmpoweredZipCodeInputComponent implements ControlValueAccessor {
    @Input() validateOnStateChange;
    @Input() formControl;
    @Input() stateControlValue;
    @Input() readonly;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Directive({
    selector: "[empoweredNumberValidation]",
})
class MockNumberValidationDirective {
    @Input() allowDecimals: boolean;
    @Input() allowDashes: boolean;
}

describe("MoreSettingsComponent", () => {
    let component: MoreSettingsComponent;
    let fixture: ComponentFixture<MoreSettingsComponent>;
    let rateSheetsComponentStoreService: RateSheetsComponentStoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MoreSettingsComponent, MockEmpoweredZipCodeInputComponent, MockNumberValidationDirective],
            imports: [ReactiveFormsModule],
            providers: [
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                FormBuilder,
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownComponentStore,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MoreSettingsComponent);
        component = fixture.componentInstance;
        rateSheetsComponentStoreService = TestBed.inject(RateSheetsComponentStoreService);
        component.defaultMoreSettings$ = of({}) as Observable<RateSheetMoreSettings>;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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

    describe("onApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
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
            const spyService = jest.spyOn(rateSheetsComponentStoreService, "setMoreSettings");
            const spyFormReset = jest.spyOn(component.form, "reset");
            const spyOnReset = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spyService).toBeCalledTimes(1);
            expect(spyFormReset).toBeCalledTimes(1);
            expect(spyOnReset).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyComplete = jest.spyOn(component["unsubscriber$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
